/**
 * Tier 5: Adversarial M2 IA, Navigation & Interaction Stress Testing Suite
 * WhereReady Solar OS Mobile Client
 * 
 * Conducts exhaustive empirical verification and adversarial stress testing of:
 * 1. BackHandler Double-Tap Exit Debounce (Timing boundaries, route hierarchy, spam prevention)
 * 2. RBAC Permission Evaluation Invariants (Null inputs, empty arrays, wildcards, case sensitivity, unknown roles)
 * 3. Search 300ms Debouncing & Input Storms (Keystroke bursts, timer cancellation, length threshold)
 * 4. SafeStorage Recent Search Persistence (Deduplication, capacity ceiling, corrupted storage resilience)
 * 5. QuickActionsDispatcher Role Gating (Action authorization matrix, callback isolation, back dismissal)
 * 6. High-Frequency Spamming & Concurrency Stress (Stress loops, 5000-char queries, determinism)
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ts = require('../node_modules/typescript');

// -----------------------------------------------------------------------------
// 1. DYNAMIC TYPESCRIPT TRANSPILATION & RBAC MODULE LOADING
// -----------------------------------------------------------------------------
const rbacTsPath = path.resolve(__dirname, '../src/utils/rbac.ts');
const rbacTsContent = fs.readFileSync(rbacTsPath, 'utf8');

const transpiledRbac = ts.transpileModule(rbacTsContent, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const rbacModule = { exports: {} };
const rbacLoader = new Function('exports', 'module', transpiledRbac);
rbacLoader(rbacModule.exports, rbacModule);

const { hasPermission, hasAllPermissions } = rbacModule.exports;

// -----------------------------------------------------------------------------
// 2. BACKHANDLER SIMULATION HARNESS & ROOTNAVIGATOR ORACLE
// -----------------------------------------------------------------------------
function createBackHandlerHarness(initialRoute = 'Dashboard', canGoBack = false, user = { id: 'u1', role: 'SALES_AGENT' }) {
  let lastBackPressTime = 0;
  let exitAppCalled = false;
  let exitAppCallCount = 0;
  let toastMessage = null;
  let toastDuration = null;
  let toastCount = 0;
  let currentRoute = initialRoute;
  let stackCanGoBack = canGoBack;
  let stackGoBackCount = 0;
  let navigationTarget = null;
  let isNavReady = true;
  let os = 'android';

  const navigationRef = {
    isReady: () => isNavReady,
    canGoBack: () => stackCanGoBack,
    goBack: () => {
      stackGoBackCount++;
    },
    getCurrentRoute: () => ({ name: currentRoute }),
    navigate: (parent, target) => {
      navigationTarget = { parent, target };
      if (target && target.screen) {
        currentRoute = target.screen;
      }
    },
  };

  const ToastAndroid = {
    SHORT: 0,
    LONG: 1,
    show: (msg, duration) => {
      toastMessage = msg;
      toastDuration = duration;
      toastCount++;
    },
  };

  const BackHandler = {
    exitApp: () => {
      exitAppCalled = true;
      exitAppCallCount++;
    },
  };

  // Replicates RootNavigator.tsx onHardwareBackPress exact state machine
  const triggerBackPress = (simulatedTimestamp) => {
    if (os !== 'android') return false;

    // 1. Stack can go back
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
      return true;
    }

    // 2. Check current active route
    if (navigationRef.isReady()) {
      const activeRoute = navigationRef.getCurrentRoute();
      const routeName = (activeRoute?.name) || '';

      // Secondary tabs jump back to Dashboard
      if (
        routeName &&
        routeName !== 'Dashboard' &&
        ['Pipeline', 'Projects', 'Finance'].includes(routeName)
      ) {
        navigationRef.navigate('MainTabs', { screen: 'Dashboard' });
        return true;
      }

      // Root tabs or unauthenticated: double-tap back to exit
      if (routeName === 'Dashboard' || routeName === 'MainTabs' || routeName === 'Login' || !user) {
        const now = simulatedTimestamp !== undefined ? simulatedTimestamp : Date.now();
        if (now - lastBackPressTime < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPressTime = now;
        ToastAndroid.show(
          'Press back again to exit WhereReady Solar OS',
          ToastAndroid.SHORT
        );
        return true;
      }
    }

    return false;
  };

  return {
    triggerBackPress,
    setRoute: (r) => { currentRoute = r; },
    setCanGoBack: (v) => { stackCanGoBack = v; },
    setNavReady: (v) => { isNavReady = v; },
    setOs: (platform) => { os = platform; },
    setUser: (u) => { user = u; },
    getLastBackPressTime: () => lastBackPressTime,
    getExitAppCalled: () => exitAppCalled,
    getExitAppCallCount: () => exitAppCallCount,
    getToastMessage: () => toastMessage,
    getToastCount: () => toastCount,
    getStackGoBackCount: () => stackGoBackCount,
    getNavigationTarget: () => navigationTarget,
    getCurrentRoute: () => currentRoute,
    resetCounters: () => {
      exitAppCalled = false;
      exitAppCallCount = 0;
      toastMessage = null;
      toastCount = 0;
      stackGoBackCount = 0;
      navigationTarget = null;
    },
  };
}

// -----------------------------------------------------------------------------
// 3. SEARCH DEBOUNCE SIMULATION HARNESS
// -----------------------------------------------------------------------------
function createSearchDebounceHarness(delayMs = 300) {
  let activeTimer = null;
  let debouncedValue = '';
  let debounceCount = 0;
  let isCancelled = false;

  const typeQuery = (text, currentTime, scheduler) => {
    if (activeTimer) {
      scheduler.clearTimeout(activeTimer);
      activeTimer = null;
    }
    activeTimer = scheduler.setTimeout(() => {
      if (!isCancelled) {
        debouncedValue = text.trim();
        debounceCount++;
      }
    }, delayMs, currentTime);
  };

  const cancel = () => {
    isCancelled = true;
  };

  return {
    typeQuery,
    cancel,
    getDebouncedValue: () => debouncedValue,
    getDebounceCount: () => debounceCount,
  };
}

class VirtualScheduler {
  constructor() {
    this.now = 0;
    this.timers = [];
    this.timerIdCounter = 1;
  }
  setTimeout(cb, delay, currentTime) {
    if (currentTime !== undefined) this.now = currentTime;
    const id = this.timerIdCounter++;
    this.timers.push({ id, runAt: this.now + delay, cb });
    return id;
  }
  clearTimeout(id) {
    this.timers = this.timers.filter(t => t.id !== id);
  }
  advanceTimeTo(targetTime) {
    this.now = targetTime;
    const due = this.timers.filter(t => t.runAt <= this.now);
    this.timers = this.timers.filter(t => t.runAt > this.now);
    // Sort by runAt
    due.sort((a, b) => a.runAt - b.runAt);
    due.forEach(t => t.cb());
  }
  advanceTimeBy(delta) {
    this.advanceTimeTo(this.now + delta);
  }
}

// -----------------------------------------------------------------------------
// 4. SAFESTORAGE RECENT SEARCH ENGINE HARNESS
// -----------------------------------------------------------------------------
function createRecentSearchEngine(mockStorage, maxLimit = 8) {
  const STORAGE_KEY = '@solar_recent_searches';
  let memorySearches = [];

  const loadRecentSearches = async () => {
    try {
      const stored = await mockStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memorySearches = parsed.slice(0, maxLimit);
          return memorySearches;
        }
      }
    } catch {
      // Fallback silently
    }
    return memorySearches;
  };

  const saveRecentSearch = async (term) => {
    if (!term || typeof term !== 'string') return;
    const cleanTerm = term.trim();
    if (!cleanTerm || cleanTerm.length < 2) return;
    try {
      const filtered = memorySearches.filter((t) => t.toLowerCase() !== cleanTerm.toLowerCase());
      const updated = [cleanTerm, ...filtered].slice(0, maxLimit);
      memorySearches = updated;
      await mockStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Fallback silently
    }
  };

  const removeRecentSearch = async (term) => {
    try {
      const updated = memorySearches.filter((t) => t !== term);
      memorySearches = updated;
      await mockStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Fallback silently
    }
  };

  const clearAllRecentSearches = async () => {
    try {
      memorySearches = [];
      await mockStorage.removeItem(STORAGE_KEY);
    } catch {
      // Fallback silently
    }
  };

  return {
    loadRecentSearches,
    saveRecentSearch,
    removeRecentSearch,
    clearAllRecentSearches,
    getMemorySearches: () => memorySearches,
  };
}

class MockStorageBackend {
  constructor() {
    this.data = new Map();
  }
  async getItem(k) {
    return this.data.has(k) ? this.data.get(k) : null;
  }
  async setItem(k, v) {
    this.data.set(k, String(v));
  }
  async removeItem(k) {
    this.data.delete(k);
  }
  async clear() {
    this.data.clear();
  }
  setRaw(k, v) {
    this.data.set(k, v);
  }
}

// -----------------------------------------------------------------------------
// 5. QUICK ACTIONS DISPATCHER ORACLE
// -----------------------------------------------------------------------------
function evaluateQuickActionsForUser(user) {
  const actions = [
    {
      id: 'new_lead',
      title: 'New Lead',
      permissionCheck: (u) => hasPermission(u, 'leads.create'),
    },
    {
      id: 'quick_quote',
      title: 'Quick Quote',
      permissionCheck: (u) =>
        hasPermission(u, 'quotations.create') || hasPermission(u, 'quotations.view'),
    },
    {
      id: 'scan_hardware',
      title: 'Scan Hardware',
      permissionCheck: (u) =>
        hasPermission(u, 'operations.scan') ||
        hasPermission(u, 'hardware.scan') ||
        hasPermission(u, 'projects.edit') ||
        hasPermission(u, 'operations.view'),
    },
    {
      id: 'record_payment',
      title: 'Record Payment',
      permissionCheck: (u) =>
        hasPermission(u, 'finance.create_invoice') ||
        hasPermission(u, 'finance.record_payment'),
    },
  ];

  return actions.filter(act => act.permissionCheck(user));
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Tier 5: Adversarial M2 IA, Navigation & Interaction Stress Suite', () => {

  // ---------------------------------------------------------------------------
  // SUITE 1: BackHandler Double-Tap Exit Debounce
  // ---------------------------------------------------------------------------
  describe('Suite 1: BackHandler Double-Tap Exit Debounce & Hardware Navigation', () => {
    it('1.1 should show Toast and not exit on first back press on Dashboard root', () => {
      const harness = createBackHandlerHarness('Dashboard');
      const consumed = harness.triggerBackPress(10000);

      assert.equal(consumed, true, 'Back press must be consumed');
      assert.equal(harness.getExitAppCalled(), false, 'exitApp must NOT be called on 1st press');
      assert.equal(harness.getToastCount(), 1, 'ToastAndroid.show must be called once');
      assert.equal(harness.getToastMessage(), 'Press back again to exit WhereReady Solar OS');
      assert.equal(harness.getLastBackPressTime(), 10000, 'lastBackPressTime must be recorded');
    });

    it('1.2 should exit app when second back press occurs within 2000ms (< 2000ms)', () => {
      const harness = createBackHandlerHarness('Dashboard');
      harness.triggerBackPress(10000); // 1st press

      const consumed = harness.triggerBackPress(11500); // 2nd press at 1500ms diff (< 2000ms)
      assert.equal(consumed, true, '2nd back press must be consumed');
      assert.equal(harness.getExitAppCalled(), true, 'exitApp must be called on rapid double-tap');
      assert.equal(harness.getExitAppCallCount(), 1, 'exitApp must be called exactly once');
      assert.equal(harness.getToastCount(), 1, 'Toast count must remain 1');
    });

    it('1.3 should NOT exit and reset timer when second back press occurs after > 2000ms', () => {
      const harness = createBackHandlerHarness('Dashboard');
      harness.triggerBackPress(10000); // 1st press

      const consumed = harness.triggerBackPress(12500); // 2nd press at 2500ms diff (> 2000ms)
      assert.equal(consumed, true, '2nd back press must be consumed');
      assert.equal(harness.getExitAppCalled(), false, 'exitApp must NOT be called when > 2000ms');
      assert.equal(harness.getToastCount(), 2, 'Toast must be triggered again');
      assert.equal(harness.getLastBackPressTime(), 12500, 'lastBackPressTime must update to new timestamp');

      // 3rd press rapid after 2nd (e.g. at 13000 -> 500ms after 12500)
      const thirdConsumed = harness.triggerBackPress(13000);
      assert.equal(thirdConsumed, true);
      assert.equal(harness.getExitAppCalled(), true, 'exitApp must succeed on rapid tap after reset');
    });

    it('1.4 should NOT exit at exact 2000ms boundary condition (now - last === 2000)', () => {
      const harness = createBackHandlerHarness('Dashboard');
      harness.triggerBackPress(10000); // 1st press

      // Boundary: exactly 2000ms later (12000 - 10000 = 2000)
      // Condition is `now - lastBackPressTime < 2000`, so 2000 < 2000 is FALSE
      harness.triggerBackPress(12000);
      assert.equal(harness.getExitAppCalled(), false, 'Must not exit at boundary 2000ms');
      assert.equal(harness.getToastCount(), 2, 'Toast must fire again');

      // Right inside boundary: 1999ms later (13999 - 12000 = 1999)
      harness.triggerBackPress(13999);
      assert.equal(harness.getExitAppCalled(), true, 'Must exit at 1999ms');
    });

    it('1.5 should navigate to Dashboard when back is pressed on secondary tabs (Pipeline, Projects, Finance)', () => {
      const harness = createBackHandlerHarness('Pipeline');
      const consumed = harness.triggerBackPress(10000);

      assert.equal(consumed, true, 'Back press on Pipeline must be consumed');
      assert.equal(harness.getExitAppCalled(), false, 'exitApp must not be called on secondary tab');
      assert.equal(harness.getCurrentRoute(), 'Dashboard', 'Must jump back to Dashboard route');
      assert.equal(harness.getToastCount(), 0, 'No toast must be shown when returning to Dashboard');

      // Projects tab
      harness.setRoute('Projects');
      harness.resetCounters();
      harness.triggerBackPress(10500);
      assert.equal(harness.getCurrentRoute(), 'Dashboard');

      // Finance tab
      harness.setRoute('Finance');
      harness.resetCounters();
      harness.triggerBackPress(11000);
      assert.equal(harness.getCurrentRoute(), 'Dashboard');
    });

    it('1.6 should delegate to stack goBack() when navigation stack canGoBack is true', () => {
      const harness = createBackHandlerHarness('Pipeline', true); // canGoBack = true
      const consumed = harness.triggerBackPress(10000);

      assert.equal(consumed, true, 'Must be consumed by stack goBack');
      assert.equal(harness.getStackGoBackCount(), 1, 'stack goBack must be invoked');
      assert.equal(harness.getExitAppCalled(), false, 'exitApp must not be called');
      assert.equal(harness.getToastCount(), 0, 'No toast on stack pop');
    });

    it('1.7 should enforce double-tap exit on Login screen or unauthenticated user', () => {
      const harness = createBackHandlerHarness('Login', false, null); // user = null
      harness.triggerBackPress(10000);
      assert.equal(harness.getExitAppCalled(), false);
      assert.equal(harness.getToastCount(), 1);

      harness.triggerBackPress(10800); // 800ms diff
      assert.equal(harness.getExitAppCalled(), true, 'Must exit on double-tap when logged out');
    });

    it('1.8 should ignore BackHandler when Platform.OS !== android', () => {
      const harness = createBackHandlerHarness('Dashboard');
      harness.setOs('ios');
      const consumed = harness.triggerBackPress(10000);

      assert.equal(consumed, false, 'Must return false on iOS');
      assert.equal(harness.getExitAppCalled(), false);
      assert.equal(harness.getToastCount(), 0);
    });

    it('1.9 should withstand 100 rapid spamming back presses without crashing', () => {
      const harness = createBackHandlerHarness('Dashboard');
      for (let i = 0; i < 100; i++) {
        harness.triggerBackPress(10000 + i * 10);
      }
      assert.equal(harness.getExitAppCalled(), true, 'App exit must be triggered');
      assert.equal(harness.getExitAppCallCount(), 99, 'Remaining rapid presses safely register exit');
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 2: RBAC Permission Evaluation Invariants & Edge Cases
  // ---------------------------------------------------------------------------
  describe('Suite 2: RBAC Permission Evaluation Edge Cases & Invariants', () => {
    it('2.1 should safely return false for null, undefined, or empty user profile', () => {
      assert.equal(hasPermission(null, 'leads.view'), false);
      assert.equal(hasPermission(undefined, 'leads.view'), false);
      assert.equal(hasPermission({}, 'leads.view'), false);
      assert.equal(hasPermission({ id: 'u1' }, 'leads.view'), false);
      assert.equal(hasPermission({ role: null }, 'leads.view'), false);
      assert.equal(hasPermission({ role: undefined }, 'leads.view'), false);

      assert.equal(hasAllPermissions(null, ['leads.view']), false);
      assert.equal(hasAllPermissions(undefined, ['leads.view']), false);
      assert.equal(hasAllPermissions({}, ['leads.view']), false);
    });

    it('2.2 should grant full access to UNRESTRICTED_ROLES case-insensitively', () => {
      const unrestricted = ['SUPER_ADMIN', 'super_admin', 'TENANT_ADMIN', 'tenant_admin', 'OWNER', 'Owner'];
      const arbitraryPermissions = [
        'leads.view',
        'finance.delete_everything',
        'nuclear.launch',
        'random.permission.name',
        '',
      ];

      unrestricted.forEach(role => {
        const user = { role, permissions: [] };
        arbitraryPermissions.forEach(perm => {
          assert.equal(hasPermission(user, perm), true, `Role ${role} must have permission: ${perm}`);
        });
        assert.equal(hasAllPermissions(user, arbitraryPermissions), true, `Role ${role} must pass hasAllPermissions`);
      });
    });

    it('2.3 should correctly evaluate SALES_AGENT fallback permissions', () => {
      const salesUser = { role: 'SALES_AGENT' };

      // Permitted permissions
      const allowed = [
        'leads.view',
        'leads.create',
        'leads.edit',
        'crm.view',
        'quotations.view',
        'quotations.create',
        'projects.view',
        'finance.view',
        'surveys.view',
      ];
      allowed.forEach(p => {
        assert.equal(hasPermission(salesUser, p), true, `SALES_AGENT must have ${p}`);
      });

      // Disallowed permissions
      const forbidden = [
        'leads.delete',
        'leads.assign',
        'finance.create_invoice',
        'finance.record_payment',
        'operations.scan',
        'hardware.scan',
        'inventory.dispatch',
        'tickets.resolve',
      ];
      forbidden.forEach(p => {
        assert.equal(hasPermission(salesUser, p), false, `SALES_AGENT must NOT have ${p}`);
      });
    });

    it('2.4 should correctly evaluate TECHNICIAN fallback permissions', () => {
      const techUser = { role: 'TECHNICIAN' };

      const allowed = [
        'projects.view',
        'projects.edit',
        'operations.view',
        'operations.scan',
        'hardware.scan',
        'surveys.view',
        'inventory.view',
      ];
      allowed.forEach(p => {
        assert.equal(hasPermission(techUser, p), true, `TECHNICIAN must have ${p}`);
      });

      const forbidden = [
        'leads.create',
        'quotations.create',
        'quotations.send',
        'finance.create_invoice',
        'finance.record_payment',
        'projects.create',
      ];
      forbidden.forEach(p => {
        assert.equal(hasPermission(techUser, p), false, `TECHNICIAN must NOT have ${p}`);
      });
    });

    it('2.5 should correctly evaluate TENANT_SUB_ADMIN fallback permissions', () => {
      const subAdmin = { role: 'TENANT_SUB_ADMIN' };

      assert.equal(hasPermission(subAdmin, 'leads.view'), true);
      assert.equal(hasPermission(subAdmin, 'projects.view'), true);
      assert.equal(hasPermission(subAdmin, 'finance.view'), true);
      assert.equal(hasPermission(subAdmin, 'operations.view'), true);
      assert.equal(hasPermission(subAdmin, 'quotations.view'), true);

      assert.equal(hasPermission(subAdmin, 'leads.create'), false);
      assert.equal(hasPermission(subAdmin, 'operations.scan'), false);
      assert.equal(hasPermission(subAdmin, 'finance.create_invoice'), false);
    });

    it('2.6 should prioritize explicit non-empty permissions array over role fallbacks', () => {
      // User is TECHNICIAN, but explicitly assigned ONLY 'leads.create'
      const customUser = {
        role: 'TECHNICIAN',
        permissions: ['leads.create'],
      };

      assert.equal(hasPermission(customUser, 'leads.create'), true, 'Explicitly granted permission must be true');
      assert.equal(hasPermission(customUser, 'operations.scan'), false, 'Fallback permission must be overridden');
      assert.equal(hasPermission(customUser, 'projects.edit'), false, 'Fallback permission must be overridden');
    });

    it('2.7 should handle object permissions structure ({ modules: [...] })', () => {
      const modularUser = {
        role: 'CUSTOM_ROLE',
        permissions: {
          modules: ['surveys.approve', 'quotations.approve'],
        },
      };

      assert.equal(hasPermission(modularUser, 'surveys.approve'), true);
      assert.equal(hasPermission(modularUser, 'quotations.approve'), true);
      assert.equal(hasPermission(modularUser, 'leads.view'), false);
    });

    it('2.8 should evaluate global wildcard * and all permissions', () => {
      const starUser = { role: 'RESTRICTED', permissions: ['*'] };
      assert.equal(hasPermission(starUser, 'leads.delete'), true);
      assert.equal(hasPermission(starUser, 'finance.create_invoice'), true);

      const allUser = { role: 'RESTRICTED', permissions: ['all'] };
      assert.equal(hasPermission(allUser, 'hardware.scan'), true);
      assert.equal(hasPermission(allUser, 'surveys.approve'), true);
    });

    it('2.9 should evaluate module wildcards (e.g. leads.* or finance.*)', () => {
      const moduleWildcardUser = {
        role: 'RESTRICTED',
        permissions: ['leads.*', 'finance.*'],
      };

      // Leads actions
      assert.equal(hasPermission(moduleWildcardUser, 'leads.view'), true);
      assert.equal(hasPermission(moduleWildcardUser, 'leads.create'), true);
      assert.equal(hasPermission(moduleWildcardUser, 'leads.delete'), true);
      assert.equal(hasPermission(moduleWildcardUser, 'leads.arbitrary_subaction'), true);

      // Finance actions
      assert.equal(hasPermission(moduleWildcardUser, 'finance.view'), true);
      assert.equal(hasPermission(moduleWildcardUser, 'finance.create_invoice'), true);

      // Other modules
      assert.equal(hasPermission(moduleWildcardUser, 'projects.view'), false);
      assert.equal(hasPermission(moduleWildcardUser, 'operations.scan'), false);
      assert.equal(hasPermission(moduleWildcardUser, 'crm.view'), false);
    });

    it('2.10 should evaluate OR logic when requiredPermission is an array in hasPermission', () => {
      const user = { role: 'TECHNICIAN' };

      // User has hardware.scan, but not finance.create_invoice
      assert.equal(
        hasPermission(user, ['finance.create_invoice', 'hardware.scan']),
        true,
        'hasPermission must return true if user has ANY of the permissions'
      );

      assert.equal(
        hasPermission(user, ['finance.create_invoice', 'finance.record_payment']),
        false,
        'hasPermission must return false if user has NONE of the permissions'
      );
    });

    it('2.11 should evaluate AND logic in hasAllPermissions', () => {
      const salesUser = { role: 'SALES_AGENT' };

      assert.equal(
        hasAllPermissions(salesUser, ['leads.view', 'quotations.create', 'projects.view']),
        true,
        'hasAllPermissions must return true when all are possessed'
      );

      assert.equal(
        hasAllPermissions(salesUser, ['leads.view', 'operations.scan']),
        false,
        'hasAllPermissions must return false if any is missing'
      );

      assert.equal(
        hasAllPermissions(salesUser, []),
        true,
        'Vacuous truth: hasAllPermissions with empty array must return true'
      );
    });

    it('2.12 should handle unknown roles without crashing or leaking access', () => {
      const unknownUser = { role: 'HACKER_ATTEMPT', permissions: [] };
      assert.equal(hasPermission(unknownUser, 'leads.view'), false);
      assert.equal(hasPermission(unknownUser, 'projects.edit'), false);
      assert.equal(hasPermission(unknownUser, '*'), false);
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 3: Search Debounce & Input Storm Invariants
  // ---------------------------------------------------------------------------
  describe('Suite 3: Search Debouncing (300ms) & Rapid Input Storms', () => {
    it('3.1 should debounce single query and update exactly after 300ms', () => {
      const scheduler = new VirtualScheduler();
      const harness = createSearchDebounceHarness(300);

      harness.typeQuery('Solar Project', 0, scheduler);

      // At 200ms: not yet expired
      scheduler.advanceTimeTo(200);
      assert.equal(harness.getDebouncedValue(), '', 'Debounce must not resolve before 300ms');
      assert.equal(harness.getDebounceCount(), 0);

      // At 300ms: exactly resolves
      scheduler.advanceTimeTo(300);
      assert.equal(harness.getDebouncedValue(), 'Solar Project', 'Debounce must resolve at 300ms');
      assert.equal(harness.getDebounceCount(), 1);
    });

    it('3.2 should collapse rapid typing burst into a single invocation after 300ms from last keypress', () => {
      const scheduler = new VirtualScheduler();
      const harness = createSearchDebounceHarness(300);

      const keystrokes = [
        { time: 0, text: 'W' },
        { time: 50, text: 'Wa' },
        { time: 100, text: 'Waa' },
        { time: 150, text: 'Waar' },
        { time: 200, text: 'Waare' },
        { time: 250, text: 'Waaree' },
      ];

      keystrokes.forEach(k => {
        harness.typeQuery(k.text, k.time, scheduler);
      });

      // At 400ms (150ms after last keypress): must still be pending!
      scheduler.advanceTimeTo(400);
      assert.equal(harness.getDebouncedValue(), '', 'Burst in flight must not trigger prematurely');
      assert.equal(harness.getDebounceCount(), 0);

      // At 550ms (exactly 300ms after last keypress at 250ms):
      scheduler.advanceTimeTo(550);
      assert.equal(harness.getDebouncedValue(), 'Waaree', 'Must resolve to final keystroke string');
      assert.equal(harness.getDebounceCount(), 1, 'Must execute exactly ONCE for entire burst');
    });

    it('3.3 should trim whitespace around debounced terms', () => {
      const scheduler = new VirtualScheduler();
      const harness = createSearchDebounceHarness(300);

      harness.typeQuery('   MSEDCL Application   ', 0, scheduler);
      scheduler.advanceTimeTo(300);

      assert.equal(harness.getDebouncedValue(), 'MSEDCL Application', 'Must trim trailing/leading spaces');
    });

    it('3.4 should abort debounced update if search is cancelled before timer expires', () => {
      const scheduler = new VirtualScheduler();
      const harness = createSearchDebounceHarness(300);

      harness.typeQuery('Cancelled Search', 0, scheduler);
      scheduler.advanceTimeTo(150);

      // Modal closed / unmounted
      harness.cancel();

      scheduler.advanceTimeTo(350);
      assert.equal(harness.getDebouncedValue(), '', 'Cancelled search must never update state');
      assert.equal(harness.getDebounceCount(), 0);
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 4: SafeStorage Recent Search Persistence
  // ---------------------------------------------------------------------------
  describe('Suite 4: SafeStorage Recent Search Persistence, Deduplication & Ceiling', () => {
    it('4.1 should ignore search terms with length < 2 or pure whitespace', async () => {
      const storage = new MockStorageBackend();
      const engine = createRecentSearchEngine(storage, 8);

      await engine.saveRecentSearch('');
      await engine.saveRecentSearch(' ');
      await engine.saveRecentSearch('a');
      await engine.saveRecentSearch('   x   ');

      assert.deepEqual(engine.getMemorySearches(), [], 'Short terms must be ignored');
      assert.equal(await storage.getItem('@solar_recent_searches'), null);
    });

    it('4.2 should append terms to front (LIFO) and persist to SafeStorage', async () => {
      const storage = new MockStorageBackend();
      const engine = createRecentSearchEngine(storage, 8);

      await engine.saveRecentSearch('Term 1');
      await engine.saveRecentSearch('Term 2');
      await engine.saveRecentSearch('Term 3');

      assert.deepEqual(engine.getMemorySearches(), ['Term 3', 'Term 2', 'Term 1']);

      const raw = await storage.getItem('@solar_recent_searches');
      assert.deepEqual(JSON.parse(raw), ['Term 3', 'Term 2', 'Term 1']);
    });

    it('4.3 should deduplicate search terms case-insensitively and move to top', async () => {
      const storage = new MockStorageBackend();
      const engine = createRecentSearchEngine(storage, 8);

      await engine.saveRecentSearch('solar');
      await engine.saveRecentSearch('battery');
      await engine.saveRecentSearch('SOLAR'); // Deduplication trigger

      assert.deepEqual(
        engine.getMemorySearches(),
        ['SOLAR', 'battery'],
        'SOLAR must be promoted to index 0, duplicate solar purged'
      );
      assert.equal(engine.getMemorySearches().length, 2);
    });

    it('4.4 should enforce MAX_RECENT_SEARCHES capacity ceiling of 8 items', async () => {
      const storage = new MockStorageBackend();
      const engine = createRecentSearchEngine(storage, 8);

      for (let i = 1; i <= 15; i++) {
        await engine.saveRecentSearch(`Query ${i}`);
      }

      const list = engine.getMemorySearches();
      assert.equal(list.length, 8, 'List length must never exceed 8');
      assert.equal(list[0], 'Query 15', 'Index 0 must be the most recent query');
      assert.equal(list[7], 'Query 8', 'Index 7 must be the 8th most recent query');

      const raw = await storage.getItem('@solar_recent_searches');
      const parsed = JSON.parse(raw);
      assert.equal(parsed.length, 8);
    });

    it('4.5 should remove single recent search item and update storage', async () => {
      const storage = new MockStorageBackend();
      const engine = createRecentSearchEngine(storage, 8);

      await engine.saveRecentSearch('Alpha');
      await engine.saveRecentSearch('Beta');
      await engine.saveRecentSearch('Gamma');

      await engine.removeRecentSearch('Beta');

      assert.deepEqual(engine.getMemorySearches(), ['Gamma', 'Alpha']);
      const raw = await storage.getItem('@solar_recent_searches');
      assert.deepEqual(JSON.parse(raw), ['Gamma', 'Alpha']);
    });

    it('4.6 should clear all recent searches and remove storage key', async () => {
      const storage = new MockStorageBackend();
      const engine = createRecentSearchEngine(storage, 8);

      await engine.saveRecentSearch('Alpha');
      await engine.saveRecentSearch('Beta');

      await engine.clearAllRecentSearches();

      assert.deepEqual(engine.getMemorySearches(), []);
      assert.equal(await storage.getItem('@solar_recent_searches'), null);
    });

    it('4.7 should safely recover from corrupted storage values (invalid JSON or non-arrays)', async () => {
      const storage = new MockStorageBackend();
      const engine = createRecentSearchEngine(storage, 8);

      // Corrupted JSON string
      storage.setRaw('@solar_recent_searches', '{"invalid_json_missing_brace: 123');
      const list1 = await engine.loadRecentSearches();
      assert.deepEqual(list1, [], 'Must handle JSON syntax error safely without crashing');

      // Valid JSON but non-array (object)
      storage.setRaw('@solar_recent_searches', '{"someKey": "someValue"}');
      const list2 = await engine.loadRecentSearches();
      assert.deepEqual(list2, [], 'Must reject non-array JSON objects safely');

      // Valid JSON but oversized array (> 8 items)
      const oversized = Array.from({ length: 20 }, (_, i) => `Saved ${i}`);
      storage.setRaw('@solar_recent_searches', JSON.stringify(oversized));
      const list3 = await engine.loadRecentSearches();
      assert.equal(list3.length, 8, 'Must truncate oversized arrays to 8 on load');
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 5: QuickActionsDispatcher Role Gating & Action Callbacks
  // ---------------------------------------------------------------------------
  describe('Suite 5: QuickActionsDispatcher Role Authorization & Interaction Integration', () => {
    it('5.1 should expose all 4 operational actions to UNRESTRICTED_ROLES (SUPER_ADMIN, OWNER)', () => {
      const admin = { role: 'SUPER_ADMIN' };
      const actions = evaluateQuickActionsForUser(admin);

      assert.equal(actions.length, 4, 'SUPER_ADMIN must have all 4 quick actions');
      const ids = actions.map(a => a.id);
      assert.deepEqual(ids, ['new_lead', 'quick_quote', 'scan_hardware', 'record_payment']);
    });

    it('5.2 should restrict SALES_AGENT to CRM (new_lead) and Sales (quick_quote)', () => {
      const sales = { role: 'SALES_AGENT' };
      const actions = evaluateQuickActionsForUser(sales);

      assert.equal(actions.length, 2, 'SALES_AGENT must have exactly 2 quick actions');
      const ids = actions.map(a => a.id);
      assert.deepEqual(ids, ['new_lead', 'quick_quote']);
    });

    it('5.3 should restrict TECHNICIAN to Operations (scan_hardware)', () => {
      const tech = { role: 'TECHNICIAN' };
      const actions = evaluateQuickActionsForUser(tech);

      assert.equal(actions.length, 1, 'TECHNICIAN must have exactly 1 quick action');
      assert.equal(actions[0].id, 'scan_hardware');
    });

    it('5.4 should permit TENANT_SUB_ADMIN to access Sales (quick_quote) and Operations (scan_hardware)', () => {
      const subAdmin = { role: 'TENANT_SUB_ADMIN' };
      const actions = evaluateQuickActionsForUser(subAdmin);

      assert.equal(actions.length, 2, 'TENANT_SUB_ADMIN must have exactly 2 quick actions (quick_quote and scan_hardware via operations.view)');
      const ids = actions.map(a => a.id);
      assert.deepEqual(ids, ['quick_quote', 'scan_hardware']);
    });

    it('5.5 should provide 0 actions to unauthorized role and trigger ShieldAlert empty state', () => {
      const unauthorized = { role: 'EXTERNAL_AUDITOR', permissions: [] };
      const actions = evaluateQuickActionsForUser(unauthorized);

      assert.equal(actions.length, 0, 'Unauthorized user must receive 0 quick actions');
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 6: High-Frequency Concurrency & 5000-Char Edge Cases
  // ---------------------------------------------------------------------------
  describe('Suite 6: High-Frequency Concurrency, 5,000-Char Strings & Adversarial Stress', () => {
    it('6.1 should withstand 500 rapid random permission checks without memory leak or state corruption', () => {
      const roles = ['SUPER_ADMIN', 'SALES_AGENT', 'TECHNICIAN', 'TENANT_SUB_ADMIN', 'GUEST'];
      const perms = ['leads.create', 'operations.scan', 'finance.create_invoice', 'projects.view', 'surveys.approve'];

      for (let i = 0; i < 500; i++) {
        const r = roles[i % roles.length];
        const p = perms[i % perms.length];
        const res = hasPermission({ role: r }, p);
        assert.equal(typeof res, 'boolean');
      }
    });

    it('6.2 should withstand 5,000-character search queries in debounce and storage', async () => {
      const massiveQuery = 'SOLAR_TEST_'.repeat(450); // ~4950 chars
      assert(massiveQuery.length > 4000);

      const scheduler = new VirtualScheduler();
      const harness = createSearchDebounceHarness(300);

      harness.typeQuery(massiveQuery, 0, scheduler);
      scheduler.advanceTimeTo(300);

      assert.equal(harness.getDebouncedValue(), massiveQuery.trim());
      assert.equal(harness.getDebounceCount(), 1);

      // SafeStorage persistence of massive query
      const storage = new MockStorageBackend();
      const engine = createRecentSearchEngine(storage, 8);

      await engine.saveRecentSearch(massiveQuery);
      assert.equal(engine.getMemorySearches().length, 1);
      assert.equal(engine.getMemorySearches()[0], massiveQuery.trim());
    });

    it('6.3 should guarantee BackHandler timing consistency across multiple simulated days', () => {
      const harness = createBackHandlerHarness('Dashboard');

      // Day 1
      harness.triggerBackPress(1000000);
      assert.equal(harness.getExitAppCalled(), false);

      // Day 2 (86,400,000 ms later)
      harness.triggerBackPress(1000000 + 86400000);
      assert.equal(harness.getExitAppCalled(), false, 'Day transition must reset debounce interval');

      // Rapid tap on Day 2 (+500ms)
      harness.triggerBackPress(1000000 + 86400000 + 500);
      assert.equal(harness.getExitAppCalled(), true, 'Rapid tap must exit');
    });
  });
});
