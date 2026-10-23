"use client";

import React from "react";
import { ArrowRight, Sparkles, Zap, ShieldCheck, Sun } from "lucide-react";

interface HeroSceneProps {
  onOpenDemo?: () => void;
}

export default function HeroScene({ onOpenDemo }: HeroSceneProps) {
  const workflowPillars = [
    { name: "Leads", desc: "Enquiry & OCR bills", tag: "Auto-synced" },
    { name: "Quotations", desc: "60-sec luxury proposals", tag: "PM Surya Ghar" },
    { name: "Projects", desc: "5-stage net-metering", tag: "DISCOM A-1" },
    { name: "Installation", desc: "Execution & checklists", tag: "DCR Verified" },
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-grid-subtle text-slate-900 overflow-hidden">
      {/* Soft gradient masks to fade the grid toward center and edges (Design Rule 1) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-transparent to-white pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-white/40 to-white/95 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Instant Product Clarity (Design Rule 2) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Category / Scope Pill: Explicit Software Identification */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/90 text-xs font-semibold text-blue-800 tracking-wide uppercase shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span>SOLAR BUSINESS MANAGEMENT SOFTWARE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08] font-['Plus_Jakarta_Sans',sans-serif]">
              Run your entire solar business.{" "}
              <span className="text-blue-600 block sm:inline">In one place.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg sm:leading-relaxed text-slate-600 max-w-xl font-normal">
              From customer enquiries and professional quotations to project execution and installation tracking.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                onClick={onOpenDemo}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>Book a Free Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#problem"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 text-base font-semibold text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-slate-50 rounded-full border border-slate-200 transition-all text-center shadow-2xs"
              >
                <span>See How It Works</span>
                <span className="text-slate-400 font-mono text-sm">↓</span>
              </a>
            </div>

            {/* Connected Workflow Tags (Leads • Quotations • Projects • Installation) */}
            <div className="pt-4 border-t border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Connected Solar Workflow
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {workflowPillars.map((pillar) => (
                  <div
                    key={pillar.name}
                    className="p-2.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-2xs text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-xs font-bold text-slate-800">{pillar.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{pillar.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Reassurance note */}
            <div className="flex items-center gap-5 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Pure SaaS Solution
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                PM Surya Ghar Ready
              </span>
              <span className="text-slate-400 hidden sm:inline">Built for Indian Solar EPCs</span>
            </div>
          </div>

          {/* Right Column: Illustrative Product UI & 2D Vector Direction (Scene 1) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* Visual Container with Subtle Grid Fade */}
            <div className="w-full max-w-xl relative">
              
              {/* Product Dashboard Card (Recognizable Software UI) */}
              <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-4 sm:p-5">
                
                {/* Mockup Window Chrome */}
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="ml-2 text-xs font-semibold text-slate-700">
                      WhereReady Solar OS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Business Engine
                    </span>
                  </div>
                </div>

                {/* Sub-header Stats Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium block">Active Leads</span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900">24</span>
                    <span className="text-[9px] text-emerald-600 font-medium block">+6 this week</span>
                  </div>
                  <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-700 font-medium block">Proposals Sent</span>
                    <span className="text-sm sm:text-base font-extrabold text-blue-900">18</span>
                    <span className="text-[9px] text-blue-600 font-medium block">₹42.8L Value</span>
                  </div>
                  <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-amber-700 font-medium block">DISCOM Sync</span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-900">9 Active</span>
                    <span className="text-[9px] text-amber-600 font-medium block">MSEDCL Net-Meter</span>
                  </div>
                </div>

                {/* Active Lead & Proposal Card */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 p-3.5 rounded-xl border border-slate-200/80 mb-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      Rajesh Kulkarni • Baner, Pune
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      Quotation Generated
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                    <span>5.4 kW Rooftop</span>
                    <span>•</span>
                    <span>Tata Power Mono-Perc</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-800">PM Surya Ghar Subsidy: ₹78,000</span>
                  </div>
                  
                  {/* Connected Workflow Progress Stepper */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-medium text-slate-500">
                    <span className="text-blue-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      1. Enquiry
                    </span>
                    <span className="text-blue-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      2. Survey
                    </span>
                    <span className="text-blue-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      3. Quote
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      4. DISCOM A-1
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      5. Installation
                    </span>
                  </div>
                </div>

                {/* 2D Vector Architectural Rooftop Asset embedded within product view */}
                <div className="relative bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                  <div className="w-16 h-14 shrink-0 relative flex items-center justify-center">
                    <svg viewBox="0 0 80 60" fill="none" className="w-full h-full">
                      {/* Stylized house silhouette */}
                      <polygon points="10,32 40,12 70,32" fill="#CBD5E1" />
                      <rect x="18" y="32" width="44" height="24" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                      {/* Solar PV panels */}
                      <g transform="translate(24, 20) rotate(-10)">
                        <rect x="0" y="0" width="16" height="10" rx="1" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="0.5" />
                        <rect x="18" y="0" width="16" height="10" rx="1" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="0.5" />
                      </g>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800">
                      Rooftop Feasibility &amp; Generation Modeling
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Annual Yield: 8,100 kWh • Payback: 3.2 Years • Carbon Offset: 6.8 Tons
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 block">
                      Sync Ready
                    </span>
                  </div>
                </div>

              </div>

              {/* Popping Badge Accent */}
              <div className="absolute -top-3 -right-2 sm:-right-4 z-20 anim-pop">
                <div className="bg-blue-600 text-white rounded-xl px-3 py-1.5 shadow-lg shadow-blue-500/30 flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Proposal Created in 60s</span>
                </div>
              </div>

              {/* Soft decorative ambient glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-blue-100/40 via-amber-100/20 to-transparent rounded-3xl blur-xl -z-10 pointer-events-none" />

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
