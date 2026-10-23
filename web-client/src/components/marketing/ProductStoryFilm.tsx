"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  ScanText,
  FileText,
  Building2,
  Wrench,
  Sun,
  ShieldCheck,
  Phone,
  MessageSquare,
  ChevronDown,
  Laptop,
  Layers,
  Smartphone
} from "lucide-react";
import GuideCharacter from "./GuideCharacter";
import WhatsAppCta from "./WhatsAppCta";

interface ProductStoryFilmProps {
  onOpenDemo?: () => void;
}

export default function ProductStoryFilm({ onOpenDemo }: ProductStoryFilmProps) {
  const [activeScene, setActiveScene] = useState<number>(1);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Natural scroll-driven scene observer
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible) {
        const idx = sceneRefs.current.indexOf(visible.target as HTMLDivElement);
        if (idx !== -1) {
          setActiveScene(idx + 1);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: [0.25, 0.5, 0.75],
      rootMargin: "-10% 0px -10% 0px",
    });

    sceneRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div id="story" className="relative bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* Discreet Sticky Progress Header (Desktop only) */}
      <div className="sticky top-16 z-30 hidden md:block pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200/90 shadow-xs flex items-center gap-3">
            <span className="text-[11px] font-mono font-bold text-blue-600 tracking-wider">
              SCENE 0{activeScene} OF 07
            </span>
            <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(activeScene / 7) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {activeScene === 1 && "Software for Solar Vendors"}
              {activeScene === 2 && "Solar Vendor CRM & Leads"}
              {activeScene === 3 && "60-Second Quotation Engine"}
              {activeScene === 4 && "DISCOM Statutory Tracking"}
              {activeScene === 5 && "Mobile App for Field Crews"}
              {activeScene === 6 && "Unified Solar ERP"}
              {activeScene === 7 && "Book a Software Demo"}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenDemo}
            className="pointer-events-auto text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
          >
            Book Software Demo ↗
          </button>
        </div>
      </div>

      {/* =========================================================================
          SCENE 1: THE SOFTWARE PROVIDER FOR SOLAR VENDORS
          Crystal-clear distinction: We provide business software to solar vendors & EPCs.
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[0] = el; }}
        className="min-h-[90vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle overflow-hidden"
      >
        <div className="absolute inset-0 bg-radial from-transparent via-white/50 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-6">
          
          {/* Explicit B2B Software Provider Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/90 text-xs font-extrabold text-blue-800 tracking-wide uppercase shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>B2B SOFTWARE FOR SOLAR VENDORS &amp; EPC INSTALLERS</span>
          </div>

          {/* Main Headline: Unmistakably Identifies What We Provide */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] font-['Plus_Jakarta_Sans',sans-serif]">
            The business software platform for{" "}
            <span className="text-blue-600 block sm:inline">solar vendors.</span>
          </h1>

          {/* Explicit Subheading: Eliminates ANY confusion about what we provide */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            WhereReady Solar OS is specialized management software that powers solar contractors. Coordinate customer enquiries, 60-second proposals, and DISCOM net-metering in one calm platform.
          </p>

          {/* High-Impact Clarification Banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <span className="font-bold text-amber-800">Notice:</span>
            <span>We build software for solar vendors — we do not sell solar panels or install rooftops directly to consumers.</span>
          </div>

          {/* Master Visual: Solar OS Software Interface Frame on top of the Solar Home */}
          <div className="relative mt-6 max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-blue-500/10 group">
            
            {/* Background Illustration of Solar Home */}
            <img
              src="/images/hero_solar_home.jpg"
              alt="WhereReady Solar OS software managing rooftop installations for solar vendors"
              className="w-full h-80 sm:h-96 md:h-[480px] object-cover object-center transform transition-transform duration-700 group-hover:scale-105 opacity-90"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Guide Character Sol welcoming the solar vendor */}
            <div className="absolute top-5 right-5 z-20 hidden sm:block">
              <GuideCharacter
                pose="wave"
                size={70}
                speechText="Welcome Solar Contractors!"
              />
            </div>

            {/* Overlaid Solar OS Software Command Center (Shows this is a SOFTWARE PRODUCT) */}
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    OS
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      Solar Vendor Dashboard • Apex Solar EPC (Tenant)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Managing 14 Active Customer Sites Across Maharashtra
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                  Software Active • Live Sync
                </span>
              </div>

              {/* Connected Modules in Software */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Module 1</span>
                  <span className="font-bold text-slate-800">Lead CRM &amp; OCR</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Module 2</span>
                  <span className="font-bold text-slate-800">60s Quotation Studio</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Module 3</span>
                  <span className="font-bold text-slate-800">DISCOM Form A-1</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Module 4</span>
                  <span className="font-bold text-slate-800">Field Mobile App</span>
                </div>
              </div>
            </div>

          </div>

          {/* Gentle Scroll Hint */}
          <div className="pt-4 flex flex-col items-center justify-center text-xs font-medium text-slate-400 gap-1.5">
            <span>Scroll to see how your solar team uses Solar OS</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-blue-600" />
          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 2: CUSTOMER ENQUIRY INGESTION IN SOFTWARE
          "Your sales team captures enquiries without spreadsheets."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[1] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Explicit Software Module Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Software Module 01 • Solar Vendor CRM
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Your sales reps capture homeowner leads automatically.
          </h2>

          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto font-normal">
            When a homeowner messages your solar company, Solar OS reads the utility bill with OCR and creates an organized lead dossier in your vendor CRM.
          </p>

          {/* Visual Showcase: Floating Enquiry Caught & Transformed into Clean Lead CRM */}
          <div className="relative max-w-3xl mx-auto bg-slate-50/80 border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-lg">
            
            {/* Guide Character Actively Catching the Enquiry */}
            <div className="flex justify-center mb-6">
              <GuideCharacter
                pose="point-right"
                size={76}
                speechText="Homeowner enquiry logged in your vendor CRM!"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center text-left">
              
              {/* Homeowner messaging the solar vendor */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Homeowner Inquiry to Your Business</span>
                    <span className="text-[10px] text-slate-400">Via WhatsApp / Website Form</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                  &ldquo;Hi, my monthly bill is ₹6,800. Can your solar company provide a quotation for rooftop solar at Baner, Pune?&rdquo;
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block mt-3">
                  Rajesh Kulkarni • Baner
                </span>
              </div>

              {/* Solar Vendor's Software Ingestion */}
              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-md">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <ScanText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Solar OS Vendor Lead Dossier</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Bill OCR Extracted
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between p-1.5 bg-slate-50 rounded">
                    <span>Sanctioned Load:</span>
                    <strong className="text-slate-900">6.0 kW Single Phase</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-50 rounded">
                    <span>Utility DISCOM:</span>
                    <strong className="text-slate-900">MSEDCL (LT-1 Residential)</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-50 rounded">
                    <span>Monthly Units:</span>
                    <strong className="text-slate-900">540 kWh / month</strong>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Assigned to Your Sales Engineer</span>
                </div>
              </div>

            </div>

            <div className="mt-6 text-center text-xs font-medium text-slate-400">
              No manual data entry • Your sales team moves 3x faster
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 3: THE PROPOSAL BUILDER FOR SOLAR VENDORS
          "Your team creates branded solar quotations in 60 seconds."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[2] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Explicit Software Module Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-amber-600 uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Software Module 02 • 60-Second Proposal Studio
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Your solar company generates luxury proposals in 60 seconds.
          </h2>

          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto font-normal">
            Generate branded client proposals under your solar company&apos;s name with accurate PM Surya Ghar subsidies, your profit margins, and 25-year financial ROI.
          </p>

          {/* Visual Showcase: Real Proposal Generated by the Solar Vendor */}
          <div className="relative max-w-3xl mx-auto">
            
            {/* Guide Character Inspecting Calculation */}
            <div className="flex justify-center mb-6">
              <GuideCharacter
                pose="inspect"
                size={76}
                speechText="Central PM Surya Ghar subsidy deducted: ₹78,000!"
              />
            </div>

            {/* Actual Legible Proposal Canvas */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-left relative overflow-hidden">
              
              {/* Proposal Document Header with Vendor Branding */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    PROPOSAL BY APEX SOLAR EPC (SOLAR VENDOR)
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    5.4 kW High-Efficiency Rooftop Proposal
                  </h3>
                  <p className="text-xs text-slate-500">Prepared for Client: Rajesh Kulkarni • Baner, Pune</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Customer Approved ✓
                  </span>
                </div>
              </div>

              {/* Exact Technical & Financial Figures */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Gross Project Cost</span>
                  <strong className="text-base font-extrabold text-slate-900">₹2,80,000</strong>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 block font-semibold">Central Subsidy</span>
                  <strong className="text-base font-extrabold text-emerald-700">-₹78,000</strong>
                </div>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-700 block font-semibold">Net Customer Cost</span>
                  <strong className="text-base font-extrabold text-blue-900">₹2,02,000</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Est. Payback</span>
                  <strong className="text-base font-extrabold text-slate-900">2.9 Years</strong>
                </div>
              </div>

              {/* Bill of Materials Hardware Configured by the Vendor */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Configured Hardware Specifications
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>10x TopCon 550W Bifacial PV Modules (DCR Compliant)</span>
                  <span className="text-slate-900 font-semibold">5.50 kWp</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>1x 5kW Three-Phase On-Grid Inverter (WiFi Monitored)</span>
                  <span className="text-slate-900 font-semibold">98.4% Efficiency</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>HDGI Elevated Structure + Chemical Earthing Kit</span>
                  <span className="text-slate-900 font-semibold">Configured Margin: 18%</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 4: DISCOM STATUTORY WORKFLOW ENGINE FOR VENDORS
          "Your project engineers track state DISCOM net-metering paperwork."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[3] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Explicit Software Module Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Software Module 03 • Statutory DISCOM Net-Metering Hub
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Your project engineers track DISCOM net-metering in software.
          </h2>

          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto font-normal">
            No lost papers or delays. Solar OS manages MSEDCL Form A-1 submissions, technical feasibility reports, and serial dispatch in one centralized software pipeline.
          </p>

          {/* Visual Showcase: Project Timeline Connected by Animated Blue Line */}
          <div className="relative max-w-3xl mx-auto bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl text-left">
            
            {/* Guide Character in Guiding Pose */}
            <div className="flex justify-center mb-6">
              <GuideCharacter
                pose="guide"
                size={76}
                speechText="MSEDCL Form A-1 statutory approval recorded in software!"
              />
            </div>

            {/* Timeline Stepper Connected with Animated Blue SVG Line */}
            <div className="relative space-y-6 pl-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-blue-600 before:via-blue-500 before:to-emerald-500">
              
              {/* Milestone 1 */}
              <div className="relative">
                <span className="absolute -left-8 top-1 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-xs flex items-center justify-center text-white text-[10px] font-bold">
                  ✓
                </span>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <strong className="text-slate-900">DISCOM Form A-1 Net-Meter Application</strong>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Approved in Software
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Technical Feasibility cleared by MSEDCL Subdivision Officer
                  </p>
                </div>
              </div>

              {/* Milestone 2 */}
              <div className="relative">
                <span className="absolute -left-8 top-1 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-xs flex items-center justify-center text-white text-[10px] font-bold">
                  ✓
                </span>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <strong className="text-slate-900">Serialized Material Dispatch</strong>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Warehouse Scanned
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    10x DCR Module Barcodes (TC55-2026-9041 to 9052) logged in inventory ledger
                  </p>
                </div>
              </div>

              {/* Milestone 3 */}
              <div className="relative">
                <span className="absolute -left-8 top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-xs flex items-center justify-center text-white text-[10px] font-bold animate-pulse">
                  ⚡
                </span>
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                  <div className="flex justify-between items-center text-xs">
                    <strong className="text-emerald-900">Site Inspection &amp; WCR Submission</strong>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Verified by Engineer
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Test certificate attached • Ready for utility net-meter installation
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 5: MOBILE APP FOR SOLAR CREWS & SERIAL VERIFICATION
          "Your site technicians log module barcodes and commissioning on mobile."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[4] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Explicit Software Module Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Software Module 04 • Mobile Field App for Crews
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Your rooftop crew verifies barcodes &amp; uploads reports on mobile.
          </h2>

          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto font-normal">
            Technicians scan DCR solar module serials and upload structural inspection photos straight from the roof into the Solar OS mobile app.
          </p>

          {/* Master Visual: Completed Rooftop Installation Scene */}
          <div className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-blue-500/10 group">
            <img
              src="/images/project_installation_sync.jpg"
              alt="WhereReady Solar OS field app verifying on-site solar installation"
              className="w-full h-72 sm:h-96 md:h-[460px] object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Guide Character Celebrating */}
            <div className="absolute top-6 right-6 z-20">
              <GuideCharacter
                pose="celebrate"
                size={78}
                speechText="Site commissioned in your software!"
              />
            </div>

            {/* Floating Handover Status Badge */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-left">
                <span className="text-xs font-extrabold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Solar OS Mobile Sync: Commissioning Passed ✓
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5">
                  Work Completion Report (WCR) Generated • National Portal DBT Export Ready
                </span>
              </div>

              <div className="bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md self-end sm:self-auto">
                Handover Certified ✓
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 6: EVERYTHING CONNECTS IN ONE SOLAR SOFTWARE
          "Replace 5 disconnected tools with one software built for solar vendors."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[5] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Explicit Software System Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Unified Solar ERP • Software Architecture
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Replace 5 disconnected tools with one software built for solar vendors.
          </h2>

          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto font-normal">
            No more lost WhatsApp chats, broken Excel formulas, or missing paperwork. Run your entire solar business in one software.
          </p>

          {/* Master Pull-Back Panorama: 4 Software Modules Connected */}
          <div className="relative max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl">
            
            {/* Guide Character in Center */}
            <div className="flex justify-center mb-8">
              <GuideCharacter
                pose="guide"
                size={80}
                speechText="4 core software modules working in sync."
              />
            </div>

            {/* 4 Software Modules for the Solar Vendor */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative text-left">
              
              {/* Connecting Horizontal Line (Desktop) */}
              <div className="hidden md:block absolute top-10 left-12 right-12 h-0.5 bg-blue-200 -z-10" />

              {/* Module 1: Vendor CRM */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-colors shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 font-bold text-xs shadow-xs">
                  01
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Solar CRM</h4>
                <p className="text-[11px] text-slate-500 mt-1">WhatsApp &amp; Utility Bill OCR</p>
              </div>

              {/* Module 2: Proposal Studio */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-colors shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 font-bold text-xs shadow-xs">
                  02
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Proposal Studio</h4>
                <p className="text-[11px] text-slate-500 mt-1">60s PM Surya Ghar Builder</p>
              </div>

              {/* Module 3: DISCOM Engine */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-colors shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 font-bold text-xs shadow-xs">
                  03
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">DISCOM Engine</h4>
                <p className="text-[11px] text-slate-500 mt-1">Form A-1 &amp; WCR Dossiers</p>
              </div>

              {/* Module 4: Mobile Crew App */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-colors shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 font-bold text-xs shadow-xs">
                  04
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Crew Mobile App</h4>
                <p className="text-[11px] text-slate-500 mt-1">DCR Serial Barcode Scanner</p>
              </div>

            </div>

            {/* Clear Software Architecture Label */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs font-bold text-blue-700">
              One Software License • Unlimited Team Users &bull; Multi-Tenant Isolated
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 7: CALL TO ACTION FOR SOLAR VENDORS
          "Book a demo of the software."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[6] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-radial from-transparent via-white/50 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-8">
          
          {/* Master Visual: Completed Sunlit Home with Software Success */}
          <div className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-blue-500/10 group">
            <img
              src="/images/final_solar_showcase.jpg"
              alt="WhereReady Solar OS powering successful solar vendors across India"
              className="w-full h-72 sm:h-96 md:h-[440px] object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Character returns beside home */}
            <div className="absolute top-6 left-6 z-20">
              <GuideCharacter
                pose="celebrate"
                size={80}
                speechText="Take your solar company to the next level!"
              />
            </div>

            <div className="absolute bottom-6 left-6 right-6 z-20 text-white text-left">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                B2B SOFTWARE FOR SOLAR CONTRACTORS &amp; EPCS
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-white">
                Run your solar company on WhereReady Solar OS.
              </p>
            </div>
          </div>

          {/* Prominent Invitation CTA for Solar Vendors */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={onOpenDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <span>Book a Free Software Demo</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <WhatsAppCta
                label="Chat with Software Specialist"
                variant="button"
                showCharacterWave={false}
              />
            </div>

            {/* Explicit Notice Eliminating Any Confusion */}
            <div className="max-w-xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 text-center leading-relaxed">
              <strong className="text-slate-800 block mb-0.5">Software Provider Notice:</strong>
              WhereReady develops and licenses business management software for solar contractors, EPCs, and installation vendors across India. We do not manufacture solar panels or offer direct installation services.
            </div>

            {/* Verified Business Details */}
            <div className="text-xs text-slate-400 pt-1">
              Nagpur: 1/2, Belekar Layout, Gurukrupa Nagar, Hudkeshwar Road - 440034 • Phone/WhatsApp: 9270201883 • Email: info@whereready.com
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
