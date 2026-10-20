const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STANDARD_SECTIONS = [
  { id: 'cover', title: 'Cover Page', subtitle: 'Project Presentation & Executive Summary', isEnabled: true, order: 1, isRequired: true },
  { id: 'requirements', title: 'Customer & Site Requirements', subtitle: 'Energy Audit & Baseline Consumption', isEnabled: true, order: 2, isRequired: false },
  { id: 'solution', title: 'Recommended Solar Solution', subtitle: 'System Architecture & Technical Specifications', isEnabled: true, order: 3, isRequired: true },
  { id: 'savings', title: 'Solar Generation & Financial Analysis', subtitle: '25-Year Savings Projection & Payback Period', isEnabled: true, order: 4, isRequired: false },
  { id: 'pricing', title: 'Commercial Quotation & Investment', subtitle: 'Itemized Bill of Quantities & Tax Breakdown', isEnabled: true, order: 5, isRequired: true },
  { id: 'scope', title: 'Scope of Work & Deliverables', subtitle: 'EPC Responsibilities & Exclusions', isEnabled: true, order: 6, isRequired: false },
  { id: 'warranty', title: 'Warranties & Service Commitments', subtitle: 'Tier-1 Equipment & Workmanship Guarantees', isEnabled: true, order: 7, isRequired: true },
  { id: 'terms', title: 'Commercial Terms & Milestones', subtitle: 'Payment Schedule, Validity & Installation Timelines', isEnabled: true, order: 8, isRequired: true },
  { id: 'acceptance', title: 'Acceptance & Work Order', subtitle: 'Sign-off, Digital Acceptance & Authorization', isEnabled: true, order: 9, isRequired: true }
];

const DEFAULT_SCOPE = [
  { item: 'Detailed Technical Site Feasibility & Shadow Analysis Survey', status: 'INCLUDED' },
  { item: 'Supply of Tier-1 Mono PERC / TOPCon Solar PV Modules (ALMM Approved)', status: 'INCLUDED' },
  { item: 'Supply of High-Efficiency Grid-Tied / Hybrid String Inverter with Dual MPPT', status: 'INCLUDED' },
  { item: 'Hot-Dip Galvanized (HDG) / Anodized Aluminum Module Mounting Structure', status: 'INCLUDED' },
  { item: 'UV-Protected 4 sq.mm DC Solar Cables (TUV Certified) with Conduits', status: 'INCLUDED' },
  { item: 'ACDB & DCDB Distribution Boxes with Type-II Surge Protection Devices (SPD)', status: 'INCLUDED' },
  { item: 'Maintenance-Free Dual Chemical Earthing System with Copper-Bonded Electrodes', status: 'INCLUDED' },
  { item: 'Copper Conventional / ESE Lightning Arrester with GI Down Conductor', status: 'INCLUDED' },
  { item: 'Turnkey Mechanical Mounting, Cable Tray Laying & Electrical Termination', status: 'INCLUDED' },
  { item: 'Complete State DISCOM Net Metering Liasoning & Inspection Coordination', status: 'INCLUDED' },
  { item: 'Testing, Pre-Commissioning & Synchronized Grid Handover', status: 'INCLUDED' },
  { item: 'Civil Masonry Structural Alteration or Roof Waterproofing Work', status: 'EXCLUDED' },
  { item: 'Statutory DISCOM Net Meter Testing & Registration Processing Fees (Actuals)', status: 'EXCLUDED' },
  { item: 'Additional AC Cabling Exceeding 25 Meters from Inverter to LT Panel', status: 'CHARGEABLE' }
];

const DEFAULT_TERMS = [
  'Quotation Validity: This commercial proposal is valid for 15 days from the date of issuance.',
  'Net Metering: Net metering feasibility and CEIG approvals are subject to State DISCOM (e.g. MSEDCL) regulations and transformer capacity.',
  'Government Subsidy: Central Financial Assistance (CFA) under PM Surya Ghar Muft Bijli Yojana is an indicative estimate credited directly to consumer bank account via DBT post-commissioning.',
  'Customer Responsibilities: Rooftop clear accessibility, water connection for regular panel cleaning, and grid electricity supply for testing are customer obligations.',
  'Price Escalation: In case of raw material supply disruptions exceeding 30 days beyond proposal validity, revised commodity prices may apply with mutual consent.'
];

const DEFAULT_MILESTONES = [
  { percentage: 20, description: 'Advance booking along with accepted proposal / work order' },
  { percentage: 60, description: 'Upon dispatch & delivery of solar modules, inverter and mounting structure at site' },
  { percentage: 15, description: 'Upon completion of mechanical mounting & electrical wiring installation' },
  { percentage: 5, description: 'Upon DISCOM Net Meter installation, commissioning & handover' }
];

async function seed() {
  console.log('Seeding Products, Templates & Tenant branding...');
  const tenants = await prisma.tenant.findMany();
  if (tenants.length === 0) {
    console.log('No tenants found.');
    return;
  }

  for (const tenant of tenants) {
    console.log(`Processing Tenant: ${tenant.name} (${tenant.id})`);

    // 1. Update Tenant Branding
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        legalName: tenant.legalName || `${tenant.name} Pvt. Ltd.`,
        phone: tenant.phone || '+91 98220 12345',
        email: tenant.email || 'info@wherereadysolar.com',
        address: tenant.address || 'Plot 42, Electronics Zone, MIDC Bhosari',
        city: tenant.city || 'Pune',
        state: tenant.state || 'Maharashtra',
        pincode: tenant.pincode || '411026',
        gstin: tenant.gstin || '27AAECW1234F1Z5',
        pan: tenant.pan || 'AAECW1234F',
        logoUrl: tenant.logoUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=160&auto=format&fit=crop&q=80',
        signatureUrl: tenant.signatureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'
      }
    });

    // 2. Seed Product Catalogue
    const productsToCreate = [
      // Panels
      {
        name: 'Waaree 550Wp Mono PERC Bifacial Solar PV Module (ALMM)',
        category: 'PANEL',
        brand: 'Waaree',
        unit: 'NOS',
        purchaseCost: 8800,
        sellingPrice: 11000,
        taxRate: 12,
        minStock: 20,
        currentStock: 120
      },
      {
        name: 'Adani Solar 545Wp Bifacial Dual-Glass Mono Module (DCR)',
        category: 'PANEL',
        brand: 'Adani Solar',
        unit: 'NOS',
        purchaseCost: 9000,
        sellingPrice: 11200,
        taxRate: 12,
        minStock: 20,
        currentStock: 90
      },
      {
        name: 'Tata Power Solar 540Wp Mono PERC Half-Cut Module',
        category: 'PANEL',
        brand: 'Tata Power Solar',
        unit: 'NOS',
        purchaseCost: 8700,
        sellingPrice: 10900,
        taxRate: 12,
        minStock: 20,
        currentStock: 80
      },
      {
        name: 'Rayzon Solar 550Wp N-Type TOPCon Dual-Glass Bifacial',
        category: 'PANEL',
        brand: 'Rayzon Solar',
        unit: 'NOS',
        purchaseCost: 9200,
        sellingPrice: 11500,
        taxRate: 12,
        minStock: 20,
        currentStock: 60
      },

      // Inverters
      {
        name: 'Growatt 5kW Single Phase Grid-Tied Inverter (MIN 5000TL-X)',
        category: 'INVERTER',
        brand: 'Growatt',
        unit: 'NOS',
        purchaseCost: 32000,
        sellingPrice: 38500,
        taxRate: 12,
        minStock: 5,
        currentStock: 15
      },
      {
        name: 'Sungrow 10kW Three-Phase On-Grid Inverter (SG10RT)',
        category: 'INVERTER',
        brand: 'Sungrow',
        unit: 'NOS',
        purchaseCost: 58000,
        sellingPrice: 69000,
        taxRate: 12,
        minStock: 4,
        currentStock: 10
      },
      {
        name: 'Deye 6kW Hybrid Inverter with Battery Support (SUN-6K-SG04LP1)',
        category: 'INVERTER',
        brand: 'Deye',
        unit: 'NOS',
        purchaseCost: 65000,
        sellingPrice: 78000,
        taxRate: 12,
        minStock: 3,
        currentStock: 8
      },
      {
        name: 'Solis 3.3kW Single Phase Dual MPPT On-Grid Inverter',
        category: 'INVERTER',
        brand: 'Solis',
        unit: 'NOS',
        purchaseCost: 26000,
        sellingPrice: 31000,
        taxRate: 12,
        minStock: 5,
        currentStock: 12
      },

      // Batteries
      {
        name: 'Tata Power 5.12kWh LiFePO4 Wall Mount Battery (100Ah 51.2V)',
        category: 'BATTERY',
        brand: 'Tata Power',
        unit: 'NOS',
        purchaseCost: 95000,
        sellingPrice: 115000,
        taxRate: 18,
        minStock: 2,
        currentStock: 6
      },
      {
        name: 'Luminous 150Ah Solar Tubular C10 Battery (Lead Acid)',
        category: 'BATTERY',
        brand: 'Luminous',
        unit: 'NOS',
        purchaseCost: 12500,
        sellingPrice: 15500,
        taxRate: 18,
        minStock: 10,
        currentStock: 25
      },

      // Structures
      {
        name: 'Galvanized HDG High Rise Rooftop Mounting Structure (1 Lot)',
        category: 'STRUCTURE',
        brand: 'Apex HDG',
        unit: 'LOT',
        purchaseCost: 18000,
        sellingPrice: 24000,
        taxRate: 18,
        minStock: 5,
        currentStock: 20
      },
      {
        name: 'Anodized Aluminum Short-Rail Sheet Roof Structure (1 Lot)',
        category: 'STRUCTURE',
        brand: 'AluSolar',
        unit: 'LOT',
        purchaseCost: 12000,
        sellingPrice: 16500,
        taxRate: 18,
        minStock: 5,
        currentStock: 15
      },

      // Balance of System (BOS)
      {
        name: 'Solar DC & AC Cabling Kit (Polycab 4/6 sq.mm with UV Conduits)',
        category: 'BOS',
        brand: 'Polycab',
        unit: 'SET',
        purchaseCost: 8500,
        sellingPrice: 11500,
        taxRate: 18,
        minStock: 10,
        currentStock: 30
      },
      {
        name: 'ACDB & DCDB Distribution Protection Enclosures with Type-II SPD',
        category: 'BOS',
        brand: 'Schneider / L&T',
        unit: 'SET',
        purchaseCost: 7500,
        sellingPrice: 10500,
        taxRate: 18,
        minStock: 10,
        currentStock: 35
      },
      {
        name: 'Dual Chemical Earthing Kit (Copper Bonded Rods & Compound) + LA',
        category: 'BOS',
        brand: 'SafeGrid',
        unit: 'SET',
        purchaseCost: 9000,
        sellingPrice: 12800,
        taxRate: 18,
        minStock: 10,
        currentStock: 40
      },

      // Services
      {
        name: 'Turnkey Mechanical & Electrical Installation & Commissioning',
        category: 'SERVICES',
        brand: 'WhereReady Engineering',
        unit: 'LOT',
        purchaseCost: 22000,
        sellingPrice: 32000,
        taxRate: 18,
        minStock: 99,
        currentStock: 99
      },
      {
        name: 'State DISCOM Net Metering Liasoning & CEIG Documentation Assistance',
        category: 'SERVICES',
        brand: 'WhereReady Liasoning',
        unit: 'LOT',
        purchaseCost: 5000,
        sellingPrice: 9500,
        taxRate: 18,
        minStock: 99,
        currentStock: 99
      }
    ];

    for (const prod of productsToCreate) {
      const existing = await prisma.product.findFirst({
        where: { tenantId: tenant.id, name: prod.name }
      });
      if (!existing) {
        await prisma.product.create({
          data: {
            tenantId: tenant.id,
            ...prod
          }
        });
      }
    }

    // 3. Seed Proposal Templates
    const templatesToCreate = [
      {
        code: 'quick_quote',
        name: 'Quick Quote (Concise 2-Page)',
        description: 'Compact 2-page quotation designed for fast turnaround, competitive pricing, and immediate client sign-off.',
        projectType: 'RESIDENTIAL',
        isDefault: false,
        primaryColor: '#0284c7',
        accentColor: '#059669',
        fontFamily: 'Inter',
        coverLayout: 'MINIMALIST',
        showFinancialCharts: false,
        showEquipmentImages: true,
        headerText: 'SOLAR EPC COMMERCIAL QUOTATION',
        footerText: 'Confidential • WhereReady Solar OS',
        showPageNumbers: true,
        sections: [
          { id: 'cover', title: 'Executive Summary', isEnabled: true, order: 1, isRequired: true },
          { id: 'solution', title: 'System Specification', isEnabled: true, order: 2, isRequired: true },
          { id: 'pricing', title: 'Commercial Investment', isEnabled: true, order: 3, isRequired: true },
          { id: 'terms', title: 'Terms & Milestones', isEnabled: true, order: 4, isRequired: true },
          { id: 'acceptance', title: 'Client Acceptance', isEnabled: true, order: 5, isRequired: true }
        ],
        defaultScope: DEFAULT_SCOPE,
        defaultTerms: DEFAULT_TERMS,
        defaultMilestones: DEFAULT_MILESTONES,
        signatoryName: 'Authorized Director',
        signatoryTitle: 'EPC Operations Head'
      },
      {
        code: 'residential_proposal',
        name: 'Professional Residential Proposal (5-7 Pages)',
        description: 'Comprehensive presentation for homeowners including solar generation curve, 25-year financial savings, PM Surya Ghar subsidy, and equipment specifications.',
        projectType: 'RESIDENTIAL',
        isDefault: true,
        primaryColor: '#0284c7',
        accentColor: '#059669',
        fontFamily: 'Inter',
        coverLayout: 'MODERN_FULL',
        showFinancialCharts: true,
        showEquipmentImages: true,
        headerText: 'ROOFTOP SOLAR FEASIBILITY & COMMERCIAL PROPOSAL',
        footerText: 'Empowering Clean Energy Independence',
        showPageNumbers: true,
        sections: STANDARD_SECTIONS,
        defaultScope: DEFAULT_SCOPE,
        defaultTerms: DEFAULT_TERMS,
        defaultMilestones: DEFAULT_MILESTONES,
        signatoryName: 'Technical Director',
        signatoryTitle: 'Solar EPC Engineering'
      },
      {
        code: 'commercial_epc',
        name: 'Commercial & Industrial EPC Proposal',
        description: 'Tailored for factories, institutions, and businesses with accelerated depreciation, HT/LT tariff savings, multi-inverter configurations, and detailed commercial terms.',
        projectType: 'COMMERCIAL',
        isDefault: false,
        primaryColor: '#1e3a8a',
        accentColor: '#0d9488',
        fontFamily: 'Inter',
        coverLayout: 'SPLIT_BANNER',
        showFinancialCharts: true,
        showEquipmentImages: true,
        headerText: 'COMMERCIAL SOLAR EPC DETAILED PROJECT REPORT (DPR)',
        footerText: 'Industrial Energy Optimization Solutions',
        showPageNumbers: true,
        sections: STANDARD_SECTIONS,
        defaultScope: DEFAULT_SCOPE,
        defaultTerms: [
          ...DEFAULT_TERMS,
          'Accelerated Depreciation: Section 32 of Income Tax Act permits 40% accelerated depreciation on solar plants for eligible commercial entities.',
          'HT Metering: Dedicated CT/PT metering, CEIG safety approval, and grid synchronization adhere to state electrical inspectorate norms.'
        ],
        defaultMilestones: [
          { percentage: 15, description: 'Advance with signed work order & engineering layout release' },
          { percentage: 55, description: 'Pro-rata upon delivery of modules, structure, and inverters' },
          { percentage: 20, description: 'Upon completion of cabling, earthing & pre-commissioning' },
          { percentage: 10, description: 'Upon CEIG clearance & formal grid synchronization' }
        ],
        signatoryName: 'Vice President - Projects',
        signatoryTitle: 'Commercial EPC Division'
      },
      {
        code: 'hybrid_offgrid',
        name: 'Hybrid & Energy Storage Proposal',
        description: 'Features battery energy storage, day/night backup load analysis, hybrid inverter specs, and power outage mitigation.',
        projectType: 'HYBRID',
        isDefault: false,
        primaryColor: '#0369a1',
        accentColor: '#16a34a',
        fontFamily: 'Inter',
        coverLayout: 'MODERN_FULL',
        showFinancialCharts: true,
        showEquipmentImages: true,
        headerText: 'HYBRID SOLAR + STORAGE SYSTEM PROPOSAL',
        footerText: '24/7 Uninterrupted Green Power',
        showPageNumbers: true,
        sections: STANDARD_SECTIONS,
        defaultScope: [
          ...DEFAULT_SCOPE,
          { item: 'LiFePO4 Lithium Battery Rack & Battery Management System (BMS)', status: 'INCLUDED' },
          { item: 'Critical Load Sub-Panel Wiring for 24/7 Essential Appliances', status: 'INCLUDED' }
        ],
        defaultTerms: DEFAULT_TERMS,
        defaultMilestones: DEFAULT_MILESTONES,
        signatoryName: 'Storage Systems Lead',
        signatoryTitle: 'Hybrid & Microgrid Division'
      },
      {
        code: 'custom_1',
        name: 'Custom Tenant Branded Template',
        description: 'Flexible template allowing complete customization of colors, sections, headings, terms, and signatories.',
        projectType: 'ALL',
        isDefault: false,
        primaryColor: '#0f766e',
        accentColor: '#ca8a04',
        fontFamily: 'Inter',
        coverLayout: 'MODERN_FULL',
        showFinancialCharts: true,
        showEquipmentImages: true,
        headerText: 'SOLAR ENERGY PROPOSAL & QUOTATION',
        footerText: 'Engineered for Performance',
        showPageNumbers: true,
        sections: STANDARD_SECTIONS,
        defaultScope: DEFAULT_SCOPE,
        defaultTerms: DEFAULT_TERMS,
        defaultMilestones: DEFAULT_MILESTONES,
        signatoryName: 'Managing Director',
        signatoryTitle: 'Executive Head'
      }
    ];

    for (const tpl of templatesToCreate) {
      const existing = await prisma.proposalTemplate.findFirst({
        where: { tenantId: tenant.id, code: tpl.code }
      });
      if (!existing) {
        await prisma.proposalTemplate.create({
          data: {
            tenantId: tenant.id,
            ...tpl
          }
        });
      }
    }
  }

  console.log('✅ Seeding completed successfully!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
