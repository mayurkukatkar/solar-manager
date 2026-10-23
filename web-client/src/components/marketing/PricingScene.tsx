"use client";

import React, { useState } from "react";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";

interface PricingSceneProps {
  onOpenDemo?: () => void;
}

export default function PricingScene({ onOpenDemo }: PricingSceneProps) {
  const [annualBilling, setAnnualBilling] = useState<boolean>(true);

  const plans = [
    {
      name: "Starter EPC",
      badge: "Emerging Installers",
      description: "Everything a growing solar contractor needs to organize leads, site surveys, and fast proposals.",
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
      ctaText: "Start with Starter"
    },
    {
      name: "Growth Pro",
      badge: "Most Popular for EPCs",
      description: "The complete operating system for active rooftop solar EPCs managing utility paperwork and hardware.",
      priceMonthly: 6999,
      priceAnnual: 5799,
      users: "Up to 10 Team Users",
      popular: true,
      features: [
        "Everything in Starter EPC, plus:",
        "Utility Bill OCR Scanner (MSEDCL/Tata/BESCOM)",
        "Ultra-Luxury 6-Page Magazine Proposals Studio",
        "DISCOM Statutory Hub (Form A-1, Annexure-2, WCR)",
        "Serialized Inventory & Barcode Tracking (DCR PV & Inverters)",
        "PM Surya Ghar National Portal Studio (Bulk DCR Formatter)",
        "Composite GST Tax Invoicing & Milestone UPI Receipts",
        "Role-Based Access (Sales, Surveyor, Engineer, Accounts)",
        "Priority Phone & WhatsApp Support + 1-on-1 Onboarding"
      ],
      ctaText: "Book Demo for Growth Pro"
    },
    {
      name: "Enterprise",
      badge: "Turnkey & Multi-Branch",
      description: "For established clean-tech organizations with multiple regional warehouses, large teams, and custom SLAs.",
      priceMonthly: 14999,
      priceAnnual: 12499,
      users: "Unlimited Team Users",
      popular: false,
      features: [
        "Everything in Growth Pro, plus:",
        "Multi-Warehouse Inventory & Inter-Warehouse Transfers",
        "Custom DISCOM Statutory Form Templates",
        "Custom Domain & White-Label Proposal Branding",
        "Project Gross Margin & Profitability Analytics",
        "Dedicated Account Manager & 99.9% SLA Guarantee",
        "Assisted Spreadsheet Data Migration & Staff Training",
        "DPDP 2023 Enterprise Data Protection Agreement"
      ],
      ctaText: "Contact for Enterprise"
    }
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-white text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Predictable Commercials
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif]">
            A plan that fits your next stage.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            No surprise setup fees. All subscriptions generate standard Indian GST tax invoices for full Input Tax Credit (ITC).
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200">
            <button
              type="button"
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
                !annualBilling
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                annualBilling
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Layout: Spacious & Light with Subtle Emphasis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => {
            const price = annualBilling ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.name}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? "bg-blue-50/40 border-2 border-blue-600 shadow-lg shadow-blue-100/50"
                    : "bg-white border border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {plan.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      {plan.users}
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-2 min-h-[36px] leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Price Block */}
                  <div className="mt-6 pb-6 border-b border-slate-200/80 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-slate-900">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-500">/ month</span>
                    {annualBilling && (
                      <span className="text-[10px] text-slate-400 ml-1">
                        (billed annually)
                      </span>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-6 space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Included Capabilities:
                    </p>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA Button */}
                <div className="mt-8 pt-6 border-t border-slate-200/80">
                  <button
                    onClick={onOpenDemo}
                    className={`w-full py-3 px-4 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-2">
                    GST extra as applicable • Full Input Tax Credit (ITC)
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commercial Guarantee Note */}
        <div className="mt-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2 max-w-xl mx-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Full data portability. Export all your customer records, quotes, and files anytime in CSV and PDF.</span>
        </div>

      </div>
    </section>
  );
}
