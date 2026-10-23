"use client";

import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import GuideCharacter from "./GuideCharacter";
import WhatsAppCta from "./WhatsAppCta";

interface FinalCtaSceneProps {
  onOpenDemo?: () => void;
}

export default function FinalCtaScene({ onOpenDemo }: FinalCtaSceneProps) {
  return (
    <section className="py-24 sm:py-32 bg-grid-subtle text-slate-900 border-t border-slate-100 relative overflow-hidden">
      {/* Soft gradient masks to fade the grid toward center */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/95 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Spacious Container with Soft Border & Delicate Ambient Glow */}
        <div className="max-w-5xl mx-auto bg-gradient-to-b from-blue-50/40 via-white to-amber-50/20 border border-slate-200/90 rounded-3xl p-8 sm:p-16 text-center relative overflow-hidden shadow-xs">
          
          {/* Subtle Ambient Background Sun Beam Art (Echoing Scene 1) */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

          {/* Guide Character Celebrating Completed Journey & Inviting to Demo */}
          <div className="mb-4 relative flex items-center justify-center">
            <GuideCharacter
              pose="celebrate"
              size={78}
              speechText="Ready to bring your solar team into sync!"
            />
          </div>

          {/* Scene 5 Pill */}
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase mb-3">
            Scene 05 • Take Action
          </span>

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

            {/* Verified Business WhatsApp CTA (Item 1 in brief) */}
            <WhatsAppCta
              label="Chat on WhatsApp"
              variant="button"
              showCharacterWave={false}
            />
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
