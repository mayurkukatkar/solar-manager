"use client";

import React from "react";
import {
  ShieldCheck,
  Lock,
  Database,
  UserCheck,
  FileCheck,
  Server,
  KeyRound,
  CheckCircle2
} from "lucide-react";

export default function TrustSecuritySection() {
  const safeguards = [
    {
      icon: Database,
      title: "Strict Multi-Tenant Database Isolation",
      description:
        "Every solar EPC tenant operates in complete logical isolation. Your pipeline, quotations, supplier pricing, and profit margins are encrypted and strictly inaccessible to any other contractor."
    },
    {
      icon: Lock,
      title: "DPDP Act 2023 Privacy Compliance",
      description:
        "Engineered to adhere to India's Digital Personal Data Protection Act. Customer electricity bills, property documents, and identity proofs are guarded with controlled access and audit logging."
    },
    {
      icon: UserCheck,
      title: "Granular Role-Based Permissions",
      description:
        "Prevent data leaks inside your own team. Control exactly who can view customer phone numbers, export contacts, edit quotation margins, or approve purchase orders."
    },
    {
      icon: Server,
      title: "Automated Cloud Backups & 99.9% Uptime",
      description:
        "Never lose a proposal or document. Real-time database replication and daily encrypted snapshots ensure continuous operational availability during your busiest bidding cycles."
    }
  ];

  return (
    <section id="security" className="py-24 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enterprise Security &amp; Compliance</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Your Business Data &amp; Quotations,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
              100% Protected
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            We understand how valuable your customer relationships, supplier discounts, and pipeline data are. WhereReady Solar OS applies institutional-grade security safeguards so your team can work with total peace of mind.
          </p>
        </div>

        {/* Safeguards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {safeguards.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg shadow-black/20"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enterprise Verified</span>
              </div>
            </div>
          ))}
        </div>

        {/* Important Identity Notice */}
        <div className="mt-12 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 sm:p-6 text-xs text-slate-400 leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">WhereReady Independent Software Notice</p>
              <p className="text-slate-400 mt-0.5">
                WhereReady Solar OS is specialized business software developed by WhereReady. WhereReady is not a solar panel manufacturer, engineering contractor, or government agency.
              </p>
            </div>
          </div>
          <span className="text-slate-500 font-mono text-[11px] shrink-0">DPDP 2023 Ready</span>
        </div>
      </div>
    </section>
  );
}
