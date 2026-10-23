"use client";

import React, { useState } from "react";
import Navbar from "@/components/marketing/Navbar";
import HeroSection from "@/components/marketing/HeroSection";
import ProblemSolutionSection from "@/components/marketing/ProblemSolutionSection";
import InteractiveProposalDemo from "@/components/marketing/InteractiveProposalDemo";
import WorkflowSection from "@/components/marketing/WorkflowSection";
import FeaturesSection from "@/components/marketing/FeaturesSection";
import PricingSection from "@/components/marketing/PricingSection";
import TrustSecuritySection from "@/components/marketing/TrustSecuritySection";
import FaqSection from "@/components/marketing/FaqSection";
import DemoBookingSection from "@/components/marketing/DemoBookingSection";
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
    <div className="min-h-screen bg-slate-950 text-white font-['Plus_Jakarta_Sans',sans-serif] selection:bg-blue-500 selection:text-white antialiased">
      {/* Navigation Bar */}
      <Navbar onOpenDemo={handleOpenDemo} />

      {/* Main Marketing Sections */}
      <main>
        {/* Hero Section */}
        <HeroSection onOpenDemo={handleOpenDemo} />

        {/* Problem vs Solution Contrast */}
        <ProblemSolutionSection />

        {/* Flagship Interactive Proposal Engine & Simulator */}
        <InteractiveProposalDemo onOpenDemo={handleOpenDemo} />

        {/* End-to-End 8-Stage Solar EPC Lifecycle */}
        <WorkflowSection />

        {/* Core Capabilities & Feature Deep-Dive */}
        <FeaturesSection />

        {/* Transparent EPC Pricing & ROI */}
        <PricingSection onOpenDemo={handleOpenDemo} />

        {/* DPDP 2023 Compliance & Tenant Security */}
        <TrustSecuritySection />

        {/* FAQ Accordion */}
        <FaqSection />

        {/* High-Converting Lead Capture & Demo Form */}
        <DemoBookingSection />
      </main>

      {/* Enterprise Footer */}
      <Footer />

      {/* Global Demo Booking Modal */}
      <DemoModal isOpen={demoModalOpen} onClose={handleCloseDemo} />
    </div>
  );
}
