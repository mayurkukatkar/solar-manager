"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How quickly can our team learn and start using WhereReady Solar OS?",
      a: "Most solar teams send their first real proposal within 30 minutes of setup. The interface was engineered specifically for Indian solar workflows with intuitive terminology (sanctioned load, DISCOM, DCR modules, net-metering). We also provide 1-on-1 video onboarding for your sales reps and project coordinators."
    },
    {
      q: "Does WhereReady Solar OS support PM Surya Ghar and state DISCOM paperwork?",
      a: "Yes! WhereReady Solar OS includes a dedicated PM Surya Ghar National Portal studio (`pmsuryaghar.gov.in`) with 1-click bulk formatting for DCR module serials and beneficiary bank account validation. It also auto-generates state-specific DISCOM documentation including MSEDCL Form A-1, Annexure-2 Agreements, and Work Completion Reports (WCR)."
    },
    {
      q: "Can we put our own company logo, colors, and bank UPI QR code on the proposals?",
      a: "100% yes. Under your Tenant Settings, you can upload your high-resolution company logo, official brand colors, authorized signature, company seal/stamp, GSTIN, and EPC bank account with UPI QR code. Every proposal, contract, and GST tax invoice is generated with your exclusive company branding."
    },
    {
      q: "How does the Electricity Bill OCR Scanner work?",
      a: "Simply take a photo or upload a PDF of the customer's utility bill (such as MSEDCL Mahavitaran, Tata Power, BESCOM, etc.). Our integrated OCR engine extracts the consumer number, sanctioned load, billing history, and tariff category (LT-I Residential or LT-II Commercial) in seconds, feeding it straight into solar sizing without manual typing."
    },
    {
      q: "Can our field surveyors and site installation crew use this on mobile phones?",
      a: "Yes. WhereReady Solar OS includes a responsive web application and dedicated mobile workflows optimized for Android and iOS smartphones. Field technicians can capture rooftop survey measurements, upload photos of structural beams and earthing pits, and check off installation milestones right from the roof."
    },
    {
      q: "How is our sensitive pricing, supplier costs, and customer database protected?",
      a: "WhereReady Solar OS is built on strict multi-tenant database isolation. Your data is strictly encrypted and partitioned under your unique tenant ID. Other solar EPCs have zero access to your leads, margin settings, or proposals. Furthermore, our platform adheres to India's Digital Personal Data Protection (DPDP) Act 2023."
    },
    {
      q: "Can we import our existing leads and customer records from Excel spreadsheets?",
      a: "Yes! You can bulk-import your historical leads, customer directories, and product catalogue from standard CSV and Excel files. Our onboarding team is also available to assist with data formatting to ensure zero downtime."
    },
    {
      q: "What support is available if we have questions or need help?",
      a: "All plans include direct WhatsApp and email assistance with dedicated solar software specialists. Growth Pro and Enterprise plans also include priority telephone support and a dedicated onboarding manager."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-slate-900/60 text-white relative border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions? We Have Answers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Everything you need to know about implementing WhereReady Solar OS in your solar EPC business.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left font-bold text-base sm:text-lg text-white flex items-center justify-between gap-4 cursor-pointer hover:text-blue-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-slate-300 leading-relaxed border-t border-slate-900/80 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions? */}
        <div className="mt-12 text-center p-6 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="font-bold text-white text-sm">Have a unique workflow or custom DISCOM question?</p>
            <p className="text-slate-400 mt-0.5">Our solar domain specialists are ready to walk you through your exact setup.</p>
          </div>
          <a
            href="https://wa.me/919890000000?text=Hello%20WhereReady%20Solar%20OS%20team,%20I%20have%20a%20few%20questions%20before%20booking%20a%20demo."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
          >
            Ask Us on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
