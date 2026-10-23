"use client";

import React, { useState } from "react";
import {
  Sun,
  Zap,
  CheckCircle2,
  Cpu,
  TrendingUp,
  FileText,
  Calendar,
  ArrowRight,
  Info
} from "lucide-react";
import GuideCharacter from "./GuideCharacter";

interface QuotationSceneProps {
  onOpenDemo?: () => void;
}

export default function QuotationScene({ onOpenDemo }: QuotationSceneProps) {
  // Configurable Simulator States
  const [capacity, setCapacity] = useState<number>(5);
  const [customerType, setCustomerType] = useState<"residential" | "commercial">("residential");
  const [discom, setDiscom] = useState<string>("MSEDCL (Maharashtra)");
  const [panelTech, setPanelTech] = useState<string>("TopCon 550W Bifacial (DCR)");
  const [activeTab, setActiveTab] = useState<"summary" | "bom" | "roi">("summary");

  // Accurate Calculations based on prevailing Indian solar benchmarks
  const ratePerKw = customerType === "residential" ? 56000 : 44000;
  const grossCost = capacity * ratePerKw;
  const gstAmount = Math.round(grossCost * 0.138); // Standard composite solar GST (approx 13.8%)
  const totalWithTax = grossCost + gstAmount;

  // PM Surya Ghar Central Subsidy (Residential Rooftop benchmark)
  let centralSubsidy = 0;
  if (customerType === "residential") {
    if (capacity === 1) centralSubsidy = 30000;
    else if (capacity === 2) centralSubsidy = 60000;
    else if (capacity >= 3) centralSubsidy = 78000; // National ceiling benchmark under PM Surya Ghar
  }

  const netCustomerCost = Math.max(0, totalWithTax - centralSubsidy);

  // Energy & Financial Savings (Illustrative based on 4.2 units/kW/day benchmark)
  const dailyUnitsPerKw = 4.2;
  const monthlyUnits = Math.round(capacity * dailyUnitsPerKw * 30);
  const annualUnits = Math.round(monthlyUnits * 12);
  const avgTariff = customerType === "residential" ? 8.8 : 11.5;
  const annualSavings = Math.round(annualUnits * avgTariff);
  const monthlySavings = Math.round(annualSavings / 12);
  const paybackYears = (netCustomerCost / (annualSavings || 1)).toFixed(1);
  const lifetime25YrSavings = Math.round(annualSavings * 25 * 0.88); // 12% lifetime degradation

  const moduleWattage = panelTech.includes("550W") ? 550 : 540;
  const moduleCount = Math.ceil((capacity * 1000) / moduleWattage);

  return (
    <section id="proposal-demo" className="py-24 sm:py-32 bg-grid-subtle text-slate-900 border-t border-slate-100 relative overflow-hidden">
      {/* Soft gradient masks to fade the grid toward center */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/95 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (Scene 4: Experience the Product) */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-bold tracking-wider text-amber-600 uppercase">
            Scene 04 • Experience the Product
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] font-['Plus_Jakarta_Sans',sans-serif]">
            Create proposals. Track progress. Keep work moving.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal">
            Real Solar OS proposal engine and interactive simulator. Generate customer proposals with accurate PM Surya Ghar central subsidies and 25-year payback calculations in seconds.
          </p>
        </div>

        {/* Interactive Simulator Grid: Clean White Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          
          {/* Left Column: Intuitive System Controls */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                Configure Proposal Specs
              </h3>
              <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                Interactive Simulator
              </span>
            </div>

            <div className="space-y-5 mt-5">
              {/* Customer Type Toggle */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Customer Category
                </label>
                <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCustomerType("residential")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      customerType === "residential"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Residential Rooftop
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType("commercial")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      customerType === "commercial"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Commercial &amp; Industrial
                  </button>
                </div>
              </div>

              {/* System Capacity Quick Select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    System Capacity (kWp)
                  </label>
                  <span className="text-base font-extrabold text-blue-600">
                    {capacity} kWp
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {[3, 5, 10, 25, 50].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setCapacity(kw)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        capacity === kw
                          ? "bg-blue-50 text-blue-700 border-blue-400"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {kw} kW
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full accent-blue-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* State / DISCOM Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Utility / DISCOM (Electricity Provider)
                </label>
                <select
                  value={discom}
                  onChange={(e) => setDiscom(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  <option value="MSEDCL (Maharashtra)">MSEDCL (Maharashtra - Mahavitaran)</option>
                  <option value="Tata Power (Mumbai)">Tata Power (Mumbai Distribution)</option>
                  <option value="BESCOM (Karnataka)">BESCOM (Bangalore, Karnataka)</option>
                  <option value="UGVCL / DGVCL (Gujarat)">UGVCL / DGVCL (Gujarat GUVNL)</option>
                  <option value="TANGEDCO (Tamil Nadu)">TANGEDCO (Tamil Nadu)</option>
                  <option value="BSES Rajdhani (Delhi)">BSES Rajdhani / Yamuna (Delhi)</option>
                </select>
              </div>

              {/* Panel Technology */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Solar PV Module Specification
                </label>
                <select
                  value={panelTech}
                  onChange={(e) => setPanelTech(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  <option value="TopCon 550W Bifacial (DCR)">
                    TopCon N-Type 550W Bifacial (DCR Certified)
                  </option>
                  <option value="Mono PERC 540W Half-Cut (DCR)">
                    Mono PERC 540W Half-Cut (DCR Certified)
                  </option>
                  <option value="Non-DCR 550W Commercial">
                    High-Efficiency 550W Non-DCR (C&amp;I Projects)
                  </option>
                </select>
              </div>

              {/* Quick Calculation Summary Badges */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Calculated Modules:</span>
                  <span className="font-semibold text-slate-900">{moduleCount} Modules ({moduleWattage}W each)</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Monthly Generation:</span>
                  <span className="font-semibold text-slate-900">~{monthlyUnits.toLocaleString("en-IN")} Units (kWh)</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Monthly Bill Savings:</span>
                  <span className="font-bold text-emerald-600">₹{monthlySavings.toLocaleString("en-IN")} / month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Live Proposal Document Preview */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Guide Character dynamically reacting to proposal calculations */}
            <div className="hidden sm:flex items-center gap-2.5 mb-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl px-3.5 py-2 w-fit">
              <GuideCharacter
                pose="inspect"
                size={34}
                className="shrink-0"
              />
              <span className="text-xs font-semibold text-blue-900">
                {centralSubsidy > 0
                  ? `PM Surya Ghar Subsidy calculated: ₹${centralSubsidy.toLocaleString("en-IN")} deduction applied!`
                  : `C&I Commercial Proposal with accelerated depreciation & GST ITC.`}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-100 flex flex-col">
            
            {/* Document Header Bar */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  Proposal #WR-2026-PREVIEW • Magazine Edition
                </span>
              </div>

              {/* Document Tabs */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("summary")}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeTab === "summary" ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("bom")}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeTab === "bom" ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  BOM Specs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("roi")}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeTab === "roi" ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Payback
                </button>
              </div>
            </div>

            {/* Document Body Canvas */}
            <div className="p-6 sm:p-8 flex-1 bg-white">
              {activeTab === "summary" && (
                <div className="space-y-6">
                  {/* Proposal Top Brand Bar */}
                  <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                        Solar Energy Proposal
                      </span>
                      <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">
                        {capacity} kWp Grid-Tied System
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Prepared for: Anand Deshpande • Pune, MH • {discom}
                      </p>
                    </div>
                    <div className="text-left sm:text-right sm:border-l sm:border-blue-200 sm:pl-4">
                      <p className="text-xs text-slate-500">Net Customer Investment</p>
                      <p className="text-2xl font-black text-slate-900">
                        ₹{netCustomerCost.toLocaleString("en-IN")}
                      </p>
                      {centralSubsidy > 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Includes ₹{centralSubsidy.toLocaleString("en-IN")} Central Subsidy*
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Commercial Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <p className="text-[11px] text-slate-500">Gross System Cost</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">
                        ₹{grossCost.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-400">Excl. taxes</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <p className="text-[11px] text-slate-500">Applicable GST</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">
                        ₹{gstAmount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-400">Composite rate</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <p className="text-[11px] text-slate-500">Surya Ghar Subsidy</p>
                      <p className="text-base font-bold text-emerald-700 mt-0.5">
                        {centralSubsidy > 0 ? `₹${centralSubsidy.toLocaleString("en-IN")}` : "N/A (Commercial)"}
                      </p>
                      <p className="text-[10px] text-slate-400">DBT to consumer</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <p className="text-[11px] text-slate-500">Simple Payback</p>
                      <p className="text-base font-bold text-blue-700 mt-0.5">
                        {paybackYears} Years
                      </p>
                      <p className="text-[10px] text-slate-400">Based on tariff</p>
                    </div>
                  </div>

                  {/* Milestone Terms */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Milestone Payment Schedule
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-bold text-blue-700">10% Advance</span>
                        <p className="text-slate-500 text-[11px]">DISCOM booking</p>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-bold text-blue-700">70% Dispatch</span>
                        <p className="text-slate-500 text-[11px]">Material on site</p>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-bold text-blue-700">15% Installation</span>
                        <p className="text-slate-500 text-[11px]">Testing complete</p>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-bold text-emerald-700">5% Handover</span>
                        <p className="text-slate-500 text-[11px]">Net-meter sync</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "bom" && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <p className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      Engineered Bill of Materials (BOM)
                    </p>
                    
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{panelTech}</p>
                        <p className="text-slate-500 text-[11px]">DCR Approved • 25 Years Performance Warranty</p>
                      </div>
                      <span className="font-bold text-blue-700">{moduleCount} Modules</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">Grid-Tie String Inverter ({capacity} kW)</p>
                        <p className="text-slate-500 text-[11px]">Dual MPPT • Built-in Wi-Fi Datalogger</p>
                      </div>
                      <span className="font-bold text-slate-700">1 Unit</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">HDG Solar Mounting Structure</p>
                        <p className="text-slate-500 text-[11px]">Hot-Dip Galvanized • 150 km/h Wind Resistance</p>
                      </div>
                      <span className="font-bold text-slate-700">Included</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "roi" && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
                    <p className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      25-Year Financial Return Breakdown
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="text-slate-500">1st Year Savings</p>
                        <p className="text-base font-bold text-emerald-700 mt-0.5">
                          ₹{annualSavings.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="text-slate-500">Payback Period</p>
                        <p className="text-base font-bold text-blue-700 mt-0.5">
                          {paybackYears} Years
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="text-slate-500">25-Yr Cumulative</p>
                        <p className="text-base font-bold text-slate-900 mt-0.5">
                          ₹{lifetime25YrSavings.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      * Illustrative calculation based on {discom} tariff benchmarks and standard radiation data. Exact savings depend on rooftop orientation, shading, and actual consumer consumption.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Ready to send proposals like this with your company logo?
                </span>
                <button
                  type="button"
                  onClick={onOpenDemo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors cursor-pointer"
                >
                  <span>Schedule Full Walkthrough</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400">
              * Numerical values are illustrative simulations. Solar OS calculates bids based on each subscriber&apos;s custom equipment price list and local DISCOM rules.
            </div>

          </div>

        </div>

      </div>

    </div>
  </section>
);
}
