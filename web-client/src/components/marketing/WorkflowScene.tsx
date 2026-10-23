"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ScanText,
  Compass,
  FileText,
  UserCheck,
  Building2,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  PhoneCall,
  ShieldCheck,
  QrCode
} from "lucide-react";
import GuideCharacter, { CharacterPose } from "./GuideCharacter";

interface WorkflowSceneProps {
  onOpenDemo?: () => void;
}

interface WorkflowStage {
  number: string;
  title: string;
  shortCopy: string;
  description: string;
  badge: string;
  characterPose: CharacterPose;
  characterSpeech: string;
  previewType:
    | "lead-capture"
    | "site-feasibility"
    | "quotation-assemble"
    | "customer-followup"
    | "project-milestones"
    | "installation-track"
    | "complete-journey";
}

const STAGES: WorkflowStage[] = [
  {
    number: "01",
    title: "Capture the lead",
    shortCopy: "Every opportunity starts somewhere.",
    description:
      "A customer enquiry from WhatsApp, web, or referral transforms into a structured lead dossier with consumer details and electricity tariff history in two seconds.",
    badge: "Instant Ingestion",
    characterPose: "wave",
    characterSpeech: "Enquiry logged and organized!",
    previewType: "lead-capture",
  },
  {
    number: "02",
    title: "Understand the site",
    shortCopy: "Get the details you need.",
    description:
      "Utility bill OCR automatically reads sanctioned load and tariff rates. Field surveyors record rooftop azimuth, tilt angle, structural condition, and cable distances.",
    badge: "OCR & Site Feasibility",
    characterPose: "inspect",
    characterSpeech: "Analyzing rooftop generation...",
    previewType: "site-feasibility",
  },
  {
    number: "03",
    title: "Create the quotation",
    shortCopy: "Turn details into a proposal.",
    description:
      "Transform technical site measurements and tariff slabs into a branded 60-second luxury proposal with central PM Surya Ghar subsidy deductions and 25-year ROI.",
    badge: "Flagship Proposal Engine",
    characterPose: "point-right",
    characterSpeech: "Proposal ready in 60 seconds!",
    previewType: "quotation-assemble",
  },
  {
    number: "04",
    title: "Follow the customer",
    shortCopy: "Keep the next step in sight.",
    description:
      "Track proposal views, log WhatsApp interactions, send reminder notices, and record customer sign-off without losing context or dropping leads.",
    badge: "Pipeline Tracking",
    characterPose: "guide",
    characterSpeech: "Customer viewing proposal!",
    previewType: "customer-followup",
  },
  {
    number: "05",
    title: "Manage the project",
    shortCopy: "From approval to action.",
    description:
      "1-click project creation generates the 5-stage DISCOM net-metering dossier: Form A-1, Technical Feasibility, Work Completion Report, and Inspection Scheduling.",
    badge: "DISCOM Statutory Engine",
    characterPose: "inspect",
    characterSpeech: "DISCOM Form A-1 validated.",
    previewType: "project-milestones",
  },
  {
    number: "06",
    title: "Track installation",
    shortCopy: "See work move forward.",
    description:
      "Track civil mounting, DC cabling, and chemical earthing. Scan DCR solar module barcodes and inverters on-site with mobile photo inspection checklists.",
    badge: "DCR Serial Tracking",
    characterPose: "celebrate",
    characterSpeech: "Site commissioned & verified!",
    previewType: "installation-track",
  },
  {
    number: "07",
    title: "Complete the journey",
    shortCopy: "Every stage, connected.",
    description:
      "All seven phases flow in one unified system. Bi-directional net-meter sync is finalized, DBT subsidy documents are exported, and customer handover is complete.",
    badge: "Full Circle Sync",
    characterPose: "celebrate",
    characterSpeech: "Your solar business, in sync!",
    previewType: "complete-journey",
  },
];

export default function WorkflowScene({ onOpenDemo }: WorkflowSceneProps) {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Natural scroll-driven observation: synchronizes active stage with the element in view
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      // Find the most visible stage element in the viewport
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry) {
        const index = stageRefs.current.indexOf(visibleEntry.target as HTMLDivElement);
        if (index !== -1) {
          setActiveStageIndex(index);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-20% 0px -25% 0px",
      threshold: [0.2, 0.4, 0.6, 0.8],
    });

    stageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const activeStage = STAGES[activeStageIndex] || STAGES[0];

  return (
    <section
      id="workflow"
      className="py-24 sm:py-32 bg-grid-subtle text-slate-900 border-t border-slate-100 relative overflow-hidden"
    >
      {/* Soft gradient masks to fade the grid toward center */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/95 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (Requirement 3: Section label "SEE THE SOLUTION") */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/90 text-xs font-bold text-blue-700 uppercase tracking-wider shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>SEE THE SOLUTION</span>
          </div>

          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] font-['Plus_Jakarta_Sans',sans-serif]">
            One connected workflow. From enquiry to installation.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            Scroll to follow a single customer enquiry through seven synchronized stages. No manual clicks required.
          </p>

          {/* Synchronized Stage Indicator Top Bar */}
          <div className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/95 border border-slate-200/90 shadow-sm">
            <span className="text-xs font-mono font-bold text-blue-700 tracking-wider uppercase">
              STAGE {activeStage.number} OF 07
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-800">
              {activeStage.title}
            </span>
            {/* Continuous SVG mini-progress line */}
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((activeStageIndex + 1) / STAGES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Master Scroll-Driven Layout: Sticky Left Visual & Character + Natural Right Scrolling Stages */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
          
          {/* Left Column: Sticky Interactive Stage Visual Canvas (Desktop) */}
          <div className="hidden lg:block lg:col-span-6 sticky top-28 self-start">
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              
              {/* Top Bar with Dynamic Stage Counter & Badge */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="font-mono text-xs font-extrabold text-blue-700 tracking-wider uppercase">
                    STAGE {activeStage.number} OF 07
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                  {activeStage.badge}
                </span>
              </div>

              {/* Dynamic 2D Transformation Visual (Morphed by active scroll stage) */}
              <div className="relative min-h-[340px] flex items-center justify-center p-2">
                
                {/* STAGE 01: Capture the lead */}
                {activeStageIndex === 0 && (
                  <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 p-4 rounded-2xl border border-blue-100/80">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                        <span>New Lead Created</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
                          Automated OCR
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <p><strong className="text-slate-900">Name:</strong> Rajesh Kulkarni</p>
                        <p><strong className="text-slate-900">Location:</strong> Baner, Pune (MSEDCL)</p>
                        <p><strong className="text-slate-900">Sanctioned Load:</strong> 6.0 kW Single Phase</p>
                        <p><strong className="text-slate-900">Avg Monthly Bill:</strong> ₹6,200 (540 Units)</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                      <ScanText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Electricity bill scanned &amp; assigned to surveyor</span>
                    </div>
                  </div>
                )}

                {/* STAGE 02: Understand the site */}
                {activeStageIndex === 1 && (
                  <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-amber-500" />
                          Site Feasibility Dossier
                        </span>
                        <span className="text-[10px] text-slate-500">Surveyor: Amit P.</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Rooftop Area</span>
                          <strong className="text-slate-900">650 sq.ft RCC</strong>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">True Azimuth</span>
                          <strong className="text-slate-900">182° South</strong>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Optimal Tilt</span>
                          <strong className="text-slate-900">18° Fixed South</strong>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Cable Run</span>
                          <strong className="text-slate-900">22 meters DC</strong>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Zero shadow loss confirmed between 9 AM – 4 PM</span>
                    </div>
                  </div>
                )}

                {/* STAGE 03: Create the quotation */}
                {activeStageIndex === 2 && (
                  <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-50">
                      <img
                        src="/images/lead_to_proposal.jpg"
                        alt="Utility bill data transforming into a solar quotation proposal"
                        className="w-full h-44 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                        <div className="text-white text-xs font-bold flex items-center justify-between w-full">
                          <span>PM Surya Ghar Proposal Assembled</span>
                          <span className="text-emerald-300 font-extrabold">Net: ₹2,02,000</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
                      <span className="font-semibold">Turn details into a proposal</span>
                      <span className="text-slate-500 font-mono text-[11px]">Subsidy: ₹78,000</span>
                    </div>
                  </div>
                )}

                {/* STAGE 04: Follow the customer */}
                {activeStageIndex === 3 && (
                  <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-3">
                        <span>Proposal Delivery &amp; Interactions</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                          Real-Time Log
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Customer opened proposal link via WhatsApp (2 mins ago)</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                          <PhoneCall className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Follow-up scheduled with sales engineer for tomorrow 11 AM</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>One-click digital acceptance &amp; project approval</span>
                    </div>
                  </div>
                )}

                {/* STAGE 05: Manage the project */}
                {activeStageIndex === 4 && (
                  <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          DISCOM Net-Metering Engine
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Form A-1</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between p-1.5 bg-white rounded border border-slate-100">
                          <span>1. Application Submission (Form A-1)</span>
                          <span className="text-emerald-600 font-bold">Approved ✓</span>
                        </div>
                        <div className="flex justify-between p-1.5 bg-white rounded border border-slate-100">
                          <span>2. Technical Feasibility (TFR)</span>
                          <span className="text-emerald-600 font-bold">Cleared ✓</span>
                        </div>
                        <div className="flex justify-between p-1.5 bg-white rounded border border-slate-100">
                          <span>3. Contractor License Verification</span>
                          <span className="text-blue-600 font-bold">In Review</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Compliant with MSEDCL / Tata / BESCOM statutory forms</span>
                    </div>
                  </div>
                )}

                {/* STAGE 06: Track installation */}
                {activeStageIndex === 5 && (
                  <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-50">
                      <img
                        src="/images/project_installation_sync.jpg"
                        alt="Solar panels installation and DISCOM bi-directional net-meter sync"
                        className="w-full h-44 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                        <div className="text-white text-xs font-bold flex items-center justify-between w-full">
                          <span>DCR Modules Verified &amp; Meter Commissioned</span>
                          <span className="text-emerald-300 font-extrabold">Passed ✓</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                      <span className="font-semibold">See work move forward</span>
                      <span className="text-slate-500 font-mono text-[11px]">Serial Barcodes Logged</span>
                    </div>
                  </div>
                )}

                {/* STAGE 07: Complete the journey */}
                {activeStageIndex === 6 && (
                  <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-5 rounded-2xl text-white shadow-md text-center">
                      <Sparkles className="w-6 h-6 text-amber-300 mx-auto mb-2" />
                      <h4 className="text-base font-extrabold text-white">Full Workflow Synchronized</h4>
                      <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto">
                        Lead → Survey → Proposal → DISCOM Sync → Execution → DBT Subsidy Handover
                      </p>
                      <div className="mt-4 pt-3 border-t border-emerald-500/60 flex justify-around text-xs">
                        <div>
                          <span className="text-emerald-200 text-[10px] block">Turnaround Time</span>
                          <strong className="text-white text-sm">18 Days</strong>
                        </div>
                        <div>
                          <span className="text-emerald-200 text-[10px] block">Subsidy DBT Status</span>
                          <strong className="text-emerald-300 text-sm">Disbursed ✓</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenDemo}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <span>Book a Free Live Demo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>

              {/* Animated Product Guide Character Reaction (Positioned in Bottom Right Corner of Card) */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <GuideCharacter
                    pose={activeStage.characterPose}
                    size={46}
                    className="shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Solar OS Guide
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {activeStage.characterSpeech}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-slate-400">
                  Scroll for next stage ↓
                </span>
              </div>

            </div>
          </div>

          {/* Right Column: 7 Scroll-Driven Stages (Natural Scrolling Flow) */}
          <div className="lg:col-span-6 space-y-16 sm:space-y-24">
            {STAGES.map((stage, idx) => {
              const isSelected = activeStageIndex === idx;

              return (
                <div
                  key={stage.number}
                  ref={(el) => {
                    stageRefs.current[idx] = el;
                  }}
                  className={`scroll-mt-32 transition-all duration-300 ${
                    isSelected ? "opacity-100" : "opacity-60 lg:opacity-40"
                  }`}
                >
                  <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
                    
                    {/* Stage Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-extrabold text-blue-600 tracking-wider">
                        STAGE {stage.number} OF 07
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full">
                        {stage.badge}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {stage.title}
                    </h3>

                    {/* Exact Short Copy (Requirement 3) */}
                    <p className="mt-1 text-sm font-bold text-blue-600">
                      &ldquo;{stage.shortCopy}&rdquo;
                    </p>

                    <p className="mt-3 text-sm text-slate-600 leading-relaxed font-normal">
                      {stage.description}
                    </p>

                    {/* Mobile-Only Inline Character & Visual Snippet */}
                    <div className="lg:hidden mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                      <GuideCharacter
                        pose={stage.characterPose}
                        size={48}
                        className="shrink-0"
                      />
                      <div className="text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-1">
                        <span className="font-bold text-blue-600 block">{stage.characterSpeech}</span>
                        <span className="text-[11px] text-slate-500">Synchronized in Solar OS</span>
                      </div>
                    </div>

                    {/* Stage 07 Final Demo Call-to-Action */}
                    {idx === 6 && (
                      <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                        <button
                          type="button"
                          onClick={onOpenDemo}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <span>Book a Free Live Demo</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-slate-400">
                          Takes 20 mins • Customized to your DISCOM
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
