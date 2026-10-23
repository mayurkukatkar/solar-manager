"use client";

import React from "react";
import { MessageSquare, FileSpreadsheet, ClipboardList, Clock, AlertCircle } from "lucide-react";

export default function ProblemScene() {
  return (
    <section className="py-24 sm:py-32 bg-white text-slate-900 relative overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Centered Headline with Generous Negative Space */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            The Reality of Fragmented Tools
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif]">
            Good work shouldn&apos;t get lost in the gaps.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            Leads in personal chats. Site photos on lost phones. Estimates held in memory. When teams work in silos, projects stall and customer confidence slips.
          </p>
        </div>

        {/* Asymmetrical 2D Composition: Floating Fragmented Objects */}
        <div className="relative max-w-4xl mx-auto h-[380px] sm:h-[420px] flex items-center justify-center">
          
          {/* Subtle dotted connector hinting at broken lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
            viewBox="0 0 800 400"
            fill="none"
          >
            <path
              d="M 180 120 Q 320 180 400 130 T 620 220"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            <path
              d="M 220 280 Q 360 210 520 290"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
          </svg>

          {/* Floating Object 1: WhatsApp Chat Fragment (Top Left) */}
          <div className="absolute top-4 sm:top-8 left-2 sm:left-12 anim-float-tilt z-10 max-w-[240px] sm:max-w-[270px]">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-lg shadow-slate-100/80">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Chat with Site Engg</span>
                <span className="text-[10px] text-slate-400 ml-auto">Yesterday</span>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                &ldquo;Did someone submit the MSEDCL Form A-1? Customer is calling again about the meter inspection.&rdquo;
              </p>
              <span className="text-[10px] text-amber-600 font-medium mt-1.5 block">
                ⚠ Unanswered in thread
              </span>
            </div>
          </div>

          {/* Floating Object 2: Excel Spreadsheet Fragment (Top Right, Displaced) */}
          <div className="absolute top-10 sm:top-6 right-2 sm:right-16 anim-float-delayed z-20 max-w-[230px] sm:max-w-[260px]">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-lg shadow-slate-100/80">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Quote_Final_v4_copy.xlsx</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span>5kW System Cost:</span>
                  <span className="font-semibold text-slate-900">₹2,80,000</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>GST Formula:</span>
                  <span>#REF! Error</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Last modified 14 days ago by unknown
              </span>
            </div>
          </div>

          {/* Floating Object 3: Loose Paper Survey Note (Bottom Left) */}
          <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-24 anim-float z-15 max-w-[220px] sm:max-w-[250px]">
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 shadow-md shadow-amber-100/40">
              <div className="flex items-center gap-2 mb-1.5">
                <ClipboardList className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">Rooftop Survey Memo</span>
              </div>
              <p className="text-xs text-slate-700 leading-snug">
                Tilt ~18°, Azimuth South-West. Cable run: <em className="text-slate-400">??? (forgot to measure)</em>
              </p>
              <div className="mt-2 text-[10px] text-amber-800 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>Photos stuck on surveyor phone</span>
              </div>
            </div>
          </div>

          {/* Floating Object 4: Forgotten Reminder (Bottom Right) */}
          <div className="absolute bottom-4 sm:bottom-10 right-4 sm:right-20 anim-float-tilt z-10 max-w-[220px] sm:max-w-[240px]">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-md shadow-slate-100/70">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-800">Follow-up Overdue</span>
              </div>
              <p className="text-xs text-slate-500">
                Dr. Kulkarni (10 kW Commercial) quote sent 12 days ago. No follow-up recorded.
              </p>
            </div>
          </div>

          {/* Subtle Central Axis Statement */}
          <div className="text-center z-30 bg-white/95 backdrop-blur-xs px-6 py-3.5 rounded-full border border-slate-200/80 shadow-sm max-w-xs">
            <span className="text-xs font-semibold text-slate-800">
              When software isn&apos;t connected, energy is wasted.
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
