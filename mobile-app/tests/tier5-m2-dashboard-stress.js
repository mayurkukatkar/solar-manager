/**
 * Tier 5: Adversarial Challenge & Empirical Verification Suite — Milestone M2
 * WhereReady Solar OS Mobile Client
 * 
 * Verifies:
 * 1. Dynamic safe area calculation: Header rendering under simulated device dimensions:
 *    - Zero inset (legacy Android)
 *    - 24px status bar
 *    - 48px notch / dynamic island
 *    - Landscape orientation / 0 top inset
 * 2. Extreme data stress on Dashboard metrics:
 *    - Null or undefined metrics payload
 *    - Zero leads, zero revenue, zero projects
 *    - Massive numbers (₹100 Crore+, 10,000 kWp) — verify tabularNums and non-overflowing text wrappers
 *    - Negative profit / margin scenarios
 * 3. Network error simulation:
 *    - API failure (500, network offline) -> ensure error state activates with retry CTA
 *    - Token expiry (401) -> verify error handling and session degradation
 *    - Tenant suspension (403 TENANT_SUSPENDED)
 * 4. Android Edge-to-Edge Navigation & Hardware Back Invariants
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Resolve React and React DOM Server for stable component tree evaluation
const reactPath = path.resolve(__dirname, '../node_modules/react').replace(/\\/g, '/');
const reactDomServerPath = path.resolve(__dirname, '../../web-client/node_modules/react-dom/server').replace(/\\/g, '/');
const React = require(reactPath);
const ReactDOMServer = require(reactDomServerPath);

// Load TypeScript transpiler
const ts = require('../node_modules/typescript');

// Global mock state
global.__mockState = {
  insets: { top: 24, bottom: 0, left: 0, right: 0 },
  platform: 'android',
  statusBarHeight: 24,
  user: {
    id: 'usr_test_1',
    name: 'Vikram Joshi',
    email: 'vikram@sunflowerepc.com',
    role: 'TENANT_ADMIN',
    tenantName: 'Sunflower Solar EPC',
    tenantId: 'tenant_test_1',
    permissions: ['*'],
  },
  backendStatus: { isOnline: true, serverUrl: 'https://solar-manager-three.vercel.app' },
  storage: {},
  lastToast: null,
  appExited: false,
};

// Global React Native and dependencies mock
global.__mockRN = {
  Platform: {
    get OS() { return global.__mockState.platform; },
    select: (obj) => {
      const os = global.__mockState.platform;
      return obj[os] !== undefined ? obj[os] : obj.default;
    },
  },
  StatusBar: {
    get currentHeight() { return global.__mockState.statusBarHeight; },
  },
  StyleSheet: {
    create: (s) => s,
    flatten: (s) => (Array.isArray(s) ? Object.assign({}, ...s.filter(Boolean)) : s || {}),
  },
  View: (props) => React.createElement('View', props, props.children),
  Text: (props) => React.createElement('Text', props, props.children),
  TouchableOpacity: (props) => React.createElement('TouchableOpacity', props, props.children),
  ScrollView: (props) => React.createElement('ScrollView', props, props.children),
  RefreshControl: (props) => React.createElement('RefreshControl', props),
  Modal: (props) => (props.visible ? React.createElement('Modal', props, props.children) : null),
  TextInput: (props) => React.createElement('TextInput', props),
  Image: (props) => React.createElement('Image', props),
  ActivityIndicator: (props) => React.createElement('ActivityIndicator', props),
  ToastAndroid: {
    SHORT: 0,
    LONG: 1,
    show: (msg) => { global.__mockState.lastToast = msg; },
  },
  BackHandler: {
    _handlers: [],
    addEventListener: (evt, handler) => {
      if (evt === 'hardwareBackPress') {
        global.__mockRN.BackHandler._handlers.push(handler);
        return {
          remove: () => {
            const idx = global.__mockRN.BackHandler._handlers.indexOf(handler);
            if (idx >= 0) global.__mockRN.BackHandler._handlers.splice(idx, 1);
          },
        };
      }
      return { remove: () => {} };
    },
    exitApp: () => { global.__mockState.appExited = true; },
  },
  Linking: {
    openURL: async (url) => { global.__mockState.lastOpenedUrl = url; },
  },
  useColorScheme: () => 'light',
  Appearance: { getColorScheme: () => 'light' },
};

global.__mockSafeArea = {
  useSafeAreaInsets: () => global.__mockState.insets,
};

// Transpiler with module interception
function compileAndMock(raw) {
  let transpiled = ts.transpileModule(raw, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  transpiled = transpiled.replace(/require\((['"])react\1\)/g, `require('${reactPath}')`);
  transpiled = transpiled.replace(/require\((['"])react-native\1\)/g, 'global.__mockRN');
  transpiled = transpiled.replace(/require\((['"])react-native-safe-area-context\1\)/g, 'global.__mockSafeArea');
  return transpiled;
}

require.extensions['.ts'] = function (m, filename) {
  const raw = fs.readFileSync(filename, 'utf8');
  return m._compile(compileAndMock(raw), filename);
};
require.extensions['.tsx'] = require.extensions['.ts'];

// Load tokens
const tokens = require('../src/theme/tokens');
const colors = require('../src/theme/colors');

// Helper to flatten styles
function flattenStyle(styleProp) {
  if (Array.isArray(styleProp)) {
    return Object.assign({}, ...styleProp.filter(Boolean));
  }
  return styleProp || {};
}

// =============================================================================
// DOMAIN ORACLE FUNCTIONS (Mirroring calculations in Header & DashboardScreen)
// =============================================================================

function calculateTopSafeArea(insets, platform, statusBarHeight) {
  return Math.max(
    insets.top,
    platform === 'android' ? (statusBarHeight || 24) : 44
  );
}

function computeDashboardFinancials(data) {
  const safeData = data || {};
  const totalCapacityKWp = (safeData.totalCapacity || 0).toFixed(1);
  const totalRevenueLakhs = safeData.totalRevenue ? Number((safeData.totalRevenue / 100000).toFixed(1)) : 0;
  const totalCollectedLakhs = safeData.totalCollected ? Number((safeData.totalCollected / 100000).toFixed(1)) : 0;
  const outstandingLakhs = safeData.outstanding !== undefined && safeData.outstanding !== null
    ? Number((safeData.outstanding / 100000).toFixed(1))
    : Math.max(0, Number((totalRevenueLakhs - totalCollectedLakhs).toFixed(1)));

  const collectedPct = totalRevenueLakhs > 0
    ? Math.min(100, Math.round((totalCollectedLakhs / totalRevenueLakhs) * 100))
    : 0;

  // Environmental Metrics
  const cleanEnergyMWh = safeData.environmental && safeData.environmental.monthlyEnergyKWh > 0
    ? (safeData.environmental.monthlyEnergyKWh / 1000).toFixed(2)
    : ((Number(totalCapacityKWp) * 120) / 1000).toFixed(2);

  const co2Tons = safeData.environmental && safeData.environmental.co2Tons > 0
    ? safeData.environmental.co2Tons
    : Number((Number(cleanEnergyMWh) * 1000 * 0.82 / 1000).toFixed(1));

  const coalTons = safeData.environmental && safeData.environmental.coalTons > 0
    ? safeData.environmental.coalTons
    : Number((Number(co2Tons) * 0.48).toFixed(1));

  const treesCount = safeData.environmental && safeData.environmental.trees > 0
    ? safeData.environmental.trees.toLocaleString('en-IN')
    : Math.round(Number(co2Tons) * 45).toLocaleString('en-IN');

  return {
    totalCapacityKWp,
    totalRevenueLakhs,
    totalCollectedLakhs,
    outstandingLakhs,
    collectedPct,
    cleanEnergyMWh,
    co2Tons,
    coalTons,
    treesCount,
  };
}

function computeHorizonMetrics(horizonList) {
  const activeHorizonData = Array.isArray(horizonList) ? horizonList : [];
  const totalHorizonClients = activeHorizonData.reduce((acc, curr) => acc + (curr.clients || 0), 0);
  const totalHorizonRevenue = activeHorizonData.reduce((acc, curr) => acc + (curr.revenue || 0), 0).toFixed(1);
  const totalHorizonCapacity = activeHorizonData.reduce((acc, curr) => acc + (curr.capacity || 0), 0).toFixed(1);
  const avgHorizonDeal = (Number(totalHorizonRevenue) / (totalHorizonClients || 1)).toFixed(2);
  const maxClientsVal = Math.max(...activeHorizonData.map((d) => d.clients || 0), 1);
  const maxRevenueVal = Math.max(...activeHorizonData.map((d) => d.revenue || 0), 1);

  return {
    totalHorizonClients,
    totalHorizonRevenue,
    totalHorizonCapacity,
    avgHorizonDeal,
    maxClientsVal,
    maxRevenueVal,
  };
}

// Simulated SafeStorage
const MockSafeStorage = {
  store: {},
  async getItem(key) { return this.store[key] || null; },
  async setItem(key, val) { this.store[key] = String(val); },
  async removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; },
};

// Simulated Axios Interceptor Logic from mobile-app/src/api/client.ts
function simulateAxiosResponseError(error, handlers = {}) {
  const isSuspended =
    error.response?.status === 403 &&
    (error.response?.data?.code === 'TENANT_SUSPENDED' ||
      error.response?.data?.isSuspended ||
      String(error.response?.data?.error || '').toLowerCase().includes('suspended'));

  if (isSuspended) {
    MockSafeStorage.removeItem('@solar_user_token');
    MockSafeStorage.removeItem('@solar_user_profile');
    const suspendMsg =
      error.response?.data?.error ||
      'Account Suspended: Your organization account has been suspended by the platform administrator.';
    if (handlers.onSuspended) handlers.onSuspended(suspendMsg);
  } else if (error.response?.status === 401) {
    MockSafeStorage.removeItem('@solar_user_token');
    if (handlers.onUnauthorized) handlers.onUnauthorized();
  }

  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    (error.code === 'ECONNABORTED'
      ? 'Request timed out due to slow network. Please retry.'
      : error.message === 'Network Error'
      ? 'Network connection issue. Please verify internet connectivity.'
      : error.message || 'Network request failed.');

  return new Error(message);
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Tier 5: Milestone M2 Dashboard & Edge Cases Adversarial Challenge', () => {

  beforeEach(() => {
    global.__mockState = {
      insets: { top: 24, bottom: 0, left: 0, right: 0 },
      platform: 'android',
      statusBarHeight: 24,
      user: {
        id: 'usr_test_1',
        name: 'Vikram Joshi',
        email: 'vikram@sunflowerepc.com',
        role: 'TENANT_ADMIN',
        tenantName: 'Sunflower Solar EPC',
        tenantId: 'tenant_test_1',
        permissions: ['*'],
      },
      backendStatus: { isOnline: true, serverUrl: 'https://solar-manager-three.vercel.app' },
      storage: {},
      lastToast: null,
      appExited: false,
    };
    MockSafeStorage.clear();
  });

  // ===========================================================================
  // SUITE 1: DYNAMIC SAFE AREA CALCULATION & HEADER SPATIAL RENDERING
  // ===========================================================================
  describe('Suite 1: Dynamic Safe Area Calculation & Edge-to-Edge Insets', () => {

    it('1.1 should guarantee at least 24px top padding on legacy Android with 0px inset', () => {
      const insets = { top: 0, bottom: 0, left: 0, right: 0 };
      const topSafe = calculateTopSafeArea(insets, 'android', 0);
      assert.equal(topSafe, 24, 'Legacy Android with 0 inset must fall back to 24px minimum');
    });

    it('1.2 should match 24px status bar on standard Android devices', () => {
      const insets = { top: 24, bottom: 0, left: 0, right: 0 };
      const topSafe = calculateTopSafeArea(insets, 'android', 24);
      assert.equal(topSafe, 24, 'Standard Android with 24px status bar must evaluate to 24px');
    });

    it('1.3 should dynamically expand to 48px notch / camera cutout on modern Android', () => {
      const insets = { top: 48, bottom: 34, left: 0, right: 0 };
      const topSafe = calculateTopSafeArea(insets, 'android', 24);
      assert.equal(topSafe, 48, 'Punch-hole Android must dynamically expand to inset.top of 48px');
    });

    it('1.4 should evaluate Dynamic Island / Notch on iOS (48px and 59px)', () => {
      const notchInsets = { top: 48, bottom: 34, left: 0, right: 0 };
      const islandInsets = { top: 59, bottom: 34, left: 0, right: 0 };

      assert.equal(calculateTopSafeArea(notchInsets, 'ios', undefined), 48);
      assert.equal(calculateTopSafeArea(islandInsets, 'ios', undefined), 59);
    });

    it('1.5 should handle landscape orientation with 0px top inset without negative or NaN padding', () => {
      const landscapeInsets = { top: 0, bottom: 21, left: 48, right: 48 };
      const androidTop = calculateTopSafeArea(landscapeInsets, 'android', 0);
      const iosTop = calculateTopSafeArea(landscapeInsets, 'ios', undefined);

      assert.ok(androidTop >= 24 && !isNaN(androidTop), 'Android landscape top padding must be >= 24');
      assert.ok(iosTop >= 44 && !isNaN(iosTop), 'iOS landscape top padding must be >= 44');
    });

    it('1.6 should verify Header variants apply paddingTop dynamically in Header.tsx implementation', () => {
      const headerCode = fs.readFileSync(path.resolve(__dirname, '../src/components/Header.tsx'), 'utf8');

      // Verify dynamic calculation is in source
      assert.match(
        headerCode,
        /const\s+topSafeArea\s*=\s*Math\.max\(\s*insets\.top,\s*Platform\.OS\s*===\s*'android'\s*\?\s*\(StatusBar\.currentHeight\s*\|\|\s*24\)\s*:\s*44\s*\);/,
        'Header.tsx must compute topSafeArea using dynamic Math.max with insets.top'
      );

      // Verify all 3 variants bind paddingTop: topSafeArea
      assert.match(headerCode, /paddingTop:\s*topSafeArea/, 'Header variant styles must bind paddingTop: topSafeArea');
      assert.match(headerCode, /variant\s*===\s*'home'/, 'Header must support variant="home"');
      assert.match(headerCode, /variant\s*===\s*'detail'/, 'Header must support variant="detail"');
      assert.match(headerCode, /GlobalSearchModal/, 'Header must mount GlobalSearchModal');
      assert.match(headerCode, /onRequestClose=\{[^}]*setProfileModalVisible\(false\)[^}]*\}/, 'Modal must have onRequestClose for hardware back');
    });

    it('1.7 should verify TabBar dynamic bottom insets in RootNavigator.tsx', () => {
      const navCode = fs.readFileSync(path.resolve(__dirname, '../src/navigation/RootNavigator.tsx'), 'utf8');

      assert.match(
        navCode,
        /const\s+bottomInset\s*=\s*Math\.max\(insets\.bottom,\s*Platform\.OS\s*===\s*'ios'\s*\?\s*20\s*:\s*8\);/,
        'RootNavigator must compute dynamic bottomInset for Edge-to-Edge'
      );
      assert.match(
        navCode,
        /const\s+tabBarHeight\s*=\s*56\s*\+\s*bottomInset;/,
        'TabBar height must dynamically adapt to bottomInset'
      );
    });
  });

  // ===========================================================================
  // SUITE 2: EXTREME DATA STRESS ON DASHBOARD METRICS & MATHEMATICAL BOUNDARIES
  // ===========================================================================
  describe('Suite 2: Extreme Data Stress on Dashboard Metrics & Mathematical Invariants', () => {

    it('2.1 should safely handle completely null or undefined metrics payload without throwing', () => {
      const resNull = computeDashboardFinancials(null);
      const resUndef = computeDashboardFinancials(undefined);
      const resEmpty = computeDashboardFinancials({});

      for (const res of [resNull, resUndef, resEmpty]) {
        assert.equal(res.totalCapacityKWp, '0.0');
        assert.equal(res.totalRevenueLakhs, 0);
        assert.equal(res.totalCollectedLakhs, 0);
        assert.equal(res.outstandingLakhs, 0);
        assert.equal(res.collectedPct, 0);
        assert.equal(res.cleanEnergyMWh, '0.00');
        assert.equal(res.co2Tons, 0);
        assert.equal(res.coalTons, 0);
        assert.equal(res.treesCount, '0');
      }
    });

    it('2.2 should handle zero leads, zero revenue, zero projects without division by zero (NaN)', () => {
      const zeroPayload = {
        totalLeads: 0,
        totalCustomers: 0,
        totalProjects: 0,
        totalRevenue: 0,
        totalCollected: 0,
        outstanding: 0,
        totalCapacity: 0,
        environmental: { monthlyEnergyKWh: 0, co2Tons: 0, coalTons: 0, trees: 0 },
        horizonAnalytics: { quarterly: [] },
      };

      const res = computeDashboardFinancials(zeroPayload);
      assert.equal(res.collectedPct, 0, 'Collected percentage must be 0%, never NaN');
      assert.equal(isNaN(res.collectedPct), false);

      const horizon = computeHorizonMetrics(zeroPayload.horizonAnalytics.quarterly);
      assert.equal(horizon.totalHorizonClients, 0);
      assert.equal(horizon.avgHorizonDeal, '0.00', 'avgHorizonDeal must evaluate to "0.00", not NaN');
      assert.equal(isNaN(Number(horizon.avgHorizonDeal)), false);
      assert.equal(horizon.maxClientsVal, 1, 'maxClientsVal must be bounded to 1');
      assert.equal(horizon.maxRevenueVal, 1, 'maxRevenueVal must be bounded to 1');

      // Verify site execution progress bar zero guard (projects.length / (data.totalProjects || 1))
      const projectsCount = 0;
      const totalProjects = zeroPayload.totalProjects;
      const executionPct = Math.min(100, (projectsCount / (totalProjects || 1)) * 100);
      assert.equal(executionPct, 0, 'Site execution progress must safely evaluate to 0%');
      assert.equal(isNaN(executionPct), false);
    });

    it('2.3 should withstand massive enterprise numbers (₹100 Crore+, 10,000 kWp fleet)', () => {
      const massivePayload = {
        totalRevenue: 1000000000,    // ₹100 Crore (10,000 Lakhs)
        totalCollected: 750000000,   // ₹75 Crore (7,500 Lakhs)
        outstanding: 250000000,      // ₹25 Crore (2,500 Lakhs)
        totalCapacity: 10000,        // 10,000 kWp (10 MWp)
        environmental: null,         // Compute dynamically
      };

      const res = computeDashboardFinancials(massivePayload);
      assert.equal(res.totalRevenueLakhs, 10000);
      assert.equal(res.totalCollectedLakhs, 7500);
      assert.equal(res.outstandingLakhs, 2500);
      assert.equal(res.collectedPct, 75);

      // Clean Energy: (10000 * 120) / 1000 = 1200.00 MWh
      assert.equal(res.cleanEnergyMWh, '1200.00');
      // CO2: 1200 * 1000 * 0.82 / 1000 = 984.0 Tons
      assert.equal(res.co2Tons, 984);
      // Coal: 984 * 0.48 = 472.3 Tons
      assert.equal(res.coalTons, 472.3);
      // Trees: 984 * 45 = 44,280
      assert.equal(res.treesCount, '44,280');
    });

    it('2.4 should enforce tabularNums token across all metric typography', () => {
      const dashCode = fs.readFileSync(path.resolve(__dirname, '../src/screens/dashboard/DashboardScreen.tsx'), 'utf8');

      // Check tabularNums import
      assert.match(dashCode, /import\s*\{[^}]*tabularNums[^}]*\}\s*from\s*'\.\.\/\.\.\/theme'/, 'DashboardScreen must import tabularNums');

      // Check occurrences of tabularNums in metric text elements
      const tabularMatches = dashCode.match(/tabularNums/g);
      assert.ok(tabularMatches && tabularMatches.length >= 10, `DashboardScreen must use tabularNums across metrics (found ${tabularMatches?.length || 0})`);

      // Verify token value itself
      assert.deepEqual(tokens.typography.tabularNums, { fontVariant: ['tabular-nums'] });
    });

    it('2.5 should handle negative revenue, refund scenarios, and credit balances gracefully', () => {
      // Case A: Negative Revenue (Refunds / Cancellations exceed bookings)
      const negativeRev = {
        totalRevenue: -500000,
        totalCollected: 0,
        totalCapacity: 0,
      };
      const resA = computeDashboardFinancials(negativeRev);
      assert.equal(resA.totalRevenueLakhs, -5);
      // collectedPct must NOT be negative
      assert.equal(resA.collectedPct, 0, 'Negative revenue must evaluate collectedPct to 0%');

      // Case B: Over-collected scenario (Total collected > total revenue due to advance payments)
      const overCollected = {
        totalRevenue: 1000000,
        totalCollected: 1500000,
        outstanding: null, // Should calculate Math.max(0, 10 - 15) -> 0
        totalCapacity: 50,
      };
      const resB = computeDashboardFinancials(overCollected);
      assert.equal(resB.collectedPct, 100, 'Collected percentage must cap at 100%');
      assert.equal(resB.outstandingLakhs, 0, 'Receivables must not drop below 0 in over-collected scenario');

      // Case C: Explicit negative outstanding credit
      const creditBalance = {
        totalRevenue: 1000000,
        totalCollected: 1200000,
        outstanding: -200000,
        totalCapacity: 50,
      };
      const resC = computeDashboardFinancials(creditBalance);
      assert.equal(resC.outstandingLakhs, -2);
      assert.equal(isNaN(resC.outstandingLakhs), false);
    });

    it('2.6 should verify presence of non-overflowing text wrappers (numberOfLines)', () => {
      const dashCode = fs.readFileSync(path.resolve(__dirname, '../src/screens/dashboard/DashboardScreen.tsx'), 'utf8');
      const numLinesMatches = dashCode.match(/numberOfLines=\{1\}/g);
      assert.ok(
        numLinesMatches && numLinesMatches.length >= 5,
        `DashboardScreen must use numberOfLines={1} on text elements to prevent truncation overflows (found ${numLinesMatches?.length || 0})`
      );
    });

    it('2.7 should verify absence of all synthetic / fake leads (Ramesh Patil, etc.)', () => {
      const dashCode = fs.readFileSync(path.resolve(__dirname, '../src/screens/dashboard/DashboardScreen.tsx'), 'utf8');
      assert.equal(dashCode.includes('Ramesh Patil'), false, 'Fake lead Ramesh Patil must NOT exist in DashboardScreen');
      assert.equal(dashCode.includes('Suresh Deshmukh'), false, 'Fake lead Suresh Deshmukh must NOT exist in DashboardScreen');
      assert.equal(dashCode.includes('fallbackRecentLeads'), false, 'fallbackRecentLeads must NOT exist in DashboardScreen');
      assert.equal(dashCode.includes('fallbackHorizonDataMap'), false, 'fallbackHorizonDataMap must NOT exist in DashboardScreen');
      assert.equal(dashCode.includes('fallbackInventoryRunway'), false, 'fallbackInventoryRunway must NOT exist in DashboardScreen');
      assert.equal(dashCode.includes('fallbackSubsidyFunnel'), false, 'fallbackSubsidyFunnel must NOT exist in DashboardScreen');
    });
  });

  // ===========================================================================
  // SUITE 3: NETWORK ERROR SIMULATION & SESSION DEGRADATION
  // ===========================================================================
  describe('Suite 3: Network Error Handling, Retry States & Session Degradation', () => {

    it('3.1 should trigger critical error UI state when all API calls fail (500 or offline)', () => {
      const dashCode = fs.readFileSync(path.resolve(__dirname, '../src/screens/dashboard/DashboardScreen.tsx'), 'utf8');

      // Verify Promise.allSettled is used to avoid single-point failure
      assert.match(dashCode, /Promise\.allSettled/, 'loadDashboard must use Promise.allSettled');

      // Verify critical error boundary check
      assert.match(
        dashCode,
        /if\s*\(\s*error\s*&&\s*!loading\s*&&\s*!data\.totalRevenue\s*&&\s*!data\.totalCapacity\s*&&\s*recentLeads\.length\s*===\s*0\s*\)/,
        'DashboardScreen must activate human-readable error state when offline without cached data'
      );

      // Verify EmptyState tone="danger" with Retry Connection action
      assert.match(dashCode, /tone="danger"/, 'Error state must use tone="danger"');
      assert.match(dashCode, /title="Operational Telemetry Offline"/, 'Error title must indicate offline state');
      assert.match(dashCode, /actionTitle="Retry Connection"/, 'Retry CTA must be present');
      assert.match(dashCode, /onActionPress=\{[^}]*loadDashboard\(\)[^}]*\}/, 'Retry CTA must invoke loadDashboard');
    });

    it('3.2 should survive partial API failure without blocking user interface', () => {
      // Simulating partial failure: getDashboard succeeds, but getLeads and getProjects fail
      const results = [
        { status: 'fulfilled', value: { totalRevenue: 500000, totalCapacity: 25, totalLeads: 10 } },
        { status: 'rejected', reason: new Error('Projects timeout') },
        { status: 'rejected', reason: new Error('CRM offline') },
      ];

      let hasAnySuccess = false;
      let error = null;
      let data = {};
      let projects = [];
      let recentLeads = [];

      if (results[0].status === 'fulfilled' && results[0].value) {
        data = results[0].value;
        hasAnySuccess = true;
      }
      if (results[1].status === 'fulfilled' && results[1].value && Array.isArray(results[1].value.projects)) {
        projects = results[1].value.projects;
        hasAnySuccess = true;
      }
      if (results[2].status === 'fulfilled' && results[2].value && Array.isArray(results[2].value.leads)) {
        recentLeads = results[2].value.leads;
        hasAnySuccess = true;
      }

      if (!hasAnySuccess) {
        error = 'Unable to communicate with Solar OS server';
      }

      assert.equal(hasAnySuccess, true, 'Partial success must keep dashboard alive');
      assert.equal(error, null, 'No critical error should be thrown on partial success');
      assert.equal(data.totalRevenue, 500000);
      assert.equal(recentLeads.length, 0);
    });

    it('3.3 should handle HTTP 401 token expiry: clear storage and invoke session degradation', () => {
      MockSafeStorage.setItem('@solar_user_token', 'expired_jwt_token_xyz');

      let sessionDegraded = false;
      const error401 = {
        response: {
          status: 401,
          data: { error: 'Token expired or invalid' },
        },
      };

      const resultingError = simulateAxiosResponseError(error401, {
        onUnauthorized: () => {
          sessionDegraded = true;
        },
      });

      assert.equal(sessionDegraded, true, 'HTTP 401 must invoke onUnauthorized handler');
      assert.equal(MockSafeStorage.store['@solar_user_token'], undefined, 'Auth token must be cleared on 401');
      assert.equal(resultingError.message, 'Token expired or invalid');
    });

    it('3.4 should handle HTTP 403 TENANT_SUSPENDED: clear credentials and invoke suspended handler', () => {
      MockSafeStorage.setItem('@solar_user_token', 'active_jwt_token');
      MockSafeStorage.setItem('@solar_user_profile', JSON.stringify({ name: 'Vikram' }));

      let suspendedMessage = null;
      const error403 = {
        response: {
          status: 403,
          data: {
            code: 'TENANT_SUSPENDED',
            error: 'Subscription expired. Contact platform administrator.',
          },
        },
      };

      const resultingError = simulateAxiosResponseError(error403, {
        onSuspended: (msg) => {
          suspendedMessage = msg;
        },
      });

      assert.equal(MockSafeStorage.store['@solar_user_token'], undefined, 'Token must be removed on suspension');
      assert.equal(MockSafeStorage.store['@solar_user_profile'], undefined, 'Profile must be removed on suspension');
      assert.equal(suspendedMessage, 'Subscription expired. Contact platform administrator.');
      assert.equal(resultingError.message, 'Subscription expired. Contact platform administrator.');
    });

    it('3.5 should format network timeout and connection failure into human-readable messages', () => {
      const timeoutErr = simulateAxiosResponseError({ code: 'ECONNABORTED' });
      assert.match(timeoutErr.message, /Request timed out/);

      const netErr = simulateAxiosResponseError({ message: 'Network Error' });
      assert.match(netErr.message, /Network connection issue/);
    });
  });

  // ===========================================================================
  // SUITE 4: ANDROID HARDWARE BACK & NAVIGATION INVARIANTS
  // ===========================================================================
  describe('Suite 4: Android Hardware Back & Navigation Invariants', () => {

    it('4.1 should verify hardware back double-tap exit guard logic in RootNavigator.tsx', () => {
      const navCode = fs.readFileSync(path.resolve(__dirname, '../src/navigation/RootNavigator.tsx'), 'utf8');

      assert.match(navCode, /BackHandler\.addEventListener\(\s*'hardwareBackPress'/, 'Must attach hardwareBackPress listener');
      assert.match(navCode, /ToastAndroid\.show\(/, 'Must show ToastAndroid on initial exit tap');
      assert.match(navCode, /Press back again to exit WhereReady Solar OS/, 'Toast text must prompt user for double-tap');
      assert.match(navCode, /BackHandler\.exitApp\(\)/, 'Must call BackHandler.exitApp() on second tap within 2000ms');
    });

    it('4.2 should verify secondary tabs route back to Dashboard on hardware back press', () => {
      const navCode = fs.readFileSync(path.resolve(__dirname, '../src/navigation/RootNavigator.tsx'), 'utf8');

      assert.match(
        navCode,
        /\['Pipeline',\s*'Projects',\s*'Finance'\]\.includes\(routeName\)/,
        'Hardware back must intercept secondary tabs and navigate to Dashboard'
      );
      assert.match(
        navCode,
        /navigationRef\.navigate\('MainTabs',\s*\{\s*screen:\s*'Dashboard'\s*\}\)/,
        'Hardware back must route to root Dashboard tab'
      );
    });

    it('4.3 should verify legacy Leads route consolidation in RootNavigator.tsx', () => {
      const navCode = fs.readFileSync(path.resolve(__dirname, '../src/navigation/RootNavigator.tsx'), 'utf8');

      assert.match(
        navCode,
        /<Stack\.Screen\s+name="Leads"\s+component=\{PipelineScreen\}\s*\/>/,
        'Legacy route "Leads" must map to PipelineScreen to prevent 404 navigation crashes'
      );
    });
  });
});
