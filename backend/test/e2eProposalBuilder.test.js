const test = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { 
  calculateCommercialPricing, 
  calculateIndicativeSubsidy, 
  calculateFinancialROI 
} = require('../services/solarCalculator.js');

const prisma = new PrismaClient();

test('E2E Dynamic Solar Proposal & Quotation Builder Integration Suite', async (t) => {
  // Setup or get first tenant
  const tenant = await prisma.tenant.findFirst({
    include: { proposalTemplates: true }
  });
  assert.ok(tenant, 'A tenant must exist in the database');

  let createdQuotationId = null;

  await t.test('1. Retrieve Seeded Multi-Template Catalog for Tenant', async () => {
    const templates = await prisma.proposalTemplate.findMany({
      where: { tenantId: tenant.id }
    });
    assert.ok(templates.length >= 5, `Tenant should have at least 5 templates seeded, found: ${templates.length}`);

    const codes = templates.map(t => t.code);
    assert.ok(codes.includes('quick_quote'), 'Should contain quick_quote template');
    assert.ok(codes.includes('residential_proposal'), 'Should contain residential_proposal template');
    assert.ok(codes.includes('commercial_epc'), 'Should contain commercial_epc template');
    assert.ok(codes.includes('hybrid_offgrid'), 'Should contain hybrid_offgrid template');
    assert.ok(codes.includes('custom_1'), 'Should contain custom_1 template');
  });

  await t.test('2. Create Full 6-Step Dynamic Quotation with Enriched Specifications', async () => {
    const defaultTemplate = await prisma.proposalTemplate.findFirst({
      where: { tenantId: tenant.id, isDefault: true }
    }) || await prisma.proposalTemplate.findFirst({ where: { tenantId: tenant.id } });

    // Server-side calculation verification
    const items = [
      {
        category: 'MODULE',
        description: 'Waaree 550Wp Mono PERC Bifacial Solar PV Modules',
        quantity: 9,
        unit: 'Nos',
        purchaseCost: 11000,
        unitPrice: 13500,
        taxRate: 12
      },
      {
        category: 'INVERTER',
        description: 'Growatt 5kW Hybrid Inverter with Dual MPPT',
        quantity: 1,
        unit: 'Nos',
        purchaseCost: 45000,
        unitPrice: 55000,
        taxRate: 12
      },
      {
        category: 'BATTERY',
        description: 'Tata Power 48V 100Ah LiFePO4 Energy Storage Battery',
        quantity: 1,
        unit: 'Nos',
        purchaseCost: 75000,
        unitPrice: 90000,
        taxRate: 18
      },
      {
        category: 'SERVICES',
        description: 'Turnkey Installation, Structure, Net Metering Liasoning',
        quantity: 1,
        unit: 'Job',
        purchaseCost: 25000,
        unitPrice: 35000,
        taxRate: 18
      }
    ];

    const calc = calculateCommercialPricing({ items, overallDiscount: 5000 });
    const subsidy = calculateIndicativeSubsidy({ capacityKw: 5.0, connectionType: 'Residential' });

    const quotation = await prisma.quotation.create({
      data: {
        tenantId: tenant.id,
        qNumber: `QT-E2E-${Date.now()}`,
        status: 'DRAFT',
        templateId: defaultTemplate?.id || null,
        templateType: 'hybrid_offgrid',
        sectionsConfig: defaultTemplate?.sections || [],
        designConfig: {
          primaryColor: '#0284c7',
          accentColor: '#059669',
          coverLayout: 'modern'
        },

        // Technical specs
        systemCapacity: 5.0,
        inverterCapacity: 5.0,
        systemType: 'Hybrid',
        connectionType: 'Residential',
        phase: 'Single Phase',
        roofType: 'RCC Flat Roof',
        roofAreaSqFt: 650,

        // Utility bill
        consumerNumber: '081293847192',
        discom: 'MSEDCL',
        billingUnit: '4134 Pune City Urban',
        sanctionedLoad: 6.0,
        tariffRate: 8.5,
        monthlyBill: 4500,
        monthlyUnits: 420,

        // Equipment
        panelBrand: 'Waaree',
        panelModel: '550Wp Mono PERC Bifacial',
        panelWattage: 550,
        panelQuantity: 9,
        panelWarranty: '25 Years OEM Performance',

        inverterBrand: 'Growatt',
        inverterModel: '5kW Hybrid Dual MPPT',
        inverterQuantity: 1,
        inverterWarranty: '10 Years Replacement',

        batteryBrand: 'Tata Power',
        batteryModel: '48V 100Ah LiFePO4',
        batteryCapacity: 4.8,
        batteryQuantity: 1,
        batteryWarranty: '5 Years Comprehensive',
        backupLoadWatts: 1500,

        structureBrand: 'Galvanized HDG High Rise',
        structureWarranty: '10 Years Structural',

        // Commercials
        subtotal: calc.subtotal,
        discount: calc.discount,
        tax: calc.tax,
        total: calc.grandTotal,
        indicativeSubsidy: subsidy.indicativeSubsidy,
        validityDays: 15,

        items: {
          create: calc.items.map(it => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            total: it.total
          }))
        },

        paymentMilestones: [
          { percentage: 20, amount: Math.round(calc.grandTotal * 0.2), description: 'Advance booking' },
          { percentage: 60, amount: Math.round(calc.grandTotal * 0.6), description: 'Material delivery' },
          { percentage: 15, amount: Math.round(calc.grandTotal * 0.15), description: 'Installation completion' },
          { percentage: 5, amount: Math.round(calc.grandTotal * 0.05), description: 'Net metering commissioning' }
        ],

        financingDetails: {
          down_payment: Math.round(calc.grandTotal * 0.2),
          loan_amount: Math.round(calc.grandTotal * 0.8),
          interest_rate: 9.5,
          tenure_years: 5,
          monthly_emi: 4850
        }
      },
      include: { items: true }
    });

    assert.ok(quotation.id, 'Quotation record must be created');
    assert.equal(quotation.systemType, 'Hybrid');
    assert.equal(quotation.batteryBrand, 'Tata Power');
    assert.equal(quotation.consumerNumber, '081293847192');
    assert.equal(quotation.total, calc.grandTotal);
    assert.equal(quotation.indicativeSubsidy, 78000);
    assert.equal(quotation.items.length, 4);

    createdQuotationId = quotation.id;
  });

  await t.test('3. Duplicate Quotation Replicating Specifications Independently', async () => {
    assert.ok(createdQuotationId, 'Created quotation must exist');

    const original = await prisma.quotation.findUnique({
      where: { id: createdQuotationId },
      include: { items: true }
    });

    const cloned = await prisma.quotation.create({
      data: {
        tenantId: original.tenantId,
        customerId: original.customerId,
        leadId: original.leadId,
        qNumber: `${original.qNumber}-COPY`,
        version: 1,
        status: 'DRAFT',
        templateId: original.templateId,
        templateType: original.templateType,
        sectionsConfig: original.sectionsConfig,
        designConfig: original.designConfig,
        systemCapacity: original.systemCapacity,
        inverterCapacity: original.inverterCapacity,
        systemType: original.systemType,
        connectionType: original.connectionType,
        phase: original.phase,
        roofType: original.roofType,
        roofAreaSqFt: original.roofAreaSqFt,
        consumerNumber: original.consumerNumber,
        discom: original.discom,
        billingUnit: original.billingUnit,
        sanctionedLoad: original.sanctionedLoad,
        tariffRate: original.tariffRate,
        monthlyBill: original.monthlyBill,
        monthlyUnits: original.monthlyUnits,
        panelBrand: original.panelBrand,
        panelModel: original.panelModel,
        panelWattage: original.panelWattage,
        panelQuantity: original.panelQuantity,
        panelWarranty: original.panelWarranty,
        inverterBrand: original.inverterBrand,
        inverterModel: original.inverterModel,
        inverterQuantity: original.inverterQuantity,
        inverterWarranty: original.inverterWarranty,
        batteryBrand: original.batteryBrand,
        batteryModel: original.batteryModel,
        batteryCapacity: original.batteryCapacity,
        batteryQuantity: original.batteryQuantity,
        batteryWarranty: original.batteryWarranty,
        backupLoadWatts: original.backupLoadWatts,
        structureBrand: original.structureBrand,
        structureWarranty: original.structureWarranty,
        subtotal: original.subtotal,
        discount: original.discount,
        tax: original.tax,
        total: original.total,
        indicativeSubsidy: original.indicativeSubsidy,
        validityDays: original.validityDays,
        items: {
          create: original.items.map(it => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            total: it.total
          }))
        },
        paymentMilestones: original.paymentMilestones,
        financingDetails: original.financingDetails
      },
      include: { items: true }
    });

    assert.notEqual(cloned.id, original.id, 'Cloned ID must be distinct');
    assert.equal(cloned.status, 'DRAFT', 'Cloned quotation must start in DRAFT status');
    assert.equal(cloned.batteryBrand, 'Tata Power');
    assert.equal(cloned.total, original.total);
    assert.equal(cloned.items.length, 4);

    // Clean up test records
    await prisma.quotationItem.deleteMany({
      where: { quotationId: { in: [original.id, cloned.id] } }
    });
    await prisma.quotation.deleteMany({
      where: { id: { in: [original.id, cloned.id] } }
    });
  });

  t.after(async () => {
    await prisma.$disconnect();
  });
});
