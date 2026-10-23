"use client";

import React, { useState } from "react";
import Navbar from "@/components/marketing/Navbar";
import ProductStoryFilm from "@/components/marketing/ProductStoryFilm";
import QuotationScene from "@/components/marketing/QuotationScene";
import ProductExperienceScene from "@/components/marketing/ProductExperienceScene";
import PricingScene from "@/components/marketing/PricingScene";
import TrustSecuritySection from "@/components/marketing/TrustSecuritySection";
import FaqSection from "@/components/marketing/FaqSection";
import Footer from "@/components/marketing/Footer";
import DemoModal from "@/components/marketing/DemoModal";
import WhatsAppCta from "@/components/marketing/WhatsAppCta";
import { ChevronDown } from "lucide-react";

export default function HomePage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const handleOpenDemo = () => {
    setDemoModalOpen(true);
  };

  const handleCloseDemo = () => {
    setDemoModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-blue-600 selection:text-white antialiased">
      {/* Navigation Bar */}
      <Navbar onOpenDemo={handleOpenDemo} />

      <main>
        {/* =====================================================================
            PRIMARY VISUAL NARRATIVE: 7-SCENE ANIMATED PRODUCT FILM
            (85-90% Visual Storytelling / 10-15% Essential Text / No Card Grids)
            ===================================================================== */}
        <ProductStoryFilm onOpenDemo={handleOpenDemo} />

        {/* =====================================================================
            SECONDARY DEEP-DIVE SECTIONS (BELOW THE PRIMARY VISUAL NARRATIVE)
            "Keep pricing, detailed features, legal information and FAQs on
             secondary pages or below the primary visual narrative. Preserve
             existing working product features, quotation calculations, forms."
            ===================================================================== */}
        <div id="details-section" className="border-t border-slate-200 bg-slate-50/60 pt-16 pb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              Specifications, Pricing &amp; Simulator
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Explore the Working Software &amp; Commercials
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              Configure proposal economics with accurate PM Surya Ghar subsidies, inspect live SaaS modules, and review transparent subscription plans.
            </p>
          </div>

          {/* Working Interactive Proposal Simulator */}
          <QuotationScene onOpenDemo={handleOpenDemo} />

          {/* Real SaaS Tenant Platform Views */}
          <ProductExperienceScene />

          {/* Predictable Commercials & Plans */}
          <PricingScene onOpenDemo={handleOpenDemo} />

          {/* DPDP 2023 & Tenant Isolation Safeguards */}
          <TrustSecuritySection />

          {/* Frequently Asked Questions Accordion */}
          <FaqSection />
        </div>
      </main>

      {/* Minimal Footer with Verified Company Information */}
      <Footer />

      {/* Floating Verified WhatsApp CTA */}
      <WhatsAppCta variant="floating" showCharacterWave={true} />

      {/* Global Demo Booking Modal */}
      <DemoModal isOpen={demoModalOpen} onClose={handleCloseDemo} />
    </div>
  );
}
