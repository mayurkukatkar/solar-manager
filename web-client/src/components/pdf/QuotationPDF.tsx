"use client";

import React from "react";
import { 
  Sun, MapPin, Phone, Mail, Globe, Zap, Battery, Settings,
  ShieldCheck, CheckCircle2, Calendar, IndianRupee, Activity,
  FileText, ArrowRight, Leaf, Trees, Wind, Check, AlertCircle, Home,
  Info, Cpu, Cable, Wrench, Shield, FileCheck, Award, Clock,
  Building2, CheckSquare, Layers
} from "lucide-react";
import { formatINR, toIndianWords } from "@/services/solarCalculator";

export interface QuotationData {
  quotation_number: string;
  quotation_date: string;
  valid_until: string;
  status?: string;
  template_type?: string;
  primary_color?: string;
  accent_color?: string;
  cover_layout?: string;
  font_family?: string;
  sections_config?: Array<{ id: string; title: string; isEnabled: boolean; order: number }>;
  
  // Company / Tenant Branding
  company_name: string;
  company_legal_name?: string;
  company_logo: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_gstin?: string;
  signatory_name?: string;
  signatory_title?: string;
  signature_url?: string;
  company_stamp_url?: string;
  
  // Customer & Site Details
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  project_address: string;
  consumer_number?: string;
  discom?: string;
  billing_unit?: string;
  sanctioned_load?: number;
  tariff_rate?: number;
  current_monthly_bill: number;
  monthly_units?: number;
  roof_area_sqft?: number;
  
  // Technical Specifications
  system_capacity: number; // DC kWp
  inverter_capacity: number; // AC kW
  annual_generation: number;
  system_type: string; // On-grid, Off-grid, Hybrid
  connection_type: string; // Residential, Commercial, Industrial
  phase: string;
  roof_type: string;
  installation_type?: string;
  expected_timeline: string;
  
  // Modules
  panel_brand: string;
  panel_model: string;
  panel_wattage: number;
  panel_quantity: number;
  panel_warranty: string;
  
  // Inverter
  inverter_brand: string;
  inverter_model: string;
  inverter_quantity: number;
  inverter_warranty: string;
  
  // Battery (Hybrid / Off-Grid)
  battery_brand?: string;
  battery_model?: string;
  battery_capacity?: number;
  battery_quantity?: number;
  battery_warranty?: string;
  backup_load_watts?: number;
  
  // Structure & BOS
  structure_brand: string;
  structure_warranty: string;
  
  components: Array<{
    category: string;
    brand: string;
    model: string;
    specification: string;
    quantity: string | number;
    warranty: string;
  }>;
  
  // Scope of Work
  scope_of_supply: Array<{ item: string; status: 'INCLUDED' | 'EXCLUDED' | 'CHARGEABLE' } | string>;
  
  // Commercial Pricing
  pricing: Array<{
    description: string;
    qty: number | string;
    unit?: string;
    unit_price: number;
    tax_rate?: number;
    amount: number;
  }>;
  
  subtotal: number;
  discount: number;
  tax: number;
  taxable_amount?: number;
  cgst?: number;
  sgst?: number;
  grand_total: number;
  indicative_subsidy?: number;
  net_customer_cost?: number;
  commercial_tax_benefit?: number;
  amount_in_words: string;
  
  // Savings & Projections
  estimated_monthly_bill: number;
  annual_savings: number;
  monthly_savings: number;
  payback_period: number;
  lifetime_savings: number;
  lifetime_generation: number;
  
  // Environmental
  co2_reduction: number;
  tree_equivalent: number;
  peak_month: string;
  monthly_generation?: Array<{ month: string; generation: number }>;
  financial_projections?: Array<{
    year: number;
    generationKwh: number;
    grossSavings: number;
    cumulativeSavings: number;
  }>;
  
  // Payment Milestones
  payment_terms: Array<{ percentage: number; amount: number; description: string; stage?: number }>;
  
  // Warranties & Terms
  warranties: {
    modules: string;
    inverter: string;
    structure: string;
    installation: string;
    battery?: string;
    other: string;
  };
  
  exclusions: string[];
  terms_and_conditions: string[];
  
  bank_details?: {
    account_name: string;
    bank_name: string;
    account_number: string;
    ifsc: string;
    upi_id?: string;
  };

  financing_details?: {
    down_payment?: number;
    loan_amount?: number;
    interest_rate?: number;
    tenure_years?: number;
    monthly_emi?: number;
  };
}

/**
 * Map raw database quotation and tenant record to normalized PDF data
 */
export function mapQuotationToPdfData(quotation: any, tenantInfo?: any): QuotationData {
  if (!quotation) return null as any;
  const client = quotation.customer || quotation.lead;
  const tenantName = tenantInfo?.legalName || tenantInfo?.name || quotation.tenant?.legalName || quotation.tenant?.name || "WhereReady Solar OS";
  const tenantPhone = tenantInfo?.phone || quotation.tenant?.phone || "+91 98220 12345";
  const tenantEmail = tenantInfo?.email || quotation.tenant?.email || "contact@wherereadysolar.com";
  const tenantAddress = [
    tenantInfo?.address || quotation.tenant?.address,
    tenantInfo?.city || quotation.tenant?.city,
    tenantInfo?.state || quotation.tenant?.state,
    tenantInfo?.pincode || quotation.tenant?.pincode
  ].filter(Boolean).join(", ") || "MIDC Technology Park, Pune, Maharashtra 411019";

  const clientName = client?.name || "Solar Customer Proposal";
  const clientPhone = client?.mobile || client?.phone || "+91 98XXX XXXXX";
  const clientEmail = client?.email || "customer@example.com";
  const clientAddress = client?.address 
    ? `${client.address}, ${client.city || ''} ${client.state || ''}`.trim()
    : "Maharashtra, India";

  const cap = Number(quotation.systemCapacity) || 5.0;
  const invCap = Number(quotation.inverterCapacity) || cap;
  const annGen = Number(quotation.annualGeneration) || Math.round(cap * 1460);
  const annSav = Number(quotation.annualSavings) || Math.round(annGen * 8.5);
  const grandTotal = Number(quotation.total) || 275000;
  const subtotal = Number(quotation.subtotal) || Math.round(grandTotal / 1.138);
  const tax = Number(quotation.tax) || (grandTotal - subtotal);
  const discount = Number(quotation.discount) || 0;
  const subsidy = Number(quotation.indicativeSubsidy) || 0;

  // Transform raw line items
  const rawItems = Array.isArray(quotation.items) && quotation.items.length > 0 ? quotation.items : [];
  const pricingRows = rawItems.length > 0 
    ? rawItems.map((it: any) => ({
        description: it.description || 'Solar Component / Work',
        qty: it.quantity || 1,
        unit: it.unit || 'NOS',
        unit_price: Number(it.unitPrice) || 0,
        tax_rate: Number(it.taxRate) || 12,
        amount: Number(it.total) || (Number(it.quantity || 1) * Number(it.unitPrice || 0))
      }))
    : [
        { description: `${cap} kWp Solar PV Power Plant Equipment (Tier-1 Modules, Inverter, Structure)`, qty: 1, unit: 'LOT', unit_price: Math.round(subtotal * 0.78), tax_rate: 12, amount: Math.round(subtotal * 0.78) },
        { description: "Turnkey Mechanical & Electrical Installation, Testing & MSEDCL Liasoning", qty: 1, unit: 'LOT', unit_price: subtotal - Math.round(subtotal * 0.78), tax_rate: 18, amount: subtotal - Math.round(subtotal * 0.78) }
      ];

  // Normalized Components Table
  const componentsList = [
    { category: "Solar PV Modules", brand: quotation.panelBrand || "Waaree", model: quotation.panelModel || "550Wp Mono PERC Bifacial", specification: `${quotation.panelWattage || 550}Wp Tier-1 ALMM Listed`, quantity: `${quotation.panelQuantity || Math.ceil((cap * 1000) / 550)} Nos`, warranty: quotation.panelWarranty || "25 Years Performance" },
    { category: "Solar Inverter", brand: quotation.inverterBrand || "Growatt", model: quotation.inverterModel || `${invCap}kW Grid-Tied Inverter`, specification: `${invCap}kW Dual MPPT IP65`, quantity: `${quotation.inverterQuantity || 1} No`, warranty: quotation.inverterWarranty || "10 Years Replacement" },
    ...(quotation.batteryCapacity ? [{ category: "Battery Storage", brand: quotation.batteryBrand || "Tata Power", model: quotation.batteryModel || `${quotation.batteryCapacity}kWh LiFePO4`, specification: `${quotation.batteryCapacity}kWh 51.2V Wall Mount`, quantity: `${quotation.batteryQuantity || 1} No`, warranty: quotation.batteryWarranty || "10 Years Warranty" }] : []),
    { category: "Mounting Structure", brand: quotation.structureBrand || "Apex HDG High Rise", model: "HDG Rooftop", specification: "Hot-Dip Galvanized (80µm) / Anodized Al", quantity: "1 Lot", warranty: quotation.structureWarranty || "10 Years Structural" },
    { category: "Solar DC Cable", brand: "Polycab / LAPP", model: "4 sq.mm", specification: "TUV Certified UV Protected XLPE", quantity: "1 Lot", warranty: "Standard OEM" },
    { category: "AC & DC Distribution", brand: "Schneider / L&T", model: "ACDB / DCDB", specification: "IP65 Enclosure with Type-II SPD & MCB", quantity: "1 Set", warranty: "1 Year" },
    { category: "Earthing & Protection", brand: "SafeGrid", model: "Chemical Dual Pit", specification: "Copper Bonded Electrodes + LA Down Conductor", quantity: "1 Set", warranty: "5 Years" }
  ];

  const templateCode = quotation.template?.code || quotation.templateType || 'residential_proposal';
  const primaryColor = quotation.designConfig?.primaryColor || quotation.template?.primaryColor || "#0284c7";
  const accentColor = quotation.designConfig?.accentColor || quotation.template?.accentColor || "#059669";
  const coverLayout = quotation.designConfig?.coverLayout || quotation.template?.coverLayout || "MODERN_FULL";
  const fontFamily = quotation.designConfig?.fontFamily || quotation.template?.fontFamily || "Inter";

  return {
    quotation_number: quotation.qNumber || `QT-${new Date().getFullYear()}-001`,
    quotation_date: quotation.date ? new Date(quotation.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
    valid_until: `${quotation.validityDays || 15} Days`,
    status: quotation.status || 'DRAFT',
    template_type: templateCode,
    primary_color: primaryColor,
    accent_color: accentColor,
    cover_layout: coverLayout,
    font_family: fontFamily,
    sections_config: quotation.sectionsConfig || quotation.template?.sections || null,

    company_name: tenantName,
    company_legal_name: tenantInfo?.legalName || tenantName,
    company_logo: tenantInfo?.logoUrl || quotation.tenant?.logoUrl || "",
    company_address: tenantAddress,
    company_phone: tenantPhone,
    company_email: tenantEmail,
    company_website: "www.wherereadysolar.com",
    company_gstin: tenantInfo?.gstin || quotation.tenant?.gstin || "27AAECW1234F1Z5",
    signatory_name: quotation.template?.signatoryName || "Authorized Signatory",
    signatory_title: quotation.template?.signatoryTitle || "Head - Solar EPC & Liasoning",
    signature_url: tenantInfo?.signatureUrl || quotation.template?.signatureUrl || "",
    company_stamp_url: quotation.template?.companyStampUrl || "",

    customer_name: clientName,
    customer_phone: clientPhone,
    customer_email: clientEmail,
    project_address: clientAddress,
    consumer_number: quotation.consumerNumber || client?.consumerNumber || undefined,
    discom: quotation.discom || "MSEDCL (Mahavitaran)",
    billing_unit: quotation.billingUnit || "4100",
    sanctioned_load: quotation.sanctionedLoad || cap,
    tariff_rate: quotation.tariffRate || (quotation.connectionType === 'Commercial' ? 10.5 : 8.5),
    current_monthly_bill: quotation.monthlyBill || Math.round(cap * 120 * 8.5),
    monthly_units: quotation.monthlyUnits || Math.round((quotation.monthlyBill || (cap * 120 * 8.5)) / 8.5),
    roof_area_sqft: quotation.roofAreaSqFt || Math.round(cap * 65),

    system_capacity: cap,
    inverter_capacity: invCap,
    annual_generation: annGen,
    system_type: quotation.systemType || "On-grid",
    connection_type: quotation.connectionType || "Residential",
    phase: quotation.phase || "Single Phase",
    roof_type: quotation.roofType || "RCC Flat Roof",
    expected_timeline: "14–21 Working Days",

    panel_brand: quotation.panelBrand || "Waaree",
    panel_model: quotation.panelModel || "550Wp Mono PERC Bifacial",
    panel_wattage: quotation.panelWattage || 550,
    panel_quantity: quotation.panelQuantity || Math.ceil((cap * 1000) / (quotation.panelWattage || 550)),
    panel_warranty: quotation.panelWarranty || "25 Years Performance",

    inverter_brand: quotation.inverterBrand || "Growatt",
    inverter_model: quotation.inverterModel || `${invCap}kW Grid-Tied Inverter`,
    inverter_quantity: quotation.inverterQuantity || 1,
    inverter_warranty: quotation.inverterWarranty || "10 Years Replacement",

    battery_brand: quotation.batteryBrand,
    battery_model: quotation.batteryModel,
    battery_capacity: quotation.batteryCapacity,
    battery_quantity: quotation.batteryQuantity,
    battery_warranty: quotation.batteryWarranty,
    backup_load_watts: quotation.backupLoadWatts,

    structure_brand: quotation.structureBrand || "Galvanized HDG High Rise",
    structure_warranty: quotation.structureWarranty || "10 Years Structural",

    components: componentsList,
    scope_of_supply: quotation.scopeOfSupply || quotation.template?.defaultScope || [
      { item: "Detailed Technical Site Feasibility & Shadow Analysis Survey", status: "INCLUDED" },
      { item: `Supply of ${cap} kWp Tier-1 Solar PV Modules (${quotation.panelBrand || 'Waaree'})`, status: "INCLUDED" },
      { item: `Supply of ${invCap} kW High-Efficiency Inverter (${quotation.inverterBrand || 'Growatt'})`, status: "INCLUDED" },
      { item: "Hot-Dip Galvanized (HDG) / Aluminum Module Mounting Structure", status: "INCLUDED" },
      { item: "UV-Protected 4 sq.mm DC Solar Cables & Conduits", status: "INCLUDED" },
      { item: "ACDB & DCDB Distribution Boxes with Type-II SPDs", status: "INCLUDED" },
      { item: "Maintenance-Free Dual Chemical Earthing Kit & LA", status: "INCLUDED" },
      { item: "Turnkey Mechanical & Electrical Installation & Termination", status: "INCLUDED" },
      { item: "State DISCOM Net Metering Liasoning & Commissioning Coordination", status: "INCLUDED" },
      { item: "Civil Masonry Structural Alteration or Roof Waterproofing", status: "EXCLUDED" },
      { item: "Statutory DISCOM Net Meter Testing & Registration Fees (Actuals)", status: "EXCLUDED" },
      { item: "Additional AC Cabling Exceeding 25 Meters from Inverter to LT Panel", status: "CHARGEABLE" }
    ],

    pricing: pricingRows,
    subtotal,
    discount,
    tax,
    taxable_amount: Math.max(0, subtotal - discount),
    cgst: Math.round(tax / 2),
    sgst: tax - Math.round(tax / 2),
    grand_total: grandTotal,
    indicative_subsidy: subsidy,
    net_customer_cost: Math.max(0, grandTotal - subsidy),
    commercial_tax_benefit: (quotation.connectionType === 'Commercial' || quotation.connectionType === 'Industrial') ? Math.round(grandTotal * 0.40 * 0.2517) : 0,
    amount_in_words: toIndianWords(grandTotal),

    estimated_monthly_bill: Math.max(450, Math.round((quotation.monthlyBill || 4500) - (annSav / 12))),
    annual_savings: annSav,
    monthly_savings: Math.round(annSav / 12),
    payback_period: quotation.paybackYears || Number((Math.max(0, grandTotal - subsidy) / Math.max(1, annSav)).toFixed(1)),
    lifetime_savings: Math.round(annSav * 25 * 1.3),
    lifetime_generation: Math.round(annGen * 25 * 0.92),

    co2_reduction: Math.round(annGen * 0.82),
    tree_equivalent: Math.round((annGen * 0.82) / 20),
    peak_month: "May",

    payment_terms: quotation.paymentMilestones || [
      { stage: 1, percentage: 20, amount: Math.round(grandTotal * 0.2), description: "Advance booking along with signed work order" },
      { stage: 2, percentage: 60, amount: Math.round(grandTotal * 0.6), description: "Upon delivery of panels, inverter & structure at site" },
      { stage: 3, percentage: 15, amount: Math.round(grandTotal * 0.15), description: "Upon mechanical mounting & electrical installation completion" },
      { stage: 4, percentage: 5, amount: Math.round(grandTotal * 0.05), description: "Upon DISCOM Net Metering inspection & grid synchronization" }
    ],

    warranties: quotation.warranties || {
      modules: quotation.panelWarranty || "25 Years OEM Performance",
      inverter: quotation.inverterWarranty || "10 Years Replacement Warranty",
      structure: quotation.structureWarranty || "10 Years Structural Integrity",
      installation: "5 Years Workmanship Guarantee",
      other: "OEM Standard Terms"
    },

    exclusions: quotation.exclusions || [
      "Statutory DISCOM meter testing and processing charges payable directly to utility.",
      "Civil masonry repairs, structural reinforcement, or roof waterproofing.",
      "Sanctioned load extension or tariff alteration application charges."
    ],

    terms_and_conditions: quotation.termsAndConditions || [
      `Quotation Validity: This commercial proposal is valid for ${quotation.validityDays || 15} days from date of issue.`,
      "Central Government Subsidy (PM Surya Ghar) is an indicative estimate and is credited directly to the consumer account via DBT post-commissioning.",
      "Net Metering: Net metering feasibility and approvals are governed by State DISCOM regulations and local transformer load capacity.",
      "Customer Responsibilities: Rooftop access, water supply for cleaning, and grid electrical power during installation are customer obligations."
    ],

    bank_details: quotation.bankDetails || {
      account_name: tenantName,
      bank_name: "HDFC Bank Ltd",
      account_number: "50200088991234",
      ifsc: "HDFC0001234",
      upi_id: "solar@upi"
    },

    financing_details: quotation.financingDetails || {
      down_payment: Math.round(grandTotal * 0.2),
      loan_amount: Math.round(grandTotal * 0.8),
      interest_rate: 9.5,
      tenure_years: 5,
      monthly_emi: Math.round(((grandTotal * 0.8) * (0.095 / 12) * Math.pow(1 + 0.095 / 12, 60)) / (Math.pow(1 + 0.095 / 12, 60) - 1))
    }
  };
}

/**
 * Universal PDF Generator using html2pdf with A4 print styling
 */
export const generatePDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`generatePDF: Element #${elementId} not found in DOM.`);
    return;
  }
  
  // Patch window.getComputedStyle to avoid modern CSS color crashes in html2canvas
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(el, pseudoElt) {
    const style = originalGetComputedStyle.call(window, el, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        let value = (target as any)[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        if (typeof value === 'string' && (value.includes('lab(') || value.includes('oklch(') || value.includes('color('))) {
          if (prop === 'color' || prop === 'backgroundColor') return 'rgb(15, 23, 42)';
          return 'rgba(0, 0, 0, 0)'; 
        }
        return value;
      }
    });
  };

  const opt = {
    margin: [0, 0, 0, 0],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] }
  };

  try {
    let html2pdf: any;
    try {
      const mod = await import("html2pdf.js");
      html2pdf = mod.default || mod;
    } catch {
      const _html2pdf = require("html2pdf.js");
      html2pdf = _html2pdf.default || _html2pdf;
    }
    return await html2pdf().set(opt).from(element).save();
  } catch (err: any) {
    console.error("PDF generation error:", err);
    throw err;
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
};

/**
 * Clean Single Page Wrapper for strict A4 dimensions
 */
const A4Page = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <div 
    id={id}
    className={`w-[210mm] min-h-[297mm] relative overflow-hidden flex flex-col justify-between bg-white text-slate-800 p-12 print:p-8 border border-slate-200 shadow-sm print:shadow-none print:border-none mb-6 print:mb-0 print:break-after-page ${className}`}
    style={{ boxSizing: 'border-box' }}
  >
    {children}
  </div>
);

/**
 * Standard Header Component
 */
const PageHeader = ({ data, title, sectionNum }: { data: QuotationData; title: string; sectionNum?: string }) => (
  <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
    <div className="flex items-center gap-3">
      {data.company_logo ? (
        <img src={data.company_logo} alt={data.company_name} className="h-8 object-contain" />
      ) : (
        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
          <Sun className="w-5 h-5" />
        </div>
      )}
      <div>
        <div className="text-xs font-bold text-slate-900 tracking-wider uppercase">{data.company_name}</div>
        <div className="text-[10px] text-slate-500">{data.company_email} • {data.company_phone}</div>
      </div>
    </div>
    
    <div className="text-right">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 justify-end">
        {sectionNum && <span className="text-blue-600 font-mono">[{sectionNum}]</span>}
        {title}
      </div>
      <div className="text-[10px] font-mono text-slate-500">Ref: {data.quotation_number} • {data.quotation_date}</div>
    </div>
  </div>
);

/**
 * Standard Running Footer Component
 */
const PageFooter = ({ data, pageNum }: { data: QuotationData; pageNum: number }) => (
  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 mt-auto">
    <div>
      <span className="font-bold text-slate-700">{data.company_legal_name || data.company_name}</span>
      {data.company_gstin && <span> • GSTIN: {data.company_gstin}</span>}
    </div>
    <div className="font-mono">
      Quotation #{data.quotation_number} • Page {pageNum}
    </div>
  </div>
);

/**
 * Master Quotation PDF Component
 * Renders all 9 standard sections dynamically with tenant colors and conditional logic.
 */
export function QuotationPDF({ data, livePreview = false }: { data: QuotationData; livePreview?: boolean }) {
  if (!data) return null;

  const isQuickQuote = data.template_type === 'quick_quote';
  const isHybridOrOffgrid = data.system_type === 'Hybrid' || data.system_type === 'Off-grid';
  const isCommercial = data.connection_type === 'Commercial' || data.connection_type === 'Industrial';

  // Section visibility check based on template sections config
  const isSectionEnabled = (secId: string) => {
    if (!data.sections_config || data.sections_config.length === 0) return true;
    const found = data.sections_config.find(s => s.id === secId);
    return found ? found.isEnabled : true;
  };

  let currentPage = 1;

  return (
    <div 
      className="mx-auto font-sans text-slate-800 bg-slate-100 p-4 print:p-0 print:bg-white" 
      style={{ width: "210mm" }}
    >
      
      {/* ========================================================================= */}
      {/* SECTION 1: COVER PAGE                                                     */}
      {/* ========================================================================= */}
      {isSectionEnabled('cover') && (
        <A4Page className="bg-slate-900 text-white relative flex flex-col justify-between p-14">
          {/* BACKGROUND ROOFTOP PHOTO WITH GRADIENT OVERLAY */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/assets/solar-quotation/cover.jpg" 
              alt="Rooftop Solar" 
              className="w-full h-full object-cover opacity-35" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
          </div>

          {/* COVER HEADER */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-6">
            <div className="flex items-center gap-3">
              {data.company_logo ? (
                <img src={data.company_logo} alt={data.company_name} className="h-10 object-contain" />
              ) : (
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                  <Sun className="w-7 h-7" />
                </div>
              )}
              <div>
                <h2 className="text-base font-bold tracking-wider uppercase text-white">{data.company_name}</h2>
                <p className="text-[11px] text-slate-300">{data.company_address}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                EPC Proposal
              </span>
            </div>
          </div>

          {/* COVER HERO CONTENT */}
          <div className="relative z-10 py-12">
            <p className="text-emerald-400 font-bold tracking-[0.2em] text-xs uppercase mb-3">
              Your Journey to Smarter, Cleaner Energy
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-8">
              ROOFTOP SOLAR PV<br />
              <span className="text-blue-400">ENGINEERING PROPOSAL</span>
            </h1>

            {/* CAPACITY BADGE */}
            <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl mb-12">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">
                  {data.system_capacity} <span className="text-lg font-normal text-slate-300">kWp</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {data.system_type} Solar System • {data.connection_type} Connection
                </div>
              </div>
            </div>

            {/* CLIENT CARD */}
            <div className="p-6 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/15 max-w-lg">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
                Prepared Exclusively For
              </div>
              <div className="text-xl font-bold text-white mb-1">{data.customer_name}</div>
              <div className="text-xs text-slate-300 flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{data.project_address}</span>
              </div>
              {data.consumer_number && (
                <div className="text-[11px] font-mono text-emerald-300 mt-2 pt-2 border-t border-white/10">
                  DISCOM Account: {data.consumer_number} ({data.discom || 'MSEDCL'})
                </div>
              )}
            </div>
          </div>

          {/* COVER FOOTER */}
          <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/20 text-xs text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Proposal Number</span>
              <span className="font-bold font-mono text-white text-sm">{data.quotation_number}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Issuance Date</span>
              <span className="font-semibold text-white">{data.quotation_date}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Quotation Validity</span>
              <span className="font-semibold text-emerald-300">{data.valid_until}</span>
            </div>
          </div>
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: CUSTOMER REQUIREMENTS & AUDIT (Not in quick quote)             */}
      {/* ========================================================================= */}
      {!isQuickQuote && isSectionEnabled('requirements') && (
        <A4Page>
          <div>
            <PageHeader data={data} title="Customer Requirements & Energy Audit" sectionNum="02" />
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Site Baseline & Energy Consumption Audit</h2>
              <p className="text-xs text-slate-500">
                Detailed site audit based on consumer utility records and existing electricity bill analysis.
              </p>
            </div>

            {/* AUDIT SUMMARY STATS */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Bill</div>
                <div className="text-lg font-bold text-slate-900">₹{formatINR(data.current_monthly_bill)}/mo</div>
                <div className="text-[10px] text-slate-500">₹{formatINR(data.current_monthly_bill * 12)}/yr</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg. Monthly Units</div>
                <div className="text-lg font-bold text-slate-900">{data.monthly_units || Math.round(data.current_monthly_bill / 8.5)} kWh</div>
                <div className="text-[10px] text-slate-500">~{Math.round((data.monthly_units || 400) * 12)} kWh/yr</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Utility Tariff</div>
                <div className="text-lg font-bold text-slate-900">₹{data.tariff_rate || 8.5}/unit</div>
                <div className="text-[10px] text-slate-500">{data.connection_type} Slab</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Roof Area</div>
                <div className="text-lg font-bold text-blue-600">{data.roof_area_sqft || Math.round(data.system_capacity * 65)} sq.ft.</div>
                <div className="text-[10px] text-slate-500">Shadow-Free Area</div>
              </div>
            </div>

            {/* SITE & CONSUMER SPECIFICATIONS TABLE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Parameter</th>
                    <th className="px-4 py-2.5 text-left">Consumer / Site Record</th>
                    <th className="px-4 py-2.5 text-left">Solar EPC Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">Client / Consumer Name</td>
                    <td className="px-4 py-2.5">{data.customer_name}</td>
                    <td className="px-4 py-2.5 text-emerald-700 font-medium">Verified against Utility Bill</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">DISCOM & Billing Unit</td>
                    <td className="px-4 py-2.5">{data.discom || 'MSEDCL (Mahavitaran)'} • BU: {data.billing_unit || '4100'}</td>
                    <td className="px-4 py-2.5 text-emerald-700 font-medium">Eligible for Net Metering</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">Consumer Account No.</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{data.consumer_number || 'To be updated'}</td>
                    <td className="px-4 py-2.5">Mapped to PM Surya Ghar National Portal</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">Sanctioned Load</td>
                    <td className="px-4 py-2.5">{data.sanctioned_load || data.system_capacity} kW ({data.phase})</td>
                    <td className="px-4 py-2.5">{data.system_capacity <= (data.sanctioned_load || 5) ? 'Within sanctioned capacity' : 'Load enhancement recommended'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">Roof Surface & Pitch</td>
                    <td className="px-4 py-2.5">{data.roof_type}</td>
                    <td className="px-4 py-2.5">South orientation, 12°–15° optimal tilt</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CUSTOMER OBJECTIVES & VALUE PROPOSITION */}
            <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" /> Key Project Objectives
              </h3>
              <div className="grid grid-cols-3 gap-3 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Reduce monthly grid electricity expenses by up to 85%–90%.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Avail Central PM Surya Ghar direct bank benefit (DBT).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Protect property from future annual grid electricity tariff hikes.</span>
                </div>
              </div>
            </div>
          </div>
          
          <PageFooter data={data} pageNum={++currentPage} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: RECOMMENDED SOLAR SOLUTION & HARDWARE                          */}
      {/* ========================================================================= */}
      {isSectionEnabled('solution') && (
        <A4Page>
          <div>
            <PageHeader data={data} title="Recommended Solar System Architecture" sectionNum="03" />

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {data.system_capacity} kWp {data.system_type} Solar Power Plant
              </h2>
              <p className="text-xs text-slate-500">
                Tier-1 ALMM-listed solar PV modules, high-efficiency MPPT inverter, and rugged galvanized structure.
              </p>
            </div>

            {/* KEY TECHNICAL KPI CARDS */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">DC Plant Capacity</div>
                <div className="text-xl font-extrabold text-blue-900">{data.system_capacity} kWp</div>
                <div className="text-[10px] text-blue-600">{data.panel_quantity} × {data.panel_wattage}Wp Panels</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">AC Inverter Rating</div>
                <div className="text-xl font-extrabold text-slate-900">{data.inverter_capacity} kW</div>
                <div className="text-[10px] text-slate-500">{data.phase} Grid-Tied</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Est. Annual Yield</div>
                <div className="text-xl font-extrabold text-emerald-900">{data.annual_generation.toLocaleString()} kWh</div>
                <div className="text-[10px] text-emerald-600">~{Math.round(data.annual_generation / 12)} kWh / Month</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Warranty Shield</div>
                <div className="text-xl font-extrabold text-slate-900">25 Years</div>
                <div className="text-[10px] text-slate-500">Linear Performance</div>
              </div>
            </div>

            {/* HARDWARE SPECIFICATION CARDS */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* MODULE CARD */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Solar PV Modules</span>
                    <h3 className="text-sm font-bold text-slate-900">{data.panel_brand} {data.panel_wattage}Wp</h3>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1 mt-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Technology:</span>
                    <span className="font-semibold text-slate-800">{data.panel_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantity & Rating:</span>
                    <span className="font-semibold text-slate-800">{data.panel_quantity} Modules ({data.panel_wattage}Wp each)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ALMM Status:</span>
                    <span className="font-semibold text-emerald-700">Approved & DCR Compliant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Performance Warranty:</span>
                    <span className="font-semibold text-slate-800">{data.panel_warranty}</span>
                  </div>
                </div>
              </div>

              {/* INVERTER CARD */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Grid Inverter</span>
                    <h3 className="text-sm font-bold text-slate-900">{data.inverter_brand} {data.inverter_capacity}kW</h3>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1 mt-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model & Rating:</span>
                    <span className="font-semibold text-slate-800">{data.inverter_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">MPPT & Efficiency:</span>
                    <span className="font-semibold text-slate-800">Dual MPPT, &gt;98.4% Peak Efficiency</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Protection Rating:</span>
                    <span className="font-semibold text-slate-800">IP65 (Outdoor Weatherproof)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Warranty:</span>
                    <span className="font-semibold text-slate-800">{data.inverter_warranty}</span>
                  </div>
                </div>
              </div>

              {/* BATTERY STORAGE CARD (IF HYBRID) */}
              {isHybridOrOffgrid && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                      <Battery className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Energy Storage System</span>
                      <h3 className="text-sm font-bold text-slate-900">{data.battery_brand || 'Tata Power'} {data.battery_capacity || 5}kWh LiFePO4</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-700 mt-2 pt-2 border-t border-amber-200">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Storage Capacity</span>
                      <span className="font-bold">{data.battery_capacity || 5} kWh ({data.battery_quantity || 1} Unit)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Backup Load Support</span>
                      <span className="font-bold">{data.backup_load_watts || 3000} Watts (Lights, Fans, Refrigerator, WiFi)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Battery Life Warranty</span>
                      <span className="font-bold">{data.battery_warranty || '10 Years / 6000 Cycles'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STRUCTURE & BOS CARD */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mounting Structure & Balance of System (BOS)</span>
                    <h3 className="text-sm font-bold text-slate-900">{data.structure_brand}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-slate-700 mt-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Rooftop Structure</span>
                    <span className="font-semibold">Hot-Dip Galvanized (80µm) / SS304 Fasteners</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">DC & AC Cabling</span>
                    <span className="font-semibold">Polycab TUV Certified 4 sq.mm UV XLPE</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Protection Devices</span>
                    <span className="font-semibold">Type-II Surge Arresters (SPD) & Dual Chemical Earthing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MONTHLY GENERATION CHART / TABLE PREVIEW */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Monthly Solar Generation Curve (Western/Central India Solar Irradiance Profile)</span>
                <span className="text-blue-600 font-semibold">Peak: May (10.6%)</span>
              </div>
              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                {['Jan: 600', 'Mar: 715', 'May: 775', 'Jul: 445', 'Sep: 555', 'Nov: 615'].map((m, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200">
                    <div className="font-mono text-slate-800 font-semibold">{m}</div>
                    <div className="text-[9px] text-slate-400">kWh</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <PageFooter data={data} pageNum={++currentPage} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: SAVINGS ANALYSIS & FINANCIAL ROI                               */}
      {/* ========================================================================= */}
      {isSectionEnabled('savings') && (
        <A4Page>
          <div>
            <PageHeader data={data} title="Solar Generation & Financial Economics" sectionNum="04" />

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Financial Analysis & Projected Savings</h2>
              <p className="text-xs text-slate-500">
                Detailed return on investment, payback period, and 25-year cumulative savings projections.
              </p>
            </div>

            {/* SAVINGS HIGHLIGHTS */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Year 1 Net Savings</div>
                <div className="text-2xl font-black text-emerald-900">₹{formatINR(data.annual_savings)}</div>
                <div className="text-[11px] text-emerald-700 font-medium">₹{formatINR(data.monthly_savings)} / month</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Estimated Payback Period</div>
                <div className="text-2xl font-black text-blue-900">{data.payback_period} Years</div>
                <div className="text-[11px] text-blue-700 font-medium">Break-even on net investment</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">25-Year Lifetime Savings</div>
                <div className="text-2xl font-black text-slate-900">₹{formatINR(data.lifetime_savings)}</div>
                <div className="text-[11px] text-slate-500">Compounding @ 3% tariff hike</div>
              </div>
            </div>

            {/* 25-YEAR CUMULATIVE FINANCIAL PROJECTION TABLE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>25-Year Milestone Financial Projections</span>
                <span className="text-[11px] font-normal text-slate-500">Assumes 0.7% degradation & 3% tariff inflation</span>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Year</th>
                    <th className="px-4 py-2">Est. Generation</th>
                    <th className="px-4 py-2">Grid Tariff (₹/u)</th>
                    <th className="px-4 py-2">Annual Savings</th>
                    <th className="px-4 py-2 text-right">Cumulative Net Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {[
                    { yr: 'Year 1', gen: data.annual_generation, rate: data.tariff_rate || 8.5, ann: data.annual_savings, cum: data.annual_savings },
                    { yr: 'Year 3', gen: Math.round(data.annual_generation * 0.98), rate: Number(((data.tariff_rate || 8.5) * 1.06).toFixed(2)), ann: Math.round(data.annual_savings * 1.04), cum: Math.round(data.annual_savings * 3.08) },
                    { yr: 'Year 5 (Payback)', gen: Math.round(data.annual_generation * 0.96), rate: Number(((data.tariff_rate || 8.5) * 1.12).toFixed(2)), ann: Math.round(data.annual_savings * 1.08), cum: Math.round(data.annual_savings * 5.3) },
                    { yr: 'Year 10', gen: Math.round(data.annual_generation * 0.93), rate: Number(((data.tariff_rate || 8.5) * 1.30).toFixed(2)), ann: Math.round(data.annual_savings * 1.21), cum: Math.round(data.annual_savings * 11.5) },
                    { yr: 'Year 15', gen: Math.round(data.annual_generation * 0.90), rate: Number(((data.tariff_rate || 8.5) * 1.51).toFixed(2)), ann: Math.round(data.annual_savings * 1.36), cum: Math.round(data.annual_savings * 18.2) },
                    { yr: 'Year 25', gen: Math.round(data.annual_generation * 0.84), rate: Number(((data.tariff_rate || 8.5) * 2.03).toFixed(2)), ann: Math.round(data.annual_savings * 1.71), cum: data.lifetime_savings }
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                      <td className="px-4 py-2 font-bold text-slate-900 font-sans">{row.yr}</td>
                      <td className="px-4 py-2">{row.gen.toLocaleString()} kWh</td>
                      <td className="px-4 py-2">₹{row.rate}</td>
                      <td className="px-4 py-2 font-semibold text-emerald-700">₹{formatINR(row.ann)}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-900">₹{formatINR(row.cum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PM SURYA GHAR SUBSIDY OR COMMERCIAL DEPRECIATION */}
            {data.connection_type === 'Residential' && data.indicative_subsidy && data.indicative_subsidy > 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    PM Surya Ghar Muft Bijli Yojana — Indicative Central Subsidy
                  </div>
                  <span className="text-sm font-black text-emerald-800 font-mono">
                    ₹{formatINR(data.indicative_subsidy)}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Under the central scheme, eligible individual residential consumers receive direct bank transfer (DBT) 
                  credited by MNRE/DISCOM directly into the consumer's bank account following successful commissioning and inspection.
                </p>
              </div>
            ) : isCommercial ? (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Commercial Accelerated Depreciation Benefit (Section 32)
                  </div>
                  <span className="text-sm font-black text-blue-800 font-mono">
                    ₹{formatINR(data.commercial_tax_benefit || 0)} Tax Write-Off
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Indian Income Tax Act Section 32 allows commercial & industrial entities to claim 40% accelerated depreciation 
                  on the capital cost of solar rooftop installations in Year 1, significantly improving business cash flows.
                </p>
              </div>
            ) : null}

            {/* SOLAR EMI FINANCING COMPARISON */}
            {data.financing_details && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Solar Loan Option: Positive Cash Flow from Day 1</span>
                  <span className="text-blue-600">@ 9.5% p.a. • 5 Years Tenure</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Monthly Solar Savings:</span>
                    <span className="font-bold text-emerald-700 text-sm">₹{formatINR(data.monthly_savings)}/mo</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Estimated Monthly EMI:</span>
                    <span className="font-bold text-slate-800 text-sm">₹{formatINR(data.financing_details.monthly_emi || 4500)}/mo</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Net Monthly Gain:</span>
                    <span className="font-bold text-blue-700 text-sm">
                      +₹{formatINR(Math.max(0, data.monthly_savings - (data.financing_details.monthly_emi || 4500)))}/mo
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <PageFooter data={data} pageNum={++currentPage} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: DETAILED COMMERCIAL QUOTATION (BILL OF QUANTITIES & TAXES)    */}
      {/* ========================================================================= */}
      {isSectionEnabled('pricing') && (
        <A4Page>
          <div>
            <PageHeader data={data} title="Commercial Quotation & Bill of Quantities" sectionNum="05" />

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Itemized Commercial Quotation</h2>
              <p className="text-xs text-slate-500">
                Transparent itemized bill of quantities with tax rates, statutory GST breakdown, and payment totals.
              </p>
            </div>

            {/* ITEMIZED TABLE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-10">#</th>
                    <th className="px-4 py-2.5 text-left">Product / Service Description</th>
                    <th className="px-3 py-2.5 text-center w-16">Qty</th>
                    <th className="px-3 py-2.5 text-center w-14">Unit</th>
                    <th className="px-4 py-2.5 text-right w-24">Rate (₹)</th>
                    <th className="px-3 py-2.5 text-center w-14">GST</th>
                    <th className="px-4 py-2.5 text-right w-28">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.pricing.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{item.description}</td>
                      <td className="px-3 py-2.5 text-center font-mono">{item.qty}</td>
                      <td className="px-3 py-2.5 text-center text-slate-500">{item.unit || 'NOS'}</td>
                      <td className="px-4 py-2.5 text-right font-mono">₹{formatINR(item.unit_price)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500">{item.tax_rate || 12}%</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">₹{formatINR(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS & TAX BREAKDOWN */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-1">Amount Payable in Words:</div>
                  <div className="text-xs font-bold text-blue-900 tracking-wide uppercase leading-relaxed">
                    {data.amount_in_words}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                  Statutory Note: Prices are inclusive of GST. Central / State subsidies are credited directly 
                  by the Government to the consumer's bank account via Direct Benefit Transfer (DBT).
                </div>
              </div>

              {/* CALCULATION SUMMARY BOX */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">Subtotal (Pre-Tax):</span>
                  <span>₹{formatINR(data.subtotal)}</span>
                </div>
                {data.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="font-sans">Commercial Discount:</span>
                    <span>-₹{formatINR(data.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">Taxable Value:</span>
                  <span>₹{formatINR(data.taxable_amount || (data.subtotal - data.discount))}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">CGST / SGST (Solar Composite):</span>
                  <span>₹{formatINR(data.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
                  <span className="font-sans">Final Project Total:</span>
                  <span className="text-blue-700">₹{formatINR(data.grand_total)}</span>
                </div>
                {data.indicative_subsidy && data.indicative_subsidy > 0 ? (
                  <>
                    <div className="flex justify-between text-emerald-700 pt-1">
                      <span className="font-sans font-semibold">Less: Indicative Subsidy (PM Surya Ghar):</span>
                      <span className="font-semibold">-₹{formatINR(data.indicative_subsidy)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-emerald-900 pt-1 border-t border-emerald-200">
                      <span className="font-sans font-bold">Estimated Net Outflow:</span>
                      <span className="text-emerald-800">₹{formatINR(data.net_customer_cost || (data.grand_total - data.indicative_subsidy))}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* MILESTONE PAYMENT SCHEDULE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Standard Payment Milestone Schedule</span>
                <span className="text-[11px] font-normal text-slate-500">100% Milestone Linked Execution</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {data.payment_terms.map((ms, idx) => (
                  <div key={idx} className="px-4 py-2.5 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-800 font-medium">{ms.description}</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">{ms.percentage}%</span>
                      <span className="font-mono font-bold text-slate-900 w-24">₹{formatINR(ms.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <PageFooter data={data} pageNum={++currentPage} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: SCOPE OF WORK (Not in quick quote)                             */}
      {/* ========================================================================= */}
      {!isQuickQuote && isSectionEnabled('scope') && (
        <A4Page>
          <div>
            <PageHeader data={data} title="Scope of Work & EPC Deliverables" sectionNum="06" />

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Turnkey Scope of Work & Boundaries</h2>
              <p className="text-xs text-slate-500">
                Clear allocation of EPC deliverables, statutory agency coordination, and customer responsibilities.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {data.scope_of_supply.map((sc: any, idx: number) => {
                const text = typeof sc === 'string' ? sc : sc.item;
                const status = typeof sc === 'string' ? 'INCLUDED' : (sc.status || 'INCLUDED');
                return (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-800 font-medium">{text}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider shrink-0 uppercase ${
                      status === 'INCLUDED' ? 'bg-emerald-100 text-emerald-800' :
                      status === 'EXCLUDED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CUSTOMER RESPONSIBILITIES */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" /> Customer Site Obligations
              </h3>
              <ul className="space-y-1.5 text-slate-600 text-xs list-disc list-inside">
                <li>Provide unhindered, safe rooftop access for EPC engineers, workers, and materials.</li>
                <li>Ensure dedicated water supply line at rooftop with sufficient pressure for regular module cleaning.</li>
                <li>Provide single or three-phase electrical power supply at site during mounting and testing.</li>
                <li>Cooperate with statutory DISCOM meter testing and verification officers during physical site visit.</li>
              </ul>
            </div>
          </div>

          <PageFooter data={data} pageNum={++currentPage} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7 & 8: WARRANTIES, TERMS & CONDITIONS                            */}
      {/* ========================================================================= */}
      {isSectionEnabled('warranty') && (
        <A4Page>
          <div>
            <PageHeader data={data} title="Warranty Guarantees & Commercial Terms" sectionNum="07" />

            {/* WARRANTIES GRID */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Equipment Warranties & Service Commitments</h2>
              <p className="text-xs text-slate-500 mb-4">
                Backed directly by Tier-1 OEM manufacturers and our certified EPC workmanship warranty.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Solar PV Modules</span>
                  </div>
                  <div className="text-sm font-bold text-blue-800">{data.warranties.modules}</div>
                  <div className="text-[11px] text-slate-500">10-12 Yr Product + 25 Yr Performance Guarantee</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Solar Grid Inverter</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-800">{data.warranties.inverter}</div>
                  <div className="text-[11px] text-slate-500">Standard OEM replacement warranty against manufacturing defects</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-900">Mounting Structure</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800">{data.warranties.structure}</div>
                  <div className="text-[11px] text-slate-500">Structural integrity, wind resistance up to 150 km/h</div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900">Workmanship Guarantee</span>
                  </div>
                  <div className="text-sm font-bold text-amber-800">{data.warranties.installation}</div>
                  <div className="text-[11px] text-slate-500">Comprehensive wiring, termination & mechanical integrity support</div>
                </div>
              </div>
            </div>

            {/* COMMERCIAL TERMS & CONDITIONS */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" /> Commercial Terms & Conditions
              </h3>
              <div className="space-y-1.5 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700">
                {data.terms_and_conditions.map((term, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 shrink-0">•</span>
                    <span className="leading-relaxed">{term}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BANK DETAILS */}
            {data.bank_details && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Official EPC Bank Account Details for NEFT / RTGS
                </div>
                <div className="grid grid-cols-4 gap-2 text-slate-700 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans">Beneficiary:</span>
                    <span className="font-bold text-slate-900">{data.bank_details.account_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans">Bank Name:</span>
                    <span>{data.bank_details.bank_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans">Account No:</span>
                    <span className="font-bold text-blue-700">{data.bank_details.account_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans">IFSC Code:</span>
                    <span className="font-bold">{data.bank_details.ifsc}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <PageFooter data={data} pageNum={++currentPage} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* SECTION 9: CLIENT ACCEPTANCE & WORK ORDER AUTHORIZATION                   */}
      {/* ========================================================================= */}
      {isSectionEnabled('acceptance') && (
        <A4Page>
          <div>
            <PageHeader data={data} title="Acceptance & Work Order Confirmation" sectionNum="08" />

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Work Order Acceptance & Authorization</h2>
              <p className="text-xs text-slate-500">
                Signing this document constitutes formal acceptance of this commercial proposal and initiates procurement.
              </p>
            </div>

            {/* LEGAL ACCEPTANCE DECLARATION */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 leading-relaxed mb-8 space-y-2">
              <p>
                I/We, <strong>{data.customer_name}</strong>, hereby confirm acceptance of Quotation 
                <strong> #{data.quotation_number}</strong> for the supply, installation, testing, and commissioning of a 
                <strong> {data.system_capacity} kWp {data.system_type} Solar Rooftop Power Plant</strong> for the total sum of 
                <strong> ₹{formatINR(data.grand_total)} ({data.amount_in_words})</strong>.
              </p>
              <p>
                I/We agree to the payment milestone schedule, technical specifications, and terms and conditions 
                detailed herein, and authorize <strong>{data.company_name}</strong> to initiate DISCOM net metering 
                applications and project engineering.
              </p>
            </div>

            {/* DUAL SIGNATURE BOXES */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              
              {/* CUSTOMER SIGNATURE BOX */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col justify-between h-56">
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">
                    Accepted & Confirmed By Customer
                  </div>
                  <div className="text-[11px] text-slate-500">{data.customer_name}</div>
                </div>

                <div className="border-t border-slate-300 pt-3">
                  <div className="flex justify-between items-end text-xs text-slate-500">
                    <div>
                      <span className="text-[10px] block text-slate-400">Signature:</span>
                      <span className="font-mono text-slate-800">[Authorized Signature]</span>
                    </div>
                    <div>
                      <span className="text-[10px] block text-slate-400">Date:</span>
                      <span className="font-mono text-slate-800">____ / ____ / 2026</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* EPC CONTRACTOR SIGNATURE BOX */}
              <div className="p-6 rounded-2xl border-2 border-slate-300 bg-white flex flex-col justify-between h-56 relative">
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">
                    For {data.company_legal_name || data.company_name}
                  </div>
                  <div className="text-[11px] text-slate-500">Authorized EPC Representative</div>
                </div>

                {/* SIGNATURE & STAMP EMBED */}
                <div className="flex items-center justify-between px-2">
                  <div className="h-16 flex items-center">
                    {data.signature_url ? (
                      <img src={data.signature_url} alt="Signature" className="max-h-14 object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400 italic font-mono">[Official Signature]</span>
                    )}
                  </div>
                  {data.company_stamp_url && (
                    <img src={data.company_stamp_url} alt="Official Seal" className="w-16 h-16 object-contain opacity-75" />
                  )}
                </div>

                <div className="border-t border-slate-300 pt-3">
                  <div className="flex justify-between items-end text-xs text-slate-700">
                    <div>
                      <div className="font-bold text-slate-900">{data.signatory_name || 'Authorized Signatory'}</div>
                      <div className="text-[10px] text-slate-500">{data.signatory_title || 'Director - EPC Operations'}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] block text-slate-400">Date:</span>
                      <span className="font-mono text-slate-800">{data.quotation_date}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* THANK YOU CLOSING */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <div className="text-xs font-bold text-blue-900">Thank you for choosing clean, sustainable solar energy.</div>
              <div className="text-[11px] text-blue-700 mt-0.5">
                Questions or Technical Support? Contact {data.company_phone} • {data.company_email}
              </div>
            </div>
          </div>

          <PageFooter data={data} pageNum={++currentPage} />
        </A4Page>
      )}

    </div>
  );
}
