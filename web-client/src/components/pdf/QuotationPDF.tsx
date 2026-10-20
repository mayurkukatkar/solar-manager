"use client";

import React from "react";
import { 
  Sun, MapPin, Phone, Mail, Globe, Zap, Battery, Settings,
  ShieldCheck, CheckCircle2, Calendar, IndianRupee, Activity,
  FileText, ArrowRight, Leaf, Trees, Wind, Check, AlertCircle, Home,
  Info, Cpu, Cable, Wrench, Shield, FileCheck, Award, Clock,
  Building2, CheckSquare, Layers, Sparkles
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
  cover_image?: string;
  palette_theme?: 'forest_gold' | 'obsidian_emerald' | 'navy_champagne';
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
  const subsidy = Number(quotation.indicativeSubsidy) || (cap <= 3 ? cap * 26000 : 78000);

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
    { category: "Mounting Structure", brand: quotation.structureBrand || "Galvanized HDG High Rise", model: "HDG Rooftop", specification: "Hot-Dip Galvanized (80µm) / Anodized Al", quantity: "1 Lot", warranty: quotation.structureWarranty || "10 Years Structural" },
    { category: "Solar DC Cable", brand: "Polycab / LAPP", model: "4 sq.mm", specification: "TUV Certified UV Protected XLPE", quantity: "1 Lot", warranty: "Standard OEM" },
    { category: "AC & DC Distribution", brand: "Schneider / L&T", model: "ACDB / DCDB", specification: "IP65 Enclosure with Type-II SPD & MCB", quantity: "1 Set", warranty: "1 Year" },
    { category: "Earthing & Protection", brand: "SafeGrid", model: "Chemical Dual Pit", specification: "Copper Bonded Electrodes + LA Down Conductor", quantity: "1 Set", warranty: "5 Years" }
  ];

  const templateCode = quotation.template?.code || quotation.templateType || 'residential_proposal';
  const primaryColor = quotation.designConfig?.primaryColor || quotation.template?.primaryColor || "#0B2014";
  const accentColor = quotation.designConfig?.accentColor || quotation.template?.accentColor || "#C5A059";
  const coverLayout = quotation.designConfig?.coverLayout || quotation.template?.coverLayout || "CINEMATIC_LUXURY";
  const fontFamily = quotation.designConfig?.fontFamily || quotation.template?.fontFamily || "Manrope";

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
    cover_image: "/assets/solar-quotation/luxury-villa-cover.jpg",
    palette_theme: "forest_gold",
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
    billing_unit: quotation.billingUnit || "4134 Pune City Urban",
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

    scope_of_supply: quotation.scopeOfSupply || [
      { item: "Detailed Architectural & Shadow-Analysis Rooftop Site Survey", status: "INCLUDED" },
      { item: "Engineering Design, Array Layout, Single Line Diagram (SLD)", status: "INCLUDED" },
      { item: "Supply of Tier-1 ALMM Mono-PERC / TopCon Bifacial Solar Modules", status: "INCLUDED" },
      { item: "Supply of Dual-MPPT High Efficiency Grid-Tied Inverter", status: "INCLUDED" },
      { item: "Hot-Dip Galvanized (80µm) Elevated / Flat Rooftop Structure", status: "INCLUDED" },
      { item: "ACDB & DCDB with Type-II Surge Protection & Circuit Breakers", status: "INCLUDED" },
      { item: "Dual Chemical Copper-Bonded Earthing & Dedicated Lightning Arrestor", status: "INCLUDED" },
      { item: "Complete State DISCOM Net-Metering Liaisoning & Grid Synchronization", status: "INCLUDED" },
      { item: "PM Surya Ghar National Portal Subsidy Processing & DBT Filing", status: "INCLUDED" },
      { item: "Comprehensive 5-Year Workmanship & System Maintenance", status: "INCLUDED" }
    ],

    pricing: pricingRows,
    subtotal: subtotal,
    discount: discount,
    tax: tax,
    taxable_amount: subtotal - discount,
    cgst: Math.round(tax / 2),
    sgst: Math.round(tax / 2),
    grand_total: grandTotal,
    indicative_subsidy: subsidy,
    net_customer_cost: Math.max(0, grandTotal - subsidy),
    commercial_tax_benefit: Math.round(grandTotal * 0.40 * 0.25),
    amount_in_words: toIndianWords(grandTotal),

    estimated_monthly_bill: Math.round((quotation.monthlyBill || (cap * 120 * 8.5)) * 0.10),
    annual_savings: annSav,
    monthly_savings: Math.round(annSav / 12),
    payback_period: Number((grandTotal / annSav).toFixed(1)) || 4.2,
    lifetime_savings: Math.round(annSav * 25 * 0.88 * 1.25),
    lifetime_generation: Math.round(annGen * 25 * 0.92),

    co2_reduction: Number((cap * 1.25 * 25).toFixed(1)),
    tree_equivalent: Math.round(cap * 42),
    peak_month: "May",

    payment_terms: quotation.paymentTerms || [
      { stage: 1, percentage: 10, amount: Math.round(grandTotal * 0.10), description: "Advance with Confirmed Work Order & Engineering Design" },
      { stage: 2, percentage: 70, amount: Math.round(grandTotal * 0.70), description: "On Delivery & Physical Inspection of Modules, Inverter & Structure at Site" },
      { stage: 3, percentage: 15, amount: Math.round(grandTotal * 0.15), description: "Post Mechanical Installation, Structural Torque & Electrical Termination" },
      { stage: 4, percentage: 5, amount: Math.round(grandTotal * 0.05), description: "On DISCOM Bi-directional Net Meter Handover & Joint Meter Reading (JMR)" }
    ],

    warranties: {
      modules: quotation.panelWarranty || "25 Years Linear Performance",
      inverter: quotation.inverterWarranty || "10 Years Full Replacement",
      structure: quotation.structureWarranty || "10 Years Structural Wind-Load Integrity",
      installation: "5 Years Comprehensive Workmanship Guarantee",
      battery: quotation.batteryWarranty || "10 Years / 6000 Cycles",
      other: "OEM Standard on Cables, Switchgear & Earthing"
    },

    exclusions: [
      "Any civil structural building repairs or reinforcement not explicitly in EPC scope",
      "Statutory DISCOM official net-meter testing fees or application deposits",
      "External transformer upgrades if required by utility for sanctioned capacity"
    ],

    terms_and_conditions: quotation.termsAndConditions || [
      `Proposal Validity: This commercial proposal is valid for ${quotation.validityDays || 15} days from date of issuance.`,
      "Central Government Subsidy (PM Surya Ghar Muft Bijli Yojana) is an indicative estimate credited directly to consumer bank account via DBT post-commissioning.",
      "Net Metering: Net metering feasibility and approvals are governed by State DISCOM regulations and local transformer load capacity.",
      "Customer Obligations: Provide unhindered rooftop access, dedicated cleaning water line, and grid electricity during construction."
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
          if (prop === 'color' || prop === 'backgroundColor') return '#071c11';
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
 * Minimalist Editorial SVG Monthly Generation Bar Graphic
 */
const MonthlySolarCurve = ({ capacity = 5 }: { capacity?: number }) => {
  const cap = Number(capacity) || 5;
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

  return (
    <div className="w-full bg-[#FAF8F5] p-5 rounded-2xl border border-[#071C11]/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C5A059] block">
            Annual Yield Analysis
          </span>
          <h4 className="text-xs font-bold text-[#141715]">Monthly Generation Profile (Western India Insolation)</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
          <span className="text-[11px] text-[#2C332E] font-medium">Peak Solar: May ({Math.round(cap * 155)} kWh)</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 items-end h-28 pt-2">
        {months.map((d, i) => {
          const heightPct = Math.round((d.gen / maxGen) * 100);
          return (
            <div key={i} className="flex flex-col items-center h-full justify-end group">
              <span className="text-[9px] font-mono font-bold text-[#141715] mb-1">{d.gen}</span>
              <div 
                className={`w-full rounded-t-md transition-all ${
                  d.peak 
                    ? 'bg-gradient-to-t from-[#C5A059] to-[#DFBF78] shadow-sm' 
                    : 'bg-gradient-to-t from-[#0B2014] to-[#1A533A]'
                }`}
                style={{ height: `${heightPct}%` }}
              />
              <span className="text-[10px] font-semibold text-[#64748b] mt-1.5">{d.m}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Clean Single Page Wrapper for strict A4 dimensions
 */
const A4Page = ({ 
  children, 
  className = "", 
  id,
  dark = false
}: { 
  children: React.ReactNode; 
  className?: string; 
  id?: string;
  dark?: boolean;
}) => (
  <div 
    id={id}
    className={`w-[210mm] min-h-[297mm] relative overflow-hidden flex flex-col justify-between ${
      dark ? 'bg-[#071C11] text-white' : 'bg-[#FAF8F5] text-[#141715]'
    } p-12 print:p-8 border border-stone-200/60 shadow-xl print:shadow-none print:border-none mb-8 print:mb-0 print:break-after-page ${className}`}
    style={{ boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
  >
    {children}
  </div>
);

/**
 * Editorial Luxury Header Component
 */
const PageHeader = ({ 
  data, 
  title, 
  sectionNum 
}: { 
  data: QuotationData; 
  title: string; 
  sectionNum: string 
}) => (
  <div className="flex items-center justify-between pb-4 border-b border-[#071C11]/10 mb-8">
    <div className="flex items-center gap-3">
      {data.company_logo ? (
        <img src={data.company_logo} alt={data.company_name} className="h-7 object-contain" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-[#071C11] text-[#C5A059] flex items-center justify-center font-serif font-black text-sm shadow-xs">
          W
        </div>
      )}
      <div>
        <div className="text-[11px] font-extrabold text-[#071C11] tracking-[0.15em] uppercase font-['Manrope']">
          {data.company_name}
        </div>
        <div className="text-[9px] text-[#64748B] tracking-wide">
          {data.company_address ? data.company_address.split(',')[0] : 'India'} • {data.company_phone}
        </div>
      </div>
    </div>
    
    <div className="text-right">
      <div className="text-[11px] font-extrabold text-[#071C11] uppercase tracking-[0.12em] flex items-center gap-2 justify-end font-['Manrope']">
        <span className="text-[#C5A059] font-mono text-[10px] tracking-widest">{sectionNum}</span>
        <span>{title}</span>
      </div>
      <div className="text-[9px] font-mono text-[#64748B]">Ref: {data.quotation_number} • {data.quotation_date}</div>
    </div>
  </div>
);

/**
 * Editorial Running Footer Component
 */
const PageFooter = ({ data, pageNum }: { data: QuotationData; pageNum: number }) => (
  <div className="pt-4 border-t border-[#071C11]/10 flex items-center justify-between text-[10px] text-[#64748B] mt-auto">
    <div className="flex items-center gap-2">
      <span className="font-extrabold text-[#071C11] tracking-wider uppercase">{data.company_legal_name || data.company_name}</span>
      {data.company_gstin && <span>• GSTIN: {data.company_gstin}</span>}
      <span className="hidden sm:inline">• Certified EPC Contractor</span>
    </div>
    <div className="font-mono text-[10px] text-[#C5A059] font-bold tracking-wider">
      PAGE {String(pageNum).padStart(2, '0')} / 06
    </div>
  </div>
);

/**
 * Master Quotation PDF Component
 * Redesigned into an exceptionally beautiful, art-directed 6-page luxury editorial proposal.
 */
export function QuotationPDF({ data, livePreview = false }: { data: QuotationData; livePreview?: boolean }) {
  if (!data) return null;

  const isQuickQuote = data.template_type === 'quick_quote';
  const isHybridOrOffgrid = data.system_type === 'Hybrid' || data.system_type === 'Off-grid';
  const isCommercial = data.connection_type === 'Commercial' || data.connection_type === 'Industrial';

  // Section visibility check
  const isSectionEnabled = (secId: string) => {
    if (!data.sections_config || data.sections_config.length === 0) return true;
    const found = data.sections_config.find(s => s.id === secId);
    return found ? found.isEnabled : true;
  };

  let pageCounter = 1;

  return (
    <div 
      className="mx-auto font-sans text-slate-800 bg-stone-300/40 p-4 print:p-0 print:bg-white" 
      style={{ width: "210mm" }}
    >
      
      {/* ========================================================================= */}
      {/* PAGE 1: CINEMATIC COVER PAGE                                              */}
      {/* ========================================================================= */}
      {isSectionEnabled('cover') && (
        <A4Page id="proposal-page-1" dark className="relative flex flex-col justify-between p-14 !bg-[#071C11]">
          {/* BACKGROUND LUXURY ROOFTOP PHOTO WITH ART-DIRECTED MATTE GRADIENT */}
          <div className="absolute inset-0 z-0">
            <img 
              src={data.cover_image || "/assets/solar-quotation/luxury-villa-cover.jpg"} 
              alt="Luxury Rooftop Solar Architecture" 
              className="w-full h-full object-cover object-center" 
              onError={(e: any) => {
                e.target.src = "/assets/solar-quotation/cover.jpg";
              }}
            />
            {/* Deep forest green gradient vignette */}
            <div 
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, rgba(7, 28, 17, 0.45) 0%, rgba(7, 28, 17, 0.72) 40%, rgba(7, 28, 17, 0.96) 80%, #071C11 100%)"
              }}
            />
          </div>

          {/* COVER HEADER */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-6">
            <div className="flex items-center gap-3">
              {data.company_logo ? (
                <img src={data.company_logo} alt={data.company_name} className="h-9 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#C5A059] text-[#071C11] flex items-center justify-center font-serif font-black text-lg shadow-md">
                  W
                </div>
              )}
              <div>
                <h2 className="text-sm font-extrabold tracking-[0.2em] uppercase text-white font-['Manrope']">
                  {data.company_name}
                </h2>
                <p className="text-[10px] text-[#C5A059] tracking-wider uppercase font-medium">
                  Renewable Energy EPC Architecture
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.2em] bg-[#C5A059]/20 text-[#DFBF78] border border-[#C5A059]/40 backdrop-blur-md">
                Private Proposal • 2026
              </span>
            </div>
          </div>

          {/* COVER HERO EDITORIAL CONTENT */}
          <div className="relative z-10 py-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-[1px] bg-[#C5A059]" />
              <p className="text-[#DFBF78] font-bold tracking-[0.25em] text-[11px] uppercase">
                WhereReady Solar OS • Enterprise Edition
              </p>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tight font-['Manrope'] mb-6">
              Power Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFBF78] via-[#C5A059] to-[#E8D5B5]">
                Future.
              </span>
            </h1>

            <p className="text-stone-300 text-xs max-w-md leading-relaxed mb-8">
              A bespoke rooftop solar power plant engineered to eliminate recurring grid expenditure, capitalize on central solar incentives, and protect your estate with 25 years of compounding energy independence.
            </p>

            {/* CUSTOMER CALLOUT GLASS CARD */}
            <div className="p-6 rounded-2xl bg-[#0B2014]/80 backdrop-blur-md border border-[#C5A059]/30 max-w-lg mb-8 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-extrabold text-[#C5A059] tracking-[0.2em] uppercase">
                  Prepared Exclusively For
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {data.system_type} • {data.connection_type}
                </span>
              </div>
              <div className="text-2xl font-black text-white mb-1.5 font-['Manrope'] tracking-tight">
                {data.customer_name}
              </div>
              <div className="text-xs text-stone-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <span className="truncate">{data.project_address}</span>
              </div>
              {data.consumer_number && (
                <div className="text-[11px] font-mono text-emerald-400 mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span>DISCOM Account: {data.consumer_number}</span>
                  <span className="text-stone-400 font-sans text-[10px]">{data.discom || 'MSEDCL'}</span>
                </div>
              )}
            </div>

            {/* SPECIFICATION HIGHLIGHT BAR */}
            <div className="grid grid-cols-4 gap-3 max-w-xl">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-0.5">Capacity</div>
                <div className="text-2xl font-black text-white font-['Space_Grotesk']">
                  {data.system_capacity} <span className="text-xs font-normal text-[#C5A059]">kWp</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-0.5">Annual Yield</div>
                <div className="text-2xl font-black text-white font-['Space_Grotesk']">
                  {(data.annual_generation).toLocaleString()} <span className="text-xs font-normal text-stone-400">kWh</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-0.5">25-Yr Return</div>
                <div className="text-2xl font-black text-[#DFBF78] font-['Space_Grotesk']">
                  ₹{Number((data.lifetime_savings / 100000).toFixed(1))}L
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-0.5">CO2 Abated</div>
                <div className="text-2xl font-black text-emerald-400 font-['Space_Grotesk']">
                  {data.co2_reduction} <span className="text-xs font-normal text-stone-400">Tons</span>
                </div>
              </div>
            </div>
          </div>

          {/* COVER FOOTER */}
          <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/15 text-xs text-stone-300 font-mono">
            <div>
              <span className="text-[9px] text-[#C5A059] uppercase tracking-[0.2em] block font-sans font-bold">
                Proposal Reference
              </span>
              <span className="font-bold text-white text-sm">{data.quotation_number}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#C5A059] uppercase tracking-[0.2em] block font-sans font-bold">
                Issuance Date
              </span>
              <span className="font-semibold text-white">{data.quotation_date}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-[#C5A059] uppercase tracking-[0.2em] block font-sans font-bold">
                Validity Period
              </span>
              <span className="font-bold text-[#DFBF78]">{data.valid_until}</span>
            </div>
          </div>
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: YOUR ENERGY PROFILE                                               */}
      {/* ========================================================================= */}
      {!isQuickQuote && isSectionEnabled('requirements') && (
        <A4Page id="proposal-page-2">
          <div>
            <PageHeader data={data} title="Your Energy Profile & Site Audit" sectionNum="01" />
            
            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C5A059] block mb-1">
                Baseline Energy Economics
              </span>
              <h2 className="text-2xl font-black text-[#071C11] tracking-tight font-['Manrope'] mb-1">
                Translating Rooftop Insolation Into Zero Grid Dependency
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                A comprehensive engineering audit mapping your utility electricity expenditure, tariff structure, and rooftop surface against optimal solar potential.
              </p>
            </div>

            {/* OVERSIZED STATISTICS BAR */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-5 rounded-2xl bg-white border border-[#071C11]/10 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#64748B] block mb-1">
                  Current Grid Outflow
                </span>
                <div className="text-2xl font-black text-[#071C11] font-['Space_Grotesk']">
                  ₹{formatINR(data.current_monthly_bill * 12)} <span className="text-xs font-normal text-[#64748B]">/ year</span>
                </div>
                <div className="text-[11px] text-[#64748B] mt-1 font-mono">
                  ~₹{formatINR(data.current_monthly_bill)}/mo @ ₹{data.tariff_rate || 8.5}/unit
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#071C11]/10 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#059669] block mb-1">
                  Proposed Clean Solar Yield
                </span>
                <div className="text-2xl font-black text-[#059669] font-['Space_Grotesk']">
                  {data.annual_generation.toLocaleString()} <span className="text-xs font-normal text-[#64748B]">kWh / yr</span>
                </div>
                <div className="text-[11px] text-[#059669] mt-1 font-mono">
                  ~{Math.round(data.annual_generation / 12)} kWh / month average
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#071C11] text-white shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#C5A059] block mb-1">
                  Projected Bill Reduction
                </span>
                <div className="text-2xl font-black text-[#DFBF78] font-['Space_Grotesk']">
                  ~90% - 95%
                </div>
                <div className="text-[11px] text-stone-300 mt-1">
                  Net-metering credits offset grid consumption
                </div>
              </div>
            </div>

            {/* ELEGANT BEFORE VS AFTER POWER BALANCE INFOGRAPHIC */}
            <div className="bg-white p-5 rounded-2xl border border-[#071C11]/10 mb-8">
              <h3 className="text-xs font-bold text-[#071C11] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity size={14} className="text-[#C5A059]" />
                Before vs. After Solar Generation Architecture
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-rose-700 uppercase">Without Solar (Current)</span>
                    <span className="text-[10px] text-stone-500 font-mono">100% Grid Dependency</span>
                  </div>
                  <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden mb-2">
                    <div className="bg-rose-500 h-full w-full rounded-full" />
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    All consumed electricity is drawn from the state grid at retail slabs with recurring annual tariff inflation of 3%–5%.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#065F46] uppercase">With WhereReady Solar</span>
                    <span className="text-[10px] text-[#065F46] font-mono font-bold">~90% Solar Self-Sufficiency</span>
                  </div>
                  <div className="w-full bg-emerald-200 h-3 rounded-full overflow-hidden mb-2 flex">
                    <div className="bg-[#059669] h-full w-[90%] rounded-l-full" />
                    <div className="bg-amber-400 h-full w-[10%] rounded-r-full" />
                  </div>
                  <p className="text-[11px] text-[#065F46] leading-relaxed">
                    90% of daytime energy generated directly on-site; surplus exported back to DISCOM via bidirectional net meter.
                  </p>
                </div>
              </div>
            </div>

            {/* DISCOM & SITE AUDIT SPECIFICATIONS TABLE */}
            <div className="border border-[#071C11]/10 rounded-2xl overflow-hidden bg-white mb-6">
              <table className="w-full text-xs">
                <thead className="bg-[#FAF8F5] text-[#071C11] font-bold border-b border-[#071C11]/10 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">Audit Parameter</th>
                    <th className="px-5 py-3 text-left">Consumer Site Record</th>
                    <th className="px-5 py-3 text-left">Engineering Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[#2C332E]">
                  <tr>
                    <td className="px-5 py-3 font-bold text-[#071C11]">Utility & Billing Division</td>
                    <td className="px-5 py-3">{data.discom || 'MSEDCL (Mahavitaran)'} • BU: {data.billing_unit || '4134'}</td>
                    <td className="px-5 py-3 text-[#059669] font-medium">Eligible for Net-Metering Sanction</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-bold text-[#071C11]">Consumer Account Number</td>
                    <td className="px-5 py-3 font-mono font-bold text-[#071C11]">{data.consumer_number || 'To be updated'}</td>
                    <td className="px-5 py-3 text-stone-500">National Portal DBT Synchronized</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-bold text-[#071C11]">Sanctioned Load vs Plant</td>
                    <td className="px-5 py-3 font-mono">{data.sanctioned_load || data.system_capacity} kW ({data.phase})</td>
                    <td className="px-5 py-3 text-[#059669] font-medium">
                      {data.system_capacity <= (data.sanctioned_load || 5) ? 'Capacity within sanctioned limit' : 'Load enhancement recommended'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-bold text-[#071C11]">Rooftop Feasibility</td>
                    <td className="px-5 py-3">{data.roof_type} (~{data.roof_area_sqft || Math.round(data.system_capacity * 65)} sq.ft.)</td>
                    <td className="px-5 py-3">True South (180°), 15° optimal pitch, 100% shadow-free</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <PageFooter data={data} pageNum={++pageCounter} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: YOUR SOLAR SYSTEM (APPLE-STYLE HARDWARE PRESENTATION)              */}
      {/* ========================================================================= */}
      {isSectionEnabled('solution') && (
        <A4Page id="proposal-page-3">
          <div>
            <PageHeader data={data} title="Your Solar System & Hardware" sectionNum="02" />

            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C5A059] block mb-1">
                Industrial-Grade Engineering
              </span>
              <h2 className="text-2xl font-black text-[#071C11] tracking-tight font-['Manrope'] mb-1">
                Masterfully Integrated. Crafted for 25-Year Reliability.
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Every component is hand-picked from global Tier-1 ALMM certified manufacturers, engineered to deliver peak kilowatt-hour generation in harsh Indian climate conditions.
              </p>
            </div>

            {/* APPLE-STYLE STUDIO PRODUCT HERO IMAGE */}
            <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 relative border border-[#071C11]/10 bg-[#FAF8F5] shadow-xs">
              <img 
                src="/assets/solar-quotation/hardware-studio.jpg" 
                alt="Studio Product Photography - Hybrid Inverter and Battery"
                className="w-full h-full object-cover object-center"
                onError={(e: any) => {
                  e.target.src = "/assets/solar-quotation/technology.jpg";
                }}
              />
              <div className="absolute bottom-3 left-4 bg-[#071C11]/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15">
                <span className="text-[10px] font-bold text-white tracking-wider uppercase font-mono">
                  State-of-the-Art Power Electronics & Storage
                </span>
              </div>
            </div>

            {/* 2X2 REFINED HARDWARE SHOWCASES */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              
              {/* PV MODULES CARD */}
              <div className="p-4 rounded-2xl bg-white border border-[#071C11]/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-wider">
                      Solar PV Modules
                    </span>
                    <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ALMM Tier-1
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#071C11] font-['Manrope'] mb-1">
                    {data.panel_brand} {data.panel_wattage}Wp Bifacial
                  </h3>
                  <p className="text-[11px] text-[#64748B] leading-relaxed mb-3">
                    {data.panel_quantity} High-efficiency N-type TopCon Bifacial modules capturing direct sunlight and ambient rooftop reflection for +15% rear yield.
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-400 text-[10px]">Warranty</span>
                  <span className="font-bold text-[#071C11]">{data.panel_warranty}</span>
                </div>
              </div>

              {/* INVERTER CARD */}
              <div className="p-4 rounded-2xl bg-white border border-[#071C11]/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-wider">
                      Grid-Tied Inverter
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      IP65 Rated
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#071C11] font-['Manrope'] mb-1">
                    {data.inverter_brand} {data.inverter_capacity} kW Dual-MPPT
                  </h3>
                  <p className="text-[11px] text-[#64748B] leading-relaxed mb-3">
                    98.6% European efficiency, dual independent MPPT trackers, and integrated WiFi telemetry with mobile app performance monitoring.
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-400 text-[10px]">Warranty</span>
                  <span className="font-bold text-[#071C11]">{data.inverter_warranty}</span>
                </div>
              </div>

              {/* BATTERY STORAGE (IF HYBRID) OR STRUCTURE */}
              {isHybridOrOffgrid ? (
                <div className="p-4 rounded-2xl bg-white border border-[#C5A059]/40 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                        Lithium Energy Storage
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        LiFePO4 Chemistry
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#071C11] font-['Manrope'] mb-1">
                      {data.battery_brand || 'Tata Power'} {data.battery_capacity || 5} kWh Rack
                    </h3>
                    <p className="text-[11px] text-[#64748B] leading-relaxed mb-3">
                      Safe lithium iron phosphate battery supporting {data.backup_load_watts || 3000}W of essential household loads during grid interruptions.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-400 text-[10px]">Cycle Life</span>
                    <span className="font-bold text-[#071C11]">{data.battery_warranty || '10 Years / 6000 Cycles'}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-[#071C11]/10 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-wider">
                        Mounting Structure
                      </span>
                      <span className="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                        150 km/h Wind Rated
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#071C11] font-['Manrope'] mb-1">
                      {data.structure_brand}
                    </h3>
                    <p className="text-[11px] text-[#64748B] leading-relaxed mb-3">
                      High-grade hot-dip galvanized steel (80µm zinc coating) or anodized aluminium with SS304 grade corrosion-proof fasteners.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-400 text-[10px]">Warranty</span>
                    <span className="font-bold text-[#071C11]">{data.structure_warranty}</span>
                  </div>
                </div>
              )}

              {/* BALANCE OF SYSTEM (BOS) & ELECTRICAL SAFETY */}
              <div className="p-4 rounded-2xl bg-white border border-[#071C11]/10 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-wider">
                      Electrical Balance of System
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      MNRE Approved
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#071C11] font-['Manrope'] mb-1">
                    Polycab DC Cables & Type-II SPD
                  </h3>
                  <p className="text-[11px] text-[#64748B] leading-relaxed mb-3">
                    UV-stabilized XLPE 4 sq.mm solar DC cable, Hensel IP65 ACDB/DCDB boxes, and dual chemical copper-bonded earthing pits.
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-400 text-[10px]">Protection</span>
                  <span className="font-bold text-[#071C11]">Lightning & Surge Certified</span>
                </div>
              </div>

            </div>
          </div>

          <PageFooter data={data} pageNum={++pageCounter} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* PAGE 4: ENERGY & SAVINGS (FINANCIAL INFOGRAPHICS)                         */}
      {/* ========================================================================= */}
      {isSectionEnabled('savings') && (
        <A4Page id="proposal-page-4">
          <div>
            <PageHeader data={data} title="Energy Yield & Financial ROI" sectionNum="03" />

            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C5A059] block mb-1">
                Financial Engineering
              </span>
              <h2 className="text-2xl font-black text-[#071C11] tracking-tight font-['Manrope'] mb-1">
                A Compounding Financial Asset, Not An Expense.
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Projected solar generation yield, break-even payback analysis, and 25-year wealth accumulation compounding against rising grid electricity tariffs.
              </p>
            </div>

            {/* MONTHLY GENERATION CHART */}
            <div className="mb-6">
              <MonthlySolarCurve capacity={data.system_capacity} />
            </div>

            {/* 3 FINANCIAL KPI HERO CARDS */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-white border border-[#071C11]/10 shadow-xs text-center">
                <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider block mb-1">
                  Year 1 Net Savings
                </span>
                <div className="text-2xl font-black text-[#065F46] font-['Space_Grotesk']">
                  ₹{formatINR(data.annual_savings)}
                </div>
                <span className="text-[11px] text-stone-500 font-mono">~₹{formatINR(data.monthly_savings)} / month</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#071C11] text-white shadow-xs text-center">
                <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-wider block mb-1">
                  Estimated Payback
                </span>
                <div className="text-2xl font-black text-[#DFBF78] font-['Space_Grotesk']">
                  {data.payback_period} Years
                </div>
                <span className="text-[11px] text-stone-300 font-mono">Break-even on net capital</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#071C11]/10 shadow-xs text-center">
                <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-wider block mb-1">
                  25-Year Wealth Generated
                </span>
                <div className="text-2xl font-black text-[#071C11] font-['Space_Grotesk']">
                  ₹{formatINR(data.lifetime_savings)}
                </div>
                <span className="text-[11px] text-stone-500 font-mono">Compounding @ 3% tariff hike</span>
              </div>
            </div>

            {/* 25-YEAR COMPOUNDING FINANCIAL PROJECTIONS TABLE */}
            <div className="border border-[#071C11]/10 rounded-2xl overflow-hidden bg-white mb-6">
              <div className="px-5 py-3 bg-[#FAF8F5] border-b border-[#071C11]/10 flex items-center justify-between text-xs font-bold text-[#071C11]">
                <span className="font-['Manrope'] uppercase tracking-wider text-[11px]">25-Year Milestone Cash Flow Projections</span>
                <span className="text-[10px] font-normal text-stone-500">Transparent 0.7% degradation & 3% tariff inflation</span>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF8F5]/50 text-[10px] uppercase font-bold text-stone-400 border-b border-stone-100">
                  <tr>
                    <th className="px-5 py-2.5">Timeline Milestone</th>
                    <th className="px-5 py-2.5">Estimated Yield</th>
                    <th className="px-5 py-2.5">Grid Tariff Rate</th>
                    <th className="px-5 py-2.5">Annual Value</th>
                    <th className="px-5 py-2.5 text-right">Cumulative Net Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[#2C332E] font-mono">
                  {[
                    { yr: 'Year 01', gen: data.annual_generation, rate: data.tariff_rate || 8.5, ann: data.annual_savings, cum: data.annual_savings },
                    { yr: 'Year 03', gen: Math.round(data.annual_generation * 0.98), rate: Number(((data.tariff_rate || 8.5) * 1.06).toFixed(2)), ann: Math.round(data.annual_savings * 1.04), cum: Math.round(data.annual_savings * 3.08) },
                    { yr: 'Year 05 (Payback)', gen: Math.round(data.annual_generation * 0.96), rate: Number(((data.tariff_rate || 8.5) * 1.12).toFixed(2)), ann: Math.round(data.annual_savings * 1.08), cum: Math.round(data.annual_savings * 5.3) },
                    { yr: 'Year 10', gen: Math.round(data.annual_generation * 0.93), rate: Number(((data.tariff_rate || 8.5) * 1.30).toFixed(2)), ann: Math.round(data.annual_savings * 1.21), cum: Math.round(data.annual_savings * 11.5) },
                    { yr: 'Year 15', gen: Math.round(data.annual_generation * 0.90), rate: Number(((data.tariff_rate || 8.5) * 1.51).toFixed(2)), ann: Math.round(data.annual_savings * 1.36), cum: Math.round(data.annual_savings * 18.2) },
                    { yr: 'Year 25', gen: Math.round(data.annual_generation * 0.84), rate: Number(((data.tariff_rate || 8.5) * 2.03).toFixed(2)), ann: Math.round(data.annual_savings * 1.71), cum: data.lifetime_savings }
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]/40'}>
                      <td className="px-5 py-2.5 font-bold text-[#071C11] font-sans">{row.yr}</td>
                      <td className="px-5 py-2.5">{row.gen.toLocaleString()} kWh</td>
                      <td className="px-5 py-2.5">₹{row.rate} / u</td>
                      <td className="px-5 py-2.5 text-[#059669] font-bold">₹{formatINR(row.ann)}</td>
                      <td className="px-5 py-2.5 text-right font-black text-[#071C11]">₹{formatINR(row.cum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ENVIRONMENTAL IMPACT BANNER */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#071C11] to-[#0B2014] text-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
                  <Leaf size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Certified Environmental Leadership</h4>
                  <p className="text-[11px] text-stone-300">Your clean power generation avoids {data.co2_reduction} Tons of CO2 and equals planting ~{data.tree_equivalent} mature trees.</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#C5A059] font-bold tracking-widest uppercase">
                100% Green
              </span>
            </div>
          </div>

          <PageFooter data={data} pageNum={++pageCounter} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* PAGE 5: YOUR INVESTMENT (COMMERCIAL BOQ & MILESTONES)                     */}
      {/* ========================================================================= */}
      {isSectionEnabled('pricing') && (
        <A4Page id="proposal-page-5">
          <div>
            <PageHeader data={data} title="Commercial Proposal & Investment" sectionNum="04" />

            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C5A059] block mb-1">
                Transparent Commercials
              </span>
              <h2 className="text-2xl font-black text-[#071C11] tracking-tight font-['Manrope'] mb-1">
                Turnkey Investment Schedule With Milestone Security
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Itemized commercial bill of quantities with composite solar GST, direct central subsidy deduction, and stage-linked payment protection.
              </p>
            </div>

            {/* OVERSIZED INVESTMENT HERO BOX */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#071C11] to-[#0B2014] text-white mb-6 border border-[#C5A059]/30 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-[#C5A059] tracking-[0.2em] uppercase block mb-1">
                  Net Estimated Customer Investment
                </span>
                <div className="text-4xl md:text-5xl font-black font-['Space_Grotesk'] text-white tracking-tight">
                  ₹{formatINR(data.net_customer_cost || data.grand_total)}
                </div>
                <div className="text-xs text-stone-300 mt-2 flex items-center gap-2">
                  <span>Gross Project Value: ₹{formatINR(data.grand_total)}</span>
                  {data.indicative_subsidy && data.indicative_subsidy > 0 && (
                    <span className="text-emerald-400 font-bold">• Less Central DBT Subsidy: ₹{formatINR(data.indicative_subsidy)}</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#C5A059]/20 text-[#DFBF78] border border-[#C5A059]/40">
                  Fixed EPC Contract
                </span>
                <div className="text-[10px] text-stone-400 mt-2 font-mono">
                  Inclusive of 13.8% Solar GST
                </div>
              </div>
            </div>

            {/* ITEMIZED PRICING TABLE WITH REFINED THIN DIVIDERS */}
            <div className="border border-[#071C11]/10 rounded-2xl overflow-hidden bg-white mb-6">
              <table className="w-full text-xs">
                <thead className="bg-[#FAF8F5] text-[#071C11] font-bold border-b border-[#071C11]/10 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-5 py-3 text-left">Equipment / Scope Deliverable</th>
                    <th className="px-4 py-3 text-center w-16">Qty</th>
                    <th className="px-4 py-3 text-center w-16">Unit</th>
                    <th className="px-5 py-3 text-right w-28">Rate (₹)</th>
                    <th className="px-4 py-3 text-center w-16">Tax %</th>
                    <th className="px-5 py-3 text-right w-32">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[#2C332E]">
                  {data.pricing.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]/40'}>
                      <td className="px-4 py-2.5 text-center font-mono text-stone-400">{idx + 1}</td>
                      <td className="px-5 py-2.5 font-bold text-[#071C11]">{item.description}</td>
                      <td className="px-4 py-2.5 text-center font-mono">{item.qty}</td>
                      <td className="px-4 py-2.5 text-center text-stone-500">{item.unit || 'LOT'}</td>
                      <td className="px-5 py-2.5 text-right font-mono">₹{formatINR(item.unit_price)}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-stone-500">{item.tax_rate || 12}%</td>
                      <td className="px-5 py-2.5 text-right font-mono font-bold text-[#071C11]">₹{formatINR(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AMOUNT IN WORDS & MILESTONE SCHEDULE */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              
              {/* AMOUNT IN WORDS & BANK DETAILS */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#071C11]/10">
                  <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-wider block mb-1">
                    Amount Payable in Words
                  </span>
                  <p className="text-xs font-bold text-[#071C11] tracking-wide uppercase leading-relaxed font-['Manrope']">
                    {data.amount_in_words}
                  </p>
                </div>

                {data.bank_details && (
                  <div className="p-4 rounded-2xl bg-white border border-[#071C11]/10 text-xs">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                      Official EPC Bank Account for RTGS / NEFT
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-stone-700 font-mono text-[11px]">
                      <div>
                        <span className="text-stone-400 block text-[9px] font-sans">Beneficiary</span>
                        <span className="font-bold text-[#071C11] truncate block">{data.bank_details.account_name}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px] font-sans">Bank Name</span>
                        <span>{data.bank_details.bank_name}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px] font-sans">Account Number</span>
                        <span className="font-bold text-[#071C11]">{data.bank_details.account_number}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px] font-sans">IFSC Code</span>
                        <span className="font-bold text-[#C5A059]">{data.bank_details.ifsc}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MILESTONE PAYMENT SCHEDULE */}
              <div className="border border-[#071C11]/10 rounded-2xl overflow-hidden bg-white">
                <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#071C11]/10 font-bold text-xs text-[#071C11] flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider">Milestone Linked Payment Terms</span>
                  <span className="text-[10px] font-normal text-stone-500">100% Secure</span>
                </div>
                <div className="divide-y divide-stone-100 text-xs">
                  {data.payment_terms.map((ms, idx) => (
                    <div key={idx} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#071C11] text-[#C5A059] text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-stone-800 font-medium text-[11px] leading-tight">{ms.description}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right shrink-0">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold text-[10px]">{ms.percentage}%</span>
                        <span className="font-mono font-bold text-[#071C11] text-[11px]">₹{formatINR(ms.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <PageFooter data={data} pageNum={++pageCounter} />
        </A4Page>
      )}

      {/* ========================================================================= */}
      {/* PAGE 6: INSTALLATION ROADMAP, WARRANTIES & ACCEPTANCE                     */}
      {/* ========================================================================= */}
      {isSectionEnabled('acceptance') && (
        <A4Page id="proposal-page-6">
          <div>
            <PageHeader data={data} title="Installation Roadmap & Acceptance" sectionNum="05" />

            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C5A059] block mb-1">
                Execution Guarantee
              </span>
              <h2 className="text-2xl font-black text-[#071C11] tracking-tight font-['Manrope'] mb-1">
                From Engineering Survey to Solar Power in 21 Days
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Our structured 5-phase execution methodology guarantees safe installation, rigorous DISCOM testing, and seamless net-meter commissioning.
              </p>
            </div>

            {/* 5-STAGE ARCHITECTURAL INSTALLATION TIMELINE */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {[
                { step: '01', title: 'Site Survey', days: 'Days 1–3', desc: 'Detailed 3D shadow analysis, civil torque check & SLD signoff' },
                { step: '02', title: 'DISCOM Approval', days: 'Days 4–8', desc: 'Online application & net-metering feasibility sanction' },
                { step: '03', title: 'Structure Erection', days: 'Days 9–14', desc: 'Hot-dip galvanized structure & PV module alignment' },
                { step: '04', title: 'Electrical BOS', days: 'Days 15–18', desc: 'Inverter wiring, ACDB/DCDB termination & dual earthing' },
                { step: '05', title: 'Commissioning', days: 'Days 19–21', desc: 'Net meter synchronization, joint testing & final handover' }
              ].map((p, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-white border border-[#071C11]/10 flex flex-col justify-between">
                  <div>
                    <span className="font-mono font-black text-[#C5A059] text-base block">{p.step}</span>
                    <h4 className="text-[11px] font-bold text-[#071C11] mt-0.5">{p.title}</h4>
                    <p className="text-[10px] text-stone-500 mt-1 leading-snug">{p.desc}</p>
                  </div>
                  <span className="text-[9px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded mt-2 text-center block">
                    {p.days}
                  </span>
                </div>
              ))}
            </div>

            {/* CERTIFIED WARRANTY SHIELDS */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-white border border-[#071C11]/10 text-center">
                <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-1">Modules</span>
                <div className="text-base font-black text-[#071C11] font-['Space_Grotesk']">25 Years</div>
                <div className="text-[10px] text-stone-500">Linear Performance</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#071C11]/10 text-center">
                <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-1">Inverter</span>
                <div className="text-base font-black text-[#071C11] font-['Space_Grotesk']">10 Years</div>
                <div className="text-[10px] text-stone-500">Full Replacement</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#071C11]/10 text-center">
                <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-1">Structure</span>
                <div className="text-base font-black text-[#071C11] font-['Space_Grotesk']">10 Years</div>
                <div className="text-[10px] text-stone-500">Wind Load 150 km/h</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#071C11]/10 text-center">
                <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-1">Workmanship</span>
                <div className="text-base font-black text-[#059669] font-['Space_Grotesk']">5 Years</div>
                <div className="text-[10px] text-stone-500">Comprehensive Support</div>
              </div>
            </div>

            {/* LEGAL ACCEPTANCE DECLARATION */}
            <div className="p-4 rounded-2xl bg-white border border-[#071C11]/10 text-xs text-[#2C332E] leading-relaxed mb-6 space-y-1.5">
              <p>
                I/We, <strong>{data.customer_name}</strong>, hereby confirm acceptance of Commercial Proposal 
                <strong> #{data.quotation_number}</strong> for the supply, turnkey erection, testing, and commissioning of a 
                <strong> {data.system_capacity} kWp {data.system_type} Solar Rooftop Power Plant</strong> for the total contract sum of 
                <strong> ₹{formatINR(data.grand_total)} ({data.amount_in_words})</strong>.
              </p>
              <p className="text-[11px] text-stone-500">
                Authorizes {data.company_name} to execute statutory State DISCOM net metering applications, rooftop structural anchorage, and engineering procurement.
              </p>
            </div>

            {/* DUAL SIGNATORY & STAMP BOXES */}
            <div className="grid grid-cols-2 gap-6 mb-4">
              
              {/* CUSTOMER ACCEPTANCE BOX */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-stone-300 bg-white flex flex-col justify-between h-44">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Confirmed & Accepted By Client
                  </span>
                  <div className="text-xs font-bold text-[#071C11]">{data.customer_name}</div>
                </div>

                <div className="border-t border-stone-200 pt-2 flex justify-between items-end text-xs text-stone-400">
                  <div>
                    <span className="text-[9px] block text-stone-400">Client Signature</span>
                    <span className="font-mono text-stone-700">[Signature Line]</span>
                  </div>
                  <div>
                    <span className="text-[9px] block text-stone-400">Date</span>
                    <span className="font-mono text-stone-700">____ / ____ / 2026</span>
                  </div>
                </div>
              </div>

              {/* EPC CONTRACTOR SIGNATORY BOX */}
              <div className="p-5 rounded-2xl border-2 border-stone-300 bg-white flex flex-col justify-between h-44 relative">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    For {data.company_legal_name || data.company_name}
                  </span>
                  <div className="text-xs font-bold text-[#071C11]">Authorized Signatory & Seal</div>
                </div>

                {/* SIGNATURE & STAMP EMBED */}
                <div className="flex items-center justify-between px-2">
                  <div className="h-12 flex items-center">
                    {data.signature_url ? (
                      <img src={data.signature_url} alt="Signature" className="max-h-12 object-contain" />
                    ) : (
                      <span className="text-xs text-stone-400 italic font-mono">[Authorized Signature]</span>
                    )}
                  </div>
                  {data.company_stamp_url && (
                    <img src={data.company_stamp_url} alt="Official Seal" className="w-14 h-14 object-contain opacity-75" />
                  )}
                </div>

                <div className="border-t border-stone-200 pt-2 flex justify-between items-end text-xs text-stone-600">
                  <div>
                    <div className="font-bold text-[#071C11]">{data.signatory_name || 'Authorized Signatory'}</div>
                    <div className="text-[9px] text-stone-400">{data.signatory_title || 'Director - EPC Operations'}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] block text-stone-400">Date</span>
                    <span className="font-mono text-stone-700">{data.quotation_date}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <PageFooter data={data} pageNum={++pageCounter} />
        </A4Page>
      )}

    </div>
  );
}

