import React from "react";
import Navbar from "@/components/marketing/Navbar";
import WorkflowSection from "@/components/marketing/WorkflowSection";
import ProblemSolutionSection from "@/components/marketing/ProblemSolutionSection";
import DemoBookingSection from "@/components/marketing/DemoBookingSection";
import Footer from "@/components/marketing/Footer";

export const metadata = {
  title: "How It Works — 8-Stage Solar Workflow | WhereReady Solar OS",
  description: "See how WhereReady Solar OS manages the end-to-end solar business journey from bill scan & proposal to DISCOM net-metering & commissioning."
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="pt-20">
        <WorkflowSection />
        <ProblemSolutionSection />
        <DemoBookingSection />
      </main>

      <Footer />
    </div>
  );
}
