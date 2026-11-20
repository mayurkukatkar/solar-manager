"use client";

import React from "react";
import Link from "next/link";
import {
  Smartphone,
  Download,
  Zap,
  MapPin,
  Barcode,
  WifiOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function MobileAppCtaSection() {
  const APK_URL = "https://expo.dev/artifacts/eas/W4k8Hnc6eIBtPhEk9V43oxsTb24eCV4ciSvjj82GQu0.apk";

  return (
    <section className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
      {/* Background Lighting Accents */}
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Info Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WhereReady Solar OS Android v1.1.0 Released</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Bring Field Operations &amp; CEA Compliance Into the Palm of Your Hand
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Give your site supervisors and technicians the power of statutory CEA Ohmic earthing tests, 5-Geo proofing with photo tamper verification, and 2D DCR panel barcode scanning—with 100% offline sync capability.
            </p>

            {/* Quick feature list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-2 text-left">
              <div className="flex items-center gap-2.5 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Statutory CEA Ohmic Tests (&le; 2.0 &Omega;)</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>5-Geo Proofs (Roof, Inverter, Meter)</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <Barcode className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>DCR Barcode Scanner &amp; ALMM Verification</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <WifiOff className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Zero Network Offline Auto-Sync</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start">
              <Link
                href="/download"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Download Android App &amp; APK</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={APK_URL}
                download="WhereReady-Solar-OS-v1.1.0.apk"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:text-white transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Direct APK (54 MB)</span>
              </a>
            </div>
          </div>

          {/* Right Visual Phone Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-72 sm:w-80 bg-slate-950 p-4 rounded-[40px] border-4 border-slate-700/80 shadow-2xl shadow-blue-600/20">
              {/* Phone Camera Notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-950 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              </div>

              {/* Mock App Screen */}
              <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 space-y-3.5 text-xs">
                {/* Header Lockup */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                      W
                    </div>
                    <span className="font-extrabold text-white text-[11px]">WhereReady Solar OS</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                    ONLINE
                  </span>
                </div>

                {/* Statutory Test Card */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>CEA Electrical QA</span>
                    <span className="text-emerald-400 font-bold">PASSED</span>
                  </div>
                  <div className="text-sm font-black text-white">1.84 &Omega; Earth Resistance</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Statutory Limit: &le; 2.0 &Omega; • Compliant
                  </div>
                </div>

                {/* 5-Geo Proofs */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-300 font-bold">5-Geo Proof Milestones</span>
                    <span className="text-blue-400 font-bold">5/5 Completed</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-full rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                    <span>Roof • Inverter • Earthing</span>
                    <span className="text-emerald-400 font-mono">18.5204° N, 73.8567° E</span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-blue-600/20 border border-blue-500/30 p-2 rounded-lg text-center">
                    <Barcode className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-blue-300 block">DCR Scan</span>
                  </div>
                  <div className="bg-amber-600/20 border border-amber-500/30 p-2 rounded-lg text-center">
                    <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-amber-300 block">Ohmic Test</span>
                  </div>
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
