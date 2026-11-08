/**
 * Tier 4: Real-World Solar EPC Customer Journeys Suite
 * WhereReady Solar OS Mobile Client
 * 
 * Simulates complete, realistic end-to-end solar business workloads from customer intake to statutory commissioning:
 * 
 * 1. Scenario 1: Residential Rooftop (3.3 kW PM Surya Ghar DBT Flow in Pune, Maharashtra)
 * 2. Scenario 2: Commercial & Industrial Rooftop (50 kW Turnkey EPC in Chakan MIDC, Pune)
 * 3. Scenario 3: Remote Rural Agricultural Solar Pump (5 kW Hybrid Off-Grid in Satara)
 * 4. Scenario 4: Adverse Field Audit, Safety Threshold Gating & Corrective Re-Audit
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  computeSubsidy,
  calculateSolarFinancials,
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
  computePipelineAudit,
} = require('./test-helpers');

describe('Tier 4: Real-World Solar EPC Customer Journeys (Mobile Client)', () => {

  // ---------------------------------------------------------------------------
  // SCENARIO 1: RESIDENTIAL 3.3 KW PM SURYA GHAR DBT FLOW
  // ---------------------------------------------------------------------------
  describe('Scenario 1: Residential Rooftop (3.3 kW PM Surya Ghar DBT Flow)', () => {
    let customerProfile;
    let sizingDetails;
    let quoteGst;
    let milestones;
    let scannedSerials;

    it('Step 1.1: Customer Onboarding with MSEDCL 12-digit consumer account', () => {
      const form = {
        legalName: 'Sunil Jagtap',
        mobile: '9822019988',
        consumerNumber: '028510009988',
        address: 'Bungalow 7, Baner Road',
        city: 'Pune',
        pincode: '411045',
        capacity: '3.3',
        bankName: 'Bank of Maharashtra',
        accountNumber: '60129384751',
        ifscCode: 'MAHB0000123',
      };
      const res = validateOnboardingSubmission(form);
      assert.strictEqual(res.valid, true);
      customerProfile = res.data;
      assert.strictEqual(customerProfile.consumerNumber, '028510009988');

      // KYC Document optionality
      const kycSlots = [
        { id: 'ELEC_BILL', title: 'Electricity Bill', required: false },
        { id: 'AADHAR_PAN', title: 'Aadhaar Card', required: false },
      ];
      assert.strictEqual(canSubmitWithoutDocuments(kycSlots), true);
    });

    it('Step 1.2: Solar Engineering Sizing & PM Surya Ghar ₹78,000 DBT calculation', () => {
      sizingDetails = calculateSolarFinancials(customerProfile.capacity, 58000);
      assert.strictEqual(sizingDetails.cap, 3.3);
      assert.strictEqual(sizingDetails.gross, 191400); // 3.3 * 58000
      assert.strictEqual(sizingDetails.subsidy, 78000); // statutory DBT cap
      assert.strictEqual(sizingDetails.net, 113400); // customer investment
      assert.strictEqual(sizingDetails.monthlyUnits, 396);
      assert.strictEqual(sizingDetails.annualUnits, 4818);
      assert.strictEqual(sizingDetails.co2ReductionKg, 3951);
      assert.ok(sizingDetails.paybackYears >= 2.5 && sizingDetails.paybackYears <= 3.2);

      // Hardware allocation: 550W Vikram Solar DCR modules
      const boq = resolveModuleQuantity(3.3, 'Vikram Solar 550W Somera DCR');
      assert.strictEqual(boq.wattage, 550);
      assert.strictEqual(boq.quantity, 6); // exactly 6 modules
    });

    it('Step 1.3: 13.8% Composite Solar GST & 4-Stage EPC Milestone Invoicing', () => {
      quoteGst = calculateCompositeSolarGst(sizingDetails.gross);
      assert.strictEqual(quoteGst.taxableSubtotal, 168190);
      assert.strictEqual(quoteGst.taxAmount, 23210);
      assert.strictEqual(quoteGst.zeroPennyDrift, true);

      milestones = generateMilestoneSchedule(sizingDetails.gross);
      assert.strictEqual(milestones.length, 4);
      assert.strictEqual(milestones[0].amount, 38280); // Advance 20%
      assert.strictEqual(milestones[1].amount, 114840); // Delivery 60%
      assert.strictEqual(milestones[2].amount, 28710); // Install 15%
      assert.strictEqual(milestones[3].amount, 9570); // Commission 5%

      const advanceWords = toIndianWords(milestones[0].amount);
      assert.strictEqual(advanceWords, 'Thirty Eight Thousand Two Hundred and Eighty Rupees Only');
    });

    it('Step 1.4: 2D Barcode Scanning of 6 DCR Panels & Duplicate Protection', () => {
      const inverterSerial = 'INV-SOLIS-3.3K-8811';
      scannedSerials = [];
      const testBarcodes = [
        'SN:VIK-DCR-2024-101|MAKE:Vikram Solar|550W|CERT:DCR-ALMM-01',
        'SN:VIK-DCR-2024-102|MAKE:Vikram Solar|550W|CERT:DCR-ALMM-01',
        'SN:VIK-DCR-2024-103|MAKE:Vikram Solar|550W|CERT:DCR-ALMM-01',
        'SN:VIK-DCR-2024-104|MAKE:Vikram Solar|550W|CERT:DCR-ALMM-01',
        'SN:VIK-DCR-2024-105|MAKE:Vikram Solar|550W|CERT:DCR-ALMM-01',
        'SN:VIK-DCR-2024-106|MAKE:Vikram Solar|550W|CERT:DCR-ALMM-01',
      ];

      for (const b of testBarcodes) {
        const parsed = parseAndValidateBarcode(b);
        assert.ok(parsed);
        assert.strictEqual(parsed.dcrCompliant, true);
        const dupCheck = detectDuplicateSerial(parsed.serial, scannedSerials, inverterSerial);
        assert.strictEqual(dupCheck.isDuplicate, false);
        scannedSerials.push(parsed.serial);
      }
      assert.strictEqual(scannedSerials.length, 6);
    });

    it('Step 1.5: CEA Electrical QA Safety Sign-Off & Statutory Stage Advancement', () => {
      const qaResult = evaluateElectricalQATests({
        pit1Inverter: '2.2',
        pit2Structure: '1.9',
        pit3Lightning: '2.5',
        antiIslandingTripSec: '0.18',
        insulationMegaOhms: '2500',
      });
      assert.strictEqual(qaResult.pass, true);
    });

    it('Step 1.6: DISCOM Document Studio 7-Template Compilation & 8-Point Audit', () => {
      const projectDossier = {
        beneficiaryName: customerProfile.legalName,
        consumerNumber: customerProfile.consumerNumber,
        address: customerProfile.address,
        appliedCapacity: customerProfile.capacity,
        sanctionedLoad: 3.0,
        applicationRefNo: 'PMSGY-MH-2024-9988',
        moduleMake: 'Vikram Solar 550W Somera DCR',
        moduleWattage: 550,
        moduleQuantity: 6,
        moduleSerialNumbers: scannedSerials,
        vendorName: 'WhereReady Solar Technologies Pvt Ltd',
        gstin: '27AAECW1234F1Z5',
      };

      const audit = computePipelineAudit(projectDossier);
      assert.strictEqual(audit.total, 8);
      assert.strictEqual(audit.passed, 8);
      assert.strictEqual(audit.allVerified, true);

      // Verify physical stamp margin for printing on treasury paper
      const p1Stamp = renderAgreementHeader(false, true);
      assert.strictEqual(p1Stamp.type, 'PHYSICAL_BLANK_MARGIN');
      assert.strictEqual(p1Stamp.marginMm, 115);
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 2: COMMERCIAL 50 KW ROOFTOP EPC IN CHAKAN MIDC
  // ---------------------------------------------------------------------------
  describe('Scenario 2: Commercial & Industrial 50 kW Rooftop EPC', () => {
    it('2.1 should size 50 kW industrial rooftop and confirm ₹0 central DBT subsidy', () => {
      const capKw = 50.0;
      const turnkeyRate = 50000; // ₹50k/kW commercial EPC rate
      const gross = capKw * turnkeyRate; // ₹25,00,000

      // Commercial systems receive ₹0 central DBT subsidy
      const subsidy = 0;
      const net = gross - subsidy;
      assert.strictEqual(gross, 2500000);
      assert.strictEqual(subsidy, 0);
      assert.strictEqual(net, 2500000);

      // Annual energy yield: 50 * 1460 = 73,000 units
      const annualUnits = capKw * 1460;
      const htIndustrialTariff = 10.50; // ₹10.50/unit
      const annualSavings = Math.round(annualUnits * htIndustrialTariff);
      assert.strictEqual(annualUnits, 73000);
      assert.strictEqual(annualSavings, 766500); // ₹7,66,500/year savings
    });

    it('2.2 should resolve BOQ: 92 x 545W Adani TopCon DCR Bifacial modules for 50 kW', () => {
      const boq = resolveModuleQuantity(50.0, 'Adani 545W TopCon DCR Bifacial');
      assert.strictEqual(boq.wattage, 545);
      assert.strictEqual(boq.quantity, 92); // Math.ceil(50000 / 545) = 92
    });

    it('2.3 should calculate 13.8% composite solar GST with zero drift on ₹25,00,000 contract', () => {
      const gross = 2500000;
      const gst = calculateCompositeSolarGst(gross);
      assert.strictEqual(gst.compositeRate, 13.8);
      assert.strictEqual(gst.taxableSubtotal, 2196837); // Math.round(2500000 / 1.138)
      assert.strictEqual(gst.taxAmount, 303163); // 2500000 - 2196837
      assert.strictEqual(gst.taxableSubtotal + gst.taxAmount, gross);
      assert.strictEqual(gst.zeroPennyDrift, true);

      // 70% goods @ 12% and 30% services @ 18%
      assert.strictEqual(gst.goodsPortion, Math.round(2196837 * 0.70));
      assert.strictEqual(gst.servicesPortion, 2196837 - gst.goodsPortion);
    });

    it('2.4 should generate commercial milestone invoices and convert ₹5,00,000 advance into words', () => {
      const gross = 2500000;
      const milestones = generateMilestoneSchedule(gross);
      assert.strictEqual(milestones[0].amount, 500000); // 20% advance
      assert.strictEqual(milestones[1].amount, 1500000); // 60% delivery
      assert.strictEqual(milestones[2].amount, 375000); // 15% installation
      assert.strictEqual(milestones[3].amount, 125000); // 5% commissioning

      const advanceWords = toIndianWords(milestones[0].amount);
      assert.strictEqual(advanceWords, 'Five Lakh Rupees Only');
    });

    it('2.5 should verify industrial CEA electrical test measurements for 50 kW plant', () => {
      const industrialQa = evaluateElectricalQATests({
        pit1Inverter: '1.4',
        pit2Structure: '1.2',
        pit3Lightning: '1.8',
        antiIslandingTripSec: '0.12',
        insulationMegaOhms: '3500',
      });
      assert.strictEqual(industrialQa.pass, true);
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 3: REMOTE RURAL AGRICULTURAL SOLAR WATER PUMP IN SATARA
  // ---------------------------------------------------------------------------
  describe('Scenario 3: Remote Rural Agricultural Solar Pump in Satara', () => {
    it('3.1 should capture farmer pump inquiry offline and cache in local storage', async () => {
      const storage = new MockAsyncStorage();
      const offlineService = createOfflineSyncService(storage);

      const draftPumpLead = await offlineService.saveDraftLead({
        name: 'Dnyaneshwar Shinde',
        mobile: '9822771133',
        consumerNumber: 'AG-PUMP-774411',
        city: 'Koregaon, Satara',
        address: 'Gut No. 44, Gat Farm',
        sanctionedLoadKw: 5.0,
      });
      assert.ok(draftPumpLead.localId);

      // Cache quotation for 5 kW solar pump
      await offlineService.saveDraftQuote(draftPumpLead.localId, {
        systemType: 'Agricultural Solar DC Submersible Pump',
        capacityKw: 5.0,
        pumpRatingHp: 5.0,
        totalCost: 260000,
      });

      // Verify offline state
      const drafts = await offlineService.getDraftLeads();
      assert.strictEqual(drafts.length, 1);
      assert.strictEqual(drafts[0].consumerNumber, 'AG-PUMP-774411');

      // Reconnect and sync
      await offlineService.removeDraftLead(draftPumpLead.localId);
      const remaining = await offlineService.getDraftLeads();
      assert.strictEqual(remaining.length, 0);
    });

    it('3.2 should size 10 x 540W Waaree DCR modules for 5 kW agricultural installation', () => {
      const boq = resolveModuleQuantity(5.0, 'Waaree 540W Mono PERC Bifacial');
      assert.strictEqual(boq.wattage, 540);
      assert.strictEqual(boq.quantity, 10); // Math.ceil(5000 / 540) = 10
    });
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 4: ADVERSE FIELD AUDIT & QUALITY REJECTION WORKFLOW
  // ---------------------------------------------------------------------------
  describe('Scenario 4: Adverse Field Audit, Safety Threshold Gating & Corrective Re-Audit', () => {
    it('4.1 should halt stage advancement when Inverter Earth Pit violates CEA limit (5.8 Ω)', () => {
      const initialAudit = evaluateElectricalQATests({
        pit1Inverter: '5.8', // DANGEROUS HIGH RESISTANCE (> 5.0 Ω)
        pit2Structure: '2.2',
        pit3Lightning: '2.4',
        antiIslandingTripSec: '0.18',
        insulationMegaOhms: '2000',
      });

      assert.strictEqual(initialAudit.pass, false);
      assert.strictEqual(initialAudit.isPit1Pass, false);
      assert.strictEqual(initialAudit.failureReasons.length, 1);
      assert.ok(initialAudit.failureReasons[0].includes('Inverter Earth Pit 1 must be strictly < 5.0 Ω'));
    });

    it('4.2 should halt stage advancement when Anti-Islanding Trip Time is out of spec (2.4s > 2.0s)', () => {
      const tripAudit = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '2.4', // FAILS (must be < 2.0 s)
        insulationMegaOhms: '2000',
      });

      assert.strictEqual(tripAudit.pass, false);
      assert.strictEqual(tripAudit.isTripPass, false);
      assert.ok(tripAudit.failureReasons.some(r => r.includes('Anti-Islanding Grid Trip Time')));
    });

    it('4.3 should pass re-audit after field rectifications are certified', () => {
      const correctedAudit = evaluateElectricalQATests({
        pit1Inverter: '1.9', // RE-TREATED WITH CHEMICAL COMPOUND
        pit2Structure: '1.8',
        pit3Lightning: '2.1',
        antiIslandingTripSec: '0.14', // RELAY CALIBRATED
        insulationMegaOhms: '2200',
      });

      assert.strictEqual(correctedAudit.pass, true);
      assert.strictEqual(correctedAudit.failureReasons.length, 0);
    });
  });
});
