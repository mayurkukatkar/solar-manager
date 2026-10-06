"use client";

import React from "react";
import { 
  Sun, MapPin, Phone, Mail, Globe, Zap, Battery, Settings,
  ShieldCheck, CheckCircle2, Calendar, IndianRupee, Activity,
  FileText, ArrowRight, Leaf, Trees, Wind, Check, AlertCircle, Home,
  Info, Cpu, Cable, Wrench, Shield, FileCheck
} from "lucide-react";

export interface QuotationData {
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
  system_type: string;
  connection_type: string;
  phase: string;
  roof_type: string;
  installation_type: string;
  expected_timeline: string;
  
  panel_brand: string;
  panel_model: string;
  panel_wattage: number;
  panel_quantity: number;
  panel_warranty: string;
  
  inverter_brand: string;
  inverter_model: string;
  inverter_capacity: number;
  inverter_quantity: number;
  inverter_warranty: string;
  
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
  
  scope_of_supply: string[];
  
  pricing: Array<{
    description: string;
    qty: number | string;
    unit_price: number;
    amount: number;
  }>;
  
  subtotal: number;
  discount: number;
  tax: number;
  other_charges: number;
  grand_total: number;
  amount_in_words: string;
  
  current_monthly_bill: number;
  estimated_monthly_bill: number;
  annual_savings: number;
  monthly_savings: number;
  payback_period: number;
  lifetime_savings: number;
  lifetime_generation: number;
  
  co2_reduction: number;
  tree_equivalent: number;
  peak_month: string;
  monthly_generation?: Array<{ month: string; generation: number }>;
  
  payment_terms: Array<{ percentage: number; amount: number; description: string }>;
  
  warranties: {
    modules: string;
    inverter: string;
    structure: string;
    installation: string;
    other: string;
  };
  
  included_terms: string[];
  exclusions: string[];
  terms_and_conditions: string[];
  
  bank_details?: {
    account_name: string;
    bank_name: string;
    account_number: string;
    ifsc: string;
    upi_id?: string;
  };
}

export const generatePDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Patch window.getComputedStyle to strip lab/oklch colors for html2canvas
  // Tailwind v4 uses modern CSS colors which crash older html2canvas versions
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(el, pseudoElt) {
    const style = originalGetComputedStyle.call(window, el, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        let value = Reflect.get(target, prop, receiver);
        if (typeof value === 'string' && (value.includes('lab(') || value.includes('oklch(') || value.includes('color('))) {
          // If it's a border or text color that fell back to a modern CSS variable, 
          // we force it to a safe standard color to prevent html2canvas from crashing.
          if (prop === 'color' || prop === 'backgroundColor') return 'rgb(0, 0, 0)';
          return 'rgba(0, 0, 0, 0)'; 
        }
        return value;
      }
    });
  };

  const opt: any = {
    margin: 0,
    filename: filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] }
  };

  try {
    const _html2pdf = require("html2pdf.js");
    const html2pdf = _html2pdf.default || _html2pdf;
    return await html2pdf().set(opt).from(element).save();
  } catch (err: any) {
    console.error("Inner PDF generation error:", err);
    throw err;
  } finally {
    // Restore original getComputedStyle
    window.getComputedStyle = originalGetComputedStyle;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const PdfPage = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`w-[210mm] h-[297mm] relative overflow-hidden flex flex-col page-break-after-always ${className}`}>
    {children}
  </div>
);

const Footer = ({ data, pageNum }: { data: QuotationData, pageNum: string }) => (
  <div className="absolute bottom-8 left-12 right-12 flex justify-between items-end text-[10px] font-medium tracking-widest text-slate-400 uppercase">
    <div>
      <span className="text-slate-800 font-bold">{data.company_name}</span><br />
      {data.company_website} · {data.company_phone} · {data.company_email}
    </div>
    <div className="text-right">
      QUOTATION {data.quotation_number}<br />
      PAGE {pageNum}
    </div>
  </div>
);

const DarkFooter = ({ data, pageNum }: { data: QuotationData, pageNum: string }) => (
  <div className="absolute bottom-8 left-12 right-12 flex justify-between items-end text-[10px] font-medium tracking-widest text-slate-400 uppercase">
    <div>
      <span className="text-white font-bold">{data.company_name}</span><br />
      {data.company_website} · {data.company_phone} · {data.company_email}
    </div>
    <div className="text-right">
      QUOTATION {data.quotation_number}<br />
      PAGE {pageNum}
    </div>
  </div>
);

export const QuotationPDF = ({ data }: { data: QuotationData }) => {
  let pageCount = 1;
  const getPageNum = () => String(pageCount++).padStart(2, "0");

  return (
    <div className="bg-[#e2e8f0] mx-auto font-sans text-slate-800" style={{ width: "210mm" }}>
      
      {/* PAGE 01 - COVER */}
      <PdfPage className="bg-[#071A2B] text-white">
        <div className="absolute inset-0 z-0">
          <img src="/assets/solar-quotation/cover.jpg" className="w-full h-full object-cover opacity-60" alt="Cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071A2B] via-[#071A2B]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071A2B] via-transparent to-transparent opacity-80" />
        </div>
        
        <div className="relative z-10 p-16 h-full flex flex-col justify-between">
          <div className="flex items-center gap-4">
            {data.company_logo ? (
              <img src={data.company_logo} alt="Logo" className="h-12 object-contain" />
            ) : (
              <Sun className="text-[#19A974]" size={40} />
            )}
            <span className="text-xl font-bold tracking-widest uppercase">{data.company_name}</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[#19A974] font-bold tracking-[0.2em] mb-4 text-sm">POWER YOUR FUTURE.</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-12 tracking-tight">
              SOLAR ENERGY<br />PROPOSAL
            </h1>
            
            <div className="relative">
              <div className="absolute -left-16 -top-16 w-64 h-64 bg-[#F6C945] rounded-full blur-[100px] opacity-20"></div>
              <div className="relative border-l-4 border-[#19A974] pl-6 py-2">
                <p className="text-4xl font-light mb-1"><span className="font-bold">{data.system_capacity}</span> kW</p>
                <p className="text-lg text-slate-300 font-medium tracking-wide">Rooftop Solar PV System</p>
              </div>
            </div>

            <div className="mt-20">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Prepared exclusively for</p>
              <p className="text-2xl font-semibold">{data.customer_name}</p>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex justify-between items-end text-sm text-slate-300 uppercase tracking-widest font-medium">
            <div>
              QUOTATION<br />
              <span className="text-white font-bold">{data.quotation_number}</span>
            </div>
            <div className="text-right">
              DATE<br />
              <span className="text-white font-bold">{data.quotation_date}</span>
            </div>
          </div>
        </div>
      </PdfPage>

      {/* PAGE 02 - THE SOLAR OPPORTUNITY */}
      <PdfPage className="bg-[#F7F9FC]">
        <div className="flex h-full">
          <div className="w-[45%] p-14 flex flex-col justify-center relative z-10">
            <div className="absolute top-12 left-14 text-9xl font-black text-slate-200/50 -z-10">02</div>
            <h2 className="text-4xl font-extrabold leading-tight mb-8 text-[#071A2B]">
              YOUR ROOFTOP.<br/>
              YOUR ENERGY.<br/>
              <span className="text-[#19A974]">YOUR FUTURE.</span>
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              Transform your rooftop into a long-term clean energy asset designed to reduce electricity costs and increase energy independence.
            </p>
          </div>
          <div className="w-[55%] relative">
            <img src="/assets/solar-quotation/rooftop.jpg" className="w-full h-full object-cover" alt="Rooftop" />
            <div className="absolute inset-0 bg-[#071A2B]/20"></div>
            
            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-72 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl">
              <p className="text-white/80 text-xs uppercase tracking-widest mb-1">Proposed System</p>
              <p className="text-4xl font-bold text-white mb-8">{data.system_capacity} <span className="text-xl font-light">kW</span></p>
              
              <p className="text-white/80 text-xs uppercase tracking-widest mb-1">Est. Annual Generation</p>
              <p className="text-4xl font-bold text-[#F6C945]">{data.annual_generation.toLocaleString()} <span className="text-xl font-light text-white">kWh</span></p>
            </div>
          </div>
        </div>
        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 03 - YOUR SYSTEM AT A GLANCE */}
      <PdfPage className="bg-[#071A2B] text-white p-14">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0B2942] via-[#071A2B] to-[#071A2B] -z-10"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] -z-10"></div>
        
        <div className="text-8xl font-black text-white/5 absolute top-12 right-14">03</div>
        <h2 className="text-3xl font-bold mb-16 tracking-wide">YOUR SYSTEM AT A GLANCE</h2>
        
        <div className="grid grid-cols-2 gap-x-12 gap-y-16 flex-1 content-start mt-8">
          <div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">01 &nbsp; SYSTEM CAPACITY</p>
            <p className="text-6xl font-light"><span className="font-bold">{data.system_capacity}</span> <span className="text-2xl text-slate-400">kW</span></p>
          </div>
          <div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">02 &nbsp; ANNUAL GENERATION</p>
            <p className="text-6xl font-light"><span className="font-bold">{data.annual_generation.toLocaleString()}</span> <span className="text-2xl text-slate-400">kWh</span></p>
          </div>
          <div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">03 &nbsp; ANNUAL SAVINGS</p>
            <p className="text-6xl font-light"><span className="text-4xl text-slate-400">₹</span><span className="font-bold">{data.annual_savings.toLocaleString()}</span></p>
          </div>
          <div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">04 &nbsp; PAYBACK PERIOD</p>
            <p className="text-6xl font-light"><span className="font-bold">{data.payback_period}</span> <span className="text-2xl text-slate-400">Years</span></p>
          </div>
          <div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">05 &nbsp; CO₂ REDUCTION</p>
            <p className="text-6xl font-light text-[#F6C945]"><span className="font-bold\">{(data.co2_reduction / 1000).toFixed(1)}</span> <span className="text-2xl text-slate-400">Tons/Yr</span></p>
          </div>
        </div>
        
        <DarkFooter data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 04 - HOW YOUR SYSTEM WORKS */}
      <PdfPage className="bg-white p-14">
        <div className="text-8xl font-black text-slate-100 absolute top-12 right-14">04</div>
        <h2 className="text-3xl font-bold mb-20 text-[#071A2B] tracking-wide">HOW YOUR SYSTEM WORKS</h2>
        
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <Sun className="text-[#F6C945] w-24 h-24 mb-8" />
          
          <div className="w-0.5 h-16 bg-gradient-to-b from-[#F6C945] to-[#19A974]"></div>
          
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 w-80 text-center relative z-10">
            <div className="w-12 h-12 bg-[#071A2B] text-white rounded-full flex items-center justify-center mx-auto -mt-12 mb-4 shadow-lg">
              <Settings size={20} />
            </div>
            <h3 className="font-bold tracking-widest text-sm mb-2">SOLAR PANELS</h3>
            <p className="text-sm text-slate-500">Convert sunlight directly into DC electricity.</p>
          </div>
          
          <div className="w-0.5 h-16 bg-[#19A974]"></div>
          
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 w-80 text-center relative z-10">
            <div className="w-12 h-12 bg-[#071A2B] text-white rounded-full flex items-center justify-center mx-auto -mt-12 mb-4 shadow-lg">
              <Zap size={20} />
            </div>
            <h3 className="font-bold tracking-widest text-sm mb-2">INVERTER</h3>
            <p className="text-sm text-slate-500">Converts DC electricity into usable AC electricity.</p>
          </div>

          <div className="w-0.5 h-16 bg-[#19A974]"></div>
          
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 w-80 text-center relative z-10">
            <div className="w-12 h-12 bg-[#071A2B] text-white rounded-full flex items-center justify-center mx-auto -mt-12 mb-4 shadow-lg">
              <Home size={20} />
            </div>
            <h3 className="font-bold tracking-widest text-sm mb-2">YOUR BUILDING</h3>
            <p className="text-sm text-slate-500">Consume clean solar power for your daily electrical needs.</p>
          </div>

          <div className="w-0.5 h-16 bg-gradient-to-b from-[#19A974] to-[#0B2942]"></div>
          
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 w-80 text-center relative z-10">
            <div className="w-12 h-12 bg-[#071A2B] text-white rounded-full flex items-center justify-center mx-auto -mt-12 mb-4 shadow-lg">
              <Globe size={20} />
            </div>
            <h3 className="font-bold tracking-widest text-sm mb-2">ELECTRICITY GRID</h3>
            <p className="text-sm text-slate-500">Export excess energy to the grid (if net metering is active).</p>
          </div>
        </div>
        
        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 05 - PROJECT SNAPSHOT */}
      <PdfPage className="bg-white">
        <div className="flex flex-col h-full">
          <div className="h-1/2 relative">
             <img src="/assets/solar-quotation/rooftop.jpg" className="w-full h-full object-cover" alt="Rooftop" />
             <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
          </div>
          
          <div className="p-14 flex-1 flex flex-col justify-center relative">
            <div className="text-8xl font-black text-slate-100 absolute top-0 right-14">05</div>
            <h2 className="text-3xl font-bold mb-12 text-[#071A2B] tracking-wide">BUILT AROUND YOUR PROPERTY</h2>
            
            <div className="grid grid-cols-2 gap-x-16 gap-y-10">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1 uppercase">Customer</p>
                <p className="text-xl font-medium text-slate-800">{data.customer_name}</p>
              </div>
              <div className="border-b border-slate-200 pb-4">
                <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1 uppercase">Location</p>
                <p className="text-xl font-medium text-slate-800">{data.project_address}</p>
              </div>
              <div className="border-b border-slate-200 pb-4">
                <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1 uppercase">Roof Type</p>
                <p className="text-xl font-medium text-slate-800">{data.roof_type}</p>
              </div>
              <div className="border-b border-slate-200 pb-4">
                <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1 uppercase">System Type</p>
                <p className="text-xl font-medium text-slate-800">{data.system_type}</p>
              </div>
              <div className="border-b border-slate-200 pb-4">
                <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1 uppercase">Connection</p>
                <p className="text-xl font-medium text-slate-800">{data.connection_type}</p>
              </div>
              <div className="border-b border-slate-200 pb-4">
                <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1 uppercase">Phase</p>
                <p className="text-xl font-medium text-slate-800">{data.phase}</p>
              </div>
            </div>
          </div>
        </div>
        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 06 - ENGINEERED COMPONENTS */}
      <PdfPage className="bg-[#F7F9FC] p-14">
        <div className="text-8xl font-black text-slate-200 absolute top-12 right-14">06</div>
        <h2 className="text-3xl font-extrabold mb-16 text-[#071A2B] leading-tight">
          EVERY COMPONENT.<br/>
          CAREFULLY SELECTED.
        </h2>
        
        <div className="space-y-6 flex-1">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex gap-8 items-center">
            <div className="w-32 h-32 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
              <div className="w-20 h-20 border-[3px] border-slate-300 grid grid-cols-4 grid-rows-6 gap-0.5 p-0.5">
                 {Array(24).fill(0).map((_, i) => <div key={i} className="bg-blue-900/80"></div>)}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">SOLAR MODULES</p>
              <h3 className="text-2xl font-bold text-[#071A2B] mb-1">{data.panel_brand}</h3>
              <p className="text-slate-500 mb-4">{data.panel_model}</p>
              <div className="flex gap-8">
                 <div>
                   <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Capacity</p>
                   <p className="font-bold">{data.panel_wattage} Wp × {data.panel_quantity}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Warranty</p>
                   <p className="font-bold">{data.panel_warranty}</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex gap-8 items-center">
            <div className="w-32 h-32 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden relative">
              <img src="/assets/solar-quotation/technology.jpg" className="w-full h-full object-cover" alt="Inverter" />
            </div>
            <div className="flex-1">
              <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">INVERTER</p>
              <h3 className="text-2xl font-bold text-[#071A2B] mb-1">{data.inverter_brand}</h3>
              <p className="text-slate-500 mb-4">{data.inverter_model}</p>
              <div className="flex gap-8">
                 <div>
                   <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Capacity</p>
                   <p className="font-bold">{data.inverter_capacity} kW × {data.inverter_quantity}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Warranty</p>
                   <p className="font-bold">{data.inverter_warranty}</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex gap-8 items-center">
            <div className="w-32 h-32 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Settings size={48} />
            </div>
            <div className="flex-1">
              <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">MOUNTING STRUCTURE</p>
              <h3 className="text-2xl font-bold text-[#071A2B] mb-1">{data.structure_brand}</h3>
              <p className="text-slate-500 mb-4">Premium Aluminum / HDG Steel</p>
              <div>
                 <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Warranty</p>
                 <p className="font-bold">{data.structure_warranty}</p>
              </div>
            </div>
          </div>
        </div>

        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 07 - SYSTEM SPECIFICATIONS */}
      <PdfPage className="bg-[#071A2B] text-white p-14">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] -z-10"></div>
        <div className="text-8xl font-black text-white/5 absolute top-12 right-14">07</div>
        
        <h2 className="text-3xl font-bold mb-16 tracking-wide">ENGINEERED FOR PERFORMANCE</h2>
        
        <div className="rounded-xl border border-white/10 overflow-hidden mb-12">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 uppercase tracking-widest text-[10px] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold">Component</th>
                <th className="px-6 py-4 font-bold">Brand</th>
                <th className="px-6 py-4 font-bold">Specification</th>
                <th className="px-6 py-4 font-bold text-center">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {data.components.map((c, i) => (
                <tr key={i} className="bg-transparent">
                  <td className="px-6 py-4 font-medium">{c.category}</td>
                  <td className="px-6 py-4 text-slate-300">{c.brand}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{c.specification}</td>
                  <td className="px-6 py-4 text-center font-bold text-[#F6C945]">{c.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-auto mb-16">
          <p className="text-[#19A974] font-bold tracking-widest text-xs mb-6">DESIGNED FOR</p>
          <div className="grid grid-cols-4 gap-6">
             <div className="border-t-2 border-white/20 pt-4">
               <p className="font-bold">Reliability</p>
             </div>
             <div className="border-t-2 border-white/20 pt-4">
               <p className="font-bold">Performance</p>
             </div>
             <div className="border-t-2 border-white/20 pt-4">
               <p className="font-bold">Safety</p>
             </div>
             <div className="border-t-2 border-white/20 pt-4">
               <p className="font-bold">Longevity</p>
             </div>
          </div>
        </div>

        <DarkFooter data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 08 - ENERGY GENERATION */}
      {data.monthly_generation && (
      <PdfPage className="bg-white p-14">
        <div className="text-8xl font-black text-slate-100 absolute top-12 right-14">08</div>
        <h2 className="text-3xl font-bold mb-16 text-[#071A2B] tracking-wide">ENERGY YOU CAN EXPECT</h2>
        
        <div className="text-center mb-16">
          <p className="text-8xl font-light text-[#071A2B]"><span className="font-bold">{data.annual_generation.toLocaleString()}</span></p>
          <p className="text-[#19A974] font-bold tracking-widest mt-2 uppercase">kWh / YEAR</p>
        </div>

        <div className="h-80 border-b border-slate-200 flex items-end justify-between px-4 pb-2 gap-2">
           {data.monthly_generation.map((m, i) => {
             const max = Math.max(...data.monthly_generation!.map(x => x.generation));
             const height = (m.generation / max) * 100;
             return (
               <div key={i} className="flex flex-col items-center w-full group">
                 <div className="w-full bg-gradient-to-t from-[#19A974] to-[#F6C945] rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity" style={{ height: `${height}%` }}></div>
                 <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{m.month.substring(0,3)}</p>
               </div>
             )
           })}
        </div>

        <div className="grid grid-cols-2 gap-12 mt-16">
           <div className="bg-slate-50 p-8 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Peak Generation Month</p>
              <p className="text-3xl font-bold text-[#071A2B]">{data.peak_month}</p>
           </div>
           <div className="bg-slate-50 p-8 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Lifetime Generation (25 Yrs)</p>
              <p className="text-3xl font-bold text-[#071A2B]">{(data.lifetime_generation / 1000).toLocaleString()} <span className="text-lg text-slate-500">MWh</span></p>
           </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-auto">* Generation values are estimates based on standard irradiance data and system specifications. Actual output may vary based on weather conditions and maintenance.</p>
        
        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>
      )}

      {/* PAGE 09 - THE FINANCIAL IMPACT */}
      <PdfPage className="bg-[#0B2942] text-white p-14">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#071A2B]/50 via-[#0B2942] to-[#0B2942] -z-10"></div>
        <div className="text-8xl font-black text-white/5 absolute top-12 right-14">09</div>
        <h2 className="text-4xl font-extrabold mb-16 leading-tight">
          YOUR ELECTRICITY BILL,<br/>
          <span className="text-[#F6C945]">REIMAGINED.</span>
        </h2>
        
        <div className="flex items-center justify-between mb-20 bg-white/5 p-10 rounded-3xl border border-white/10">
           <div className="text-center flex-1">
             <p className="text-xs font-bold tracking-widest text-slate-400 mb-4">BEFORE SOLAR</p>
             <p className="text-5xl font-bold text-slate-300">₹{data.current_monthly_bill.toLocaleString()}</p>
             <p className="text-sm text-slate-500 mt-2">Monthly Average</p>
           </div>
           
           <ArrowRight className="text-[#19A974] w-12 h-12" />
           
           <div className="text-center flex-1">
             <p className="text-xs font-bold tracking-widest text-[#19A974] mb-4">AFTER SOLAR</p>
             <p className="text-5xl font-bold text-[#F6C945]">₹{data.estimated_monthly_bill.toLocaleString()}</p>
             <p className="text-sm text-slate-400 mt-2">Estimated Monthly</p>
           </div>
        </div>

        <div className="text-center mb-16 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#19A974] blur-[120px] opacity-30 rounded-full -z-10"></div>
           <p className="text-xs font-bold tracking-widest text-slate-400 mb-4 uppercase">Estimated Annual Savings</p>
           <p className="text-8xl font-light text-white"><span className="text-5xl">₹</span><span className="font-bold">{data.annual_savings.toLocaleString()}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-auto mb-16">
           <div className="border-t border-white/20 pt-6">
             <p className="text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase">Payback Period</p>
             <p className="text-4xl font-bold">{data.payback_period} <span className="text-xl font-light text-slate-400">YEARS</span></p>
           </div>
           <div className="border-t border-white/20 pt-6">
             <p className="text-xs font-bold tracking-widest text-slate-400 mb-2 uppercase">25-Year Value</p>
             <p className="text-4xl font-bold text-[#19A974]"><span className="text-xl font-light text-[#19A974]">₹</span> {data.lifetime_savings.toLocaleString()}</p>
           </div>
        </div>
        
        <DarkFooter data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 10 - ENVIRONMENTAL IMPACT */}
      <PdfPage className="bg-[#071A2B] text-white">
        <div className="flex flex-col h-full">
          <div className="h-[55%] relative">
             <img src="/assets/solar-quotation/environment.jpg" className="w-full h-full object-cover" alt="Environment" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#071A2B] via-transparent to-transparent"></div>
          </div>
          
          <div className="p-14 flex-1 flex flex-col justify-center relative">
            <div className="text-8xl font-black text-white/5 absolute top-0 right-14">10</div>
            <h2 className="text-3xl font-extrabold mb-12 text-white tracking-wide">CLEAN ENERGY.<br/><span className="text-[#19A974]">REAL IMPACT.</span></h2>
            
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
                <Wind className="text-[#19A974] w-10 h-10 mx-auto mb-4" />
                <p className="text-3xl font-bold mb-2">{data.co2_reduction.toLocaleString()} <span className="text-lg font-light text-slate-400">kg</span></p>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">CO₂ Reduction / Yr</p>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
                <Trees className="text-[#19A974] w-10 h-10 mx-auto mb-4" />
                <p className="text-3xl font-bold mb-2">{data.tree_equivalent.toLocaleString()}</p>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Trees Equivalent</p>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
                <Leaf className="text-[#F6C945] w-10 h-10 mx-auto mb-4" />
                <p className="text-3xl font-bold mb-2">{data.annual_generation.toLocaleString()}</p>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">kWh Clean Energy</p>
              </div>
            </div>
          </div>
        </div>
        <DarkFooter data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 11 - WHAT'S INCLUDED */}
      <PdfPage className="bg-white p-14">
        <div className="text-8xl font-black text-slate-100 absolute top-12 right-14">11</div>
        <h2 className="text-3xl font-bold mb-16 text-[#071A2B] tracking-wide">YOUR COMPLETE PACKAGE</h2>
        
        <div className="grid grid-cols-2 gap-x-12 gap-y-10">
          {data.scope_of_supply.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center flex-shrink-0">
                <Check size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">{item}</h4>
                <p className="text-sm text-slate-500">Included in the scope of work.</p>
              </div>
            </div>
          ))}
        </div>
        
        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 12 - INSTALLATION JOURNEY */}
      <PdfPage className="bg-[#F7F9FC] p-14">
        <div className="text-8xl font-black text-slate-200 absolute top-12 right-14">12</div>
        <h2 className="text-3xl font-bold mb-16 text-[#071A2B] tracking-wide">FROM ORDER TO POWER</h2>
        
        <div className="relative pl-8 space-y-12">
          <div className="absolute left-[11px] top-4 bottom-4 w-1 bg-gradient-to-b from-[#19A974] to-[#0B2942]"></div>
          
          <div className="relative">
            <div className="absolute -left-11 top-1 w-6 h-6 bg-[#19A974] rounded-full border-4 border-white shadow-sm"></div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1">STEP 01</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Order Confirmation</h3>
            <p className="text-slate-600">Quotation accepted and initial booking amount received.</p>
          </div>
          
          <div className="relative">
            <div className="absolute -left-11 top-1 w-6 h-6 bg-[#19A974] rounded-full border-4 border-white shadow-sm"></div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1">STEP 02</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Site Survey & Engineering</h3>
            <p className="text-slate-600">Our engineers visit your site for a detailed technical assessment and structural design.</p>
          </div>
          
          <div className="relative">
            <div className="absolute -left-11 top-1 w-6 h-6 bg-[#19A974] rounded-full border-4 border-white shadow-sm"></div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1">STEP 03</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Procurement & Delivery</h3>
            <p className="text-slate-600">Premium components are dispatched and delivered to your property.</p>
          </div>
          
          <div className="relative">
            <div className="absolute -left-11 top-1 w-6 h-6 bg-[#19A974] rounded-full border-4 border-white shadow-sm"></div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1">STEP 04</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Professional Installation</h3>
            <p className="text-slate-600">Our certified teams mount the structure, lay cables, and install modules and inverters securely.</p>
          </div>
          
          <div className="relative">
            <div className="absolute -left-11 top-1 w-6 h-6 bg-[#19A974] rounded-full border-4 border-white shadow-sm"></div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-1">STEP 05</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Testing & Commissioning</h3>
            <p className="text-slate-600">Rigorous quality checks and system activation.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-11 top-1 w-6 h-6 bg-[#0B2942] rounded-full border-4 border-white shadow-sm"></div>
            <p className="text-[#0B2942] font-bold tracking-widest text-xs mb-1">STEP 06</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Handover & Net Metering</h3>
            <p className="text-slate-600">Final documentation handover and DISCOM net metering activation (if applicable).</p>
          </div>
        </div>

        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 13 - INVESTMENT */}
      <PdfPage className="bg-white p-14">
        <div className="text-8xl font-black text-slate-100 absolute top-12 right-14">13</div>
        <h2 className="text-3xl font-bold mb-16 text-[#071A2B] tracking-wide">YOUR SOLAR INVESTMENT</h2>
        
        <div className="mb-12">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-slate-800 text-slate-800">
              <tr>
                <th className="py-4 text-left font-bold">Description</th>
                <th className="py-4 text-center font-bold">Qty</th>
                <th className="py-4 text-right font-bold">Unit Price</th>
                <th className="py-4 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.pricing.map((p, i) => (
                <tr key={i}>
                  <td className="py-5 font-medium text-slate-700">{p.description}</td>
                  <td className="py-5 text-center text-slate-500">{p.qty}</td>
                  <td className="py-5 text-right text-slate-500">{formatCurrency(p.unit_price)}</td>
                  <td className="py-5 text-right font-bold text-slate-800">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto w-80 space-y-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-bold text-slate-800">{formatCurrency(data.subtotal)}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between text-[#19A974]">
              <span>Discount</span>
              <span className="font-bold">-{formatCurrency(data.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Tax</span>
            <span className="font-bold text-slate-800">{formatCurrency(data.tax)}</span>
          </div>
          {data.other_charges > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Other Charges</span>
              <span className="font-bold text-slate-800">{formatCurrency(data.other_charges)}</span>
            </div>
          )}
          
          <div className="pt-6 border-t-2 border-slate-800 flex justify-between items-center">
            <span className="font-bold text-slate-800 uppercase tracking-widest text-xs">TOTAL INVESTMENT</span>
            <span className="text-3xl font-black text-[#071A2B]">{formatCurrency(data.grand_total)}</span>
          </div>
          <p className="text-right text-xs text-slate-500 italic">{data.amount_in_words}</p>
        </div>

        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 14 - PAYMENT PLAN */}
      {data.payment_terms && data.payment_terms.length > 0 && (
      <PdfPage className="bg-[#F7F9FC] p-14">
        <div className="text-8xl font-black text-slate-200 absolute top-12 right-14">14</div>
        <h2 className="text-3xl font-bold mb-20 text-[#071A2B] tracking-wide">PAYMENT SCHEDULE</h2>
        
        <div className="space-y-6 relative">
          <div className="absolute left-10 top-10 bottom-10 w-1 bg-[#19A974]/20"></div>
          
          {data.payment_terms.map((term, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-8 flex items-center shadow-sm relative z-10">
              <div className="w-20 h-20 bg-[#071A2B] text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg flex-shrink-0">
                {term.percentage}%
              </div>
              <div className="ml-8 flex-1">
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Stage 0{i + 1}</p>
                <h3 className="text-xl font-bold text-slate-800">{term.description}</h3>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-[#19A974]">{formatCurrency(term.amount)}</p>
              </div>
            </div>
          ))}
        </div>

        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>
      )}

      {/* PAGE 15 - WARRANTY & ASSURANCE */}
      <PdfPage className="bg-[#071A2B] text-white p-14">
        <div className="text-8xl font-black text-white/5 absolute top-12 right-14">15</div>
        <h2 className="text-3xl font-extrabold mb-16 leading-tight tracking-wide">
          BUILT FOR YEARS.<br/>
          <span className="text-[#19A974]">BACKED BY WARRANTY.</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
            <Shield className="text-[#F6C945] w-12 h-12 mb-6" />
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">SOLAR MODULES</p>
            <p className="text-3xl font-bold mb-4">{data.warranties.modules}</p>
            <p className="text-sm text-slate-400">Performance and product warranty directly from the OEM.</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
            <Cpu className="text-[#F6C945] w-12 h-12 mb-6" />
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">INVERTER</p>
            <p className="text-3xl font-bold mb-4">{data.warranties.inverter}</p>
            <p className="text-sm text-slate-400">Standard replacement/repair warranty provided by the manufacturer.</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
            <Wrench className="text-[#F6C945] w-12 h-12 mb-6" />
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">STRUCTURE</p>
            <p className="text-3xl font-bold mb-4">{data.warranties.structure}</p>
            <p className="text-sm text-slate-400">Warranty against manufacturing defects and structural failure.</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
            <FileCheck className="text-[#F6C945] w-12 h-12 mb-6" />
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-2">WORKMANSHIP</p>
            <p className="text-3xl font-bold mb-4">{data.warranties.installation}</p>
            <p className="text-sm text-slate-400">Comprehensive service warranty covering installation quality.</p>
          </div>
        </div>

        <DarkFooter data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 16 - TERMS & EXCLUSIONS */}
      <PdfPage className="bg-white p-14">
        <div className="text-8xl font-black text-slate-100 absolute top-12 right-14">16</div>
        <h2 className="text-3xl font-bold mb-12 text-[#071A2B] tracking-wide">CLEAR TERMS. NO SURPRISES.</h2>
        
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-[#19A974] font-bold tracking-widest text-sm mb-6 uppercase flex items-center gap-2"><CheckCircle2 size={18}/> WHAT'S INCLUDED</h3>
            <ul className="space-y-3">
              {data.included_terms.map((t, i) => (
                <li key={i} className="text-xs text-slate-600 leading-relaxed pl-4 relative">
                  <div className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-[#19A974] rounded-full"></div>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-red-500 font-bold tracking-widest text-sm mb-6 uppercase flex items-center gap-2"><AlertCircle size={18}/> NOT INCLUDED</h3>
            <ul className="space-y-3">
              {data.exclusions.map((t, i) => (
                <li key={i} className="text-xs text-slate-600 leading-relaxed pl-4 relative">
                  <div className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-200 pt-8">
          <h3 className="text-slate-800 font-bold tracking-widest text-sm mb-6 uppercase">TERMS & CONDITIONS</h3>
          <div className="columns-2 gap-8">
            <ul className="space-y-3">
              {data.terms_and_conditions.map((t, i) => (
                <li key={i} className="text-xs text-slate-500 leading-relaxed">{i+1}. {t}</li>
              ))}
            </ul>
          </div>
        </div>

        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 17 - CUSTOMER ACCEPTANCE */}
      <PdfPage className="bg-white p-14">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none -z-10">
          <Sun size={400} />
        </div>
        
        <h2 className="text-4xl font-extrabold mb-8 text-[#071A2B] tracking-wide text-center mt-12">READY TO GO SOLAR?</h2>
        
        <p className="text-center text-slate-600 max-w-xl mx-auto mb-20 leading-relaxed">
          I/We hereby accept the above quotation and authorize <strong>{data.company_name}</strong> to proceed according to the stated scope, pricing and terms.
        </p>
        
        <div className="grid grid-cols-2 gap-20 max-w-3xl mx-auto">
          <div>
            <div className="h-24 border-b border-slate-300 mb-4"></div>
            <p className="text-[#19A974] font-bold tracking-widest text-xs mb-6 uppercase">CUSTOMER SIGNATURE</p>
            <div className="space-y-4 text-sm text-slate-500">
              <p>Name: <span className="text-slate-800 font-medium ml-2">{data.customer_name}</span></p>
              <p>Date: ________________________</p>
            </div>
          </div>
          <div>
            <div className="h-24 border-b border-slate-300 mb-4"></div>
            <p className="text-[#071A2B] font-bold tracking-widest text-xs mb-6 uppercase">COMPANY REPRESENTATIVE</p>
            <div className="space-y-4 text-sm text-slate-500">
              <p>Name: ________________________</p>
              <p>Date: ________________________</p>
            </div>
          </div>
        </div>

        {data.bank_details && (
          <div className="mt-auto mb-16 bg-slate-50 border border-slate-200 rounded-2xl p-8 mx-auto w-full max-w-3xl">
             <p className="text-xs font-bold tracking-widest text-slate-400 mb-4 uppercase text-center">BANK DETAILS FOR ADVANCE PAYMENT</p>
             <div className="grid grid-cols-2 gap-y-3 text-sm px-8">
               <p><span className="text-slate-500 w-32 inline-block">Account Name:</span> <span className="font-bold text-slate-800">{data.bank_details.account_name}</span></p>
               <p><span className="text-slate-500 w-32 inline-block">Bank Name:</span> <span className="font-bold text-slate-800">{data.bank_details.bank_name}</span></p>
               <p><span className="text-slate-500 w-32 inline-block">Account No:</span> <span className="font-bold text-slate-800">{data.bank_details.account_number}</span></p>
               <p><span className="text-slate-500 w-32 inline-block">IFSC Code:</span> <span className="font-bold text-slate-800">{data.bank_details.ifsc}</span></p>
               {data.bank_details.upi_id && (
                 <p className="col-span-2 mt-2 pt-2 border-t border-slate-200"><span className="text-slate-500 w-32 inline-block">UPI ID:</span> <span className="font-bold text-[#19A974]">{data.bank_details.upi_id}</span></p>
               )}
             </div>
          </div>
        )}

        <Footer data={data} pageNum={getPageNum()} />
      </PdfPage>

      {/* PAGE 18 - FINAL HERO PAGE */}
      <PdfPage className="bg-[#071A2B] text-white">
        <div className="absolute inset-0 z-0">
          <img src="/assets/solar-quotation/final.jpg" className="w-full h-full object-cover opacity-60" alt="Final" />
          <div className="absolute inset-0 bg-[#071A2B]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071A2B] via-[#071A2B]/50 to-transparent opacity-90" />
        </div>
        
        <div className="relative z-10 p-16 h-full flex flex-col items-center justify-center text-center">
          <h2 className="text-5xl font-black leading-tight mb-16 tracking-wide">
            A BRIGHTER<br/>
            TOMORROW<br/>
            <span className="text-[#F6C945]">STARTS TODAY.</span>
          </h2>
          
          <div className="w-16 h-1 bg-[#19A974] mb-12"></div>
          
          {data.company_logo ? (
            <img src={data.company_logo} alt="Logo" className="h-16 object-contain mb-6" />
          ) : (
            <Sun className="text-[#19A974] w-16 h-16 mb-6" />
          )}
          
          <p className="text-2xl font-bold tracking-widest uppercase mb-8">{data.company_name}</p>
          
          <div className="text-sm text-slate-300 space-y-2 font-medium tracking-wide">
            <p>{data.company_phone}</p>
            <p>{data.company_email}</p>
            <p>{data.company_website}</p>
          </div>
          
          <p className="absolute bottom-16 text-xs text-slate-400 uppercase tracking-widest font-bold">
            Thank you for choosing clean energy.
          </p>
        </div>
      </PdfPage>
    </div>
  );
};
