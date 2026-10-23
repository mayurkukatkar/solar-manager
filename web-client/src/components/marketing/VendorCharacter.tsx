"use client";

import React from "react";

export type VendorPose =
  | "hook"
  | "chaos"
  | "leads"
  | "quote"
  | "followup"
  | "project"
  | "installation"
  | "chai";

interface VendorCharacterProps {
  pose?: VendorPose;
  size?: number;
  className?: string;
  speechText?: string;
}

export default function VendorCharacter({
  pose = "hook",
  size = 120,
  className = "",
  speechText,
}: VendorCharacterProps) {
  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech / Thought Bubble */}
      {speechText && (
        <div className="mb-3 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-3.5 py-1.5 shadow-md shadow-slate-200/50 text-xs font-bold text-slate-800 text-center whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-300">
          <span>{speechText}</span>
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200/90 rotate-45" />
        </div>
      )}

      {/* Indian Solar Vendor Character SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-label="Indian Solar Vendor Character"
        role="img"
      >
        <defs>
          {/* Subtle Ambient Shadow */}
          <radialGradient id="vendorShadow" cx="70" cy="132" r="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#94A3B8" stopOpacity="0.3" />
            <stop offset="1" stopColor="#94A3B8" stopOpacity="0" />
          </radialGradient>
          {/* Skin Tone Gradient (Warm Indian Wheatish Complexion) */}
          <linearGradient id="skinGrad" x1="50" y1="30" x2="90" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5D0A9" />
            <stop offset="1" stopColor="#E2A76F" />
          </linearGradient>
          {/* Hair & Mustache Dark Tone */}
          <linearGradient id="hairGrad" x1="50" y1="20" x2="90" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E293B" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
          {/* Solar EPC Vest (Vibrant Solar Yellow) */}
          <linearGradient id="vestGrad" x1="40" y1="70" x2="100" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
          {/* Shirt / Kurta Gradient (Crisp Clean White / Soft Blue) */}
          <linearGradient id="shirtGrad" x1="50" y1="70" x2="90" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E2E8F0" />
          </linearGradient>
          {/* Chai Tea Cup Gradient */}
          <linearGradient id="chaiGrad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#D97706" />
            <stop offset="1" stopColor="#92400E" />
          </linearGradient>
        </defs>

        {/* Ground Ambient Shadow */}
        <ellipse cx="70" cy="130" rx="35" ry="6" fill="url(#vendorShadow)" />

        {/* 1. Body & Attire */}
        {/* White Inner Shirt */}
        <path
          d="M 45 78 L 95 78 L 98 126 C 98 128, 42 128, 42 126 Z"
          fill="url(#shirtGrad)"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Solar EPC Fluorescent Safety Jacket / Vest */}
        <path
          d="M 44 78 L 60 78 L 62 124 L 42 124 Z"
          fill="url(#vestGrad)"
          stroke="#0F172A"
          strokeWidth="2"
        />
        <path
          d="M 96 78 L 80 78 L 78 124 L 98 124 Z"
          fill="url(#vestGrad)"
          stroke="#0F172A"
          strokeWidth="2"
        />
        {/* Reflective Silver Stripes on Vest */}
        <line x1="43" y1="96" x2="61" y2="96" stroke="#FFFFFF" strokeWidth="2.5" />
        <line x1="79" y1="96" x2="97" y2="96" stroke="#FFFFFF" strokeWidth="2.5" />

        {/* Shirt Collar */}
        <path d="M 58 78 L 70 90 L 82 78" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />

        {/* 2. Head & Facial Features */}
        {/* Ears */}
        <circle cx="46" cy="52" r="5" fill="url(#skinGrad)" stroke="#0F172A" strokeWidth="2" />
        <circle cx="94" cy="52" r="5" fill="url(#skinGrad)" stroke="#0F172A" strokeWidth="2" />

        {/* Face */}
        <ellipse cx="70" cy="52" rx="24" ry="26" fill="url(#skinGrad)" stroke="#0F172A" strokeWidth="2.5" />

        {/* Classic Neatly Trimmed Mustache (Recognizable Indian Vendor Aesthetic) */}
        <path
          d="M 58 63 Q 66 61 70 65 Q 74 61 82 63 Q 76 69 70 66 Q 64 69 58 63 Z"
          fill="url(#hairGrad)"
          stroke="#0F172A"
          strokeWidth="1.2"
        />

        {/* Hair (Neat Side Parting) */}
        <path
          d="M 46 45 C 45 28, 95 24, 94 45 C 90 32, 54 32, 46 45 Z"
          fill="url(#hairGrad)"
          stroke="#0F172A"
          strokeWidth="2"
        />

        {/* POSE-SPECIFIC EXPRESSIONS & ARMS */}

        {/* ===================================================================
            POSE 1: HOOK (Confident & Attentive)
            =================================================================== */}
        {pose === "hook" && (
          <g>
            {/* Confident Eyes */}
            <ellipse cx="61" cy="48" rx="2.5" ry="3" fill="#0F172A" />
            <circle cx="60" cy="47" r="0.8" fill="#FFFFFF" />
            <ellipse cx="79" cy="48" rx="2.5" ry="3" fill="#0F172A" />
            <circle cx="78" cy="47" r="0.8" fill="#FFFFFF" />
            {/* Focused Eyebrows */}
            <path d="M 56 42 Q 62 40 66 42" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <path d="M 74 42 Q 78 40 84 42" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            {/* Smile under mustache */}
            <path d="M 65 69 Q 70 72 75 69" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />

            {/* Arms folded confidently */}
            <path d="M 43 85 Q 55 102 70 100 Q 85 102 97 85" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* ===================================================================
            POSE 2: CHAOS (Overwhelmed with sweating & juggling phone)
            =================================================================== */}
        {pose === "chaos" && (
          <g>
            {/* Stressed Eyes (Wide & Panicked) */}
            <ellipse cx="61" cy="48" rx="3.5" ry="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
            <circle cx="61" cy="48" r="2" fill="#0F172A" />
            <ellipse cx="79" cy="48" rx="3.5" ry="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
            <circle cx="79" cy="48" r="2" fill="#0F172A" />
            {/* Stressed Worried Eyebrows */}
            <path d="M 55 39 Q 61 43 65 41" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 75 41 Q 79 43 85 39" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
            {/* Worried Wavy Mouth */}
            <path d="M 64 71 Q 70 67 76 71" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

            {/* Stress Sweat Drop */}
            <path d="M 93 40 Q 97 45 93 49 Q 89 45 93 40 Z" fill="#60A5FA" />

            {/* Left Arm holding ringing phone to ear */}
            <path d="M 42 85 Q 30 75 38 52" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
            <rect x="33" y="45" width="8" height="15" rx="2" fill="#0F172A" transform="rotate(-15 33 45)" />

            {/* Right Arm waving wildly with paper */}
            <path d="M 98 85 Q 112 70 118 55" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
            <rect x="112" y="45" width="16" height="20" rx="2" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" transform="rotate(12 112 45)" />
            <line x1="115" y1="52" x2="124" y2="52" stroke="#EF4444" strokeWidth="1.2" />
            <line x1="115" y1="57" x2="122" y2="57" stroke="#EF4444" strokeWidth="1.2" />
          </g>
        )}

        {/* ===================================================================
            POSE 3: LEADS (Relief watching enquiries flow into pipeline)
            =================================================================== */}
        {pose === "leads" && (
          <g>
            {/* Pleasant Happy Eyes */}
            <path d="M 57 48 Q 61 44 65 48" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 75 48 Q 79 44 83 48" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Relieved Eyebrows */}
            <path d="M 56 41 Q 61 39 66 41" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 74 41 Q 79 39 84 41" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
            {/* Satisfied Smile */}
            <path d="M 64 69 Q 70 74 76 69" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

            {/* Hands pointing to organized pipeline */}
            <path d="M 42 85 Q 52 98 62 92" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 98 85 Q 110 90 120 85" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* ===================================================================
            POSE 4: QUOTE (Proudly presenting 60s Luxury Proposal)
            =================================================================== */}
        {pose === "quote" && (
          <g>
            <ellipse cx="61" cy="48" rx="2.5" ry="3" fill="#0F172A" />
            <ellipse cx="79" cy="48" rx="2.5" ry="3" fill="#0F172A" />
            <path d="M 64 69 Q 70 74 76 69" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

            {/* Holding Proposal Folder */}
            <path d="M 42 85 Q 52 95 65 92" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 98 85 Q 106 94 116 88" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <rect x="108" y="75" width="22" height="28" rx="3" fill="#2563EB" stroke="#0F172A" strokeWidth="1.8" />
            <rect x="112" y="80" width="14" height="4" rx="1" fill="#FFFFFF" />
            <rect x="112" y="87" width="10" height="3" rx="1" fill="#93C5FD" />
          </g>
        )}

        {/* ===================================================================
            POSE 5: FOLLOWUP (In control with reminder checklist)
            =================================================================== */}
        {pose === "followup" && (
          <g>
            <ellipse cx="61" cy="48" rx="2.5" ry="3" fill="#0F172A" />
            <ellipse cx="79" cy="48" rx="2.5" ry="3" fill="#0F172A" />
            <path d="M 64 69 Q 70 73 76 69" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

            {/* Holding Smartphone with green checkmark */}
            <path d="M 98 85 Q 104 92 108 85" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <rect x="104" y="70" width="16" height="26" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="112" cy="81" r="4" fill="#10B981" />
            <path d="M 110 81 L 111.5 82.5 L 114 80" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* ===================================================================
            POSE 6: PROJECT (Directing operations with clear execution plan)
            =================================================================== */}
        {pose === "project" && (
          <g>
            <ellipse cx="61" cy="48" rx="2.5" ry="3" fill="#0F172A" />
            <ellipse cx="79" cy="48" rx="2.5" ry="3" fill="#0F172A" />
            <path d="M 64 69 Q 70 73 76 69" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

            {/* Safety Helmet on Head */}
            <path d="M 45 42 C 45 22, 95 22, 95 42 Z" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
            <rect x="42" y="40" width="56" height="4" rx="2" fill="#D97706" />

            {/* Thumbs up */}
            <path d="M 98 85 Q 108 82 114 78" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="115" cy="76" r="4" fill="url(#skinGrad)" stroke="#0F172A" strokeWidth="1.5" />
          </g>
        )}

        {/* ===================================================================
            POSE 7: INSTALLATION (Checking tablet site milestone)
            =================================================================== */}
        {pose === "installation" && (
          <g>
            <ellipse cx="61" cy="50" rx="2.5" ry="3" fill="#0F172A" />
            <ellipse cx="79" cy="50" rx="2.5" ry="3" fill="#0F172A" />
            <path d="M 64 69 Q 70 74 76 69" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

            {/* Holding Tablet with live progress bar */}
            <path d="M 42 85 Q 56 95 65 92" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 98 85 Q 84 95 75 92" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <rect x="52" y="85" width="36" height="26" rx="4" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.8" />
            <rect x="56" y="94" width="28" height="4" rx="2" fill="#334155" />
            <rect x="56" y="94" width="22" height="4" rx="2" fill="#10B981" />
            <text x="56" y="104" fill="#38BDF8" fontSize="6" fontWeight="bold">NET-METER ✓</text>
          </g>
        )}

        {/* ===================================================================
            POSE 8: CHAI (The ultimate emotional payoff: vendor relaxed with hot cutting chai!)
            =================================================================== */}
        {pose === "chai" && (
          <g>
            {/* Relaxed Blissful Eyes (Curved happy lines) */}
            <path d="M 57 48 Q 61 43 65 48" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 75 48 Q 79 43 83 48" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Relaxed Happy Smile */}
            <path d="M 63 69 Q 70 76 77 69" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

            {/* Left Hand comfortably resting on waist/lap */}
            <path d="M 42 85 Q 35 98 46 108" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />

            {/* Right Hand holding the iconic Indian glass tea cup */}
            <path d="M 98 85 Q 106 95 102 104" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            
            {/* Traditional Indian Cutting Chai Glass */}
            <g transform="translate(100, 92)">
              {/* Glass body */}
              <path d="M 0 6 L 3 20 L 15 20 L 18 6 Z" fill="#E2E8F0" fillOpacity="0.8" stroke="#0F172A" strokeWidth="1.5" />
              {/* Hot Cardamom Chai liquid */}
              <path d="M 1 9 L 3 19 L 15 19 L 17 9 Z" fill="url(#chaiGrad)" />
              {/* Glass rim */}
              <ellipse cx="9" cy="6" rx="9" ry="2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />

              {/* Rising Hot Tea Steam (Animated with subtle keyframes) */}
              <path d="M 6 3 Q 4 -2 7 -6" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" className="animate-pulse" />
              <path d="M 12 3 Q 14 -3 11 -7" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" className="animate-pulse" />
            </g>

            {/* Sparkling calmness stars */}
            <path d="M 32 35 L 34 38 L 37 38 L 35 40 L 36 43 L 32 41 L 28 43 L 29 40 L 27 38 L 30 38 Z" fill="#F59E0B" />
            <path d="M 112 30 L 113 32 L 116 32 L 114 34 L 115 36 L 112 34 L 109 36 L 110 34 L 108 32 L 111 32 Z" fill="#F59E0B" />
          </g>
        )}
      </svg>
    </div>
  );
}
