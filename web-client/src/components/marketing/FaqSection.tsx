"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How quickly can our team learn and start using WhereReady Solar OS?",
      a: "Most solar contractors generate their first live proposal within thirty minutes. The platform uses intuitive Indian solar terminology (sanctioned load, MSEDCL/DISCOM tariffs, DCR modules, net-metering Form A-1) so your sales reps and project coordinators feel at home immediately."
    },
    {
      q: "Does WhereReady Solar OS support PM Surya Ghar and state DISCOM paperwork?",
      a: "Yes. Solar OS includes a dedicated PM Surya Ghar National Portal studio (`pmsuryaghar.gov.in`) with one-click bulk formatting for DCR module serials and beneficiary bank account validation. It also pre-populates state-specific DISCOM documentation including MSEDCL Form A-1, Annexure-2 Agreements, and Work Completion Reports (WCR)."
    },
    {
      q: "Can we put our own company logo, colors, and bank UPI QR code on the proposals?",
      a: "Yes, completely. Under your Tenant Settings, you upload your company logo, official brand colors, authorized signature, company seal, GSTIN, and bank account with UPI QR code. Every proposal, contract, and GST tax invoice is generated with your exclusive brand identity."
    },
    {
      q: "How does the Electricity Bill OCR Scanner work?",
      a: "Simply upload a photo or PDF of the consumer's utility bill (such as MSEDCL, Tata Power, BESCOM). The OCR engine automatically extracts consumer number, sanctioned load, billing history, and tariff category (LT-I Residential or LT-II Commercial), populating the solar sizing model without manual typing."
    },
    {
      q: "Can our field surveyors and site installation crew use this on mobile phones?",
      a: "Yes. WhereReady Solar OS is fully responsive and pairs with our mobile field workflows. Field technicians can record rooftop measurements, upload structural and earthing pit photos, and check off installation milestones right from the roof."
    },
    {
      q: "How is our sensitive pricing, supplier costs, and customer database protected?",
      a: "WhereReady Solar OS enforces strict multi-tenant database isolation. Your data is encrypted and partitioned under your unique tenant ID. Other solar EPCs have zero access to your leads, margin settings, or proposals. Furthermore, our platform adheres to India's Digital Personal Data Protection (DPDP) Act 2023."
    },
    {
      q: "Can we import our existing leads and customer records from Excel spreadsheets?",
      a: "Yes. You can import existing leads, customer records, and product catalogues from standard CSV and Excel files. Our onboarding team is also available to help format your data during setup."
    },
    {
      q: "What support is available if we have questions or need help?",
      a: "All plans include direct WhatsApp and email assistance with dedicated solar software specialists. Growth Pro and Enterprise plans also include priority telephone support and a dedicated onboarding manager."
    }
  ];

  return (
    <section id="faq" className="py-24 sm:py-32 bg-grid-subtle text-slate-900 border-t border-slate-100 relative overflow-hidden">
      {/* Soft gradient masks to fade the grid toward center */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/95 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Questions &amp; Answers
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif]">
            Frequently asked questions.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            Everything you need to know about implementing WhereReady Solar OS in your solar business.
          </p>
        </div>

        {/* Clean Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-4 sm:py-5 text-left font-bold text-sm sm:text-base text-slate-900 flex items-center justify-between gap-4 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Clean Contact Link */}
        <div className="mt-12 text-center text-xs text-slate-500">
          <span>Still have questions about a specific DISCOM or custom workflow? </span>
          <a
            href="https://wa.me/919890000000?text=Hello%20WhereReady%20Solar%20OS%20team,%20I%20have%20a%20few%20questions%20before%20booking%20a%20demo."
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-4"
          >
            Chat directly with our team on WhatsApp →
          </a>
        </div>

      </div>
    </section>
  );
}
