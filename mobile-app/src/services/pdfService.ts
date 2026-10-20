import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

export interface QuotationPdfProps {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;

  // Tenant / Company Branding
  companyName: string;
  companyLegalName?: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  companyGstin?: string;
  companyLogoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureUrl?: string;
  companyStampUrl?: string;

  // Customer & Site Details
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  consumerNumber?: string;
  discomName?: string;
  billingUnit?: string;
  sanctionedLoad?: number;
  tariffRate?: number;
  roofAreaSqFt?: number;
  roofType?: string;
  connectionType?: string;
  phase?: string;

  // Template Type
  templateType?: string; // 'quick_quote' | 'residential_proposal' | 'commercial_epc' | 'hybrid_offgrid' | 'custom_tenant'

  // Technical Specs
  systemCapacityKw: number;
  systemType?: string;
  inverterCapacityKw?: number;

  // Equipment
  panelBrand?: string;
  panelModel?: string;
  panelWattage?: number;
  panelQuantity?: number;
  panelWarranty?: string;

  inverterBrand?: string;
  inverterModel?: string;
  inverterWarranty?: string;

  structureType?: string;
  structureBrand?: string;
  structureWarranty?: string;

  // Battery Storage (Hybrid / Off-Grid)
  batteryBrand?: string;
  batteryModel?: string;
  batteryCapacity?: number;
  batteryQuantity?: number;
  batteryWarranty?: string;
  backupLoadWatts?: number;

  // Commercial Pricing & Economics
  grossAmount: number;
  subsidyAmount: number;
  netPayable: number;
  discount?: number;
  subtotal?: number;
  taxAmount?: number;
  amountInWords?: string;
  commercialTaxBenefit?: number;

  // Bill & Savings Analysis
  monthlyGenerationUnits: number;
  annualGenerationUnits: number;
  currentMonthlyBill: number;
  estimatedMonthlyBill: number;
  monthlySavings: number;
  lifetimeSavings: number;
  paybackYears: number;

  co2ReductionKg: number;
  treeEquivalent: number;

  // Dynamic BOQ / Line Items
  pricingItems?: Array<{
    description: string;
    qty?: number | string;
    unit?: string;
    rate?: number;
    unit_price?: number;
    tax_rate?: number;
    gstRate?: number;
    amount?: number;
    total?: number;
  }>;

  // Scope of Supply
  scopeOfSupply?: Array<{ item: string; status: 'INCLUDED' | 'EXCLUDED' | 'CHARGEABLE' } | string>;

  // Milestone Payment Schedule
  paymentTerms?: Array<{ stage?: number; percentage: number; amount: number; description: string }>;

  // Warranties & Terms
  warranties?: {
    modules?: string;
    inverter?: string;
    structure?: string;
    installation?: string;
    other?: string;
  };

  termsAndConditions?: string[];
  exclusions?: string[];

  // Financing (Solar Loan)
  financingDetails?: {
    down_payment?: number;
    loan_amount?: number;
    interest_rate?: number;
    tenure_years?: number;
    monthly_emi?: number;
  };

  bankDetails?: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upiId?: string;
  };
}

export function formatIndianCurrency(n: number): string {
  return Math.round(n || 0).toLocaleString('en-IN');
}

export function generateQuotationHtml(data: QuotationPdfProps): string {
  const formatInr = formatIndianCurrency;
  const isQuickQuote = data.templateType === 'quick_quote';
  const isHybridOrOffgrid =
    data.systemType === 'Hybrid' ||
    data.systemType === 'Off-grid' ||
    data.templateType === 'hybrid_offgrid' ||
    Boolean(data.batteryCapacity && data.batteryCapacity > 0);
  const isCommercial =
    data.connectionType === 'Commercial' ||
    data.connectionType === 'Industrial' ||
    data.templateType === 'commercial_epc';

  const primaryColor = data.primaryColor || '#0284c7';
  const accentColor = data.accentColor || '#059669';

  const cap = data.systemCapacityKw || 3.3;
  const invCap = data.inverterCapacityKw || cap;
  const panelWatt = data.panelWattage || 540;
  const panelQty = data.panelQuantity || Math.ceil((cap * 1000) / panelWatt);
  const monthlyUnits = data.monthlyGenerationUnits || Math.round(cap * 120);
  const annualUnits = data.annualGenerationUnits || Math.round(cap * 1460);
  const tariff = data.tariffRate || (isCommercial ? 10.5 : 8.5);
  const monthlySavings = data.monthlySavings || Math.round(monthlyUnits * tariff);
  const annualSavings = Math.round(annualUnits * tariff);
  const lifetimeSavings = data.lifetimeSavings || Math.round(annualSavings * 25 * 1.3);
  const gross = data.grossAmount || 0;
  const discount = data.discount || 0;
  const subsidy = data.subsidyAmount || 0;
  const net = data.netPayable || Math.max(0, gross - subsidy);
  const subtotal = data.subtotal || Math.round(gross / 1.138);
  const tax = data.taxAmount || Math.round(gross - subtotal);
  const payback = data.paybackYears && !isNaN(data.paybackYears) ? data.paybackYears : 3.5;
  const roofArea = data.roofAreaSqFt || Math.round(cap * 65);
  const currentBill = data.currentMonthlyBill || Math.round(monthlySavings * 1.15);
  const newBill = data.estimatedMonthlyBill || Math.round(Math.max(150, currentBill - monthlySavings));
  const commercialBenefit = data.commercialTaxBenefit || (isCommercial ? Math.round(gross * 0.4 * 0.2517) : 0);

  // EMI: 5-year loan at 9.5% (~₹21 per ₹1,000)
  const monthlyEmi = data.financingDetails?.monthly_emi || Math.round(net * 0.021);

  // Default items if not provided
  const rawPricing = data.pricingItems && data.pricingItems.length > 0
    ? data.pricingItems
    : [
        {
          description: `${cap} kWp Solar PV Power Plant Equipment (Tier-1 Modules, Inverter, Structure, Cables)`,
          qty: 1,
          unit: 'LOT',
          rate: Math.round(subtotal * 0.78),
          tax_rate: 12,
          amount: Math.round(subtotal * 0.78),
        },
        {
          description: 'Turnkey Mechanical & Electrical Installation, Testing & Statutory Liaisoning Services',
          qty: 1,
          unit: 'LOT',
          rate: subtotal - Math.round(subtotal * 0.78),
          tax_rate: 18,
          amount: subtotal - Math.round(subtotal * 0.78),
        },
      ];

  // Default Scope of Supply
  const rawScope = data.scopeOfSupply && data.scopeOfSupply.length > 0
    ? data.scopeOfSupply
    : [
        { item: 'Detailed Technical Site Feasibility & Shadow Analysis Survey', status: 'INCLUDED' },
        { item: `Supply of ${cap} kWp Tier-1 Solar PV Modules (${data.panelBrand || 'Waaree / Adani'})`, status: 'INCLUDED' },
        { item: `Supply of ${invCap} kW High-Efficiency Inverter (${data.inverterBrand || 'Growatt / Solis'})`, status: 'INCLUDED' },
        { item: 'Hot-Dip Galvanized (HDG) / Aluminum Module Mounting Structure', status: 'INCLUDED' },
        { item: 'UV-Protected 4 sq.mm DC Solar Cables & Heavy Duty Conduits', status: 'INCLUDED' },
        { item: 'ACDB & DCDB Distribution Boxes with Type-II Surge Protection Devices', status: 'INCLUDED' },
        { item: 'Maintenance-Free Dual Chemical Earthing Kit & Lightning Arrestor', status: 'INCLUDED' },
        { item: 'Turnkey Mechanical & Electrical Installation & Inverter Termination', status: 'INCLUDED' },
        { item: 'State DISCOM Net-Metering Liasoning & Commissioning Coordination', status: 'INCLUDED' },
        { item: 'Civil Masonry Structural Alteration or Roof Waterproofing', status: 'EXCLUDED' },
        { item: 'Statutory DISCOM Net Meter Testing & Registration Deposit Fees (Actuals)', status: 'EXCLUDED' },
        { item: 'Additional AC Cabling Exceeding 25 Meters from Inverter to LT Panel', status: 'CHARGEABLE' },
      ];

  // Default Payment Milestones
  const rawMilestones = data.paymentTerms && data.paymentTerms.length > 0
    ? data.paymentTerms
    : [
        { stage: 1, percentage: 20, amount: Math.round(gross * 0.2), description: 'Token Advance upon proposal sign-off & portal booking' },
        { stage: 2, percentage: 60, amount: Math.round(gross * 0.6), description: 'Upon delivery of panels, inverter & structure to site' },
        { stage: 3, percentage: 15, amount: Math.round(gross * 0.15), description: 'Upon mechanical mounting & electrical installation completion' },
        { stage: 4, percentage: 5, amount: Math.round(gross * 0.05), description: 'Upon DISCOM Net Metering inspection & grid synchronization' },
      ];

  // Warranties
  const modWarranty = data.warranties?.modules || data.panelWarranty || '25 Years OEM Performance Guarantee';
  const invWarranty = data.warranties?.inverter || data.inverterWarranty || '10 Years Standard Replacement Warranty';
  const strWarranty = data.warranties?.structure || data.structureWarranty || '10 Years Structural Integrity (150 km/h)';
  const insWarranty = data.warranties?.installation || '5 Years Workmanship & Work Integrity Guarantee';

  // Total pages count
  const totalPages = isQuickQuote ? 3 : 8;
  let pageCounter = 0;

  const renderPageHeader = (title: string, sectionNum: string) => `
    <div class="page-header">
      <div class="header-left">
        ${data.companyLogoUrl ? `<img src="${data.companyLogoUrl}" class="header-logo" alt="${data.companyName}" />` : `
        <div class="header-icon-box">☀️</div>`}
        <div>
          <div class="header-comp-name">${data.companyName}</div>
          <div class="header-comp-contact">${data.companyEmail} • 📞 ${data.companyPhone}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="header-section-title"><span class="section-tag">[${sectionNum}]</span> ${title}</div>
        <div class="header-quote-meta">Ref: <strong>${data.quotationNumber}</strong> • Date: ${data.quotationDate}</div>
      </div>
    </div>
  `;

  const renderPageFooter = () => {
    pageCounter++;
    return `
      <div class="page-footer">
        <div>
          <strong>${data.companyLegalName || data.companyName}</strong>
          ${data.companyGstin ? ` • GSTIN: ${data.companyGstin}` : ''}
        </div>
        <div class="footer-page-num">
          Quotation #${data.quotationNumber} • Page ${pageCounter} of ${totalPages}
        </div>
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Solar Proposal - ${data.customerName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 9pt;
      line-height: 1.4;
    }
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      padding: 12mm 14mm;
      margin: 0 auto;
      page-break-after: always;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      background: #ffffff;
    }
    .a4-page:last-child {
      page-break-after: avoid;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1.5px solid #e2e8f0;
      margin-bottom: 14px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-logo {
      height: 32px;
      object-fit: contain;
    }
    .header-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .header-comp-name {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .header-comp-contact {
      font-size: 7.5pt;
      color: #64748b;
    }
    .header-right {
      text-align: right;
    }
    .header-section-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-tag {
      color: ${primaryColor};
      font-family: monospace;
    }
    .header-quote-meta {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 2px;
    }
    .page-footer {
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #94a3b8;
      margin-top: auto;
    }
    .footer-page-num {
      font-family: monospace;
      font-weight: 600;
      color: #64748b;
    }
    .section-title {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin: 0 0 2px 0;
    }
    .section-subtitle {
      font-size: 8pt;
      color: #64748b;
      margin: 0 0 12px 0;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 14px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #ffffff;
    }
    .card-kpi {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
    }
    .kpi-title {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 7pt;
      color: #64748b;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 8pt;
    }
    th {
      background: #f8fafc;
      color: #334155;
      font-weight: 800;
      text-align: left;
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      text-transform: uppercase;
      font-size: 7pt;
      letter-spacing: 0.4px;
    }
    td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-included { background: #dcfce7; color: #15803d; }
    .badge-excluded { background: #ffe4e6; color: #be123c; }
    .badge-chargeable { background: #fef3c7; color: #b45309; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-blue { background: #eff6ff; color: #1d4ed8; }
    .badge-amber { background: #fffbeb; color: #b45309; }
    .subsidy-callout {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }
    .commercial-tax-callout {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }
    .loan-callout-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }

    /* COVER PAGE STYLING */
    .cover-page {
      background: linear-gradient(145deg, #090d16 0%, #0f172a 45%, #1e293b 100%);
      color: #ffffff;
      padding: 20mm 18mm;
    }
    .cover-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.15);
      padding-bottom: 14px;
    }
    .cover-hero-tag {
      font-size: 8pt;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .cover-main-title {
      font-size: 26pt;
      font-weight: 900;
      line-height: 1.15;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin: 0 0 20px 0;
    }
    .cover-capacity-badge {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 10px 16px;
      margin-bottom: 30px;
    }
    .cover-kw-num {
      font-size: 24pt;
      font-weight: 900;
      color: #38bdf8;
    }
    .cover-client-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      padding: 16px 20px;
      max-width: 140mm;
      margin-bottom: 30px;
    }
    .cover-footer {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 14px;
      font-size: 8pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- PAGE 1: EXECUTIVE COVER PAGE                                              -->
  <!-- ========================================================================= -->
  <div class="a4-page cover-page">
    <div class="cover-top-bar">
      <div style="display: flex; align-items: center; gap: 10px;">
        ${data.companyLogoUrl ? `<img src="${data.companyLogoUrl}" style="height: 38px; object-fit: contain;" alt="${data.companyName}" />` : `
        <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: center; font-size: 20px;">☀️</div>`}
        <div>
          <div style="font-size: 11pt; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">${data.companyName}</div>
          <div style="font-size: 7.5pt; color: #94a3b8;">${data.companyAddress}</div>
        </div>
      </div>
      <div>
        <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 7.5pt; font-weight: 800; background: rgba(52, 211, 153, 0.2); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
          EPC Engineering Proposal
        </span>
      </div>
    </div>

    <div style="padding: 25mm 0 10mm 0;">
      <div class="cover-hero-tag">Your Journey to Smarter, Cleaner Energy</div>
      <h1 class="cover-main-title">
        ROOFTOP SOLAR PV<br>
        <span style="color: #38bdf8;">TURNKEY ENGINEERING PROPOSAL</span>
      </h1>

      <div class="cover-capacity-badge">
        <div style="width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #0284c7 0%, #059669 100%); display: flex; align-items: center; justify-content: center; font-size: 22px;">⚡</div>
        <div>
          <div class="cover-kw-num">${cap} <span style="font-size: 12pt; color: #cbd5e1; font-weight: 600;">kWp</span></div>
          <div style="font-size: 8pt; color: #cbd5e1;">${data.systemType || 'On-Grid'} Solar System • ${data.connectionType || 'Residential'} Profile</div>
        </div>
      </div>

      <div class="cover-client-card">
        <div style="font-size: 7pt; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Prepared Exclusively For</div>
        <div style="font-size: 14pt; font-weight: 800; color: #ffffff; margin-bottom: 4px;">${data.customerName}</div>
        <div style="font-size: 8pt; color: #cbd5e1; line-height: 1.4;">
          📍 ${data.customerAddress}<br>
          📞 Phone: ${data.customerPhone} ${data.customerEmail ? `| ✉️ ${data.customerEmail}` : ''}
          ${data.consumerNumber ? `<br><strong style="color: #4ade80;">DISCOM Account No:</strong> ${data.consumerNumber} (${data.discomName || 'DISCOM'})` : ''}
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <span style="font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Proposal Number</span>
        <strong style="color: #ffffff; font-family: monospace; font-size: 9.5pt;">${data.quotationNumber}</strong>
      </div>
      <div>
        <span style="font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Issuance Date</span>
        <strong style="color: #ffffff;">${data.quotationDate}</strong>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Quotation Validity</span>
        <strong style="color: #34d399;">${data.validUntil}</strong>
      </div>
    </div>
  </div>

  ${!isQuickQuote ? `
  <!-- ========================================================================= -->
  <!-- PAGE 2: CUSTOMER REQUIREMENTS & AUDIT                                     -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Customer Requirements & Energy Audit', '02')}

      <div class="section-title">Site Baseline & Energy Consumption Audit</div>
      <div class="section-subtitle">Detailed site audit based on consumer utility records and existing electricity bill analysis.</div>

      <div class="grid-4">
        <div class="card-kpi">
          <div class="kpi-title">Current Bill</div>
          <div class="kpi-val">₹${formatInr(currentBill)}<span style="font-size: 8pt; color: #64748b;">/mo</span></div>
          <div class="kpi-sub">₹${formatInr(currentBill * 12)} / year</div>
        </div>
        <div class="card-kpi">
          <div class="kpi-title">Monthly Units</div>
          <div class="kpi-val">${monthlyUnits} <span style="font-size: 8pt; color: #64748b;">kWh</span></div>
          <div class="kpi-sub">~${annualUnits} kWh / year</div>
        </div>
        <div class="card-kpi">
          <div class="kpi-title">Utility Tariff</div>
          <div class="kpi-val">₹${tariff}<span style="font-size: 8pt; color: #64748b;">/u</span></div>
          <div class="kpi-sub">${data.connectionType || 'LT-I'} Slab</div>
        </div>
        <div class="card-kpi">
          <div class="kpi-title">Est. Roof Area</div>
          <div class="kpi-val" style="color: ${primaryColor};">${roofArea} <span style="font-size: 8pt; color: #64748b;">sq.ft</span></div>
          <div class="kpi-sub">Shadow-Free Surface</div>
        </div>
      </div>

      <div style="font-weight: 800; font-size: 8.5pt; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
        Site & Utility Parameters Assessment
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 32%;">Parameter</th>
            <th style="width: 38%;">Consumer / Site Record</th>
            <th style="width: 30%;">EPC Verification Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Client / Consumer Name</strong></td>
            <td>${data.customerName}</td>
            <td style="color: #15803d; font-weight: 700;">Verified against Utility Record</td>
          </tr>
          <tr>
            <td><strong>DISCOM & Billing Unit</strong></td>
            <td>${data.discomName || 'MSEDCL (Mahavitaran)'} • BU: ${data.billingUnit || '4100'}</td>
            <td style="color: #15803d; font-weight: 700;">Eligible for Net-Metering</td>
          </tr>
          <tr>
            <td><strong>Consumer Account No.</strong></td>
            <td><strong style="font-family: monospace; color: ${primaryColor};">${data.consumerNumber || 'To be updated'}</strong></td>
            <td>PM Surya Ghar Portal Mapped</td>
          </tr>
          <tr>
            <td><strong>Sanctioned Load & Phase</strong></td>
            <td>${data.sanctionedLoad || cap} kW (${data.phase || 'Single Phase'})</td>
            <td>${cap <= (data.sanctionedLoad || 5) ? 'Within sanctioned load' : 'Load enhancement recommended'}</td>
          </tr>
          <tr>
            <td><strong>Roof Type & Orientation</strong></td>
            <td>${data.roofType || 'Flat RCC Roof'}</td>
            <td>South facing, 12°–15° optimal pitch</td>
          </tr>
        </tbody>
      </table>

      <div class="card" style="background: #f8fafc; margin-top: 10px;">
        <div style="font-weight: 800; font-size: 8pt; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          Key Project Objectives & Benefits
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 8pt; color: #334155;">
          <div>✅ <strong>Reduce Bill by 85–90%</strong><br><span style="color: #64748b;">Hedge against recurring annual utility tariff hikes.</span></div>
          <div>✅ <strong>Direct Bank Subsidy</strong><br><span style="color: #64748b;">Avail PM Surya Ghar direct cash benefit credit.</span></div>
          <div>✅ <strong>Clean Capital Asset</strong><br><span style="color: #64748b;">Generate inflation-proof electricity for 25+ years.</span></div>
        </div>
      </div>
    </div>
    ${renderPageFooter()}
  </div>
  ` : ''}

  <!-- ========================================================================= -->
  <!-- PAGE 3: RECOMMENDED SOLAR SOLUTION ARCHITECTURE                           -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Recommended Solar Solution Architecture', '03')}

      <div class="section-title">${cap} kWp ${data.systemType || 'On-Grid'} Solar Power Plant</div>
      <div class="section-subtitle">Tier-1 ALMM-listed solar PV modules, high-efficiency MPPT inverter, and rugged galvanized structure.</div>

      <div class="grid-4">
        <div class="card-kpi" style="border-color: #bfdbfe; background: #eff6ff;">
          <div class="kpi-title" style="color: #1d4ed8;">DC Plant Capacity</div>
          <div class="kpi-val" style="color: #1e3a8a;">${cap} <span style="font-size: 8pt; font-weight: 600;">kWp</span></div>
          <div class="kpi-sub" style="color: #2563eb;">${panelQty} × ${panelWatt}Wp Panels</div>
        </div>
        <div class="card-kpi">
          <div class="kpi-title">AC Inverter Rating</div>
          <div class="kpi-val">${invCap} <span style="font-size: 8pt; font-weight: 600;">kW</span></div>
          <div class="kpi-sub">${data.phase || 'Single Phase'} Grid-Tied</div>
        </div>
        <div class="card-kpi" style="border-color: #bbf7d0; background: #f0fdf4;">
          <div class="kpi-title" style="color: #15803d;">Est. Annual Yield</div>
          <div class="kpi-val" style="color: #14532d;">~${formatInr(annualUnits)} <span style="font-size: 8pt; font-weight: 600;">kWh</span></div>
          <div class="kpi-sub" style="color: #16a34a;">~${formatInr(monthlyUnits)} kWh / month</div>
        </div>
        <div class="card-kpi">
          <div class="kpi-title">Warranty Shield</div>
          <div class="kpi-val">25 Years</div>
          <div class="kpi-sub">Linear Performance</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- MODULE SPEC CARD -->
        <div class="card">
          <div style="font-size: 7.5pt; font-weight: 800; color: ${primaryColor}; text-transform: uppercase;">Solar PV Modules</div>
          <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin: 2px 0 6px 0;">
            ${data.panelBrand || 'Waaree 540Wp Mono PERC Bifacial'}
          </div>
          <table style="margin: 0; font-size: 7.5pt;">
            <tr><td style="color: #64748b; width: 40%;">Technology</td><td><strong>${data.panelModel || 'Mono Half-Cut Bifacial ALMM DCR'}</strong></td></tr>
            <tr><td style="color: #64748b;">Quantity & Rating</td><td>${panelQty} Modules (${panelWatt}Wp each)</td></tr>
            <tr><td style="color: #64748b;">Performance Warranty</td><td><strong style="color: #15803d;">${modWarranty}</strong></td></tr>
          </table>
        </div>

        <!-- INVERTER SPEC CARD -->
        <div class="card">
          <div style="font-size: 7.5pt; font-weight: 800; color: ${accentColor}; text-transform: uppercase;">Grid-Tied Solar Inverter</div>
          <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin: 2px 0 6px 0;">
            ${data.inverterBrand || 'Growatt / Solis'} ${invCap}kW
          </div>
          <table style="margin: 0; font-size: 7.5pt;">
            <tr><td style="color: #64748b; width: 40%;">Efficiency & MPPT</td><td>Dual MPPT, &gt;98.4% Peak Efficiency</td></tr>
            <tr><td style="color: #64748b;">Enclosure Rating</td><td>IP65 Outdoor Weatherproof & Wi-Fi</td></tr>
            <tr><td style="color: #64748b;">Warranty Duration</td><td><strong style="color: #15803d;">${invWarranty}</strong></td></tr>
          </table>
        </div>

        ${isHybridOrOffgrid ? `
        <!-- BATTERY CARD FOR HYBRID -->
        <div class="card" style="grid-column: span 2; background: #fffbeb; border-color: #fde68a;">
          <div style="font-size: 7.5pt; font-weight: 800; color: #b45309; text-transform: uppercase;">Energy Storage System (Battery Backup)</div>
          <div style="font-size: 11pt; font-weight: 800; color: #78350f; margin: 2px 0 6px 0;">
            ${data.batteryBrand || 'Tata Power / Growatt'} ${data.batteryCapacity || 5} kWh LiFePO4
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 8pt; color: #78350f;">
            <div>Capacity: <strong>${data.batteryCapacity || 5} kWh (${data.batteryQuantity || 1} Unit)</strong></div>
            <div>Backup Load: <strong>${data.backupLoadWatts || 3000} Watts (Lights, Fans, Refrigerator)</strong></div>
            <div>Warranty: <strong>${data.batteryWarranty || '10 Years / 6,000 Cycles'}</strong></div>
          </div>
        </div>
        ` : ''}

        <!-- STRUCTURE & BOS CARD -->
        <div class="card" style="grid-column: span ${isHybridOrOffgrid ? 2 : 2};">
          <div style="font-size: 7.5pt; font-weight: 800; color: #64748b; text-transform: uppercase;">Mounting Structure & Balance of System (BOS)</div>
          <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin: 2px 0 6px 0;">
            ${data.structureBrand || data.structureType || 'Hot-Dip Galvanized (HDG) / Aluminum High Rise Structure'}
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 7.5pt; color: #334155;">
            <div><strong>Structure:</strong> Hot-Dip Galvanized 80µm, wind rated up to 150 km/h. Warranty: ${strWarranty}.</div>
            <div><strong>DC / AC Cables:</strong> Polycab / Havells 4 sq.mm TUV certified UV XLPE cables with conduits.</div>
            <div><strong>Safety:</strong> ACDB & DCDB with Type-II SPDs and Dual Chemical Earthing pits.</div>
          </div>
        </div>
      </div>

      <div class="card" style="background: #f8fafc;">
        <div style="display: flex; justify-content: space-between; font-size: 7.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
          <span>Monthly Solar Generation Profile (Western / Central India Irradiance)</span>
          <span style="color: ${primaryColor};">Peak: May (~10.8%)</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; text-align: center; font-size: 7.5pt;">
          <div class="card" style="padding: 4px;"><strong>Jan:</strong> ${Math.round(annualUnits * 0.082)} kWh</div>
          <div class="card" style="padding: 4px;"><strong>Mar:</strong> ${Math.round(annualUnits * 0.098)} kWh</div>
          <div class="card" style="padding: 4px; border-color: ${primaryColor};"><strong>May:</strong> ${Math.round(annualUnits * 0.108)} kWh</div>
          <div class="card" style="padding: 4px;"><strong>Jul:</strong> ${Math.round(annualUnits * 0.062)} kWh</div>
          <div class="card" style="padding: 4px;"><strong>Sep:</strong> ${Math.round(annualUnits * 0.076)} kWh</div>
          <div class="card" style="padding: 4px;"><strong>Nov:</strong> ${Math.round(annualUnits * 0.084)} kWh</div>
        </div>
      </div>
    </div>
    ${renderPageFooter()}
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 4: SAVINGS ANALYSIS & FINANCIAL ROI                                  -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Solar Generation & Financial Economics', '04')}

      <div class="section-title">Financial Analysis & Projected Savings</div>
      <div class="section-subtitle">Detailed return on investment, payback period, and 25-year cumulative savings projections.</div>

      <div class="grid-3">
        <div class="card-kpi" style="border-color: #bbf7d0; background: #f0fdf4; text-align: center;">
          <div class="kpi-title" style="color: #15803d;">Year 1 Net Savings</div>
          <div class="kpi-val" style="color: #14532d; font-size: 15pt;">₹${formatInr(annualSavings)}</div>
          <div class="kpi-sub" style="color: #16a34a;">₹${formatInr(monthlySavings)} / month</div>
        </div>
        <div class="card-kpi" style="border-color: #bfdbfe; background: #eff6ff; text-align: center;">
          <div class="kpi-title" style="color: #1d4ed8;">Estimated Payback</div>
          <div class="kpi-val" style="color: #1e3a8a; font-size: 15pt;">${payback} Years</div>
          <div class="kpi-sub" style="color: #2563eb;">Break-even on net investment</div>
        </div>
        <div class="card-kpi" style="text-align: center;">
          <div class="kpi-title">25-Yr Cumulative Savings</div>
          <div class="kpi-val" style="font-size: 15pt;">₹${formatInr(lifetimeSavings)}</div>
          <div class="kpi-sub">Compounding @ 3% tariff hike</div>
        </div>
      </div>

      <div style="font-weight: 800; font-size: 8.5pt; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
        25-Year Milestone Financial Cash Flow Projections
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Milestone Year</th>
            <th style="width: 20%;">Annual Gen. (kWh)</th>
            <th style="width: 20%;">Grid Tariff (₹/u)</th>
            <th style="width: 20%;">Annual Savings (₹)</th>
            <th style="width: 20%; text-align: right;">Cumulative Net Return (₹)</th>
          </tr>
        </thead>
        <tbody style="font-family: monospace;">
          <tr>
            <td style="font-family: inherit;"><strong>Year 1</strong></td>
            <td>${formatInr(annualUnits)} kWh</td>
            <td>₹${tariff.toFixed(1)}</td>
            <td style="color: #15803d; font-weight: 700;">₹${formatInr(annualSavings)}</td>
            <td style="text-align: right; font-weight: 800;">₹${formatInr(annualSavings)}</td>
          </tr>
          <tr>
            <td style="font-family: inherit;"><strong>Year 3</strong></td>
            <td>${formatInr(annualUnits * 0.98)} kWh</td>
            <td>₹${(tariff * 1.06).toFixed(2)}</td>
            <td style="color: #15803d; font-weight: 700;">₹${formatInr(annualSavings * 1.04)}</td>
            <td style="text-align: right; font-weight: 800;">₹${formatInr(annualSavings * 3.08)}</td>
          </tr>
          <tr style="background: #f0fdf4;">
            <td style="font-family: inherit; color: #15803d;"><strong>Year 5 (Payback)</strong></td>
            <td>${formatInr(annualUnits * 0.96)} kWh</td>
            <td>₹${(tariff * 1.12).toFixed(2)}</td>
            <td style="color: #15803d; font-weight: 700;">₹${formatInr(annualSavings * 1.08)}</td>
            <td style="text-align: right; font-weight: 900; color: #15803d;">₹${formatInr(annualSavings * 5.3)}</td>
          </tr>
          <tr>
            <td style="font-family: inherit;"><strong>Year 10</strong></td>
            <td>${formatInr(annualUnits * 0.93)} kWh</td>
            <td>₹${(tariff * 1.30).toFixed(2)}</td>
            <td style="color: #15803d; font-weight: 700;">₹${formatInr(annualSavings * 1.21)}</td>
            <td style="text-align: right; font-weight: 800;">₹${formatInr(annualSavings * 11.5)}</td>
          </tr>
          <tr>
            <td style="font-family: inherit;"><strong>Year 15</strong></td>
            <td>${formatInr(annualUnits * 0.90)} kWh</td>
            <td>₹${(tariff * 1.51).toFixed(2)}</td>
            <td style="color: #15803d; font-weight: 700;">₹${formatInr(annualSavings * 1.36)}</td>
            <td style="text-align: right; font-weight: 800;">₹${formatInr(annualSavings * 18.2)}</td>
          </tr>
          <tr style="background: #eff6ff;">
            <td style="font-family: inherit; color: #1e3a8a;"><strong>Year 25 (Life End)</strong></td>
            <td>${formatInr(annualUnits * 0.84)} kWh</td>
            <td>₹${(tariff * 2.03).toFixed(2)}</td>
            <td style="color: #15803d; font-weight: 700;">₹${formatInr(annualSavings * 1.71)}</td>
            <td style="text-align: right; font-weight: 900; color: #1e3a8a;">₹${formatInr(lifetimeSavings)}</td>
          </tr>
        </tbody>
      </table>

      ${subsidy > 0 && !isCommercial ? `
      <div class="subsidy-callout">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <div style="font-weight: 800; font-size: 8.5pt; color: #14532d;">
            🏛️ PM Surya Ghar Muft Bijli Yojana — Indicative Central Subsidy
          </div>
          <div style="font-size: 11pt; font-weight: 900; color: #15803d; font-family: monospace;">₹${formatInr(subsidy)}</div>
        </div>
        <div style="font-size: 7.5pt; color: #166534; line-height: 1.35;">
          Direct Benefit Transfer (DBT): Central subsidy is credited directly by MNRE/DISCOM into the consumer's bank account following physical installation inspection and net-meter synchronization.
        </div>
      </div>
      ` : isCommercial ? `
      <div class="commercial-tax-callout">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <div style="font-weight: 800; font-size: 8.5pt; color: #1e3a8a;">
            🏢 Section 32 Accelerated Depreciation Tax Benefit
          </div>
          <div style="font-size: 11pt; font-weight: 900; color: #1d4ed8; font-family: monospace;">₹${formatInr(commercialBenefit)} Tax Write-off</div>
        </div>
        <div style="font-size: 7.5pt; color: #1e40af; line-height: 1.35;">
          Commercial & Industrial entities in India can claim 40% accelerated depreciation on solar rooftop capital investments under Income Tax Act Section 32, boosting business cash flows from Year 1.
        </div>
      </div>
      ` : ''}

      <div class="loan-callout-box">
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 8pt; color: #0f172a; margin-bottom: 4px;">
          <span>💳 5-Year Solar Loan Option: Positive Cash Flow from Month 1</span>
          <span style="color: ${primaryColor};">@ 9.5% p.a. • 60 Months Tenure</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 7.5pt; color: #475569;">
          <div>Monthly Solar Savings: <strong style="color: #15803d;">₹${formatInr(monthlySavings)} / mo</strong></div>
          <div>Estimated Monthly EMI: <strong style="color: #0f172a;">₹${formatInr(monthlyEmi)} / mo</strong></div>
          <div>Net In-Hand Gain: <strong style="color: #1d4ed8;">+₹${formatInr(Math.max(0, monthlySavings - monthlyEmi))} / mo</strong></div>
        </div>
      </div>
    </div>
    ${renderPageFooter()}
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 5: ITEMIZED COMMERCIAL QUOTATION & BOQ                               -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Commercial Quotation & Bill of Quantities', '05')}

      <div class="section-title">Itemized Commercial Quotation</div>
      <div class="section-subtitle">Transparent itemized bill of quantities with tax rates, statutory GST breakdown, and payment totals.</div>

      <table>
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 47%;">Product / Service Description</th>
            <th style="width: 8%; text-align: center;">Qty</th>
            <th style="width: 8%; text-align: center;">Unit</th>
            <th style="width: 14%; text-align: right;">Rate (₹)</th>
            <th style="width: 8%; text-align: center;">GST</th>
            <th style="width: 15%; text-align: right;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${rawPricing.map((item, idx) => `
            <tr>
              <td style="text-align: center; color: #94a3b8; font-family: monospace;">${idx + 1}</td>
              <td><strong>${item.description}</strong></td>
              <td style="text-align: center; font-family: monospace;">${item.qty || 1}</td>
              <td style="text-align: center; color: #64748b;">${item.unit || 'LOT'}</td>
              <td style="text-align: right; font-family: monospace;">₹${formatInr(item.rate || item.unit_price || item.amount || 0)}</td>
              <td style="text-align: center; color: #64748b;">${item.tax_rate || item.gstRate || 12}%</td>
              <td style="text-align: right; font-weight: 700; font-family: monospace;">₹${formatInr(item.amount || item.total || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="grid-2" style="margin-bottom: 12px;">
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; background: #f8fafc;">
          <div>
            <div style="font-size: 7.5pt; font-weight: 800; color: #64748b; text-transform: uppercase;">Amount Payable in Words</div>
            <div style="font-size: 9pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-top: 4px; line-height: 1.4;">
              ${data.amountInWords || numberToWordsINR(gross)}
            </div>
          </div>
          <div style="font-size: 7pt; color: #64748b; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            Statutory Note: Turnkey price includes all applicable GST. Central PM Surya Ghar direct cash subsidy is credited via DBT into the customer's account post-commissioning.
          </div>
        </div>

        <div class="card" style="background: #f8fafc;">
          <table style="margin: 0; font-size: 8pt; border: none;">
            <tr style="background: transparent;"><td style="border: none; color: #64748b;">Taxable Subtotal (Pre-Tax):</td><td style="border: none; text-align: right; font-family: monospace;">₹${formatInr(subtotal)}</td></tr>
            ${discount > 0 ? `
            <tr style="background: transparent;"><td style="border: none; color: #d97706;">Commercial Discount:</td><td style="border: none; text-align: right; font-family: monospace; color: #d97706;">-₹${formatInr(discount)}</td></tr>` : ''}
            <tr style="background: transparent;"><td style="border: none; color: #64748b;">GST (CGST + SGST Solar Composite):</td><td style="border: none; text-align: right; font-family: monospace;">₹${formatInr(tax)}</td></tr>
            <tr style="background: transparent; border-top: 1.5px solid #cbd5e1;"><td style="border: none; font-weight: 800; font-size: 9.5pt;">Final Project Total:</td><td style="border: none; text-align: right; font-weight: 900; font-size: 11pt; color: ${primaryColor}; font-family: monospace;">₹${formatInr(gross)}</td></tr>
            ${subsidy > 0 ? `
            <tr style="background: transparent;"><td style="border: none; color: #15803d; font-weight: 700;">Less: Central Subsidy (PM Surya Ghar DBT):</td><td style="border: none; text-align: right; font-weight: 800; color: #15803d; font-family: monospace;">-₹${formatInr(subsidy)}</td></tr>
            <tr style="background: transparent; border-top: 1px solid #bbf7d0;"><td style="border: none; font-weight: 800; font-size: 9pt; color: #14532d;">Estimated Net Outflow:</td><td style="border: none; text-align: right; font-weight: 900; font-size: 11pt; color: #15803d; font-family: monospace;">₹${formatInr(net)}</td></tr>` : ''}
          </table>
        </div>
      </div>

      <div style="font-weight: 800; font-size: 8.5pt; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px;">
        Milestone Payment Schedule (100% Milestone Linked)
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 10%; text-align: center;">Stage</th>
            <th style="width: 50%;">Milestone Description & Trigger</th>
            <th style="width: 15%; text-align: center;">% Share</th>
            <th style="width: 25%; text-align: right;">Amount (All GST Included)</th>
          </tr>
        </thead>
        <tbody>
          ${rawMilestones.map((ms, idx) => `
            <tr>
              <td style="text-align: center; font-weight: 800; color: ${primaryColor};">${idx + 1}</td>
              <td>${ms.description}</td>
              <td style="text-align: center; font-weight: 700;"><span class="badge badge-blue">${ms.percentage}%</span></td>
              <td style="text-align: right; font-weight: 800; font-family: monospace;">₹${formatInr(ms.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ${renderPageFooter()}
  </div>

  ${!isQuickQuote ? `
  <!-- ========================================================================= -->
  <!-- PAGE 6: SCOPE OF WORK & EPC DELIVERABLES                                  -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Scope of Work & EPC Deliverables', '06')}

      <div class="section-title">Turnkey Scope of Work & Boundaries</div>
      <div class="section-subtitle">Clear allocation of EPC deliverables, statutory agency coordination, and customer site obligations.</div>

      <table>
        <thead>
          <tr>
            <th style="width: 6%; text-align: center;">#</th>
            <th style="width: 76%;">Scope Item / EPC Engineering Activity</th>
            <th style="width: 18%; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rawScope.map((sc: any, idx: number) => {
            const itemText = typeof sc === 'string' ? sc : sc.item;
            const itemStatus = typeof sc === 'string' ? 'INCLUDED' : (sc.status || 'INCLUDED');
            const badgeClass = itemStatus === 'INCLUDED' ? 'badge-included' : itemStatus === 'EXCLUDED' ? 'badge-excluded' : 'badge-chargeable';
            return `
              <tr>
                <td style="text-align: center; color: #94a3b8; font-family: monospace;">${idx + 1}</td>
                <td>${itemText}</td>
                <td style="text-align: center;"><span class="badge ${badgeClass}">${itemStatus}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="card" style="background: #f8fafc; margin-top: 10px;">
        <div style="font-weight: 800; font-size: 8pt; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          Customer Site Obligations & Prerequisites
        </div>
        <ul style="margin: 0; padding-left: 18px; font-size: 7.5pt; color: #475569; line-height: 1.5;">
          <li>Provide unhindered, safe rooftop access for EPC engineers, installation technicians, and equipment delivery.</li>
          <li>Ensure dedicated water supply line at rooftop with sufficient pressure for regular module cleaning.</li>
          <li>Provide single or three-phase electrical power supply at site during installation and testing.</li>
          <li>Cooperate with statutory DISCOM meter testing and verification officers during physical site inspection.</li>
        </ul>
      </div>
    </div>
    ${renderPageFooter()}
  </div>
  ` : ''}

  <!-- ========================================================================= -->
  <!-- PAGE 7: WARRANTIES, TERMS & CONDITIONS                                    -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Warranty Guarantees & Commercial Terms', '07')}

      <div class="section-title">Equipment Warranties & Service Commitments</div>
      <div class="section-subtitle">Backed directly by Tier-1 OEM manufacturers and our certified EPC workmanship warranty.</div>

      <div class="grid-2">
        <div class="card">
          <div style="font-size: 7.5pt; font-weight: 800; color: ${primaryColor}; text-transform: uppercase;">Solar PV Modules</div>
          <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin: 2px 0 2px 0;">${modWarranty}</div>
          <div style="font-size: 7.5pt; color: #64748b;">10-12 Yr Product Warranty + 25 Yr Linear Power Degradation Guarantee</div>
        </div>

        <div class="card">
          <div style="font-size: 7.5pt; font-weight: 800; color: ${accentColor}; text-transform: uppercase;">Solar Grid Inverter</div>
          <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin: 2px 0 2px 0;">${invWarranty}</div>
          <div style="font-size: 7.5pt; color: #64748b;">Standard OEM replacement warranty against manufacturing & electronic defects</div>
        </div>

        <div class="card">
          <div style="font-size: 7.5pt; font-weight: 800; color: #64748b; text-transform: uppercase;">Mounting Structure</div>
          <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin: 2px 0 2px 0;">${strWarranty}</div>
          <div style="font-size: 7.5pt; color: #64748b;">Structural integrity, wind resistance up to 150 km/h, corrosion resistance</div>
        </div>

        <div class="card">
          <div style="font-size: 7.5pt; font-weight: 800; color: #b45309; text-transform: uppercase;">Workmanship Guarantee</div>
          <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin: 2px 0 2px 0;">${insWarranty}</div>
          <div style="font-size: 7.5pt; color: #64748b;">Comprehensive wiring, termination, earthing & mechanical integrity support</div>
        </div>
      </div>

      <div style="font-weight: 800; font-size: 8.5pt; color: #0f172a; margin: 12px 0 6px 0; text-transform: uppercase; letter-spacing: 0.4px;">
        Commercial Terms & Conditions
      </div>
      <div class="card" style="background: #f8fafc; font-size: 7.5pt; color: #334155; line-height: 1.5;">
        ${(data.termsAndConditions && data.termsAndConditions.length > 0 ? data.termsAndConditions : [
          `Quotation Validity: This commercial proposal is valid for ${data.validUntil} from date of issue.`,
          'Central Government Subsidy (PM Surya Ghar) is an indicative estimate and is credited directly to consumer account via DBT post-commissioning.',
          'Net Metering: Net metering feasibility and approvals are governed by State DISCOM regulations and local transformer load capacity.',
          'Customer Responsibilities: Rooftop access, water supply for cleaning, and grid electrical power during installation are customer obligations.',
          'Statutory Fees: State DISCOM meter testing and registration fees are charged as per actual utility tariff notifications.',
        ]).map((term) => `<div style="margin-bottom: 4px;">• ${term}</div>`).join('')}
      </div>

      ${data.bankDetails ? `
      <div class="card" style="margin-top: 12px;">
        <div style="font-size: 8pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">
          Official EPC Bank Account for Advance Token Booking
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 7.5pt; font-family: monospace; color: #334155;">
          <div><span style="color: #64748b; font-family: sans-serif; display: block;">Beneficiary:</span><strong>${data.bankDetails.accountName}</strong></div>
          <div><span style="color: #64748b; font-family: sans-serif; display: block;">Bank Name:</span>${data.bankDetails.bankName}</div>
          <div><span style="color: #64748b; font-family: sans-serif; display: block;">Account No:</span><strong style="color: ${primaryColor};">${data.bankDetails.accountNumber}</strong></div>
          <div><span style="color: #64748b; font-family: sans-serif; display: block;">IFSC Code:</span><strong>${data.bankDetails.ifsc}</strong></div>
        </div>
      </div>
      ` : ''}
    </div>
    ${renderPageFooter()}
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 8: ACCEPTANCE & SIGNATORY BLOCK                                      -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Acceptance & Work Order Authorization', '08')}

      <div class="section-title">Work Order Acceptance & Authorization</div>
      <div class="section-subtitle">Signing this document constitutes formal acceptance of this commercial proposal and initiates project engineering.</div>

      <div class="card" style="background: #f8fafc; font-size: 8pt; color: #334155; line-height: 1.5; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0;">
          I/We, <strong>${data.customerName}</strong>, hereby confirm acceptance of Quotation 
          <strong> #${data.quotationNumber}</strong> for the supply, installation, testing, and commissioning of a 
          <strong> ${cap} kWp ${data.systemType || 'On-Grid'} Solar Rooftop Power Plant</strong> for the total sum of 
          <strong> ₹${formatInr(gross)} (${data.amountInWords || numberToWordsINR(gross)})</strong>.
        </p>
        <p style="margin: 0;">
          I/We agree to the payment milestone schedule, technical specifications, and terms and conditions 
          detailed herein, and authorize <strong>${data.companyName}</strong> to initiate DISCOM net-metering 
          applications and turnkey project procurement.
        </p>
      </div>

      <div class="grid-2" style="margin-bottom: 24px;">
        <!-- CUSTOMER SIGNATURE BOX -->
        <div class="card" style="height: 150px; display: flex; flex-direction: column; justify-content: space-between; border: 2px dashed #cbd5e1;">
          <div>
            <div style="font-size: 8pt; font-weight: 800; color: #0f172a; text-transform: uppercase;">Accepted & Confirmed By Customer</div>
            <div style="font-size: 7.5pt; color: #64748b;">${data.customerName}</div>
          </div>
          <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; display: flex; justify-content: space-between; font-size: 7.5pt; color: #64748b;">
            <div>Signature: <strong style="color: #0f172a;">[Authorized Sign]</strong></div>
            <div>Date: <strong style="color: #0f172a;">____ / ____ / 2026</strong></div>
          </div>
        </div>

        <!-- EPC CONTRACTOR SIGNATURE BOX -->
        <div class="card" style="height: 150px; display: flex; flex-direction: column; justify-content: space-between; border: 2px solid #cbd5e1; position: relative;">
          <div>
            <div style="font-size: 8pt; font-weight: 800; color: #0f172a; text-transform: uppercase;">For ${data.companyLegalName || data.companyName}</div>
            <div style="font-size: 7.5pt; color: #64748b;">Authorized EPC Representative</div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 10px;">
            <div>
              ${data.signatureUrl ? `<img src="${data.signatureUrl}" style="height: 40px; object-fit: contain;" alt="Sign" />` : `<span style="font-size: 7.5pt; color: #94a3b8; font-style: italic;">[Digitally Verified Signature]</span>`}
            </div>
            ${data.companyStampUrl ? `<img src="${data.companyStampUrl}" style="height: 48px; object-fit: contain; opacity: 0.8;" alt="Stamp" />` : ''}
          </div>

          <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; display: flex; justify-content: space-between; font-size: 7.5pt; color: #64748b;">
            <div><strong>${data.signatoryName || 'Authorized Signatory'}</strong><br><span style="font-size: 6.5pt;">${data.signatoryTitle || 'Director - Solar Operations'}</span></div>
            <div style="text-align: right;">Date:<br><strong style="color: #0f172a;">${data.quotationDate}</strong></div>
          </div>
        </div>
      </div>

      <div class="card" style="background: #eff6ff; border-color: #bfdbfe; text-align: center; padding: 12px;">
        <div style="font-weight: 800; font-size: 8.5pt; color: #1e3a8a;">Thank you for partnering with us for clean, sustainable solar energy.</div>
        <div style="font-size: 7.5pt; color: #2563eb; margin-top: 2px;">
          For Technical Liaisoning or Order Enquiries, contact 📞 ${data.companyPhone} • ✉️ ${data.companyEmail}
        </div>
      </div>
    </div>
    ${renderPageFooter()}
  </div>

</body>
</html>
  `;
}

export function generateDiscomHtml(type: string, data: any): string {
  const custName = data.customerName || 'SHRI CONSUMER';
  const consumerNo = data.consumerNumber || '123456789012';
  const bu = data.bu || '4100';
  const capacity = data.systemCapacityKw || '3.3';
  const company = data.companyName || 'Solar Energy Solutions';

  if (type === 'ANNEXURE_2') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Annexure 2 - Agreement</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: serif; font-size: 10pt; line-height: 1.5; color: #000; }
    .stamp-space { height: 160px; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-family: sans-serif; font-size: 11pt; color: #666; margin-bottom: 20px; }
    h2, h3 { text-align: center; margin: 4px 0; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 50px; }
  </style>
</head>
<body>
  <div class="stamp-space">[ SPACE FOR ₹100 / ₹500 NON-JUDICIAL STAMP PAPER ]</div>
  <h2>ANNEXURE - 2</h2>
  <h3>CONNECTION AGREEMENT FOR ROOFTOP SOLAR PV SYSTEM</h3>
  <p style="text-align: center; font-style: italic;">(Under MSEDCL Net Metering Regulations)</p>

  <p>This Agreement is entered on this <strong>${new Date().toLocaleDateString()}</strong> between:</p>
  <p><strong>Consumer:</strong> ${custName}, Consumer No: <strong>${consumerNo}</strong>, BU: <strong>${bu}</strong>, Address: ${data.address || 'Site Address'}.</p>
  <p>AND</p>
  <p><strong>System Installer / Vendor:</strong> ${company}.</p>

  <h4>1. System Specifications</h4>
  <p>Proposed Solar PV Plant Capacity: <strong>${capacity} kWp</strong> connected at LT grid voltage.</p>
  <h4>2. Obligations & Grid Protection</h4>
  <p>The consumer shall ensure anti-islanding protection is active at all times in the inverter, preventing any back-feeding to the grid during line outages to ensure safety of utility linemen.</p>

  <div class="sign-row">
    <div>
      <br><br>
      ____________________________<br>
      <strong>Signature of Consumer</strong><br>
      Name: ${custName}
    </div>
    <div style="text-align: right;">
      <br><br>
      ____________________________<br>
      <strong>Authorized Signatory</strong><br>
      For ${company}
    </div>
  </div>
</body>
</html>
    `;
  }

  if (type === 'WCR') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Work Completion Report</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: sans-serif; font-size: 10pt; line-height: 1.4; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9pt; }
    th { background: #f1f5f9; text-align: left; }
    h2, h3 { text-align: center; margin: 4px 0; color: #0f172a; }
  </style>
</head>
<body>
  <h2>WORK COMPLETION REPORT (WCR)</h2>
  <h3>Rooftop Solar PV Grid Interconnection Testing Report</h3>
  <p style="text-align: center; color: #64748b;">MSEDCL Net-Metering Statutory Compliance</p>

  <table>
    <tr><th>Consumer Name</th><td>${custName}</td><th>Consumer No</th><td>${consumerNo}</td></tr>
    <tr><th>Billing Unit (BU)</th><td>${bu}</td><th>Sanctioned Load</th><td>${data.sanctionedLoadKw || capacity} kW</td></tr>
    <tr><th>Installed Solar Capacity</th><td>${capacity} kWp</td><th>Grid Interconnection</th><td>LT 230V / 415V</td></tr>
  </table>

  <h4>Technical Test Certificate</h4>
  <table>
    <tr><th>Test Parameter</th><th>Standard Norm</th><th>Observed Value</th><th>Status</th></tr>
    <tr><td>Earth Pit 1 (Inverter Body)</td><td>&lt; 5.0 Ohms</td><td>2.1 Ohms</td><td>PASS</td></tr>
    <tr><td>Earth Pit 2 (PV Module Structure)</td><td>&lt; 5.0 Ohms</td><td>1.8 Ohms</td><td>PASS</td></tr>
    <tr><td>Earth Pit 3 (Lightning Arrestor)</td><td>&lt; 5.0 Ohms</td><td>2.4 Ohms</td><td>PASS</td></tr>
    <tr><td>Anti-Islanding Test (Mains Trip)</td><td>Trips &lt; 2.0 sec</td><td>0.18 sec</td><td>PASS</td></tr>
    <tr><td>DC Insulation Resistance</td><td>&gt; 1000 Mega Ohms</td><td>&gt; 2000 M-Ohms</td><td>PASS</td></tr>
  </table>

  <div style="margin-top: 40px; display: flex; justify-content: space-between;">
    <div>
      ____________________________<br>
      <strong>Certified Electrical Contractor</strong><br>
      License No: PWD/EL/2026/0994
    </div>
    <div style="text-align: right;">
      ____________________________<br>
      <strong>Consumer Signature</strong><br>
      ${custName}
    </div>
  </div>
</body>
</html>
    `;
  }

  // Default: Form A-1
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MSEDCL Form A-1</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: sans-serif; font-size: 10pt; line-height: 1.45; color: #0f172a; }
    h2, h3 { text-align: center; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 9pt; }
    th { background: #f8fafc; text-align: left; width: 35%; }
  </style>
</head>
<body>
  <h2>MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD.</h2>
  <h3>FORM A-1: APPLICATION FOR NET-METERING ROOFTOP SOLAR PV SYSTEM</h3>
  <p style="text-align: center; color: #64748b; font-size: 8.5pt;">To: The Executive Engineer / Sub-Divisional Officer, MSEDCL</p>

  <table>
    <tr><th>1. Name of the Applicant</th><td>${custName}</td></tr>
    <tr><th>2. Consumer Number</th><td><strong>${consumerNo}</strong></td></tr>
    <tr><th>3. Billing Unit (BU)</th><td>${bu}</td></tr>
    <tr><th>4. Service Connection Address</th><td>${data.address || 'Installation Address'}</td></tr>
    <tr><th>5. Mobile & Email</th><td>${data.phone || '9876543210'} | ${data.email || 'customer@gmail.com'}</td></tr>
    <tr><th>6. Tariff Category</th><td>LT-I Residential</td></tr>
    <tr><th>7. Sanctioned Connected Load</th><td>${data.sanctionedLoadKw || capacity} kW</td></tr>
    <tr><th>8. Proposed Solar Capacity</th><td><strong>${capacity} kWp</strong></td></tr>
    <tr><th>9. Inverter Make & Type</th><td>Grid-Tied String Inverter (IEC 62109, IEC 61727)</td></tr>
    <tr><th>10. Approved Solar Vendor</th><td>${company}</td></tr>
  </table>

  <p style="font-size: 8.5pt; color: #475569; margin-top: 14px;">
    I/We hereby apply for grid interconnection of our Rooftop Solar PV System under the Net-Metering arrangement. I agree to abide by the terms and conditions stipulated by MERC and MSEDCL.
  </p>

  <div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div>
      Date: <strong>${new Date().toLocaleDateString()}</strong><br>
      Place: <strong>${data.city || 'Site'}</strong>
    </div>
    <div style="text-align: right;">
      <br><br>
      ____________________________<br>
      <strong>Signature of Applicant</strong>
    </div>
  </div>
</body>
</html>
  `;
}

export interface InvoicePdfProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  invoiceType?: 'TAX_INVOICE' | 'PROFORMA' | 'ADVANCE_RECEIPT' | 'CUSTOM';
  milestoneTitle?: string;
  milestoneKey?: string;

  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyGstin?: string;
  companyPan?: string;
  companyLogoUrl?: string;

  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  consumerNumber?: string;
  discomName?: string;

  projectName?: string;
  projectCapacityKw?: number;
  systemType?: string;
  sanctionedLoad?: number;

  subtotal: number;
  taxRate: number;
  taxAmount: number;
  subsidyDeduction?: number;
  grossTotal: number;
  totalPaid: number;
  balanceDue: number;
  status: string;

  items?: Array<{
    description: string;
    hsn?: string;
    qty?: number;
    unit?: string;
    rate?: number;
    amount?: number;
    gstRate?: number;
  }>;

  payments?: Array<{
    date?: string;
    amount?: number;
    mode?: string;
    reference?: string;
  }>;

  bankDetails?: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upiId?: string;
    branch?: string;
  };

  terms?: string;
  notes?: string;
}

function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount || 0);
  if (rounded === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return singleDigits[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + singleDigits[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    if (n === 0) return '';
    if (n < 100) return convertTwoDigits(n);
    return singleDigits[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertTwoDigits(n % 100) : '');
  }

  let crore = Math.floor(rounded / 10000000);
  let rem = rounded % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  let thousand = Math.floor(rem / 1000);
  let hundreds = rem % 1000;

  let words = '';
  if (crore > 0) words += convertTwoDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (hundreds > 0) words += convertThreeDigits(hundreds) + ' ';

  return 'Rupees ' + words.trim() + ' Only';
}

export function generateInvoiceHtml(data: InvoicePdfProps): string {
  const formatInr = (n: number) => Math.round(n || 0).toLocaleString('en-IN');
  const isPaid = data.status === 'PAID' || data.balanceDue <= 0;
  const isOverdue = data.status === 'OVERDUE';
  const statusColor = isPaid ? '#059669' : isOverdue ? '#e11d48' : '#d97706';
  const statusBg = isPaid ? '#ecfdf5' : isOverdue ? '#fff1f2' : '#fffbeb';
  const statusBorder = isPaid ? '#a7f3d0' : isOverdue ? '#fecdd3' : '#fde68a';

  const isProforma = data.invoiceType === 'PROFORMA' || (data.invoiceNumber || '').startsWith('PRO');
  const isAdvance = data.invoiceType === 'ADVANCE_RECEIPT' || (data.invoiceNumber || '').startsWith('ADV');
  const docTitle = isProforma ? 'PROFORMA INVOICE' : isAdvance ? 'ADVANCE PAYMENT RECEIPT' : 'TAX INVOICE';

  const defaultItems = [
    {
      description: `${data.milestoneTitle || 'Complete Turnkey Rooftop Solar PV System Kit'} (${data.projectCapacityKw || 3.3} kWp Grid-Tied)`,
      hsn: '8541',
      qty: 1,
      unit: 'System',
      rate: data.subtotal || data.grossTotal,
      amount: data.subtotal || data.grossTotal,
      gstRate: data.taxRate || 13.8,
    },
  ];

  const items = data.items && data.items.length > 0 ? data.items : defaultItems;
  const halfGstRate = ((data.taxRate || 13.8) / 2).toFixed(1);
  const halfGstAmount = Math.round((data.taxAmount || (data.grossTotal - data.subtotal)) / 2);
  const amountInWords = numberToWordsINR(data.grossTotal);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 9.5pt;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .company-title {
      font-size: 18pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
    }
    .company-sub {
      font-size: 8.5pt;
      color: #059669;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .company-meta {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.35;
    }
    .invoice-title-box {
      text-align: right;
    }
    .invoice-title {
      font-size: 20pt;
      font-weight: 900;
      color: #059669;
      letter-spacing: 1px;
      margin: 0 0 6px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      border: 1px solid ${statusBorder};
      background: ${statusBg};
      color: ${statusColor};
      margin-bottom: 8px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .meta-table td {
      vertical-align: top;
      width: 50%;
      padding: 10px;
      border: 1px solid #e2e8f0;
      background: #fafafa;
    }
    .meta-heading {
      font-size: 8pt;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .party-name {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .party-meta {
      font-size: 8.5pt;
      color: #334155;
      line-height: 1.4;
    }
    .project-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .project-banner-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #1e40af;
    }
    .project-banner-sub {
      font-size: 8.5pt;
      color: #3b82f6;
    }
    .milestone-badge-bar {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
    }
    .milestone-title {
      font-size: 10pt;
      font-weight: 800;
      color: #065f46;
    }
    .milestone-sub {
      font-size: 8.5pt;
      color: #047857;
      margin-top: 2px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      border: 1px solid #0f172a;
    }
    .items-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      font-size: 9pt;
      color: #1e293b;
    }
    .totals-container {
      width: 100%;
      display: flex;
      justify-content: flex-end;
      margin-bottom: 14px;
    }
    .totals-table {
      width: 45%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 10px;
      font-size: 9pt;
      border-bottom: 1px solid #f1f5f9;
    }
    .totals-label {
      color: #64748b;
      font-weight: 600;
    }
    .totals-val {
      text-align: right;
      font-weight: 700;
      color: #0f172a;
    }
    .grand-total-row {
      background: #059669;
      color: #ffffff;
    }
    .grand-total-row td {
      padding: 10px;
      font-size: 11pt;
      font-weight: 900;
      color: #ffffff;
      border: none;
    }
    .words-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 8.5pt;
      color: #334155;
    }
    .payments-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 14px;
      background: #ffffff;
    }
    .payments-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .payments-table {
      width: 100%;
      border-collapse: collapse;
    }
    .payments-table th, .payments-table td {
      padding: 5px 8px;
      font-size: 8.5pt;
      border-bottom: 1px solid #f1f5f9;
      text-align: left;
    }
    .bank-and-sign {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
    }
    .bank-and-sign td {
      vertical-align: top;
      width: 50%;
      padding: 10px;
      border: 1px solid #e2e8f0;
    }
    .sign-box {
      text-align: right;
      height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .terms-text {
      font-size: 7.5pt;
      color: #64748b;
      line-height: 1.35;
      margin-top: 14px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: top; width: 60%;">
        <div class="company-title">${data.companyName || 'Solar Solutions Pvt Ltd'}</div>
        <div class="company-sub">Authorized Solar EPC Partner & Turnkey Contractor</div>
        <div class="company-meta">
          ${data.companyAddress || 'Corporate Office, Solar Park, Maharashtra'}<br>
          📞 ${data.companyPhone || '+91 98765 43210'} | ✉️ ${data.companyEmail || 'contact@solarmanager.in'}<br>
          ${data.companyGstin ? `<strong>GSTIN:</strong> ${data.companyGstin}` : '<strong>GSTIN:</strong> 27AABCS1429B1Z5'} | 
          ${data.companyPan ? `<strong>PAN:</strong> ${data.companyPan}` : '<strong>PAN:</strong> AABCS1429B'}
        </div>
      </td>
      <td style="vertical-align: top; width: 40%;" class="invoice-title-box">
        <div class="invoice-title">${docTitle}</div>
        <div><span class="status-badge">${isPaid ? 'PAID IN FULL' : isOverdue ? 'OVERDUE' : data.status || 'UNPAID'}</span></div>
        <div class="company-meta">
          <strong>Invoice No:</strong> ${data.invoiceNumber}<br>
          <strong>Invoice Date:</strong> ${data.invoiceDate}<br>
          <strong>Due Date:</strong> ${data.dueDate}<br>
          <strong>Reverse Charge:</strong> No
        </div>
      </td>
    </tr>
  </table>

  <!-- BILL TO & SHIP TO -->
  <table class="meta-table">
    <tr>
      <td>
        <div class="meta-heading">Billed To (Client / Customer)</div>
        <div class="party-name">${data.customerName || 'Valued Customer'}</div>
        <div class="party-meta">
          📞 Mobile: ${data.customerPhone || 'N/A'}<br>
          ${data.customerEmail ? `✉️ Email: ${data.customerEmail}<br>` : ''}
          📍 Installation Site: ${data.customerAddress || 'Site Location, Maharashtra'}<br>
          🏛️ State: Maharashtra (Code: 27)
        </div>
      </td>
      <td>
        <div class="meta-heading">Project & Statutory Profile</div>
        <div class="party-name">${data.projectName || `${data.customerName}'s Rooftop Solar`}</div>
        <div class="party-meta">
          ⚡ System Capacity: <strong>${data.projectCapacityKw || 3.3} kWp Grid-Tied</strong><br>
          🔌 DISCOM Consumer No: <strong>${data.consumerNumber || 'N/A'}</strong><br>
          🏢 Utility Provider: ${data.discomName || 'MSEDCL (Mahavitaran)'}<br>
          🏛️ Scheme: PM Surya Ghar Muft Bijli Yojana
        </div>
      </td>
    </tr>
  </table>

  <!-- BILLING SCOPE BANNER -->
  <div class="milestone-badge-bar">
    <div class="milestone-title">📍 Scope / Description: ${data.milestoneTitle || 'Complete Turnkey Rooftop Solar PV Installation'}</div>
    <div class="milestone-sub">
      Turnkey Solar Rooftop Contract • Statutory Equipment Supply, Execution & Grid Net-Metering
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 48%; text-align: left;">Item Description</th>
        <th style="width: 10%;">HSN/SAC</th>
        <th style="width: 7%;">Qty</th>
        <th style="width: 15%; text-align: right;">Rate (₹)</th>
        <th style="width: 15%; text-align: right;">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (it, idx) => `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          <td>
            <strong>${it.description}</strong>
          </td>
          <td style="text-align: center; font-family: monospace;">${it.hsn || '8541'}</td>
          <td style="text-align: center;">${it.qty || 1} ${it.unit || 'Stage'}</td>
          <td style="text-align: right;">₹${formatInr(it.rate || it.amount || 0)}</td>
          <td style="text-align: right; font-weight: 700;">₹${formatInr(it.amount || 0)}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- TOTALS BREAKDOWN -->
  <div class="totals-container">
    <table class="totals-table">
      <tr>
        <td class="totals-label">Taxable Subtotal</td>
        <td class="totals-val">₹${formatInr(data.subtotal)}</td>
      </tr>
      <tr>
        <td class="totals-label">CGST (${halfGstRate}%)</td>
        <td class="totals-val">₹${formatInr(halfGstAmount)}</td>
      </tr>
      <tr>
        <td class="totals-label">SGST (${halfGstRate}%)</td>
        <td class="totals-val">₹${formatInr(halfGstAmount)}</td>
      </tr>
      <tr class="grand-total-row">
        <td>Total Invoice Value</td>
        <td style="text-align: right;">₹${formatInr(data.grossTotal)}</td>
      </tr>
      ${
        data.totalPaid > 0
          ? `
        <tr>
          <td class="totals-label" style="color: #059669; font-weight: 700;">Less: Total Paid to Date</td>
          <td class="totals-val" style="color: #059669; font-weight: 800;">-₹${formatInr(data.totalPaid)}</td>
        </tr>
      `
          : ''
      }
      <tr>
        <td class="totals-label" style="font-weight: 800; font-size: 10pt; color: #0f172a;">Balance Due</td>
        <td class="totals-val" style="font-weight: 900; font-size: 11pt; color: ${data.balanceDue > 0 ? '#d97706' : '#059669'};">
          ₹${formatInr(data.balanceDue)}
        </td>
      </tr>
    </table>
  </div>

  <!-- AMOUNT IN WORDS -->
  <div class="words-box">
    <strong>Invoice Amount in Words:</strong> ${amountInWords}
  </div>

  <!-- PAYMENTS HISTORY (IF ANY) -->
  ${
    data.payments && data.payments.length > 0
      ? `
    <div class="payments-box">
      <div class="payments-title">Recorded Payment Transactions</div>
      <table class="payments-table">
        <thead>
          <tr style="color: #64748b; font-size: 8pt; text-transform: uppercase;">
            <th>Date</th>
            <th>Mode</th>
            <th>Reference / UTR</th>
            <th style="text-align: right;">Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          ${data.payments
            .map(
              (p) => `
            <tr>
              <td>${p.date ? new Date(p.date).toLocaleDateString('en-IN') : 'Confirmed'}</td>
              <td><strong>${p.mode || 'UPI'}</strong></td>
              <td>${p.reference || 'Standard Transfer'}</td>
              <td style="text-align: right; color: #059669; font-weight: 800;">₹${formatInr(p.amount || 0)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
      : ''
  }

  <!-- BANK DETAILS & SIGNATURE -->
  <table class="bank-and-sign">
    <tr>
      <td>
        <div class="meta-heading">Bank Transfer & UPI Remittance</div>
        <div class="party-meta" style="line-height: 1.5;">
          <strong>Account Name:</strong> ${data.bankDetails?.accountName || data.companyName || 'Solar Solutions Pvt Ltd'}<br>
          <strong>Bank Name:</strong> ${data.bankDetails?.bankName || 'HDFC Bank Ltd'}<br>
          <strong>Account Number:</strong> ${data.bankDetails?.accountNumber || '50200088992211'}<br>
          <strong>IFSC Code:</strong> ${data.bankDetails?.ifsc || 'HDFC0001234'}<br>
          <strong>UPI ID:</strong> ${data.bankDetails?.upiId || 'solarmanager@hdfcbank'}
        </div>
      </td>
      <td>
        <div class="meta-heading">Authorized Signatory</div>
        <div class="sign-box">
          <div style="font-size: 8pt; color: #64748b;">
            For <strong>${data.companyName || 'Solar Solutions Pvt Ltd'}</strong>
          </div>
          <div style="text-align: center; color: #94a3b8; font-style: italic; font-size: 8pt;">
            [Digitally Verified Solar ERP Invoice]
          </div>
          <div style="font-size: 8.5pt; font-weight: 700; color: #0f172a;">
            Authorized Signatory
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- TERMS -->
  <div class="terms-text">
    <strong>Terms & Conditions:</strong><br>
    1. Payment is due within the stipulated due date. Interest @ 18% p.a. applicable on overdue milestone payments.<br>
    2. Solar PV modules and inverters are warranted by respective OEM manufacturers under PM Surya Ghar guidelines.<br>
    3. Net-metering clearance and Central CFA Subsidy DBT release are governed by DISCOM & MNRE portal SLAs.<br>
    4. Subject to local jurisdiction. This is a computer-generated GST tax invoice.
  </div>
</body>
</html>
  `;
}

export async function previewPdf(html: string): Promise<boolean> {
  try {
    await Print.printAsync({ html });
    return true;
  } catch (err: any) {
    console.warn('Native Print preview failed, falling back to share:', err?.message);
    try {
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      let shareUri = uri;
      if (base64) {
        try {
          const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
          const previewFileUri = `${docDir}Quotation_Preview.pdf`;
          await FileSystem.writeAsStringAsync(previewFileUri, base64, {
            encoding: 'base64',
          });
          shareUri = previewFileUri;
        } catch (writeErr) {
          console.warn('Preview writeAsStringAsync error:', writeErr);
        }
      }

      const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
      if (isAvailable) {
        await Sharing.shareAsync(shareUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'View / Save Proposal PDF',
        });
        return true;
      }
    } catch (fallbackErr) {
      console.error('PDF Preview fallback failed:', fallbackErr);
    }
    Alert.alert('Preview Notice', err.message || 'Could not launch document preview');
    return false;
  }
}

export async function sharePdfFile(
  html: string,
  fileName: string,
  customerPhone?: string
): Promise<string | null> {
  try {
    const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
    let shareableUri = uri;

    const baseName = fileName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = `${baseName}.pdf`;

    // Write Base64 string directly into FileSystem.documentDirectory (or cacheDirectory).
    // Writing through FileSystem inside documentDirectory ensures 100% read permission for Android FileProvider and WhatsApp.
    if (base64) {
      let written = false;
      try {
        const docDir = FileSystem.documentDirectory || '';
        if (docDir) {
          const docUri = `${docDir}${cleanFileName}`;
          await FileSystem.writeAsStringAsync(docUri, base64, {
            encoding: 'base64',
          });
          const info = await FileSystem.getInfoAsync(docUri).catch(() => null);
          if (info && info.exists && info.size > 0) {
            shareableUri = docUri;
            written = true;
          }
        }
      } catch (docErr) {
        console.warn('Writing to documentDirectory failed, trying cacheDirectory:', docErr);
      }

      if (!written) {
        try {
          const cacheDir = FileSystem.cacheDirectory || '';
          if (cacheDir) {
            const cacheUri = `${cacheDir}${cleanFileName}`;
            await FileSystem.writeAsStringAsync(cacheUri, base64, {
              encoding: 'base64',
            });
            const info = await FileSystem.getInfoAsync(cacheUri).catch(() => null);
            if (info && info.exists && info.size > 0) {
              shareableUri = cacheUri;
              written = true;
            }
          }
        } catch (cacheErr) {
          console.warn('Writing to cacheDirectory failed:', cacheErr);
        }
      }
    }

    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (!isAvailable) {
      Alert.alert('Sharing Unavailable', 'File sharing is not supported on this device.');
      return null;
    }

    // Expo Sharing passes content URI via Android FileProvider so WhatsApp attaches the real PDF document
    await Sharing.shareAsync(shareableUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${cleanFileName}`,
      UTI: 'com.adobe.pdf',
    });

    return shareableUri;
  } catch (err: any) {
    console.error('PDF generation error:', err);
    Alert.alert('PDF Export Error', err.message || 'Failed to generate PDF document');
    return null;
  }
}

export const createAndSharePdf = sharePdfFile;
export const sharePdfToWhatsApp = sharePdfFile;

export async function printDirectly(html: string): Promise<void> {
  try {
    await Print.printAsync({ html });
  } catch (err: any) {
    Alert.alert('Print Error', err.message || 'Failed to send document to printer');
  }
}
