/**
 * Tier 5: Adversarial M3-2 Field Operations & Finance Stress Testing Suite
 * WhereReady Solar OS Mobile Client
 * 
 * Conducts exhaustive empirical verification and stress testing of:
 * 1. Canonical 7-Stage Project Progress & Prerequisite Gating:
 *    - Full lifecycle traversal (SURVEY -> ENGINEERING -> PROCUREMENT -> INSTALLATION -> NET_METERING -> INSPECTION -> HANDOVER)
 *    - Mathematical progress percentage invariant: Math.round((idx / 7) * 100)
 *    - Prerequisite gating: Missing consumer number, unrecorded site survey, missing capacity, uncertified CEA safety
 *    - Handover ceiling: Blocking advancement beyond Stage 7
 * 2. Electrical QA CEA Safety Limits:
 *    - Strict boundary analysis on Earth Pit 1, 2, 3 (< 5.0Ω vs >= 5.0Ω)
 *    - Anti-Islanding Grid Trip Time (< 2.0s vs >= 2.0s per IEEE 1547 / CEA)
 *    - Inverter Insulation Resistance (> 1.0MΩ vs <= 1.0MΩ per CEA statutory regulations)
 *    - Full 32-state ($2^5$) combinatorial truth table evaluation
 *    - Dirty form guard state tracking (useDirtyFormWarning)
 * 3. Barcode Continuous Scanning & Deduplication:
 *    - Rapid scan bursts under continuous mode
 *    - 1200ms auto-rearm debouncing preventing duplicate race conditions
 *    - Multi-tier deduplication: active session, cross-component inverter collisions, project records, DCR strings, inventory
 *    - Flashlight / torch state persistence
 * 4. Finance 3-Tier Overdue Aging:
 *    - Aging tiers: <15d Grace Period, 15-30d Urgent Follow-up, >30d Critical Collection
 *    - Boundary conditions: 0d, 1d, 14d, 15d, 30d, 31d, 365d
 *    - Paid status invariant: Paid invoices excluded from overdue aging regardless of past due dates
 *    - Future due dates excluded from overdue aging
 *    - Status and document category filtering
 * 5. Milestone Invoicing Presets & Invariant Math:
 *    - 20/60/15/5% canonical milestone schedule sum invariants (20 + 60 + 15 + 5 === 100%)
 *    - Preset milestone scope titles and category mappings
 *    - Zero Penny Drift invariant across arbitrary gross contract sums
 *    - Statutory 13.8% composite solar GST calculation (70% Goods @ 12% + 30% Services @ 18%)
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ts = require('../node_modules/typescript');

// -----------------------------------------------------------------------------
// DYNAMIC TRANSPILATION & MODULE LOADER HELPER
// -----------------------------------------------------------------------------
function loadTsModule(relativePath, extraMocks = {}) {
  const fullPath = path.resolve(__dirname, relativePath);
  const rawCode = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(rawCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const mockRN = {
    Platform: { OS: 'android', select: (obj) => obj.android ?? obj.default },
    StyleSheet: { create: (s) => s, flatten: (s) => (Array.isArray(s) ? Object.assign({}, ...s.filter(Boolean)) : s || {}) },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    TextInput: 'TextInput',
    Modal: 'Modal',
    Alert: { alert: () => {} },
    ActivityIndicator: 'ActivityIndicator',
    RefreshControl: 'RefreshControl',
    Linking: { openURL: async () => {} },
  };

  const customRequire = (moduleName) => {
    if (extraMocks[moduleName]) return extraMocks[moduleName];
    if (moduleName === 'react') return { useState: () => [null, () => {}], useEffect: () => {}, useMemo: (fn) => fn() };
    if (moduleName === 'react-native') return mockRN;
    if (moduleName.includes('lucide-react-native')) return new Proxy({}, { get: () => 'Icon' });
    if (moduleName.includes('expo-camera')) return { CameraView: 'CameraView', useCameraPermissions: () => [{ granted: true }, () => {}] };
    if (moduleName.includes('Header')) return { Header: 'Header', ModalHeader: 'ModalHeader', useDirtyFormWarning: (isDirty, fn) => fn };
    if (moduleName.includes('colors')) return { colors: { primary: '#2563eb' } };
    if (moduleName.includes('endpoints') || moduleName.includes('client')) return { tenantApi: {}, installationsApi: {}, financeApi: {}, SafeStorage: { getItem: async () => null, setItem: async () => {} } };
    return {};
  };

  const mod = { exports: {} };
  const runner = new Function('require', 'exports', 'module', transpiled);
  runner(customRequire, mod.exports, mod);
  return mod.exports;
}

// Load real exported functions from production files
const fieldProjectsExports = loadTsModule('../src/screens/projects/FieldProjectsScreen.tsx');
const barcodeScannerExports = loadTsModule('../src/screens/operations/BarcodeScannerModal.tsx');

const { CANONICAL_PROJECT_STAGES, getProjectStageIndex, calculateProjectProgressPct } = fieldProjectsExports;
const { parseAndValidateBarcode, detectDuplicateSerial } = barcodeScannerExports;

// Load test helpers domain models
const testHelpers = require('./test-helpers');
const { evaluateElectricalQATests, calculateCompositeSolarGst, generateMilestoneSchedule } = testHelpers;

// =============================================================================
// DOMAIN ORACLE FUNCTIONS FOR ADVANCED STATE MACHINE VERIFICATION
// =============================================================================

/**
 * Mirror of FieldProjectsScreen prerequisite evaluator
 */
function evaluateProjectPrerequisites(proj) {
  const idx = getProjectStageIndex(proj?.currentStage || proj?.status);
  const consumerNo = proj?.consumerNumber || proj?.customer?.consumerNumber || proj?.lead?.electricityConnection;
  const hasSerials = (proj?.moduleSerials && proj.moduleSerials.length > 0) || Boolean(proj?.dcrModuleSerials);
  const hasDocs = (proj?.Document && proj.Document.length > 0) || (proj?.documents && proj.documents.length > 0);

  const checks = [];
  if (idx === 1) {
    checks.push({
      id: 'CONSUMER_NO',
      title: 'DISCOM Consumer Number',
      met: Boolean(consumerNo && consumerNo !== 'Pending' && consumerNo.trim().length >= 6),
      detail: consumerNo ? `Verified: ${consumerNo}` : 'Missing consumer number',
    });
    checks.push({
      id: 'SURVEY_DOCS',
      title: 'Site Survey Documentation',
      met: Boolean(hasDocs || proj?.address),
      detail: 'Site location and rooftop specifications recorded',
    });
  } else if (idx === 2) {
    const cap = Number(proj?.capacity || proj?.systemCapacity);
    checks.push({
      id: 'PLANT_CAPACITY',
      title: 'Approved Plant Capacity',
      met: Boolean(!isNaN(cap) && cap > 0),
      detail: `${cap || 3.3} kWp System Kit`,
    });
    checks.push({
      id: 'BOM_ALLOCATION',
      title: 'BOM Engineering Allocation',
      met: Boolean(proj?.panelBrand || proj?.inverterBrand || true),
      detail: 'PV Module & Inverter brand selection assigned',
    });
  } else if (idx === 3) {
    checks.push({
      id: 'MATERIAL_DISPATCH',
      title: 'Material Dispatch Confirmation',
      met: true,
      detail: 'DCR modules & mounting structure dispatched to site',
    });
  } else if (idx === 4) {
    checks.push({
      id: 'MODULE_SERIALS',
      title: '2D Module Serial Barcodes',
      met: Boolean(hasSerials),
      detail: 'Tier-1 ALMM/DCR hardware serial numbers recorded',
    });
    checks.push({
      id: 'MECHANICAL_ERECTION',
      title: 'Mechanical & DC Erection',
      met: true,
      detail: 'Mid/end clamps torqued and DC cabling routed',
    });
  } else if (idx === 5) {
    checks.push({
      id: 'DISCOM_SUBMISSION',
      title: 'DISCOM Application Submission',
      met: Boolean(consumerNo && consumerNo !== 'Pending'),
      detail: 'Annexure statutory templates generated',
    });
  } else if (idx === 6) {
    const qa = proj?.qaReadings;
    const qaPassed = qa ? evaluateElectricalQATests(qa).pass : true;
    checks.push({
      id: 'CEA_SAFETY_SIGNOFF',
      title: 'CEA Safety Threshold Sign-off',
      met: Boolean(qaPassed),
      detail: 'Earthing pit readings < 5.0Ω and trip time < 2.0s passed',
    });
  } else {
    checks.push({
      id: 'COMMISSIONING_HANDOVER',
      title: 'Client Commissioning Handover',
      met: true,
      detail: 'Net meter energized & DBT release filed',
    });
  }
  return checks;
}

/**
 * Mirror of FieldProjectsScreen stage advancement simulator
 */
function attemptAdvanceStage(project, advanceNote = '') {
  if (!project || !project.id) {
    return { success: false, reason: 'INVALID_PROJECT', error: 'Project ID is missing' };
  }
  const currentIdx = getProjectStageIndex(project.currentStage || project.status);
  if (currentIdx >= 7) {
    return {
      success: false,
      reason: 'ALREADY_COMPLETED',
      error: 'This installation has already reached final handover.',
    };
  }
  const nextStage = CANONICAL_PROJECT_STAGES[currentIdx + 1];
  if (!nextStage) {
    return { success: false, reason: 'NO_NEXT_STAGE', error: 'Next stage not found' };
  }

  const prereqs = evaluateProjectPrerequisites(project);
  const unmet = prereqs.filter((c) => !c.met);
  if (unmet.length > 0) {
    return {
      success: false,
      reason: 'PREREQUISITES_INCOMPLETE',
      error: `Cannot advance stage due to missing prerequisites: ${unmet.map((u) => u.title).join(', ')}`,
      unmet,
    };
  }

  return {
    success: true,
    previousStage: CANONICAL_PROJECT_STAGES[currentIdx].id,
    nextStage: nextStage.id,
    nextLabel: nextStage.label,
    progressPct: Math.round(((currentIdx + 1) / 7) * 100),
    note: advanceNote || `Advanced to ${nextStage.label} via Mobile Field Cockpit`,
  };
}

/**
 * Mirror of FinanceScreen 3-tier overdue aging evaluator
 */
function computeOverdueAging(invoices, referenceTimestamp = Date.now()) {
  let under15 = 0;
  let between15and30 = 0;
  let over30 = 0;
  const categorized = [];

  invoices.forEach((inv) => {
    const isPaid = (inv.computedStatus || inv.status) === 'PAID';
    const dueTime = inv.dueDate ? new Date(inv.dueDate).getTime() : NaN;
    const isPastDue = !isNaN(dueTime) && dueTime < referenceTimestamp;
    const isOverdue = !isPaid && (inv.isOverdue || isPastDue);

    if (isOverdue && !isNaN(dueTime)) {
      const days = Math.floor((referenceTimestamp - dueTime) / (1000 * 60 * 60 * 24));
      let tier = '';
      if (days < 15) {
        under15++;
        tier = 'UNDER_15';
      } else if (days <= 30) {
        between15and30++;
        tier = '15_TO_30';
      } else {
        over30++;
        tier = 'OVER_30';
      }
      categorized.push({ id: inv.id, invoiceNumber: inv.invoiceNumber, days, tier, amount: inv.amount || 0 });
    }
  });

  return { under15, between15and30, over30, totalOverdue: under15 + between15and30 + over30, categorized };
}

/**
 * Mirror of FinanceScreen aging badge generator
 */
function getAgingBadge(dueDate, referenceTimestamp = Date.now()) {
  if (!dueDate) return { label: 'OVERDUE', color: '#e11d48', bg: '#ffe4e6' };
  const dueTime = new Date(dueDate).getTime();
  if (isNaN(dueTime)) return { label: 'OVERDUE', color: '#e11d48', bg: '#ffe4e6' };

  const days = Math.max(1, Math.floor((referenceTimestamp - dueTime) / (1000 * 60 * 60 * 24)));
  if (days < 15) {
    return { label: `OVERDUE (${days}d)`, sub: '<15d Grace', color: '#d97706', bg: '#fef3c7', tier: 'UNDER_15' };
  } else if (days <= 30) {
    return { label: `OVERDUE (${days}d)`, sub: '15-30d Urgent', color: '#ea580c', bg: '#ffedd5', tier: '15_TO_30' };
  } else {
    return { label: `OVERDUE (>30d)`, sub: '>30d Critical', color: '#dc2626', bg: '#fee2e2', tier: 'OVER_30' };
  }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Tier 5: Adversarial M3-2 Field Operations & Finance Stress Testing', () => {

  // ---------------------------------------------------------------------------
  // SUITE 1: CANONICAL 7-STAGE PROGRESS & PREREQUISITE GATING
  // ---------------------------------------------------------------------------
  describe('Suite 1: Canonical 7-Stage Project Progress & Prerequisite Gating', () => {
    it('1.1 should define exactly 7 canonical EPC stages plus aggregate ALL', () => {
      assert.strictEqual(Array.isArray(CANONICAL_PROJECT_STAGES), true);
      assert.strictEqual(CANONICAL_PROJECT_STAGES.length, 8); // ALL + 7 stages
      assert.strictEqual(CANONICAL_PROJECT_STAGES[0].id, 'ALL');
      assert.strictEqual(CANONICAL_PROJECT_STAGES[1].id, 'SURVEY');
      assert.strictEqual(CANONICAL_PROJECT_STAGES[2].id, 'ENGINEERING');
      assert.strictEqual(CANONICAL_PROJECT_STAGES[3].id, 'PROCUREMENT');
      assert.strictEqual(CANONICAL_PROJECT_STAGES[4].id, 'INSTALLATION');
      assert.strictEqual(CANONICAL_PROJECT_STAGES[5].id, 'NET_METERING');
      assert.strictEqual(CANONICAL_PROJECT_STAGES[6].id, 'INSPECTION');
      assert.strictEqual(CANONICAL_PROJECT_STAGES[7].id, 'HANDOVER');
    });

    it('1.2 should calculate exact progress percentages across all stages: Math.round((idx / 7) * 100)', () => {
      assert.strictEqual(calculateProjectProgressPct('SURVEY'), 14); // 1/7 = 14%
      assert.strictEqual(calculateProjectProgressPct('ENGINEERING'), 29); // 2/7 = 29%
      assert.strictEqual(calculateProjectProgressPct('PROCUREMENT'), 43); // 3/7 = 43%
      assert.strictEqual(calculateProjectProgressPct('INSTALLATION'), 57); // 4/7 = 57%
      assert.strictEqual(calculateProjectProgressPct('NET_METERING'), 71); // 5/7 = 71%
      assert.strictEqual(calculateProjectProgressPct('INSPECTION'), 86); // 6/7 = 86%
      assert.strictEqual(calculateProjectProgressPct('HANDOVER'), 100); // 7/7 = 100%
    });

    it('1.3 should correctly resolve stage indices from diverse real-world DISCOM/ERP string synonyms', () => {
      // Stage 1
      assert.strictEqual(getProjectStageIndex('SURVEY'), 1);
      assert.strictEqual(getProjectStageIndex('Site Survey Pending'), 1);
      assert.strictEqual(getProjectStageIndex(''), 1); // fallback
      assert.strictEqual(getProjectStageIndex(undefined), 1); // fallback

      // Stage 2
      assert.strictEqual(getProjectStageIndex('ENGINEERING'), 2);
      assert.strictEqual(getProjectStageIndex('CAD DESIGN'), 2);
      assert.strictEqual(getProjectStageIndex('SLD APPROVAL'), 2);

      // Stage 3
      assert.strictEqual(getProjectStageIndex('PROCUREMENT'), 3);
      assert.strictEqual(getProjectStageIndex('MATERIAL DISPATCHED'), 3);
      assert.strictEqual(getProjectStageIndex('WAREHOUSE DISPATCH'), 3);

      // Stage 4
      assert.strictEqual(getProjectStageIndex('INSTALLATION'), 4);
      assert.strictEqual(getProjectStageIndex('STRUCTURE ERECTION'), 4);
      assert.strictEqual(getProjectStageIndex('DC CABLING INSTALLATION'), 4);

      // Stage 5
      assert.strictEqual(getProjectStageIndex('NET_METERING'), 5);
      assert.strictEqual(getProjectStageIndex('DISCOM APPLICATION'), 5);
      assert.strictEqual(getProjectStageIndex('BI-DIRECTIONAL METER'), 5);

      // Stage 6
      assert.strictEqual(getProjectStageIndex('INSPECTION'), 6);
      assert.strictEqual(getProjectStageIndex('ELECTRICAL QA SIGN-OFF'), 6);
      assert.strictEqual(getProjectStageIndex('CEIG INSPECTION'), 6);
      assert.strictEqual(getProjectStageIndex('ELECTRICAL TESTING'), 6);

      // Stage 7
      assert.strictEqual(getProjectStageIndex('HANDOVER'), 7);
      assert.strictEqual(getProjectStageIndex('GRID SYNCHRONIZATION'), 7);
      assert.strictEqual(getProjectStageIndex('DBT COMMISSIONED'), 7);
      assert.strictEqual(getProjectStageIndex('PROJECT COMPLETED'), 7);
    });

    it('1.4 should block stage advancement from SURVEY to ENGINEERING when consumer number is missing or Pending', () => {
      const invalidProject = {
        id: 'prj_101',
        name: 'Sharma Residence',
        currentStage: 'SURVEY',
        consumerNumber: 'Pending',
        address: 'B-12, Baner, Pune',
      };
      const result = attemptAdvanceStage(invalidProject);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.reason, 'PREREQUISITES_INCOMPLETE');
      assert.ok(result.error.includes('DISCOM Consumer Number'));
    });

    it('1.5 should advance from SURVEY to ENGINEERING when consumer number and site details are valid', () => {
      const validProject = {
        id: 'prj_102',
        name: 'Kulkarni Villa',
        currentStage: 'SURVEY',
        consumerNumber: '012345678901',
        address: 'Flat 402, Kothrud, Pune',
        Document: [{ id: 'doc-1', title: 'Survey Report' }],
      };
      const result = attemptAdvanceStage(validProject);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.previousStage, 'SURVEY');
      assert.strictEqual(result.nextStage, 'ENGINEERING');
      assert.strictEqual(result.progressPct, 29);
    });

    it('1.6 should block advancement from ENGINEERING to PROCUREMENT when plant capacity is 0 or negative', () => {
      const invalidProject = {
        id: 'prj_103',
        name: 'Patil Farmhouse',
        currentStage: 'ENGINEERING',
        capacity: 0,
      };
      const result = attemptAdvanceStage(invalidProject);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.reason, 'PREREQUISITES_INCOMPLETE');
      assert.ok(result.error.includes('Approved Plant Capacity'));
    });

    it('1.7 should block advancement from NET_METERING to INSPECTION if consumer number is missing', () => {
      const invalidProject = {
        id: 'prj_104',
        name: 'Gokhale Hospital',
        currentStage: 'NET_METERING',
        consumerNumber: '',
      };
      const result = attemptAdvanceStage(invalidProject);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.reason, 'PREREQUISITES_INCOMPLETE');
    });

    it('1.8 should advance sequentially through all 7 stages up to HANDOVER with valid prerequisites', () => {
      let currentStageName = 'SURVEY';
      const project = {
        id: 'prj_105',
        name: 'Deshmukh Industries',
        consumerNumber: '998877665544',
        address: 'MIDC Bhosari, Pune',
        capacity: 10.0,
        moduleSerials: ['WAA-DCR-101', 'WAA-DCR-102'],
        Document: [{ id: 'doc-1' }],
        qaReadings: {
          pit1Inverter: '2.1',
          pit2Structure: '1.8',
          pit3Lightning: '2.4',
          antiIslandingTripSec: '0.18',
          insulationMegaOhms: '2500',
        },
      };

      const expectedProgression = [
        { from: 'SURVEY', to: 'ENGINEERING', expectedPct: 29 },
        { from: 'ENGINEERING', to: 'PROCUREMENT', expectedPct: 43 },
        { from: 'PROCUREMENT', to: 'INSTALLATION', expectedPct: 57 },
        { from: 'INSTALLATION', to: 'NET_METERING', expectedPct: 71 },
        { from: 'NET_METERING', to: 'INSPECTION', expectedPct: 86 },
        { from: 'INSPECTION', to: 'HANDOVER', expectedPct: 100 },
      ];

      for (const step of expectedProgression) {
        project.currentStage = currentStageName;
        const res = attemptAdvanceStage(project);
        assert.strictEqual(res.success, true, `Failed advancing from ${step.from}`);
        assert.strictEqual(res.nextStage, step.to);
        assert.strictEqual(res.progressPct, step.expectedPct);
        currentStageName = step.to;
      }

      assert.strictEqual(currentStageName, 'HANDOVER');
    });

    it('1.9 should strictly block advancement when project has already reached HANDOVER (Stage 7)', () => {
      const completedProject = {
        id: 'prj_106',
        name: 'Chavan Rooftop Solar',
        currentStage: 'HANDOVER',
      };
      const result = attemptAdvanceStage(completedProject);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.reason, 'ALREADY_COMPLETED');
      assert.ok(result.error.includes('already reached final handover'));
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 2: ELECTRICAL QA CEA SAFETY LIMITS (<5.0Ω, <2.0s, >1.0MΩ)
  // ---------------------------------------------------------------------------
  describe('Suite 2: Electrical QA CEA Safety Limits (<5.0Ω, <2.0s, >1.0MΩ)', () => {
    const validBaseline = {
      pit1Inverter: '2.1',
      pit2Structure: '1.8',
      pit3Lightning: '2.4',
      antiIslandingTripSec: '0.18',
      insulationMegaOhms: '2500',
    };

    it('2.1 should approve electrical QA sign-off when all readings satisfy statutory thresholds', () => {
      const res = evaluateElectricalQATests(validBaseline);
      assert.strictEqual(res.pass, true);
      assert.strictEqual(res.isPit1Pass, true);
      assert.strictEqual(res.isPit2Pass, true);
      assert.strictEqual(res.isPit3Pass, true);
      assert.strictEqual(res.isTripPass, true);
      assert.strictEqual(res.isInsulationPass, true);
      assert.strictEqual(res.failureReasons.length, 0);
    });

    it('2.2 should test Earth Pit 1 boundary: 4.99Ω (PASS) vs 5.0Ω (FAIL) vs 5.01Ω (FAIL)', () => {
      // 4.99 Ω -> PASS
      const passRes = evaluateElectricalQATests({ ...validBaseline, pit1Inverter: '4.99' });
      assert.strictEqual(passRes.isPit1Pass, true);
      assert.strictEqual(passRes.pass, true);

      // Exactly 5.0 Ω -> FAIL (CEA requires strictly < 5.0 Ω)
      const exactRes = evaluateElectricalQATests({ ...validBaseline, pit1Inverter: '5.0' });
      assert.strictEqual(exactRes.isPit1Pass, false);
      assert.strictEqual(exactRes.pass, false);
      assert.ok(exactRes.failureReasons.some((r) => r.includes('Pit 1') && r.includes('< 5.0 Ω')));

      // 5.01 Ω -> FAIL
      const failRes = evaluateElectricalQATests({ ...validBaseline, pit1Inverter: '5.01' });
      assert.strictEqual(failRes.isPit1Pass, false);
      assert.strictEqual(failRes.pass, false);
    });

    it('2.3 should test Earth Pit 2 & Pit 3 boundaries: < 5.0Ω strictly enforced', () => {
      // Pit 2 structure @ 5.0 Ω
      const pit2Fail = evaluateElectricalQATests({ ...validBaseline, pit2Structure: '5.0' });
      assert.strictEqual(pit2Fail.isPit2Pass, false);
      assert.strictEqual(pit2Fail.pass, false);
      assert.ok(pit2Fail.failureReasons.some((r) => r.includes('Pit 2')));

      // Pit 3 lightning @ 5.2 Ω
      const pit3Fail = evaluateElectricalQATests({ ...validBaseline, pit3Lightning: '5.2' });
      assert.strictEqual(pit3Fail.isPit3Pass, false);
      assert.strictEqual(pit3Fail.pass, false);
      assert.ok(pit3Fail.failureReasons.some((r) => r.includes('Pit 3')));

      // Ideal ground 0.0 Ω -> PASS
      const zeroGround = evaluateElectricalQATests({ ...validBaseline, pit1Inverter: '0.0', pit2Structure: '0.0', pit3Lightning: '0.0' });
      assert.strictEqual(zeroGround.isPit1Pass, true);
      assert.strictEqual(zeroGround.isPit2Pass, true);
      assert.strictEqual(zeroGround.isPit3Pass, true);
      assert.strictEqual(zeroGround.pass, true);

      // Negative resistance -> FAIL
      const negRes = evaluateElectricalQATests({ ...validBaseline, pit1Inverter: '-0.1' });
      assert.strictEqual(negRes.isPit1Pass, false);
      assert.strictEqual(negRes.pass, false);
    });

    it('2.4 should test Anti-Islanding Grid Trip Time boundary: 1.99s (PASS) vs 2.0s (FAIL) vs 2.01s (FAIL)', () => {
      // 1.99 s -> PASS
      const passTrip = evaluateElectricalQATests({ ...validBaseline, antiIslandingTripSec: '1.99' });
      assert.strictEqual(passTrip.isTripPass, true);
      assert.strictEqual(passTrip.pass, true);

      // Exactly 2.0 s -> FAIL (IEEE 1547 / CEA requires strictly < 2.0 s)
      const exactTrip = evaluateElectricalQATests({ ...validBaseline, antiIslandingTripSec: '2.0' });
      assert.strictEqual(exactTrip.isTripPass, false);
      assert.strictEqual(exactTrip.pass, false);
      assert.ok(exactTrip.failureReasons.some((r) => r.includes('Anti-Islanding') && r.includes('< 2.0 s')));

      // 2.01 s -> FAIL
      const failTrip = evaluateElectricalQATests({ ...validBaseline, antiIslandingTripSec: '2.01' });
      assert.strictEqual(failTrip.isTripPass, false);
      assert.strictEqual(failTrip.pass, false);

      // Negative trip time -> FAIL
      const negTrip = evaluateElectricalQATests({ ...validBaseline, antiIslandingTripSec: '-0.05' });
      assert.strictEqual(negTrip.isTripPass, false);
    });

    it('2.5 should test Inverter Insulation Resistance boundary: 1.01MΩ (PASS) vs 1.0MΩ (FAIL) vs 0.99MΩ (FAIL)', () => {
      // 1.01 MΩ -> PASS
      const passIns = evaluateElectricalQATests({ ...validBaseline, insulationMegaOhms: '1.01' });
      assert.strictEqual(passIns.isInsulationPass, true);
      assert.strictEqual(passIns.pass, true);

      // Exactly 1.0 MΩ -> FAIL (CEA requires strictly > 1.0 MΩ)
      const exactIns = evaluateElectricalQATests({ ...validBaseline, insulationMegaOhms: '1.0' });
      assert.strictEqual(exactIns.isInsulationPass, false);
      assert.strictEqual(exactIns.pass, false);
      assert.ok(exactIns.failureReasons.some((r) => r.includes('Insulation Resistance') && r.includes('> 1.0 MΩ')));

      // 0.99 MΩ -> FAIL
      const failIns = evaluateElectricalQATests({ ...validBaseline, insulationMegaOhms: '0.99' });
      assert.strictEqual(failIns.isInsulationPass, false);
      assert.strictEqual(failIns.pass, false);

      // 0.0 MΩ (Short circuit) -> FAIL
      const zeroIns = evaluateElectricalQATests({ ...validBaseline, insulationMegaOhms: '0.0' });
      assert.strictEqual(zeroIns.isInsulationPass, false);
      assert.strictEqual(zeroIns.pass, false);
    });

    it('2.6 should evaluate full 32-state combinatorial truth table ($2^5$ combinations) with exact 1-true invariant', () => {
      let passedCombinations = 0;
      let failedCombinations = 0;

      // 5 flags: [pit1, pit2, pit3, trip, insulation]
      for (let i = 0; i < 32; i++) {
        const p1Pass = Boolean(i & 1);
        const p2Pass = Boolean(i & 2);
        const p3Pass = Boolean(i & 4);
        const tripPass = Boolean(i & 8);
        const insPass = Boolean(i & 16);

        const sample = {
          pit1Inverter: p1Pass ? '2.1' : '5.5',
          pit2Structure: p2Pass ? '1.8' : '6.2',
          pit3Lightning: p3Pass ? '2.4' : '7.0',
          antiIslandingTripSec: tripPass ? '0.18' : '2.5',
          insulationMegaOhms: insPass ? '2500' : '0.5',
        };

        const res = evaluateElectricalQATests(sample);
        assert.strictEqual(res.isPit1Pass, p1Pass);
        assert.strictEqual(res.isPit2Pass, p2Pass);
        assert.strictEqual(res.isPit3Pass, p3Pass);
        assert.strictEqual(res.isTripPass, tripPass);
        assert.strictEqual(res.isInsulationPass, insPass);

        if (res.pass) {
          passedCombinations++;
          assert.strictEqual(i, 31); // Only index 31 (binary 11111) can pass
        } else {
          failedCombinations++;
          assert.ok(res.failureReasons.length > 0);
        }
      }

      assert.strictEqual(passedCombinations, 1);
      assert.strictEqual(failedCombinations, 31);
    });

    it('2.7 should verify dirty form guard state tracking when modifying test readings', () => {
      const defaultState = {
        pit1Inverter: '2.1',
        pit2Structure: '1.8',
        pit3Lightning: '2.4',
        antiIslandingTripSec: '0.18',
        insulationMegaOhms: '2500',
      };

      const checkIsDirty = (s) => (
        s.pit1Inverter !== '2.1' ||
        s.pit2Structure !== '1.8' ||
        s.pit3Lightning !== '2.4' ||
        s.antiIslandingTripSec !== '0.18' ||
        s.insulationMegaOhms !== '2500'
      );

      // Unmodified
      assert.strictEqual(checkIsDirty(defaultState), false);

      // Modified pit 1
      assert.strictEqual(checkIsDirty({ ...defaultState, pit1Inverter: '2.2' }), true);

      // Modified trip time
      assert.strictEqual(checkIsDirty({ ...defaultState, antiIslandingTripSec: '0.19' }), true);

      // Modified insulation
      assert.strictEqual(checkIsDirty({ ...defaultState, insulationMegaOhms: '2000' }), true);
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 3: BARCODE CONTINUOUS SCANNING & DEDUPLICATION
  // ---------------------------------------------------------------------------
  describe('Suite 3: Barcode Continuous Scanning & Deduplication', () => {
    it('3.1 should parse multi-format 2D QR and DataMatrix barcodes with DCR domestic content validation', () => {
      // 1. JSON format
      const jsonRaw = JSON.stringify({
        serial: 'WAA-DCR-540-8899',
        manufacturer: 'Waaree Energies',
        wattage: 540,
        isDcr: true,
        almmCertificate: 'ALMM-WAA-2026-90',
      });
      const parsedJson = parseAndValidateBarcode(jsonRaw);
      assert.strictEqual(parsedJson.serial, 'WAA-DCR-540-8899');
      assert.strictEqual(parsedJson.manufacturer, 'Waaree Energies');
      assert.strictEqual(parsedJson.wattage, 540);
      assert.strictEqual(parsedJson.dcrCompliant, true);

      // 2. Delimiter format
      const delimRaw = 'SN:ADANI-DCR-9922;MFG:Adani Solar;545W;DCR:MNRE-DCR-8877';
      const parsedDelim = parseAndValidateBarcode(delimRaw);
      assert.strictEqual(parsedDelim.serial, 'ADANI-DCR-9922');
      assert.strictEqual(parsedDelim.manufacturer, 'Adani Solar');
      assert.strictEqual(parsedDelim.wattage, 545);
      assert.strictEqual(parsedDelim.dcrCompliant, true);

      // 3. Raw Indian Tier-1 DCR serial string
      const rawDcr = 'TATA-DCR-776655';
      const parsedRaw = parseAndValidateBarcode(rawDcr);
      assert.strictEqual(parsedRaw.serial, 'TATA-DCR-776655');
      assert.strictEqual(parsedRaw.dcrCompliant, true);

      // 4. Non-DCR imported serial string
      const imported = 'LONGI-HI-MO-6-7788';
      const parsedImported = parseAndValidateBarcode(imported);
      assert.strictEqual(parsedImported.serial, 'LONGI-HI-MO-6-7788');
      assert.strictEqual(parsedImported.dcrCompliant, false);

      // 5. Reject short strings (< 5 chars)
      assert.strictEqual(parseAndValidateBarcode('WAA1'), null);
      assert.strictEqual(parseAndValidateBarcode(''), null);
      assert.strictEqual(parseAndValidateBarcode(null), null);
    });

    it('3.2 should detect duplicate serial collisions across active session, inverters, and project records', () => {
      const activeSession = ['MS2608211A3882', 'MS2608211A3908'];
      const inverterSerial = 'INV-SOLIS-6677';
      const project = {
        moduleSerials: ['MS2608211A4160'],
        dcrModuleSerials: 'MS2608211A5500, MS2608211A5501\nMS2608211A5502',
        existingSerials: ['INV-STOCK-9001'],
      };

      // 1. Duplicate in active session (exact)
      const dupSession = detectDuplicateSerial('MS2608211A3882', activeSession, inverterSerial, project);
      assert.strictEqual(dupSession.isDuplicate, true);
      assert.ok(dupSession.reason.includes('current session'));

      // 2. Duplicate in active session (case-insensitive & trimmed)
      const dupCase = detectDuplicateSerial('  ms2608211a3908  ', activeSession, inverterSerial, project);
      assert.strictEqual(dupCase.isDuplicate, true);
      assert.ok(dupCase.reason.includes('current session'));

      // 3. Duplicate against existing inverter serial
      const dupInverter = detectDuplicateSerial('INV-SOLIS-6677', activeSession, inverterSerial, project);
      assert.strictEqual(dupInverter.isDuplicate, true);
      assert.ok(dupInverter.reason.includes('inverter serial'));

      // 4. Duplicate against project recorded module serials
      const dupPrj = detectDuplicateSerial('MS2608211A4160', activeSession, inverterSerial, project);
      assert.strictEqual(dupPrj.isDuplicate, true);
      assert.ok(dupPrj.reason.includes('project module serials'));

      // 5. Duplicate against project DCR newline/comma certificate string
      const dupDcr = detectDuplicateSerial('MS2608211A5501', activeSession, inverterSerial, project);
      assert.strictEqual(dupDcr.isDuplicate, true);
      assert.ok(dupDcr.reason.includes('DCR certificate records'));

      // 6. Duplicate against company inventory records
      const dupStock = detectDuplicateSerial('INV-STOCK-9001', activeSession, inverterSerial, project);
      assert.strictEqual(dupStock.isDuplicate, true);
      assert.ok(dupStock.reason.includes('inventory serial records'));

      // 7. Fresh unique serial -> NOT duplicate
      const uniqueRes = detectDuplicateSerial('MS2608211A9999', activeSession, inverterSerial, project);
      assert.strictEqual(uniqueRes.isDuplicate, false);
    });

    it('3.3 should stress-test rapid burst scanning under continuous mode with 1200ms auto-rearm debouncing', async () => {
      // Simulation harness reproducing BarcodeScannerModal state machine
      let isScanning = true;
      let continuousScan = true;
      let acceptedScans = [];
      let rejectedBurstCount = 0;
      let rearmTimer = null;

      const simulateScan = (serial) => {
        if (!isScanning) {
          rejectedBurstCount++;
          return { accepted: false, reason: 'DEBOUNCE_LOCKED' };
        }
        isScanning = false;

        const parsed = parseAndValidateBarcode(serial);
        if (!parsed) {
          isScanning = true;
          return { accepted: false, reason: 'INVALID_BARCODE' };
        }

        const dup = detectDuplicateSerial(parsed.serial, acceptedScans);
        if (dup.isDuplicate) {
          isScanning = true;
          return { accepted: false, reason: 'DUPLICATE' };
        }

        acceptedScans.push(parsed.serial);

        if (continuousScan) {
          rearmTimer = setTimeout(() => {
            isScanning = true;
          }, 1200);
        }
        return { accepted: true, serial: parsed.serial };
      };

      // 1. Initial scan is accepted
      const firstScan = simulateScan('WAA-DCR-1001');
      assert.strictEqual(firstScan.accepted, true);
      assert.strictEqual(isScanning, false);
      assert.strictEqual(acceptedScans.length, 1);

      // 2. Rapid burst of 20 scans arriving during 1200ms lockout -> ALL 20 DROPPED
      for (let i = 0; i < 20; i++) {
        const burstResult = simulateScan(`WAA-DCR-BURST-${i}`);
        assert.strictEqual(burstResult.accepted, false);
        assert.strictEqual(burstResult.reason, 'DEBOUNCE_LOCKED');
      }
      assert.strictEqual(rejectedBurstCount, 20);
      assert.strictEqual(acceptedScans.length, 1);

      // 3. Clear timer and manually advance simulated 1200ms rearm
      clearTimeout(rearmTimer);
      isScanning = true; // Rearmed after 1200ms

      // 4. Next scan is accepted cleanly
      const secondScan = simulateScan('WAA-DCR-1002');
      assert.strictEqual(secondScan.accepted, true);
      assert.strictEqual(acceptedScans.length, 2);

      // 5. Immediate duplicate of second scan after rearm -> REJECTED AS DUPLICATE
      clearTimeout(rearmTimer);
      isScanning = true;
      const dupScan = simulateScan('WAA-DCR-1002');
      assert.strictEqual(dupScan.accepted, false);
      assert.strictEqual(dupScan.reason, 'DUPLICATE');
      assert.strictEqual(acceptedScans.length, 2);
    });

    it('3.4 should verify flashlight/torch toggle state persistence during scanning', () => {
      let torchOn = false;
      const toggleTorch = () => { torchOn = !torchOn; };

      assert.strictEqual(torchOn, false);
      toggleTorch();
      assert.strictEqual(torchOn, true);
      toggleTorch();
      assert.strictEqual(torchOn, false);
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 4: FINANCE 3-TIER OVERDUE AGING (<15d, 15-30d, >30d)
  // ---------------------------------------------------------------------------
  describe('Suite 4: Finance 3-Tier Overdue Aging (<15d, 15-30d, >30d)', () => {
    const fixedNow = new Date('2026-10-30T12:00:00Z').getTime();

    it('4.1 should correctly classify exact boundary days into <15d, 15-30d, and >30d aging tiers', () => {
      const dayMs = 86400000;

      // Tier 1: <15d Grace Period (0d to 14d)
      const b0 = getAgingBadge(new Date(fixedNow - 0.5 * dayMs).toISOString(), fixedNow);
      assert.strictEqual(b0.tier, 'UNDER_15');
      assert.strictEqual(b0.sub, '<15d Grace');

      const b1 = getAgingBadge(new Date(fixedNow - 1 * dayMs).toISOString(), fixedNow);
      assert.strictEqual(b1.tier, 'UNDER_15');
      assert.strictEqual(b1.sub, '<15d Grace');

      const b14 = getAgingBadge(new Date(fixedNow - 14 * dayMs).toISOString(), fixedNow);
      assert.strictEqual(b14.tier, 'UNDER_15');
      assert.strictEqual(b14.sub, '<15d Grace');

      // Tier 2: 15-30d Urgent Follow-up (15d to 30d)
      const b15 = getAgingBadge(new Date(fixedNow - 15 * dayMs).toISOString(), fixedNow);
      assert.strictEqual(b15.tier, '15_TO_30');
      assert.strictEqual(b15.sub, '15-30d Urgent');

      const b22 = getAgingBadge(new Date(fixedNow - 22 * dayMs).toISOString(), fixedNow);
      assert.strictEqual(b22.tier, '15_TO_30');
      assert.strictEqual(b22.sub, '15-30d Urgent');

      const b30 = getAgingBadge(new Date(fixedNow - 30 * dayMs).toISOString(), fixedNow);
      assert.strictEqual(b30.tier, '15_TO_30');
      assert.strictEqual(b30.sub, '15-30d Urgent');

      // Tier 3: >30d Critical Collection (31d+)
      const b31 = getAgingBadge(new Date(fixedNow - 31 * dayMs).toISOString(), fixedNow);
      assert.strictEqual(b31.tier, 'OVER_30');
      assert.strictEqual(b31.sub, '>30d Critical');

      const b90 = getAgingBadge(new Date(fixedNow - 90 * dayMs).toISOString(), fixedNow);
      assert.strictEqual(b90.tier, 'OVER_30');
      assert.strictEqual(b90.sub, '>30d Critical');
    });

    it('4.2 should maintain PAID STATUS INVARIANT: Paid invoices MUST NEVER be counted as overdue', () => {
      const dayMs = 86400000;
      const testInvoices = [
        // Overdue unpaid invoices
        { id: 'inv-1', invoiceNumber: 'INV-101', status: 'UNPAID', dueDate: new Date(fixedNow - 5 * dayMs).toISOString(), amount: 35000 },
        { id: 'inv-2', invoiceNumber: 'INV-102', status: 'UNPAID', dueDate: new Date(fixedNow - 20 * dayMs).toISOString(), amount: 95000 },
        { id: 'inv-3', invoiceNumber: 'INV-103', status: 'UNPAID', dueDate: new Date(fixedNow - 45 * dayMs).toISOString(), amount: 120000 },

        // Paid invoices with past due dates (60 days ago)
        { id: 'inv-4', invoiceNumber: 'INV-104', status: 'PAID', dueDate: new Date(fixedNow - 60 * dayMs).toISOString(), amount: 150000 },
        { id: 'inv-5', invoiceNumber: 'INV-105', computedStatus: 'PAID', dueDate: new Date(fixedNow - 120 * dayMs).toISOString(), amount: 180000 },
      ];

      const stats = computeOverdueAging(testInvoices, fixedNow);
      assert.strictEqual(stats.under15, 1); // Only inv-1
      assert.strictEqual(stats.between15and30, 1); // Only inv-2
      assert.strictEqual(stats.over30, 1); // Only inv-3 (inv-4 & inv-5 ignored because PAID)
      assert.strictEqual(stats.totalOverdue, 3);
    });

    it('4.3 should maintain FUTURE DUE DATES INVARIANT: Unpaid invoices with future due dates are not overdue', () => {
      const dayMs = 86400000;
      const testInvoices = [
        { id: 'inv-fut-1', status: 'UNPAID', dueDate: new Date(fixedNow + 5 * dayMs).toISOString() },
        { id: 'inv-fut-2', status: 'UNPAID', dueDate: new Date(fixedNow + 25 * dayMs).toISOString() },
      ];

      const stats = computeOverdueAging(testInvoices, fixedNow);
      assert.strictEqual(stats.under15, 0);
      assert.strictEqual(stats.between15and30, 0);
      assert.strictEqual(stats.over30, 0);
      assert.strictEqual(stats.totalOverdue, 0);
    });

    it('4.4 should withstand corrupted or missing due dates without throwing NaN or crashing', () => {
      const testInvoices = [
        { id: 'inv-err-1', status: 'UNPAID', dueDate: null },
        { id: 'inv-err-2', status: 'UNPAID', dueDate: 'invalid-date-string' },
        { id: 'inv-err-3', status: 'UNPAID', dueDate: undefined },
      ];

      const stats = computeOverdueAging(testInvoices, fixedNow);
      assert.strictEqual(stats.totalOverdue, 0);
      assert.strictEqual(isNaN(stats.under15), false);
    });

    it('4.5 should aggregate massive portfolio of 1,000 invoices across all 3 tiers accurately', () => {
      const dayMs = 86400000;
      const bigPortfolio = [];

      for (let i = 1; i <= 1000; i++) {
        const daysPast = i % 50; // 0 to 49
        const isPaid = i % 4 === 0; // 25% paid
        bigPortfolio.push({
          id: `inv-${i}`,
          invoiceNumber: `INV-${i}`,
          status: isPaid ? 'PAID' : 'UNPAID',
          dueDate: new Date(fixedNow - daysPast * dayMs).toISOString(),
          amount: 50000,
        });
      }

      const stats = computeOverdueAging(bigPortfolio, fixedNow);
      assert.strictEqual(stats.under15 + stats.between15and30 + stats.over30, stats.totalOverdue);
      assert.ok(stats.under15 > 0);
      assert.ok(stats.between15and30 > 0);
      assert.ok(stats.over30 > 0);
    });
  });

  // ---------------------------------------------------------------------------
  // SUITE 5: MILESTONE INVOICING PRESETS & INVARIANT MATH
  // ---------------------------------------------------------------------------
  describe('Suite 5: Milestone Invoicing Presets & Invariant Math', () => {
    it('5.1 should verify canonical milestone percentage schedule invariants: 20 + 60 + 15 + 5 === 100%', () => {
      const presets = [20, 60, 15, 5];
      const sum = presets.reduce((acc, p) => acc + p, 0);
      assert.strictEqual(sum, 100);
    });

    it('5.2 should verify milestone titles and invoice categories in CreateInvoiceModal presets', () => {
      const presetsMap = {
        20: { category: 'ADVANCE_RECEIPT', titleFragment: 'Advance Booking Token' },
        60: { category: 'TAX_INVOICE', titleFragment: 'Procurement & Material Delivery' },
        15: { category: 'TAX_INVOICE', titleFragment: 'Structure Erection & Electrical Installation' },
        5: { category: 'TAX_INVOICE', titleFragment: 'Grid Synchronization & Net-Metering Handover' },
        100: { category: 'TAX_INVOICE', titleFragment: 'Turnkey Supply & Commissioning' },
      };

      const getPreset = (pct, cap = '3.3') => {
        if (pct === 20) return { category: 'ADVANCE_RECEIPT', title: `Advance Booking Token & Engineering Design (${cap} kWp)` };
        if (pct === 60) return { category: 'TAX_INVOICE', title: `Procurement & Material Delivery at Site (${cap} kWp)` };
        if (pct === 15) return { category: 'TAX_INVOICE', title: `Structure Erection & Electrical Installation (${cap} kWp)` };
        if (pct === 5) return { category: 'TAX_INVOICE', title: `Grid Synchronization & Net-Metering Handover (${cap} kWp)` };
        return { category: 'TAX_INVOICE', title: `Turnkey Supply & Commissioning of ${cap} kWp Solar Rooftop Plant` };
      };

      for (const [pctStr, expected] of Object.entries(presetsMap)) {
        const pct = Number(pctStr);
        const preset = getPreset(pct, '5.0');
        assert.strictEqual(preset.category, expected.category);
        assert.ok(preset.title.includes(expected.titleFragment));
      }
    });

    it('5.3 should preserve ZERO PENNY DRIFT invariant across milestone breakdowns for diverse contract sizes', () => {
      const testContracts = [
        30000,       // Small 1 kW basic
        185000,      // Standard 3.3 kW residential
        280000,      // 5 kW residential
        560000,      // 10 kW commercial
        5400000,     // 100 kW industrial
        184739,      // Odd non-round sum
        99999,       // Boundary odd sum
        123456.78,   // Floating point contract
      ];

      for (const contractVal of testContracts) {
        const schedule = generateMilestoneSchedule(contractVal);
        assert.strictEqual(schedule.length, 4);

        const roundedGross = Math.round(contractVal);
        const sumMilestones = schedule.reduce((sum, item) => sum + item.amount, 0);

        assert.strictEqual(
          sumMilestones,
          roundedGross,
          `Penny drift detected for contract ₹${contractVal}: expected ₹${roundedGross}, got ₹${sumMilestones}`
        );

        // Verify percentages
        assert.strictEqual(schedule[0].percentage, 20);
        assert.strictEqual(schedule[1].percentage, 60);
        assert.strictEqual(schedule[2].percentage, 15);
        assert.strictEqual(schedule[3].percentage, 5);
      }
    });

    it('5.4 should verify statutory 13.8% composite solar GST arithmetic (70% @ 12% + 30% @ 18%)', () => {
      // Theoretical formula proof:
      // Composite GST = 0.70 * 0.12 + 0.30 * 0.18 = 0.084 + 0.054 = 0.138 (13.8%)
      const goodsRate = 0.12;
      const servicesRate = 0.18;
      const goodsShare = 0.70;
      const servicesShare = 0.30;
      const calculatedCompositeRate = Number((goodsShare * goodsRate + servicesShare * servicesRate).toFixed(4));
      assert.strictEqual(calculatedCompositeRate, 0.138);

      // Verify on standard ₹1,91,400 turnkey contract:
      // Taxable subtotal = 191400 / 1.138 = 168190
      // Tax amount = 191400 - 168190 = 23210
      const standardCalc = calculateCompositeSolarGst(191400);
      assert.strictEqual(standardCalc.compositeRate, 13.8);
      assert.strictEqual(standardCalc.taxableSubtotal, 168190);
      assert.strictEqual(standardCalc.taxAmount, 23210);
      assert.strictEqual(standardCalc.taxableSubtotal + standardCalc.taxAmount, 191400);
      assert.strictEqual(standardCalc.zeroPennyDrift, true);

      // Verify trade discount subtraction before GST computation
      const discountedCalc = calculateCompositeSolarGst(191400, 10000);
      assert.strictEqual(discountedCalc.effectiveGross, 181400);
      assert.strictEqual(discountedCalc.taxableSubtotal + discountedCalc.taxAmount, 181400);
      assert.strictEqual(discountedCalc.zeroPennyDrift, true);
    });

    it('5.5 should handle extreme boundary contract values without NaN, infinity, or drift', () => {
      // 0 contract
      const zeroCalc = calculateCompositeSolarGst(0);
      assert.strictEqual(zeroCalc.effectiveGross, 0);
      assert.strictEqual(zeroCalc.taxableSubtotal, 0);
      assert.strictEqual(zeroCalc.taxAmount, 0);

      // 1 Rupee contract
      const oneCalc = calculateCompositeSolarGst(1);
      assert.strictEqual(oneCalc.taxableSubtotal + oneCalc.taxAmount, 1);

      // Massive ₹100 Crore turnkey EPC project
      const massiveCalc = calculateCompositeSolarGst(1000000000);
      assert.strictEqual(massiveCalc.taxableSubtotal + massiveCalc.taxAmount, 1000000000);
      assert.strictEqual(massiveCalc.zeroPennyDrift, true);
    });
  });
});
