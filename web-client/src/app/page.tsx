"use client";

import React, { useState } from "react";
import Navbar from "@/components/marketing/Navbar";
import HeroScene from "@/components/marketing/HeroScene";
import ProblemScene from "@/components/marketing/ProblemScene";
import WorkflowScene from "@/components/marketing/WorkflowScene";
import QuotationScene from "@/components/marketing/QuotationScene";
import ProductExperienceScene from "@/components/marketing/ProductExperienceScene";
import BenefitsScene from "@/components/marketing/BenefitsScene";
import PricingScene from "@/components/marketing/PricingScene";
import TrustSecuritySection from "@/components/marketing/TrustSecuritySection";
import FaqSection from "@/components/marketing/FaqSection";
import FinalCtaScene from "@/components/marketing/FinalCtaScene";
import Footer from "@/components/marketing/Footer";
import DemoModal from "@/components/marketing/DemoModal";

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
        {/* Scene 1: Opening — A solar business begins */}
        <HeroScene onOpenDemo={handleOpenDemo} />

        {/* Scene 2: The problem — Disconnected work */}
        <ProblemScene />

        {/* Scene 3: The transformation — One connected workflow */}
        <WorkflowScene />

        {/* Scene 4: The quotation experience */}
        <QuotationScene onOpenDemo={handleOpenDemo} />

        {/* Scene 5: The product experience */}
        <ProductExperienceScene />

        {/* Scene 6: Benefits — Three spacious visual moments */}
        <BenefitsScene />

        {/* Scene 7: Pricing — A plan that fits your next stage */}
        <PricingScene onOpenDemo={handleOpenDemo} />

        {/* Trust & DPDP 2023 Security Safeguards */}
        <TrustSecuritySection />

        {/* Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* Scene 8: Final CTA — Sunlit installation & WhatsApp connect */}
        <FinalCtaScene onOpenDemo={handleOpenDemo} />
      </main>

      {/* Minimal Footer */}
      <Footer />

      {/* Global Demo Booking Modal */}
      <DemoModal isOpen={demoModalOpen} onClose={handleCloseDemo} />
    </div>
  );
}
