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
import WhatsAppCta from "@/components/marketing/WhatsAppCta";

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
        {/* Scene 1: Understand — "Run your entire solar business. In one place." */}
        <HeroScene onOpenDemo={handleOpenDemo} />

        {/* Scene 2: Recognize the problem — "Leads, quotations and projects shouldn't live in different places." */}
        <ProblemScene />

        {/* Scene 3: See the solution — "One connected workflow. From enquiry to installation." */}
        <WorkflowScene onOpenDemo={handleOpenDemo} />

        {/* Scene 4: Experience the product — "Create proposals. Track progress. Keep work moving." */}
        <QuotationScene onOpenDemo={handleOpenDemo} />
        <ProductExperienceScene />

        {/* Supporting Trust & Operational Simplicity Moments */}
        <BenefitsScene />

        {/* Predictable Commercials & Plans */}
        <PricingScene onOpenDemo={handleOpenDemo} />

        {/* Trust & DPDP 2023 Security Safeguards */}
        <TrustSecuritySection />

        {/* Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* Scene 5: Convert / Take action — "Ready to bring your solar business into sync?" */}
        <FinalCtaScene onOpenDemo={handleOpenDemo} />
      </main>

      {/* Minimal Footer with Verified Company Information */}
      <Footer />

      {/* Floating Verified WhatsApp CTA (Item 1 in brief) */}
      <WhatsAppCta variant="floating" showCharacterWave={true} />

      {/* Global Demo Booking Modal */}
      <DemoModal isOpen={demoModalOpen} onClose={handleCloseDemo} />
    </div>
  );
}
