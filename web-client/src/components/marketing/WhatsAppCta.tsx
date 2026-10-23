"use client";

import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import GuideCharacter from "./GuideCharacter";

export const VERIFIED_WHATSAPP_NUMBER = "9270201883";
export const VERIFIED_WHATSAPP_URL =
  "https://wa.me/919270201883?text=Hi%20WhereReady%2C%20I'd%20like%20to%20learn%20more%20about%20WhereReady%20Solar%20OS%20and%20book%20a%20demo.";

interface WhatsAppCtaProps {
  label?: string;
  variant?: "button" | "pill" | "floating" | "minimal";
  showCharacterWave?: boolean;
  className?: string;
  customMessage?: string;
}

export default function WhatsAppCta({
  label = "Chat on WhatsApp",
  variant = "button",
  showCharacterWave = false,
  className = "",
  customMessage,
}: WhatsAppCtaProps) {
  const [isHovered, setIsHovered] = useState(false);

  const targetUrl = customMessage
    ? `https://wa.me/919270201883?text=${encodeURIComponent(customMessage)}`
    : VERIFIED_WHATSAPP_URL;

  // Custom SVG WhatsApp icon for crisp 2D vector appearance
  const WhatsAppIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      className="shrink-0 transition-transform duration-200 ease-out group-hover:rotate-12 group-hover:scale-110"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.98-1.028 1.281-.25.301-.502.326-.803.176-.301-.15-1.272-.469-2.424-1.496-.895-.798-1.5-1.784-1.676-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.502.101-.2.05-.376-.025-.527-.075-.15-.677-1.63-.928-2.232-.244-.587-.492-.507-.677-.517-.175-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376-.276.301-1.054 1.029-1.054 2.509s1.079 2.91 1.23 3.111c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.378.197 1.897.12.578-.087 1.78-.727 2.031-1.43.25-.702.25-1.304.175-1.43-.075-.125-.276-.201-.577-.351z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.982-1.408C8.423 21.497 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.624 0-3.13-.482-4.4-1.31l-.315-.205-3.266.924.939-3.18-.21-.334C3.844 14.77 3.333 13.435 3.333 12c0-4.779 3.888-8.667 8.667-8.667 4.779 0 8.667 3.888 8.667 8.667 0 4.779-3.888 8.667-8.667 8.667z" />
    </svg>
  );

  // Variant A: Floating Docked Widget (Right corner)
  if (variant === "floating") {
    return (
      <aside
        aria-label="Direct WhatsApp Contact"
        className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 print:hidden"
      >
        {/* Friendly mascot greeting on hover / gentle presence */}
        {showCharacterWave && isHovered && (
          <div className="hidden sm:flex items-center gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
            <GuideCharacter pose="wave" size={54} speechText="Direct WhatsApp support!" />
          </div>
        )}

        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group whatsapp-cta-interactive flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-full shadow-lg shadow-emerald-600/30 border border-emerald-500/80 cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-emerald-500"
          aria-label="Chat on WhatsApp with WhereReady (9270201883)"
        >
          <WhatsAppIcon />
          <span className="font-semibold tracking-tight">{label}</span>
          <ArrowUpRight className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </aside>
    );
  }

  // Variant B: Standard Inline Button (for scenes and sections)
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Optional Character Wave floating accent */}
      {showCharacterWave && (
        <div className="absolute -top-12 -left-8 hidden sm:block pointer-events-none">
          <GuideCharacter pose="wave" size={48} />
        </div>
      )}

      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group whatsapp-cta-interactive inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-300/80 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all"
        aria-label="Chat on WhatsApp with WhereReady (9270201883)"
      >
        <div className="text-emerald-600">
          <WhatsAppIcon />
        </div>
        <span>{label}</span>
        <ArrowUpRight className="w-4 h-4 text-emerald-600 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </div>
  );
}
