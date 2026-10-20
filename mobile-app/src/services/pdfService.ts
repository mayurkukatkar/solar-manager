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
  coverImageUrl?: string;
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
    battery?: string;
    other?: string;
  };
  termsAndConditions?: string[];

  // Official EPC Bank Details
  bankDetails?: {
    account_name?: string;
    accountName?: string;
    bank_name?: string;
    bankName?: string;
    account_number?: string;
    accountNumber?: string;
    ifsc?: string;
    upi_id?: string;
    upiId?: string;
    branch?: string;
  };

  financingDetails?: {
    monthly_emi?: number;
    loan_amount?: number;
    interest_rate?: number;
    tenure_years?: number;
  };
}

/**
 * Format number as Indian Rupee string
 */
export function formatINR(val: number): string {
  if (isNaN(val)) return '0';
  return Math.round(val).toLocaleString('en-IN');
}

/**
 * Generates an exceptionally beautiful, art-directed A4 multi-page HTML string matching the Next.js web client.
 */
export function generateQuotationHtml(data: QuotationPdfProps): string {
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

  const cap = data.systemCapacityKw || 5.0;
  const invCap = data.inverterCapacityKw || cap;
  const panelWatt = data.panelWattage || 550;
  const panelQty = data.panelQuantity || Math.ceil((cap * 1000) / panelWatt);
  const annualUnits = data.annualGenerationUnits || Math.round(cap * 1460);
  const tariff = data.tariffRate || (isCommercial ? 10.5 : 8.5);
  const monthlySavings = data.monthlySavings || Math.round((annualUnits / 12) * tariff);
  const annualSavings = Math.round(annualUnits * tariff);
  const lifetimeSavings = data.lifetimeSavings || Math.round(annualSavings * 25 * 1.3);
  const gross = data.grossAmount || 275000;
  const discount = data.discount || 0;
  const subsidy = data.subsidyAmount || (cap <= 3 ? cap * 26000 : 78000);
  const net = data.netPayable || Math.max(0, gross - subsidy);
  const subtotal = data.subtotal || Math.round(gross / 1.138);
  const tax = data.taxAmount || Math.round(gross - subtotal);
  const payback = data.paybackYears && !isNaN(data.paybackYears) ? data.paybackYears : 4.2;

  // Monthly generation data
  const months = [
    { m: 'Jan', gen: Math.round(cap * 118) },
    { m: 'Feb', gen: Math.round(cap * 122) },
    { m: 'Mar', gen: Math.round(cap * 142) },
    { m: 'Apr', gen: Math.round(cap * 148) },
    { m: 'May', gen: Math.round(cap * 155), peak: true },
    { m: 'Jun', gen: Math.round(cap * 110) },
    { m: 'Jul', gen: Math.round(cap * 92) },
    { m: 'Aug', gen: Math.round(cap * 96) },
    { m: 'Sep', gen: Math.round(cap * 114) },
    { m: 'Oct', gen: Math.round(cap * 128) },
    { m: 'Nov', gen: Math.round(cap * 122) },
    { m: 'Dec', gen: Math.round(cap * 113) }
  ];
  const maxGen = Math.max(...months.map(d => d.gen));

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
        { stage: 1, percentage: 10, amount: Math.round(gross * 0.10), description: 'Advance with Confirmed Work Order & Engineering Design' },
        { stage: 2, percentage: 70, amount: Math.round(gross * 0.70), description: 'On Material Dispatch & Site Delivery of Modules, Inverter & Structure' },
        { stage: 3, percentage: 15, amount: Math.round(gross * 0.15), description: 'Post Mechanical Mounting, Electrical Termination & Safety Earthing' },
        { stage: 4, percentage: 5, amount: Math.round(gross * 0.05), description: 'On State DISCOM Net-Metering Inspection & Bi-directional Meter Handover' },
      ];

  // Total pages count
  const totalPages = isQuickQuote ? 3 : 6;
  let pageCounter = 0;

  const renderPageHeader = (title: string, sectionNum: string) => `
    <div class="page-header">
      <div class="header-left">
        ${data.companyLogoUrl ? `<img src="${data.companyLogoUrl}" class="header-logo" alt="${data.companyName}" />` : `
        <div class="header-icon-box">W</div>`}
        <div>
          <div class="header-comp-name">${data.companyName}</div>
          <div class="header-comp-contact">${data.companyAddress ? data.companyAddress.split(',')[0] : 'India'} • 📞 ${data.companyPhone}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="header-section-title"><span class="section-tag">[${sectionNum}]</span> ${title}</div>
        <div class="header-quote-meta">Ref: <strong>${data.quotationNumber}</strong> • ${data.quotationDate}</div>
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
          • Certified EPC Contractor
        </div>
        <div class="footer-page-num">
          PAGE 0${pageCounter} / 0${totalPages}
        </div>
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WhereReady Solar OS Proposal - ${data.customerName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&family=Space+Grotesk:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

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
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #141715;
      background: #faf8f5;
      margin: 0;
      padding: 0;
      font-size: 8.5pt;
      line-height: 1.45;
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
      background: #faf8f5;
    }
    .a4-page:last-child {
      page-break-after: avoid;
    }

    /* HEADER & FOOTER */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(7, 28, 17, 0.12);
      margin-bottom: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-logo {
      height: 28px;
      object-fit: contain;
    }
    .header-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: #071c11;
      color: #c5a059;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-family: 'Manrope', serif;
      font-size: 14px;
    }
    .header-comp-name {
      font-size: 9pt;
      font-weight: 800;
      color: #071c11;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-family: 'Manrope', sans-serif;
    }
    .header-comp-contact {
      font-size: 7pt;
      color: #64748b;
    }
    .header-right {
      text-align: right;
    }
    .header-section-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #071c11;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-family: 'Manrope', sans-serif;
    }
    .section-tag {
      color: #c5a059;
      font-family: monospace;
    }
    .header-quote-meta {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 1px;
      font-family: monospace;
    }
    .page-footer {
      padding-top: 8px;
      border-top: 1px solid rgba(7, 28, 17, 0.12);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #64748b;
      margin-top: auto;
    }
    .footer-page-num {
      font-family: monospace;
      font-weight: 700;
      color: #c5a059;
      letter-spacing: 1px;
    }

    /* EDITORIAL TYPOGRAPHY & HEADINGS */
    .section-kicker {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #c5a059;
      display: block;
      margin-bottom: 2px;
    }
    .section-title {
      font-size: 15pt;
      font-weight: 900;
      color: #071c11;
      letter-spacing: -0.3px;
      margin: 0 0 2px 0;
      font-family: 'Manrope', sans-serif;
    }
    .section-subtitle {
      font-size: 7.8pt;
      color: #64748b;
      margin: 0 0 14px 0;
      line-height: 1.4;
    }

    /* LUXURY CARDS & GRIDS */
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px; }
    .card-white {
      background: #ffffff;
      border: 1px solid rgba(7, 28, 17, 0.1);
      border-radius: 12px;
      padding: 12px 14px;
    }
    .card-dark {
      background: #071c11;
      color: #ffffff;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .kpi-title {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 15pt;
      font-weight: 900;
      font-family: 'Space Grotesk', sans-serif;
      color: #071c11;
    }

    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 7.8pt;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid rgba(7, 28, 17, 0.1);
    }
    th {
      background: #faf8f5;
      color: #071c11;
      font-weight: 800;
      text-align: left;
      padding: 7px 10px;
      border-bottom: 1px solid rgba(7, 28, 17, 0.1);
      text-transform: uppercase;
      font-size: 6.8pt;
      letter-spacing: 0.5px;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:last-child td {
      border-bottom: none;
    }

    /* COVER PAGE STYLING */
    .cover-page {
      background: #071c11;
      color: #ffffff;
      padding: 16mm 16mm;
      position: relative;
    }
    .cover-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.15);
      padding-bottom: 14px;
      position: relative;
      z-index: 2;
    }
    .cover-main-title {
      font-size: 32pt;
      font-weight: 900;
      line-height: 1.05;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin: 0 0 16px 0;
      font-family: 'Manrope', sans-serif;
    }
    .cover-gold-text {
      color: #dfbf78;
    }
    .cover-client-card {
      background: rgba(11, 32, 20, 0.85);
      border: 1px solid rgba(197, 160, 89, 0.4);
      border-radius: 14px;
      padding: 16px 20px;
      max-width: 150mm;
      margin-bottom: 24px;
      backdrop-filter: blur(10px);
    }
    .cover-footer {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 14px;
      font-size: 7.5pt;
      color: #94a3b8;
      position: relative;
      z-index: 2;
    }

    /* MONTHLY BARS */
    .chart-container {
      background: #ffffff;
      border: 1px solid rgba(7, 28, 17, 0.1);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }
    .bars-row {
      display: flex;
      align-items: flex-end;
      height: 70px;
      gap: 6px;
      padding-top: 10px;
    }
    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
    }
    .bar-fill {
      width: 100%;
      border-radius: 3px 3px 0 0;
      background: #0b2014;
    }
    .bar-fill-peak {
      background: #c5a059;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- PAGE 1: CINEMATIC COVER PAGE                                              -->
  <!-- ========================================================================= -->
  <div class="a4-page cover-page">
    <div class="cover-top-bar">
      <div style="display: flex; align-items: center; gap: 10px;">
        ${data.companyLogoUrl ? `<img src="${data.companyLogoUrl}" style="height: 36px; object-fit: contain;" alt="${data.companyName}" />` : `
        <div style="width: 36px; height: 36px; border-radius: 8px; background: #c5a059; color: #071c11; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900;">W</div>`}
        <div>
          <div style="font-size: 10.5pt; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; font-family: 'Manrope', sans-serif;">${data.companyName}</div>
          <div style="font-size: 7pt; color: #c5a059; text-transform: uppercase; letter-spacing: 0.5px;">Renewable Energy EPC Architecture</div>
        </div>
      </div>
      <div>
        <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 7pt; font-weight: 800; background: rgba(197, 160, 89, 0.2); color: #dfbf78; border: 1px solid rgba(197, 160, 89, 0.4); text-transform: uppercase; letter-spacing: 0.8px;">
          Private EPC Proposal • 2026
        </span>
      </div>
    </div>

    <div style="padding: 18mm 0 10mm 0; position: relative; z-index: 2;">
      <div style="font-size: 8pt; font-weight: 800; color: #dfbf78; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">
        WhereReady Solar OS • Enterprise Edition
      </div>
      <h1 class="cover-main-title">
        Power Your<br>
        <span class="cover-gold-text">Future.</span>
      </h1>

      <div class="cover-client-card">
        <div style="font-size: 7pt; font-weight: 800; color: #c5a059; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">
          Prepared Exclusively For
        </div>
        <div style="font-size: 15pt; font-weight: 900; color: #ffffff; margin-bottom: 4px; font-family: 'Manrope', sans-serif;">
          ${data.customerName}
        </div>
        <div style="font-size: 7.8pt; color: #cbd5e1; line-height: 1.4;">
          📍 ${data.customerAddress}<br>
          📞 Phone: ${data.customerPhone} ${data.customerEmail ? `| ✉️ ${data.customerEmail}` : ''}
          ${data.consumerNumber ? `<br><strong style="color: #4ade80;">DISCOM Account No:</strong> ${data.consumerNumber} (${data.discomName || 'DISCOM'})` : ''}
        </div>
      </div>

      <!-- SPECS RIBBON -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; max-width: 150mm;">
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px;">
          <div style="font-size: 6.8pt; text-transform: uppercase; color: #94a3b8; font-weight: 800;">Plant Rating</div>
          <div style="font-size: 15pt; font-weight: 900; color: #ffffff; font-family: 'Space Grotesk', sans-serif;">
            ${cap} <span style="font-size: 8pt; color: #c5a059;">kWp</span>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px;">
          <div style="font-size: 6.8pt; text-transform: uppercase; color: #94a3b8; font-weight: 800;">Annual Yield</div>
          <div style="font-size: 15pt; font-weight: 900; color: #ffffff; font-family: 'Space Grotesk', sans-serif;">
            ${annualUnits.toLocaleString()} <span style="font-size: 8pt; color: #94a3b8;">kWh</span>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px;">
          <div style="font-size: 6.8pt; text-transform: uppercase; color: #94a3b8; font-weight: 800;">25-Yr Return</div>
          <div style="font-size: 15pt; font-weight: 900; color: #dfbf78; font-family: 'Space Grotesk', sans-serif;">
            ₹${(lifetimeSavings / 100000).toFixed(1)}L
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px;">
          <div style="font-size: 6.8pt; text-transform: uppercase; color: #94a3b8; font-weight: 800;">CO2 Abated</div>
          <div style="font-size: 15pt; font-weight: 900; color: #34d399; font-family: 'Space Grotesk', sans-serif;">
            ${data.co2ReductionKg || Math.round(cap * 32)} <span style="font-size: 8pt; color: #94a3b8;">Tons</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <span style="font-size: 6.8pt; color: #c5a059; text-transform: uppercase; letter-spacing: 1px; display: block;">Proposal Number</span>
        <strong style="color: #ffffff; font-family: monospace; font-size: 9pt;">${data.quotationNumber}</strong>
      </div>
      <div>
        <span style="font-size: 6.8pt; color: #c5a059; text-transform: uppercase; letter-spacing: 1px; display: block;">Issuance Date</span>
        <strong style="color: #ffffff;">${data.quotationDate}</strong>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 6.8pt; color: #c5a059; text-transform: uppercase; letter-spacing: 1px; display: block;">Validity Period</span>
        <strong style="color: #dfbf78;">${data.validUntil}</strong>
      </div>
    </div>
  </div>

  ${!isQuickQuote ? `
  <!-- ========================================================================= -->
  <!-- PAGE 2: YOUR ENERGY PROFILE                                               -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Energy Profile & Site Audit', '01')}

      <span class="section-kicker">Baseline Economics</span>
      <h2 class="section-title">Translating Rooftop Insolation Into Zero Grid Dependency</h2>
      <p class="section-subtitle">Detailed energy consumption audit and utility tariff mapping establishing pre-solar baseline.</p>

      <div class="grid-3">
        <div class="card-white">
          <div class="kpi-title">Current Grid Outflow</div>
          <div class="kpi-val">₹${formatINR(data.currentMonthlyBill * 12)} <span style="font-size: 8pt; color: #64748b;">/ yr</span></div>
          <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">~₹${formatINR(data.currentMonthlyBill)}/mo @ ₹${tariff}/unit</div>
        </div>

        <div class="card-white">
          <div class="kpi-title" style="color: #059669;">Proposed Clean Yield</div>
          <div class="kpi-val" style="color: #059669;">${annualUnits.toLocaleString()} <span style="font-size: 8pt; color: #64748b;">kWh / yr</span></div>
          <div style="font-size: 7.5pt; color: #059669; margin-top: 2px;">~${Math.round(annualUnits / 12)} kWh / mo clean power</div>
        </div>

        <div class="card-dark">
          <div class="kpi-title" style="color: #c5a059;">Projected Bill Reduction</div>
          <div class="kpi-val" style="color: #dfbf78;">~90% - 95%</div>
          <div style="font-size: 7.5pt; color: #cbd5e1; margin-top: 2px;">Net-metering credits offset grid consumption</div>
        </div>
      </div>

      <!-- BEFORE VS AFTER COMPARISON -->
      <div class="card-white" style="margin-bottom: 14px;">
        <div style="font-size: 8pt; font-weight: 800; color: #071c11; text-transform: uppercase; margin-bottom: 10px;">
          ⚡ Before vs After Solar Power Balance
        </div>
        <div class="grid-2">
          <div style="background: #faf8f5; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 7.5pt; font-weight: 800; color: #b91c1c; margin-bottom: 4px;">
              <span>WITHOUT SOLAR (CURRENT)</span>
              <span>100% GRID DEPENDENCE</span>
            </div>
            <div style="width: 100%; height: 6px; background: #fee2e2; border-radius: 10px; overflow: hidden; margin-bottom: 4px;">
              <div style="width: 100%; height: 100%; background: #ef4444;"></div>
            </div>
            <div style="font-size: 7.2pt; color: #64748b;">All units drawn from fossil grid at escalating retail slabs.</div>
          </div>

          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 7.5pt; font-weight: 800; color: #065f46; margin-bottom: 4px;">
              <span>WITH WHEREREADY SOLAR</span>
              <span>~90% SELF-SUFFICIENCY</span>
            </div>
            <div style="width: 100%; height: 6px; background: #a7f3d0; border-radius: 10px; overflow: hidden; margin-bottom: 4px; display: flex;">
              <div style="width: 90%; height: 100%; background: #059669;"></div>
              <div style="width: 10%; height: 100%; background: #f59e0b;"></div>
            </div>
            <div style="font-size: 7.2pt; color: #065f46;">90% daytime solar self-consumption; surplus exported via net meter.</div>
          </div>
        </div>
      </div>

      <!-- AUDIT TABLE -->
      <table>
        <thead>
          <tr>
            <th>Audit Parameter</th>
            <th>Consumer Record</th>
            <th>Engineering Assessment</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>DISCOM & Billing Division</strong></td>
            <td>${data.discomName || 'MSEDCL (Mahavitaran)'} • BU: ${data.billingUnit || '4134'}</td>
            <td style="color: #059669; font-weight: 600;">Eligible for Bi-directional Net Metering</td>
          </tr>
          <tr>
            <td><strong>Consumer Account Number</strong></td>
            <td><strong style="font-family: monospace;">${data.consumerNumber || 'To be updated'}</strong></td>
            <td style="color: #64748b;">National Portal PM Surya Ghar DBT Synchronized</td>
          </tr>
          <tr>
            <td><strong>Sanctioned Load vs Plant</strong></td>
            <td>${data.sanctionedLoad || cap} kW (${data.phase || 'Single Phase'})</td>
            <td style="color: #059669; font-weight: 600;">${cap <= (data.sanctionedLoad || 5) ? 'Within sanctioned capacity' : 'Load enhancement recommended'}</td>
          </tr>
          <tr>
            <td><strong>Rooftop Space & Orientation</strong></td>
            <td>${data.roofType || 'RCC Flat Roof'} (~${data.roofAreaSqFt || Math.round(cap * 65)} sq.ft.)</td>
            <td>True South, 15° optimal pitch, 100% shadow-free</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${renderPageFooter()}
  </div>
  ` : ''}

  <!-- ========================================================================= -->
  <!-- PAGE 3: YOUR SOLAR SYSTEM (APPLE-STYLE HARDWARE SHOWCASE)                 -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Your Solar System & Hardware', '02')}

      <span class="section-kicker">Industrial-Grade Engineering</span>
      <h2 class="section-title">Masterfully Integrated. Crafted for 25-Year Reliability.</h2>
      <p class="section-subtitle">Tier-1 ALMM certified power generation components engineered to withstand harsh weather conditions.</p>

      <div class="grid-2">
        <!-- MODULES -->
        <div class="card-white">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 7pt; font-weight: 800; color: #c5a059; text-transform: uppercase;">Solar PV Modules</span>
            <span style="font-size: 6.8pt; font-weight: 800; color: #065f46; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">ALMM Tier-1</span>
          </div>
          <div style="font-size: 11pt; font-weight: 900; color: #071c11; font-family: 'Manrope', sans-serif; margin-bottom: 4px;">
            ${data.panelBrand || 'Waaree'} ${panelWatt}Wp Bifacial
          </div>
          <div style="font-size: 7.5pt; color: #64748b; line-height: 1.4; margin-bottom: 8px;">
            ${panelQty} N-type TopCon Bifacial solar modules with dual-glass architecture generating up to +15% rear gain from rooftop albedo.
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 6px; display: flex; justify-content: space-between; font-size: 7.2pt;">
            <span style="color: #94a3b8;">Warranty:</span>
            <strong style="color: #071c11;">${data.warranties?.modules || '25 Years Linear Performance'}</strong>
          </div>
        </div>

        <!-- INVERTER -->
        <div class="card-white">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 7pt; font-weight: 800; color: #c5a059; text-transform: uppercase;">Grid Inverter</span>
            <span style="font-size: 6.8pt; font-weight: 800; color: #1e40af; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">IP65 Rated</span>
          </div>
          <div style="font-size: 11pt; font-weight: 900; color: #071c11; font-family: 'Manrope', sans-serif; margin-bottom: 4px;">
            ${data.inverterBrand || 'Growatt'} ${invCap} kW Dual-MPPT
          </div>
          <div style="font-size: 7.5pt; color: #64748b; line-height: 1.4; margin-bottom: 8px;">
            98.6% European efficiency, dual independent MPPT channels, and cloud telemetry for real-time mobile app yield monitoring.
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 6px; display: flex; justify-content: space-between; font-size: 7.2pt;">
            <span style="color: #94a3b8;">Warranty:</span>
            <strong style="color: #071c11;">${data.warranties?.inverter || '10 Years Replacement'}</strong>
          </div>
        </div>

        <!-- BATTERY OR STRUCTURE -->
        ${isHybridOrOffgrid ? `
        <div class="card-white" style="border-color: rgba(197, 160, 89, 0.4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 7pt; font-weight: 800; color: #b45309; text-transform: uppercase;">Lithium Battery Storage</span>
            <span style="font-size: 6.8pt; font-weight: 800; color: #92400e; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">LiFePO4 Chemistry</span>
          </div>
          <div style="font-size: 11pt; font-weight: 900; color: #071c11; font-family: 'Manrope', sans-serif; margin-bottom: 4px;">
            ${data.batteryBrand || 'Tata Power'} ${data.batteryCapacity || 5} kWh Rack
          </div>
          <div style="font-size: 7.5pt; color: #64748b; line-height: 1.4; margin-bottom: 8px;">
            High-safety lithium iron phosphate chemistry supporting ${data.backupLoadWatts || 3000}W of critical household circuits during blackouts.
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 6px; display: flex; justify-content: space-between; font-size: 7.2pt;">
            <span style="color: #94a3b8;">Cycle Life:</span>
            <strong style="color: #071c11;">${data.warranties?.battery || '10 Years / 6000 Cycles'}</strong>
          </div>
        </div>
        ` : `
        <div class="card-white">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 7pt; font-weight: 800; color: #c5a059; text-transform: uppercase;">Mounting Structure</span>
            <span style="font-size: 6.8pt; font-weight: 800; color: #334155; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">150 km/h Wind Rated</span>
          </div>
          <div style="font-size: 11pt; font-weight: 900; color: #071c11; font-family: 'Manrope', sans-serif; margin-bottom: 4px;">
            ${data.structureBrand || 'Galvanized HDG High Rise'}
          </div>
          <div style="font-size: 7.5pt; color: #64748b; line-height: 1.4; margin-bottom: 8px;">
            Heavy-duty hot-dip galvanized steel (80µm zinc coat) engineered to withstand cyclone-grade 150 km/h wind shear.
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 6px; display: flex; justify-content: space-between; font-size: 7.2pt;">
            <span style="color: #94a3b8;">Warranty:</span>
            <strong style="color: #071c11;">${data.warranties?.structure || '10 Years Structural'}</strong>
          </div>
        </div>
        `}

        <!-- BALANCE OF SYSTEM -->
        <div class="card-white">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 7pt; font-weight: 800; color: #c5a059; text-transform: uppercase;">Balance of System (BOS)</span>
            <span style="font-size: 6.8pt; font-weight: 800; color: #065f46; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">MNRE Standard</span>
          </div>
          <div style="font-size: 11pt; font-weight: 900; color: #071c11; font-family: 'Manrope', sans-serif; margin-bottom: 4px;">
            Polycab Cables & Type-II SPD
          </div>
          <div style="font-size: 7.5pt; color: #64748b; line-height: 1.4; margin-bottom: 8px;">
            TUV-certified 4 sq.mm UV XLPE DC cable, IP65 ACDB/DCDB enclosures, and dual chemical copper-bonded earthing with lightning arrester.
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 6px; display: flex; justify-content: space-between; font-size: 7.2pt;">
            <span style="color: #94a3b8;">Protection:</span>
            <strong style="color: #071c11;">Lightning & Surge Certified</strong>
          </div>
        </div>
      </div>
    </div>

    ${renderPageFooter()}
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 4: ENERGY & SAVINGS (FINANCIAL INFOGRAPHICS)                         -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Energy Yield & 25-Year Wealth', '03')}

      <span class="section-kicker">Financial Engineering</span>
      <h2 class="section-title">A Compounding Asset, Not An Expense.</h2>
      <p class="section-subtitle">25-year compounding wealth generation and payback analysis against grid tariff inflation.</p>

      <!-- MONTHLY CHART -->
      <div class="chart-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div>
            <span style="font-size: 6.8pt; font-weight: 800; color: #c5a059; text-transform: uppercase; letter-spacing: 1px;">Yield Profile</span>
            <div style="font-size: 8.5pt; font-weight: 800; color: #071c11;">Monthly Solar Generation Curve (kWh)</div>
          </div>
          <div style="font-size: 7.2pt; font-weight: 700; color: #c5a059;">Peak Month: May (${Math.round(cap * 155)} kWh)</div>
        </div>
        <div class="bars-row">
          ${months.map(d => {
            const h = Math.round((d.gen / maxGen) * 100);
            return `
              <div class="bar-col">
                <span style="font-size: 6.2pt; font-family: monospace; font-weight: bold; margin-bottom: 2px;">${d.gen}</span>
                <div class="bar-fill ${d.peak ? 'bar-fill-peak' : ''}" style="height: ${h}%;"></div>
                <span style="font-size: 6.5pt; color: #64748b; margin-top: 3px; font-weight: 600;">${d.m}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 3 KPIS -->
      <div class="grid-3">
        <div class="card-white" style="text-align: center;">
          <div class="kpi-title" style="color: #059669;">Year 1 Net Savings</div>
          <div class="kpi-val" style="color: #065f46;">₹${formatINR(annualSavings)}</div>
          <div style="font-size: 7.2pt; color: #64748b; font-family: monospace;">~₹${formatINR(monthlySavings)} / mo</div>
        </div>

        <div class="card-dark" style="text-align: center;">
          <div class="kpi-title" style="color: #c5a059;">Break-Even Payback</div>
          <div class="kpi-val" style="color: #dfbf78;">${payback} Years</div>
          <div style="font-size: 7.2pt; color: #cbd5e1; font-family: monospace;">Return on net capital</div>
        </div>

        <div class="card-white" style="text-align: center;">
          <div class="kpi-title" style="color: #c5a059;">25-Yr Net Wealth</div>
          <div class="kpi-val">₹${formatINR(lifetimeSavings)}</div>
          <div style="font-size: 7.2pt; color: #64748b; font-family: monospace;">Compounding @ 3% tariff</div>
        </div>
      </div>

      <!-- 25-YEAR MILESTONE TABLE -->
      <table>
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Est. Yield</th>
            <th>Tariff Rate</th>
            <th>Annual Value</th>
            <th style="text-align: right;">Cumulative Net Savings</th>
          </tr>
        </thead>
        <tbody style="font-family: monospace;">
          <tr>
            <td><strong style="font-family: sans-serif;">Year 01</strong></td>
            <td>${annualUnits.toLocaleString()} kWh</td>
            <td>₹${tariff} / u</td>
            <td style="color: #059669; font-weight: bold;">₹${formatINR(annualSavings)}</td>
            <td style="text-align: right; font-weight: 900; color: #071c11;">₹${formatINR(annualSavings)}</td>
          </tr>
          <tr>
            <td><strong style="font-family: sans-serif;">Year 03</strong></td>
            <td>${Math.round(annualUnits * 0.98).toLocaleString()} kWh</td>
            <td>₹${(tariff * 1.06).toFixed(2)} / u</td>
            <td style="color: #059669; font-weight: bold;">₹${formatINR(annualSavings * 1.04)}</td>
            <td style="text-align: right; font-weight: 900; color: #071c11;">₹${formatINR(annualSavings * 3.08)}</td>
          </tr>
          <tr>
            <td><strong style="font-family: sans-serif;">Year 05 (Payback)</strong></td>
            <td>${Math.round(annualUnits * 0.96).toLocaleString()} kWh</td>
            <td>₹${(tariff * 1.12).toFixed(2)} / u</td>
            <td style="color: #059669; font-weight: bold;">₹${formatINR(annualSavings * 1.08)}</td>
            <td style="text-align: right; font-weight: 900; color: #071c11;">₹${formatINR(annualSavings * 5.3)}</td>
          </tr>
          <tr>
            <td><strong style="font-family: sans-serif;">Year 10</strong></td>
            <td>${Math.round(annualUnits * 0.93).toLocaleString()} kWh</td>
            <td>₹${(tariff * 1.30).toFixed(2)} / u</td>
            <td style="color: #059669; font-weight: bold;">₹${formatINR(annualSavings * 1.21)}</td>
            <td style="text-align: right; font-weight: 900; color: #071c11;">₹${formatINR(annualSavings * 11.5)}</td>
          </tr>
          <tr>
            <td><strong style="font-family: sans-serif;">Year 25</strong></td>
            <td>${Math.round(annualUnits * 0.84).toLocaleString()} kWh</td>
            <td>₹${(tariff * 2.03).toFixed(2)} / u</td>
            <td style="color: #059669; font-weight: bold;">₹${formatINR(annualSavings * 1.71)}</td>
            <td style="text-align: right; font-weight: 900; color: #071c11;">₹${formatINR(lifetimeSavings)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${renderPageFooter()}
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 5: YOUR INVESTMENT (COMMERCIAL BOQ & MILESTONES)                     -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Commercial Proposal & Investment', '04')}

      <span class="section-kicker">Transparent Commercials</span>
      <h2 class="section-title">Turnkey Investment Schedule With Milestone Security</h2>
      <p class="section-subtitle">Itemized bill of quantities with composite solar GST, central DBT subsidy, and milestone-linked security.</p>

      <!-- OVERSIZED INVESTMENT HERO -->
      <div style="background: linear-gradient(135deg, #071c11 0%, #0b2014 100%); color: #ffffff; padding: 16px 20px; border-radius: 14px; border: 1px solid rgba(197, 160, 89, 0.4); margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 7pt; font-weight: 800; color: #c5a059; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 2px;">
            Net Estimated Customer Investment
          </span>
          <div style="font-size: 26pt; font-weight: 900; font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.5px;">
            ₹${formatINR(net)}
          </div>
          <div style="font-size: 7.5pt; color: #cbd5e1; margin-top: 4px;">
            Gross Project Total: ₹${formatINR(gross)}
            ${subsidy > 0 ? ` • <strong style="color: #4ade80;">Less Central Subsidy: ₹${formatINR(subsidy)}</strong>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 7.5pt; font-weight: 800; background: rgba(197, 160, 89, 0.2); color: #dfbf78; border: 1px solid rgba(197, 160, 89, 0.4); text-transform: uppercase;">
            Fixed EPC Contract
          </span>
          <div style="font-size: 7pt; color: #94a3b8; margin-top: 4px; font-family: monospace;">Inclusive of 13.8% Solar GST</div>
        </div>
      </div>

      <!-- BOQ TABLE -->
      <table>
        <thead>
          <tr>
            <th style="width: 25px; text-align: center;">#</th>
            <th>Item & Description</th>
            <th style="width: 45px; text-align: center;">Qty</th>
            <th style="width: 45px; text-align: center;">Unit</th>
            <th style="width: 70px; text-align: right;">Rate (₹)</th>
            <th style="width: 50px; text-align: center;">GST</th>
            <th style="width: 85px; text-align: right;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${rawPricing.map((item, idx) => `
            <tr>
              <td style="text-align: center; color: #94a3b8; font-family: monospace;">${idx + 1}</td>
              <td><strong>${item.description}</strong></td>
              <td style="text-align: center; font-family: monospace;">${item.qty || 1}</td>
              <td style="text-align: center; color: #64748b;">${item.unit || 'LOT'}</td>
              <td style="text-align: right; font-family: monospace;">₹${formatINR(Number(item.rate || item.unit_price || 0))}</td>
              <td style="text-align: center; font-family: monospace;">${item.tax_rate || item.gstRate || 12}%</td>
              <td style="text-align: right; font-family: monospace; font-weight: 800; color: #071c11;">₹${formatINR(Number(item.amount || item.total || 0))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- WORDS & MILESTONES -->
      <div class="grid-2">
        <div>
          <div class="card-white" style="margin-bottom: 10px;">
            <div style="font-size: 7pt; font-weight: 800; color: #c5a059; text-transform: uppercase; margin-bottom: 2px;">Amount in Words</div>
            <div style="font-size: 7.8pt; font-weight: 800; color: #071c11; text-transform: uppercase; font-family: 'Manrope', sans-serif;">
              ${data.amountInWords || 'Indian Rupees Only'}
            </div>
          </div>

          ${data.bankDetails ? `
          <div class="card-white" style="font-size: 7.5pt;">
            <div style="font-size: 6.8pt; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Official EPC Bank Details</div>
            <div style="font-family: monospace; line-height: 1.4;">
              Beneficiary: <strong>${data.bankDetails.account_name}</strong><br>
              Bank: ${data.bankDetails.bank_name} | A/C: <strong>${data.bankDetails.account_number}</strong><br>
              IFSC: <strong style="color: #c5a059;">${data.bankDetails.ifsc}</strong>
            </div>
          </div>
          ` : ''}
        </div>

        <div class="card-white">
          <div style="font-size: 7.2pt; font-weight: 800; color: #071c11; text-transform: uppercase; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>Payment Milestones</span>
            <span style="color: #64748b;">100% Milestone Linked</span>
          </div>
          <div style="font-size: 7.5pt; line-height: 1.4;">
            ${rawMilestones.map((m, idx) => `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
                <div>
                  <strong style="color: #c5a059;">Stage 0${idx + 1}:</strong> ${m.description}
                </div>
                <div style="text-align: right; font-family: monospace; font-weight: 800; white-space: nowrap; margin-left: 8px;">
                  ${m.percentage}% (₹${formatINR(m.amount)})
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    ${renderPageFooter()}
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 6: INSTALLATION ROADMAP, WARRANTIES & ACCEPTANCE                     -->
  <!-- ========================================================================= -->
  <div class="a4-page">
    <div>
      ${renderPageHeader('Roadmap, Warranties & Acceptance', '05')}

      <span class="section-kicker">Execution Guarantee</span>
      <h2 class="section-title">From Engineering Survey to Solar Power in 21 Days</h2>
      <p class="section-subtitle">Structured 5-phase execution methodology guaranteeing safe installation and seamless net-meter commissioning.</p>

      <!-- 5-PHASE ROADMAP -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 14px;">
        <div class="card-white" style="padding: 8px;">
          <div style="font-size: 11pt; font-weight: 900; color: #c5a059; font-family: monospace;">01</div>
          <div style="font-size: 7.5pt; font-weight: 800; color: #071c11;">Site Survey</div>
          <div style="font-size: 6.8pt; color: #64748b; margin-top: 2px;">Days 1–3: Shadow analysis & SLD</div>
        </div>
        <div class="card-white" style="padding: 8px;">
          <div style="font-size: 11pt; font-weight: 900; color: #c5a059; font-family: monospace;">02</div>
          <div style="font-size: 7.5pt; font-weight: 800; color: #071c11;">DISCOM</div>
          <div style="font-size: 6.8pt; color: #64748b; margin-top: 2px;">Days 4–8: Net-meter sanction</div>
        </div>
        <div class="card-white" style="padding: 8px;">
          <div style="font-size: 11pt; font-weight: 900; color: #c5a059; font-family: monospace;">03</div>
          <div style="font-size: 7.5pt; font-weight: 800; color: #071c11;">Structure</div>
          <div style="font-size: 6.8pt; color: #64748b; margin-top: 2px;">Days 9–14: HDG erection & PV</div>
        </div>
        <div class="card-white" style="padding: 8px;">
          <div style="font-size: 11pt; font-weight: 900; color: #c5a059; font-family: monospace;">04</div>
          <div style="font-size: 7.5pt; font-weight: 800; color: #071c11;">Electrical</div>
          <div style="font-size: 6.8pt; color: #64748b; margin-top: 2px;">Days 15–18: Inverter & BOS</div>
        </div>
        <div class="card-white" style="padding: 8px;">
          <div style="font-size: 11pt; font-weight: 900; color: #059669; font-family: monospace;">05</div>
          <div style="font-size: 7.5pt; font-weight: 800; color: #071c11;">Handover</div>
          <div style="font-size: 6.8pt; color: #64748b; margin-top: 2px;">Days 19–21: Net-meter sync</div>
        </div>
      </div>

      <!-- WARRANTIES -->
      <div class="grid-4" style="margin-bottom: 14px;">
        <div class="card-white" style="text-align: center; padding: 10px;">
          <div class="kpi-title">Modules</div>
          <div style="font-size: 11pt; font-weight: 900; color: #071c11; font-family: 'Space Grotesk', sans-serif;">25 Years</div>
          <div style="font-size: 6.8pt; color: #64748b;">Linear Output</div>
        </div>
        <div class="card-white" style="text-align: center; padding: 10px;">
          <div class="kpi-title">Inverter</div>
          <div style="font-size: 11pt; font-weight: 900; color: #071c11; font-family: 'Space Grotesk', sans-serif;">10 Years</div>
          <div style="font-size: 6.8pt; color: #64748b;">Replacement</div>
        </div>
        <div class="card-white" style="text-align: center; padding: 10px;">
          <div class="kpi-title">Structure</div>
          <div style="font-size: 11pt; font-weight: 900; color: #071c11; font-family: 'Space Grotesk', sans-serif;">10 Years</div>
          <div style="font-size: 6.8pt; color: #64748b;">150 km/h Wind</div>
        </div>
        <div class="card-white" style="text-align: center; padding: 10px;">
          <div class="kpi-title">Workmanship</div>
          <div style="font-size: 11pt; font-weight: 900; color: #059669; font-family: 'Space Grotesk', sans-serif;">5 Years</div>
          <div style="font-size: 6.8pt; color: #64748b;">Comprehensive</div>
        </div>
      </div>

      <!-- DECLARATION -->
      <div class="card-white" style="font-size: 7.5pt; line-height: 1.45; margin-bottom: 14px;">
        I/We, <strong>${data.customerName}</strong>, confirm acceptance of Proposal <strong>#${data.quotationNumber}</strong> for the turnkey installation of a <strong>${cap} kWp ${data.systemType || 'On-grid'} Solar Rooftop Power Plant</strong> for the total contract sum of <strong>₹${formatINR(gross)} (${data.amountInWords || 'Indian Rupees Only'})</strong>. Authorizes ${data.companyName} to execute statutory State DISCOM net metering applications and engineering procurement.
      </div>

      <!-- DUAL SIGNATURE BOXES -->
      <div class="grid-2">
        <div style="border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 12px; background: #ffffff; height: 95px; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="font-size: 7.2pt; font-weight: 800; color: #64748b; text-transform: uppercase;">Accepted By Customer: ${data.customerName}</div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between; font-size: 7pt; color: #64748b;">
            <span>Client Signature: ____________</span>
            <span>Date: ___ / ___ / 2026</span>
          </div>
        </div>

        <div style="border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 12px; background: #ffffff; height: 95px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
          <div style="font-size: 7.2pt; font-weight: 800; color: #071c11; text-transform: uppercase;">For ${data.companyLegalName || data.companyName}</div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 7pt; font-style: italic; color: #94a3b8; font-family: monospace;">
              ${data.signatureUrl ? `<img src="${data.signatureUrl}" style="height: 28px; object-fit: contain;" />` : '[Authorized Signature]'}
            </div>
            ${data.companyStampUrl ? `<img src="${data.companyStampUrl}" style="height: 32px; object-fit: contain; opacity: 0.8;" />` : ''}
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between; font-size: 7pt; color: #64748b;">
            <span>${data.signatoryName || 'Authorized Signatory'}</span>
            <span>Date: ${data.quotationDate}</span>
          </div>
        </div>
      </div>
    </div>

    ${renderPageFooter()}
  </div>

</body>
</html>
  `;
}

/**
 * Universal Mobile Quotation PDF Generator & Sharer using Expo Print & Sharing
 */
export async function generateQuotationPdf(data: QuotationPdfProps): Promise<string> {
  try {
    const html = generateQuotationHtml(data);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    return uri;
  } catch (error: any) {
    console.error('Error generating Quotation PDF:', error);
    Alert.alert('PDF Generation Error', error?.message || 'Could not generate proposal PDF');
    throw error;
  }
}

export function formatIndianCurrency(num: number): string {
  if (isNaN(num) || num === undefined || num === null) return '0';
  return Math.round(num).toLocaleString('en-IN');
}

/**
 * Universal Mobile Document Preview
 */
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
          const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
          const previewFileUri = `${docDir}Quotation_Preview.pdf`;
          if ((FileSystem as any).writeAsStringAsync) {
            await (FileSystem as any).writeAsStringAsync(previewFileUri, base64, {
              encoding: 'base64',
            });
            shareUri = previewFileUri;
          }
        } catch (writeErr) {
          console.warn('Preview writeAsStringAsync error:', writeErr);
        }
      }

      const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
      if (isAvailable) {
        await Sharing.shareAsync(shareUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'View / Save Document PDF',
        });
        return true;
      }
    } catch (fallbackErr) {
      console.error('PDF Preview fallback failed:', fallbackErr);
    }
    Alert.alert('Preview Notice', err?.message || 'Could not launch document preview');
    return false;
  }
}

/**
 * Universal Mobile Document Printer
 */
export async function printDirectly(html: string): Promise<void> {
  try {
    await Print.printAsync({ html });
  } catch (err: any) {
    Alert.alert('Print Error', err?.message || 'Failed to send document to printer');
  }
}

/**
 * Share PDF file or HTML directly through native sheet or WhatsApp
 */
export async function sharePdfFile(
  htmlOrUri: string,
  fileNameOrCustomer?: string,
  customerPhone?: string
): Promise<string | null> {
  try {
    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (!isAvailable) {
      Alert.alert('Sharing Unavailable', 'Native file sharing is not supported on this device.');
      return null;
    }

    let fileUri = htmlOrUri;
    const isHtml = htmlOrUri.trim().startsWith('<') || htmlOrUri.includes('<!DOCTYPE') || htmlOrUri.includes('<html>');

    if (isHtml) {
      const { uri, base64 } = await Print.printToFileAsync({ html: htmlOrUri, base64: true });
      fileUri = uri;
      const cleanName = (fileNameOrCustomer || 'Solar_Document').replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const targetUri = `${FileSystem.documentDirectory || ''}${cleanName}.pdf`;
      try {
        if (base64 && (FileSystem as any).writeAsStringAsync) {
          await (FileSystem as any).writeAsStringAsync(targetUri, base64, { encoding: 'base64' });
          fileUri = targetUri;
        } else {
          await FileSystem.copyAsync({ from: uri, to: targetUri });
          fileUri = targetUri;
        }
      } catch {
        fileUri = uri;
      }
    } else {
      const cleanName = (fileNameOrCustomer || 'Solar_Proposal').replace(/[^a-zA-Z0-9_-]/g, '_');
      const targetUri = `${FileSystem.documentDirectory || ''}${cleanName}_Quotation.pdf`;
      try {
        await FileSystem.copyAsync({ from: fileUri, to: targetUri });
        fileUri = targetUri;
      } catch {
        // use fileUri
      }
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Document for ${fileNameOrCustomer || 'Valued Customer'}`,
      UTI: 'com.adobe.pdf',
    });
    return fileUri;
  } catch (err: any) {
    console.error('PDF sharing error:', err);
    Alert.alert('Sharing Error', err?.message || 'Failed to share proposal PDF.');
    return null;
  }
}

export const createAndSharePdf = sharePdfFile;
export const sharePdfToWhatsApp = sharePdfFile;

/**
 * DISCOM Net Metering Statutory Documents Generator
 */
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
  terms?: string | string[];
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
  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertThreeDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertThreeDigits(thousand) + ' Thousand ';
  if (hundreds > 0) words += convertThreeDigits(hundreds);

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

  <!-- SCOPE BANNER -->
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
        <td class="totals-label" style="font-weight: 900; font-size: 10pt; color: #0f172a;">Balance Payable</td>
        <td class="totals-val" style="font-weight: 900; font-size: 11pt; color: ${isPaid ? '#059669' : '#e11d48'};">
          ₹${formatInr(data.balanceDue)}
        </td>
      </tr>
    </table>
  </div>

  <div class="words-box">
    <strong>Total Invoice Amount in Words:</strong> ${amountInWords}
  </div>

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
