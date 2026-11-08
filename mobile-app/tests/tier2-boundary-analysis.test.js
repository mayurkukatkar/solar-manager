/**
 * Tier 2: Boundary Value Analysis & Negative Conditions Suite
 * WhereReady Solar OS Mobile Client
 * 
 * Tests boundary conditions, edge cases, strict statutory thresholds,
 * adversarial formatting, and negative inputs across all core domains:
 * 
 * 1. DISCOM Consumer Number Boundaries & Format Validation
 * 2. Solar Capacity Limits, Negative Handling & Subsidy Caps
 * 3. 13.8% Composite GST Rounding & Zero Penny Drift Invariants
 * 4. Electrical CEA Safety Threshold Strict Boundaries (<5.0Ω, <2.0s, >1.0MΩ)
 * 5. 2D Barcode Scanner & Multi-Level Duplicate Collision Boundaries
 * 6. Indian Rupee Words Converter Boundary & Extreme Scale Numbers
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  computeSubsidy,
  calculateSolarFinancials,
  validateOnboardingSubmission,
  calculateCompositeSolarGst,
  parseAndValidateBarcode,
  detectDuplicateSerial,
  evaluateElectricalQATests,
  toIndianWords,
  generateMilestoneSchedule,
} = require('./test-helpers');

describe('Tier 2: Boundary Value Analysis & Negative Constraints (Mobile Client)', () => {

  // ---------------------------------------------------------------------------
  // BOUNDARY 1: DISCOM CONSUMER NUMBER BOUNDARIES & FORMAT VALIDATION
  // ---------------------------------------------------------------------------
  describe('Boundary 1: DISCOM Consumer Number Boundaries', () => {
    it('1.1 should reject consumer number with exactly 5 characters (1 char below 6 min)', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Ajay Shinde',
        mobile: '9876543210',
        consumerNumber: '12345',
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Invalid Consumer Number');
    });

    it('1.2 should accept consumer number with exactly 6 characters (lower boundary)', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Ajay Shinde',
        mobile: '9876543210',
        consumerNumber: '123456',
      });
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.consumerNumber, '123456');
    });

    it('1.3 should accept standard 12-digit MSEDCL consumer number', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Ajay Shinde',
        mobile: '9876543210',
        consumerNumber: '028510293812',
      });
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.consumerNumber, '028510293812');
    });

    it('1.4 should trim leading and trailing whitespace from consumer number', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Ajay Shinde',
        mobile: '9876543210',
        consumerNumber: '   028510293812   ',
      });
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.consumerNumber, '028510293812');
    });

    it('1.5 should reject consumer number containing only whitespace', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Ajay Shinde',
        mobile: '9876543210',
        consumerNumber: '      ',
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'DISCOM Consumer No. Compulsory');
    });

    it('1.6 should accept alphanumeric LT industrial / commercial consumer code >= 6 chars', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Ajay Shinde',
        mobile: '9876543210',
        consumerNumber: 'LT-PUN-98214',
      });
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.consumerNumber, 'LT-PUN-98214');
    });

    it('1.7 should reject null or undefined consumer number gracefully', () => {
      const res = validateOnboardingSubmission({
        legalName: 'Ajay Shinde',
        mobile: '9876543210',
        consumerNumber: null,
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'DISCOM Consumer No. Compulsory');
    });
  });

  // ---------------------------------------------------------------------------
  // BOUNDARY 2: SOLAR CAPACITY LIMITS, NEGATIVE HANDLING & SUBSIDY CAPS
  // ---------------------------------------------------------------------------
  describe('Boundary 2: Solar Capacity Limits & PM Surya Ghar Subsidy Caps', () => {
    it('2.1 should return ₹0 subsidy for negative capacity (-3.3 kW)', () => {
      assert.strictEqual(computeSubsidy(-3.3), 0);
    });

    it('2.2 should return ₹0 subsidy for 0 kW capacity', () => {
      assert.strictEqual(computeSubsidy(0), 0);
    });

    it('2.3 should return ₹30,000 subsidy for micro-system (0.5 kW)', () => {
      assert.strictEqual(computeSubsidy(0.5), 30000);
    });

    it('2.4 should award exactly ₹30,000 subsidy at exact 1.0 kW slab boundary', () => {
      assert.strictEqual(computeSubsidy(1.0), 30000);
    });

    it('2.5 should award exactly ₹60,000 subsidy at exact 2.0 kW slab boundary', () => {
      assert.strictEqual(computeSubsidy(2.0), 60000);
    });

    it('2.6 should award capped ₹78,000 subsidy for system just above 2 kW (e.g. 2.1 kW)', () => {
      assert.strictEqual(computeSubsidy(2.1), 78000);
    });

    it('2.7 should award capped ₹78,000 subsidy at exact 3.0 kW slab boundary', () => {
      assert.strictEqual(computeSubsidy(3.0), 78000);
    });

    it('2.8 should cap residential subsidy at strictly ₹78,000 for large systems (100.0 kW)', () => {
      assert.strictEqual(computeSubsidy(100.0), 78000);
    });
  });

  // ---------------------------------------------------------------------------
  // BOUNDARY 3: 13.8% COMPOSITE GST ROUNDING & ODD CONTRACT AMOUNTS
  // ---------------------------------------------------------------------------
  describe('Boundary 3: 13.8% Composite GST Rounding & Zero Penny Drift', () => {
    it('3.1 should maintain taxableSubtotal + taxAmount === gross with ZERO drift on odd ₹2,75,001', () => {
      const gst = calculateCompositeSolarGst(275001);
      assert.strictEqual(gst.taxableSubtotal + gst.taxAmount, 275001);
      assert.strictEqual(gst.zeroPennyDrift, true);
    });

    it('3.2 should maintain ZERO drift on odd prime amount ₹3,47,999', () => {
      const gst = calculateCompositeSolarGst(347999);
      assert.strictEqual(gst.taxableSubtotal + gst.taxAmount, 347999);
      assert.strictEqual(gst.zeroPennyDrift, true);
    });

    it('3.3 should maintain ZERO drift on lowest integer unit ₹1', () => {
      const gst = calculateCompositeSolarGst(1);
      assert.strictEqual(gst.taxableSubtotal + gst.taxAmount, 1);
      assert.strictEqual(gst.zeroPennyDrift, true);
    });

    it('3.4 should maintain ZERO drift on large commercial amount ₹1,23,45,678', () => {
      const gst = calculateCompositeSolarGst(12345678);
      assert.strictEqual(gst.taxableSubtotal + gst.taxAmount, 12345678);
      assert.strictEqual(gst.zeroPennyDrift, true);
    });

    it('3.5 should handle 100% trade discount (effectiveGross = 0) with 0 tax and 0 subtotal', () => {
      const gst = calculateCompositeSolarGst(100000, 100000);
      assert.strictEqual(gst.effectiveGross, 0);
      assert.strictEqual(gst.taxableSubtotal, 0);
      assert.strictEqual(gst.taxAmount, 0);
      assert.strictEqual(gst.zeroPennyDrift, true);
    });

    it('3.6 should clamp negative effective gross when trade discount exceeds gross amount', () => {
      const gst = calculateCompositeSolarGst(50000, 60000);
      assert.strictEqual(gst.effectiveGross, 0);
      assert.strictEqual(gst.taxableSubtotal, 0);
      assert.strictEqual(gst.taxAmount, 0);
    });

    it('3.7 should guarantee 4-stage milestone allocations sum exactly to gross total for odd amounts', () => {
      const milestones = generateMilestoneSchedule(275001);
      const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
      assert.strictEqual(sum, 275001);
    });
  });

  // ---------------------------------------------------------------------------
  // BOUNDARY 4: ELECTRICAL CEA SAFETY THRESHOLD STRICT BOUNDARIES
  // ---------------------------------------------------------------------------
  describe('Boundary 4: Electrical CEA Safety Threshold Boundaries', () => {
    it('4.1 should pass Inverter Earth Pit 1 at 4.99 Ω and fail at exactly 5.00 Ω (CEA threshold)', () => {
      const passCase = evaluateElectricalQATests({
        pit1Inverter: '4.99',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '500',
      });
      assert.strictEqual(passCase.isPit1Pass, true);
      assert.strictEqual(passCase.pass, true);

      const failCase = evaluateElectricalQATests({
        pit1Inverter: '5.00', // Boundary condition: strictly < 5.0 required
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '500',
      });
      assert.strictEqual(failCase.isPit1Pass, false);
      assert.strictEqual(failCase.pass, false);
    });

    it('4.2 should pass Structure Earth Pit 2 at 4.99 Ω and fail at 5.00 Ω', () => {
      const passCase = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '4.99',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '500',
      });
      assert.strictEqual(passCase.isPit2Pass, true);

      const failCase = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '5.00',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '500',
      });
      assert.strictEqual(failCase.isPit2Pass, false);
    });

    it('4.3 should pass Lightning Arrestor Pit 3 at 4.99 Ω and fail at 5.00 Ω', () => {
      const passCase = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '4.99',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '500',
      });
      assert.strictEqual(passCase.isPit3Pass, true);

      const failCase = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '5.00',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '500',
      });
      assert.strictEqual(failCase.isPit3Pass, false);
    });

    it('4.4 should pass Anti-Islanding Grid Trip at 1.99 s and fail at exactly 2.00 s (IEEE 1547 / CEA)', () => {
      const passCase = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '1.99',
        insulationMegaOhms: '500',
      });
      assert.strictEqual(passCase.isTripPass, true);

      const failCase = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '2.00', // Boundary condition: strictly < 2.0 required
        insulationMegaOhms: '500',
      });
      assert.strictEqual(failCase.isTripPass, false);
    });

    it('4.5 should pass Inverter Insulation Resistance at 1.01 MΩ and fail at exactly 1.00 MΩ', () => {
      const passCase = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '1.01',
      });
      assert.strictEqual(passCase.isInsulationPass, true);

      const failCase = evaluateElectricalQATests({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '1.00', // Boundary condition: strictly > 1.0 required
      });
      assert.strictEqual(failCase.isInsulationPass, false);
    });

    it('4.6 should reject negative earth pit readings (-0.5 Ω) as instrument error', () => {
      const res = evaluateElectricalQATests({
        pit1Inverter: '-0.5',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '500',
      });
      assert.strictEqual(res.isPit1Pass, false);
      assert.strictEqual(res.pass, false);
    });

    it('4.7 should reject non-numeric string values with explicit failure reasons', () => {
      const res = evaluateElectricalQATests({
        pit1Inverter: 'INVALID_OHMS',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '500',
      });
      assert.strictEqual(res.isPit1Pass, false);
      assert.strictEqual(res.pass, false);
      assert.ok(res.failureReasons.length >= 1);
    });
  });

  // ---------------------------------------------------------------------------
  // BOUNDARY 5: 2D BARCODE SCANNER & MULTI-LEVEL DUPLICATE COLLISION BOUNDARIES
  // ---------------------------------------------------------------------------
  describe('Boundary 5: 2D Barcode Scanner & Duplicate Serial Collision Boundaries', () => {
    it('5.1 should reject barcode with exactly 4 characters (below 5 char min)', () => {
      assert.strictEqual(parseAndValidateBarcode('WAA1'), null);
    });

    it('5.2 should parse barcode with exactly 5 characters (lower boundary)', () => {
      const res = parseAndValidateBarcode('WAA01');
      assert.ok(res);
      assert.strictEqual(res.serial, 'WAA01');
    });

    it('5.3 should detect case-insensitive duplicates (e.g. waa-540-001 vs WAA-540-001)', () => {
      const check = detectDuplicateSerial('waa-540-001', ['WAA-540-001']);
      assert.strictEqual(check.isDuplicate, true);
    });

    it('5.4 should detect whitespace-padded duplicates (e.g. "  WAA-540-001  ")', () => {
      const check = detectDuplicateSerial('   WAA-540-001   ', ['WAA-540-001']);
      assert.strictEqual(check.isDuplicate, true);
    });

    it('5.5 should block collision when candidate matches project inverter serial number', () => {
      const check = detectDuplicateSerial('INV-SOLIS-9922', ['WAA-001'], 'INV-SOLIS-9922');
      assert.strictEqual(check.isDuplicate, true);
      assert.strictEqual(check.reason, 'Matches existing inverter serial number');
    });

    it('5.6 should detect collision against saved project module serial records', () => {
      const project = { moduleSerials: ['WAA-PRIOR-01', 'WAA-PRIOR-02'] };
      const check = detectDuplicateSerial('WAA-PRIOR-01', [], '', project);
      assert.strictEqual(check.isDuplicate, true);
      assert.strictEqual(check.reason, 'Already recorded in project module serials');
    });

    it('5.7 should detect collision against DCR certificate serial string records', () => {
      const project = { dcrModuleSerials: 'WAA-DCR-101\nWAA-DCR-102\nWAA-DCR-103' };
      const check = detectDuplicateSerial('WAA-DCR-102', [], '', project);
      assert.strictEqual(check.isDuplicate, true);
      assert.strictEqual(check.reason, 'Already registered in project DCR certificate records');
    });
  });

  // ---------------------------------------------------------------------------
  // BOUNDARY 6: INDIAN RUPEE WORDS CONVERTER BOUNDARY & EXTREME SCALE NUMBERS
  // ---------------------------------------------------------------------------
  describe('Boundary 6: Indian Rupee Words Converter Boundary & Extreme Values', () => {
    it('6.1 should return "Zero Rupees Only" for 0 or negative values', () => {
      assert.strictEqual(toIndianWords(0), 'Zero Rupees Only');
      assert.strictEqual(toIndianWords(-500), 'Zero Rupees Only');
    });

    it('6.2 should convert boundary value 1 to "One Rupees Only"', () => {
      assert.strictEqual(toIndianWords(1), 'One Rupees Only');
    });

    it('6.3 should convert boundary value 1,000 to "One Thousand Rupees Only"', () => {
      assert.strictEqual(toIndianWords(1000), 'One Thousand Rupees Only');
    });

    it('6.4 should convert boundary value 1,00,000 to "One Lakh Rupees Only"', () => {
      assert.strictEqual(toIndianWords(100000), 'One Lakh Rupees Only');
    });

    it('6.5 should convert boundary value 1,00,00,000 to "One Crore Rupees Only"', () => {
      assert.strictEqual(toIndianWords(10000000), 'One Crore Rupees Only');
    });

    it('6.6 should convert multi-tier complex amount ₹25,48,750 accurately', () => {
      const words = toIndianWords(2548750);
      assert.strictEqual(words, 'Twenty Five Lakh Forty Eight Thousand Seven Hundred and Fifty Rupees Only');
    });

    it('6.7 should handle overflow gracefully for numbers exceeding 9 digits', () => {
      const words = toIndianWords(10000000000); // 1000 Crore (>9 digits)
      assert.strictEqual(words, 'Overflow Rupees Only');
    });
  });
});
