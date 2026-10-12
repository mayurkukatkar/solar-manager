"use client";
import { useState } from "react";
import { 
  Globe, Smartphone, Monitor, ExternalLink, Save, Check, Copy, 
  Sparkles, Sun, ShieldCheck, Star, Award, Phone, Mail, MapPin, 
  ArrowRight, Calculator, CheckCircle2, QrCode, RefreshCw, X, Layers
} from "lucide-react";

export default function WebsiteCMSPage() {
  const [deviceMode, setDeviceMode] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
  const [activeTab, setActiveTab] = useState<"HERO" | "CALCULATOR" | "TRUST" | "PORTFOLIO">("HERO");
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // CMS Config State
  const [siteConfig, setSiteConfig] = useState({
    companyName: "SunVolt Solar Technologies",
    tagline: "India's Premier Rooftop Solar Engineering Partner",
    phone: "+91 98201 99882",
    whatsapp: "+91 98201 99882",
    heroHeadline: "Slash Your Electricity Bill by 90% with PM Surya Ghar Subsidy",
    heroSubtext: "Get up to ₹78,000 direct government subsidy. Zero electricity bills for the next 25 years with Tier-1 bifacial solar modules.",
    ctaText: "Calculate Free Solar Quote",
    tariffRate: 8.5,
    subsidy3kW: 78000,
    solarCapacityPreview: 3,
    showCalculator: true,
    showTrustBadges: true,
    showTestimonials: true,
    domain: "sunvoltsolar.solarerp.app"
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast("Website content and customer portal published successfully!");
      setTimeout(() => setToast(""), 4000);
    }, 600);
  };

  const copyUrl = () => {
    navigator.clipboard?.writeText(`https://${siteConfig.domain}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Live calculator calculation
  const monthlyUnits = siteConfig.solarCapacityPreview * 120; // 4 units/kW/day * 30
  const monthlySavings = Math.round(monthlyUnits * siteConfig.tariffRate);
  const annualSavings = monthlySavings * 12;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
              Customer Portal CMS
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live: https://{siteConfig.domain}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Website & Lead Gen CMS</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build and publish your branded solar customer portal, solar savings calculator, and instant lead capture forms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={copyUrl}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? "Copied Link!" : "Copy Portal URL"}
          </button>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Publishing..." : "Publish Changes"}
          </button>
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
          <button onClick={() => setToast("")} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* TWO COLUMN STUDIO: LEFT EDITOR, RIGHT LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CMS CONTROLS */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            {/* TABS */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              {[
                { id: "HERO", label: "Hero & Brand" },
                { id: "CALCULATOR", label: "Savings Calc" },
                { id: "TRUST", label: "Badges & Trust" },
                { id: "PORTFOLIO", label: "Showcase" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: HERO */}
            {activeTab === "HERO" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={siteConfig.companyName}
                    onChange={(e) => setSiteConfig({ ...siteConfig, companyName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={siteConfig.tagline}
                    onChange={(e) => setSiteConfig({ ...siteConfig, tagline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Hero Main Headline
                  </label>
                  <textarea
                    rows={2}
                    value={siteConfig.heroHeadline}
                    onChange={(e) => setSiteConfig({ ...siteConfig, heroHeadline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Hero Supporting Subtext
                  </label>
                  <textarea
                    rows={3}
                    value={siteConfig.heroSubtext}
                    onChange={(e) => setSiteConfig({ ...siteConfig, heroSubtext: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                      Support Hotline
                    </label>
                    <input
                      type="text"
                      value={siteConfig.phone}
                      onChange={(e) => setSiteConfig({ ...siteConfig, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={siteConfig.ctaText}
                      onChange={(e) => setSiteConfig({ ...siteConfig, ctaText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CALCULATOR */}
            {activeTab === "CALCULATOR" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-xs text-slate-800">Show Solar Calculator Widget</p>
                    <p className="text-[11px] text-slate-500">Allow customers to simulate bill savings & ROI</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteConfig.showCalculator}
                    onChange={(e) => setSiteConfig({ ...siteConfig, showCalculator: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 rounded"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Average Discom Electricity Tariff (₹/unit)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={siteConfig.tariffRate}
                    onChange={(e) => setSiteConfig({ ...siteConfig, tariffRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Used to compute annual electricity bill savings.</p>
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    PM Surya Ghar Subsidy Amount (₹ for 3kW+)
                  </label>
                  <input
                    type="number"
                    value={siteConfig.subsidy3kW}
                    onChange={(e) => setSiteConfig({ ...siteConfig, subsidy3kW: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1 block">
                    Preview Default Capacity (kW)
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 5, 10].map((kw) => (
                      <button
                        type="button"
                        key={kw}
                        onClick={() => setSiteConfig({ ...siteConfig, solarCapacityPreview: kw })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          siteConfig.solarCapacityPreview === kw
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {kw} kW
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: TRUST BADGES */}
            {activeTab === "TRUST" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-800">Display Empanelment Badges</p>
                    <p className="text-[11px] text-slate-500">Highlight official government & Discom recognitions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteConfig.showTrustBadges}
                    onChange={(e) => setSiteConfig({ ...siteConfig, showTrustBadges: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 rounded"
                  />
                </div>

                <div className="space-y-2">
                  <div className="p-3 border border-slate-200 rounded-2xl flex items-center gap-3">
                    <Award size={20} className="text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">MNRE Registered Vendor</p>
                      <p className="text-[11px] text-slate-400">Authorized for National Solar Subsidy Portal</p>
                    </div>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-2xl flex items-center gap-3">
                    <ShieldCheck size={20} className="text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">State Discom Empaneled</p>
                      <p className="text-[11px] text-slate-400">Direct net-metering synchronization clearance</p>
                    </div>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-2xl flex items-center gap-3">
                    <Star size={20} className="text-blue-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">25-Year Performance Warranty</p>
                      <p className="text-[11px] text-slate-400">Tier-1 DCR ALMM listed high-efficiency modules</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PORTFOLIO */}
            {activeTab === "PORTFOLIO" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-800">Customer Testimonials</p>
                    <p className="text-[11px] text-slate-500">Showcase recent rooftop installations & reviews</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteConfig.showTestimonials}
                    onChange={(e) => setSiteConfig({ ...siteConfig, showTestimonials: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 rounded"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 border border-slate-200 rounded-2xl">
                    <p className="font-bold text-slate-800">Vasant Kunj Villa (5kW On-Grid)</p>
                    <p className="text-slate-500 text-[11px]">"My monthly bill dropped from ₹6,800 to ₹350. Subsidy of ₹78,000 received in 4 weeks!"</p>
                    <span className="text-[10px] font-bold text-emerald-600 mt-1 block">⭐⭐⭐⭐⭐ - Dr. R. Sharma</span>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-2xl">
                    <p className="font-bold text-slate-800">Pooja Industrial Workshop (25kW)</p>
                    <p className="text-slate-500 text-[11px]">"Payback in under 3 years. High-grade structure and rapid net-metering approvals."</p>
                    <span className="text-[10px] font-bold text-emerald-600 mt-1 block">⭐⭐⭐⭐⭐ - Mahesh K.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DOMAIN & DEPLOYMENT CARD */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Hosting & SSL</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">SSL Encrypted</span>
            </div>
            <p className="text-sm font-bold text-white">Custom Domain: {siteConfig.domain}</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-renewing wildcard SSL active. Lead responses from this site route directly into your Tenant CRM Pipeline.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Live Preview</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setDeviceMode("DESKTOP")}
                className={`p-2 rounded-xl transition-all ${
                  deviceMode === "DESKTOP" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Desktop View"
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setDeviceMode("MOBILE")}
                className={`p-2 rounded-xl transition-all ${
                  deviceMode === "MOBILE" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Mobile View"
              >
                <Smartphone size={16} />
              </button>
            </div>
          </div>

          {/* SIMULATED DEVICE FRAME */}
          <div className={`mx-auto bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl transition-all duration-300 ${
            deviceMode === "MOBILE" ? "max-w-sm" : "w-full"
          }`}>
            {/* SCREEN CONTAINER */}
            <div className="bg-white rounded-[2rem] overflow-hidden text-slate-900 max-h-[720px] overflow-y-auto custom-scrollbar border border-slate-100">
              
              {/* PORTAL NAV */}
              <div className="h-14 border-b border-slate-100 px-5 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
                    <Sun size={18} />
                  </div>
                  <span className="font-black text-sm text-slate-800 tracking-tight">{siteConfig.companyName}</span>
                </div>
                <a 
                  href={`tel:${siteConfig.phone}`} 
                  className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm"
                >
                  Call Now
                </a>
              </div>

              {/* HERO SECTION */}
              <div className="p-6 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold mb-3">
                  <Sparkles size={12} /> PM Surya Ghar Muft Bijli Yojana
                </div>
                <h2 className="text-xl sm:text-2xl font-black leading-tight tracking-tight mb-2">
                  {siteConfig.heroHeadline}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {siteConfig.heroSubtext}
                </p>
                <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                  {siteConfig.ctaText} <ArrowRight size={14} />
                </button>
              </div>

              {/* SOLAR CALCULATOR SIMULATION */}
              {siteConfig.showCalculator && (
                <div className="p-6 bg-slate-50 border-b border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} className="text-emerald-600" />
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                      Live Solar Savings Estimator
                    </h3>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Selected System Size:</span>
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        {siteConfig.solarCapacityPreview} kW Rooftop
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-100">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Yearly Bill Savings</p>
                        <p className="text-base font-black text-slate-900">₹ {annualSavings.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase">Govt Subsidy</p>
                        <p className="text-base font-black text-emerald-700">₹ {siteConfig.subsidy3kW.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRUST BADGES */}
              {siteConfig.showTrustBadges && (
                <div className="p-6 border-b border-slate-100 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                    Government Accreditations
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <Award size={18} className="mx-auto text-amber-500 mb-1" />
                      <p className="text-[10px] font-bold text-slate-800">MNRE Registered</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <ShieldCheck size={18} className="mx-auto text-emerald-600 mb-1" />
                      <p className="text-[10px] font-bold text-slate-800">Discom Approved</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <Star size={18} className="mx-auto text-blue-600 mb-1" />
                      <p className="text-[10px] font-bold text-slate-800">25-Yr Warranty</p>
                    </div>
                  </div>
                </div>
              )}

              {/* LEAD CAPTURE FORM PREVIEW */}
              <div className="p-6 bg-slate-900 text-white space-y-3">
                <h4 className="font-extrabold text-sm">Request Your Free Rooftop Feasibility Study</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Your Full Name"
                    className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-400"
                  />
                  <input
                    type="text"
                    disabled
                    placeholder="Your WhatsApp Number (+91)"
                    className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-400"
                  />
                  <button className="w-full py-2 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md">
                    Claim Subsidy & Free Site Survey
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
