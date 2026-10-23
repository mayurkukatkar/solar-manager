import React from "react";
import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import { ArrowLeft, Database, Lock, Server, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Security & Data Protection | WhereReady Solar OS",
  description: "Enterprise security architecture, multi-tenant isolation, and DPDP 2023 compliance safeguards in WhereReady Solar OS."
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            Institutional Safeguards
          </span>
          <span className="text-xs text-slate-400">Security Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Security &amp; Tenant Protection
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          How WhereReady Solar OS guards your leads, pricing margins, and customer documents.
        </p>

        <div className="mt-10 space-y-8 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-8">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              1. Multi-Tenant Logical Segregation
            </h2>
            <p>
              In a competitive solar market, your customer pipeline, BOM costs, and equipment margins are critical business assets. WhereReady Solar OS enforces strict multi-tenant isolation at every layer:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-900">API Level:</strong> Every incoming request is authenticated through strict <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono text-xs">requireTenantAuth</code> JWT middleware that cryptographically binds queries to the subscriber&apos;s unique tenant ID.
              </li>
              <li>
                <strong className="text-slate-900">Database Level:</strong> PostgreSQL Prisma schemas isolate tenant records. Cross-tenant access is physically impossible under standard querying.
              </li>
              <li>
                <strong className="text-slate-900">Storage Level:</strong> Uploaded customer electricity bills, KYC files, and photo survey logs are indexed within private cloud storage folders restricted to authorized tenant keys.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              2. DPDP Act 2023 Technical Safeguards
            </h2>
            <p>
              Under India&apos;s Digital Personal Data Protection Act (2023), handling end-consumer utility bills and identification requires stringent security:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Encryption in transit using TLS 1.3 across all endpoints.</li>
              <li>Encrypted storage of sensitive credentials, passwords (bcrypt hashes), and API secrets.</li>
              <li>Zero data sharing with advertising networks or third-party lead marketplaces.</li>
              <li>Automated audit logging of account access and document exports.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              3. High Availability, Backups &amp; Disaster Recovery
            </h2>
            <p>
              Solar EPC businesses operate on tight bidding deadlines. Our cloud infrastructure is deployed across high-redundancy availability zones:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>99.9% uptime target with automated failover and health checks.</li>
              <li>Daily automated snapshots with point-in-time recovery capabilities.</li>
              <li>Real-time application performance and error monitoring.</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
