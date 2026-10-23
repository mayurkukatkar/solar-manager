"use client";

import React, { useState } from "react";
import {
  Users,
  ScanText,
  FileText,
  Building2,
  Boxes,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export default function ProductExperienceScene() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "discom" | "inventory">("pipeline");

  return (
    <section id="product-view" className="py-24 sm:py-32 bg-slate-50/60 text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
            The Solar OS Experience
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif]">
            One clearer view of your solar business.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            No clutter. No endless submenus. A calm, unified workspace connecting your office sales reps, field surveyors, and installation engineers.
          </p>

          {/* Module Selector Pill */}
          <div className="mt-8 inline-flex items-center gap-1.5 p-1 bg-white rounded-full border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("pipeline")}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "pipeline"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lead Pipeline &amp; CRM
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("discom")}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "discom"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              DISCOM Net-Metering Hub
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Serialized Hardware
            </button>
          </div>
        </div>

        {/* Master Product UI Canvas Mockup */}
        <div className="max-w-5xl mx-auto bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xl shadow-slate-200/50">
          
          {/* Window Frame Bar */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-200" />
              <span className="w-3 h-3 rounded-full bg-slate-200" />
              <span className="w-3 h-3 rounded-full bg-slate-200" />
              <span className="ml-2 font-mono text-[11px] text-slate-400 hidden sm:inline">
                https://app.whereready.com/tenant/dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Tenant: Apex Solar EPC
              </span>
            </div>
          </div>

          {/* Tab 1: Lead Pipeline & CRM View */}
          {activeTab === "pipeline" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-500">Active Pipeline</span>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">₹3.84 Cr</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">+24% this month</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-500">Installed Capacity</span>
                  <p className="text-xl font-bold text-blue-600 mt-0.5">168.4 kW</p>
                  <span className="text-[10px] text-slate-400">14 sites complete</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-500">DISCOM Clearance</span>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">94.2%</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">0 rejections</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-500">Proposal Win Rate</span>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">42.8%</p>
                  <span className="text-[10px] text-slate-400">Magazine templates</span>
                </div>
              </div>

              {/* Pipeline Kanban Snippet */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-800">Recent Customer Pipeline Activity</span>
                  <span className="text-blue-600 font-medium">8-Stage Flow</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                      NEW LEAD • OCR SCAN
                    </span>
                    <p className="font-bold text-slate-900 mt-1.5">Rajesh Patil (Baner, Pune)</p>
                    <p className="text-slate-500 text-[11px]">5.4 kW Residential • MSEDCL Bill Extracted</p>
                    <span className="text-emerald-600 font-medium text-[10px] block mt-1">✓ Sanctioned: 6 kVA</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
                      PROPOSAL PRESENTED
                    </span>
                    <p className="font-bold text-slate-900 mt-1.5">Shree Cold Storage (Baramati)</p>
                    <p className="text-slate-500 text-[11px]">45 kW C&amp;I • 6-Page Magazine Proposal</p>
                    <span className="text-blue-600 font-medium text-[10px] block mt-1">✓ Payback: 2.8 Years</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      DISCOM SANCTIONED
                    </span>
                    <p className="font-bold text-slate-900 mt-1.5">Anand Villa Society (Kothrud)</p>
                    <p className="text-slate-500 text-[11px]">18 kW Common Area Rooftop</p>
                    <span className="text-emerald-600 font-medium text-[10px] block mt-1">✓ Form A-1 Approved</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: DISCOM Statutory Net-Metering Hub View */}
          {activeTab === "discom" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900">MSEDCL Net-Metering Statutory Dossier</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold text-[10px]">
                    Project #PRJ-2026-092
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Stage 1</span>
                    <span className="font-bold text-emerald-600">Technical Feasibility</span>
                    <span className="text-[10px] text-slate-500 block">Approved</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Stage 2</span>
                    <span className="font-bold text-emerald-600">Form A-1 &amp; Annexure</span>
                    <span className="text-[10px] text-slate-500 block">Submitted</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Stage 3</span>
                    <span className="font-bold text-blue-600">Site Inspection</span>
                    <span className="text-[10px] text-slate-500 block">In Progress</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Stage 4 &amp; 5</span>
                    <span className="font-bold text-slate-400">Net-Meter Sync</span>
                    <span className="text-[10px] text-slate-400 block">Pending WCR</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 flex items-center justify-between">
                  <span>Electrical Contractor License &amp; Test Certificate Attached</span>
                  <span className="text-emerald-600 font-bold">Verified ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Serialized Hardware Dispatch */}
          {activeTab === "inventory" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900">DCR Module &amp; Inverter Barcode Serial Registry</span>
                  <span className="text-slate-500 text-[11px]">Warehouse: Pune Central</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">TopCon 550W Bifacial (12 Modules Assigned)</p>
                      <p className="font-mono text-[10px] text-slate-400">Serials: DCR-TC55-2026-9041 through 9052</p>
                    </div>
                    <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      DCR Matched
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">5kW Three-Phase Inverter</p>
                      <p className="font-mono text-[10px] text-slate-400">Serial: SG5K-MH-44021</p>
                    </div>
                    <span className="text-blue-600 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Dispatched
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sample Data Disclaimer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>* Illustrative demonstration data from WhereReady Solar OS tenant environment.</span>
            <span className="text-slate-500 font-medium">Multi-tenant logical isolation</span>
          </div>

        </div>

      </div>
    </section>
  );
}
