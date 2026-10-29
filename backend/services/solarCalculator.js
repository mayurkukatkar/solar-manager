/**
 * Centralized Solar Calculation Engine for WhereReady Solar OS
 * Authoritative business calculations for technical specs, generation,
 * economic savings, tax breakdown, subsidies, milestones, and ROI.
 */

// Format INR currency: e.g. 275000 -> "2,75,000"
function formatINR(val) {
  if (!val && val !== 0) return '0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(Math.round(val));
}

// Convert number to Indian currency in words
function toIndianWords(num) {
  if (!num || isNaN(num)) return 'ZERO RUPEES ONLY';
  const a = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convertTens(n) {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  }

  function convertHundreds(n) {
    if (n > 99) {
      return a[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + convertTens(n % 100) : '');
    }
    return convertTens(n);
  }

  let n = Math.round(Math.abs(num));
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;
  let remainder = Math.floor(n);

  let str = '';
  if (crore > 0) str += convertHundreds(crore) + ' CRORE ';
  if (lakh > 0) str += convertHundreds(lakh) + ' LAKH ';
  if (thousand > 0) str += convertHundreds(thousand) + ' THOUSAND ';
  if (remainder > 0) str += convertHundreds(remainder) + ' ';

  return ('RUPEES ' + str.trim() + ' ONLY').toUpperCase();
}

/**
 * Technical Capacity & Hardware Reconciliation
 */
function calculateSystemCapacity({ panelWattage = 550, panelQuantity = 9 }) {
  const wattage = Number(panelWattage) || 550;
  const quantity = Number(panelQuantity) || 1;
  const dcCapacityKw = Number(((wattage * quantity) / 1000).toFixed(2));
  const estimatedRoofAreaSqFt = Math.round(dcCapacityKw * 65); // approx 65 sq ft per kWp

  return {
    dcCapacityKw,
    panelWattage: wattage,
    panelQuantity: quantity,
    estimatedRoofAreaSqFt
  };
}

/**
 * Solar Generation & Irradiance Estimates
 */
function calculateSolarGeneration({
  capacityKw = 5.0,
  annualSpecificYieldKwhPerKwp = 1460, // ~4.0 kWh/kWp/day
  annualDegradationRate = 0.007 // 0.7% degradation per year
}) {
  const cap = Number(capacityKw) || 5.0;
  const annualGen = Math.round(cap * annualSpecificYieldKwhPerKwp);

  // 25-Year Cumulative generation accounting for compounding degradation
  let lifetimeGen = 0;
  const yearlyGeneration = [];
  for (let y = 1; y <= 25; y++) {
    const gen = Math.round(annualGen * Math.pow(1 - annualDegradationRate, y - 1));
    lifetimeGen += gen;
    yearlyGeneration.push({ year: y, generationKwh: gen });
  }

  // Monthly irradiance distribution (Western/Central India Solar Irradiance Profile)
  const monthlyDistribution = [
    { month: 'January', percentage: 8.2, generation: Math.round(annualGen * 0.082) },
    { month: 'February', percentage: 8.8, generation: Math.round(annualGen * 0.088) },
    { month: 'March', percentage: 9.8, generation: Math.round(annualGen * 0.098) },
    { month: 'April', percentage: 10.2, generation: Math.round(annualGen * 0.102) },
    { month: 'May', percentage: 10.6, generation: Math.round(annualGen * 0.106) }, // Peak
    { month: 'June', percentage: 7.2, generation: Math.round(annualGen * 0.072) }, // Monsoon onset
    { month: 'July', percentage: 6.1, generation: Math.round(annualGen * 0.061) }, // Lowest
    { month: 'August', percentage: 6.4, generation: Math.round(annualGen * 0.064) },
    { month: 'September', percentage: 7.6, generation: Math.round(annualGen * 0.076) },
    { month: 'October', percentage: 8.6, generation: Math.round(annualGen * 0.086) },
    { month: 'November', percentage: 8.4, generation: Math.round(annualGen * 0.084) },
    { month: 'December', percentage: 8.1, generation: Math.round(annualGen * 0.081) }
  ];

  // Environmental Metrics
  const co2ReductionKg = Math.round(annualGen * 0.82); // 0.82 kg CO2 per kWh grid emissions in India
  const treeEquivalent = Math.round(co2ReductionKg / 20); // 1 mature tree absorbs ~20kg CO2/year

  return {
    annualGeneration: annualGen,
    lifetimeGeneration: lifetimeGen,
    monthlyDistribution,
    yearlyGeneration,
    co2ReductionKg,
    treeEquivalent,
    peakMonth: 'May'
  };
}

/**
 * Indicative Central Government Subsidy (PM Surya Ghar Muft Bijli Yojana)
 */
function calculateIndicativeSubsidy({ capacityKw = 5.0, connectionType = 'Residential' }) {
  if (connectionType !== 'Residential') {
    return {
      indicativeSubsidy: 0,
      isEligible: false,
      reason: 'Subsidy is applicable only for verified Individual Residential rooftop connections under PM Surya Ghar.'
    };
  }

  const cap = Number(capacityKw) || 0;
  if (!cap || cap <= 0) {
    return {
      indicativeSubsidy: 0,
      isEligible: false,
      breakdown: 'Invalid capacity',
      netPayableEstimate: 0,
      disclaimer: 'Capacity must be greater than 0 kW.'
    };
  }

  let subsidy = 0;
  if (cap >= 3) {
    subsidy = 78000;
  } else if (cap >= 2) {
    subsidy = 60000;
  } else if (cap >= 1) {
    subsidy = 30000;
  } else {
    subsidy = Math.round(cap * 30000);
  }

  return {
    indicativeSubsidy: subsidy,
    isEligible: true,
    schemeName: 'PM Surya Ghar: Muft Bijli Yojana (Central Financial Assistance)',
    disclaimer: 'Indicative estimate. Central Financial Assistance (CFA) is credited directly to consumer bank account via DBT post DISCOM inspection and commissioning.'
  };
}

/**
 * Comprehensive Financial ROI & 25-Year Cash Flow Projection
 */
function calculateFinancialROI({
  capacityKw = 5.0,
  totalInvestment = 275000,
  connectionType = 'Residential',
  currentMonthlyBill = 0,
  gridTariff = 0,
  tariffEscalationRate = 0.03, // 3% annual grid tariff increase
  annualDegradationRate = 0.007,
  indicativeSubsidy = 0
}) {
  const cap = Number(capacityKw) || 5.0;
  const cost = Number(totalInvestment) || 275000;
  const tariff = Number(gridTariff) || (connectionType === 'Residential' ? 8.5 : 10.5);

  const genData = calculateSolarGeneration({ capacityKw: cap, annualDegradationRate });
  const year1Generation = genData.annualGeneration;

  // Annual savings Year 1
  const annualSavingsYear1 = Math.round(year1Generation * tariff);
  const monthlySavingsYear1 = Math.round(annualSavingsYear1 / 12);

  // Net cost after verified indicative subsidy
  const netInvestment = Math.max(0, cost - Number(indicativeSubsidy || 0));

  // Payback period
  const paybackYears = annualSavingsYear1 > 0 ? Number((netInvestment / annualSavingsYear1).toFixed(1)) : 4.5;

  // 25-Year Financial Cash Flow Simulation
  let cumulativeSavings = 0;
  let lifetimeSavings = 0;
  const financialProjections = [];

  for (let year = 1; year <= 25; year++) {
    const currentTariff = tariff * Math.pow(1 + tariffEscalationRate, year - 1);
    const yearlyGen = year1Generation * Math.pow(1 - annualDegradationRate, year - 1);
    const grossSavings = Math.round(yearlyGen * currentTariff);

    // Minor O&M maintenance allowance starting Year 6
    const opex = year > 5 ? Math.round(cap * 600) : 0;
    // Expected Inverter replacement / capacitor refurbishing reserve at Year 12
    const inverterReserve = year === 12 ? Math.round(cap * 4500) : 0;

    const netYearlySavings = grossSavings - opex - inverterReserve;
    lifetimeSavings += grossSavings;
    cumulativeSavings += netYearlySavings;

    financialProjections.push({
      year,
      generationKwh: Math.round(yearlyGen),
      gridTariffPerUnit: Number(currentTariff.toFixed(2)),
      grossSavings,
      netYearlySavings,
      cumulativeSavings,
      netCashFlow: cumulativeSavings - netInvestment
    });
  }

  // Commercial Accelerated Depreciation Benefit (if commercial)
  let commercialTaxBenefit = 0;
  if (connectionType === 'Commercial' || connectionType === 'Industrial') {
    // 40% accelerated depreciation under Section 32 at 25.17% corporate tax rate
    commercialTaxBenefit = Math.round(cost * 0.40 * 0.2517);
  }

  return {
    annualSavings: annualSavingsYear1,
    monthlySavings: monthlySavingsYear1,
    lifetimeSavings,
    paybackYears,
    netInvestment,
    commercialTaxBenefit,
    financialProjections,
    assumptions: {
      initialTariff: tariff,
      tariffEscalationRatePercent: tariffEscalationRate * 100,
      annualDegradationPercent: annualDegradationRate * 100,
      expectedLifetimeYears: 25
    }
  };
}

/**
 * Solar Loan / EMI Financing Calculator
 */
function calculateLoanEMI({
  totalAmount = 275000,
  downPaymentPercent = 20,
  annualInterestRate = 9.5, // 9.5% p.a. solar loan rate (SBI Surya Ghar / Canara / PNB)
  tenureYears = 5
}) {
  const total = Number(totalAmount) || 0;
  const downPayment = Math.round(total * (Number(downPaymentPercent) / 100));
  const principal = total - downPayment;
  const r = (Number(annualInterestRate) / 12) / 100;
  const n = Number(tenureYears) * 12;

  let monthlyEmi = 0;
  if (principal > 0 && r > 0 && n > 0) {
    monthlyEmi = Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  }

  const totalRepayment = monthlyEmi * n;
  const totalInterest = totalRepayment - principal;

  return {
    totalInvestment: total,
    downPayment,
    loanPrincipal: principal,
    annualInterestRate,
    tenureYears,
    tenureMonths: n,
    monthlyEmi,
    totalRepayment,
    totalInterest
  };
}

/**
 * Commercial Line Items & GST Tax Calculation
 */
function calculateCommercialPricing({
  items = [],
  overallDiscount = 0,
  useCompositeSolarGST = false, // 13.8% composite solar GST vs individual item GST
  taxRatePercent = 13.8
}) {
  let subtotal = 0;

  // 1. Calculate raw un-discounted base amount for each line item
  const rawItems = (items || []).map((item, idx) => {
    const qty = Math.max(0, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const discount = Math.max(0, Number(item.discount) || 0);
    const rawBase = Math.max(0, (qty * unitPrice) - discount);

    let taxRate = Number(item.taxRate);
    if (isNaN(taxRate) || taxRate === null || taxRate === undefined) {
      taxRate = useCompositeSolarGST ? 13.8 : 12.0;
    }

    subtotal += rawBase;

    return {
      id: item.id || `item-${idx + 1}`,
      productId: item.productId || null,
      category: item.category || 'CUSTOM',
      description: item.description || 'Solar Component / Service',
      quantity: qty,
      unit: item.unit || 'NOS',
      purchaseCost: Number(item.purchaseCost) || 0,
      unitPrice,
      discount,
      rawBase,
      taxRate
    };
  });

  // 2. Commercial overall discount & taxable amount
  const discountAmount = Math.max(0, Math.min(subtotal, Number(overallDiscount) || 0));
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // 3. Proportionally scale item taxable amounts under Section 15(3) CGST Act
  const discountScale = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 0;

  let runningBaseSum = 0;
  const calculatedItems = rawItems.map((item, idx) => {
    let itemBase;
    if (discountAmount > 0 && subtotal > 0) {
      if (idx === rawItems.length - 1) {
        // Last item absorbs any rounding discrepancy so sum strictly matches taxableAmount
        itemBase = Math.max(0, taxableAmount - runningBaseSum);
      } else {
        itemBase = Math.round(item.rawBase * discountScale);
        runningBaseSum += itemBase;
      }
    } else {
      itemBase = item.rawBase;
    }

    return {
      id: item.id,
      productId: item.productId,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      purchaseCost: item.purchaseCost,
      unitPrice: item.unitPrice,
      discount: item.discount,
      baseAmount: itemBase,
      taxRate: item.taxRate,
      taxAmount: 0,
      total: itemBase
    };
  });

  // 4. Calculate Taxes on discounted bases
  let totalTax = 0;
  if (useCompositeSolarGST) {
    // 13.8% composite solar GST (70% material @ 12% + 30% service @ 18%)
    totalTax = Math.round(taxableAmount * (Number(taxRatePercent) || 13.8) / 100);
    // Line items retain itemBase and taxAmount = 0 (composite GST applied at order/invoice level)
    calculatedItems.forEach(item => {
      item.taxAmount = 0;
      item.total = item.baseAmount;
    });
  } else {
    // Individual item GST rates on discounted taxable base
    let runningTaxSum = 0;
    calculatedItems.forEach((item, idx) => {
      const itemTax = Math.round(item.baseAmount * (item.taxRate / 100));
      item.taxAmount = itemTax;
      item.total = item.baseAmount + itemTax;
      runningTaxSum += itemTax;
    });
    totalTax = runningTaxSum;
  }

  const grandTotal = taxableAmount + totalTax;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;

  return {
    items: calculatedItems,
    subtotal,
    discount: discountAmount,
    overallDiscount: discountAmount,
    taxableAmount,
    tax: totalTax,
    totalTax,
    cgst,
    sgst,
    igst: totalTax,
    grandTotal,
    amountInWords: toIndianWords(grandTotal),
    milestones: generateMilestones(grandTotal)
  };
}

/**
 * Standard Milestones Rebalancer
 */
function generateMilestones(grandTotal, customMilestones) {
  const total = Number(grandTotal) || 0;
  const milestones = customMilestones && customMilestones.length > 0
    ? customMilestones
    : [
        { percentage: 20, description: 'Advance booking along with signed proposal / work order' },
        { percentage: 60, description: 'Upon dispatch & delivery of modules, inverter and structure at site' },
        { percentage: 15, description: 'Upon completion of mechanical & electrical installation' },
        { percentage: 5, description: 'Upon MSEDCL Net Metering commissioning & project handover' }
      ];

  const result = milestones.map((m, index) => {
    const pct = Number(m.percentage) || 0;
    const amount = Math.round(total * (pct / 100));
    return {
      stage: index + 1,
      percentage: pct,
      amount,
      description: m.description
    };
  });

  if (result.length > 1) {
    const milestoneSum = result.slice(0, result.length - 1).reduce((sum, m) => sum + m.amount, 0);
    result[result.length - 1].amount = total - milestoneSum;
  }

  return result;
}

module.exports = {
  formatINR,
  toIndianWords,
  calculateSystemCapacity,
  calculateSolarGeneration,
  calculateIndicativeSubsidy,
  calculateFinancialROI,
  calculateLoanEMI,
  calculateCommercialPricing,
  generateMilestones
};
