import React from "react";
import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | WhereReady Solar OS",
  description: "Terms and conditions governing the subscription and use of WhereReady Solar OS."
};

export default function TermsPage() {
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
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            Subscription Agreement
          </span>
          <span className="text-xs text-slate-400">Effective Date: October 2026</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          The legal agreement governing your use of WhereReady Solar OS software.
        </p>

        <div className="mt-10 space-y-8 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-8">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By subscribing to or using WhereReady Solar OS (&quot;the Service&quot;), provided by WhereReady (&quot;the Company&quot;), your business entity (&quot;Subscriber&quot;, &quot;Customer&quot;) agrees to be bound by these Terms of Service. If you are accepting these terms on behalf of an EPC company, you warrant that you have authority to bind that entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">2. Scope of Service &amp; Intellectual Property</h2>
            <p>
              WhereReady grants Subscriber a limited, non-exclusive, non-transferable right to access and use the Solar OS cloud application during the active subscription period. All intellectual property rights in the software architecture, user interfaces, OCR algorithms, proposal template designs, and documentation belong exclusively to WhereReady.
            </p>
            <p>
              Subscriber retains 100% full and unencumbered ownership of all data, leads, customer records, price lists, site photos, and quotations uploaded or generated within Subscriber&apos;s tenant instance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. Statutory &amp; Regulatory Disclaimers</h2>
            <p>
              WhereReady Solar OS provides tools to assist solar businesses with proposal calculations, equipment sizing, and DISCOM documentation. Subscriber acknowledges:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-900">Subsidies:</strong> Central subsidies (including PM Surya Ghar Muft Bijli Yojana) and state financial incentives are determined and disbursed solely by government authorities. WhereReady Solar OS does not guarantee subsidy approval, disbursement timelines, or eligibility.
              </li>
              <li>
                <strong className="text-slate-900">DISCOM Approvals:</strong> Net-metering feasibility, sanction, meter testing, and grid synchronization approvals are statutory functions of local electricity distribution companies (such as MSEDCL, Tata Power, BESCOM). Software generation of Form A-1 or WCR does not replace statutory compliance obligations.
              </li>
              <li>
                <strong className="text-slate-900">Engineering Responsibility:</strong> Sizing estimates and generation projections are mathematical simulations. The licensed EPC contractor remains solely responsible for structural safety, electrical design, and on-site civil execution.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Subscription Billing, Taxes &amp; GST</h2>
            <p>
              Subscription fees are payable in advance on a monthly or annual basis as specified in the chosen plan. All fees are exclusive of Indian Goods and Services Tax (GST) at the prevailing statutory rate (currently 18%). WhereReady provides valid GST tax invoices quoting the Subscriber&apos;s GSTIN for Input Tax Credit claims.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">5. Cancellation &amp; Data Portability</h2>
            <p>
              Subscribers may cancel their subscription at any time prior to the end of the current billing cycle. Upon cancellation, Subscriber retains full access to export all customer directories, proposals, and project records. No retroactive refunds are provided for partial monthly billing cycles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">6. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any legal notices shall be served to: WhereReady, 1/2, Belekar Layout, Gurukrupa Nagar, Hudkeshwar Road, Nagpur - 440034 (Email: info@whereready.com, Phone: +91 9270201883). Disputes shall be subject to the exclusive jurisdiction of the competent courts in Nagpur / Maharashtra, India.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
