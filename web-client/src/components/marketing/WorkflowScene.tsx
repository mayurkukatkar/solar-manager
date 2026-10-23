"use client";

import React, { useState } from "react";
import {
  ScanText,
  Compass,
  FileText,
  UserCheck,
  Building2,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function WorkflowScene() {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages = [
    {
      id: "01",
      name: "Lead",
      title: "Lead & OCR Bill Ingestion",
      badge: "LIVE IN SOLAR OS",
      isLive: true,
      icon: ScanText,
      tagline: "Instant Consumer & Tariff Detection",
      summary: "Upload the customer's electricity bill (MSEDCL, Tata Power, BESCOM). Built-in OCR auto-extracts consumer numbers, sanctioned loads, and tariffs in two seconds.",
    },
    {
      id: "02",
      name: "Survey",
      title: "Rooftop Site Feasibility",
      badge: "LIVE IN SOLAR OS",
      isLive: true,
      icon: Compass,
      tagline: "Standardized Field Checklists",
      summary: "Field technicians record rooftop azimuth, tilt angle, structural conditions, cable distances, and photos with mobile-optimized survey forms.",
    },
    {
      id: "03",
      name: "Quotation",
      title: "60-Second Luxury Proposal",
      badge: "FLAGSHIP FEATURE",
      isLive: true,
      icon: FileText,
      tagline: "Magazine-Grade Proposals",
      summary: "Generate editorial-quality proposals with accurate PM Surya Ghar central subsidy deductions, equipment BOM, and 25-year payback projections.",
    },
    {
      id: "04",
      name: "Customer",
      title: "Agreement & Conversion",
      badge: "LIVE IN SOLAR OS",
      isLive: true,
      icon: UserCheck,
      tagline: "1-Click Project Conversion",
      summary: "Customer approves? Convert the quotation into an active project dossier instantly without retyping names, tariffs, or system sizes.",
    },
    {
      id: "05",
      name: "Project",
      title: "DISCOM Net-Metering",
      badge: "STATUTORY HUB",
      isLive: true,
      icon: Building2,
      tagline: "State DISCOM Form A-1 & Annexure-2",
      summary: "Track the 5-stage statutory validation engine from Technical Feasibility to Grid Synchronization with mandatory contractor license checks.",
    },
    {
      id: "06",
      name: "Installation",
      title: "Site Execution & Serial Tracking",
      badge: "SERIAL NUMBER VERIFIED",
      isLive: true,
      icon: Wrench,
      tagline: "DCR Module & Inverter Barcodes",
      summary: "Track civil mounting, DC cabling, and chemical earthing with photo checklists. Log every DCR PV module serial number to prevent subsidy rejection.",
    },
    {
      id: "07",
      name: "Handover",
      title: "Grid Sync & PM Surya Ghar Subsidy",
      badge: "NATIONAL PORTAL READY",
      isLive: true,
      icon: CheckCircle2,
      tagline: "Bi-directional Meter Sync & DBT",
      summary: "Export batch module serials formatted for the National Portal (`pmsuryaghar.gov.in`), validate beneficiary bank IFSCs, and issue customer handover certificates.",
    },
  ];

  const current = stages[activeStage];

  return (
    <section id="workflow" className="py-24 sm:py-32 bg-white text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
            End-to-End Solar Business Lifecycle
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-['Plus_Jakarta_Sans',sans-serif]">
            Bring your entire workflow together.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            Seven essential steps. One continuous, unified platform. Every team member sees what comes next.
          </p>
        </div>

        {/* Desktop Horizontal Journey with Continuous Animated Line */}
        <div className="hidden lg:block mb-12">
          <div className="relative flex items-center justify-between max-w-5xl mx-auto px-6">
            
            {/* Animated Continuous Background Connecting Line */}
            <div className="absolute top-1/2 left-10 right-10 -translate-y-1/2 h-0.5 bg-slate-200 z-0">
              <div 
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${(activeStage / (stages.length - 1)) * 100}%` }}
              />
            </div>

            {/* Stage Nodes */}
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isSelected = activeStage === idx;
              const isPast = idx < activeStage;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className="relative z-10 flex flex-col items-center group focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-md scale-110"
                        : isPast
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "bg-white text-slate-400 border border-slate-200 group-hover:border-slate-300 group-hover:text-slate-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`mt-2.5 text-xs font-semibold tracking-tight transition-colors ${
                      isSelected ? "text-blue-600 font-bold" : "text-slate-500 group-hover:text-slate-800"
                    }`}
                  >
                    {stage.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Vertical Journey List (Reflowed cleanly, never crammed) */}
        <div className="lg:hidden mb-8 flex overflow-x-auto pb-4 gap-2 no-scrollbar">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = activeStage === idx;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStage(idx)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-2 border transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{stage.id}. {stage.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Stage Detailed Spotlight Canvas */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Stage Left: Context & Explanation */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                  Stage {current.id} of 07
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {current.badge}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {current.title}
              </h3>

              <p className="text-sm font-medium text-blue-600">
                {current.tagline}
              </p>

              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                {current.summary}
              </p>
            </div>

            {/* Stage Right: Interactive Quick Step Action */}
            <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 text-center flex flex-col justify-between shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <current.icon className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-800 mb-4">
                Step {activeStage + 1} of 7 in Solar OS
              </p>
              <button
                type="button"
                onClick={() => setActiveStage((prev) => (prev + 1) % stages.length)}
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                <span>Next: {stages[(activeStage + 1) % stages.length].name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
