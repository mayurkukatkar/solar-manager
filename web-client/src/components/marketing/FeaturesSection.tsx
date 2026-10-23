"use client";

import React, { useState } from "react";
import {
  Users,
  ScanText,
  FileText,
  Building2,
  Boxes,
  Sun,
  ShieldCheck,
  Receipt,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone
} from "lucide-react";

export default function FeaturesSection() {
  const [activeCategory, setActiveCategory] = useState<number>(0);

  const categories = [
    {
      id: "sales",
      name: "Sales & CRM",
      icon: Users,
      badge: "8-Stage Pipeline",
      headline: "Never Lose a Solar Prospect or Forgotten Follow-up",
      description:
        "Manage all your rooftop residential, commercial, and agricultural leads in an intuitive Kanban or Table view. Automated stage transitions keep your sales reps focused on hot prospects.",
      capabilities: [
        "8-stage visual Kanban pipeline (New Lead → Survey → Proposal → Contract Won)",
        "Unified customer directory with complete interaction history (No duplicates)",
        "Instant lead capture from website, social ads, and field mobile app",
        "Lead assignment with team performance metrics and stage aging alerts"
      ],
      highlightMetric: "3.2x faster lead response time"
    },
    {
      id: "ocr",
      name: "Utility Bill OCR",
      icon: ScanText,
      badge: "AI Bill Scanner",
      headline: "Scan Electricity Bills & Auto-Extract Tariffs in 2 Seconds",
      description:
        "Upload a photo or PDF of any Indian electricity bill. The intelligent OCR engine instantly reads consumer number, billing demand, sanctioned load, billing history, and tariff slab.",
      capabilities: [
        "Pre-trained for MSEDCL (Mahavitaran), Tata Power, BESCOM, and major DISCOMs",
        "Auto-identifies connected load & solar sanction feasibility",
        "Calculates baseline monthly consumption (kWh) and annual expenditure",
        "Transfers directly into the proposal builder without typing a single digit"
      ],
      highlightMetric: "100% elimination of manual bill typing errors"
    },
    {
      id: "proposals",
      name: "Proposal Studio",
      icon: FileText,
      badge: "Magazine Grade",
      headline: "Ultra-Luxury 6-Page Editorial Proposals That Blow Clients Away",
      description:
        "Win bids against competitors sending crude 1-page spreadsheets. Solar OS generates editorial magazine-quality proposals featuring 3D rooftop visualizations, BOM breakdowns, and payback schedules.",
      capabilities: [
        "4 Pre-configured templates: Residential Rooftop, Commercial EPC, Hybrid Off-Grid, Quick Quote",
        "Dynamic PM Surya Ghar central subsidy calculation & state incentives",
        "Visual single-line diagram (SLD) and technical equipment warranties",
        "Instant PDF generation & 1-click WhatsApp proposal sharing link"
      ],
      highlightMetric: "Average 40% increase in proposal acceptance"
    },
    {
      id: "discom",
      name: "DISCOM Statutory Hub",
      icon: Building2,
      badge: "Utility Compliance",
      headline: "Fast-Track Net-Metering Feasibility, Approvals & Inspections",
      description:
        "State DISCOM paperwork is the #1 bottleneck for Indian solar EPCs. Solar OS auto-generates mandatory statutory forms and enforces document checklists to prevent inspection rejections.",
      capabilities: [
        "Auto-fills MSEDCL Form A-1, Annexure-2 Agreement with stamp paper space",
        "5-stage statutory workflow: Feasibility → Sanction → Inspection → Meter Testing → Grid Sync",
        "Standard Work Completion Report (WCR) with electrical contractor license verification",
        "Mandatory upload enforcement for test reports, safety certificates, and invoice copies"
      ],
      highlightMetric: "Zero rejected DISCOM applications due to missing paperwork"
    },
    {
      id: "inventory",
      name: "Serialized Inventory",
      icon: Boxes,
      badge: "DCR Tracking",
      headline: "Track PV Modules & Inverters by Serial Number from Warehouse to Roof",
      description:
        "Ensure complete hardware traceability. Manage multi-warehouse stock levels, generate Goods Receipts (GRN), and verify module serial numbers against DCR manufacturing records.",
      capabilities: [
        "Barcode & QR code scanner for fast material dispatch and returns",
        "Real-time warehouse ledger with low-stock alerts for balance-of-system (BOS)",
        "Serial number association to specific project roof dossiers",
        "Inter-warehouse stock transfer approvals with tamper-proof audit trails"
      ],
      highlightMetric: "100% subsidy audit compliance on DCR module serials"
    },
    {
      id: "subsidy",
      name: "PM Surya Ghar Studio",
      icon: Sun,
      badge: "National Portal",
      headline: "Effortless National Portal Vendor Processing & Subsidy Release",
      description:
        "Built specifically for the PM Surya Ghar Muft Bijli Yojana national vendor portal (`pmsuryaghar.gov.in`). Format batch module serials, validate beneficiary bank accounts, and expedite DBT release.",
      capabilities: [
        "6-stage National Portal tracking pipeline from registration to subsidy credit",
        "1-click bulk formatting for DCR module serial numbers",
        "Integrated bank account & IFSC validator to prevent DBT payment rejections",
        "Real-time subsidy status updates for consumers"
      ],
      highlightMetric: "Over 80% reduction in subsidy claim rework"
    },
    {
      id: "finance",
      name: "GST & Commercials",
      icon: Receipt,
      badge: "GST Compliant",
      headline: "GST Tax Invoicing, Milestone Payments & Project Profitability",
      description:
        "Keep your cash flow healthy. Generate composite solar GST invoices, record customer milestone receipts with UPI QR codes, track subcontractor expenses, and monitor net project margin.",
      capabilities: [
        "Automatic composite GST calculation (70% goods @ 12% + 30% services @ 18%)",
        "Milestone advance receipts and debit/credit notes",
        "Project-level expense ledger to track true gross margin per kW installed",
        "High-fidelity PDF tax invoice export with company stamp and signature"
      ],
      highlightMetric: "Real-time visibility into project net margins"
    },
    {
      id: "mobile",
      name: "Mobile Field App",
      icon: Smartphone,
      badge: "On-Site App",
      headline: "Empower Your Field Surveyors & Site Engineers on Mobile",
      description:
        "Solar business happens on rooftops, not behind desks. Our companion mobile app lets technicians perform site surveys, capture geotagged photos, and log installation checklists without internet headaches.",
      capabilities: [
        "Instant mobile lead capture with quick quotation generation",
        "Rooftop photo uploads with automatic compression and project linking",
        "On-site installation step-by-step milestone checklists",
        "Instant sync with the desktop Web ERP platform"
      ],
      highlightMetric: "Real-time field execution sync"
    }
  ];

  const current = categories[activeCategory];

  return (
    <section id="features" className="py-24 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built Specifically for Indian Solar EPC Workflows</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Every Module Engineered for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-amber-300 bg-clip-text text-transparent">
              Speed, Accuracy &amp; Profit
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            No bloated generic CRM modules. Every screen, form, and calculation in WhereReady Solar OS was purpose-designed for how Indian solar contractors actually work.
          </p>
        </div>

        {/* Feature Category Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === idx;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(idx)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Feature Detail Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Feature Capabilities */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold mb-3">
                <current.icon className="w-3.5 h-3.5 text-amber-400" />
                <span>{current.badge}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 leading-tight">
                {current.headline}
              </h3>

              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                {current.description}
              </p>

              {/* Capability Checkmarks */}
              <div className="mt-8 space-y-3">
                {current.capabilities.map((cap, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>

              {/* Highlight Metric Badge */}
              <div className="mt-8 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 inline-flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Proven Outcome:</span>
                <span className="font-bold text-white">{current.highlightMetric}</span>
              </div>
            </div>

            {/* Right Column: Visual Feature Mockup / Data Card */}
            <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-inner">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <current.icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-white">{current.name}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Active Module
                  </span>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <p className="text-slate-400 font-medium">Included in WhereReady Solar OS:</p>
                  <p className="text-white font-semibold">{current.headline}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                    Fully connected with your tenant settings, company branding, authorized signatures, bank UPI QR codes, and default DISCOM tariffs.
                  </p>
                </div>

                <div className="p-3 bg-blue-950/20 rounded-xl border border-blue-900/40 text-[11px] text-blue-300">
                  ⚡ Pre-configured with Indian solar equipment presets (Adani, Waaree, Tata, Sungrow, Growatt, Havells).
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-xs flex justify-between items-center text-slate-400">
                <span>Multi-user role permissions</span>
                <span className="text-blue-400 font-semibold">Ready for deployment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
