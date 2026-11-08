/**
 * Tier 1: Category-Partition Feature Coverage Suite
 * WhereReady Solar OS Mobile Client
 * 
 * Verifies core solar SaaS mobile features in isolation using Category-Partition methodology:
 * Each feature is tested across distinct input partitions with >= 5 tests per feature:
 * 
 * 1. Customer Onboarding & Compulsory DISCOM Consumer No. Validation
 * 2. Solar Sizing & PM Surya Ghar Central DBT Subsidy Slabs
 * 3. Dynamic Hardware Modules & Inverter Allocation
 * 4. Statutory 13.8% Composite Solar GST Arithmetic
 * 5. Statutory DISCOM Document Studio 7-Template Verification
 * 6. 2D Barcode & QR Scanner Parser (JSON, Delimited, Raw)
 * 7. Electrical QA Sign-Off & CEA Safety Gating
 * 8. Resilient Offline Draft Storage & Sync Queue
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  computeSubsidy,
  calculateSolarFinancials,
  DEFAULT_PANEL_OPTIONS,
  DEFAULT_INVERTER_OPTIONS,
  resolveModuleQuantity,
  validateOnboardingSubmission,
  canSubmitWithoutDocuments,
  calculateCompositeSolarGst,
  STATUTORY_TEMPLATES,
  renderAgreementHeader,
  parseAndValidateBarcode,
  detectDuplicateSerial,
  evaluateElectricalQATests,
  generateMilestoneSchedule,
  toIndianWords,
  MockAsyncStorage,
  createOfflineSyncService,
} = require('./test-helpers');

describe('Tier 1: Category-Partition Feature Coverage (Mobile Client)', () => {

  // ---------------------------------------------------------------------------
  // FEATURE 1: CUSTOMER ONBOARDING VALIDATION & COMPULSORY CONSUMER NO.
  // ---------------------------------------------------------------------------
  describe('Feature 1: Customer Onboarding & KYC Validation', () => {
    it('1.1 should approve valid residential onboarding payload with all required fields', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Gajanan Kulkarni',
        mobile: '9822012345',
        consumerNumber: '028510091234',
        address: 'Flat 402, Shivajinagar',
        city: 'Pune',
        pincode: '411005',
        capacity: '3.3',
        bankName: 'State Bank of India',
        accountNumber: '10293847561',
        ifscCode: 'SBIN0001234',
      });
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.legalName, 'Gajanan Kulkarni');
      assert.strictEqual(res.data.consumerNumber, '028510091234');
      assert.strictEqual(res.data.capacity, 3.3);
    });

    it('1.2 should reject onboarding submission when customer legal name is missing or empty', () => {
      const res = validateOnboardingSubmission({
        legalName: '   ',
        mobile: '9822012345',
        consumerNumber: '028510091234',
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Customer Name Required');
    });

    it('1.3 should reject onboarding submission when mobile number has fewer than 10 digits', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Gajanan Kulkarni',
        mobile: '9822012', // 7 digits
        consumerNumber: '028510091234',
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Mobile Number Incomplete');
    });

    it('1.4 should reject onboarding submission when DISCOM consumer number is omitted', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Gajanan Kulkarni',
        mobile: '9822012345',
        consumerNumber: '',
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'DISCOM Consumer No. Compulsory');
    });

    it('1.5 should reject onboarding submission when DISCOM consumer number has fewer than 6 characters', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Gajanan Kulkarni',
        mobile: '9822012345',
        consumerNumber: '12345', // 5 chars
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Invalid Consumer Number');
    });

    it('1.6 should permit initial onboarding completion when 0 KYC documents are attached', () => {
      const recommendedKycSlots = [
        { id: 'ELEC_BILL', title: 'Latest Electricity Bill', required: false },
        { id: 'AADHAR_PAN', title: 'Aadhaar / PAN Card', required: false },
        { id: 'PROPERTY_TAX', title: 'Property Tax Receipt', required: false },
        { id: 'CANCELLED_CHEQUE', title: 'Cancelled Cheque', required: false },
      ];
      assert.strictEqual(canSubmitWithoutDocuments(recommendedKycSlots), true);
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 2: SOLAR SIZING & PM SURYA GHAR CENTRAL DBT SUBSIDY
  // ---------------------------------------------------------------------------
  describe('Feature 2: Solar Sizing & PM Surya Ghar Central Subsidy', () => {
    it('2.1 should award exactly ₹30,000 DBT subsidy for 1.0 kW system', () => {
      assert.strictEqual(computeSubsidy(1.0), 30000);
    });

    it('2.2 should award exactly ₹60,000 DBT subsidy for 2.0 kW system', () => {
      assert.strictEqual(computeSubsidy(2.0), 60000);
    });

    it('2.3 should cap central DBT subsidy at strictly ₹78,000 for 3.0 kW residential system', () => {
      assert.strictEqual(computeSubsidy(3.0), 78000);
    });

    it('2.4 should maintain statutory ₹78,000 ceiling cap for larger residential capacities (3.3 kW, 5.0 kW, 10.0 kW)', () => {
      assert.strictEqual(computeSubsidy(3.3), 78000);
      assert.strictEqual(computeSubsidy(5.0), 78000);
      assert.strictEqual(computeSubsidy(10.0), 78000);
    });

    it('2.5 should calculate solar energy generation metrics matching ~1460 annual yield', () => {
      const financials = calculateSolarFinancials(3.3);
      assert.strictEqual(financials.monthlyUnits, 396);
      assert.strictEqual(financials.annualUnits, 4818); // 3.3 * 1460
      assert.strictEqual(financials.monthlySavings, 3366); // 396 * 8.5
      assert.ok(financials.paybackYears >= 2.5 && financials.paybackYears <= 3.5);
    });

    it('2.6 should calculate environmental carbon offset and tree equivalents accurately', () => {
      const financials = calculateSolarFinancials(5.0);
      // annualUnits = 5 * 1460 = 7300; 7300 * 0.82 = 5986 kg CO2
      assert.strictEqual(financials.co2ReductionKg, 5986);
      assert.strictEqual(financials.treeEquivalent, 299); // 5986 / 20 = 299.3
    });

    it('2.7 should compute net payable amount as gross minus central subsidy', () => {
      const financials = calculateSolarFinancials(3.3, 58000);
      const expectedGross = Math.round(3.3 * 58000); // 191400
      assert.strictEqual(financials.gross, expectedGross);
      assert.strictEqual(financials.subsidy, 78000);
      assert.strictEqual(financials.net, expectedGross - 78000); // 113400
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 3: DYNAMIC HARDWARE MODULES & INVERTERS ALLOCATION
  // ---------------------------------------------------------------------------
  describe('Feature 3: Dynamic Hardware Modules & Inverter Allocation', () => {
    it('3.1 should supply at least 7 Tier-1 ALMM modules by default', () => {
      assert.ok(DEFAULT_PANEL_OPTIONS.length >= 7);
      const names = DEFAULT_PANEL_OPTIONS.map(p => p.brand);
      assert.ok(names.includes('Waaree'));
      assert.ok(names.includes('Adani'));
      assert.ok(names.includes('Tata Power'));
    });

    it('3.2 should supply at least 7 grid-tied inverters by default', () => {
      assert.ok(DEFAULT_INVERTER_OPTIONS.length >= 7);
      const ids = DEFAULT_INVERTER_OPTIONS.map(i => i.id);
      assert.ok(ids.includes('solis_dual'));
      assert.ok(ids.includes('growatt_grid'));
      assert.ok(ids.includes('polycab_solar'));
    });

    it('3.3 should dynamically compute 7 panels for 3.3 kW with 540W module', () => {
      const res = resolveModuleQuantity(3.3, 'Waaree 540W Mono PERC Bifacial');
      assert.strictEqual(res.wattage, 540);
      assert.strictEqual(res.quantity, 7); // Math.ceil(3300 / 540) = 7
    });

    it('3.4 should dynamically compute 6 panels for 3.3 kW with 550W module', () => {
      const res = resolveModuleQuantity(3.3, 'Vikram Solar 550W Somera DCR');
      assert.strictEqual(res.wattage, 550);
      assert.strictEqual(res.quantity, 6); // Math.ceil(3300 / 550) = 6
    });

    it('3.5 should parse wattage from module name string regex when not explicitly keyed', () => {
      const res = resolveModuleQuantity(4.0, 'Custom TopCon 580W High Efficiency');
      assert.strictEqual(res.wattage, 580);
      assert.strictEqual(res.quantity, 7); // Math.ceil(4000 / 580) = 7
    });

    it('3.6 should support custom user modules in custom list with high wattage', () => {
      const customList = [
        ...DEFAULT_PANEL_OPTIONS,
        { id: 'custom_600', name: 'Loom Solar 600W Bifacial Shark', wattage: 600, brand: 'Loom Solar' }
      ];
      const res = resolveModuleQuantity(6.0, 'Loom Solar 600W Bifacial Shark', customList);
      assert.strictEqual(res.wattage, 600);
      assert.strictEqual(res.quantity, 10); // Math.ceil(6000 / 600) = 10
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 4: STATUTORY 13.8% COMPOSITE SOLAR GST ARITHMETIC
  // ---------------------------------------------------------------------------
  describe('Feature 4: Statutory 13.8% Composite Solar GST Arithmetic', () => {
    it('4.1 should decompose ₹1,91,400 turnkey contract into 13.8% composite GST with zero drift', () => {
      const gst = calculateCompositeSolarGst(191400);
      assert.strictEqual(gst.compositeRate, 13.8);
      assert.strictEqual(gst.taxableSubtotal, 168190); // Math.round(191400 / 1.138)
      assert.strictEqual(gst.taxAmount, 23210); // 191400 - 168190
      assert.strictEqual(gst.zeroPennyDrift, true);
    });

    it('4.2 should split composite taxable amount into 70% goods and 30% services', () => {
      const gst = calculateCompositeSolarGst(191400);
      // taxableSubtotal = 168190
      assert.strictEqual(gst.goodsPortion, 117733); // 70% of 168190
      assert.strictEqual(gst.servicesPortion, 50457); // 30% of 168190
      assert.strictEqual(gst.goodsPortion + gst.servicesPortion, gst.taxableSubtotal);
    });

    it('4.3 should compute statutory 12% GST on goods portion and 18% GST on services portion', () => {
      const gst = calculateCompositeSolarGst(191400);
      assert.strictEqual(gst.goodsGst, 14128); // 12% of 117733 = 14127.96 -> 14128
      assert.strictEqual(gst.servicesGst, 9082); // 18% of 50457 = 9082.26 -> 9082
      const combinedSplitGst = gst.goodsGst + gst.servicesGst;
      // Combined split matches composite taxAmount within ₹1 tolerance
      assert.ok(Math.abs(combinedSplitGst - gst.taxAmount) <= 1);
    });

    it('4.4 should apply trade discount before computing composite GST', () => {
      const gross = 200000;
      const discount = 15000;
      const gst = calculateCompositeSolarGst(gross, discount);
      assert.strictEqual(gst.effectiveGross, 185000);
      assert.strictEqual(gst.taxableSubtotal, Math.round(185000 / 1.138));
      assert.strictEqual(gst.taxAmount, 185000 - gst.taxableSubtotal);
      assert.strictEqual(gst.zeroPennyDrift, true);
    });

    it('4.5 should correctly handle small system contract values without NaN or rounding errors', () => {
      const gst = calculateCompositeSolarGst(58000); // 1 kW contract
      assert.strictEqual(gst.taxableSubtotal, Math.round(58000 / 1.138));
      assert.strictEqual(gst.taxAmount, 58000 - gst.taxableSubtotal);
      assert.strictEqual(gst.zeroPennyDrift, true);
    });

    it('4.6 should preserve invariant for commercial MW-scale values (e.g. ₹58,00,000)', () => {
      const gst = calculateCompositeSolarGst(5800000);
      assert.strictEqual(gst.taxableSubtotal, Math.round(5800000 / 1.138));
      assert.strictEqual(gst.taxAmount, 5800000 - gst.taxableSubtotal);
      assert.strictEqual(gst.zeroPennyDrift, true);
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 5: STATUTORY DISCOM DOCUMENT STUDIO & STAMP MARGIN
  // ---------------------------------------------------------------------------
  describe('Feature 5: DISCOM Document Studio 7 Templates & Stamp Header', () => {
    it('5.1 should include all 7 statutory DISCOM document templates', () => {
      assert.strictEqual(STATUTORY_TEMPLATES.length, 7);
      const ids = STATUTORY_TEMPLATES.map(t => t.id);
      assert.ok(ids.includes('WCR_FULL'));
      assert.ok(ids.includes('WCR'));
      assert.ok(ids.includes('AnnexureI'));
      assert.ok(ids.includes('DCR'));
      assert.ok(ids.includes('NetMetering'));
      assert.ok(ids.includes('ConsumerVendor'));
      assert.ok(ids.includes('StandardQuotation'));
    });

    it('5.2 should configure correct statutory page counts for multi-page templates', () => {
      const netMetering = STATUTORY_TEMPLATES.find(t => t.id === 'NetMetering');
      const wcrFull = STATUTORY_TEMPLATES.find(t => t.id === 'WCR_FULL');
      const consumerAgreement = STATUTORY_TEMPLATES.find(t => t.id === 'ConsumerVendor');
      assert.strictEqual(netMetering.pages, 6);
      assert.strictEqual(wcrFull.pages, 3);
      assert.strictEqual(consumerAgreement.pages, 3);
    });

    it('5.3 should preserve 115mm blank header margin when stamp graphic is toggled OFF on page 1', () => {
      const header = renderAgreementHeader(false, true);
      assert.strictEqual(header.type, 'PHYSICAL_BLANK_MARGIN');
      assert.strictEqual(header.marginMm, 115);
    });

    it('5.4 should render digital ₹100 stamp graphic when toggled ON on page 1', () => {
      const header = renderAgreementHeader(true, true);
      assert.strictEqual(header.type, 'DIGITAL_STAMP_GRAPHIC');
      assert.strictEqual(header.stampValue, 100);
      assert.strictEqual(header.heightMm, 75);
    });

    it('5.5 should use compact standard header (20mm) on page 2+ regardless of stamp paper setting', () => {
      const headerPage2WithStamp = renderAgreementHeader(true, false);
      const headerPage2Blank = renderAgreementHeader(false, false);
      assert.strictEqual(headerPage2WithStamp.type, 'STANDARD_PAGE_HEADER');
      assert.strictEqual(headerPage2WithStamp.heightMm, 20);
      assert.strictEqual(headerPage2Blank.type, 'STANDARD_PAGE_HEADER');
      assert.strictEqual(headerPage2Blank.heightMm, 20);
    });

    it('5.6 should designate Work Completion Report pack as 3-page dossier', () => {
      const wcr = STATUTORY_TEMPLATES.find(t => t.id === 'WCR_FULL');
      assert.strictEqual(wcr.pages, 3);
      assert.ok(wcr.title.includes('3-Page Dossier'));
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 6: 2D BARCODE / DATAMATRIX PARSER & DCR VALIDATION
  // ---------------------------------------------------------------------------
  describe('Feature 6: 2D Barcode Scanner & DCR Validation', () => {
    it('6.1 should parse JSON-encoded 2D QR barcode with complete attributes', () => {
      const rawJson = JSON.stringify({
        serial: 'WAA-540-2024-001',
        manufacturer: 'Waaree Energies',
        wattage: 540,
        dcrCertificate: 'DCR-MNRE-2024-9988',
        isDcr: true,
      });
      const res = parseAndValidateBarcode(rawJson);
      assert.ok(res);
      assert.strictEqual(res.serial, 'WAA-540-2024-001');
      assert.strictEqual(res.manufacturer, 'Waaree Energies');
      assert.strictEqual(res.wattage, 540);
      assert.strictEqual(res.dcrCompliant, true);
    });

    it('6.2 should parse pipe-delimited 2D DataMatrix code', () => {
      const rawPipe = 'SN:ADANI-DCR-8899|MAKE:Adani Solar|545W|CERT:ALMM-2024-77';
      const res = parseAndValidateBarcode(rawPipe);
      assert.ok(res);
      assert.strictEqual(res.serial, 'ADANI-DCR-8899');
      assert.strictEqual(res.manufacturer, 'Adani Solar');
      assert.strictEqual(res.wattage, 545);
      assert.strictEqual(res.dcrCompliant, true);
    });

    it('6.3 should parse semicolon-delimited 2D barcode format', () => {
      const rawSemi = 'SERIAL:TATA-DCR-5544;MAKE:Tata Power;545W;CERT:MNRE-DCR-01';
      const res = parseAndValidateBarcode(rawSemi);
      assert.ok(res);
      assert.strictEqual(res.serial, 'TATA-DCR-5544');
      assert.strictEqual(res.manufacturer, 'Tata Power');
      assert.strictEqual(res.wattage, 545);
      assert.strictEqual(res.dcrCompliant, true);
    });

    it('6.4 should parse raw serial string and recognize Tier-1 DCR naming conventions', () => {
      const res = parseAndValidateBarcode('VIKRAM-DCR-9021');
      assert.ok(res);
      assert.strictEqual(res.serial, 'VIKRAM-DCR-9021');
      assert.strictEqual(res.dcrCompliant, true);
    });

    it('6.5 should recognize non-DCR imported module and flag dcrCompliant as false', () => {
      const res = parseAndValidateBarcode('JINKO-TIGER-7788');
      assert.ok(res);
      assert.strictEqual(res.serial, 'JINKO-TIGER-7788');
      assert.strictEqual(res.dcrCompliant, false);
    });

    it('6.6 should reject invalid barcodes shorter than 5 characters', () => {
      assert.strictEqual(parseAndValidateBarcode('123'), null);
      assert.strictEqual(parseAndValidateBarcode(''), null);
    });

    it('6.7 should detect duplicate serial when candidate is in current scanning list', () => {
      const currentList = ['WAA-001', 'WAA-002'];
      const check = detectDuplicateSerial('WAA-001', currentList);
      assert.strictEqual(check.isDuplicate, true);
      assert.strictEqual(check.reason, 'Already scanned in current session');
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 7: ELECTRICAL QA TEST READINGS & CEA SAFETY GATING
  // ---------------------------------------------------------------------------
  describe('Feature 7: Electrical QA Sign-Off & CEA Safety Gating', () => {
    it('7.1 should approve sign-off when all electrical readings meet CEA statutory thresholds', () => {
      const res = evaluateElectricalQATests({
        pit1Inverter: '2.1',       // < 5.0 Ω
        pit2Structure: '1.8',      // < 5.0 Ω
        pit3Lightning: '2.4',      // < 5.0 Ω
        antiIslandingTripSec: '0.18', // < 2.0 s
        insulationMegaOhms: '2500',   // > 1.0 MΩ
      });
      assert.strictEqual(res.pass, true);
      assert.strictEqual(res.failureReasons.length, 0);
    });

    it('7.2 should block sign-off when Inverter Earth Pit 1 is >= 5.0 Ω', () => {
      const res = evaluateElectricalQATests({
        pit1Inverter: '5.2', // VIOLATION
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '1500',
      });
      assert.strictEqual(res.pass, false);
      assert.strictEqual(res.isPit1Pass, false);
      assert.ok(res.failureReasons.some(r => r.includes('Pit 1')));
    });

    it('7.3 should block sign-off when Structure Earth Pit 2 is >= 5.0 Ω', () => {
      const res = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '6.1', // VIOLATION
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '1500',
      });
      assert.strictEqual(res.pass, false);
      assert.strictEqual(res.isPit2Pass, false);
      assert.ok(res.failureReasons.some(r => r.includes('Pit 2')));
    });

    it('7.4 should block sign-off when Lightning Arrestor Pit 3 is >= 5.0 Ω', () => {
      const res = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '5.0', // Boundary violation (must be strictly < 5.0)
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '1500',
      });
      assert.strictEqual(res.pass, false);
      assert.strictEqual(res.isPit3Pass, false);
      assert.ok(res.failureReasons.some(r => r.includes('Pit 3')));
    });

    it('7.5 should block sign-off when Anti-Islanding Trip Time is >= 2.0 seconds', () => {
      const res = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '2.1', // VIOLATION
        insulationMegaOhms: '1500',
      });
      assert.strictEqual(res.pass, false);
      assert.strictEqual(res.isTripPass, false);
      assert.ok(res.failureReasons.some(r => r.includes('Anti-Islanding')));
    });

    it('7.6 should block sign-off when Inverter Insulation Resistance is <= 1.0 MΩ', () => {
      const res = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '0.8', // VIOLATION (must be > 1.0 MΩ)
      });
      assert.strictEqual(res.pass, false);
      assert.strictEqual(res.isInsulationPass, false);
      assert.ok(res.failureReasons.some(r => r.includes('Insulation Resistance')));
    });
  });

  // ---------------------------------------------------------------------------
  // FEATURE 8: RESILIENT OFFLINE DRAFT STORAGE & SYNC QUEUE
  // ---------------------------------------------------------------------------
  describe('Feature 8: Offline Draft Storage & Sync Queue', () => {
    let mockStorage;
    let offlineService;

    beforeEach(() => {
      mockStorage = new MockAsyncStorage();
      offlineService = createOfflineSyncService(mockStorage);
    });

    it('8.1 should save a new draft lead with generated localId and ISO timestamp', async () => {
      const draft = await offlineService.saveDraftLead({
        name: 'Sopan More',
        mobile: '9822334455',
        consumerNumber: '028510008899',
        city: 'Baramati',
      });
      assert.ok(draft.localId.startsWith('draft_'));
      assert.ok(draft.createdAt);
      assert.strictEqual(draft.name, 'Sopan More');
    });

    it('8.2 should retrieve all saved draft leads in descending order of creation', async () => {
      await offlineService.saveDraftLead({ name: 'Lead 1', mobile: '9800000001' });
      await offlineService.saveDraftLead({ name: 'Lead 2', mobile: '9800000002' });
      const drafts = await offlineService.getDraftLeads();
      assert.strictEqual(drafts.length, 2);
      assert.strictEqual(drafts[0].name, 'Lead 2'); // latest first
      assert.strictEqual(drafts[1].name, 'Lead 1');
    });

    it('8.3 should delete synchronized draft lead by localId', async () => {
      const draft = await offlineService.saveDraftLead({ name: 'Lead To Sync', mobile: '9800000003' });
      let drafts = await offlineService.getDraftLeads();
      assert.strictEqual(drafts.length, 1);

      await offlineService.removeDraftLead(draft.localId);
      drafts = await offlineService.getDraftLeads();
      assert.strictEqual(drafts.length, 0);
    });

    it('8.4 should cache draft quotation for a given lead ID', async () => {
      const quoteData = { capacityKw: 3.3, grossTotal: 191400, subsidy: 78000 };
      await offlineService.saveDraftQuote('lead_xyz_1', quoteData);

      const cached = await offlineService.getDraftQuote('lead_xyz_1');
      assert.deepStrictEqual(cached, quoteData);
    });

    it('8.5 should return null when querying draft quote for non-existent lead ID', async () => {
      const cached = await offlineService.getDraftQuote('non_existent_lead');
      assert.strictEqual(cached, null);
    });

    it('8.6 should return empty array when draft storage is corrupted or unparseable', async () => {
      await mockStorage.setItem('@solar_manager_draft_leads', 'MALFORMED_NON_JSON_CONTENT{{{');
      const drafts = await offlineService.getDraftLeads();
      assert.deepStrictEqual(drafts, []);
    });
  });
});
