"use client";

import React, { useState } from "react";
import { Check, Zap, Sparkles, HelpCircle, ArrowRight, ShieldCheck, Building } from "lucide-react";

interface PricingSectionProps {
  onOpenDemo?: () => void;
}

export default function PricingSection({ onOpenDemo }: PricingSectionProps) {
  const [annualBilling, setAnnualBilling] = useState<boolean>(true);

  const plans = [
    {
      name: "Starter EPC",
      badge: "Emerging Installers",
      description: "Everything a growing solar contractor needs to manage leads and create professional proposals.",
      priceMonthly: 2999,
      priceAnnual: 2499,
      users: "Up to 3 Team Users",
      popular: false,
      features: [
        "8-Stage Visual Kanban CRM",
        "Unified Customer Directory",
        "Quick Solar Proposal Generator",
        "Mobile Field App for Site Surveys",
        "Rooftop Photo & Feasibility Logs",
        "Lead Assignment & Follow-up Alerts",
        "Standard Email & WhatsApp Support"
      ],
      ctaText: "Start with Starter",
      highlight: false
    },
    {
      name: "Growth Pro",
      badge: "Most Popular for EPCs",
      description: "The complete end-to-end OS for serious solar EPCs executing rooftop residential and commercial bids.",
      priceMonthly: 6999,
      priceAnnual: 5799,
      users: "Up to 10 Team Users",
      popular: true,
      features: [
        "Everything in Starter EPC, plus:",
        "Intelligent Utility Bill OCR Scanner (MSEDCL/Tata/BESCOM)",
        "Ultra-Luxury 6-Page Magazine Proposals & Template Studio",
        "DISCOM Statutory Hub (Form A-1, Annexure-2, WCR)",
        "Serialized Inventory & Barcode Tracking (DCR Modules & Inverters)",
        "PM Surya Ghar National Portal Studio (Bulk DCR Formatter)",
        "Composite GST Tax Invoicing & Milestone UPI Receipts",
        "Role-Based Permissions (Sales, Surveyor, Engineer, Accounts)",
        "Priority Phone & WhatsApp Support + 1-on-1 Onboarding"
      ],
      ctaText: "Book Demo for Growth Pro",
      highlight: true
    },
    {
      name: "Enterprise",
      badge: "Turnkey & Multi-Branch",
      description: "For established solar companies with multiple regional warehouses, large teams, and custom SLAs.",
      priceMonthly: 14999,
      priceAnnual: 12499,
      users: "Unlimited Team Users",
      popular: false,
      features: [
        "Everything in Growth Pro, plus:",
        "Multi-Warehouse Inventory & Inter-Warehouse Stock Transfers",
        "Custom DISCOM Statutory Form Templates",
        "Custom Domain & White-Label Proposal Branding",
        "Comprehensive Project Profitability & Gross Margin Analytics",
        "Dedicated Account Manager & 99.9% SLA Guarantee",
        "Assisted Spreadsheet Data Migration & Staff Video Training",
        "DPDP 2023 Enterprise Data Protection Agreement"
      ],
      ctaText: "Contact for Enterprise",
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-900/80 text-white relative border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Honest &amp; Transparent Commercials</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Predictable Pricing Designed for{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-sky-300 bg-clip-text text-transparent">
              Indian Solar Contractors
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            No hidden setup fees or surprise charges. All plans include full mobile app access, cloud document storage, and regular statutory updates for Indian DISCOMs.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                !annualBilling
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                annualBilling
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-400 text-slate-950">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => {
            const price = annualBilling ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.name}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all relative ${
                  plan.highlight
                    ? "bg-slate-950 border-2 border-blue-500 shadow-2xl shadow-blue-900/30 ring-1 ring-blue-500/50 -translate-y-2"
                    : "bg-slate-950/80 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Popular Pill */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-gradient-to-r from-blue-600 to-amber-500 text-white text-[11px] font-extrabold rounded-full uppercase tracking-wider shadow-md">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {plan.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                      {plan.users}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 min-h-[36px] leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-6 pb-6 border-b border-slate-800 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-white">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                    {annualBilling && (
                      <span className="text-[10px] text-slate-500 ml-1">
                        (billed annually)
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Included Capabilities:
                    </p>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <div className="mt-8 pt-6 border-t border-slate-800/80">
                  <button
                    onClick={onOpenDemo}
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      plan.highlight
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-600/30"
                        : "bg-slate-900 hover:bg-slate-800 text-white border border-slate-800"
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-[10px] text-slate-500 mt-2">
                    GST extra as applicable • Full Input Tax Credit (ITC)
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commercial Clarifications & Guarantees */}
        <div className="mt-16 bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">Full Data Portability</p>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Your customer contacts, quotations, and project files remain your company&apos;s property. Export all data in CSV or PDF at any time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">No Hardware Restrictions</p>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Add any panel, inverter, structure, or electrical vendor to your master catalogue with your own custom purchase and sales margins.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">GST Invoice &amp; Tax Credit</p>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Every subscription payment generates a 100% compliant Indian GST Tax Invoice with your company GSTIN for legitimate Input Tax Credit claims.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
