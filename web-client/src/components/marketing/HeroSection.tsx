"use client";

import React from "react";
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  FileText,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  ChevronRight,
  Sun,
  Clock,
  ScanText
} from "lucide-react";

interface HeroSectionProps {
  onOpenDemo?: () => void;
}

export default function HeroSection({ onOpenDemo }: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-slate-950 text-white">
      {/* Background Glow & Mesh Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/15 via-blue-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-60 left-10 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Audience Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-slate-200 mb-6 shadow-sm hover:border-slate-600 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400 font-bold">WhereReady Solar OS</span>
            <span className="text-slate-500">•</span>
            <span>Built for Indian Rooftop EPCs & Installers</span>
            <span className="text-slate-500">•</span>
            <span className="text-blue-400 font-medium">PM Surya Ghar Ready</span>
          </div>

          {/* Main H1 Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.12] font-['Plus_Jakarta_Sans',sans-serif]">
            The Operating System for India&apos;s{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
              Solar EPCs &amp; Rooftop Installers
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
            Ditch messy spreadsheets and lost WhatsApp chats. From{" "}
            <strong className="text-white font-semibold">electricity bill OCR</strong> and{" "}
            <strong className="text-white font-semibold">60-second magazine-grade proposals</strong> to{" "}
            <strong className="text-white font-semibold">DISCOM net-metering workflows</strong> and{" "}
            <strong className="text-white font-semibold">serialized inventory</strong> — run your entire solar EPC business on one organized workflow.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:to-blue-400 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Book a Free 1-on-1 Demo</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="#proposal-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl hover:-translate-y-0.5 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Try Live Quotation Simulator</span>
            </a>

            <a
              href="https://wa.me/919890000000?text=Hello%20WhereReady%20Solar%20OS%20team,%20I%20would%20like%20a%20walkthrough%20of%20the%20software."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-800/60 rounded-xl transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>WhatsApp Quick Chat</span>
            </a>
          </div>

          {/* Quick Value Metrics */}
          <div className="mt-12 pt-8 border-t border-slate-800/60 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">60 Seconds</p>
                <p className="text-xs text-slate-400">Proposal turnaround</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">100% DISCOM</p>
                <p className="text-xs text-slate-400">Form A-1, Annexure-2 &amp; WCR</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <ScanText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">OCR Bill Scan</p>
                <p className="text-xs text-slate-400">Instant tariff extraction</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">DPDP 2023</p>
                <p className="text-xs text-slate-400">Isolated customer tenant data</p>
              </div>
            </div>
          </div>
        </div>

        {/* High-Fidelity Interactive Dashboard Preview Mockup */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-2 sm:p-3 shadow-2xl shadow-blue-950/50 border border-slate-700/80">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 rounded-xl border-b border-slate-800/80 text-xs text-slate-400 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-400 hidden sm:inline">
                  https://app.whereready.com/tenant/dashboard
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Tenant: Apex Solar Solutions EPC
                </span>
              </div>
            </div>

            {/* Dashboard Content Mock */}
            <div className="bg-slate-950 rounded-xl p-4 sm:p-6 text-slate-200">
              {/* Header metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-slate-400 font-medium">Active Pipeline Value</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mt-1">₹3,84,50,000</p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" /> +28% vs last month
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-slate-400 font-medium">Installed This Month</p>
                  <p className="text-lg sm:text-2xl font-bold text-amber-400 mt-1">168.4 kW</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">14 active sites commissioned</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-slate-400 font-medium">DISCOM Statutory Queue</p>
                  <p className="text-lg sm:text-2xl font-bold text-sky-400 mt-1">9 Sites</p>
                  <p className="text-[11px] text-sky-400 mt-0.5">Form A-1 &amp; WCR submitted</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-slate-400 font-medium">Proposal Win Rate</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mt-1">42.8%</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5">Using 6-Page Magazine format</p>
                </div>
              </div>

              {/* Active Pipeline Card Showcase */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        LEAD #LD-2026-0418
                      </span>
                      <h4 className="text-base font-bold text-white">
                        Shree Sai Cold Storage &amp; Agro Tech (45 kW Rooftop)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Customer: Rajesh Patil • Pune, MH • MSEDCL LT Commercial (HT-2 Tariff)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      DISCOM Feasibility Approved
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <p className="text-slate-400 font-medium flex items-center gap-1">
                      <ScanText className="w-3.5 h-3.5 text-blue-400" />
                      OCR Utility Bill Extraction
                    </p>
                    <p className="font-bold text-white text-sm mt-1">Consumer #: 02894100291</p>
                    <p className="text-[11px] text-slate-400">Sanctioned: 65 kVA • Tariff: LT-V B</p>
                    <p className="text-[11px] text-emerald-400 mt-1">✓ Avg Monthly Units: 4,820 kWh</p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <p className="text-slate-400 font-medium flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      Magazine Proposal #QT-892
                    </p>
                    <p className="font-bold text-white text-sm mt-1">₹19,80,000 + GST</p>
                    <p className="text-[11px] text-slate-400">82x 550W TopCon Bifacial Panels</p>
                    <p className="text-[11px] text-blue-300 mt-1">✓ Estimated Payback: 2.8 Years</p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <p className="text-slate-400 font-medium flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      Serialized Hardware Assigned
                    </p>
                    <p className="font-bold text-white text-sm mt-1">1x 50kW Sungrow Inverter</p>
                    <p className="text-[11px] text-slate-400">Serial: SG50-MH-2026-9921</p>
                    <p className="text-[11px] text-emerald-400 mt-1">✓ DCR Serial Numbers Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
