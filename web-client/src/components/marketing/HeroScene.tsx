"use client";

import React from "react";
import { ArrowRight, Sparkles, Zap, ShieldCheck, Sun } from "lucide-react";
import GuideCharacter from "./GuideCharacter";

interface HeroSceneProps {
  onOpenDemo?: () => void;
}

export default function HeroScene({ onOpenDemo }: HeroSceneProps) {
  const workflowPillars = [
    { name: "Leads", desc: "Enquiry & OCR bills", tag: "Auto-synced" },
    { name: "Quotations", desc: "60-sec luxury proposals", tag: "PM Surya Ghar" },
    { name: "Projects", desc: "5-stage net-metering", tag: "DISCOM A-1" },
    { name: "Installation", desc: "Execution & checklists", tag: "DCR Verified" },
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-grid-subtle text-slate-900 overflow-hidden">
      {/* Soft gradient masks to fade the grid toward center and edges (Design Rule 1) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-transparent to-white pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-white/40 to-white/95 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Instant Product Clarity (Design Rule 2) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Category / Scope Pill: Explicit Software Identification */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/90 text-xs font-semibold text-blue-800 tracking-wide uppercase shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span>SOLAR BUSINESS MANAGEMENT SOFTWARE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08] font-['Plus_Jakarta_Sans',sans-serif]">
              Run your entire solar business.{" "}
              <span className="text-blue-600 block sm:inline">In one place.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg sm:leading-relaxed text-slate-600 max-w-xl font-normal">
              From customer enquiries and professional quotations to project execution and installation tracking.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                onClick={onOpenDemo}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>Book a Free Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#problem"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 text-base font-semibold text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-slate-50 rounded-full border border-slate-200 transition-all text-center shadow-2xs"
              >
                <span>See How It Works</span>
                <span className="text-slate-400 font-mono text-sm">↓</span>
              </a>
            </div>

            {/* Connected Workflow Tags (Leads • Quotations • Projects • Installation) */}
            <div className="pt-4 border-t border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Connected Solar Workflow
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {workflowPillars.map((pillar) => (
                  <div
                    key={pillar.name}
                    className="p-2.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-2xs text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-xs font-bold text-slate-800">{pillar.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{pillar.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Reassurance note */}
            <div className="flex items-center gap-5 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Pure SaaS Solution
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                PM Surya Ghar Ready
              </span>
              <span className="text-slate-400 hidden sm:inline">Built for Indian Solar EPCs</span>
            </div>
          </div>

          {/* Right Column: Large Cinematic Visual & Real Workspace Preview */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* Visual Container with Subtle Grid Fade */}
            <div className="w-full max-w-xl relative">
              
              {/* Friendly Product Guide Character welcoming visitors */}
              <div className="absolute -top-12 -left-4 sm:-left-6 z-30 hidden sm:block">
                <GuideCharacter
                  pose="wave"
                  size={68}
                  speechText="Welcome to Solar OS!"
                />
              </div>

              {/* Master AI-Generated Cinematic Hero Asset */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-blue-500/10 bg-slate-50 group">
                <img
                  src="/images/hero_solar_home.jpg"
                  alt="Modern solar-powered smart home with rooftop photovoltaic installation"
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-transparent to-transparent pointer-events-none" />

                {/* Floating Real-Time Solar OS Dashboard Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/92 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-lg shadow-slate-200/40">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-extrabold text-slate-800">Live Workspace • Sharma Villa</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                      5.4 kW Rooftop
                    </span>
                  </div>

                  {/* Connected Workflow Stepper */}
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-600">
                    <span className="text-blue-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      1. Enquiry
                    </span>
                    <span className="text-blue-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      2. Survey
                    </span>
                    <span className="text-blue-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      3. Quote
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      4. DISCOM A-1
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      5. Installation
                    </span>
                  </div>
                </div>
              </div>

              {/* Popping Badge Accent */}
              <div className="absolute -top-3 -right-2 sm:-right-4 z-20 anim-pop">
                <div className="bg-blue-600 text-white rounded-xl px-3 py-1.5 shadow-lg shadow-blue-500/30 flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Proposal Generated in 60s</span>
                </div>
              </div>

              {/* Ambient Glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100/40 via-amber-100/20 to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
