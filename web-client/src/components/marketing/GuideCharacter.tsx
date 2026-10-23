"use client";

import React from "react";

export type CharacterPose =
  | "wave"
  | "point-right"
  | "inspect"
  | "celebrate"
  | "guide"
  | "mini";

interface GuideCharacterProps {
  pose?: CharacterPose;
  size?: number;
  className?: string;
  speechText?: string;
}

export default function GuideCharacter({
  pose = "wave",
  size = 96,
  className = "",
  speechText,
}: GuideCharacterProps) {
  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Optional Speech / Thought Bubble */}
      {speechText && (
        <div className="mb-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-3 py-1.5 shadow-md shadow-slate-200/60 text-[11px] font-semibold text-slate-800 text-center whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-300">
          <span>{speechText}</span>
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200/90 rotate-45" />
        </div>
      )}

      {/* 2D Original Vector Character (WhereReady Solar Guide) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-label="WhereReady Solar Guide"
        role="img"
      >
        <defs>
          {/* Subtle Ambient Radial Glow */}
          <radialGradient id="guideGlow" cx="60" cy="60" r="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93C5FD" stopOpacity="0.35" />
            <stop offset="1" stopColor="#93C5FD" stopOpacity="0" />
          </radialGradient>
          {/* WhereReady Blue Gradient */}
          <linearGradient id="guideBodyGrad" x1="40" y1="50" x2="80" y2="105" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
          {/* Solar Yellow Visor / Sun Beam Accent */}
          <linearGradient id="guideSunGrad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FDE68A" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Ambient shadow / ground ellipse */}
        <ellipse cx="60" cy="112" rx="24" ry="4" fill="#E2E8F0" />

        {/* Head Halo / Glow */}
        <circle cx="60" cy="55" r="42" fill="url(#guideGlow)" />

        {/* 1. Character Body (Rounded Approachable Silhouette) */}
        <path
          d="M 40 68 C 40 56, 80 56, 80 68 L 84 96 C 84 102, 36 102, 36 96 Z"
          fill="url(#guideBodyGrad)"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* White Collar / Chest Harness */}
        <path
          d="M 48 64 L 60 76 L 72 64"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Solar Core Badge (Small Solar-Yellow Accent) */}
        <circle cx="60" cy="84" r="6" fill="url(#guideSunGrad)" stroke="#B45309" strokeWidth="1.5" />
        <circle cx="60" cy="84" r="2.5" fill="#FFFFFF" />

        {/* 2. Character Head (Smooth Rounded Dome) */}
        <rect
          x="38"
          y="24"
          width="44"
          height="40"
          rx="20"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.5"
        />

        {/* Solar-Yellow Guide Cap / Top Visor (Solar Accent) */}
        <path
          d="M 38 40 C 38 27, 82 27, 82 40 Z"
          fill="url(#guideSunGrad)"
          stroke="#0F172A"
          strokeWidth="2"
        />
        {/* Antenna / Sun ray beacon */}
        <line x1="60" y1="24" x2="60" y2="15" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="13" r="3.5" fill="#F59E0B" stroke="#0F172A" strokeWidth="1.5" />

        {/* Minimal Approachable Facial Features */}
        {/* Left Eye */}
        <ellipse cx="50" cy="46" rx="3.5" ry="4.5" fill="#0F172A" />
        <circle cx="48.5" cy="44.5" r="1.2" fill="#FFFFFF" />
        {/* Right Eye */}
        <ellipse cx="70" cy="46" rx="3.5" ry="4.5" fill="#0F172A" />
        <circle cx="68.5" cy="44.5" r="1.2" fill="#FFFFFF" />

        {/* Gentle Friendly Smile */}
        <path
          d="M 54 53 Q 60 58 66 53"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheerful Blush Accents */}
        <circle cx="43" cy="51" r="3" fill="#FCA5A5" fillOpacity="0.45" />
        <circle cx="77" cy="51" r="3" fill="#FCA5A5" fillOpacity="0.45" />

        {/* 3. Pose-Specific Arms & Gestures */}

        {/* POSE A: WAVE (Hero & WhatsApp CTA greeting) */}
        {pose === "wave" && (
          <g>
            {/* Left resting arm */}
            <path
              d="M 39 70 Q 30 82 34 94"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="34" cy="94" r="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />

            {/* Right waving arm (with smooth CSS oscillation) */}
            <g className="origin-[80px_70px] animate-[characterWave_2.2s_ease-in-out_infinite]">
              <path
                d="M 81 70 Q 94 56 98 42"
                stroke="#0F172A"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Friendly open waving palm */}
              <circle cx="98" cy="42" r="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
              {/* Wave motion sparkle */}
              <path
                d="M 106 38 L 109 35 M 104 31 L 105 27 M 99 29 L 97 26"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </g>
        )}

        {/* POSE B: POINT RIGHT (Directing to dashboard or proposal) */}
        {pose === "point-right" && (
          <g>
            {/* Left arm resting */}
            <path
              d="M 39 70 Q 30 80 34 92"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="34" cy="92" r="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />

            {/* Right arm extended pointing right */}
            <path
              d="M 81 70 L 108 66"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Pointing hand with extended index */}
            <rect x="105" y="62" width="10" height="7" rx="3" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
            <line x1="114" y1="65" x2="119" y2="65" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* POSE C: INSPECT (Holding site survey clipboard / analyzing) */}
        {pose === "inspect" && (
          <g>
            {/* Left hand holding board */}
            <path
              d="M 39 70 Q 48 80 54 84"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right hand pointing on board */}
            <path
              d="M 81 70 Q 72 80 66 84"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Clipboard Graphic */}
            <g transform="translate(48, 72)">
              <rect x="0" y="0" width="24" height="30" rx="3" fill="#FEF3C7" stroke="#0F172A" strokeWidth="1.8" />
              <rect x="7" y="-3" width="10" height="4" rx="1.5" fill="#0F172A" />
              <line x1="4" y1="7" x2="20" y2="7" stroke="#3B82F6" strokeWidth="1.5" />
              <line x1="4" y1="13" x2="18" y2="13" stroke="#94A3B8" strokeWidth="1.2" />
              <line x1="4" y1="18" x2="16" y2="18" stroke="#94A3B8" strokeWidth="1.2" />
              <line x1="4" y1="23" x2="12" y2="23" stroke="#10B981" strokeWidth="1.5" />
            </g>
          </g>
        )}

        {/* POSE D: CELEBRATE (Commissioning complete / installation handover) */}
        {pose === "celebrate" && (
          <g>
            {/* Left arm raised high */}
            <path
              d="M 39 70 Q 24 52 20 38"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="20" cy="38" r="4.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />

            {/* Right arm raised high */}
            <path
              d="M 81 70 Q 96 52 100 38"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="100" cy="38" r="4.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />

            {/* Celebration Stars */}
            <path d="M 12 28 L 14 33 L 19 33 L 15 36 L 17 41 L 12 38 L 7 41 L 9 36 L 5 33 L 10 33 Z" fill="#F59E0B" />
            <path d="M 108 26 L 110 30 L 114 30 L 111 33 L 112 37 L 108 34 L 104 37 L 105 33 L 102 30 L 106 30 Z" fill="#F59E0B" />
          </g>
        )}

        {/* POSE E: GUIDE (Open hands presenting the workflow) */}
        {pose === "guide" && (
          <g>
            {/* Left arm presenting forward */}
            <path
              d="M 39 70 Q 28 78 24 86"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M 20 86 Q 24 82 28 86" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />

            {/* Right arm welcoming */}
            <path
              d="M 81 70 Q 96 76 102 84"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M 98 84 Q 102 80 106 84" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
          </g>
        )}

        {/* POSE F: MINI (Compact head & collar for badges/buttons) */}
        {pose === "mini" && null}
      </svg>
    </div>
  );
}
