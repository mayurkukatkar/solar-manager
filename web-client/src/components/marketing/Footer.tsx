"use client";

import React from "react";
import Link from "next/link";
import { Sun, Mail, Phone, MapPin, ShieldCheck, ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-400 p-0.5 shadow-md shadow-blue-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                    WhereReady
                  </span>
                  <span className="bg-gradient-to-r from-blue-400 to-amber-300 bg-clip-text text-transparent font-black text-lg">
                    Solar OS
                  </span>
                </div>
                <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                  Where Growth Gets Ready
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              The unified operating system for India&apos;s solar EPCs, rooftop installers, and solar contractors. From lead capture and 60-second magazine proposals to DISCOM net-metering and serialized inventory.
            </p>

            <div className="pt-2 text-xs text-slate-500 leading-relaxed">
              <p>
                <strong className="text-slate-400">Important Notice:</strong> WhereReady Solar OS is specialized business software developed by WhereReady. WhereReady is not a solar panel manufacturer, EPC installation company, or government authority.
              </p>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Product</p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Core Features
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-white transition-colors">
                  8-Stage Solar Workflow
                </a>
              </li>
              <li>
                <a href="#proposal-demo" className="hover:text-white transition-colors">
                  Quotation Simulator
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing &amp; Plans
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Customer Sign In →
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Trust */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Legal &amp; Trust</p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy (DPDP 2023)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-white transition-colors">
                  Tenant Data Security
                </Link>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">
                  Multi-Tenant Isolation
                </a>
              </li>
              <li>
                <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Indian GST Compliant
                </span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Connect</p>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <a href="mailto:support@whereready.com" className="hover:text-white">
                  support@whereready.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <a
                  href="https://wa.me/919890000000?text=Hello%20WhereReady%20Solar%20OS%20team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp: +91 98900 00000
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Pune / Mumbai, Maharashtra, India</span>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href="#book-demo"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
              >
                <span>Request Free Demo</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} WhereReady. All rights reserved. WhereReady Solar OS.</p>
          <p className="text-[11px]">
            Designed with precision for India&apos;s clean energy builders.
          </p>
        </div>
      </div>
    </footer>
  );
}
