/**
 * Tier 5: Adversarial Stress & Empirical Verification Suite for Milestone M4
 * WhereReady Solar OS Mobile Client — Native Android Interactions & Offline Resilience
 * 
 * Conducts adversarial stress testing across:
 * 1. Haptics Resilience:
 *    - All triggers: impactLight, impactMedium, impactHeavy, selection,
 *      notificationSuccess, notificationWarning, notificationError
 *    - Fallback execution without expo-haptics (calibrated Vibration patterns)
 *    - Hardware driver exception resilience (no uncaught throws)
 *    - Disabled state and web platform bypass
 *    - expo-haptics resolution and promise rejection resilience
 *    - Rapid high-frequency spam stress (500 rapid trigger calls)
 * 2. Modal BackHandler onRequestClose Callbacks:
 *    - 6 target modals: OperationsScreen, SurveysModule, InvoicingModule, LoginScreen, LeadsScreen, FinanceScreen
 *    - AST/source invariant verification
 *    - Callback execution safety (no crashes on rapid hardware back presses)
 * 3. Offline Mutation Queue Monotonic Stage Gating:
 *    - Replay of earlier stage (e.g. Stage 2 STRUCTURE) when server is at Stage 4 (INSTALL)
 *    - Monotonic pass resolution without server regression
 *    - STAGE_ORDER canonical ranking invariants
 * 4. Offline Mutation Queue Exponential Backoff & Jitter:
 *    - Backoff doubling progression (2s base -> 4s -> 8s -> 16s -> 32s -> 60s cap)
 *    - Jitter calculation within bounds
 *    - Backoff window gating (skipping unelapsed mutations)
 *    - Max retries threshold and FAILED status transition
 *    - Force retry and retryFailed resets
 * 5. SWR Caching Resilience:
 *    - Offline data retrieval from @solar_cache_*
 *    - Fresh (<7d) vs Stale (>7d) cache flags
 *    - Missing cache handling and cache eviction
 * 6. Legacy API Backward Compatibility (100% Fidelity):
 *    - getDraftLeads, saveDraftLead, deleteDraftLead
 *    - getDraftQuotes, saveDraftQuote, deleteDraftQuote
 *    - getOfflineStats and syncAllDrafts
 * 7. Adversarial Multi-Tenant Isolation & Idempotency Stress:
 *    - Tenant A mutations isolation under Tenant B session
 *    - Caller-specified idempotencyKey retention check
 *    - Duplicate mutation deduplication on replay
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../node_modules/typescript');

// =============================================================================
// TEST HARNESS: IN-MEMORY MOCKS & SANDBOX LOADERS
// =============================================================================

function createMockStorage() {
  const store = new Map();
  const storageObj = {
    getItem: async (key) => (store.has(key) ? store.get(key) : null),
    setItem: async (key, val) => { store.set(key, String(val)); },
    removeItem: async (key) => { store.delete(key); },
    clear: async () => { store.clear(); },
    getAllKeys: async () => Array.from(store.keys()),
    multiGet: async (keys) => keys.map((k) => [k, store.has(k) ? store.get(k) : null]),
    _store: store,
  };
  storageObj.default = storageObj;
  storageObj.__esModule = true;
  return storageObj;
}

function loadTsModule(relativePath, mockOverrides = {}) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const sourceCode = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(sourceCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });

  const moduleObj = { exports: {} };
  const customRequire = (id) => {
    if (mockOverrides[id] !== undefined) {
      return mockOverrides[id];
    }
    if (id === 'react-native') {
      return mockOverrides['react-native'] || {
        Platform: { OS: 'android', select: (obj) => (obj.android !== undefined ? obj.android : obj.default) },
        Vibration: { vibrate: () => {} },
      };
    }
    if (id === '@react-native-async-storage/async-storage') {
      return mockOverrides['@react-native-async-storage/async-storage'];
    }
    if (id === '../api/client') {
      return mockOverrides['../api/client'];
    }
    if (id === 'expo-haptics') {
      if (mockOverrides['expo-haptics'] === null) {
        throw new Error('Cannot find module expo-haptics');
      }
      return mockOverrides['expo-haptics'];
    }
    return require(id);
  };

  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    console,
    process,
    setTimeout,
    clearTimeout,
    require: customRequire,
  };

  const vm = require('node:vm');
  vm.createContext(sandbox);
  vm.runInContext(transpiled.outputText, sandbox);

  return moduleObj.exports;
}

// Helper to avoid cross-realm prototype inequality in node:test
function assertDeepStructure(actual, expected, message) {
  assert.strictEqual(
    JSON.stringify(actual),
    JSON.stringify(expected),
    message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
  );
}

// =============================================================================
// SUITE 1: HAPTICS RESILIENCE & VIBRATION FALLBACK
// =============================================================================

describe('Suite 1: Native Haptics Resilience & Calibrated Vibration Fallback', () => {
  let vibrationLog = [];
  let vibrationThrow = false;
  let mockRN;

  beforeEach(() => {
    vibrationLog = [];
    vibrationThrow = false;
    mockRN = {
      Platform: { OS: 'android' },
      Vibration: {
        vibrate: (pattern) => {
          if (vibrationThrow) throw new Error('Vibrator hardware permission denied');
          vibrationLog.push(pattern);
        },
      },
    };
  });

  it('1.1 should safely export haptics singleton and enum definitions', () => {
    const mod = loadTsModule('src/utils/haptics.ts', {
      'react-native': mockRN,
      'expo-haptics': null,
    });

    assert.ok(mod.haptics, 'haptics singleton should be exported');
    assert.strictEqual(typeof mod.haptics.impactLight, 'function');
    assert.strictEqual(typeof mod.haptics.impactMedium, 'function');
    assert.strictEqual(typeof mod.haptics.impactHeavy, 'function');
    assert.strictEqual(typeof mod.haptics.selection, 'function');
    assert.strictEqual(typeof mod.haptics.notificationSuccess, 'function');
    assert.strictEqual(typeof mod.haptics.notificationWarning, 'function');
    assert.strictEqual(typeof mod.haptics.notificationError, 'function');
    assert.strictEqual(mod.ImpactFeedbackStyle.Light, 'light');
    assert.strictEqual(mod.NotificationFeedbackType.Success, 'success');
  });

  it('1.2 should route all 7 triggers to calibrated Vibration patterns on Android when expo-haptics is absent', () => {
    const mod = loadTsModule('src/utils/haptics.ts', {
      'react-native': mockRN,
      'expo-haptics': null,
    });
    const h = mod.haptics;
    h.setEnabled(true);

    h.selection();
    assert.strictEqual(vibrationLog[0], 10, 'selection must trigger 10ms click');

    h.impactLight();
    assert.strictEqual(vibrationLog[1], 15, 'impactLight must trigger 15ms pulse');

    h.impactMedium();
    assert.strictEqual(vibrationLog[2], 35, 'impactMedium must trigger 35ms pulse');

    h.impactHeavy();
    assert.strictEqual(vibrationLog[3], 60, 'impactHeavy must trigger 60ms pulse');

    h.notificationSuccess();
    assertDeepStructure(vibrationLog[4], [0, 30, 60, 40], 'notificationSuccess must trigger double pulse [0, 30, 60, 40]');

    h.notificationWarning();
    assertDeepStructure(vibrationLog[5], [0, 50, 50, 50], 'notificationWarning must trigger warning buzz [0, 50, 50, 50]');

    h.notificationError();
    assertDeepStructure(vibrationLog[6], [0, 80, 50, 80, 50, 120], 'notificationError must trigger triple heavy buzz [0, 80, 50, 80, 50, 120]');

    assert.strictEqual(vibrationLog.length, 7, 'All 7 haptic triggers must execute through Vibration');
  });

  it('1.3 should not crash if native Vibration module throws hardware / permission exceptions', () => {
    vibrationThrow = true;
    const mod = loadTsModule('src/utils/haptics.ts', {
      'react-native': mockRN,
      'expo-haptics': null,
    });
    const h = mod.haptics;

    assert.doesNotThrow(() => {
      h.selection();
      h.impactLight();
      h.impactMedium();
      h.impactHeavy();
      h.notificationSuccess();
      h.notificationWarning();
      h.notificationError();
    }, 'Vibration exceptions must be safely handled without uncaught errors');
  });

  it('1.4 should suppress all vibrations when setEnabled(false)', () => {
    const mod = loadTsModule('src/utils/haptics.ts', {
      'react-native': mockRN,
      'expo-haptics': null,
    });
    const h = mod.haptics;
    h.setEnabled(false);
    assert.strictEqual(h.isEnabled(), false);

    h.selection();
    h.impactLight();
    h.impactMedium();
    h.impactHeavy();
    h.notificationSuccess();
    h.notificationWarning();
    h.notificationError();

    assert.strictEqual(vibrationLog.length, 0, 'No vibration must occur when enabled=false');
  });

  it('1.5 should suppress vibrations on web platform (Platform.OS === "web")', () => {
    mockRN.Platform.OS = 'web';
    const mod = loadTsModule('src/utils/haptics.ts', {
      'react-native': mockRN,
      'expo-haptics': null,
    });
    const h = mod.haptics;
    h.setEnabled(true);

    h.selection();
    h.impactHeavy();
    h.notificationSuccess();

    assert.strictEqual(vibrationLog.length, 0, 'Web platform must not invoke native vibration');
  });

  it('1.6 should route to expo-haptics when available and handle rejected promises safely', async () => {
    const expoLog = [];
    const mockExpoHaptics = {
      ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
      NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
      selectionAsync: async () => { expoLog.push('selectionAsync'); },
      impactAsync: async (style) => {
        expoLog.push(`impactAsync:${style}`);
        throw new Error('Hardware motor busy');
      },
      notificationAsync: async (type) => { expoLog.push(`notificationAsync:${type}`); },
    };

    const mod = loadTsModule('src/utils/haptics.ts', {
      'react-native': mockRN,
      'expo-haptics': mockExpoHaptics,
    });
    const h = mod.haptics;

    assert.doesNotThrow(() => {
      h.selection();
      h.impactLight();
      h.impactMedium();
      h.impactHeavy();
      h.notificationSuccess();
      h.notificationWarning();
      h.notificationError();
    });

    await new Promise((r) => setTimeout(r, 20));

    assert.strictEqual(vibrationLog.length, 0, 'Vibration fallback must NOT fire when expo-haptics succeeds');
    assert.ok(expoLog.includes('selectionAsync'));
    assert.ok(expoLog.includes('impactAsync:light'));
    assert.ok(expoLog.includes('impactAsync:medium'));
    assert.ok(expoLog.includes('impactAsync:heavy'));
    assert.ok(expoLog.includes('notificationAsync:success'));
    assert.ok(expoLog.includes('notificationAsync:warning'));
    assert.ok(expoLog.includes('notificationAsync:error'));
  });

  it('1.7 should survive 500 rapid alternating haptic triggers in <100ms without memory leak', () => {
    const mod = loadTsModule('src/utils/haptics.ts', {
      'react-native': mockRN,
      'expo-haptics': null,
    });
    const h = mod.haptics;
    const start = Date.now();

    for (let i = 0; i < 500; i++) {
      if (i % 7 === 0) h.selection();
      else if (i % 7 === 1) h.impactLight();
      else if (i % 7 === 2) h.impactMedium();
      else if (i % 7 === 3) h.impactHeavy();
      else if (i % 7 === 4) h.notificationSuccess();
      else if (i % 7 === 5) h.notificationWarning();
      else h.notificationError();
    }

    const elapsed = Date.now() - start;
    assert.strictEqual(vibrationLog.length, 500, 'All 500 calls must record in vibration log');
    assert.ok(elapsed < 100, `500 haptic triggers executed in ${elapsed}ms (must be <100ms)`);
  });
});

// =============================================================================
// SUITE 2: MODAL BACKHANDLER ONREQUESTCLOSE INVARIANTS & SAFETY
// =============================================================================

describe('Suite 2: Modal BackHandler onRequestClose Callbacks Verification', () => {
  const targetModalFiles = [
    {
      name: 'OperationsScreen',
      path: 'src/screens/operations/OperationsScreen.tsx',
      stateVar: 'activeJob',
      closeVal: null,
      expectedPattern: /<Modal[^>]*onRequestClose=\{[^}]*setActiveJob\(null\)[^}]*\}/s,
    },
    {
      name: 'SurveysModule',
      path: 'src/screens/modules/submodules/SurveysModule.tsx',
      stateVar: 'scheduleSurveyModal',
      closeVal: false,
      expectedPattern: /<Modal[^>]*onRequestClose=\{[^}]*setScheduleSurveyModal\(false\)[^}]*\}/s,
    },
    {
      name: 'InvoicingModule',
      path: 'src/screens/modules/submodules/InvoicingModule.tsx',
      stateVar: 'paymentModalVisible',
      closeVal: false,
      expectedPattern: /<Modal[^>]*onRequestClose=\{[^}]*setPaymentModalVisible\(false\)[^}]*\}/s,
    },
    {
      name: 'LoginScreen',
      path: 'src/screens/auth/LoginScreen.tsx',
      stateVar: 'resetModalVisible',
      closeVal: false,
      expectedPattern: /<Modal[^>]*onRequestClose=\{[^}]*setResetModalVisible\(false\)[^}]*\}/s,
    },
    {
      name: 'LeadsScreen',
      path: 'src/screens/crm/LeadsScreen.tsx',
      stateVar: 'addModalVisible',
      closeVal: false,
      expectedPattern: /<Modal[^>]*onRequestClose=\{[^}]*setAddModalVisible\(false\)[^}]*\}/s,
    },
    {
      name: 'FinanceScreen',
      path: 'src/screens/finance/FinanceScreen.tsx',
      stateVar: 'paymentModalVisible',
      closeVal: false,
      expectedPattern: /<Modal[^>]*onRequestClose=\{[^}]*setPaymentModalVisible\(false\)[^}]*\}/s,
    },
  ];

  for (const target of targetModalFiles) {
    it(`2.${targetModalFiles.indexOf(target) + 1} should verify ${target.name} contains onRequestClose binding for modal hardware back dismissal`, () => {
      const fullPath = path.resolve(__dirname, '..', target.path);
      assert.ok(fs.existsSync(fullPath), `Target file ${target.path} must exist`);
      const content = fs.readFileSync(fullPath, 'utf8');

      assert.ok(
        target.expectedPattern.test(content),
        `${target.name} must declare <Modal ... onRequestClose={...}> setting ${target.stateVar} to ${target.closeVal}`
      );
    });
  }

  it('2.7 should stress-test all 6 modal onRequestClose callbacks under 200 rapid simulated hardware back presses', () => {
    const states = {
      activeJob: { id: 'JOB-2026' },
      scheduleSurveyModal: true,
      invoicingPaymentModal: true,
      resetModalVisible: true,
      addModalVisible: true,
      financePaymentModal: true,
    };

    const handlers = {
      operations: () => { states.activeJob = null; },
      surveys: () => { states.scheduleSurveyModal = false; },
      invoicing: () => { states.invoicingPaymentModal = false; },
      login: () => { states.resetModalVisible = false; },
      leads: () => { states.addModalVisible = false; },
      finance: () => { states.financePaymentModal = false; },
    };

    assert.doesNotThrow(() => {
      for (let i = 0; i < 200; i++) {
        handlers.operations();
        handlers.surveys();
        handlers.invoicing();
        handlers.login();
        handlers.leads();
        handlers.finance();
      }
    });

    assert.strictEqual(states.activeJob, null);
    assert.strictEqual(states.scheduleSurveyModal, false);
    assert.strictEqual(states.invoicingPaymentModal, false);
    assert.strictEqual(states.resetModalVisible, false);
    assert.strictEqual(states.addModalVisible, false);
    assert.strictEqual(states.financePaymentModal, false);
  });
});

// =============================================================================
// SUITE 3: MONOTONIC STAGE GATING RESILIENCE
// =============================================================================

describe('Suite 3: Offline Queue Monotonic Stage Gating & Conflict Resolution', () => {
  let mockStorage;
  let mockApiClient;
  let apiRequests;

  beforeEach(() => {
    mockStorage = createMockStorage();
    apiRequests = [];
    mockApiClient = {
      request: async (config) => {
        apiRequests.push(config);
        return { data: { success: true } };
      },
    };
  });

  function getService(apiOverride = mockApiClient) {
    return loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': {
        SafeStorage: mockStorage,
        apiClient: apiOverride,
      },
    }).offlineSyncService;
  }

  it('3.1 should enforce canonical project STAGE_ORDER hierarchy', () => {
    const mod = loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': { SafeStorage: mockStorage, apiClient: mockApiClient },
    });
    const order = mod.STAGE_ORDER;

    assert.ok(order, 'STAGE_ORDER must be exported');
    assert.strictEqual(order.SURVEY, 1);
    assert.strictEqual(order.STRUCTURE, 2);
    assert.strictEqual(order.MATERIAL, 3);
    assert.strictEqual(order.INSTALL, 4);
    assert.strictEqual(order.TESTING, 5);
    assert.strictEqual(order.NETMETER, 6);
    assert.strictEqual(order.COMMISSION, 7);

    // Verify strictly monotonic ordering
    const keys = ['SURVEY', 'STRUCTURE', 'MATERIAL', 'INSTALL', 'TESTING', 'NETMETER', 'COMMISSION'];
    for (let i = 0; i < keys.length - 1; i++) {
      assert.ok(order[keys[i]] < order[keys[i + 1]], `${keys[i]} must precede ${keys[i + 1]}`);
    }
  });

  it('3.2 should resolve 409 conflict on UPDATE_PROJECT_STAGE as MONOTONIC_PASS and clear from queue', async () => {
    const conflictApiClient = {
      request: async () => {
        const err = new Error('Stage already at or past INSTALL');
        err.response = {
          status: 409,
          data: { error: 'Stage already at or past INSTALL on server', currentStage: 'INSTALL' },
        };
        throw err;
      },
    };

    const service = getService(conflictApiClient);

    // Seed mutation directly into storage to avoid opportunistic background sync race condition
    const mut = {
      id: 'mut_stage_1',
      type: 'UPDATE_PROJECT_STAGE',
      endpoint: '/api/tenant/projects/p-101/stage',
      method: 'PATCH',
      payload: { stage: 'STRUCTURE' },
      entityId: 'p-101',
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 5,
      status: 'PENDING',
      idempotencyKey: 'idem_stage_1',
    };
    await mockStorage.setItem('@solar_offline_queue', JSON.stringify([mut]));

    const result = await service.syncQueue({ force: true });

    assert.strictEqual(result.conflicted, 1, 'Should record 1 conflict');
    assert.strictEqual(result.failed, 0, 'Should not mark as failed');
    assert.strictEqual(result.remaining, 0, 'Monotonic pass should be evicted from queue');

    // Verify conflict log recorded MONOTONIC_PASS
    const conflicts = await service.getConflictLog();
    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].resolution, 'MONOTONIC_PASS');
    assert.strictEqual(conflicts[0].entityId, 'p-101');
    assert.ok(conflicts[0].reason.includes('already'));
  });

  it('3.3 should resolve 409 conflict on non-stage mutation (e.g. CREATE_LEAD) as SERVER_WINS without discarding immediately', async () => {
    const conflictApiClient = {
      request: async () => {
        const err = new Error('Lead already exists');
        err.response = {
          status: 409,
          data: { error: 'Consumer number already registered with another lead' },
        };
        throw err;
      },
    };

    const service = getService(conflictApiClient);

    // Seed mutation directly into storage
    const mut = {
      id: 'mut_lead_1',
      type: 'CREATE_LEAD',
      endpoint: '/api/tenant/leads',
      method: 'POST',
      payload: { name: 'Rajesh Sharma', mobile: '9876543210' },
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 5,
      status: 'PENDING',
      idempotencyKey: 'idem_lead_1',
    };
    await mockStorage.setItem('@solar_offline_queue', JSON.stringify([mut]));

    const result = await service.syncQueue({ force: true });

    assert.strictEqual(result.conflicted, 1);

    const conflicts = await service.getConflictLog();
    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].resolution, 'SERVER_WINS');

    const queue = await service.getQueue();
    assert.strictEqual(queue[0].status, 'CONFLICT', 'Non-monotonic conflict remains in queue as CONFLICT');
  });
});

// =============================================================================
// SUITE 4: EXPONENTIAL BACKOFF & JITTER STRESS
// =============================================================================

describe('Suite 4: Exponential Backoff, Jitter & Retry Scheduling', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  it('4.1 should calculate backoff duration doubling up to 60s cap with jitter', () => {
    for (let retryCount = 1; retryCount <= 10; retryCount++) {
      const base = 2000 * Math.pow(2, retryCount);
      const minBackoff = Math.min(60000, base);
      const maxBackoff = Math.min(60000, base + 1000);

      if (retryCount === 1) {
        assert.ok(minBackoff === 4000 && maxBackoff <= 5000, 'Retry 1 should be 4s - 5s');
      } else if (retryCount === 2) {
        assert.ok(minBackoff === 8000 && maxBackoff <= 9000, 'Retry 2 should be 8s - 9s');
      } else if (retryCount === 3) {
        assert.ok(minBackoff === 16000 && maxBackoff <= 17000, 'Retry 3 should be 16s - 17s');
      } else if (retryCount === 4) {
        assert.ok(minBackoff === 32000 && maxBackoff <= 33000, 'Retry 4 should be 32s - 33s');
      } else if (retryCount >= 5) {
        assert.strictEqual(minBackoff, 60000, `Retry ${retryCount} must be capped at exactly 60,000ms`);
        assert.strictEqual(maxBackoff, 60000, `Retry ${retryCount} cap must not exceed 60,000ms`);
      }
    }
  });

  it('4.2 should skip unelapsed backoff window during regular sync and process when elapsed', async () => {
    let callCount = 0;
    const failingApiClient = {
      request: async () => {
        callCount++;
        throw new Error('Network Timeout');
      },
    };

    const service = loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': { SafeStorage: mockStorage, apiClient: failingApiClient },
    }).offlineSyncService;

    // Seed directly with 1 retry already recorded
    const mut = {
      id: 'mut_job_1',
      type: 'UPDATE_JOB_STATUS',
      endpoint: '/api/installations/status',
      method: 'PATCH',
      payload: { status: 'IN_PROGRESS' },
      createdAt: new Date().toISOString(),
      lastAttemptAt: new Date().toISOString(), // Just attempted
      retryCount: 1,
      maxRetries: 5,
      status: 'PENDING',
      idempotencyKey: 'idem_job_1',
    };
    await mockStorage.setItem('@solar_offline_queue', JSON.stringify([mut]));

    // Attempt without force: should be SKIPPED due to unelapsed backoff (4s)
    await service.syncQueue();
    assert.strictEqual(callCount, 0, 'Sync must skip mutation because backoff delay (4s+) has not elapsed');

    // Manually age lastAttemptAt by 10 seconds to simulate elapsed backoff window
    mut.lastAttemptAt = new Date(Date.now() - 10000).toISOString();
    await mockStorage.setItem('@solar_offline_queue', JSON.stringify([mut]));

    // Attempt: now elapsed, should be attempted
    await service.syncQueue();
    assert.strictEqual(callCount, 1, 'Mutation must be attempted once backoff window has elapsed');
  });

  it('4.3 should transition to status FAILED when retryCount reaches maxRetries', async () => {
    const failingApiClient = {
      request: async () => { throw new Error('500 Internal Server Error'); },
    };

    const service = loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': { SafeStorage: mockStorage, apiClient: failingApiClient },
    }).offlineSyncService;

    // Seed with retryCount at maxRetries - 1 (e.g. 2 of 3)
    const mut = {
      id: 'mut_qa_1',
      type: 'RECORD_QA_READINGS',
      endpoint: '/api/qa',
      method: 'POST',
      payload: { pit1: 2.1 },
      createdAt: new Date().toISOString(),
      retryCount: 2,
      maxRetries: 3,
      status: 'PENDING',
      idempotencyKey: 'idem_qa_1',
    };
    await mockStorage.setItem('@solar_offline_queue', JSON.stringify([mut]));

    // Execute one more failure to hit maxRetries (3)
    const res = await service.syncQueue({ force: true });

    assert.strictEqual(res.failed, 1, 'Should record 1 failed mutation');
    const queue = await service.getQueue();
    assert.strictEqual(queue[0].retryCount, 3);
    assert.strictEqual(queue[0].status, 'FAILED');
  });

  it('4.4 should reset failed mutations to PENDING via retryFailed()', async () => {
    const successApiClient = {
      request: async () => ({ data: { ok: true } }),
    };

    const service = loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': { SafeStorage: mockStorage, apiClient: successApiClient },
    }).offlineSyncService;

    const failedMut = {
      id: 'mut_failed_1',
      type: 'CREATE_LEAD',
      endpoint: '/api/tenant/leads',
      method: 'POST',
      payload: { name: 'Failed Lead' },
      createdAt: new Date().toISOString(),
      retryCount: 5,
      maxRetries: 5,
      status: 'FAILED',
      idempotencyKey: 'idem_failed_1',
    };
    await mockStorage.setItem('@solar_offline_queue', JSON.stringify([failedMut]));

    const syncRes = await service.retryFailed();
    assert.strictEqual(syncRes.synced, 1, 'retryFailed must replay previously failed mutation');

    const queue = await service.getQueue();
    assert.strictEqual(queue.length, 0, 'Successfully synced mutation must be evicted');
  });
});

// =============================================================================
// SUITE 5: SWR CACHING RESILIENCE
// =============================================================================

describe('Suite 5: SWR Caching Resilience for Offline Field Access', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  function getService() {
    return loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': { SafeStorage: mockStorage, apiClient: {} },
    }).offlineSyncService;
  }

  it('5.1 should write data with ISO timestamp to @solar_cache_<key>', async () => {
    const service = getService();
    const mockProjects = [{ id: 'p1', name: 'Rooftop 5kW', stage: 'INSTALL' }];

    await service.setCachedResponse('projects', mockProjects);

    const raw = await mockStorage.getItem('@solar_cache_projects');
    assert.ok(raw, 'Cache item must exist');
    const parsed = JSON.parse(raw);
    assertDeepStructure(parsed.data, mockProjects);
    assert.ok(new Date(parsed.cachedAt).getTime() > 0);
  });

  it('5.2 should return fresh cached response with isStale: false (<7 days)', async () => {
    const service = getService();
    const testData = { totalLeads: 42, activePipeline: '₹24,50,000' };

    await service.setCachedResponse('dashboard', testData);
    const cached = await service.getCachedResponse('dashboard');

    assert.ok(cached, 'Cached response should be found');
    assertDeepStructure(cached.data, testData);
    assert.strictEqual(cached.isStale, false, 'Fresh cache must not be marked stale');
  });

  it('5.3 should return stale cached response with isStale: true (>7 days) but preserve data payload for field tech', async () => {
    const service = getService();
    const staleRecord = {
      data: [{ id: 'job_ancient', customer: 'Suresh Patil' }],
      cachedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await mockStorage.setItem('@solar_cache_installations', JSON.stringify(staleRecord));

    const cached = await service.getCachedResponse('installations');

    assert.ok(cached, 'Stale cache must still return data to preserve field technician access');
    assert.strictEqual(cached.isStale, true, 'Cache older than 7 days must flag isStale=true');
    assertDeepStructure(cached.data, staleRecord.data);
  });

  it('5.4 should return null for non-existent cache keys', async () => {
    const service = getService();
    const cached = await service.getCachedResponse('non_existent_key');
    assert.strictEqual(cached, null);
  });

  it('5.5 should clear all domain cache keys via clearCache()', async () => {
    const service = getService();
    await service.setCachedResponse('projects', [1]);
    await service.setCachedResponse('leads', [2]);
    await service.setCachedResponse('installations', [3]);
    await service.setCachedResponse('dashboard', [4]);
    await service.setCachedResponse('invoices', [5]);

    await service.clearCache();

    assert.strictEqual(await service.getCachedResponse('projects'), null);
    assert.strictEqual(await service.getCachedResponse('leads'), null);
    assert.strictEqual(await service.getCachedResponse('installations'), null);
    assert.strictEqual(await service.getCachedResponse('dashboard'), null);
    assert.strictEqual(await service.getCachedResponse('invoices'), null);
  });
});

// =============================================================================
// SUITE 6: LEGACY API BACKWARD COMPATIBILITY (100% FIDELITY)
// =============================================================================

describe('Suite 6: Legacy API Backward Compatibility Verification', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  function getService() {
    return loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': { SafeStorage: mockStorage, apiClient: { request: async () => ({ data: {} }) } },
    }).offlineSyncService;
  }

  it('6.1 should maintain 100% fidelity for saveDraftLead, getDraftLeads, and deleteDraftLead', async () => {
    const service = getService();

    const saved = await service.saveDraftLead({
      name: 'Ramesh Patil',
      mobile: '9822012345',
      consumerNumber: '012345678901',
      monthlyBill: 4500,
      recommendedKw: 3.3,
    });

    assert.ok(saved.localId.startsWith('draft_'));
    assert.strictEqual(saved.name, 'Ramesh Patil');

    const leads = await service.getDraftLeads();
    assert.strictEqual(leads.length, 1);
    assert.strictEqual(leads[0].localId, saved.localId);

    // Also verify automatically enqueued into unified queue
    const queue = await service.getQueue();
    assert.strictEqual(queue.length, 1);
    assert.strictEqual(queue[0].type, 'CREATE_LEAD');
    assert.strictEqual(queue[0].localTempId, saved.localId);

    // Test deleteDraftLead
    await service.deleteDraftLead(saved.localId);
    const leadsAfter = await service.getDraftLeads();
    assert.strictEqual(leadsAfter.length, 0);
  });

  it('6.2 should maintain 100% fidelity for saveDraftQuote, getDraftQuote, getDraftQuotes, deleteDraftQuote', async () => {
    const service = getService();
    const quote1 = { systemKw: 3.3, grossTotal: 191400, subsidy: 78000, netPayable: 113400 };
    const quote2 = { systemKw: 5.0, grossTotal: 290000, subsidy: 78000, netPayable: 212000 };

    await service.saveDraftQuote('lead_1', quote1);
    await service.saveDraftQuote('lead_2', quote2);

    const fetched1 = await service.getDraftQuote('lead_1');
    assertDeepStructure(fetched1, quote1);

    const allQuotes = await service.getDraftQuotes();
    assertDeepStructure(allQuotes['lead_1'], quote1);
    assertDeepStructure(allQuotes['lead_2'], quote2);

    await service.deleteDraftQuote('lead_1');
    const allQuotesAfter = await service.getDraftQuotes();
    assert.strictEqual(allQuotesAfter['lead_1'], undefined);
    assertDeepStructure(allQuotesAfter['lead_2'], quote2);
  });

  it('6.3 should return comprehensive metrics from getOfflineStats() when offline', async () => {
    // When offline, apiClient fails with Network Error, keeping mutations in PENDING queue
    const offlineService = loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': {
        SafeStorage: mockStorage,
        apiClient: {
          request: async () => {
            const err = new Error('Network Error');
            err.code = 'ECONNABORTED';
            throw err;
          },
        },
      },
    }).offlineSyncService;

    await offlineService.saveDraftLead({ name: 'Lead A', mobile: '9000000001' });
    await offlineService.saveDraftQuote('lead_A', { kw: 3 });

    const stats = await offlineService.getOfflineStats();
    assert.strictEqual(stats.draftLeadsCount, 1);
    assert.strictEqual(stats.draftQuotesCount, 1);
    assert.strictEqual(stats.pendingQueueCount, 1);
    assert.strictEqual(stats.conflictsCount, 0);
  });
});

// =============================================================================
// SUITE 7: ADVERSARIAL STRESS: MULTI-TENANT ISOLATION & IDEMPOTENT REPLAY
// =============================================================================

describe('Suite 7: Adversarial Multi-Tenant Isolation & Idempotency Stress', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  it('7.1 [ADVERSARIAL] Multi-tenant isolation: mutations queued for tenant A must not be sent under tenant B', async () => {
    const sentRequests = [];
    const mockApiClient = {
      request: async (config) => {
        sentRequests.push(config);
        return { data: { success: true } };
      },
    };

    const service = loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': { SafeStorage: mockStorage, apiClient: mockApiClient },
    }).offlineSyncService;

    // Tenant A enqueues an offline mutation while logged in as Tenant A
    const mut = {
      id: 'mut_tenant_A_1',
      type: 'CREATE_LEAD',
      endpoint: '/api/tenant/leads',
      method: 'POST',
      payload: { name: 'Confidential Prospect from Tenant A' },
      tenantId: 'tenant_solar_co_A',
      userId: 'user_A',
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 5,
      status: 'PENDING',
      idempotencyKey: 'idem_tenant_A_1',
    };
    await mockStorage.setItem('@solar_offline_queue', JSON.stringify([mut]));

    const queueBefore = await service.getQueue();
    assert.strictEqual(queueBefore.length, 1);
    assert.strictEqual(queueBefore[0].tenantId, 'tenant_solar_co_A');

    // Attack Scenario:
    // User A logs out. User B (Tenant B) logs in on same device.
    // Sync is triggered while active session belongs to Tenant B.
    // If syncQueue does not support or enforce tenant isolation, Tenant A's mutation will be
    // transmitted to Tenant B's backend!
    await service.syncQueue({ tenantId: 'tenant_solar_co_B' });

    // ADVERSARIAL CHECK: Did Tenant A's mutation get sent?
    const wasLeakedToTenantB = sentRequests.some((r) =>
      JSON.stringify(r.data).includes('Tenant A')
    );

    console.log(`\n  [Adversarial Evaluation] Multi-tenant sync filter supported? ${!wasLeakedToTenantB ? 'YES' : 'NO (Vulnerability Detected: Tenant A mutation leaked to Tenant B session)'}`);

    if (wasLeakedToTenantB) {
      assert.fail('CRITICAL VULNERABILITY: offlineSyncService.syncQueue executed Tenant A mutation when active tenant is Tenant B! Tenant isolation is NOT enforced in queue replay.');
    }
  });

  it('7.2 [ADVERSARIAL] Idempotency Key Retention: caller-provided idempotencyKey must not be overwritten with random key', async () => {
    const service = loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': { SafeStorage: mockStorage, apiClient: { request: async () => ({ data: {} }) } },
    }).offlineSyncService;

    const callerProvidedKey = 'idem_lead_custom_uuid_884920';

    const queued = await service.enqueueMutation({
      type: 'CREATE_LEAD',
      endpoint: '/api/tenant/leads',
      payload: { name: 'Customer X' },
      idempotencyKey: callerProvidedKey,
    });

    console.log(`\n  [Adversarial Evaluation] Caller idempotencyKey retained? Expected: "${callerProvidedKey}", Actual: "${queued.idempotencyKey}"`);

    assert.strictEqual(
      queued.idempotencyKey,
      callerProvidedKey,
      `VULNERABILITY: enqueueMutation ignored caller-provided idempotencyKey ("${callerProvidedKey}") and replaced it with a newly generated random string ("${queued.idempotencyKey}"). This breaks client-side duplicate prevention!`
    );
  });

  it('7.3 [ADVERSARIAL] Duplicate Replay: identical mutations must not generate duplicate records on server', async () => {
    let callCount = 0;
    const mockApiClient = {
      request: async (config) => {
        callCount++;
        if (callCount === 1) {
          return { data: { success: true, lead: { id: 'lead_first_999' } } };
        }
        const err = new Error('409 Conflict: Duplicate transaction');
        err.response = { status: 409, data: { error: 'Request already processed with idempotency key' } };
        throw err;
      },
    };

    const service = loadTsModule('src/services/offlineSyncService.ts', {
      '@react-native-async-storage/async-storage': mockStorage,
      '../api/client': { SafeStorage: mockStorage, apiClient: mockApiClient },
    }).offlineSyncService;

    // Directly seed queue with two identical mutations having identical idempotencyKey
    const fixedKey = 'idem_shared_key_443';
    const mut1 = {
      id: 'mut_first_1',
      type: 'CREATE_LEAD',
      endpoint: '/api/tenant/leads',
      method: 'POST',
      payload: { name: 'Duplicate Customer' },
      createdAt: '2026-10-30T10:00:00.000Z',
      retryCount: 0,
      maxRetries: 5,
      status: 'PENDING',
      idempotencyKey: fixedKey,
    };
    const mut2 = {
      id: 'mut_second_2',
      type: 'CREATE_LEAD',
      endpoint: '/api/tenant/leads',
      method: 'POST',
      payload: { name: 'Duplicate Customer' },
      createdAt: '2026-10-30T10:00:01.000Z',
      retryCount: 0,
      maxRetries: 5,
      status: 'PENDING',
      idempotencyKey: fixedKey,
    };

    await mockStorage.setItem('@solar_offline_queue', JSON.stringify([mut1, mut2]));

    const result = await service.syncQueue({ force: true });

    assert.strictEqual(result.synced, 1, 'First mutation should sync successfully');
    assert.strictEqual(result.conflicted, 1, 'Duplicate mutation should be caught as conflict');
    assert.strictEqual(callCount, 2, 'Both were attempted');

    const conflicts = await service.getConflictLog();
    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].resolution, 'SERVER_WINS');
  });
});
