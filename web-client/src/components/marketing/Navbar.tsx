"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Menu, X, ArrowRight, Phone, ShieldCheck, ChevronRight } from "lucide-react";

interface NavbarProps {
  onOpenDemo?: () => void;
}

export default function Navbar({ onOpenDemo }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Workflow", href: "#workflow" },
    { label: "Quotation Demo", href: "#proposal-demo" },
    { label: "Pricing", href: "#pricing" },
    { label: "Trust & Security", href: "#security" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20 py-3"
            : "bg-slate-950/60 backdrop-blur-sm border-b border-slate-800/40 py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Lockup */}
            <Link href="/" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-500" />
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

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-1 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full" />
                </a>
              ))}
            </nav>

            {/* Right CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={onOpenDemo}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg shadow-md shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>Book a Free Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={onOpenDemo}
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg"
              >
                Book Demo
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-6 mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-base font-medium text-slate-200 hover:bg-slate-900 rounded-lg flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800"
              >
                Existing Customer? Sign In
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenDemo) onOpenDemo();
                }}
                className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg text-center flex items-center justify-center gap-2 shadow-md shadow-blue-600/30"
              >
                <span>Book a Free Live Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://wa.me/919890000000?text=Hello%20WhereReady%20Solar%20OS%20team,%20I%20would%20like%20to%20learn%20more%20about%20the%20software%20for%20my%20solar%20business."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 text-sm font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-center flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
