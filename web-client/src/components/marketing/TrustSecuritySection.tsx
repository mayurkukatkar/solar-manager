"use client";

import React from "react";
import { ShieldCheck, Database, Lock, UserCheck, Server } from "lucide-react";

export default function TrustSecuritySection() {
  const safeguards = [
    {
      icon: Database,
      title: "Strict Multi-Tenant Isolation",
      description:
        "Every solar EPC tenant operates in complete logical isolation. Your pipeline, quotations, supplier pricing, and profit margins are encrypted and strictly inaccessible to any other contractor."
    },
    {
      icon: Lock,
      title: "DPDP Act 2023 Compliance",
      description:
        "Built to adhere to India's Digital Personal Data Protection Act. Customer electricity bills, property documents, and identity proofs are guarded with controlled access and audit logging."
    },
    {
      icon: UserCheck,
      title: "Role-Based Access Controls",
      description:
        "Prevent internal leaks. Control exactly who on your team can view customer phone numbers, export contacts, edit quotation margins, or approve purchase orders."
    },
    {
      icon: Server,
      title: "Daily Cloud Backups & High Availability",
      description:
        "Never lose a proposal or document. Real-time database replication and daily encrypted snapshots ensure continuous operational availability during your busiest bidding cycles."
    }
  ];

  return (
    <section id="security" className="py-24 sm:py-32 bg-white text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
            Data Protection &amp; Governance
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif]">
            Your business data, completely protected.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            Customer relationships, supplier costs, and pipeline margins are critical business assets. We apply institutional-grade safeguards so you work with peace of mind.
          </p>
        </div>

        {/* Safeguards Grid: Clean Light Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {safeguards.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-2xs"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 text-blue-600 shadow-2xs">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Safeguard</span>
              </div>
            </div>
          ))}
        </div>

        {/* Independent Software Provider Notice */}
        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-500 max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 leading-relaxed">
          <p>
            <strong className="text-slate-800">Software Provider Notice:</strong> WhereReady Solar OS is specialized business management software developed by WhereReady. WhereReady is not a solar panel manufacturer, installation contractor, or government scheme agency.
          </p>
          <span className="text-[11px] font-semibold text-slate-600 shrink-0">DPDP 2023 Ready</span>
        </div>

      </div>
    </section>
  );
}
