"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import DemoModal from "@/components/marketing/DemoModal";
import WhatsAppCta from "@/components/marketing/WhatsAppCta";
import {
  Download,
  Smartphone,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  MapPin,
  Barcode,
  WifiOff,
  RefreshCw,
  Cpu,
  FileCheck2,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Info,
  Layers,
  Award,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

const APK_DIRECT_URL = "https://expo.dev/artifacts/eas/W4k8Hnc6eIBtPhEk9V43oxsTb24eCV4ciSvjj82GQu0.apk";
const QR_IMAGE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(APK_DIRECT_URL)}`;

export default function AppDownloadPage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"features" | "installation" | "changelog">("features");

  const handleCopyLink = () => {
    navigator.clipboard.writeText(APK_DIRECT_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-blue-600 selection:text-white antialiased">
      {/* Global Marketing Navigation Bar */}
      <Navbar onOpenDemo={() => setDemoModalOpen(true)} />

      <main className="pt-28 pb-20">
        {/* =====================================================================
            HERO SECTION: High-Impact App Presentation & Download Card
            ===================================================================== */}
        <section className="relative overflow-hidden pt-8 pb-16 lg:pb-24 border-b border-slate-800/80">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Version & Security Tag */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6 justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Latest Release v1.1.0 • Build 2
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Google Play Protect Verified
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Universal Android APK (~54 MB)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Headline, Description & Actions */}
              <div className="lg:col-span-7 text-center lg:text-left">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
                  Supercharge Your <br />
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                    Solar EPC Field Crew
                  </span>
                </h1>

                <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  The purpose-built mobile operating system for solar engineers, site supervisors, and field contractors. Execute statutory CEA Ohmic earthing tests, capture 5-Geo proofing, scan DCR barcodes, and work 100% offline.
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <a
                    href={APK_DIRECT_URL}
                    download="WhereReady-Solar-OS-v1.1.0.apk"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all cursor-pointer border border-blue-400/30"
                  >
                    <Download className="w-5 h-5 text-white" />
                    <span>Download Android APK</span>
                    <span className="text-xs bg-blue-700/80 px-2 py-0.5 rounded-md font-medium text-blue-100">
                      v1.1.0
                    </span>
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl text-sm font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Copy Download Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Compatibility Badges */}
                <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span>Android 8.0 (Oreo) or later</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <WifiOff className="w-4 h-4 text-amber-400" />
                    <span>Full Offline Functionality</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Auto OTA Updates</span>
                  </div>
                </div>

                {/* Key Quick Bullet Points */}
                <div className="mt-8 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1">
                      <Zap className="w-4 h-4" />
                      <span>CEA Statutory QA</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      Record Earth Pit Ohmic &lt; 2.0 Ω & breaker trip times directly at the structure.
                    </p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>5-Geo Proofing</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      Tamper-proof GPS photos for roof, inverter, earthing, meter & handover.
                    </p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                      <Barcode className="w-4 h-4" />
                      <span>DCR Scanner</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      Instant 2D barcode scanning with duplicate serial & ALMM domestic validation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive QR Code & Visual Device Preview */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
                  {/* Glowing Edge Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Scan to Install on Mobile
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      APK v1.1.0
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white p-4 rounded-2xl shadow-inner flex flex-col items-center justify-center mx-auto w-fit">
                    <img
                      src={QR_IMAGE_URL}
                      alt="Scan QR code to download WhereReady Solar OS APK"
                      className="w-56 h-56 rounded-lg object-contain"
                    />
                  </div>

                  <p className="mt-4 text-center text-xs text-slate-400 font-medium leading-relaxed">
                    Point your Android camera at the QR code to download and install instantly on your device.
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Direct Safe Download
                    </span>
                    <a
                      href={APK_DIRECT_URL}
                      className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      Direct Link <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            NAVIGATION TABS: Features, How to Install, Release Notes
            ===================================================================== */}
        <section className="py-8 bg-slate-900/60 border-b border-slate-800 sticky top-16 z-30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <button
                onClick={() => setActiveTab("features")}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "features"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                App Features &amp; Modules
              </button>

              <button
                onClick={() => setActiveTab("installation")}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "installation"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                How to Install APK
              </button>

              <button
                onClick={() => setActiveTab("changelog")}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "changelog"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                v1.1.0 Changelog
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================================
            TAB 1: APP FEATURES & CAPABILITIES SHOWCASE
            ===================================================================== */}
        {activeTab === "features" && (
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">
                  Engineered For The Field
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Everything Your Solar Technicians Need, Right in Their Pocket
                </h2>
                <p className="mt-3 text-slate-400 text-sm sm:text-base">
                  Every feature has full functional parity with the web dashboard, ensuring zero communication lag between site workers and office leadership.
                </p>
              </div>

              {/* 6 Comprehensive Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* 1. CEA Statutory QA */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/40 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">
                      Statutory CEA Electrical QA
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Record mandatory Earth Pit Ohmic test values (&le; 2.0 &Omega;), insulation resistance (&ge; 1.0 M&Omega;), and breaker trip timing (&le; 40 ms) with instant statutory compliance flags.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-blue-400 flex items-center gap-1">
                    <span>DISCOM Inspection Ready</span> &rarr;
                  </div>
                </div>

                {/* 2. 5-Geo Proofing */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">
                      5-Geo Proofs &amp; Handover
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Capture mandatory GPS-locked, timestamped evidence photos for ROOF, INVERTER, NET-METER, EARTHING PIT, and CUSTOMER HANDOVER. Tamper-evident for fast subsidy disbursal.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-amber-400 flex items-center gap-1">
                    <span>PM Surya Ghar Compliant</span> &rarr;
                  </div>
                </div>

                {/* 3. DCR Barcode Scanner */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                      <Barcode className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">
                      2D DCR Barcode Scanner
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Scan solar panel barcodes directly at the pallet. Instant validation for MNRE ALMM list compliance and automatic detection of duplicate serial numbers across projects.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <span>Zero Fraud Warranty Audit</span> &rarr;
                  </div>
                </div>

                {/* 4. True Offline Engine */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                      <WifiOff className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">
                      100% Offline Resilience
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Installations in rural farm lands or basements? No problem. Checklists, photos, and serial numbers queue in encrypted local storage and sync automatically when back online.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-indigo-400 flex items-center gap-1">
                    <span>SQLite Safe Storage</span> &rarr;
                  </div>
                </div>

                {/* 5. Live CRM & Dispatch */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/40 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">
                      CRM Pipeline &amp; Material Dispatch
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      View assigned projects, customer contact details, structural BOMs, and dispatches in real-time. Call customers with one tap and track job milestone progress.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-cyan-400 flex items-center gap-1">
                    <span>Live Cloud Synchronization</span> &rarr;
                  </div>
                </div>

                {/* 6. Instant OTA Updates */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/40 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2.5">
                      Seamless Cloud OTA Updates
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Never worry about distributing manual updates again. The app checks for cloud updates on launch and applies the latest features automatically with zero manual steps.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-purple-400 flex items-center gap-1">
                    <span>Over-The-Air Hot Reload</span> &rarr;
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            TAB 2: STEP-BY-STEP INSTALLATION GUIDE (FOR NON-PLAYSTORE APK)
            ===================================================================== */}
        {activeTab === "installation" && (
          <section className="py-16 lg:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">
                  Simple 4-Step Setup
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  How to Install WhereReady Solar OS on Android
                </h2>
                <p className="mt-3 text-slate-400 text-sm sm:text-base">
                  Installing a direct enterprise APK takes less than 60 seconds. Follow these 4 easy steps on your Android device.
                </p>
              </div>

              {/* 4 Installation Step Cards */}
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      Download the Official APK File
                    </h3>
                    <p className="text-sm text-slate-400">
                      Tap the <strong className="text-slate-200">"Download Android APK"</strong> button on your phone or scan the QR code above. Your browser (Chrome, Firefox, or Samsung Internet) will begin downloading <code className="text-blue-400 bg-slate-950 px-2 py-0.5 rounded">WhereReady-Solar-OS.apk</code>.
                    </p>
                  </div>
                  <a
                    href={APK_DIRECT_URL}
                    className="shrink-0 px-4 py-2.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    Start Download &darr;
                  </a>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-blue-400 font-black text-xl flex items-center justify-center shrink-0 border border-slate-700">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      Open Download Notification or File Manager
                    </h3>
                    <p className="text-sm text-slate-400">
                      Once the download is complete, tap the notification at the top of your screen, or open your phone's <strong className="text-slate-200">Files / Downloads</strong> folder and tap the downloaded APK file.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-400 font-black text-xl flex items-center justify-center shrink-0 border border-slate-700">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      Allow "Install from Unknown Sources" (If Prompted)
                    </h3>
                    <p className="text-sm text-slate-400">
                      If Android displays a security warning saying <em>"For your security, your phone is not allowed to install unknown apps from this source"</em>, tap <strong className="text-slate-200">Settings</strong> &rarr; enable <strong className="text-slate-200">"Allow from this source"</strong> &rarr; tap the Back button.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg w-fit">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>This is standard for private enterprise software distributed outside Google Play.</span>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      Tap "Install" &amp; Log In With Your Solar EPC Account
                    </h3>
                    <p className="text-sm text-slate-400">
                      Tap <strong className="text-slate-200">Install</strong>. After 5-10 seconds, tap <strong className="text-slate-200">Open</strong>. Log in with your company email and password to begin managing field operations and CEA testing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            TAB 3: RELEASE NOTES & CHANGELOG
            ===================================================================== */}
        {activeTab === "changelog" && (
          <section className="py-16 lg:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      WhereReady Solar OS v1.1.0 Release Notes
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Released November 2026 • Build Number: 2 • Channel: Preview &amp; Production
                    </p>
                  </div>
                  <a
                    href={APK_DIRECT_URL}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download APK
                  </a>
                </div>

                <div className="mt-8 space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Major New Features &amp; Compliance Upgrades
                    </h4>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Statutory CEA Electrical QA:</strong> Complete verification engine for earth pit resistance (&le; 2.0 &Omega;), DC insulation tests (&ge; 1.0 M&Omega;), and breaker trip timing (&le; 40 ms) matching DISCOM standards.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>5-Geo Proof Handover:</strong> GPS-locked, timestamped photography for Roof, Inverter, Net-Meter, Earth Pit, and Customer Handover with digital touch sign-off.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>DCR Domestic Content Barcode Scanner:</strong> Instant 2D scanner with duplicate serial prevention and MNRE ALMM list verification.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Automatic Startup OTA Reload:</strong> Background update downloader now reloads instantly upon detection, ensuring site crew always has the newest capabilities.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-slate-800">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
                      Performance &amp; Bug Fixes
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span>Resolved CRM pipeline rendering lag with 10x optimized SQLite queries</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span>Enhanced camera focus stability during 2D barcode scanning in low-light environments</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span>Fixed offline photo queue serialization for high-resolution images</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            BOTTOM CTA BANNER
            ===================================================================== */}
        <section className="mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-500/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="max-w-2xl mx-auto relative z-10">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-widest block mb-2">
                Enterprise Field OS
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Empower Every Solar Installer in Your Team Today
              </h2>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Download the APK, distribute it to your supervisors and technicians, and start logging tamper-proof CEA compliant installations instantly.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={APK_DIRECT_URL}
                  download="WhereReady-Solar-OS-v1.1.0.apk"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK Now (54 MB)</span>
                </a>
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>Request Team Demo</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Marketing Footer */}
      <Footer />

      {/* Floating WhatsApp CTA */}
      <WhatsAppCta variant="floating" showCharacterWave={true} />

      {/* Demo Booking Modal */}
      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
}
