const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const solarCalc = require('../services/solarCalculator');

describe('Solar Calculation Engine Tests', () => {
  test('calculateSystemCapacity reconciles DC capacity correctly', () => {
    const res = solarCalc.calculateSystemCapacity({ panelWattage: 550, panelQuantity: 10 });
    assert.equal(res.dcCapacityKw, 5.5);
    assert.equal(res.panelWattage, 550);
    assert.equal(res.panelQuantity, 10);
    assert.equal(res.estimatedRoofAreaSqFt, 358);
  });

  test('calculateSolarGeneration computes 25-yr degradation and monthly curve', () => {
    const res = solarCalc.calculateSolarGeneration({ capacityKw: 5.0 });
    assert.equal(res.annualGeneration, 7300);
    assert.ok(res.lifetimeGeneration > 150000 && res.lifetimeGeneration < 180000);
    assert.equal(res.monthlyDistribution.length, 12);
    assert.equal(res.peakMonth, 'May');
    assert.ok(res.co2ReductionKg > 5000);
    assert.ok(res.treeEquivalent > 200);
  });

  test('calculateIndicativeSubsidy enforces PM Surya Ghar limits accurately', () => {
    // 1kW
    const res1 = solarCalc.calculateIndicativeSubsidy({ capacityKw: 1.0, connectionType: 'Residential' });
    assert.equal(res1.indicativeSubsidy, 30000);
    assert.equal(res1.isEligible, true);

    // 2kW
    const res2 = solarCalc.calculateIndicativeSubsidy({ capacityKw: 2.0, connectionType: 'Residential' });
    assert.equal(res2.indicativeSubsidy, 60000);

    // 3kW
    const res3 = solarCalc.calculateIndicativeSubsidy({ capacityKw: 3.0, connectionType: 'Residential' });
    assert.equal(res3.indicativeSubsidy, 78000);

    // 10kW cap at 78,000
    const res10 = solarCalc.calculateIndicativeSubsidy({ capacityKw: 10.0, connectionType: 'Residential' });
    assert.equal(res10.indicativeSubsidy, 78000);

    // Commercial -> 0
    const resComm = solarCalc.calculateIndicativeSubsidy({ capacityKw: 5.0, connectionType: 'Commercial' });
    assert.equal(resComm.indicativeSubsidy, 0);
    assert.equal(resComm.isEligible, false);
  });

  test('calculateFinancialROI computes payback and 25-yr cash flow', () => {
    const res = solarCalc.calculateFinancialROI({
      capacityKw: 5.0,
      totalInvestment: 280000,
      connectionType: 'Residential',
      indicativeSubsidy: 78000
    });

    assert.equal(res.netInvestment, 202000);
    assert.ok(res.annualSavings > 50000);
    assert.ok(res.paybackYears >= 3 && res.paybackYears <= 5);
    assert.equal(res.financialProjections.length, 25);
    assert.ok(res.lifetimeSavings > 1500000);
  });

  test('calculateCommercialPricing computes line totals, taxes, discounts, and words', () => {
    const items = [
      { description: 'Waaree 550Wp Panels', quantity: 10, unitPrice: 11000, taxRate: 12, discount: 0 },
      { description: 'Growatt 5kW Inverter', quantity: 1, unitPrice: 40000, taxRate: 12, discount: 0 },
      { description: 'Turnkey Installation Services', quantity: 1, unitPrice: 30000, taxRate: 18, discount: 0 }
    ];

    const pricing = solarCalc.calculateCommercialPricing({ items, overallDiscount: 5000 });
    assert.equal(pricing.subtotal, 180000);
    assert.equal(pricing.discount, 5000);
    assert.equal(pricing.taxableAmount, 175000);
    assert.ok(pricing.tax > 0);
    assert.equal(pricing.grandTotal, pricing.taxableAmount + pricing.tax);
    assert.equal(pricing.cgst + pricing.sgst, pricing.tax);
    assert.ok(pricing.amountInWords.includes('RUPEES'));
  });

  test('generateMilestones splits grand total accurately', () => {
    const milestones = solarCalc.generateMilestones(200000);
    assert.equal(milestones.length, 4);
    assert.equal(milestones[0].percentage, 20);
    assert.equal(milestones[0].amount, 40000);
    assert.equal(milestones[1].percentage, 60);
    assert.equal(milestones[1].amount, 120000);
    assert.equal(milestones[2].percentage, 15);
    assert.equal(milestones[2].amount, 30000);
    assert.equal(milestones[3].percentage, 5);
    assert.equal(milestones[3].amount, 10000);
    const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
    assert.equal(sum, 200000);
  });

  test('toIndianWords converts Lakhs and Crores accurately', () => {
    assert.equal(solarCalc.toIndianWords(275000), 'RUPEES TWO LAKH SEVENTY FIVE THOUSAND ONLY');
    assert.equal(solarCalc.toIndianWords(15000000), 'RUPEES ONE CRORE FIFTY LAKH ONLY');
    assert.equal(solarCalc.formatINR(275000), '2,75,000');
  });
});
