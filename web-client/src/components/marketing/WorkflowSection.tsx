"use client";

import React, { useState } from "react";
import {
  ScanText,
  Compass,
  FileText,
  UserCheck,
  Building2,
  Boxes,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";

export default function WorkflowSection() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: "01",
      title: "Lead Capture & Bill OCR",
      tag: "Intelligent Ingestion",
      icon: ScanText,
      status: "LIVE FEATURE",
      subtitle: "Instant Consumer & Tariff Extraction",
      description:
        "Capture leads from website forms, WhatsApp chats, or field inquiries. Upload the customer's utility electricity bill (MSEDCL, Tata Power, BESCOM) — our built-in OCR automatically extracts consumer number, sanctioned load, billing history, and tariff category in seconds.",
      features: [
        "Eliminates manual data entry errors",
        "Supports multi-DISCOM utility bill formats",
        "Auto-tags consumer tariff slab (LT-I Residential / LT-II Commercial)",
        "Instant conversion into survey or quick quotation"
      ],
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30"
    },
    {
      id: "02",
      title: "Site Survey & Feasibility",
      tag: "Field Operations",
      icon: Compass,
      status: "LIVE FEATURE",
      subtitle: "Structural & Shadow Feasibility Checklists",
      description:
        "Equip field technicians with standardized mobile-ready site survey forms. Record rooftop azimuth, tilt angle, shadow obstructions, cable run length, existing meter specs, and geotagged rooftop photographs.",
      features: [
        "Pre-configured structural & electrical feasibility checklists",
        "High-resolution rooftop photo & single-line diagram (SLD) uploads",
        "Real-time GPS coordinate verification",
        "Automatic survey sign-off and push to quotation designer"
      ],
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30"
    },
    {
      id: "03",
      title: "60-Second Luxury Proposals",
      tag: "Sales Engine",
      icon: FileText,
      status: "LIVE FEATURE",
      subtitle: "Ultra-Luxury 6-Page Magazine Edition Proposals",
      description:
        "Generate stunning, editorial magazine-quality solar proposals tailored to the Indian customer. Automatically includes panel layout, generation calculations, financial payback charts, loan EMI tables, and your company's official brand seal.",
      features: [
        "4 Pre-built templates (Residential, Commercial, Hybrid, Quick Quote)",
        "Automated PM Surya Ghar subsidy deduction calculation",
        "Visual 25-year cumulative savings graph",
        "Instant PDF download & WhatsApp sharing"
      ],
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    },
    {
      id: "04",
      title: "Conversion & Agreement",
      tag: "Sales Closure",
      icon: UserCheck,
      status: "LIVE FEATURE",
      subtitle: "1-Click Quotation to Active Project Conversion",
      description:
        "When the customer approves, convert the quotation into an active project dossier with a single click. Milestone payment schedules (Advance, Material Dispatch, Commissioning) are automatically generated with GST tax invoices.",
      features: [
        "No duplicate data re-entry between sales and operations",
        "Automatic sequence numbering for Project Dossiers",
        "Milestone payment receipt tracker with bank UPI QR codes",
        "Audit trail tracking exact proposal acceptance timestamps"
      ],
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30"
    },
    {
      id: "05",
      title: "DISCOM Statutory Net-Metering",
      tag: "Utility Compliance",
      icon: Building2,
      status: "LIVE FEATURE",
      subtitle: "State DISCOM Form A-1, Annexure-2 & WCR",
      description:
        "Navigate India's statutory net-metering bureaucracy effortlessly. Track the 5-stage validation engine from Technical Feasibility to Grid Synchronization with mandatory statutory document uploads.",
      features: [
        "Auto-fills state-specific forms (MSEDCL Form A-1, Annexure-2 Agreement)",
        "Mandatory upload checks for contractor electrical license & stamp papers",
        "Work Completion Report (WCR) generation",
        "Eliminates missing document rejections by DISCOM field inspectors"
      ],
      badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30"
    },
    {
      id: "06",
      title: "Procurement & Serial Tracking",
      tag: "Inventory & Hardware",
      icon: Boxes,
      status: "LIVE FEATURE",
      subtitle: "DCR Module & Inverter Barcode Registry",
      description:
        "Maintain multi-warehouse stock balances with granular serial number tracking. Prevent subsidy rejection by logging each PV module's Domestic Content Requirement (DCR) serial number upon dispatch to the customer roof.",
      features: [
        "Full serial number traceability from manufacturer to rooftop",
        "Goods Receipts (GRN) & Material Dispatch Notes (MDN)",
        "Inter-warehouse stock transfer ledgers",
        "Instant barcode export for National Portal subsidy submission"
      ],
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30"
    },
    {
      id: "07",
      title: "On-Site Installation Checklist",
      tag: "Field Execution",
      icon: Wrench,
      status: "LIVE FEATURE",
      subtitle: "Stage Milestones, Photo Logs & Safety Audits",
      description:
        "Track rooftop civil structure mounting, module clamping, inverter wiring, and chemical earthing pits. Field teams log progress milestones with mandatory photo proofs before proceeding to grid synchronization.",
      features: [
        "Milestone checklist (Civil mounting → DC cabling → Earthing → Inverter)",
        "Mandatory photo proof upload for quality inspection",
        "Safety & lightning arrestor installation verification",
        "Instant field team task assignments"
      ],
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30"
    },
    {
      id: "08",
      title: "Grid Sync & PM Surya Ghar Subsidy",
      tag: "Handover & Handshake",
      icon: CheckCircle2,
      status: "LIVE FEATURE",
      subtitle: "Bi-directional Meter Testing, Subsidy & AMC",
      description:
        "Close the loop when the DISCOM net-meter is synchronized. Access the built-in PM Surya Ghar National Portal Studio with 1-click bulk serial number formatting, customer bank account validation, and automated AMC warranty contract creation.",
      features: [
        "PM Surya Ghar 6-stage national portal tracking pipeline",
        "Automated IFSC code & beneficiary bank account validator",
        "Annual Maintenance Contract (AMC) schedule generator",
        "Customer handover dossier with warranty certificates"
      ],
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    }
  ];

  const current = steps[activeStep];

  return (
    <section id="workflow" className="py-24 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>End-to-End Solar Business Lifecycle</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
            The Complete 8-Stage Solar Workflow,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-amber-300 bg-clip-text text-transparent">
              Unified in One OS
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            From the first electricity bill scan to the day the net-meter spins backward and the PM Surya Ghar subsidy hits your customer&apos;s bank account — here is how WhereReady Solar OS coordinates your entire business.
          </p>
        </div>

        {/* 8 Step Tabs Selector (Horizontal scrollable on mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-950 border-blue-500 shadow-lg shadow-blue-600/20 ring-1 ring-blue-500"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {step.id}
                  </span>
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected ? "text-amber-400" : "text-slate-500"
                    }`}
                  />
                </div>
                <p
                  className={`text-xs font-bold leading-snug line-clamp-2 ${
                    isSelected ? "text-white" : "text-slate-300"
                  }`}
                >
                  {step.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Stage Detailed Spotlight */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Description & Value */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md border ${current.badgeColor}`}>
                  Stage {current.id} • {current.tag}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {current.status}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                {current.subtitle}
              </h3>

              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                {current.description}
              </p>

              {/* Bullet Points */}
              <div className="mt-6 space-y-2.5">
                {current.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Visual Stage Badge & Action Preview */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <current.icon className="w-6 h-6 text-amber-400" />
                    <span className="text-sm font-bold text-white">Stage {current.id} in Solar OS</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Step {activeStep + 1} of 8</span>
                </div>

                <div className="py-6 space-y-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                    <span className="text-[11px] text-slate-400">Current Phase Focus:</span>
                    <p className="text-sm font-bold text-white mt-0.5">{current.title}</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                    <span className="text-[11px] text-slate-400">Platform Automation:</span>
                    <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                      ✓ Instant data sync between Web ERP &amp; Mobile Field App
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <span>Explore Next Stage ({steps[(activeStep + 1) % steps.length].title})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
