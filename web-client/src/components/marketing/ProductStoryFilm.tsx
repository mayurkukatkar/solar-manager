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
  ChevronDown
} from "lucide-react";
import GuideCharacter, { CharacterPose } from "./GuideCharacter";
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
              {activeScene === 1 && "The World of Solar"}
              {activeScene === 2 && "A Customer Appears"}
              {activeScene === 3 && "The Quotation Forms"}
              {activeScene === 4 && "The Project Moves Forward"}
              {activeScene === 5 && "Installation Complete"}
              {activeScene === 6 && "Everything Connects"}
              {activeScene === 7 && "See It In Action"}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenDemo}
            className="pointer-events-auto text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
          >
            Book Free Demo ↗
          </button>
        </div>
      </div>

      {/* =========================================================================
          SCENE 1: THE WORLD OF SOLAR
          "Full-width white canvas with a subtle square grid.
           An original small blue animated character stands beside a beautiful
           2D illustrated Indian home with rooftop solar panels.
           Only show: 'Your solar business. In sync.'"
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[0] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle overflow-hidden"
      >
        <div className="absolute inset-0 bg-radial from-transparent via-white/50 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-6">
          
          {/* Subtle Brand Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/90 text-[11px] font-extrabold text-blue-800 tracking-wider uppercase shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>WhereReady Solar OS</span>
          </div>

          {/* Strict Scene 1 Headline (Exact user brief: "Your solar business. In sync.") */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] font-['Plus_Jakarta_Sans',sans-serif]">
            Your solar business. <span className="text-blue-600 block sm:inline">In sync.</span>
          </h1>

          {/* Master Visual: Illustrated Indian Solar Home with Character */}
          <div className="relative mt-8 max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-blue-500/10 group">
            <img
              src="/images/hero_solar_home.jpg"
              alt="Illustrated modern Indian home with rooftop solar panels"
              className="w-full h-72 sm:h-96 md:h-[460px] object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Guide Character standing proudly beside home */}
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
              <GuideCharacter
                pose="wave"
                size={70}
                speechText="Welcome! Scroll to follow the journey."
              />
            </div>

            {/* Live Rooftop Indicator */}
            <div className="absolute top-5 right-5 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 text-xs font-bold text-slate-800 shadow-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sharma Villa • 5.4 kW Rooftop</span>
            </div>
          </div>

          {/* Gentle Scroll Hint */}
          <div className="pt-6 flex flex-col items-center justify-center text-xs font-medium text-slate-400 gap-1.5">
            <span>Scroll to see how work moves forward</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-blue-600" />
          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 2: A CUSTOMER APPEARS
          "As the visitor scrolls, a floating customer enquiry enters the scene.
           The character notices it, catches it and guides it into a clean product interface.
           No explanatory paragraph. The visual itself demonstrates lead capture."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[1] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Minimal Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase">
            Scene 02 • A Customer Appears
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Every project begins with a conversation.
          </h2>

          {/* Visual Showcase: Floating Enquiry Caught & Transformed into Clean Lead CRM */}
          <div className="relative max-w-3xl mx-auto bg-slate-50/80 border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-lg">
            
            {/* Guide Character Actively Catching the Enquiry */}
            <div className="flex justify-center mb-6">
              <GuideCharacter
                pose="point-right"
                size={76}
                speechText="New enquiry received on WhatsApp!"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center text-left">
              
              {/* Incoming Floating WhatsApp Enquiry */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">WhatsApp Enquiry</span>
                    <span className="text-[10px] text-slate-400">Just now • Consumer</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                  &ldquo;Hi, I received a ₹6,800 electricity bill this month. Want to install rooftop solar at Baner, Pune. Can you share a quote?&rdquo;
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block mt-3">
                  Rajesh Kulkarni • Baner
                </span>
              </div>

              {/* Character Guides into Solar OS Clean Lead Interface */}
              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-md">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <ScanText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Auto-Created Lead Dossier</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    OCR Parsed
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
                  <span>Assigned to Site Surveyor</span>
                </div>
              </div>

            </div>

            <div className="mt-6 text-center text-xs font-medium text-slate-400">
              No manual re-typing • Utility bill OCR reads load and tariff automatically
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 3: THE QUOTATION FORMS
          "The enquiry card transforms into customer details.
           A proposal unfolds from a single sheet into a beautiful solar quotation preview.
           Animate the actual quotation interface wherever possible.
           Do not invent figures or use AI-generated illegible UI text."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[2] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Minimal Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-amber-600 uppercase">
            Scene 03 • The Quotation Forms
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            A proposal in 60 seconds. Legible and accurate.
          </h2>

          {/* Visual Showcase: Real Proposal Preview Unfolding */}
          <div className="relative max-w-3xl mx-auto">
            
            {/* Guide Character Inspecting Calculation */}
            <div className="flex justify-center mb-6">
              <GuideCharacter
                pose="inspect"
                size={76}
                speechText="Central PM Surya Ghar subsidy applied: ₹78,000!"
              />
            </div>

            {/* Actual Legible Proposal Canvas */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-left relative overflow-hidden">
              
              {/* Proposal Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    SOLAR SYSTEM PROPOSAL #WR-2026-902
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    5.4 kW High-Efficiency Rooftop
                  </h3>
                  <p className="text-xs text-slate-500">Prepared for Rajesh Kulkarni • Baner, Pune</p>
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

              {/* Bill of Materials Hardware Preview */}
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
                  <span>HDGI Elev. Structure (Wind load: 150 km/h) + Pure Copper Earthing</span>
                  <span className="text-slate-900 font-semibold">25-Yr Warranty</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 4: THE PROJECT MOVES FORWARD
          "The quotation transforms into a project timeline.
           Tasks, milestones and installation updates connect through an animated blue line.
           The character guides the viewer's attention through each transformation."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[3] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Minimal Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase">
            Scene 04 • The Project Moves Forward
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Every milestone connected by a single thread.
          </h2>

          {/* Visual Showcase: Project Timeline Connected by Animated Blue Line */}
          <div className="relative max-w-3xl mx-auto bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl text-left">
            
            {/* Guide Character in Guiding Pose */}
            <div className="flex justify-center mb-6">
              <GuideCharacter
                pose="guide"
                size={76}
                speechText="MSEDCL DISCOM Form A-1 sanctioned!"
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
                      Approved
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
                      Dispatched
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    10x DCR Module Barcodes (TC55-2026-9041 to 9052) assigned from central warehouse
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
                    <strong className="text-emerald-900">Rooftop Installation &amp; Chemical Earthing</strong>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Site Verified
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Structural tilt 18° verified • Resistance &lt; 2 Ohms certified
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 5: INSTALLATION
          "The illustrated project transitions into a rooftop solar installation.
           Panels appear, milestones complete and the character celebrates subtly."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[4] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Minimal Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-emerald-600 uppercase">
            Scene 05 • Installation
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Turned on. Generating clean power.
          </h2>

          {/* Master Visual: Completed Rooftop Installation Scene */}
          <div className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-blue-500/10 group">
            <img
              src="/images/project_installation_sync.jpg"
              alt="Completed rooftop solar panel installation and net-meter commissioning"
              className="w-full h-72 sm:h-96 md:h-[460px] object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Guide Character Celebrating Subtly */}
            <div className="absolute top-6 right-6 z-20">
              <GuideCharacter
                pose="celebrate"
                size={78}
                speechText="Site commissioned & verified!"
              />
            </div>

            {/* Floating Handover Status Badge */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                <span className="text-xs font-extrabold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  MSEDCL Bi-Directional Net-Meter Active ⚡
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5">
                  Work Completion Report (WCR) Submitted • DBT Subsidy Ready
                </span>
              </div>

              <div className="bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md self-end sm:self-auto">
                Clean Power Online ✓
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 6: EVERYTHING CONNECTS
          "Pull back to reveal the complete lead-to-installation journey as one coherent visual composition.
           Use only small labels if needed: Lead → Quotation → Project → Installation."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[5] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full text-center space-y-8">
          
          {/* Minimal Label */}
          <span className="inline-block text-xs font-bold tracking-wider text-blue-600 uppercase">
            Scene 06 • Everything Connects
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            One coherent journey. No disconnected tools.
          </h2>

          {/* Master Pull-Back Panorama: 4 Pillars in a Connected Circuit */}
          <div className="relative max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl">
            
            {/* Guide Character in Center */}
            <div className="flex justify-center mb-8">
              <GuideCharacter
                pose="guide"
                size={80}
                speechText="The entire solar lifecycle in one place."
              />
            </div>

            {/* 4 Connected Nodes (Lead → Quotation → Project → Installation) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
              
              {/* Connecting Horizontal Line (Desktop) */}
              <div className="hidden md:block absolute top-10 left-12 right-12 h-0.5 bg-blue-200 -z-10" />

              {/* Node 1: Lead */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:border-blue-400 transition-colors shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 font-bold text-xs shadow-xs">
                  01
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Lead</h4>
                <p className="text-[11px] text-slate-500 mt-1">WhatsApp &amp; OCR Ingestion</p>
              </div>

              {/* Node 2: Quotation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:border-blue-400 transition-colors shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 font-bold text-xs shadow-xs">
                  02
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Quotation</h4>
                <p className="text-[11px] text-slate-500 mt-1">60-sec Surya Ghar Proposal</p>
              </div>

              {/* Node 3: Project */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:border-blue-400 transition-colors shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 font-bold text-xs shadow-xs">
                  03
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Project</h4>
                <p className="text-[11px] text-slate-500 mt-1">DISCOM Net-Meter Hub</p>
              </div>

              {/* Node 4: Installation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:border-blue-400 transition-colors shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold text-xs shadow-xs">
                  04
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Installation</h4>
                <p className="text-[11px] text-slate-500 mt-1">DCR Sync &amp; Commissioning</p>
              </div>

            </div>

            {/* Minimal Flow Arrow Label */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs font-bold text-blue-700">
              Lead → Quotation → Project → Installation
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SCENE 7: THE INVITATION
          "The character returns beside the completed solar home.
           Show one prominent CTA: 'See it in action.'
           Button opens the existing demo-booking flow."
          ========================================================================= */}
      <section
        ref={(el) => { sceneRefs.current[6] = el; }}
        className="min-h-[85vh] sm:min-h-screen flex flex-col justify-center items-center py-20 px-4 sm:px-6 relative bg-grid-subtle border-t border-slate-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-radial from-transparent via-white/50 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full text-center space-y-8">
          
          {/* Master Visual: Completed Sunlit Home Finale */}
          <div className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-blue-500/10 group">
            <img
              src="/images/final_solar_showcase.jpg"
              alt="Commissioned rooftop solar system in full sunshine"
              className="w-full h-72 sm:h-96 md:h-[440px] object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Character returns beside home */}
            <div className="absolute top-6 left-6 z-20">
              <GuideCharacter
                pose="celebrate"
                size={80}
                speechText="Ready to bring your solar business into sync?"
              />
            </div>

            <div className="absolute bottom-6 left-6 right-6 z-20 text-white text-left">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                WhereReady Solar OS
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-white">
                Your solar business. In sync.
              </p>
            </div>
          </div>

          {/* Prominent Single Invitation CTA (Requirement 7: "See it in action") */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={onOpenDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <span>See it in action</span>
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
                Nagpur: 1/2, Belekar Layout, Gurukrupa Nagar, Hudkeshwar Road - 440034 • Phone/WhatsApp: 9270201883
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
