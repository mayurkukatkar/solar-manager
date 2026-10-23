"use client";

import React from "react";
import Link from "next/link";
import { Sun, Mail, Phone, MapPin, ShieldCheck, ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-700 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-400 p-0.5 shadow-2xs">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Sun className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    WhereReady
                  </span>
                  <span className="font-extrabold text-base text-blue-600">
                    Solar OS
                  </span>
                </div>
                <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
                  Where Growth Gets Ready
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              The operating system for Indian rooftop solar EPCs and installers. From first utility bill scan to DISCOM net-metering and serialized inventory.
            </p>

            <div className="pt-1 text-[11px] text-slate-400 leading-relaxed">
              <p>
                <strong className="text-slate-600">Notice:</strong> WhereReady Solar OS is specialized business software developed by WhereReady. WhereReady is not a solar panel manufacturer or EPC installer.
              </p>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Product</p>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <a href="#workflow" className="hover:text-blue-600 transition-colors">
                  7-Stage Workflow
                </a>
              </li>
              <li>
                <a href="#proposal-demo" className="hover:text-blue-600 transition-colors">
                  Quotation Simulator
                </a>
              </li>
              <li>
                <a href="#product-view" className="hover:text-blue-600 transition-colors">
                  Platform View
                </a>
              </li>
              <li>
                <a href="#benefits" className="hover:text-blue-600 transition-colors">
                  Why WhereReady
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-blue-600 transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Customer Sign In →
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal &amp; Trust</p>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                  Privacy Policy (DPDP 2023)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-blue-600 transition-colors">
                  Tenant Data Security
                </Link>
              </li>
              <li>
                <a href="#security" className="hover:text-blue-600 transition-colors">
                  Multi-Tenant Isolation
                </a>
              </li>
              <li>
                <span className="text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Indian GST ITC Compliant
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Connect</p>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <a href="mailto:support@whereready.com" className="hover:text-blue-600">
                  support@whereready.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <a
                  href="https://wa.me/919890000000?text=Hello%20WhereReady%20Solar%20OS%20team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  WhatsApp: +91 98900 00000
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Pune / Mumbai, Maharashtra</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} WhereReady. All rights reserved. WhereReady Solar OS.</p>
          <p className="text-[11px]">
            Designed with precision for India&apos;s rooftop solar builders.
          </p>
        </div>

      </div>
    </footer>
  );
}
