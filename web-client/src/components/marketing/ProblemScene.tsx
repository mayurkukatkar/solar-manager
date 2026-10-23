"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, FileSpreadsheet, ClipboardList, Clock, AlertCircle, ArrowDown } from "lucide-react";

export default function ProblemScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const [converged, setConverged] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // As the visitor scrolls into the scene, objects converge
        if (entry.isIntersecting) {
          setConverged(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="py-20 sm:py-32 bg-grid-subtle text-slate-900 relative overflow-hidden border-t border-slate-100"
    >
      {/* Soft gradient masks to fade the grid toward center */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/70 to-white/95 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Centered Headline with Generous Negative Space (Design Rule 2) */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Scene 02 • Recognize the Problem
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] font-['Plus_Jakarta_Sans',sans-serif]">
            Leads, quotations and projects shouldn&apos;t live in different places.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            When customer messages, field surveys, and calculation spreadsheets are scattered, teams lose hours and projects stall.
          </p>
        </div>

        {/* =========================================================================
            MOBILE LAYOUT (< md): Clean, Non-Overlapping Structured Cards
            ========================================================================= */}
        <div className="block md:hidden max-w-md mx-auto space-y-3">
          <div className="text-center mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              4 Scattered Friction Points
            </span>
          </div>

          {/* Mobile Card 1: WhatsApp Chat */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Chat with Site Engg</span>
              <span className="text-[10px] text-slate-400 ml-auto">Yesterday</span>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
              &ldquo;Did someone submit the MSEDCL Form A-1? Customer is calling again about the net-meter inspection.&rdquo;
            </p>
            <span className="text-[10px] text-amber-600 font-medium mt-1.5 block">
              ⚠ Unanswered message thread
            </span>
          </div>

          {/* Mobile Card 2: Excel Spreadsheet */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 truncate">Quote_v4_final_copy.xlsx</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span>5kW System Cost:</span>
                <span className="font-semibold text-slate-900">₹2,80,000</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Subsidy Calc:</span>
                <span>#REF! Error</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Last modified 14 days ago by unknown
            </span>
          </div>

          {/* Mobile Card 3: Rooftop Survey Memo */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <ClipboardList className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-amber-900">Rooftop Survey Memo</span>
            </div>
            <p className="text-xs text-slate-700 leading-snug">
              Tilt ~18°, Azimuth South-West. Cable run: <em className="text-slate-400">??? (forgot to log)</em>
            </p>
            <div className="mt-2 text-[10px] text-amber-800 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Photos stuck on technician&apos;s phone</span>
            </div>
          </div>

          {/* Mobile Card 4: Forgotten Reminder */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-800">Follow-up Overdue</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dr. Kulkarni (10 kW Commercial) quote sent 12 days ago. No follow-up recorded.
            </p>
          </div>

          {/* Mobile Central Resolution Card */}
          <div className="pt-2">
            <div className="text-center bg-blue-50/80 backdrop-blur-md p-5 rounded-2xl border border-blue-200 shadow-md shadow-blue-100/50">
              <span className="text-xs font-extrabold text-blue-900 block">
                WhereReady Solar OS
              </span>
              <span className="text-xs text-slate-600 mt-1 block">
                Unifies your scattered workflow into one calm system
              </span>
              <div className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 bg-white px-3.5 py-1.5 rounded-full border border-blue-200 shadow-2xs">
                <span>See the connected workflow below</span>
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DESKTOP LAYOUT (>= md): Asymmetrical Converging Floating Composition
            ========================================================================= */}
        <div className="hidden md:flex relative max-w-4xl mx-auto min-h-[460px] lg:min-h-[480px] items-center justify-center">
          
          {/* Connecting SVG lines that become solid as items converge */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700"
            viewBox="0 0 800 460"
            fill="none"
          >
            <path
              d="M 200 110 Q 320 180 400 230 T 600 110"
              stroke={converged ? "#3B82F6" : "#CBD5E1"}
              strokeWidth={converged ? "2" : "1.5"}
              strokeDasharray={converged ? "none" : "4 6"}
              className="transition-all duration-700"
            />
            <path
              d="M 200 350 Q 320 280 400 230 T 600 350"
              stroke={converged ? "#3B82F6" : "#CBD5E1"}
              strokeWidth={converged ? "2" : "1.5"}
              strokeDasharray={converged ? "none" : "4 6"}
              className="transition-all duration-700"
            />
          </svg>

          {/* Floating Object 1: WhatsApp Chat Fragment (Top Left) */}
          <div
            className={`absolute top-4 left-0 lg:left-4 z-10 max-w-[260px] lg:max-w-[275px] transition-all duration-700 ease-out ${
              converged
                ? "translate-x-0 translate-y-0 rotate-0 opacity-100"
                : "-translate-x-4 -translate-y-3 -rotate-3 opacity-90"
            }`}
          >
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-lg shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Chat with Site Engg</span>
                <span className="text-[10px] text-slate-400 ml-auto">Yesterday</span>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                &ldquo;Did someone submit the MSEDCL Form A-1? Customer is calling again about the net-meter inspection.&rdquo;
              </p>
              <span className="text-[10px] text-amber-600 font-medium mt-1.5 block">
                ⚠ Unanswered message thread
              </span>
            </div>
          </div>

          {/* Floating Object 2: Excel Spreadsheet Fragment (Top Right) */}
          <div
            className={`absolute top-4 right-0 lg:right-4 z-20 max-w-[250px] lg:max-w-[265px] transition-all duration-700 ease-out delay-75 ${
              converged
                ? "translate-x-0 translate-y-0 rotate-0 opacity-100"
                : "translate-x-5 -translate-y-2 rotate-3 opacity-90"
            }`}
          >
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-lg shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-slate-700 truncate">Quote_v4_final_copy.xlsx</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span>5kW System Cost:</span>
                  <span className="font-semibold text-slate-900">₹2,80,000</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Subsidy Calc:</span>
                  <span>#REF! Error</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Last modified 14 days ago by unknown
              </span>
            </div>
          </div>

          {/* Floating Object 3: Loose Paper Survey Note (Bottom Left) */}
          <div
            className={`absolute bottom-4 left-0 lg:left-6 z-15 max-w-[240px] lg:max-w-[255px] transition-all duration-700 ease-out delay-100 ${
              converged
                ? "translate-x-0 translate-y-0 rotate-0 opacity-100"
                : "-translate-x-4 translate-y-4 -rotate-2 opacity-90"
            }`}
          >
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-md shadow-amber-100/40">
              <div className="flex items-center gap-2 mb-1.5">
                <ClipboardList className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">Rooftop Survey Memo</span>
              </div>
              <p className="text-xs text-slate-700 leading-snug">
                Tilt ~18°, Azimuth South-West. Cable run: <em className="text-slate-400">??? (forgot to log)</em>
              </p>
              <div className="mt-2 text-[10px] text-amber-800 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>Photos stuck on technician&apos;s phone</span>
              </div>
            </div>
          </div>

          {/* Floating Object 4: Forgotten Reminder (Bottom Right) */}
          <div
            className={`absolute bottom-4 right-0 lg:right-6 z-10 max-w-[240px] lg:max-w-[250px] transition-all duration-700 ease-out delay-150 ${
              converged
                ? "translate-x-0 translate-y-0 rotate-0 opacity-100"
                : "translate-x-4 translate-y-3 rotate-2 opacity-90"
            }`}
          >
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 shadow-md shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-800">Follow-up Overdue</span>
              </div>
              <p className="text-xs text-slate-500">
                Dr. Kulkarni (10 kW Commercial) quote sent 12 days ago. No follow-up recorded.
              </p>
            </div>
          </div>

          {/* Central Convergence Hub Statement */}
          <div className="text-center z-30 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-blue-200 shadow-lg shadow-blue-100/50 max-w-xs transition-all duration-700">
            <span className="text-xs font-bold text-blue-900 block">
              WhereReady Solar OS
            </span>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              Unifies your scattered workflow into one calm system
            </span>
            <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-semibold text-blue-600">
              <span>See the connected workflow below</span>
              <ArrowDown className="w-3 h-3 animate-bounce" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

