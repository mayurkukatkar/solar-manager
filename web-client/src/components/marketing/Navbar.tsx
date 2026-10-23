"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Menu, X, ArrowRight, ArrowUpRight, Phone, ChevronRight } from "lucide-react";

interface NavbarProps {
  onOpenDemo?: () => void;
}

export default function Navbar({ onOpenDemo }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Workflow", href: "#workflow" },
    { label: "Proposal Studio", href: "#proposal-demo" },
    { label: "Platform View", href: "#product-view" },
    { label: "Why WhereReady", href: "#benefits" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs py-3"
            : "bg-white/70 backdrop-blur-xs border-b border-slate-100/60 py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Lockup */}
            <Link href="/" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-400 p-0.5 shadow-sm group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-45 transition-transform duration-500" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    WhereReady
                  </span>
                  <span className="font-extrabold text-lg text-blue-600">
                    Solar OS
                  </span>
                </div>
                <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                  Where Growth Gets Ready
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-1 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full" />
                </a>
              ))}
            </nav>

            {/* Right CTAs */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-full hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={onOpenDemo}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>Book a Demo</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={onOpenDemo}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-full"
              >
                <span>Demo</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-3 pb-6 mt-2 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200"
              >
                Existing Customer? Sign In
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenDemo) onOpenDemo();
                }}
                className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full text-center flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Book a Free Live Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://wa.me/919270201883?text=Hi%20WhereReady%2C%20I'd%20like%20to%20learn%20more%20about%20WhereReady%20Solar%20OS%20and%20book%20a%20demo."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-center flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Chat on WhatsApp (9270201883)</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
