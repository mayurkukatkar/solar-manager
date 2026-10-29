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
        { item: 'PM Surya Ghar Muft Bijli Yojana National Portal Subsidy Processing & DBT Filing', status: 'INCLUDED' },
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

    /* EDITORIAL PHOTOGRAPHY BANNERS */
    .editorial-banner {
      width: 100%;
      height: 105px;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 14px;
      position: relative;
      border: 1px solid rgba(7, 28, 17, 0.1);
      background: #faf8f5;
    }
    .editorial-banner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .editorial-banner-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px 12px;
      background: linear-gradient(180deg, rgba(7,28,17,0) 0%, rgba(7,28,17,0.88) 100%);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      color: #ffffff;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- PAGE 1: CINEMATIC COVER PAGE                                              -->
  <!-- ========================================================================= -->
  <div class="a4-page cover-page" style="overflow: hidden;">
    <!-- BACKGROUND LUXURY ROOFTOP PHOTO -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;">
      <img src="${data.coverImageUrl || 'http://localhost:3000/assets/solar-quotation/luxury-villa-cover.jpg'}" style="width: 100%; height: 100%; object-fit: cover;" alt="Villa" />
      <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7, 28, 17, 0.45) 0%, rgba(7, 28, 17, 0.72) 40%, rgba(7, 28, 17, 0.96) 80%, #071c11 100%);"></div>
    </div>

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

      <!-- AERIAL DRONE AUDIT BANNER -->
      <div class="editorial-banner">
        <img src="http://localhost:3000/assets/solar-quotation/audit-drone.jpg" alt="Drone Solar Audit" />
        <div class="editorial-banner-overlay">
          <div>
            <div style="font-size: 6.5pt; font-weight: 800; color: #dfbf78; text-transform: uppercase; letter-spacing: 1px;">Digital Solar Shadow & Irradiance Analysis</div>
            <div style="font-size: 8pt; font-weight: 700; color: #ffffff;">Optimal 15° South-Facing Orientation • 100% Shadow-Free Solar Access</div>
          </div>
          <span style="font-size: 6.5pt; font-weight: 900; background: #c5a059; color: #071c11; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Audit Verified</span>
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
            <td style="color: #64748b;">National Portal PM Surya Ghar Muft Bijli Yojana DBT Synchronized</td>
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

      <!-- STUDIO HARDWARE BANNER -->
      <div class="editorial-banner" style="height: 110px;">
        <img src="http://localhost:3000/assets/solar-quotation/hardware-studio.jpg" alt="Industrial Hardware" />
        <div class="editorial-banner-overlay">
          <div>
            <div style="font-size: 6.5pt; font-weight: 800; color: #dfbf78; text-transform: uppercase; letter-spacing: 1px;">Industrial-Grade Hardware</div>
            <div style="font-size: 8pt; font-weight: 700; color: #ffffff;">Integrated ALMM N-Type TopCon & Dual-MPPT Inverter Architecture</div>
          </div>
          <span style="font-size: 6.5pt; font-weight: 900; background: #059669; color: #ffffff; padding: 2px 8px; border-radius: 10px; text-transform: uppercase;">Tier-1 Standard</span>
        </div>
      </div>

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

    <!-- SUSTAINABLE LIFESTYLE & ENVIRONMENTAL CARD -->
    <div style="border-radius: 12px; border: 1px solid rgba(7,28,17,0.1); overflow: hidden; background: #ffffff; display: flex; margin-bottom: 14px; height: 95px;">
      <div style="width: 38%; position: relative; overflow: hidden;">
        <img src="http://localhost:3000/assets/solar-quotation/sustainable-home.jpg" style="width: 100%; height: 100%; object-fit: cover;" alt="Sustainable Living" />
        <div style="position: absolute; top: 6px; left: 8px; background: rgba(7,28,17,0.85); color: #dfbf78; font-size: 6pt; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Clean Living</div>
      </div>
      <div style="width: 62%; background: linear-gradient(135deg, #071c11 0%, #0b2014 100%); color: #ffffff; padding: 10px 14px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <span style="font-size: 8pt; font-weight: 800; color: #ffffff;">Certified Environmental Leadership</span>
            <span style="font-size: 6.5pt; font-weight: 800; color: #dfbf78; text-transform: uppercase; letter-spacing: 0.8px;">100% Green</span>
          </div>
          <div style="font-size: 7pt; color: #cbd5e1; line-height: 1.35;">
            Eliminates fossil reliance and creates a permanent carbon offset legacy for your family.
          </div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; display: flex; justify-content: space-between; font-size: 7.2pt; color: #6ee7b7; font-family: monospace; font-weight: bold;">
          <span>🍃 ${data.co2ReductionKg || Math.round(cap * 32)} Tons CO₂ Avoided</span>
          <span>🌳 ~${data.treeEquivalent || Math.round(cap * 48)} Trees Planted</span>
        </div>
      </div>
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
            ${subsidy > 0 ? ` • <strong style="color: #4ade80;">Less Central Subsidy (PM Surya Ghar Muft Bijli Yojana): ₹${formatINR(subsidy)}</strong>` : ''}
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

      <!-- ENGINEERING CRAFTSMANSHIP BANNER -->
      <div class="editorial-banner" style="height: 105px;">
        <img src="http://localhost:3000/assets/solar-quotation/craftsmanship.jpg" alt="Engineering Craftsmanship" />
        <div class="editorial-banner-overlay">
          <div>
            <div style="font-size: 6.5pt; font-weight: 800; color: #dfbf78; text-transform: uppercase; letter-spacing: 1px;">Certified EPC Engineering Protocol</div>
            <div style="font-size: 8pt; font-weight: 700; color: #ffffff;">Strict Adherence to IEC 62548, IS 3043 & CEIG Statutory Electrical Safety Norms</div>
          </div>
          <span style="font-size: 6.5pt; font-weight: 900; background: #059669; color: #ffffff; padding: 2px 8px; border-radius: 10px; text-transform: uppercase;">Zero Incident Certified</span>
        </div>
      </div>

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
 * Indian Rupee to Words Converter (Ported from web MsedclFormsPDF.tsx)
 */
export function toIndianWords(num: number): string {
  if (!num || isNaN(num)) return 'ZERO ONLY';
  const a = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convertTens(n: number): string {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  }

  function convertHundreds(n: number): string {
    if (n > 99) {
      return a[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + convertTens(n % 100) : '');
    }
    return convertTens(n);
  }

  let n = Math.round(num);
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

  return (str.trim() + ' ONLY').toUpperCase();
}

/**
 * Official MSEDCL DISCOM Statutory Documents Generator
 * Ported directly from web-client (MsedclFormsPDF.tsx) for 100% template parity.
 * Supports:
 * - WCR_FULL (Work Completion Report Pack - 3-Page Dossier)
 * - WCR (WCR Page 1 - Work Completion Report)
 * - AnnexureI / COMMISSIONING (Annexure - I Commissioning Certificate)
 * - DCR (Annexure - A DCR & Module Serials Undertaking)
 * - NetMetering / ANNEXURE_3 (Annexure - 3 Net Metering Connection Agreement - 6 Pages under MERC 2019)
 * - ConsumerVendor / ANNEXURE_2 (Annexure 2 PM Surya Ghar Model Agreement - 3 Pages)
 * - StandardQuotation (Official Standard 1-Page Quotation with BOQ)
 * - Guarantee (Guarantee Certificate Undertaking for 5-Year CMC)
 * - FORM_A1 (MSEDCL Form A-1 Interconnection Application)
 */
export function generateDiscomHtml(type: string, data: any, options: { includeStamp?: boolean } = {}): string {
  const beneficiaryName = (data.beneficiaryName || data.customerName || 'BENEFICIARY NAME').toUpperCase();
  const consumerNo = data.consumerNumber || data.consumerAccountNo || 'NOT SPECIFIED';
  const bu = data.bu || data.billingUnit || '';
  const appRef = data.applicationRefNo || data.nationalPortalAppNo || 'PENDING PORTAL REF';
  const appDate = data.applicationDate || data.quotationDate || new Date().toLocaleDateString('en-IN');
  const commDate = data.commissioningDate || new Date().toLocaleDateString('en-IN');
  const mobile = data.mobileNo || data.mobile || data.customerMobile || data.customerPhone || '';
  const email = data.email || data.customerEmail || '';
  const category = data.category || 'Residential';
  const address = (data.address || data.installationAddress || 'SITE ADDRESS PENDING').toUpperCase();
  const district = (data.district || data.city || '').toUpperCase();
  const city = (data.city || data.district || '').toUpperCase();
  const state = (data.state || 'MAHARASHTRA').toUpperCase();
  const pincode = data.pincode || '';

  const sanctionedLoad = data.sanctionedLoad ? Number(data.sanctionedLoad).toFixed(3) : '1.000';
  const appliedCap = data.appliedCapacity ? Number(data.appliedCapacity).toFixed(3) : Number(data.capacity || data.systemCapacityKw || 3.3).toFixed(3);
  const installedCap = data.installedCapacity ? Number(data.installedCapacity).toFixed(3) : (Number(appliedCap) * 0.97).toFixed(3);
  const moduleQty = Number(data.moduleQuantity || Math.ceil((Number(appliedCap) * 1000) / (data.moduleWattage || 535)));
  const moduleWatt = Number(data.moduleWattage || 535);
  const moduleMake = (data.moduleMake || data.panelBrand || 'ALMM Approved PV Modules').toUpperCase();
  const moduleMfr = (data.moduleManufacturer || data.cellManufacturer || data.moduleMake || 'ALMM / DCR Compliant Manufacturer').toUpperCase();
  const cellMfr = (data.cellManufacturer || 'ALMM / DCR Compliant').toUpperCase();
  const inverterCap = data.inverterCapacity || appliedCap;
  const inverterMake = data.inverterMake || data.inverterBrand || 'Grid-Tied Solar Inverter';
  const inverterBrand = data.inverterBrand || data.inverterMake || 'Grid-Tied Solar Inverter';
  const inverterQty = data.inverterQuantity || 1;
  const phase = data.phase || (Number(appliedCap) > 5 ? 'Three Phase' : 'Single Phase');
  const structureBrand = data.structureBrand || 'GI Structure';
  const earthing = data.earthingProtection || 'Separate AC, DC & LA Earthing provided as per MNRE standards';
  const vendorName = (data.vendorName || data.companyName || 'REGISTERED SOLAR EPC VENDOR').toUpperCase();
  const vendorAddress = (data.vendorAddress || data.companyAddress || '').toUpperCase();
  const vendorCity = (data.vendorCity || city || '').toUpperCase();
  const vendorState = (data.vendorState || state || '').toUpperCase();
  const vendorPincode = data.vendorPincode || '';
  const gstin = data.gstin || '';
  const subDivision = (data.subDivision || (district ? `${district} S/DN` : 'SUB-DIVISION')).toUpperCase();
  const witness1 = (data.witness1 || beneficiaryName).toUpperCase();
  const witness2 = (data.witness2 || 'AUTHORISED SIGNATORY').toUpperCase();
  const quotationNumber = data.quotationNumber || `QUOT/${new Date().getFullYear()}/${data.projectNumber || '001'}`;
  const quotationDate = data.quotationDate || new Date().toLocaleDateString('en-IN');
  const totalAmount = Number(data.total || data.grand_total || data.estimatedValue || 0);
  const totalInWords = data.amount_in_words_custom || (totalAmount > 0 ? toIndianWords(totalAmount) : 'ZERO RUPEES ONLY');

  // Agreement dates
  const day = data.agreementDay || String(new Date().getDate()).padStart(2, '0');
  const month = (data.agreementMonth || new Date().toLocaleString('default', { month: 'short' })).toUpperCase();
  const year = data.agreementYear || String(new Date().getFullYear());
  const location = (data.agreementCity || city || 'SITE LOCATION').toUpperCase();

  // Stamp paper toggle
  const includeStamp = options.includeStamp !== undefined ? options.includeStamp : (data.includeStampGraphic ?? data.includeStamp ?? true);

  // Module serial numbers (strictly from scanned hardware barcodes, no fake auto-generation)
  const serials: string[] = Array.isArray(data.moduleSerialNumbers) ? data.moduleSerialNumbers : [];

  // Base CSS for MSEDCL Statutory Forms
  const baseStyles = `
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
      font-size: 11.5px;
      line-height: 1.45;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 14mm 16mm;
      box-sizing: border-box;
      position: relative;
      background: #ffffff;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .page:last-child { page-break-after: avoid; break-after: avoid; }
    .doc-header { text-align: center; margin-bottom: 20px; }
    .doc-org { font-size: 13.5px; font-weight: bold; text-transform: uppercase; color: #000; letter-spacing: 0.3px; margin: 0 0 4px 0; }
    .doc-title { font-size: 12.5px; font-weight: bold; text-transform: uppercase; color: #000; margin: 0; }
    .doc-sub { font-size: 10px; color: #475569; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
    th, td { border: 1px solid #000000; padding: 6px 8px; vertical-align: middle; }
    th { background: #f3f4f6; font-weight: bold; text-align: left; font-size: 11.5px; }
    .section-head { background: #f3f4f6; font-weight: bold; font-size: 11.5px; }
    .sign-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 32px; text-align: center; font-size: 10.5px; }
    .sign-box { border-top: 1px solid #000; padding-top: 4px; font-weight: bold; }
    .sign-space { height: 48px; display: flex; align-items: center; justify-content: center; }
  `;

  // Stamp Paper Header Helper
  const renderStampPaper = () => {
    if (!includeStamp) {
      return `
        <div style="width: 100%; height: 115mm; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 2px dashed #94a3b8; margin-bottom: 24px; text-align: center; color: #64748b; font-family: sans-serif; padding: 16px; box-sizing: border-box;">
          <p style="font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; margin: 0; color: #475569;">Reserved For Physical ₹100 Non-Judicial Stamp Paper</p>
          <p style="font-size: 9.5px; margin: 4px 0 0 0;">Feed pre-purchased ₹100 stamp paper into printer tray. Content will print below this margin.</p>
        </div>
      `;
    }

    return `
      <div style="width: 100%; margin-bottom: 20px; font-family: serif;">
        <div style="border: 4px double #8b1e42; padding: 10px; border-radius: 4px; background: linear-gradient(135deg, #fbf4f6 0%, #f7e6eb 50%, #fbf4f6 100%);">
          <div style="border: 1px solid #aa3355; padding: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; color: #8b1e42; font-weight: bold;">
              <div style="text-align: left;">
                <div style="font-size: 13px;">एक सौ रुपये</div>
                <div style="font-size: 22px; font-weight: 900; line-height: 1; margin-top: 2px;">रु. 100</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 16px; font-weight: 800; letter-spacing: 1px; color: #7a1232;">भारतीय गैर न्यायिक</div>
                <div style="font-size: 9px; font-family: sans-serif; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; color: #a83250;">India Non Judicial</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 13px;">Rs. 100</div>
                <div style="font-size: 13px; font-weight: 900; line-height: 1; margin-top: 2px;">ONE HUNDRED RUPEES</div>
              </div>
            </div>
            <div style="text-align: center; margin: 6px 0;">
              <div style="display: inline-block; padding: 3px 8px; border: 1px solid #8b1e42; border-radius: 2px; background: rgba(255,255,255,0.85); font-size: 7px; font-weight: bold; color: #8b1e42; letter-spacing: 1px;">
                सत्यमेव जयते
              </div>
            </div>
            <div style="text-align: center; margin-top: 2px;">
              <div style="font-size: 24px; font-weight: 900; letter-spacing: 0.2em; color: #8b1e42; line-height: 1.1;">भारत INDIA</div>
              <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #7a1232; font-family: sans-serif; margin-top: 2px;">INDIA NON JUDICIAL</div>
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 12px; font-size: 10.5px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #cbd5e1; font-family: sans-serif; margin-top: 4px;">
          <div><span>महाराष्ट्र </span><span style="letter-spacing: 1px;">MAHARASHTRA</span></div>
          <div style="font-family: monospace; font-size: 11px;">● ${year} ●</div>
          <div style="text-align: right;">
            <span style="font-size: 9.5px; color: #475569; text-transform: uppercase; margin-right: 8px;">${location} TREASURY</span>
            <span style="font-family: monospace; color: #581c87; font-weight: 800;">55AB 416416</span>
          </div>
        </div>
      </div>
    `;
  };

  // 1. WORK COMPLETION REPORT (WCR)
  const renderWcrHtml = () => `
    <div class="page">
      <div>
        <div class="doc-header">
          <div class="doc-org">MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD. (MSEDCL)</div>
          <div class="doc-title">WORK COMPLETION REPORT (WCR) FOR GRID-CONNECTED SOLAR PV SYSTEM</div>
        </div>

        <table>
          <thead>
            <tr class="section-head"><th colspan="2">1. Beneficiary Details</th></tr>
          </thead>
          <tbody>
            <tr><td style="width: 35%; font-weight: bold;">Beneficiary Name</td><td style="font-weight: bold;">${beneficiaryName}</td></tr>
            <tr><td style="font-weight: bold;">Application Ref. No. & Date</td><td>${appRef} / ${appDate}</td></tr>
            <tr><td style="font-weight: bold;">Consumer Account No.</td><td style="font-weight: bold;">${consumerNo}</td></tr>
            <tr><td style="font-weight: bold;">Mobile No. & Email</td><td>${mobile} | ${email}</td></tr>
            <tr><td style="font-weight: bold;">Category</td><td>${category}</td></tr>
            <tr><td style="font-weight: bold;">Installation Address</td><td>${address}, District: ${district}, State: ${state}, PIN Code: ${pincode}</td></tr>
          </tbody>
        </table>

        <table>
          <thead>
            <tr class="section-head"><th colspan="2">2. System Technical Specifications</th></tr>
          </thead>
          <tbody>
            <tr><td style="width: 35%; font-weight: bold;">Sanctioned Load</td><td>${sanctionedLoad} kW</td></tr>
            <tr><td style="font-weight: bold;">Applied Capacity</td><td style="font-weight: bold;">${appliedCap} kWp</td></tr>
            <tr><td style="font-weight: bold;">Total Solar Capacity Installed</td><td style="font-weight: bold;">${installedCap} kWp (${moduleQty} x ${moduleWatt} Wp) / ${appliedCap} kWp Applied</td></tr>
            <tr><td style="font-weight: bold;">System Type</td><td>Grid-Tied Rooftop Solar PV System</td></tr>
            <tr><td style="font-weight: bold;">PV Module Make & Rating</td><td>${moduleMake} / ${moduleMfr} (${moduleWatt} Wp - ${moduleQty} NOS)</td></tr>
            <tr><td style="font-weight: bold;">Solar Inverter Capacity</td><td>${inverterCap} kW ${inverterMake} Inverter</td></tr>
            <tr><td style="font-weight: bold;">Earthing & Protection</td><td>${earthing}</td></tr>
          </tbody>
        </table>


        <p style="text-align: justify; font-size: 11.5px; line-height: 1.5; margin: 16px 0;">
          Certified that the solar rooftop system of <strong>${appliedCap} kWp</strong> capacity has been installed, tested, and commissioned satisfactorily at the above-mentioned premise in accordance with MSEDCL and MNRE specifications.
        </p>
      </div>

      <div class="sign-grid">
        <div>
          <div class="sign-space"><span>${beneficiaryName.split(' ')[0]}</span></div>
          <div class="sign-box">(Signature of Consumer)<br><span style="font-size: 9.5px;">${beneficiaryName}</span></div>
        </div>
        <div>
          <div class="sign-space"><span style="border: 1px solid #1e40af; color: #1e40af; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 8.5px;">${vendorName}</span></div>
          <div class="sign-box">(Authorized Vendor)<br><span style="font-size: 9.5px;">${vendorName}</span></div>
        </div>
        <div>
          <div class="sign-space"><span style="border: 1px dashed #94a3b8; color: #94a3b8; padding: 4px 8px; font-size: 8px;">Official Seal</span></div>
          <div class="sign-box">(MSEDCL Officer)<br><span style="font-size: 9.5px;">Seal & Signature</span></div>
        </div>
      </div>
    </div>
  `;

  // 2. COMMISSIONING CERTIFICATE (ANNEXURE - I)
  const renderCommissioningHtml = () => `
    <div class="page">
      <div>
        <div class="doc-header">
          <div class="doc-org">ANNEXURE - I</div>
          <div class="doc-title">COMMISSIONING CERTIFICATE FOR GRID CONNECTED SOLAR ROOFTOP PV SYSTEM</div>
        </div>

        <p style="text-align: justify; line-height: 1.6; margin-bottom: 18px; font-size: 12px;">
          Certified that the Solar Power Plant of capacity <strong>${appliedCap} kWp</strong> installed at <strong>${address}, District: ${district}, State: ${state}, PIN Code: ${pincode}</strong> for <strong>${beneficiaryName}</strong> (Consumer No. <strong>${consumerNo}</strong>) is complete in all respects and ready for Grid Connection.
        </p>

        <div style="border: 1px solid #000; margin-bottom: 16px;">
          <div style="background: #f3f4f6; padding: 6px 10px; font-weight: bold; font-size: 11.5px; border-bottom: 1px solid #000;">System Technical Details</div>
          <div style="display: flex; font-size: 11px;">
            <div style="width: 50%; padding: 10px; border-right: 1px solid #000;">
              <p style="font-weight: bold; text-decoration: underline; margin: 0 0 6px 0;">Solar PV Array Details</p>
              <p style="margin: 3px 0;">• <strong>Capacity:</strong> ${appliedCap} kWp (Installed: ${installedCap} kWp)</p>
              <p style="margin: 3px 0;">• <strong>Make:</strong> ${moduleMake} (${moduleMfr})</p>
              <p style="margin: 3px 0;">• <strong>Module Rating:</strong> ${moduleWatt} Wp (${moduleQty} NOS)</p>
              <p style="margin: 3px 0;">• <strong>Sanctioned Load:</strong> ${sanctionedLoad} kW</p>
            </div>
            <div style="width: 50%; padding: 10px;">
              <p style="font-weight: bold; text-decoration: underline; margin: 0 0 6px 0;">Power Conditioning Unit (Inverter) Details</p>
              <p style="margin: 3px 0;">• <strong>Capacity:</strong> ${inverterCap} kW Grid-Tied</p>
              <p style="margin: 3px 0;">• <strong>Type:</strong> ${phase}</p>
              <p style="margin: 3px 0;">• <strong>Protections:</strong> IP65 / Anti-Islanding Embedded</p>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #000; margin-bottom: 20px;">
          <div style="background: #f3f4f6; padding: 6px 10px; font-weight: bold; font-size: 11.5px; border-bottom: 1px solid #000;">Metering & Earthing Details</div>
          <div style="display: flex; font-size: 11px;">
            <div style="width: 50%; padding: 10px; border-right: 1px solid #000;">
              <p style="margin: 0; line-height: 1.5;">• <strong>Metering Type:</strong> Bi-directional Net Meter & Solar Generation Meter</p>
            </div>
            <div style="width: 50%; padding: 10px;">
              <p style="margin: 0; line-height: 1.5;">• <strong>Earthing:</strong> Dedicated Earthing provided for Solar PV System</p>
            </div>
          </div>
        </div>

        <p style="font-weight: bold; font-size: 12px; margin-top: 16px;">Date of Commissioning: ${commDate}</p>
      </div>

      <div class="sign-grid" style="grid-template-columns: 1fr 1fr; margin-top: 60px;">
        <div>
          <div class="sign-space"><span>${beneficiaryName.split(' ')[0]}</span></div>
          <div class="sign-box">Consumer Signature<br><span style="font-size: 10px;">${beneficiaryName}</span></div>
        </div>
        <div>
          <div class="sign-space"><span style="border: 1px solid #1e40af; color: #1e40af; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 8.5px;">${vendorName}</span></div>
          <div class="sign-box">Vendor Signature & Stamp<br><span style="font-size: 10px;">${vendorName}</span></div>
        </div>
      </div>
    </div>
  `;

  // 3. DCR UNDERTAKING (ANNEXURE - A)
  const renderDcrHtml = () => `
    <div class="page">
      <div>
        <div class="doc-header">
          <div class="doc-org">ANNEXURE - A</div>
          <div class="doc-title">(SELF-DECLARATION / UNDERTAKING FOR DOMESTIC CONTENT REQUIREMENT)</div>
        </div>

        <p style="text-align: justify; line-height: 1.5; margin-bottom: 10px;">
          This is to certify that <strong>${vendorName}</strong> has installed <strong>${appliedCap} kWp</strong> Grid Connected Rooftop Solar (GCRTS) Power Plant for <strong>${beneficiaryName}</strong> at <strong>${address}, District: ${district}, State: ${state}, PIN Code: ${pincode}</strong>, under MNRE Rooftop Solar Scheme Phase-II, against Application Reference Number: <strong>${appRef}</strong>.
        </p>

        <p style="text-align: justify; line-height: 1.5; margin-bottom: 12px;">
          The system has been commissioned on <strong>${commDate}</strong>. The details of domestically manufactured Solar PV Modules installed are as below:
        </p>

        <div style="border: 1px solid #000; padding: 10px; margin-bottom: 14px; background: #fafafa; font-size: 11px;">
          <p style="font-weight: bold; text-decoration: underline; margin: 0 0 6px 0; font-size: 11.5px;">Details of Solar PV Modules</p>
          <div style="display: grid; grid-template-columns: 220px 1fr; gap: 4px;">
            <span>1. Total No. of Modules Installed</span><span style="font-weight: bold;">: ${moduleQty} NOS</span>
            <span>2. Rating of Each Module</span><span style="font-weight: bold;">: ${moduleWatt} Wp</span>
            <span>3. Total Capacity Installed (kWp)</span><span style="font-weight: bold;">: ${installedCap} kWp (Applied: ${appliedCap} kWp)</span>
            <span>4. PV Module Make</span><span style="font-weight: bold;">: ${moduleMake}</span>
            <span>5. Cell Manufacturer's Name</span><span style="font-weight: bold;">: ${cellMfr}</span>
            <span>6. Module Manufacturer's Name</span><span style="font-weight: bold;">: ${moduleMfr}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr class="section-head"><th colspan="3">List of Serial Numbers of ${moduleQty} NOS ${moduleMake} PV Modules (${moduleWatt} Wp)</th></tr>
            <tr style="background: #f9fafb; text-align: center;">
              <th style="width: 50px; text-align: center;">Sr. No.</th>
              <th style="text-align: left; padding-left: 12px;">PV Module Serial Number</th>
              <th style="width: 80px; text-align: center;">Rating</th>
            </tr>
          </thead>
          <tbody style="font-family: monospace;">
            ${serials.length > 0 ? serials.map((s, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="padding-left: 12px;"><strong>${s}</strong></td>
                <td style="text-align: center;">${moduleWatt} Wp</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="3" style="text-align: center; color: #b91c1c; padding: 16px; font-family: sans-serif; font-size: 11px; background: #fff1f2;">
                  <strong>⚠️ Hardware Barcodes Pending On-Site Scan</strong><br>
                  <span style="font-size: 10px; color: #9f1239;">Scan physical solar panel barcodes using the Mobile Hardware Barcode Scanner. (Auto-generation disabled)</span>
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <div style="text-align: justify; font-size: 10.5px; line-height: 1.45; color: #1e293b;">
          <p style="margin: 4px 0;">
            I / We hereby undertake that the above mentioned Solar PV Modules are domestically manufactured using domestic manufactured solar cells and conform to the Domestic Content Requirement (DCR) criteria as per MNRE guidelines. The cell and module manufacturer(s) have also provided requisite declarations/certificates regarding DCR compliance.
          </p>
          <p style="margin: 4px 0;">
            In case any information/document is found to be false/incorrect at a later stage, MNRE / MSEDCL may take appropriate action against us, including blacklisting or recovery of CFA. We also agree to provide supporting documents as and when required by MNRE or its designated agency.
          </p>
        </div>
      </div>

      <div class="sign-grid" style="grid-template-columns: 1fr 1fr; margin-top: 32px;">
        <div>
          <div class="sign-space"><span>${beneficiaryName.split(' ')[0]}</span></div>
          <div class="sign-box">(Signature of Beneficiary)<br><span style="font-size: 10px;">Name: ${beneficiaryName}</span></div>
        </div>
        <div>
          <div class="sign-space"><span style="border: 1px solid #1e40af; color: #1e40af; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 8.5px;">${vendorName}</span></div>
          <div class="sign-box">(Signature of Authorized Signatory)<br><span style="font-size: 10px;">For ${vendorName}</span></div>
        </div>
      </div>
    </div>
  `;

  // 4. NET METERING CONNECTION AGREEMENT (6 PAGES)
  const renderNetMeteringHtml = () => `
    <!-- PAGE 1 -->
    <div class="page">
      <div>
        ${renderStampPaper()}
        <div class="doc-header">
          <div class="doc-org">ANNEXURE – 3</div>
          <div class="doc-title">NET METERING CONNECTION AGREEMENT</div>
        </div>
        <div style="line-height: 1.6; text-align: justify;">
          <p style="margin-bottom: 12px;">
            This Agreement is made and entered into at (location) <strong>${location}</strong> on this (date) <strong>${day}</strong> day of (month) <strong>${month}</strong> (year) <strong>${year}</strong> between the Eligible Consumer (Name <strong>${beneficiaryName}</strong> having premises at (address <strong>${address}, District: ${district}</strong> and Consumer No. <strong>${consumerNo}</strong> as the first Party, AND
          </p>
          <p style="margin-bottom: 12px;">
            <strong>MSEDCL) ${subDivision}</strong> (hereinafter referred to as ‘the Licensee’) and having its Registered Office at (address) <strong>${location}</strong> as second Party of this Agreement. Whereas the Eligible Consumer has applied to MSEDCL for approval of a Net Metering Arrangement under the provisions of the Maharashtra Electricity Regulatory Commission (Grid Interactive Renewable Energy Generating Systems) Regulations, 2019 (‘the Grid Interactive Renewable Regulations’) and sought its connectivity to MSEDCL’s distribution Network;
          </p>
          <p style="margin-bottom: 12px;">
            And whereas MSEDCL has agreed to provide Network connectivity to the Eligible Consumer for injection of electricity generated from its Renewable Energy Generating System of <strong>${appliedCap} kilowatt</strong>;
          </p>
        </div>
      </div>
    </div>

    <!-- PAGE 2 -->
    <div class="page">
      <div>
        ${renderStampPaper()}
        <p style="font-weight: bold; margin-bottom: 12px;">Both Parties hereby agree as follows:</p>
        <div style="line-height: 1.6; text-align: justify;">
          <h3 style="font-size: 12px; margin: 12px 0 4px 0;">1 Eligibility</h3>
          <p style="margin-bottom: 12px;">The Renewable Energy Generating System meets the applicable norms for being integrated into the distribution network, and that the Eligible Consumer shall maintain the System accordingly for the duration of this Agreement.</p>
          <h3 style="font-size: 12px; margin: 12px 0 4px 0;">2 Technical and Inter-connection Requirements</h3>
          <p style="margin-bottom: 8px;"><strong>2.1</strong> The metering arrangement and the inter-connection of the Renewable Energy Generating System with the Network of MSEDCL shall be as per the provisions of the Grid Interactive Renewable Regulations, and the technical standards and norms specified by the Central Electricity Authority for connectivity of distributed generation resources and for the installation and operation of meters.</p>
          <p style="margin-bottom: 8px;"><strong>2.2</strong> The Eligible Consumer agrees, that he shall install, prior to connection of the Renewable Energy Generating System to the Network of MSEDCL, an isolation device (both automatic and in-built within inverter and external manual relays); and MSEDCL shall have access to it if required for the repair and maintenance of the distribution Network.</p>
          <p style="margin-bottom: 8px;"><strong>2.3</strong> MSEDCL shall specify the interface/inter-connection point and metering point.</p>
        </div>
      </div>
    </div>

    <!-- PAGE 3 -->
    <div class="page">
      <div style="line-height: 1.6; text-align: justify; padding-top: 12px;">
        <p style="margin-bottom: 12px;"><strong>2.4</strong> The Eligible Consumer shall furnish all relevant data, such as voltage, frequency, circuit breaker, isolator position in his System, as and when required by MSEDCL.</p>
        <h3 style="font-size: 12px; margin: 12px 0 4px 0;">3 Safety</h3>
        <p style="margin-bottom: 8px;"><strong>3.1</strong> The equipment connected to MSEDCL’s distribution System shall be compliant with relevant International (IEEE/IEC) or Indian standards (BIS), as the case may be, and the installation of electrical equipment shall comply with the requirements specified by the Central Electricity Authority regarding safety and electricity supply.</p>
        <p style="margin-bottom: 8px;"><strong>3.2</strong> The design, installation, maintenance and operation of the Renewable Energy Generating System shall be undertaken in a manner conducive to the safety of the Renewable Energy Generating System as well as MSEDCL’s Network.</p>
        <p style="margin-bottom: 8px;"><strong>3.3</strong> If, at any time, MSEDCL determines that the Eligible Consumer’s Renewable Energy Generating System is causing or may cause damage to and/or results in MSEDCL’s other consumers or its assets, the Eligible Consumer shall disconnect the Renewable Energy Generating System from the distribution Network upon direction from MSEDCL, and shall undertake corrective measures at his own expense prior to re-connection.</p>
        <p style="margin-bottom: 12px;"><strong>3.4</strong> MSEDCL shall not be responsible for any accident resulting in injury to human beings or animals or damage to property that may occur due to back-feeding from the Renewable Energy Generating System when the grid supply is off. MSEDCL may disconnect the installation at any time in the event of such exigencies to prevent such accident.</p>
        <h3 style="font-size: 12px; margin: 12px 0 4px 0;">4 Other Clearances and Approvals</h3>
        <p style="margin-bottom: 12px;">The Eligible Consumer shall obtain any statutory approvals and clearances that may be required, such as from the Electrical Inspector or the municipal or other authorities, before connecting the Renewable Energy Generating System to the distribution Network.</p>
        <h3 style="font-size: 12px; margin: 12px 0 4px 0;">5 Period of Agreement, and Termination</h3>
        <p style="margin-bottom: 6px;"><strong>5.1</strong> This Agreement shall be for a period for 20 years, but may be terminated prematurely:</p>
        <p style="margin-left: 20px; margin-bottom: 4px;">a) By mutual consent; or</p>
        <p style="margin-left: 20px; margin-bottom: 4px;">b) By the Eligible Consumer, by giving 90 days’ notice to MSEDCL;</p>
        <p style="margin-left: 20px; margin-bottom: 4px;">c) By MSEDCL, by giving 30 days’ notice, if the Eligible Consumer breaches any terms of this Agreement or the provisions of the Grid Interactive Rooftop Renewable Energy Generating Systems Regulations and does not remedy such breach within 30 days of receiving notice;</p>
      </div>
    </div>

    <!-- PAGE 4 -->
    <div class="page">
      <div style="line-height: 1.6; text-align: justify; padding-top: 12px;">
        <p style="margin-left: 20px; margin-bottom: 12px;">d) By MSEDCL, by giving 30 days’ notice, if the Eligible Consumer fails to pay his dues in a timely manner or indulges in any malpractices.</p>
        <h3 style="font-size: 12px; margin: 12px 0 4px 0;">6 Access and Disconnection</h3>
        <p style="margin-bottom: 8px;"><strong>6.1</strong> The Eligible Consumer shall provide access to MSEDCL to the metering equipment and disconnecting devices of Renewable Energy Generating System, both automatic and manual, by the Eligible Consumer.</p>
        <p style="margin-bottom: 8px;"><strong>6.2</strong> If, in an emergent or outage situation, MSEDCL cannot access the disconnecting devices of the Renewable Energy Generating System, both automatic and manual, it may disconnect power supply to the premises.</p>
        <p style="margin-bottom: 12px;"><strong>6.3</strong> Upon termination of this Agreement under Clause 5, the Eligible Consumer shall disconnect the Renewable Energy Generating System forthwith from the Network of MSEDCL.</p>
        <h3 style="font-size: 12px; margin: 12px 0 4px 0;">7 Liabilities</h3>
        <p style="margin-bottom: 8px;"><strong>7.1</strong> The Parties shall indemnify each other for damages or adverse effects of either Party’s negligence or misconduct during the installation of the Renewable Energy Generating System, connectivity with the distribution Network and operation of the System.</p>
        <p style="margin-bottom: 12px;"><strong>7.2</strong> The Parties shall not be liable to each other for any loss of profits or revenues, business interruption losses, loss of contract or goodwill, or for indirect, consequential, incidental or special damages.</p>
        <h3 style="font-size: 12px; margin: 12px 0 4px 0;">8 Commercial Settlement</h3>
        <p style="margin-bottom: 8px;"><strong>8.1</strong> The commercial settlements under this Agreement shall be in accordance with the Grid Interactive Renewable Regulations.</p>
        <p style="margin-bottom: 8px;"><strong>8.2</strong> MSEDCL shall not be liable to compensate the Eligible Consumer if his Renewable Energy Generating System is unable to inject surplus power generated into MSEDCL’s Network on account of failure of power supply in the grid/Network.</p>
        <p style="margin-bottom: 8px;"><strong>8.3</strong> The existing metering System, if not in accordance with the Grid Interactive Renewable Regulations, shall be replaced by a bi-directional meter (whole current/CT operated) and a separate Renewable Energy Generation Meter shall be provided to measure Renewable Energy generation.</p>
        <p style="margin-bottom: 8px;"><strong>8.4</strong> The uni-directional and bi-directional meters shall be fixed in separate meter boxes in the same proximity.</p>
      </div>
    </div>

    <!-- PAGE 5 -->
    <div class="page">
      <div style="line-height: 1.6; text-align: justify; padding-top: 12px;">
        <p style="margin-bottom: 8px;"><strong>8.5</strong> The energy generated by the Renewable Energy Generating Station shall be offset against the energy consumption of the consumer from the MSEDCL in the following manner:</p>
        <div style="margin-left: 20px; font-size: 11px;">
          <p style="margin-bottom: 6px;">a) If the quantum of electricity exported exceeds the quantum imported during the Billing Period, the excess quantum shall be carried forward to the next Billing Period as credited Units of electricity;</p>
          <p style="margin-bottom: 6px;">b) If the quantum of electricity Units imported by the Eligible Consumer during any Billing Period exceeds the quantum exported, the MSEDCL shall raise its invoice for the net electricity consumption after adjusting the credited Units;</p>
          <p style="margin-bottom: 6px;">c) The unadjusted net credited Units of electricity as at the end of each financial year shall be purchased by the MSEDCL at the Generic Tariff approved by the Commission for that year;</p>
          <p style="margin-bottom: 6px;">d) In case the Eligible Consumer is within the ambit of Time of Day (ToD) tariff, the electricity consumption in any time block shall be first compensated with the quantum of electricity injected in the same time block;</p>
          <p style="margin-bottom: 12px;">e) MSEDCL shall compute the amount payable to the Eligible Consumer for the excess Renewable Energy purchased and provide credit in the immediately succeeding Billing Cycle.</p>
        </div>
        <h3 style="font-size: 12px; margin: 12px 0 4px 0;">9 Connection Costs</h3>
        <p style="margin-bottom: 12px;">The Eligible Consumer shall bear all costs related to the setting up of the Renewable Energy Generating System, including the cost of the Renewable Energy Generation Meter.</p>
        <h3 style="font-size: 12px; margin: 12px 0 4px 0;">10 Dispute Resolution</h3>
        <p style="margin-bottom: 8px;"><strong>10.1</strong> Any dispute arising under this Agreement shall be resolved promptly, in good faith and in an equitable manner by both the Parties.</p>
        <p style="margin-bottom: 16px;"><strong>10.2</strong> The Eligible Consumer shall have recourse to the concerned Consumer Grievance Redressal Forum constituted under the relevant Regulations in respect of any grievance regarding billing.</p>
        <p style="margin-top: 16px;">In the witness whereof <strong>${vendorName}</strong> for and on behalf of Eligible Consumer and <strong>${beneficiaryName}</strong> for and on behalf of MSEDCL (Licensee) agree to this agreement.</p>
      </div>
    </div>

    <!-- PAGE 6 -->
    <div class="page">
      <div style="padding-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; font-size: 12px;">
          <div>
            <p style="font-weight: bold; font-size: 13px; margin: 0;">${beneficiaryName}</p>
            <p style="color: #475569; margin: 4px 0 0 0;">for and on behalf of Eligible Consumer</p>
          </div>
          <div style="text-align: right;">
            <p style="font-weight: bold; font-size: 13px; margin: 0;">for and on behalf of MSEDCL Witness</p>
          </div>
        </div>

        <div style="margin-bottom: 48px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
              <p style="font-weight: bold; margin: 0;">1: Witness . ${witness1}</p>
              <div style="height: 36px; border-bottom: 1px solid #000; width: 240px; margin-top: 6px;"></div>
            </div>
            <div style="text-align: right;">
              <p style="font-weight: bold; margin: 0;">2: Witness __________________</p>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-weight: bold; margin: 0;">1: Witness ${witness2}</p>
              <div style="height: 36px; border-bottom: 1px solid #000; width: 240px; margin-top: 6px;"></div>
            </div>
            <div style="text-align: right;">
              <p style="font-weight: bold; margin: 0;">2: Witness __________________</p>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 60px;">
          <div style="text-align: center; width: 240px;">
            <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
              <div style="border: 1px solid #1e40af; color: #1e40af; padding: 4px 12px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase;">
                ${vendorName}<br><span style="font-size: 8px;">PROPRIETOR</span>
              </div>
            </div>
            <div style="border-top: 1px solid #000; padding-top: 4px;">
              <p style="font-weight: bold; font-size: 12px; text-transform: uppercase; margin: 0;">${vendorName}</p>
              <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Authorized Vendor Stamp & Sign</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 5. CONSUMER & VENDOR AGREEMENT (PM SURYA GHAR - 3 PAGES)
  const renderConsumerVendorAgreementHtml = () => `
    <!-- PAGE 1 -->
    <div class="page">
      <div>
        ${renderStampPaper()}
        <div class="doc-header">
          <div class="doc-org">ANNEXURE 2</div>
          <div class="doc-title" style="line-height: 1.4;">
            Model Draft Agreement between Consumer & Vendor for installation of grid<br/>
            connected rooftop solar (RTS) project under PM – Surya Ghar: Muft Bijli Yojana
          </div>
        </div>
        <div style="line-height: 1.6; text-align: justify;">
          <p style="margin-bottom: 16px;">
            This agreement is executed on --<strong>${day}</strong>--(Day)-----<strong>${month}</strong>-----(Month)-----<strong>${year.slice(-2)}</strong>-----(Year) for design, supply, installation, commissioning and 5-year comprehensive maintenance of RTS project/system along with warranty under PM Surya Ghar: Muft Bijli Yojana
          </p>
          <div style="text-align: center; font-weight: bold; font-size: 13px; margin: 16px 0;">Between</div>
          <div style="margin-bottom: 16px;">
            <p style="font-weight: bold; font-size: 13px; margin: 0 0 4px 0;">${beneficiaryName}</p>
            <p style="margin: 0;">having address at <strong>${address}, District: ${district}, State: ${state}, PIN Code: ${pincode}</strong> (hereinafter referred to as First Party / Consumer)</p>
          </div>
          <div style="text-align: center; font-weight: bold; font-size: 13px; margin: 16px 0;">And</div>
        </div>
      </div>
    </div>

    <!-- PAGE 2 -->
    <div class="page">
      <div style="line-height: 1.55; text-align: justify; padding-top: 12px;">
        <p style="margin-bottom: 12px;">
          (<strong>${vendorName}</strong>) having registered office at <strong>${vendorAddress} ${vendorPincode}</strong> (hereinafter referred to as Second Party / Vendor).
        </p>
        <div style="text-align: center; margin: 12px 0;">
          <h3 style="font-weight: bold; font-size: 13px; margin: 0;">Whereas</h3>
          <p style="font-size: 11px; color: #475569; margin: 2px 0;">Guidelines for PM-Surya Ghar: Muft Bijli Yojana</p>
          <p style="font-size: 11px; color: #475569; margin: 0;">Central Financial Assistance to Residential Consumers</p>
        </div>
        <p style="margin-bottom: 12px;">
          First Party wishes to install a Grid Connected Rooftop Solar Plant on the rooftop of the residential building of the Consumer under PM Surya Ghar: Muft Bijli Yojana.
        </p>
        <p style="margin-bottom: 12px;">
          <strong>And whereas</strong> Second Party has verified availability of appropriate roof and found it feasible to install a Grid Connected Roof Top Solar plant and that the second party is willing to design, supply, install, test, commission and carry out Operation & Maintenance of the Rooftop Solar plant for 5 year period.
        </p>
        <p style="margin-bottom: 8px;">
          On this day, the First Party and Second Party agree to the following: The First Party hereby undertakes to perform the following activities:
        </p>
        <div style="margin-left: 16px; font-size: 11px;">
          <p style="margin-bottom: 4px;"><strong>1.</strong> Submission of online application at National Portal for installation of RTS project/system, Submission of application for net-metering and system inspection and upload of the relevant documents on the National Portal.</p>
          <p style="margin-bottom: 4px;"><strong>2.</strong> Provide secure storage of the material of the RTS plant delivered at the premises till handover of the system.</p>
          <p style="margin-bottom: 4px;"><strong>3.</strong> Provide access to the Roof Top during installation of the plant, operation & maintenance, testing of the plant and equipment.</p>
          <p style="margin-bottom: 4px;"><strong>4.</strong> Provide electricity during plant installation and water for cleaning of the panels.</p>
          <p style="margin-bottom: 4px;"><strong>5.</strong> Report any malfunctioning of the plant to the Vendor during the warranty period.</p>
          <p style="margin-bottom: 8px;"><strong>6.</strong> Pay the amount as per the payment schedule as mutually agreed with the vendor.</p>
        </div>
        <p style="margin-top: 10px; margin-bottom: 6px;">The Second Party hereby undertakes to perform the following activities:</p>
        <div style="margin-left: 16px; font-size: 11px;">
          <p><strong>1.</strong> The Vendor must follow all the standards and safety guidelines prescribed under state regulations and technical standards prescribed by MNRE for RTS projects, failing which the vendor is liable for blacklisting from participation in the govt. project/ scheme.</p>
        </div>
      </div>
    </div>

    <!-- PAGE 3 -->
    <div class="page">
      <div style="line-height: 1.5; text-align: justify; padding-top: 12px; font-size: 11px;">
        <p style="margin-bottom: 8px;">
          <strong>2. Site Survey:</strong> Site visit, survey and development of detailed project report for installation of RTS system. This also includes feasibility study of roof, strength of roof and shadow free area.
        </p>
        <p style="margin-bottom: 8px;">
          <strong>3. Design & Engineering:</strong> Design of plant along with drawings and selection of components as per standard provided by the DISCOM/SERC/MNRE for best performance and safety of the plant.
        </p>
        <p style="margin-bottom: 8px;">
          <strong>4. Module and Inverter:</strong> The solar modules, including the solar cells, should be manufactured in India. Both the solar modules and inverters shall conform to the relevant standards and specifications prescribed by MNRE.
        </p>
        <div style="text-align: center; margin: 10px 0; color: #475569; font-weight: bold;">
          <p style="margin: 0;">Guidelines for PM-Surya Ghar: Muft Bijli Yojana</p>
          <p style="margin: 2px 0 0 0;">Central Financial Assistance to Residential Consumers</p>
        </div>
        <p style="margin-bottom: 8px;">
          maintain the PR of the plant till warranty of project i.e. 5 years from the date of commissioning.
        </p>
        <p style="font-weight: bold; margin-bottom: 16px;">
          19. Mutually Agreed Terms of Payment …
        </p>

        <div style="border-top: 1px solid #cbd5e1; padding-top: 16px; margin-top: 24px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; font-size: 11px;">
            <div>
              <p style="font-weight: bold; text-decoration: underline; margin: 0 0 6px 0;">First Party (Consumer)</p>
              <p style="margin: 3px 0;">Name: <strong>${beneficiaryName}</strong></p>
              <p style="margin: 3px 0;">Address: ${address}, ${district}</p>
              <div style="margin-top: 36px;">
                <div style="height: 36px; border-bottom: 1px solid #000; width: 180px; margin-bottom: 4px;"></div>
                <p style="font-size: 10px; margin: 0;">Sign: ____________________</p>
                <p style="font-size: 10px; margin: 4px 0 0 0;">Date: ${day}/${month}/${year}</p>
              </div>
            </div>

            <div>
              <p style="font-weight: bold; text-decoration: underline; margin: 0 0 6px 0;">Second Party (Vendor)</p>
              <p style="margin: 3px 0;">Name: <strong>${vendorName}</strong></p>
              <p style="margin: 3px 0;">Address: ${vendorAddress}</p>
              <div style="margin-top: 36px;">
                <div style="height: 36px; border-bottom: 1px solid #000; width: 180px; margin-bottom: 4px;"></div>
                <p style="font-size: 10px; margin: 0;">Sign: ____________________</p>
                <p style="font-size: 10px; margin: 4px 0 0 0;">Date: ${day}/${month}/${year}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 6. OFFICIAL STANDARD 1-PAGE QUOTATION
  const renderStandardQuotationHtml = () => `
    <div class="page">
      <div>
        <h1 style="text-align: center; font-weight: 900; font-size: 22px; letter-spacing: 2px; margin: 0 0 24px 0; text-transform: uppercase;">
          QUOTATION
        </h1>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 14px; font-weight: 800; margin: 0 0 4px 0;">${vendorName}</h2>
            <p style="font-size: 11px; margin: 2px 0; color: #334155;">GST No.: ${gstin}</p>
            <p style="font-size: 11px; margin: 2px 0; color: #334155;">Date: ${quotationDate}</p>
            <p style="font-size: 11px; margin: 2px 0; color: #334155;">Quotation No.: ${quotationNumber}</p>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <p style="font-weight: bold; font-size: 12px; text-decoration: underline; margin: 0 0 4px 0;">Consumer Details</p>
          <p style="font-size: 11.5px; font-weight: bold; margin: 2px 0;">Consumer Name:- ${beneficiaryName}</p>
          <p style="font-size: 11.5px; font-weight: bold; margin: 2px 0;">Consumer Number: ${consumerNo}</p>
        </div>

        <table>
          <thead>
            <tr style="background: #f3f4f6; text-align: center; font-weight: bold;">
              <th style="width: 50px; text-align: center;">Sr No</th>
              <th style="text-align: left; padding-left: 12px;">Item Description</th>
              <th style="width: 90px; text-align: center;">Quantity</th>
              <th style="text-align: left; padding-left: 12px;">Specification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; font-weight: bold;">1</td>
              <td style="padding-left: 12px; font-weight: 500;">Solar Inverter / PV Modules</td>
              <td style="text-align: center;">${moduleQty}</td>
              <td style="padding-left: 12px;">${moduleMake} Panel – ${moduleWatt} Watt</td>
            </tr>
            <tr>
              <td style="text-align: center; font-weight: bold;">2</td>
              <td style="padding-left: 12px; font-weight: 500;">Solar Inverter</td>
              <td style="text-align: center;">${inverterQty}</td>
              <td style="padding-left: 12px;">${inverterBrand} ${inverterCap}kW</td>
            </tr>
            <tr>
              <td style="text-align: center; font-weight: bold;">3</td>
              <td style="padding-left: 12px; font-weight: 500;">Mounting Structure</td>
              <td style="text-align: center;">1 Set</td>
              <td style="padding-left: 12px;">${structureBrand}</td>
            </tr>
            <tr>
              <td style="text-align: center; font-weight: bold;">4</td>
              <td style="padding-left: 12px; font-weight: 500;">DC/AC Wiring & Accessories</td>
              <td style="text-align: center;">1 Set</td>
              <td style="padding-left: 12px;">Standard Solar Cable</td>
            </tr>
            <tr>
              <td style="text-align: center; font-weight: bold;">5</td>
              <td style="padding-left: 12px; font-weight: 500;">Installation & Commissioning</td>
              <td style="text-align: center;">1</td>
              <td style="padding-left: 12px;">Complete Setup</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-bottom: 20px; padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1;">
          <p style="font-weight: bold; font-size: 12.5px; margin: 0;">
            Total Quotation Amount: ${formatINR(totalAmount)}/- (${totalInWords})
          </p>
        </div>

        <div style="margin-bottom: 24px; font-size: 11px; color: #334155;">
          <p style="font-weight: bold; font-size: 11.5px; margin: 0 0 6px 0; color: #000;">Terms & Conditions</p>
          <p style="margin: 3px 0;">• Price includes installation and standard accessories.</p>
          <p style="margin: 3px 0;">• Transportation charges may apply depending on site location.</p>
          <p style="margin: 3px 0;">• Payment Terms: 50% advance and 50% after installation.</p>
          <p style="margin: 3px 0;">• Product warranty as per manufacturer policy.</p>
        </div>
      </div>

      <div style="padding-bottom: 24px;">
        <div style="width: 240px;">
          <p style="font-weight: bold; font-size: 11.5px; margin: 0;">Authorized Signatory</p>
          <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0;">For ${vendorName}</p>
          <div style="height: 50px; display: flex; align-items: center; margin: 6px 0;">
            <div style="border: 1px solid #1e40af; color: #1e40af; padding: 2px 8px; border-radius: 3px; font-size: 8.5px; font-weight: bold;">
              ${vendorName}
            </div>
          </div>
          <p style="font-size: 11px; font-weight: 600; margin: 0;">Signature: _________________________</p>
        </div>
      </div>
    </div>
  `;

  // 7. GUARANTEE CERTIFICATE
  const renderGuaranteeHtml = () => `
    <div class="page">
      <div>
        <h2 style="font-weight: bold; font-size: 16px; margin: 0 0 24px 0; text-decoration: underline; text-align: center;">
          Guarantee Certificate Undertaking to be submitted by VENDOR
        </h2>
        <p style="text-align: justify; line-height: 1.6; font-size: 12.5px; margin-bottom: 24px;">
          The undersigned will provide the services to the consumers for repairs/maintenance of the RTS plant free of cost for 5 years of the comprehensive Maintenance Contract (CMC) period from the date of commissioning of the plant. Non performing/under-performing system component will be replaced/repaired free of cost in the CMC period.
        </p>
        <div style="margin-bottom: 28px; font-size: 12px; line-height: 1.8;">
          <p>Signature [Vendor]: _________________________</p>
          <p>Stamp & Seal: _________________________</p>
        </div>
        <div style="margin-bottom: 28px; font-size: 12px;">
          <h3 style="font-weight: bold; text-decoration: underline; margin: 0 0 6px 0;">Identity Details of Consumer:</h3>
          <p style="margin: 4px 0;">Name: <strong>${beneficiaryName}</strong></p>
          <p style="margin: 4px 0;">Aadhar Number: ___________________________________________</p>
        </div>
        <div style="border: 2px dashed #94a3b8; padding: 60px 20px; text-align: center;">
          <p style="color: #64748b; font-weight: bold; margin: 0 0 4px 0;">Attach Xerox copy of AADHAR CARD HERE</p>
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">SHOULD BE SELF ATTESTED BY CONSUMER</p>
        </div>
      </div>
    </div>
  `;

  // 8. FORM A-1: NET METERING APPLICATION (Legacy)
  const renderFormA1Html = () => `
    <div class="page">
      <div>
        <div class="doc-header">
          <div class="doc-org">MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD. (MSEDCL)</div>
          <div class="doc-title">FORM A-1: APPLICATION FOR NET-METERING ROOFTOP SOLAR PV SYSTEM</div>
          <div class="doc-sub">To: The Executive Engineer / Sub-Divisional Officer, MSEDCL (${city} Circle)</div>
        </div>

        <table>
          <thead><tr class="section-head"><th colspan="2">Official Application Particulars</th></tr></thead>
          <tbody>
            <tr><td style="width: 40%; font-weight: bold;">1. Name of the Applicant</td><td style="font-weight: bold;">${beneficiaryName}</td></tr>
            <tr><td style="font-weight: bold;">2. Consumer Number (12 Digit)</td><td style="font-weight: bold; font-family: monospace;">${consumerNo}</td></tr>
            <tr><td style="font-weight: bold;">3. Billing Unit (BU)</td><td style="font-family: monospace;">${bu}</td></tr>
            <tr><td style="font-weight: bold;">4. Service Connection Address</td><td>${address}, District: ${city}, PIN: ${pincode}</td></tr>
            <tr><td style="font-weight: bold;">5. Mobile & Email</td><td>${mobile} | ${email}</td></tr>
            <tr><td style="font-weight: bold;">6. Tariff Category</td><td>${category}</td></tr>
            <tr><td style="font-weight: bold;">7. Sanctioned Connected Load</td><td>${sanctionedLoad} kW</td></tr>
            <tr><td style="font-weight: bold;">8. Proposed Solar Capacity</td><td style="font-weight: bold;">${appliedCap} kWp Grid-Tied</td></tr>
            <tr><td style="font-weight: bold;">9. Inverter Specifications</td><td>${inverterMake} (Compliant with IEC 62109, IEC 61727)</td></tr>
            <tr><td style="font-weight: bold;">10. Approved Solar EPC Partner</td><td style="font-weight: bold;">${vendorName}</td></tr>
          </tbody>
        </table>

        <p style="font-size: 10.5px; color: #334155; line-height: 1.5; margin-top: 16px;">
          I/We hereby apply for grid interconnection of our Rooftop Solar PV System under the Net-Metering arrangement. I agree to abide by the terms and conditions stipulated by MERC (Grid Interactive Renewable Energy Systems) Regulations, 2019 and MSEDCL guidelines.
        </p>

        <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 10.5px;">
          <div>
            Date: <strong>${appDate}</strong><br>
            Place: <strong>${city}</strong>
          </div>
          <div style="text-align: right;">
            <div style="height: 40px;"></div>
            ____________________________<br>
            <strong>Signature of Applicant</strong><br>
            ${beneficiaryName}
          </div>
        </div>
      </div>

      <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 9px; color: #64748b; text-align: center;">
        WhereReady Solar OS Statutory Compliance Engine • Generated for Official State Utility Net-Metering Filing
      </div>
    </div>
  `;

  // Select appropriate document or full statutory pack
  let content = '';
  const normalizedType = String(type || '').toUpperCase();

  if (normalizedType === 'WCR_FULL' || normalizedType === 'FULL_PACK') {
    content = renderWcrHtml() + renderCommissioningHtml() + renderDcrHtml();
  } else if (normalizedType === 'WCR') {
    content = renderWcrHtml();
  } else if (normalizedType === 'ANNEXUREI' || normalizedType === 'COMMISSIONING') {
    content = renderCommissioningHtml();
  } else if (normalizedType === 'DCR') {
    content = renderDcrHtml();
  } else if (normalizedType === 'NETMETERING' || normalizedType === 'ANNEXURE_3') {
    content = renderNetMeteringHtml();
  } else if (normalizedType === 'CONSUMERVENDOR' || normalizedType === 'ANNEXURE_2' || normalizedType === 'AGREEMENT') {
    content = renderConsumerVendorAgreementHtml();
  } else if (normalizedType === 'STANDARDQUOTATION' || normalizedType === 'QUOTATION') {
    content = renderStandardQuotationHtml();
  } else if (normalizedType === 'GUARANTEE') {
    content = renderGuaranteeHtml();
  } else if (normalizedType === 'FORM_A1') {
    content = renderFormA1Html();
  } else {
    // Default fallback to WCR Full Pack
    content = renderWcrHtml() + renderCommissioningHtml() + renderDcrHtml();
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MSEDCL Net-Metering Document - ${consumerNo}</title>
  <style>${baseStyles}</style>
</head>
<body>
  ${content}
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

  const isProforma = data.invoiceType === 'PROFORMA' || (data.invoiceNumber || '').startsWith('PRO');
  const isAdvance = data.invoiceType === 'ADVANCE_RECEIPT' || (data.invoiceNumber || '').startsWith('ADV');
  const docTitle = isProforma ? 'PROFORMA INVOICE' : isAdvance ? 'ADVANCE PAYMENT RECEIPT' : 'TAX INVOICE';

  const taxableBase = data.subtotal || Math.round((data.grossTotal || 0) / 1.138);
  const effectiveGst = Math.round((data.grossTotal || 0) - taxableBase);
  const cgst = Math.round(effectiveGst / 2);
  const sgst = effectiveGst - cgst;

  const defaultItems = [
    {
      description: `${data.milestoneTitle || 'Solar Power Generation Plant Installation & Supply'} (${data.projectCapacityKw || 3.3} kWp On-Grid)`,
      hsn: data.milestoneKey === 'MATERIAL_DELIVERY' ? '8541' : '9954',
      qty: 1,
      unit: 'Set',
      rate: taxableBase,
      amount: data.grossTotal,
      gstRate: 13.8,
    },
  ];

  const items = data.items && data.items.length > 0 ? data.items : defaultItems;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    @page {
      size: A4 portrait;
      margin: 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .invoice-container {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      padding: 10px 0;
    }
    /* Header matching web */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #0f172a;
    }
    .company-title {
      font-size: 24px;
      font-weight: 900;
      color: #059669;
      margin: 0 0 4px 0;
      line-height: 1.2;
    }
    .company-meta {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      margin: 2px 0;
      max-width: 320px;
      line-height: 1.4;
    }
    .company-gstin {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      margin-top: 4px;
    }
    .header-right {
      text-align: right;
    }
    .doc-title {
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .meta-row {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
      margin: 3px 0;
    }
    .meta-val {
      font-weight: 500;
      color: #475569;
    }
    .status-badge {
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Billed to & Project Grid matching web */
    .party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin: 24px 0;
      padding-bottom: 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    .section-kicker {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .party-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .project-name {
      font-size: 15px;
      font-weight: 700;
      color: #065f46;
      margin-bottom: 4px;
    }
    .party-text {
      font-size: 11px;
      color: #475569;
      margin: 2px 0;
      line-height: 1.4;
    }
    .dbt-eligible {
      font-size: 11px;
      color: #1d4ed8;
      font-weight: 600;
      margin-top: 4px;
    }

    /* Items Table matching web */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      text-align: left;
    }
    .items-table th {
      border-bottom: 2px solid #0f172a;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      padding: 10px 8px;
    }
    .items-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
      vertical-align: top;
    }
    .item-title {
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      font-size: 12px;
    }
    .item-desc {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 3px;
      line-height: 1.4;
    }

    /* Totals & Bank section matching web */
    .bottom-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      margin-bottom: 28px;
    }
    .bank-box {
      max-width: 340px;
      font-size: 11px;
      line-height: 1.5;
    }
    .bank-title {
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .bank-line {
      color: #475569;
      margin: 1px 0;
    }
    .dbt-callout {
      padding: 10px 12px;
      border-radius: 10px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      margin-top: 12px;
    }
    .dbt-callout-title {
      font-size: 11px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 2px;
    }
    .dbt-callout-text {
      font-size: 10px;
      color: #1e40af;
      line-height: 1.4;
    }

    .totals-box {
      width: 290px;
      font-size: 11.5px;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #f1f5f9;
      color: #64748b;
    }
    .total-line-val {
      font-weight: 700;
      color: #1e293b;
    }
    .grand-total-line {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 2px solid #0f172a;
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
    }
    .grand-total-val {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .paid-line {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      color: #047857;
      font-weight: 700;
    }
    .bal-line {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      color: #b45309;
      font-weight: 900;
    }

    /* Footer matching web */
    .footer {
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-left {
      font-size: 10.5px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .signatory-box {
      text-align: center;
    }
    .sign-line {
      width: 120px;
      border-bottom: 2px solid #94a3b8;
      height: 44px;
      margin: 0 auto 6px auto;
    }
    .sign-title {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0f172a;
      margin: 0;
    }
    .sign-comp {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div>
        ${data.companyLogoUrl ? `<img src="${data.companyLogoUrl}" alt="Logo" style="height: 56px; object-fit: contain; margin-bottom: 12px;" />` : `
        <h1 class="company-title">${data.companyName || 'Solar Energy EPC'}</h1>`}
        <p class="company-meta">${data.companyAddress || 'Solar Engineering Headquarters'}</p>
        ${data.companyGstin ? `<p class="company-gstin">GSTIN: ${data.companyGstin}</p>` : ''}
        <p class="company-meta">Contact: ${data.companyPhone || '+91 98220 12345'} • ${data.companyEmail || 'billing@wherereadysolar.com'}</p>
      </div>

      <div class="header-right">
        <h2 class="doc-title">${docTitle}</h2>
        <p class="meta-row">Invoice No: <span class="meta-val">${data.invoiceNumber}</span></p>
        <p class="meta-row">Date: <span class="meta-val">${data.invoiceDate}</span></p>
        <p class="meta-row">Due Date: <span class="meta-val">${data.dueDate || 'Net 15 Days'}</span></p>
        <p class="meta-row">Status: <span class="status-badge" style="color: ${statusColor};">${data.status || 'UNPAID'}</span></p>
      </div>
    </div>

    <!-- Billed To & Project Details -->
    <div class="party-grid">
      <div>
        <div class="section-kicker">BILLED TO (CONSUMER):</div>
        <div class="party-name">${data.customerName || 'Valued Consumer'}</div>
        <div class="party-text">${data.customerPhone || ''}</div>
        ${data.customerEmail ? `<div class="party-text">${data.customerEmail}</div>` : ''}
        <div class="party-text">${data.customerAddress || 'Site Address as per contract'}</div>
      </div>
      <div>
        <div class="section-kicker">PROJECT & SYSTEM DETAILS:</div>
        <div class="project-name">${data.projectName || `${data.customerName}'s Rooftop Solar Plant`}</div>
        <div class="party-text" style="font-weight: 700; color: #334155;">
          Capacity: ${data.projectCapacityKw || 3.3} kWp On-Grid
        </div>
        <div class="party-text">Milestone: ${data.milestoneTitle || 'Solar Deliverable Milestone'}</div>
        <div class="dbt-eligible">PM Surya Ghar DBT Subsidy Eligible</div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%;">Item & Scope Description</th>
          <th style="width: 10%; text-align: center;">HSN/SAC</th>
          <th style="width: 8%; text-align: center;">Qty</th>
          <th style="width: 14%; text-align: right;">Taxable Amt</th>
          <th style="width: 8%; text-align: right;">GST %</th>
          <th style="width: 10%; text-align: right;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(it => `
          <tr>
            <td>
              <p class="item-title">${it.description}</p>
              <p class="item-desc">Supply of Mono PERC DCR PV Modules, Grid Inverter, Mounting Hardware & Commissioning Services.</p>
            </td>
            <td style="text-align: center; color: #475569; font-weight: 600;">${it.hsn || (data.milestoneKey === 'MATERIAL_DELIVERY' ? '8541' : '9954')}</td>
            <td style="text-align: center; font-weight: 700; color: #1e293b;">${it.qty || 1} ${it.unit || 'Set'}</td>
            <td style="text-align: right; font-weight: 700; color: #1e293b;">₹ ${formatInr(it.rate || it.amount || taxableBase)}</td>
            <td style="text-align: right; font-weight: 700; color: #1e293b;">${it.gstRate || 13.8}%</td>
            <td style="text-align: right; font-weight: 900; color: #0f172a;">₹ ${formatInr(it.amount || data.grossTotal)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Tax Breakdown & Totals -->
    <div class="bottom-grid">
      <div class="bank-box">
        <div class="bank-title">Bank Transfer Details:</div>
        <div class="bank-line">Bank Name: ${data.bankDetails?.bankName || 'HDFC Bank Ltd'}</div>
        <div class="bank-line">Account: ${data.bankDetails?.accountName || 'Solar EPC Solutions Current A/c'}</div>
        <div class="bank-line">Account No: ${data.bankDetails?.accountNumber || '50200088992211'}</div>
        <div class="bank-line">IFSC Code: ${data.bankDetails?.ifsc || 'HDFC0001234'}</div>
        <div class="bank-line" style="font-weight: 600;">UPI ID: ${data.bankDetails?.upiId || 'solar.epc@upi'}</div>

        <div class="dbt-callout">
          <div class="dbt-callout-title">PM Surya Ghar Muft Bijli Yojana DBT Note:</div>
          <div class="dbt-callout-text">
            Central Govt subsidy of ₹78,000 will be credited directly to consumer Aadhaar-seeded bank account upon DISCOM net meter installation and CEIG inspection.
          </div>
        </div>
      </div>

      <div class="totals-box">
        <div class="total-line">
          <span>Taxable Subtotal</span>
          <span class="total-line-val">₹ ${formatInr(taxableBase)}</span>
        </div>
        <div class="total-line">
          <span>CGST (6.9%)</span>
          <span class="total-line-val">₹ ${formatInr(cgst)}</span>
        </div>
        <div class="total-line">
          <span>SGST (6.9%)</span>
          <span class="total-line-val">₹ ${formatInr(sgst)}</span>
        </div>
        <div class="grand-total-line">
          <span>Total Invoice Value</span>
          <span class="grand-total-val">₹ ${formatInr(data.grossTotal)}</span>
        </div>
        <div class="paid-line">
          <span>Amount Paid to Date</span>
          <span>₹ ${formatInr(data.totalPaid)}</span>
        </div>
        <div class="bal-line">
          <span>Balance Outstanding</span>
          <span>₹ ${formatInr(data.balanceDue)}</span>
        </div>
      </div>
    </div>

    <!-- Signatures & Footer -->
    <div class="footer">
      <div class="footer-left">
        <p style="margin: 0 0 2px 0;">Thank you for powering the future with clean solar energy!</p>
        <p style="margin: 0;">This is a computer generated tax invoice.</p>
      </div>
      <div class="signatory-box">
        <div class="sign-line"></div>
        <p class="sign-title">Authorized Signatory</p>
        <p class="sign-comp">${data.companyName || 'Solar Energy EPC'}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
