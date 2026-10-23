"use client";

import React, { useState } from "react";
import {
  Zap,
  Sun,
  ShieldCheck,
  Download,
  Share2,
  Check,
  TrendingUp,
  FileText,
  DollarSign,
  Cpu,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  Building
} from "lucide-react";

interface InteractiveProposalDemoProps {
  onOpenDemo?: () => void;
}

export default function InteractiveProposalDemo({ onOpenDemo }: InteractiveProposalDemoProps) {
  // Configurable Simulator States
  const [capacity, setCapacity] = useState<number>(5);
  const [customerType, setCustomerType] = useState<"residential" | "commercial">("residential");
  const [discom, setDiscom] = useState<string>("MSEDCL (Maharashtra)");
  const [panelTech, setPanelTech] = useState<string>("TopCon 550W Bifacial (DCR)");
  const [activeTab, setActiveTab] = useState<"executive" | "equipment" | "financials">("executive");

  // Calculations
  const ratePerKw = customerType === "residential" ? 56000 : 44000;
  const grossCost = capacity * ratePerKw;
  const gstAmount = Math.round(grossCost * 0.138); // Standard composite solar GST (approx 13.8%)
  const totalWithTax = grossCost + gstAmount;

  // PM Surya Ghar Central Subsidy (Rooftop Residential only)
  let centralSubsidy = 0;
  if (customerType === "residential") {
    if (capacity === 1) centralSubsidy = 30000;
    else if (capacity === 2) centralSubsidy = 60000;
    else if (capacity >= 3) centralSubsidy = 78000; // Ceiling under PM Surya Ghar
  }

  const netCustomerCost = Math.max(0, totalWithTax - centralSubsidy);

  // Energy & Financial Savings
  const dailyUnitsPerKw = 4.2;
  const monthlyUnits = Math.round(capacity * dailyUnitsPerKw * 30);
  const annualUnits = Math.round(monthlyUnits * 12);
  const avgTariff = customerType === "residential" ? 8.8 : 11.5;
  const annualSavings = Math.round(annualUnits * avgTariff);
  const monthlySavings = Math.round(annualSavings / 12);
  const paybackYears = (netCustomerCost / (annualSavings || 1)).toFixed(1);
  const lifetime25YrSavings = Math.round(annualSavings * 25 * 0.9); // degraded output assumption

  // Module Counts
  const moduleWattage = panelTech.includes("550W") ? 550 : 540;
  const moduleCount = Math.ceil((capacity * 1000) / moduleWattage);

  return (
    <section id="proposal-demo" className="py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Flagship Feature • 60-Second Solar Proposal Engine</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
            Experience the Solar Proposal{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
              That Closes Indian Rooftop Deals
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Tired of sending drab Excel quotes? Test our interactive proposal builder below. Adjust capacity, DISCOM, and equipment to see how your proposals look and calculate instantly.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Controls */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                Configure Solar System
              </h3>
              <span className="text-xs text-slate-400 font-mono">Live Simulator</span>
            </div>

            <div className="space-y-6 mt-6">
              {/* Customer Type Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Customer Category
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCustomerType("residential")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                      customerType === "residential"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Residential Rooftop
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType("commercial")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                      customerType === "commercial"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Commercial &amp; Industrial
                  </button>
                </div>
              </div>

              {/* System Capacity Quick Select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    System Capacity (kW)
                  </label>
                  <span className="text-base font-extrabold text-amber-400">
                    {capacity} kWp
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {[3, 5, 10, 25, 50].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setCapacity(kw)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        capacity === kw
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
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
                  className="w-full accent-amber-400 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* State / DISCOM Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Utility / DISCOM (Electricity Provider)
                </label>
                <select
                  value={discom}
                  onChange={(e) => setDiscom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Solar PV Module Specification
                </label>
                <select
                  value={panelTech}
                  onChange={(e) => setPanelTech(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="TopCon 550W Bifacial (DCR)">
                    TopCon N-Type 550W Bifacial (DCR Approved)
                  </option>
                  <option value="Mono PERC 540W Half-Cut (DCR)">
                    Mono PERC 540W Half-Cut (DCR Approved)
                  </option>
                  <option value="Non-DCR 550W Commercial">
                    High-Efficiency 550W Non-DCR (C&amp;I Projects)
                  </option>
                </select>
              </div>

              {/* Live Metric Badges */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Calculated PV Modules:</span>
                  <span className="font-bold text-white">{moduleCount} Modules ({moduleWattage}W each)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Est. Monthly Generation:</span>
                  <span className="font-bold text-white">~{monthlyUnits.toLocaleString("en-IN")} Units (kWh)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Est. Monthly Bill Savings:</span>
                  <span className="font-bold text-emerald-400">₹{monthlySavings.toLocaleString("en-IN")} / month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Proposal Preview Canvas */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Proposal Window Header */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-300">
                  Proposal #WR-2026-PREVIEW • 6-Page Magazine Edition
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("executive")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === "executive" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("equipment")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === "equipment" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Bill of Materials
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("financials")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === "financials" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  ROI &amp; Payback
                </button>
              </div>
            </div>

            {/* Proposal Preview Body */}
            <div className="p-6 sm:p-8 bg-slate-950 flex-1">
              {activeTab === "executive" && (
                <div className="space-y-6">
                  {/* Proposal Top Brand Bar */}
                  <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                        Solar Feasibility &amp; Turnkey Proposal
                      </p>
                      <h4 className="text-xl font-bold text-white mt-1">
                        {capacity} kWp Grid-Tied Solar System
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Prepared for: Anand Deshpande • Pune, Maharashtra • {discom}
                      </p>
                    </div>
                    <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                      <p className="text-xs text-slate-400">Net Customer Cost</p>
                      <p className="text-2xl font-black text-amber-400">
                        ₹{netCustomerCost.toLocaleString("en-IN")}
                      </p>
                      {centralSubsidy > 0 && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40">
                          Incl. ₹{centralSubsidy.toLocaleString("en-IN")} Central Subsidy
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Commercial Snapshot Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">Gross Project Cost</p>
                      <p className="text-base font-bold text-white mt-1">
                        ₹{grossCost.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-500">Excl. statutory taxes</p>
                    </div>

                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">Applicable GST</p>
                      <p className="text-base font-bold text-white mt-1">
                        ₹{gstAmount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-500">Composite solar rate</p>
                    </div>

                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">PM Surya Ghar Subsidy</p>
                      <p className="text-base font-bold text-emerald-400 mt-1">
                        {centralSubsidy > 0 ? `₹${centralSubsidy.toLocaleString("en-IN")}` : "N/A (Commercial)"}
                      </p>
                      <p className="text-[10px] text-slate-500">Direct DBT to consumer</p>
                    </div>

                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">Simple Payback</p>
                      <p className="text-base font-bold text-blue-400 mt-1">
                        {paybackYears} Years
                      </p>
                      <p className="text-[10px] text-slate-500">Based on {discom}</p>
                    </div>
                  </div>

                  {/* Milestones Preview */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      Payment Terms &amp; Execution Milestones
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-blue-400 font-bold">10% Advance</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">Booking &amp; DISCOM application</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-blue-400 font-bold">70% Material</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">On module &amp; inverter dispatch</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-blue-400 font-bold">15% Installation</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">Mounting &amp; testing completion</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-emerald-400 font-bold">5% Handover</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">Net-metering &amp; grid sync</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "equipment" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      Engineered Bill of Materials (BOM)
                    </h5>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{panelTech}</p>
                          <p className="text-slate-400 text-[11px]">DCR Certified • 25 Years Linear Performance Warranty</p>
                        </div>
                        <span className="font-bold text-amber-400">{moduleCount} Modules</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">
                            {capacity <= 10 ? `${capacity}kW Single/Three Phase` : `${capacity}kW Three-Phase`} Grid-Tie String Inverter
                          </p>
                          <p className="text-slate-400 text-[11px]">Dual MPPT • Built-in DC Disconnect &amp; Wi-Fi Datalogger</p>
                        </div>
                        <span className="font-bold text-sky-400">1 Unit</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">Hot-Dip Galvanized (HDG) Mounting Structure</p>
                          <p className="text-slate-400 text-[11px]">80-Micron Galvanized • Wind Resistance up to 150 km/h</p>
                        </div>
                        <span className="font-bold text-slate-300">Complete Set</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">Statutory Safety &amp; Earthing Kit</p>
                          <p className="text-slate-400 text-[11px]">3x Chemical Earthing Electrodes + Dual Spike Lightning Arrestor</p>
                        </div>
                        <span className="font-bold text-emerald-400">Included</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "financials" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      25-Year Financial Return on Investment
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                        <p className="text-slate-400">1st Year Electricity Savings</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">
                          ₹{annualSavings.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-slate-500">Offsetting {discom} bill</p>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                        <p className="text-slate-400">Capital Recovery Period</p>
                        <p className="text-lg font-bold text-blue-400 mt-1">
                          {paybackYears} Years
                        </p>
                        <p className="text-[10px] text-slate-500">Free electricity thereafter</p>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                        <p className="text-slate-400">25-Year Cumulative Savings</p>
                        <p className="text-lg font-bold text-amber-400 mt-1">
                          ₹{lifetime25YrSavings.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-slate-500">Assuming 0.7% degradation</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        WhereReady Solar OS automatically formats these payback figures, cash flow projections, and equipment warranties into branded presentation decks your sales team can share via WhatsApp or print as high-gloss PDFs.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Want to generate proposals like this for your brand?</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={onOpenDemo}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <span>Get a Live Walkthrough</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-5 py-2 bg-slate-950/90 border-t border-slate-900 text-[10px] text-slate-500">
              * Calculations are simulated demonstrations based on typical DISCOM tariffs and PM Surya Ghar benchmarks. Solar OS calculates precise bids based on each EPC&apos;s custom equipment rate lists and local site irradiation.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
