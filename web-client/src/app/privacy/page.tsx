import React from "react";
import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | WhereReady Solar OS",
  description: "Privacy Policy and personal data protection practices under DPDP Act 2023 for WhereReady Solar OS."
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            DPDP Act 2023 Compliance
          </span>
          <span className="text-xs text-slate-500">Effective Date: October 2026</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          How WhereReady collects, uses, and safeguards information when you use WhereReady Solar OS.
        </p>

        <div className="mt-10 space-y-8 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-8">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">1. Company Identity &amp; Scope</h2>
            <p>
              WhereReady Solar OS is a cloud-based multi-tenant Software-as-a-Service (SaaS) application developed and operated by WhereReady (&quot;WhereReady&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). This Privacy Policy explains our collection, use, disclosure, and protection of personal data in connection with our public marketing website and the Solar OS software platform, in compliance with India&apos;s Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;) and applicable statutory rules.
            </p>
            <p>
              WhereReady is a business software provider. We do not manufacture solar equipment, execute civil installations, or administer government subsidies directly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">2. Categories of Information Collected</h2>
            <p>We process information in two distinct roles:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong className="text-white">Marketing Website &amp; Demo Visitors:</strong> Name, work email address, WhatsApp mobile number, company name, city, state, business category, and demo preference notes submitted through our inquiry forms.
              </li>
              <li>
                <strong className="text-white">Customer (Tenant) Account Information:</strong> Authorized administrative contacts, GSTIN, PAN, business entity address, authorized signature, company seal, and bank UPI details configured by the subscriber.
              </li>
              <li>
                <strong className="text-white">Subscriber Customer Data (Data Processor Role):</strong> Consumer electricity bills, rooftop site survey photographs, customer names, addresses, sanctioned loads, and DISCOM net-metering documents uploaded by solar EPC subscribers into their private tenant instance.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">3. Multi-Tenant Logical Isolation &amp; Customer Data Ownership</h2>
            <p>
              All customer data, leads, proposals, equipment pricing margins, and project files uploaded by an EPC subscriber are the exclusive proprietary property of that subscriber. WhereReady Solar OS implements strict multi-tenant database isolation (enforced via tenant identification tokens at both database and API middleware levels).
            </p>
            <p>
              No other solar contractor, subscriber, or third party has access to your tenant&apos;s data or quotations. WhereReady staff access tenant instances only upon explicit support authorization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">4. Electricity Bill OCR &amp; Document Processing</h2>
            <p>
              When electricity bills or utility documents are processed through our OCR scanner, text extraction occurs in secure, private memory containers. Extracted data fields (consumer numbers, sanctioned loads, tariffs) are saved solely into the authenticated subscriber&apos;s tenant records and are never pooled into public models.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">5. Data Retention &amp; Export</h2>
            <p>
              Subscribers retain full data portability. You may export customer directories, quotations, and project reports in standard formats (CSV and PDF) at any time through the Solar OS interface. Upon subscription cancellation or non-renewal, tenant data is retained for a standard 30-day grace period to enable final export, after which it is securely expunged.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">6. Grievance Redressal &amp; Data Rights</h2>
            <p>
              In accordance with the DPDP Act 2023, you have the right to access, rectify, or request deletion of personal information held by WhereReady. For any data protection inquiries or grievance notices, please contact:
            </p>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <p className="font-bold text-white">Data Protection Officer / Grievance Officer</p>
              <p className="text-slate-400 mt-1">WhereReady Privacy Office</p>
              <p className="text-slate-400">Email: privacy@whereready.com</p>
              <p className="text-slate-400">Response timeframe: Within 7 business days</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
