/**
 * Tier 3: Pairwise Multi-Module Workflows Suite
 * WhereReady Solar OS Mobile Client
 * 
 * Verifies multi-stage cross-feature workflow interactions across interconnected mobile domains:
 * 
 * 1. Interaction 1: Customer Onboarding -> Sizing & QuickQuote -> Milestone Invoicing
 * 2. Interaction 2: Dynamic Sizing -> 2D Barcode Scanning -> DCR Validation -> Electrical QA Sign-Off
 * 3. Interaction 3: Offline Field Lead Capture -> Draft Caching -> Network Replay & Conversion
 * 4. Interaction 4: DISCOM Document Studio -> ₹100 Stamp Header Toggle -> Official Dossier & 8-Point Audit
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  computeSubsidy,
  calculateSolarFinancials,
  resolveModuleQuantity,
  validateOnboardingSubmission,
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
  computePipelineAudit,
} = require('./test-helpers');

describe('Tier 3: Pairwise Multi-Module Workflows (Mobile Client)', () => {

  // ---------------------------------------------------------------------------
  // INTERACTION 1: ONBOARDING -> SIZING -> MILESTONE INVOICING
  // ---------------------------------------------------------------------------
  describe('Interaction 1: Customer Onboarding -> Sizing & QuickQuote -> Milestone Invoicing', () => {
    it('1.1 should validate onboarding payload and correctly seed 3.3 kW solar sizing profile', () => {
      const onboardRes = validateOnboardingSubmission({
        legalName: 'Vikas Kadam',
        mobile: '9822998877',
        consumerNumber: '028510009944',
        address: 'Plot 12, Baner Road',
        city: 'Pune',
        pincode: '411045',
        capacity: '3.3',
        bankName: 'HDFC Bank',
        accountNumber: '5010029384756',
        ifscCode: 'HDFC0001234',
      });
      assert.strictEqual(onboardRes.valid, true);

      // Seed Sizing
      const financials = calculateSolarFinancials(onboardRes.data.capacity, 58000);
      assert.strictEqual(financials.cap, 3.3);
      assert.strictEqual(financials.gross, 191400); // 3.3 * 58000
      assert.strictEqual(financials.subsidy, 78000);
      assert.strictEqual(financials.net, 113400);
    });

    it('1.2 should calculate 13.8% composite solar GST with 0 penny drift for the sized system', () => {
      const grossAmount = 191400;
      const gst = calculateCompositeSolarGst(grossAmount);
      assert.strictEqual(gst.compositeRate, 13.8);
      assert.strictEqual(gst.taxableSubtotal, 168190);
      assert.strictEqual(gst.taxAmount, 23210);
      assert.strictEqual(gst.taxableSubtotal + gst.taxAmount, grossAmount);
      assert.strictEqual(gst.zeroPennyDrift, true);
    });

    it('1.3 should generate 4 standardized milestone invoices matching the turnkey contract total', () => {
      const grossAmount = 191400;
      const milestones = generateMilestoneSchedule(grossAmount);
      assert.strictEqual(milestones.length, 4);

      // Advance 20%
      assert.strictEqual(milestones[0].percentage, 20);
      assert.strictEqual(milestones[0].amount, 38280);
      assert.strictEqual(milestones[0].hsn, '9954');

      // Delivery 60%
      assert.strictEqual(milestones[1].percentage, 60);
      assert.strictEqual(milestones[1].amount, 114840);
      assert.strictEqual(milestones[1].hsn, '8541');

      // Installation 15%
      assert.strictEqual(milestones[2].percentage, 15);
      assert.strictEqual(milestones[2].amount, 28710);
      assert.strictEqual(milestones[2].hsn, '9954');

      // Commissioning 5%
      assert.strictEqual(milestones[3].percentage, 5);
      assert.strictEqual(milestones[3].amount, 9570);
      assert.strictEqual(milestones[3].hsn, '9954');

      // Sum strictly equals gross contract
      const totalAllocated = milestones.reduce((sum, m) => sum + m.amount, 0);
      assert.strictEqual(totalAllocated, grossAmount);
    });

    it('1.4 should convert advance milestone amount into statutory Indian currency in words', () => {
      const advanceAmount = 38280;
      const words = toIndianWords(advanceAmount);
      assert.strictEqual(words, 'Thirty Eight Thousand Two Hundred and Eighty Rupees Only');
    });
  });

  // ---------------------------------------------------------------------------
  // INTERACTION 2: DYNAMIC SIZING -> BARCODE SCANNING -> DCR VALIDATION -> QA
  // ---------------------------------------------------------------------------
  describe('Interaction 2: Dynamic Sizing -> Barcode Scanning -> DCR Validation -> Electrical QA', () => {
    it('2.1 should resolve required panel count for 3.3 kW using Vikram 550W Somera DCR modules', () => {
      const boq = resolveModuleQuantity(3.3, 'Vikram Solar 550W Somera DCR');
      assert.strictEqual(boq.wattage, 550);
      assert.strictEqual(boq.quantity, 6); // 3300 / 550 = 6 modules
    });

    it('2.2 should parse 6 2D barcode scans, confirm DCR compliance, and block duplicate scan attempts', () => {
      const scannedList = [];
      const inverterSerial = 'INV-SOLIS-3KW-9021';
      const rawScans = [
        'SN:VIK-DCR-550-001|MAKE:Vikram Solar|550W|CERT:ALMM-2024-01',
        '{"serial":"VIK-DCR-550-002","manufacturer":"Vikram Solar","wattage":550,"isDcr":true}',
        'VIK-DCR-550-003',
        'VIK-DCR-550-004',
        'VIK-DCR-550-005',
        'VIK-DCR-550-006',
      ];

      for (const raw of rawScans) {
        const parsed = parseAndValidateBarcode(raw);
        assert.ok(parsed, `Failed to parse: ${raw}`);
        assert.strictEqual(parsed.dcrCompliant, true, `Module ${parsed.serial} was not DCR compliant`);

        // Duplicate check
        const dupCheck = detectDuplicateSerial(parsed.serial, scannedList, inverterSerial);
        assert.strictEqual(dupCheck.isDuplicate, false);
        scannedList.push(parsed.serial);
      }

      assert.strictEqual(scannedList.length, 6);

      // Attempt duplicate scan of module 1
      const dupAttempt = detectDuplicateSerial('VIK-DCR-550-001', scannedList, inverterSerial);
      assert.strictEqual(dupAttempt.isDuplicate, true);
      assert.strictEqual(dupAttempt.reason, 'Already scanned in current session');

      // Attempt scan colliding with inverter serial
      const inverterCollision = detectDuplicateSerial(inverterSerial, scannedList, inverterSerial);
      assert.strictEqual(inverterCollision.isDuplicate, true);
      assert.strictEqual(inverterCollision.reason, 'Matches existing inverter serial number');
    });

    it('2.3 should enforce CEA electrical safety gating thresholds before permitting project testing sign-off', () => {
      // First attempt: Earth pit 1 fails (> 5.0 Ω)
      const failedQa = evaluateElectricalQATests({
        pit1Inverter: '5.6', // FAILS
        pit2Structure: '2.1',
        pit3Lightning: '2.3',
        antiIslandingTripSec: '0.19',
        insulationMegaOhms: '2000',
      });
      assert.strictEqual(failedQa.pass, false);
      assert.ok(failedQa.failureReasons.length >= 1);

      // Corrected test: Earth pit re-treated with bentonite to 1.8 Ω
      const passedQa = evaluateElectricalQATests({
        pit1Inverter: '1.8', // FIXED (< 5.0 Ω)
        pit2Structure: '2.1',
        pit3Lightning: '2.3',
        antiIslandingTripSec: '0.19',
        insulationMegaOhms: '2000',
      });
      assert.strictEqual(passedQa.pass, true);
      assert.strictEqual(passedQa.failureReasons.length, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // INTERACTION 3: OFFLINE DRAFT CAPTURE -> CACHING -> REPLAY & CONVERSION
  // ---------------------------------------------------------------------------
  describe('Interaction 3: Offline Field Lead Capture -> Draft Caching -> Network Replay & Conversion', () => {
    it('3.1 should capture lead offline, generate local draft, and cache quotation data without network', async () => {
      const storage = new MockAsyncStorage();
      const offlineService = createOfflineSyncService(storage);

      const draftLead = await offlineService.saveDraftLead({
        name: 'Sandip Thorat',
        mobile: '9822881122',
        consumerNumber: '028510098765',
        city: 'Saswad',
        sanctionedLoadKw: 5.0,
        monthlyBill: 4500,
      });
      assert.ok(draftLead.localId);
      assert.strictEqual(draftLead.name, 'Sandip Thorat');

      // Cache quotation offline
      const quotePayload = {
        capacityKw: 4.4,
        grossTotal: 255200,
        subsidy: 78000,
        netPayable: 177200,
      };
      await offlineService.saveDraftQuote(draftLead.localId, quotePayload);

      // Verify cached offline state
      const drafts = await offlineService.getDraftLeads();
      assert.strictEqual(drafts.length, 1);
      assert.strictEqual(drafts[0].localId, draftLead.localId);

      const cachedQuote = await offlineService.getDraftQuote(draftLead.localId);
      assert.deepStrictEqual(cachedQuote, quotePayload);
    });

    it('3.2 should simulate online sync replay: upload lead and clean local queue atomically', async () => {
      const storage = new MockAsyncStorage();
      const offlineService = createOfflineSyncService(storage);

      // Seed 2 drafts
      const draft1 = await offlineService.saveDraftLead({ name: 'Farmer 1', mobile: '9800000001', consumerNumber: '028511' });
      const draft2 = await offlineService.saveDraftLead({ name: 'Farmer 2', mobile: '9800000002', consumerNumber: '028512' });

      let drafts = await offlineService.getDraftLeads();
      assert.strictEqual(drafts.length, 2);

      // Sync draft 1
      await offlineService.removeDraftLead(draft1.localId);

      // Remaining queue contains only draft 2
      drafts = await offlineService.getDraftLeads();
      assert.strictEqual(drafts.length, 1);
      assert.strictEqual(drafts[0].localId, draft2.localId);

      // Sync draft 2
      await offlineService.removeDraftLead(draft2.localId);

      // Queue is now empty
      drafts = await offlineService.getDraftLeads();
      assert.strictEqual(drafts.length, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // INTERACTION 4: DISCOM DOCUMENT STUDIO -> STAMP HEADER -> 8-POINT AUDIT
  // ---------------------------------------------------------------------------
  describe('Interaction 4: DISCOM Document Studio -> Stamp Header -> 8-Point Audit', () => {
    it('4.1 should verify 8-point statutory audit for complete installation dossier', () => {
      const completeDossier = {
        beneficiaryName: 'Ramesh Patil',
        consumerNumber: '028510001234',
        address: 'Sector 15, Vashi, Navi Mumbai',
        appliedCapacity: 3.3,
        sanctionedLoad: 3.0,
        applicationRefNo: 'PMSGY-MH-2024-5544',
        moduleMake: 'Waaree 540W Mono PERC',
        moduleWattage: 540,
        moduleQuantity: 7,
        moduleSerialNumbers: ['MOD1', 'MOD2', 'MOD3', 'MOD4', 'MOD5', 'MOD6', 'MOD7'],
        vendorName: 'WhereReady Solar Technologies Pvt Ltd',
        gstin: '27AAECW1234F1Z5',
      };

      const audit = computePipelineAudit(completeDossier);
      assert.strictEqual(audit.total, 8);
      assert.strictEqual(audit.passed, 8);
      assert.strictEqual(audit.allVerified, true);
    });

    it('4.2 should generate statutory documents with 115mm blank header for physical stamp paper', () => {
      // Physical stamp mode for treasury paper
      const p1Physical = renderAgreementHeader(false, true);
      assert.strictEqual(p1Physical.type, 'PHYSICAL_BLANK_MARGIN');
      assert.strictEqual(p1Physical.marginMm, 115);

      // Subsequent pages in Net Metering agreement (pages 2-6) use 20mm standard header
      const p2Header = renderAgreementHeader(false, false);
      assert.strictEqual(p2Header.type, 'STANDARD_PAGE_HEADER');
      assert.strictEqual(p2Header.heightMm, 20);
    });

    it('4.3 should generate statutory documents with digital ₹100 stamp emblem for e-stamping mode', () => {
      const p1Digital = renderAgreementHeader(true, true);
      assert.strictEqual(p1Digital.type, 'DIGITAL_STAMP_GRAPHIC');
      assert.strictEqual(p1Digital.stampValue, 100);
      assert.strictEqual(p1Digital.state, 'Maharashtra');
      assert.strictEqual(p1Digital.heightMm, 75);
    });
  });
});
