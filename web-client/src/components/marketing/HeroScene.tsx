"use client";

import React from "react";
import { ArrowRight, Sparkles, Zap, ShieldCheck, Sun } from "lucide-react";

interface HeroSceneProps {
  onOpenDemo?: () => void;
}

export default function HeroScene({ onOpenDemo }: HeroSceneProps) {
  return (
    <section className="relative pt-36 pb-20 md:pt-44 md:pb-32 bg-white text-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Story Copy & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Category / Scope Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-blue-600" />
              <span className="font-semibold text-slate-900">WhereReady Solar OS</span>
              <span className="text-slate-300">•</span>
              <span>Software for Indian Solar EPCs &amp; Installers</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] font-['Plus_Jakarta_Sans',sans-serif]">
              Every solar business starts with a{" "}
              <span className="text-blue-600">possibility.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl font-normal">
              Turn that possibility into a business that runs in sync. From first customer bill scan to DISCOM net-metering and commissioning — all in one calm, organized workflow.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                onClick={onOpenDemo}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>Book a Free Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#proposal-demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-all text-center"
              >
                <span>Explore Solar OS</span>
              </a>
            </div>

            {/* Subtle Software Identification Badge */}
            <div className="pt-4 flex items-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Pure SaaS Platform
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                PM Surya Ghar Ready
              </span>
              <span className="text-slate-400">Not an installation contractor</span>
            </div>
          </div>

          {/* Right Column: Original 2D Vector Illustration (Scene 1) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="w-full max-w-lg aspect-[4/3] sm:aspect-square relative flex items-center justify-center">
              
              {/* Soft background ambient halo */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-amber-50/30 to-transparent rounded-full blur-2xl pointer-events-none" />

              {/* Master 2D Vector SVG Illustration */}
              <svg
                viewBox="0 0 540 460"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full relative z-10"
              >
                {/* 1. Moving 2D Stylized Sun */}
                <g className="anim-sun-drift">
                  {/* Subtle outer pulsing ray ring */}
                  <circle
                    cx="430"
                    cy="85"
                    r="52"
                    fill="#FEF3C7"
                    fillOpacity="0.45"
                    className="anim-sun-rays"
                  />
                  {/* Middle warm glow */}
                  <circle
                    cx="430"
                    cy="85"
                    r="38"
                    fill="#FDE68A"
                    fillOpacity="0.75"
                  />
                  {/* Sun core */}
                  <circle
                    cx="430"
                    cy="85"
                    r="26"
                    fill="#F59E0B"
                  />
                  
                  {/* Geometric Sun Ray Accents */}
                  <line x1="430" y1="42" x2="430" y2="30" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="430" y1="128" x2="430" y2="140" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="387" y1="85" x2="375" y2="85" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="473" y1="85" x2="485" y2="85" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="400" y1="55" x2="391" y2="46" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="460" y1="115" x2="469" y2="124" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="400" y1="115" x2="391" y2="124" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="460" y1="55" x2="469" y2="46" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                </g>

                {/* 2. Animated Sunlight Beams traveling toward Rooftop Panels */}
                <g opacity="0.6">
                  <path
                    d="M 405 105 L 260 215"
                    stroke="#FBBF24"
                    strokeWidth="1.75"
                    strokeDasharray="6 6"
                    className="anim-dash-flow"
                  />
                  <path
                    d="M 415 125 L 305 220"
                    stroke="#FBBF24"
                    strokeWidth="1.75"
                    strokeDasharray="6 6"
                    className="anim-dash-flow"
                  />
                  <path
                    d="M 390 120 L 220 225"
                    stroke="#FBBF24"
                    strokeWidth="1.75"
                    strokeDasharray="6 6"
                    className="anim-dash-flow"
                  />
                </g>

                {/* 3. Clean Modern Architectural Home (2D Flat Silhouette) */}
                {/* Ground plane */}
                <line x1="50" y1="410" x2="490" y2="410" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                
                {/* Main House Wall */}
                <rect x="110" y="240" width="280" height="170" rx="4" fill="#F8FAFC" stroke="#334155" strokeWidth="2.5" />
                
                {/* Foundation base */}
                <rect x="100" y="405" width="300" height="6" rx="2" fill="#94A3B8" />

                {/* Angled Roof Structure */}
                <polygon
                  points="90,240 250,140 410,240"
                  fill="#EEF2F6"
                  stroke="#1E293B"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Rooftop Solar PV Arrays (Layered on top of roof) */}
                <g transform="translate(135, 172) rotate(-8)">
                  {/* Solar Panel 1 */}
                  <rect x="0" y="0" width="46" height="64" rx="2" fill="#1E3A8A" stroke="#0F172A" strokeWidth="1.5" />
                  <line x1="23" y1="0" x2="23" y2="64" stroke="#60A5FA" strokeWidth="0.8" />
                  <line x1="0" y1="21" x2="46" y2="21" stroke="#60A5FA" strokeWidth="0.8" />
                  <line x1="0" y1="43" x2="46" y2="43" stroke="#60A5FA" strokeWidth="0.8" />

                  {/* Solar Panel 2 */}
                  <rect x="52" y="0" width="46" height="64" rx="2" fill="#1E3A8A" stroke="#0F172A" strokeWidth="1.5" />
                  <line x1="75" y1="0" x2="75" y2="64" stroke="#60A5FA" strokeWidth="0.8" />
                  <line x1="52" y1="21" x2="98" y2="21" stroke="#60A5FA" strokeWidth="0.8" />
                  <line x1="52" y1="43" x2="98" y2="43" stroke="#60A5FA" strokeWidth="0.8" />

                  {/* Solar Panel 3 */}
                  <rect x="104" y="0" width="46" height="64" rx="2" fill="#1E3A8A" stroke="#0F172A" strokeWidth="1.5" />
                  <line x1="127" y1="0" x2="127" y2="64" stroke="#60A5FA" strokeWidth="0.8" />
                  <line x1="104" y1="21" x2="150" y2="21" stroke="#60A5FA" strokeWidth="0.8" />
                  <line x1="104" y1="43" x2="150" y2="43" stroke="#60A5FA" strokeWidth="0.8" />

                  {/* Solar Panel 4 */}
                  <rect x="156" y="0" width="46" height="64" rx="2" fill="#1E3A8A" stroke="#0F172A" strokeWidth="1.5" />
                  <line x1="179" y1="0" x2="179" y2="64" stroke="#60A5FA" strokeWidth="0.8" />
                  <line x1="156" y1="21" x2="202" y2="21" stroke="#60A5FA" strokeWidth="0.8" />
                  <line x1="156" y1="43" x2="202" y2="43" stroke="#60A5FA" strokeWidth="0.8" />
                </g>

                {/* House Architectural Details */}
                {/* Modern Front Door */}
                <rect x="225" y="300" width="50" height="110" rx="3" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
                <circle cx="265" cy="355" r="3" fill="#1E293B" />

                {/* Left Large Window with grid */}
                <rect x="140" y="275" width="60" height="75" rx="3" fill="#BAE6FD" fillOpacity="0.4" stroke="#475569" strokeWidth="2" />
                <line x1="170" y1="275" x2="170" y2="350" stroke="#475569" strokeWidth="1.5" />
                <line x1="140" y1="312" x2="200" y2="312" stroke="#475569" strokeWidth="1.5" />

                {/* Right Large Window */}
                <rect x="300" y="275" width="60" height="75" rx="3" fill="#BAE6FD" fillOpacity="0.4" stroke="#475569" strokeWidth="2" />
                <line x1="330" y1="275" x2="330" y2="350" stroke="#475569" strokeWidth="1.5" />
                <line x1="300" y1="312" x2="360" y2="312" stroke="#475569" strokeWidth="1.5" />

                {/* Inverter & Bi-directional Net Meter on Side Wall */}
                <rect x="395" y="320" width="22" height="32" rx="2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.75" />
                <rect x="399" y="326" width="14" height="8" rx="1" fill="#10B981" />
                <line x1="395" y1="340" x2="417" y2="340" stroke="#CBD5E1" strokeWidth="1" />
                <path d="M 380 230 L 406 230 L 406 320" stroke="#64748B" strokeWidth="1.5" fill="none" />
              </svg>

              {/* 4. Popping Enquiry Notification Bubble (Scene 1 Customer Lead Event) */}
              <div className="absolute -top-3 sm:top-2 left-2 sm:left-6 z-20 anim-pop">
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xl shadow-slate-200/60 max-w-[260px] sm:max-w-[280px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-800 tracking-wide uppercase">
                      New Solar Enquiry
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto">Just now</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-1">
                    Rajesh K. • Baner, Pune
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    5.4 kW Rooftop • MSEDCL Bill Attached
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-blue-600 font-medium">Ready in Solar OS →</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded text-[10px]">
                      60s Proposal
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
