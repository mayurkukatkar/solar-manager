"use client";

import React from "react";
import { ArrowRight, Phone, Sun } from "lucide-react";

interface FinalCtaSceneProps {
  onOpenDemo?: () => void;
}

export default function FinalCtaScene({ onOpenDemo }: FinalCtaSceneProps) {
  return (
    <section className="py-24 sm:py-32 bg-white text-slate-900 border-t border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Spacious Container with Soft Border & Delicate Ambient Glow */}
        <div className="max-w-5xl mx-auto bg-gradient-to-b from-blue-50/40 via-white to-amber-50/20 border border-slate-200/90 rounded-3xl p-8 sm:p-16 text-center relative overflow-hidden shadow-xs">
          
          {/* Subtle Ambient Background Sun Beam Art (Echoing Scene 1) */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

          {/* 2D Vector Illustration Accent (Echo of sunlit rooftop array) */}
          <div className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <g className="anim-sun-drift">
                <circle cx="50" cy="50" r="28" fill="#FEF3C7" className="anim-sun-rays" />
                <circle cx="50" cy="50" r="18" fill="#F59E0B" />
              </g>
              <g transform="translate(25, 45)">
                <rect x="0" y="10" width="22" height="28" rx="2" fill="#1E3A8A" stroke="#0F172A" strokeWidth="1" />
                <rect x="26" y="10" width="22" height="28" rx="2" fill="#1E3A8A" stroke="#0F172A" strokeWidth="1" />
                <line x1="11" y1="10" x2="11" y2="38" stroke="#60A5FA" strokeWidth="0.8" />
                <line x1="37" y1="10" x2="37" y2="38" stroke="#60A5FA" strokeWidth="0.8" />
              </g>
            </svg>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif] max-w-2xl mx-auto">
            Ready to bring your solar business into sync?
          </h2>

          {/* Supporting Copy */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto font-normal">
            Take twenty minutes to see how WhereReady Solar OS coordinates your pipeline, proposals, and DISCOM statutory net-metering.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span>Book a Free Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://wa.me/919890000000?text=Hello%20WhereReady%20Solar%20OS%20team,%20I%20would%20like%20to%20connect%20regarding%20the%20software."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-full border border-emerald-200 transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          {/* Reassurance */}
          <p className="mt-6 text-xs text-slate-400">
            Personalized walkthrough • No commitments • Tailored to Indian state DISCOMs
          </p>

        </div>

      </div>
    </section>
  );
}
