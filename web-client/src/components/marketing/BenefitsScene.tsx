"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function BenefitsScene() {
  return (
    <section id="benefits" className="py-24 sm:py-36 bg-grid-subtle text-slate-900 border-t border-slate-100 relative overflow-hidden">
      {/* Soft gradient masks to fade the grid toward center */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/95 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
          <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
            Operational Simplicity
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif]">
            Less chasing. More moving forward.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            When software is designed around the real rhythm of a solar company, operations become calm, predictable, and scalable.
          </p>
        </div>

        {/* Three Spacious Visual Moments (Not a 3-box card grid!) */}
        <div className="space-y-24 sm:space-y-36 max-w-5xl mx-auto">
          
          {/* Moment 1: Every lead has a place */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            {/* Visual Left */}
            <div className="md:col-span-6 flex justify-center">
              <div className="w-full max-w-md aspect-square bg-blue-50/50 rounded-3xl p-8 flex items-center justify-center relative border border-blue-100/60 shadow-2xs">
                <svg viewBox="0 0 320 320" className="w-full h-full" fill="none">
                  {/* Incoming Bill OCR Scanner Graphic */}
                  <rect x="70" y="60" width="180" height="200" rx="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
                  
                  {/* Bill header lines */}
                  <rect x="95" y="90" width="70" height="10" rx="3" fill="#3B82F6" />
                  <rect x="95" y="112" width="130" height="4" rx="2" fill="#E2E8F0" />
                  <rect x="95" y="124" width="110" height="4" rx="2" fill="#E2E8F0" />
                  
                  {/* Scanning beam line */}
                  <line x1="60" y1="150" x2="260" y2="150" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 4" className="anim-dash-flow" />
                  
                  {/* Detected consumer tag pill */}
                  <g className="anim-pop">
                    <rect x="95" y="175" width="130" height="32" rx="6" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1.5" />
                    <circle cx="112" cy="191" r="5" fill="#10B981" />
                    <text x="125" y="195" fill="#166534" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      Consumer &amp; Tariff Verified
                    </text>
                  </g>
                  
                  {/* Clean pipeline folder tag */}
                  <rect x="95" y="222" width="90" height="18" rx="4" fill="#EFF6FF" />
                  <text x="105" y="234" fill="#1E40AF" fontSize="9" fontWeight="600" fontFamily="sans-serif">
                    → Assigned to Sales
                  </text>
                </svg>
              </div>
            </div>

            {/* Copy Right */}
            <div className="md:col-span-6 space-y-4 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Moment 01
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Every lead has a place.
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Whether an enquiry arrives from a homeowner on WhatsApp, a rooftop survey from the field, or an online form — it lands in a clean, standardized pipeline. Utility bills are parsed in seconds, customer history is unified, and nothing slips through the cracks.
              </p>
            </div>
          </div>

          {/* Moment 2: Every quotation has a next step */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            {/* Copy Left */}
            <div className="md:col-span-6 order-2 md:order-1 space-y-4 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Moment 02
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Every quotation has a next step.
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                No more dead-end proposals or forgotten follow-ups. Proposals are generated in 60 seconds using your approved equipment margins. When a customer accepts, a single click converts the estimate directly into an active project dossier.
              </p>
            </div>

            {/* Visual Right */}
            <div className="md:col-span-6 order-1 md:order-2 flex justify-center">
              <div className="w-full max-w-md aspect-square bg-amber-50/40 rounded-3xl p-8 flex items-center justify-center relative border border-amber-100/70 shadow-2xs">
                <svg viewBox="0 0 320 320" className="w-full h-full" fill="none">
                  {/* Proposal Document transforming into Agreement */}
                  <rect x="70" y="60" width="180" height="200" rx="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
                  
                  {/* Gold header */}
                  <rect x="95" y="85" width="80" height="12" rx="3" fill="#F59E0B" />
                  
                  {/* Solar generation preview graph */}
                  <path d="M 95 155 Q 140 120 185 135 T 225 110" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
                  
                  {/* Acceptance Stamp Badge */}
                  <g className="anim-pop">
                    <circle cx="210" cy="190" r="28" fill="#F0FDF4" stroke="#22C55E" strokeWidth="2" strokeDasharray="3 3" />
                    <text x="190" y="193" fill="#15803D" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                      APPROVED
                    </text>
                  </g>
                  
                  {/* Arrow to project */}
                  <rect x="95" y="215" width="130" height="24" rx="6" fill="#1E293B" />
                  <text x="110" y="230" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                    Converted to Project Dossier ✓
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Moment 3: Every project has a clearer path */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            {/* Visual Left */}
            <div className="md:col-span-6 flex justify-center">
              <div className="w-full max-w-md aspect-square bg-emerald-50/40 rounded-3xl p-8 flex items-center justify-center relative border border-emerald-100/70 shadow-2xs">
                <svg viewBox="0 0 320 320" className="w-full h-full" fill="none">
                  {/* Stepped Project Milestone Journey */}
                  <rect x="60" y="70" width="200" height="180" rx="14" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
                  
                  {/* Step 1: DISCOM Form A-1 */}
                  <circle cx="95" cy="110" r="10" fill="#10B981" />
                  <path d="M 92 110 L 94 112 L 98 108" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="115" y="113" fill="#0F172A" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    DISCOM Net-Meter Sanction
                  </text>
                  <line x1="95" y1="120" x2="95" y2="145" stroke="#CBD5E1" strokeWidth="2" />

                  {/* Step 2: DCR Serials Dispatched */}
                  <circle cx="95" cy="155" r="10" fill="#10B981" />
                  <path d="M 92 155 L 94 157 L 98 153" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="115" y="158" fill="#0F172A" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    DCR Module Serials Dispatched
                  </text>
                  <line x1="95" y1="165" x2="95" y2="190" stroke="#CBD5E1" strokeWidth="2" />

                  {/* Step 3: WCR & Handover */}
                  <circle cx="95" cy="200" r="10" fill="#3B82F6" />
                  <text x="115" y="203" fill="#0F172A" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    Grid Sync &amp; Surya Ghar Subsidy
                  </text>
                </svg>
              </div>
            </div>

            {/* Copy Right */}
            <div className="md:col-span-6 space-y-4 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Moment 03
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Every project has a clearer path.
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                State utility approvals don&apos;t have to feel like a black box. Track DISCOM Form A-1 submissions, contractor license proofs, material dispatch barcodes, and final Work Completion Reports (WCR) in one coordinated timeline.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
