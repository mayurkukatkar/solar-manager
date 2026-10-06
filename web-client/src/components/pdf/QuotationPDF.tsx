"use client";

import React, { useRef, useState } from "react";
import { 
  Sun, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Zap, 
  Battery, 
  Settings,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Activity,
  FileText
} from "lucide-react";


interface QuotationData {
  quotation_number: string;
  quotation_date: string;
  valid_until: string;
  company_name: string;
  company_logo: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  project_address: string;
  consumer_number?: string;
  system_capacity: number;
  annual_generation: number;
  panel_type: string;
  inverter_brand: string;
  system_type: string;
  phase: string;
  roof_type: string;
  installation_type: string;
  expected_timeline: string;
  components: Array<{
    category: string;
    brand: string;
    model: string;
    specification: string;
    quantity: string | number;
    warranty: string;
  }>;
  scope_of_supply: string[];
  pricing: Array<{
    description: string;
    qty: number | string;
    unit_price: number;
    amount: number;
  }>;
  subtotal: number;
  discount: number;
  taxable_amount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  gov_charges: number;
  other_charges: number;
  grand_total: number;
  annual_savings: number;
  monthly_savings: number;
  payback_period: number;
  lifetime_generation: number;
  monthly_generation?: Array<{ month: string; generation: number }>;
  payment_terms: Array<{ percentage: number; description: string }>;
  warranties: {
    modules: string;
    inverter: string;
    structure: string;
    installation: string;
    other: string;
  };
  terms_and_conditions: string[];
  exclusions: string[];
  bank_details?: {
    account_name: string;
    bank_name: string;
    account_number: string;
    ifsc: string;
    upi_id: string;
  };
}

export const generatePDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const opt: any = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    const _html2pdf = require("html2pdf.js");
    const html2pdf = _html2pdf.default || _html2pdf;
    return await html2pdf().set(opt).from(element).save();
  } catch (err: any) {
    console.error("Inner PDF generation error:", err);
    throw err;
  }
};

export const QuotationPDF = ({ data }: { data: QuotationData }) => {
  const Header = () => (
    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-emerald-100">
      <div className="flex items-center gap-4">
        {data.company_logo ? (
          <img src={data.company_logo} alt="Company Logo" className="h-16 object-contain" />
        ) : (
          <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <Sun size={32} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{data.company_name}</h1>
          <p className="text-sm text-slate-500 font-medium tracking-wide text-emerald-600">EMPOWERING A SUSTAINABLE FUTURE</p>
        </div>
      </div>
      <div className="text-right text-sm text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800">Quotation: <span className="text-emerald-700">{data.quotation_number}</span></p>
        <p>Date: {data.quotation_date}</p>
        <p>Valid Until: {data.valid_until}</p>
        <div className="mt-2 inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-200 shadow-sm">
          Solar System Proposal
        </div>
      </div>
    </div>
  );

  const Footer = ({ pageInfo = true }) => (
    <div className="mt-auto pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col items-center gap-2 pb-4">
      <div className="w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-emerald-400 rounded-full mb-2 opacity-50"></div>
      <p className="font-semibold text-slate-700">{data.company_name}</p>
      <div className="flex items-center gap-4 text-slate-500">
        <span className="flex items-center gap-1"><Phone size={12} /> {data.company_phone}</span>
        <span className="flex items-center gap-1"><Mail size={12} /> {data.company_email}</span>
        <span className="flex items-center gap-1"><Globe size={12} /> {data.company_website}</span>
      </div>
      <p className="flex items-center gap-1"><MapPin size={12} /> {data.company_address}</p>
      {/* html2pdf doesn't support dynamic page numbers easily out of the box without complex jsPDF manipulation, 
          so we typically add a static footer or handle it via CSS if supported. */}
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white mx-auto relative overflow-hidden font-sans text-slate-800" style={{ width: '210mm', minHeight: '297mm' }}>
      
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-60 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl -z-10 opacity-60 -translate-x-1/2 translate-y-1/2"></div>

      <div className="p-10 flex flex-col h-full">
        <Header />

        {/* Customer & Project Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Customer Details
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500 w-24 inline-block">Name:</span> <span className="font-semibold text-slate-800">{data.customer_name}</span></p>
              <p><span className="text-slate-500 w-24 inline-block">Mobile:</span> <span className="font-medium">{data.customer_phone}</span></p>
              <p><span className="text-slate-500 w-24 inline-block">Email:</span> <span className="font-medium">{data.customer_email}</span></p>
              {data.consumer_number && <p><span className="text-slate-500 w-24 inline-block">Consumer No:</span> <span className="font-medium">{data.consumer_number}</span></p>}
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Project Details
            </h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-start gap-2">
                <span className="text-slate-500 w-24 inline-block flex-shrink-0">Address:</span> 
                <span className="font-medium">{data.project_address}</span>
              </p>
              <p><span className="text-slate-500 w-24 inline-block">System Type:</span> <span className="font-medium">{data.system_type}</span></p>
              <p><span className="text-slate-500 w-24 inline-block">Phase:</span> <span className="font-medium">{data.phase}</span></p>
              <p><span className="text-slate-500 w-24 inline-block">Roof Type:</span> <span className="font-medium">{data.roof_type}</span></p>
            </div>
          </div>
        </div>

        {/* Hero Summary */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 mb-10 text-white shadow-xl relative overflow-hidden">
          <Sun className="absolute -right-4 -top-4 text-emerald-400 opacity-20 w-32 h-32" />
          <h2 className="text-xl font-bold mb-6 text-emerald-400">SOLAR SYSTEM PROPOSAL</h2>
          
          <div className="grid grid-cols-4 gap-4 relative z-10">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/5">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Capacity</p>
              <p className="text-2xl font-bold">{data.system_capacity} <span className="text-sm font-normal text-slate-300">kW</span></p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/5">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Annual Gen.</p>
              <p className="text-2xl font-bold">{data.annual_generation.toLocaleString()} <span className="text-sm font-normal text-slate-300">kWh</span></p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/5">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Panel Tech</p>
              <p className="text-lg font-bold leading-tight mt-1">{data.panel_type}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/5">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Inverter</p>
              <p className="text-lg font-bold leading-tight mt-1">{data.inverter_brand}</p>
            </div>
          </div>
        </div>

        {/* System Configuration Table */}
        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Settings className="text-emerald-500" size={20} /> System Configuration
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Component</th>
                  <th className="px-4 py-3">Brand / Model</th>
                  <th className="px-4 py-3">Specification</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3">Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.components.map((comp, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-700">{comp.category}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{comp.brand}</div>
                      <div className="text-slate-500 text-xs">{comp.model}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{comp.specification}</td>
                    <td className="px-4 py-3 text-center font-medium">{comp.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">{comp.warranty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scope of Supply */}
        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-blue-500" size={20} /> Scope of Supply
          </h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
            {data.scope_of_supply.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        
        <Footer />
      </div>

      {/* PAGE 2 */}
      <div className="p-10 flex flex-col h-full page-break-before-always" style={{ minHeight: '297mm' }}>
        <Header />

        {/* Pricing Summary */}
        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <IndianRupee className="text-emerald-500" size={20} /> Investment Summary
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 mb-6">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.pricing.map((item, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-700">{item.description}</td>
                    <td className="px-4 py-3 text-center">{item.qty}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-1/2 bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-800">{formatCurrency(data.subtotal)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatCurrency(data.discount)}</span>
                </div>
              )}
              
              <div className="h-px w-full bg-slate-200 my-2"></div>
              
              <div className="flex justify-between text-sm text-slate-600">
                <span>Taxable Amount</span>
                <span className="font-medium text-slate-800">{formatCurrency(data.taxable_amount)}</span>
              </div>
              
              {(data.cgst !== undefined && data.cgst > 0) && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>CGST</span>
                  <span>{formatCurrency(data.cgst)}</span>
                </div>
              )}
              {(data.sgst !== undefined && data.sgst > 0) && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>SGST</span>
                  <span>{formatCurrency(data.sgst)}</span>
                </div>
              )}
              {(data.igst !== undefined && data.igst > 0) && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>IGST</span>
                  <span>{formatCurrency(data.igst)}</span>
                </div>
              )}
              
              {(data.gov_charges > 0) && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Gov / Doc Charges</span>
                  <span>{formatCurrency(data.gov_charges)}</span>
                </div>
              )}

              <div className="h-px w-full bg-slate-200 my-2"></div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-base font-bold text-slate-800">TOTAL PROJECT COST</span>
                <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">{formatCurrency(data.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings & ROI */}
        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="text-blue-500" size={20} /> Your Solar Investment
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">Monthly Savings</p>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(data.monthly_savings)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">Annual Savings</p>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(data.annual_savings)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">Payback Period</p>
              <p className="text-xl font-bold text-blue-900">{data.payback_period} <span className="text-sm font-medium">Years</span></p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">25-Yr Generation</p>
              <p className="text-xl font-bold text-blue-900">{(data.lifetime_generation / 1000000).toFixed(2)} <span className="text-sm font-medium">MWh</span></p>
            </div>
          </div>
        </div>

        {/* Warranties */}
        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-slate-500" size={20} /> Warranties
          </h3>
          <div className="grid grid-cols-5 gap-3">
             <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
               <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Solar Modules</p>
               <p className="font-semibold text-sm text-slate-800">{data.warranties.modules}</p>
             </div>
             <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
               <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Inverter</p>
               <p className="font-semibold text-sm text-slate-800">{data.warranties.inverter}</p>
             </div>
             <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
               <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Structure</p>
               <p className="font-semibold text-sm text-slate-800">{data.warranties.structure}</p>
             </div>
             <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
               <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Installation</p>
               <p className="font-semibold text-sm text-slate-800">{data.warranties.installation}</p>
             </div>
             <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
               <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Other</p>
               <p className="font-semibold text-sm text-slate-800">{data.warranties.other}</p>
             </div>
          </div>
        </div>

        {/* Timeline & Payment Terms */}
        <div className="grid grid-cols-2 gap-8 mb-6 page-break-inside-avoid">
           <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="text-emerald-500" size={20} /> Project Timeline
              </h3>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-700 mb-3">Expected Delivery: <span className="text-emerald-700 font-bold">{data.expected_timeline}</span></p>
                <div className="relative border-l border-emerald-200 ml-2 space-y-4">
                  <div className="pl-4 relative">
                    <div className="absolute w-2 h-2 bg-emerald-500 rounded-full -left-[4.5px] top-1.5"></div>
                    <p className="text-xs font-semibold text-slate-700">Order Confirmation</p>
                  </div>
                  <div className="pl-4 relative">
                    <div className="absolute w-2 h-2 bg-emerald-500 rounded-full -left-[4.5px] top-1.5"></div>
                    <p className="text-xs font-semibold text-slate-700">Site Survey & Design</p>
                  </div>
                  <div className="pl-4 relative">
                    <div className="absolute w-2 h-2 bg-emerald-500 rounded-full -left-[4.5px] top-1.5"></div>
                    <p className="text-xs font-semibold text-slate-700">Material Delivery</p>
                  </div>
                  <div className="pl-4 relative">
                    <div className="absolute w-2 h-2 bg-emerald-500 rounded-full -left-[4.5px] top-1.5"></div>
                    <p className="text-xs font-semibold text-slate-700">Installation & Commissioning</p>
                  </div>
                </div>
              </div>
           </div>
           <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="text-blue-500" size={20} /> Payment Terms
              </h3>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                {data.payment_terms.map((term, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {term.percentage}%
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{term.description}</p>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <Footer />
      </div>

      {/* PAGE 3 */}
      <div className="p-10 flex flex-col h-full page-break-before-always" style={{ minHeight: '297mm' }}>
        <Header />

        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Terms & Conditions</h3>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
            {data.terms_and_conditions.map((term, idx) => (
              <li key={idx} className="leading-relaxed">{term}</li>
            ))}
          </ul>
        </div>

        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Exclusions</h3>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            {data.exclusions.map((exclusion, idx) => (
              <li key={idx}>{exclusion}</li>
            ))}
          </ul>
        </div>

        {data.bank_details && (
          <div className="mb-10 page-break-inside-avoid">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Bank Details</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <p><span className="text-slate-500 inline-block w-24">Account Name:</span> <span className="font-semibold text-slate-800">{data.bank_details.account_name}</span></p>
                <p><span className="text-slate-500 inline-block w-24">Bank Name:</span> <span className="font-semibold text-slate-800">{data.bank_details.bank_name}</span></p>
                <p><span className="text-slate-500 inline-block w-24">A/C Number:</span> <span className="font-semibold text-slate-800">{data.bank_details.account_number}</span></p>
                <p><span className="text-slate-500 inline-block w-24">IFSC:</span> <span className="font-semibold text-slate-800">{data.bank_details.ifsc}</span></p>
                {data.bank_details.upi_id && (
                  <p className="col-span-2 mt-1"><span className="text-slate-500 inline-block w-24">UPI ID:</span> <span className="font-semibold text-emerald-700">{data.bank_details.upi_id}</span></p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 page-break-inside-avoid border-2 border-dashed border-slate-200 p-8 rounded-2xl bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 mb-8 text-center uppercase tracking-widest">Customer Acceptance</h3>
          <p className="text-sm text-slate-600 text-center mb-10 max-w-xl mx-auto">
            I/We hereby accept the above quotation and authorize {data.company_name} to proceed according to the stated scope, pricing and terms.
          </p>
          
          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="h-10 border-b border-slate-300 mb-2"></div>
              <p className="text-xs text-slate-500 text-center uppercase font-semibold">Customer Signature</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Name: ______________________</p>
                <p>Date: ______________________</p>
              </div>
            </div>
            <div>
              <div className="h-10 border-b border-slate-300 mb-2"></div>
              <p className="text-xs text-slate-500 text-center uppercase font-semibold">Company Representative</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Name: ______________________</p>
                <p>Date: ______________________</p>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

    </div>
  );
};
