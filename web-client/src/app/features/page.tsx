import React from "react";
import Navbar from "@/components/marketing/Navbar";
import FeaturesSection from "@/components/marketing/FeaturesSection";
import InteractiveProposalDemo from "@/components/marketing/InteractiveProposalDemo";
import WorkflowSection from "@/components/marketing/WorkflowSection";
import DemoBookingSection from "@/components/marketing/DemoBookingSection";
import Footer from "@/components/marketing/Footer";

export const metadata = {
  title: "Features & Capabilities | WhereReady Solar OS",
  description: "Explore all modules of WhereReady Solar OS: Bill OCR, 6-page proposals, DISCOM net-metering, serialized inventory, and PM Surya Ghar studio."
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="pt-20">
        <FeaturesSection />
        <InteractiveProposalDemo />
        <WorkflowSection />
        <DemoBookingSection />
      </main>

      <Footer />
    </div>
  );
}
