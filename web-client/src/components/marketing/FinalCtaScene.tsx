"use client";

import React from "react";
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, MapPin, Phone, Mail } from "lucide-react";
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
        
        {/* Spacious Container with Soft Border & Cinematic Visual Composition */}
        <div className="max-w-5xl mx-auto bg-gradient-to-b from-blue-50/40 via-white to-amber-50/20 border border-slate-200/90 rounded-3xl p-6 sm:p-12 md:p-16 relative overflow-hidden shadow-xs">
          
          {/* Subtle Ambient Background Sun Beam Glow (Echoing Hero Scene) */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

          {/* Cinematic Final Solar Installation Scene Showcase (Requirement 2 & 3) */}
          <div className="relative mb-10 max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl shadow-blue-500/10 group">
            <img
              src="/images/final_solar_showcase.jpg"
              alt="Commissioned residential rooftop photovoltaic installation with sun flare and synchronized grid connection"
              className="w-full h-64 sm:h-80 md:h-96 object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            {/* Subtle Gradient Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

            {/* Guide Character in Top-Right / Corner */}
            <div className="absolute top-4 right-4 z-20">
              <GuideCharacter
                pose="celebrate"
                size={64}
                speechText="Site online & synchronized!"
              />
            </div>

            {/* Floating Live Handover Badges */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wide">
                    Final Solar Installation Handover
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-3">
                  <span>5.4 kW High-Efficiency Bifacial</span>
                  <span>•</span>
                  <span className="text-emerald-300 font-semibold">Net-Meter Verified ✓</span>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-[11px] font-bold shadow-md flex items-center gap-1.5 self-end sm:self-auto">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>PM Surya Ghar DBT Ready</span>
              </div>
            </div>
          </div>

          <div className="text-center max-w-2xl mx-auto">
            {/* Scene 5 Label */}
            <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase mb-3">
              Scene 05 • Take Action
            </span>

            {/* Very Large Headline (Creative Rule 1 & 7) */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] font-['Plus_Jakarta_Sans',sans-serif]">
              Ready to bring your solar business into sync?
            </h2>

            {/* One Short Supporting Sentence (Creative Rule 1 & 7) */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal">
              Take twenty minutes to see how WhereReady Solar OS coordinates your pipeline, proposals, and DISCOM statutory net-metering.
            </p>

            {/* Action CTAs (Primary Demo + Verified WhatsApp) */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={onOpenDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>Book a Free Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Verified Business WhatsApp CTA */}
              <WhatsAppCta
                label="Chat on WhatsApp"
                variant="button"
                showCharacterWave={false}
              />
            </div>

            {/* Reassurance */}
            <p className="mt-5 text-xs text-slate-400">
              Personalized walkthrough • No commitments • Tailored to Indian state DISCOMs
            </p>

            {/* Verified Company Contact Details Strip (Requirement 7) */}
            <div className="mt-10 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <a
                href="https://wa.me/919270201883"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-700">9270201883</span>
              </a>
              <a
                href="mailto:info@whereready.com"
                className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-700">info@whereready.com</span>
              </a>
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Nagpur, Maharashtra - 440034</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
