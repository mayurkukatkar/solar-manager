"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  ClipboardList,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  ScanText,
  Building2,
  Boxes,
  Wrench,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import VendorCharacter, { VendorPose } from "./VendorCharacter";
import GuideCharacter from "./GuideCharacter";
import WhatsAppCta from "./WhatsAppCta";

interface ProductStoryFilmProps {
  onOpenDemo?: () => void;
}

export default function ProductStoryFilm({ onOpenDemo }: ProductStoryFilmProps) {
  const [activeScene, setActiveScene] = useState<number>(1);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);

  // Natural scroll-driven scene synchronization
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible) {
        const idx = sceneRefs.current.indexOf(visible.target as HTMLElement);
        if (idx !== -1) {
          setActiveScene(idx + 1);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: [0.2, 0.45, 0.7],
      rootMargin: "-10% 0px -10% 0px",
    });

    sceneRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const sceneTitles = [
    "Hook",
    "The Chaos",
    "Lead Management",
    "Quotation Builder",
    "Customer Follow-Up",
    "Project & Inventory",
    "Installation Tracking",
    "The Payoff"
  ];

  return (
    <div id="story" className="relative bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* Sticky Progress Header on Desktop */}
      <div className="sticky top-16 z-30 hidden md:block pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200/90 shadow-xs flex items-center gap-3">
            <span className="text-[11px] font-mono font-bold text-blue-600 tracking-wider">
              SCENE 0{activeScene} OF 08
            </span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(activeScene / 8) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {sceneTitles[activeScene - 1] || "Story"}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenDemo}
            className="pointer-events-auto text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Book Free Demo ↗
          </button>
        </div>
      </div>

      {/* =========================================================================
          SCENE 01 · HOOK
          "Are you a solar vendor?
           Scroll motion: The vendor looks confident. Suddenly, WhatsApp notifications,
           electricity bills, quotation papers and ringing phone icons start appearing around him.
           Very little text. Let the visual establish who the website is speaking to."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[0] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle overflow-hidden"
      >
        <div className="absolute inset-0 bg-radial from-transparent via-white/50 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-6">
          
          {/* Brand Tag with Official Logo */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200 text-[11px] font-extrabold text-slate-800 tracking-wider uppercase shadow-2xs">
            <img
              src="/images/whereready_logo.png"
              alt="WhereReady Logo"
              className="w-4 h-4 rounded-full object-cover"
            />
            <span>WhereReady Solar OS</span>
          </div>

          {/* Exact Scene 1 Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] font-['Plus_Jakarta_Sans',sans-serif]">
            Are you a solar vendor?
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 font-medium max-w-xl mx-auto">
            Solar business chalana itna complicated kyun hai?
          </p>

          {/* Visual: Confident Vendor surrounded by incoming operational buzz */}
          <div className="relative max-w-lg mx-auto mt-8 py-8 flex items-center justify-center min-h-[280px]">
            
            {/* Vendor Character (Hook Pose: Confident) */}
            <div className="relative z-20">
              <VendorCharacter
                pose="hook"
                size={140}
                speechText="Ready to grow my solar company!"
              />
            </div>

            {/* Emerging Floating Notifications Around Him */}
            <div className="absolute -top-2 -left-4 sm:left-4 z-10 animate-[floatGentle_4s_ease-in-out_infinite] bg-white border border-emerald-200 rounded-2xl p-2.5 shadow-md flex items-center gap-2 text-left max-w-[200px]">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-[10px]">
                <strong className="text-slate-800 block">WhatsApp (12 Unread)</strong>
                <span className="text-slate-500">“Bhaiya quote bheja kya?”</span>
              </div>
            </div>

            <div className="absolute top-0 -right-4 sm:right-4 z-10 animate-[floatGentle_5s_ease-in-out_1s_infinite] bg-white border border-blue-200 rounded-2xl p-2.5 shadow-md flex items-center gap-2 text-left max-w-[190px]">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-[10px]">
                <strong className="text-slate-800 block">Customer Calling</strong>
                <span className="text-slate-500">Kulkarni (10kW Quote)</span>
              </div>
            </div>

            <div className="absolute -bottom-2 -left-2 sm:left-8 z-10 animate-[floatGentle_6s_ease-in-out_2s_infinite] bg-amber-50 border border-amber-200 rounded-2xl p-2.5 shadow-md flex items-center gap-2 text-left max-w-[190px]">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <ScanText className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div className="text-[10px]">
                <strong className="text-amber-900 block">MSEDCL Bill PDF</strong>
                <span className="text-amber-700">Sanctioned load needed</span>
              </div>
            </div>

            <div className="absolute -bottom-2 -right-2 sm:right-8 z-10 animate-[floatGentle_4.5s_ease-in-out_1.5s_infinite] bg-white border border-slate-200 rounded-2xl p-2.5 shadow-md flex items-center gap-2 text-left max-w-[190px]">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <div className="text-[10px]">
                <strong className="text-slate-800 block">Excel Quote v5.xlsx</strong>
                <span className="text-slate-500">Margin formula broken</span>
              </div>
            </div>

          </div>

          {/* Natural Scroll Cue */}
          <div className="pt-4 flex flex-col items-center justify-center text-xs text-slate-400 gap-1.5">
            <span>Scroll down to see what happens next</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-blue-600" />
          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 02 · THE CHAOS
          "Too many customers. Too many things to remember.
           Scroll motion: Every new enquiry adds another floating object.
           A customer asks for a quotation, another calls for an update,
           and a third waits for a follow-up. The vendor tries to manage everything at once.
           The objects multiply with scrolling until the screen feels crowded."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[1] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-amber-50/20 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-6">
          
          <span className="inline-block text-xs font-bold tracking-wider text-amber-600 uppercase">
            Scene 02 • The Operational Chaos
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Too many customers. Too many things to remember.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mx-auto">
            Calls, unread WhatsApp chats, field surveys and missing documents pile up faster than you can reply.
          </p>

          {/* Visual: Overwhelmed Vendor Juggling Multiple Incoming Crises */}
          <div className="relative max-w-2xl mx-auto mt-6 bg-amber-50/40 border border-amber-200/80 rounded-3xl p-6 sm:p-10 shadow-lg">
            
            {/* Vendor Character (Chaos Pose: Sweating & Panicked) */}
            <div className="flex justify-center mb-6">
              <VendorCharacter
                pose="chaos"
                size={140}
                speechText="MSEDCL Form A-1 kisne submit kiya?!"
              />
            </div>

            {/* Overcrowded Objects Grid (Clean, Responsive, Non-Colliding) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              
              <div className="bg-white p-3.5 rounded-2xl border border-red-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1 text-red-600 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Dr. Kulkarni (Baner)</span>
                </div>
                <p className="text-xs text-slate-600 bg-red-50/50 p-2 rounded-lg">
                  &ldquo;12 din ho gaye quote bhej kar. Koi follow-up nahi aaya.&rdquo;
                </p>
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">⚠ Lead turning cold</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1 text-amber-700 font-bold text-xs">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Technician on Roof</span>
                </div>
                <p className="text-xs text-slate-600 bg-amber-50/50 p-2 rounded-lg">
                  &ldquo;Cable run kitne meter ka tha? Diary ghar pe chhoot gayi.&rdquo;
                </p>
                <span className="text-[10px] text-amber-600 font-semibold mt-1 block">⚠ Site survey incomplete</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1 text-slate-700 font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>Excel Pricing Error</span>
                </div>
                <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-lg">
                  Subsidy: #REF! • Net Cost: ???
                </p>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">⚠ Wrong margin quoted to client</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1 text-blue-700 font-bold text-xs">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>DISCOM Net-Meter</span>
                </div>
                <p className="text-xs text-slate-600 bg-blue-50/50 p-2 rounded-lg">
                  &ldquo;Inspector site pe khada hai, Test Report kahan hai?&rdquo;
                </p>
                <span className="text-[10px] text-blue-600 font-semibold mt-1 block">⚠ 10 calls to office staff</span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 03 · LEAD MANAGEMENT
          "“Bhaiya, maine kal message kiya tha!”
           The problem: Enquiries are buried in WhatsApp chats, calls and notebooks. Follow-ups get missed.
           The transformation: The scattered enquiries flow into the Solar OS lead pipeline.
           Each lead becomes an organized record with its relevant details and status.
           On-screen copy: “Every lead. One place.”"
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[2] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-6">
          
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase">
            Scene 03 • Lead Management
          </span>

          <div className="text-amber-600 font-bold text-sm sm:text-base">
            &ldquo;Bhaiya, maine kal message kiya tha!&rdquo;
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Every lead. One place.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mx-auto">
            Scattered WhatsApp messages and calls flow directly into structured lead dossiers. Nothing gets lost.
          </p>

          {/* Transformation Visual: Vendor relieved as enquiries slot into real CRM */}
          <div className="relative max-w-2xl mx-auto mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <VendorCharacter
                  pose="leads"
                  size={70}
                  className="shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Lead Pipeline Synchronized</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">0 missed follow-ups today</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Automated OCR Ingestion
              </span>
            </div>

            {/* Real Pipeline Records */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Rajesh Kulkarni • Baner, Pune</p>
                  <p className="text-[11px] text-slate-500">MSEDCL Bill Parsed: 6.0 kW Sanctioned • 540 kWh/mo</p>
                </div>
                <span className="px-2.5 py-1 bg-white text-blue-700 font-bold rounded-lg border border-blue-200 text-[10px]">
                  NEW LEAD → ASSIGNED
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Shree Cold Storage • Baramati</p>
                  <p className="text-[11px] text-slate-500">45 kW Commercial • Feasibility Survey Complete</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 text-[10px]">
                  PROPOSAL READY
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Anand Society • Kothrud</p>
                  <p className="text-[11px] text-slate-500">18 kW Common Area • DISCOM Form A-1 Approved</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[10px]">
                  SANCTIONED ✓
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 04 · QUOTATION BUILDER
          "Still making every quotation manually?
           The problem: Bills, system requirements, pricing and proposal formatting consume the vendor's time.
           The transformation: Customer and system details move into the quotation builder.
           A polished, branded proposal assembles itself on screen, using the actual software's capabilities.
           On-screen copy: “From calculation to professional proposal.”"
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[3] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-6">
          
          <span className="inline-block text-xs font-bold tracking-wider text-amber-600 uppercase">
            Scene 04 • Quotation Builder
          </span>

          <div className="text-slate-400 font-bold text-sm sm:text-base">
            Still making every quotation manually?
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            From calculation to professional proposal.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mx-auto">
            Bill details and tariff slabs automatically convert into a branded 60-second luxury proposal with central PM Surya Ghar subsidy deduction.
          </p>

          {/* Transformation Visual: Actual Assembled Proposal */}
          <div className="relative max-w-2xl mx-auto mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <VendorCharacter
                  pose="quote"
                  size={70}
                  className="shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">WhereReady Solar Proposal Engine</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Generated in 60 seconds</span>
                </div>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready to WhatsApp</span>
              </div>
            </div>

            {/* Legible Real Figures */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">System Size</span>
                <strong className="text-sm font-extrabold text-slate-900">5.4 kWp</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Gross Cost</span>
                <strong className="text-sm font-extrabold text-slate-900">₹2,80,000</strong>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block font-semibold">Central Subsidy</span>
                <strong className="text-sm font-extrabold text-emerald-700">-₹78,000</strong>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] text-blue-700 block font-semibold">Net Customer Cost</span>
                <strong className="text-sm font-extrabold text-blue-900">₹2,02,000</strong>
              </div>
            </div>

            {/* Bill of Materials Hardware */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>10x TopCon 550W Bifacial DCR Modules</span>
                <strong className="text-slate-900">25-Yr Performance</strong>
              </div>
              <div className="flex justify-between">
                <span>5kW Three-Phase Inverter + HDGI Structure</span>
                <strong className="text-slate-900">Payback: 2.9 Yrs</strong>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 05 · CUSTOMER FOLLOW-UP
          "“Quotation bhej diya. Ab customer kahan tak pahuncha?”
           The problem: The vendor cannot easily remember which customer needs a call,
           who is interested, or which opportunity needs attention.
           The transformation: The customer record and lead pipeline show the next step
           and current status, using the product's real follow-up functionality.
           On-screen copy: “Know what needs attention.”"
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[4] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-6">
          
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase">
            Scene 05 • Customer Follow-Up
          </span>

          <div className="text-amber-600 font-bold text-sm sm:text-base">
            &ldquo;Quotation bhej diya. Ab customer kahan tak pahuncha?&rdquo;
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Know what needs attention.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mx-auto">
            See exactly who opened your proposal link, who is ready for a site visit, and who needs a polite check-in today.
          </p>

          {/* Transformation Visual: Actionable Follow-up Activity Feed */}
          <div className="relative max-w-2xl mx-auto mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <VendorCharacter
                  pose="followup"
                  size={70}
                  className="shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Today&apos;s Follow-up Schedule</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Priority actions for sales team</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                2 Calls Scheduled
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Rajesh Kulkarni (5.4 kW)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Opened proposal link via WhatsApp (25 mins ago)</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenDemo}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-2xs hover:bg-emerald-700 cursor-pointer"
                >
                  Call Now ↗
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Dr. Patil (10 kW Rooftop)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Feasibility report sent • Follow-up due at 3:00 PM</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                  Reminder Set
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 06 · PROJECT AND INVENTORY MANAGEMENT
          "“Sale ho gaya. Ab execution ka tension.”
           The problem: Site visits, responsibilities, material availability and project progress need coordination.
           The transformation: The project workflow organizes milestones and assignments.
           Inventory records help the team check available materials where that functionality is implemented.
           On-screen copy: “From approval to execution.”"
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[5] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-6">
          
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase">
            Scene 06 • Project &amp; Inventory Management
          </span>

          <div className="text-amber-600 font-bold text-sm sm:text-base">
            &ldquo;Sale ho gaya. Ab execution ka tension.&rdquo;
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            From approval to execution.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mx-auto">
            1-click conversion from accepted proposal to DISCOM net-metering dossier and serialized warehouse material dispatch.
          </p>

          {/* Transformation Visual: Project Milestone Hub & Hardware Dispatch */}
          <div className="relative max-w-2xl mx-auto mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <VendorCharacter
                  pose="project"
                  size={70}
                  className="shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Project #PRJ-2026-092 • Execution</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Sharma Villa 5.4 kW Rooftop</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Stage 3: Inspection
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>DISCOM Form A-1</span>
                </div>
                <p className="text-[11px] text-slate-500">Submitted to MSEDCL Division Office</p>
                <span className="text-emerald-600 font-bold text-[10px] block mt-1">Status: Approved ✓</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Boxes className="w-3.5 h-3.5 text-amber-600" />
                  <span>Warehouse Inventory</span>
                </div>
                <p className="text-[11px] text-slate-500">10x TopCon 550W DCR Modules</p>
                <span className="text-blue-600 font-bold text-[10px] block mt-1">Status: Dispatched ✓</span>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 text-[11px] text-blue-800 flex items-center justify-between">
              <span>Electrical Contractor License &amp; Test Certificate</span>
              <strong className="text-emerald-700">Verified ✓</strong>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 07 · INSTALLATION MANAGEMENT
          "Every project shouldn't need ten phone calls.
           The problem: The owner keeps calling the field team to find out what's completed and what's still pending.
           The transformation: Installation stages, assigned work and progress updates come together in the project view,
           to the extent supported by the software.
           On-screen copy: “See the work move forward.”"
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[6] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-6">
          
          <span className="inline-block text-xs font-bold tracking-wider text-emerald-600 uppercase">
            Scene 07 • Installation Management
          </span>

          <div className="text-slate-400 font-bold text-sm sm:text-base">
            Every project shouldn&apos;t need ten phone calls.
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            See the work move forward.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mx-auto">
            Field technicians check off mounting, DC cabling, chemical earthing and meter inspection right from their mobile phones.
          </p>

          {/* Transformation Visual: Live Rooftop Installation & Tablet Checklist */}
          <div className="relative max-w-2xl mx-auto mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <VendorCharacter
                  pose="installation"
                  size={70}
                  className="shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Rooftop Commissioning Live Log</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Updates direct from site crew</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Online &amp; Active
              </span>
            </div>

            {/* Installation Photo & Verified Checks */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 mb-3 shadow-xs">
              <img
                src="/images/project_installation_sync.jpg"
                alt="Solar panels rooftop installation and bi-directional meter sync"
                className="w-full h-44 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                <div className="text-white text-xs font-bold flex items-center justify-between w-full">
                  <span>DCR Modules Verified • Meter Connected</span>
                  <span className="text-emerald-300 font-extrabold">Passed ✓</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Earthing Pit Test</span>
                <strong className="text-slate-900">1.8 Ohms (Passed)</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block">DISCOM Bi-Directional</span>
                <strong className="text-emerald-700">Net-Meter Active ⚡</strong>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 08 · THE PAYOFF
          "Your business needs your leadership. Not your constant chasing.
           Scroll motion: All the floating chaos settles into an organized workflow.
           The vendor sits back with a cup of chai. Leads, quotations, projects and installations remain visible on the screen.
           Final CTA: “Bring your solar business into sync.”
           Book a Free Demo · Chat on WhatsApp"
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[7] = el; }}
        className="min-h-[90vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-radial from-transparent via-white/50 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-8">
          
          {/* Headline (Exact user brief) */}
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase">
            Scene 08 • The Payoff
          </span>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12] font-['Plus_Jakarta_Sans',sans-serif]">
            Your business needs your leadership. <span className="text-blue-600 block sm:inline">Not your constant chasing.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mx-auto">
            From the first utility bill scan to customer proposal, DISCOM statutory filing and rooftop commissioning — all in sync.
          </p>

          {/* Master Finale Visual: Vendor Relaxed with a Cup of Chai + Synchronized Solar Home */}
          <div className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-blue-500/10 group">
            <img
              src="/images/final_solar_showcase.jpg"
              alt="Commissioned rooftop solar system in full sunshine"
              className="w-full h-72 sm:h-96 md:h-[440px] object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Vendor Character in Chai Pose (Relaxed with warm cutting chai) */}
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
              <VendorCharacter
                pose="chai"
                size={95}
                speechText="Ab business chal raha hai shanti se!"
              />
            </div>

            <div className="absolute top-6 right-6 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 text-slate-800 text-xs font-bold shadow-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All 4 Workflow Pillars in Sync</span>
            </div>
          </div>

          {/* Action Call-to-Action (Exact user brief: “Bring your solar business into sync.”) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Bring your solar business into sync.
            </h3>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={onOpenDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <span>Book a Free Demo</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <WhatsAppCta
                label="Chat on WhatsApp"
                variant="button"
                showCharacterWave={false}
              />
            </div>

            {/* Verified Business Details */}
            <div className="text-xs text-slate-500 pt-2 space-y-1">
              <p>Personalized 20-minute walkthrough • No commitments</p>
              <p className="text-[11px] text-slate-400">
                Nagpur: 1/2, Belekar Layout, Gurukrupa Nagar, Hudkeshwar Road - 440034 • Phone/WhatsApp: 9270201883 • Email: info@whereready.com
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
