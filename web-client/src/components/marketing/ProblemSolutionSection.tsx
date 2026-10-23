"use client";

import React from "react";
import {
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  FileSpreadsheet,
  MessageSquareWarning,
  Building2,
  FileCheck2,
  Zap,
  Layers,
  Sparkles
} from "lucide-react";

export default function ProblemSolutionSection() {
  const problems = [
    {
      title: "Scattered WhatsApp Chats & Lost Paper Leads",
      description:
        "Customer phone numbers, site coordinates, and electricity bills stay buried across your sales reps' personal phones. When a rep forgets or leaves, customer history is lost forever.",
      solution: "Centralized Lead Pipeline & Unified Contact Timeline",
      solutionDesc:
        "Every lead, electricity bill photo, and customer touchpoint is organized into an 8-stage Kanban pipeline with team accountability.",
    },
    {
      title: "2-3 Hours Spent Preparing Each Proposal in Excel",
      description:
        "Calculating module counts, inverter capacities, slab-wise tariff savings, GST, and PM Surya Ghar subsidies manually leads to costly calculation errors and slow response times.",
      solution: "60-Second Magazine-Grade Proposal Generator",
      solutionDesc:
        "Select system size, panel tech, and DISCOM — generate an ultra-luxury, high-converting 6-page solar proposal PDF with payback charts in 60 seconds.",
    },
    {
      title: "Zero Visibility into DISCOM Net-Metering Progress",
      description:
        "Site engineers struggle with manual DISCOM Form A-1, Annexure-2 agreements, and Work Completion Reports (WCR), leading to delayed meter installations and angry customers.",
      solution: "Dedicated DISCOM Statutory Net-Metering Hub",
      solutionDesc:
        "Pre-filled state-specific DISCOM forms (MSEDCL, Tata Power, BESCOM), document checklists, and real-time stage tracking from Feasibility to Grid Synchronization.",
    },
    {
      title: "Inventory Leaks & Unmatched DCR Serial Numbers",
      description:
        "Solar modules and inverters arrive at warehouses without barcode verification. Subsidy portals reject claims because module serials don't match DCR portal entries.",
      solution: "Serialized Inventory & PM Surya Ghar Portal Studio",
      solutionDesc:
        "Scan barcodes on dispatch, track every serial number to the customer roof, and use 1-click bulk formatting for the National Subsidy Portal.",
    },
  ];

  return (
    <section className="py-24 bg-slate-900/60 border-t border-slate-800 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold mb-4">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Why Generic CRMs &amp; Spreadsheets Fail Solar EPCs</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Running a Solar Business is Complex.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-amber-300 bg-clip-text text-transparent">
              Your Software Shouldn&apos;t Be.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Indian rooftop solar is unique — you don&apos;t just sell a product, you handle utility approvals, subsidies, civil structures, and grid connections. Generic sales CRMs weren&apos;t built for that. WhereReady Solar OS is.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {problems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition-all shadow-xl shadow-black/20"
            >
              <div>
                {/* The Pain */}
                <div className="flex items-start gap-3 pb-5 border-b border-slate-800/80">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-red-400 uppercase">
                      The Old Spreadsheet / WhatsApp Way
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* The WhereReady Fix */}
                <div className="flex items-start gap-3 pt-5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                      WhereReady Solar OS Solution
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
                      {item.solution}
                      <Sparkles className="w-4 h-4 text-amber-400 inline" />
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      {item.solutionDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Subtle Bar */}
              <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-500">
                <span>Integrated into core workflow</span>
                <span className="text-blue-400 font-medium">Standard on all plans →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
