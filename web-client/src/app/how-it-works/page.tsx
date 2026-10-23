import React from "react";
import Navbar from "@/components/marketing/Navbar";
import WorkflowScene from "@/components/marketing/WorkflowScene";
import ProblemScene from "@/components/marketing/ProblemScene";
import FinalCtaScene from "@/components/marketing/FinalCtaScene";
import Footer from "@/components/marketing/Footer";

export const metadata = {
  title: "How It Works — 7-Stage Solar Workflow | WhereReady Solar OS",
  description: "See how WhereReady Solar OS manages the end-to-end solar business journey from bill scan & proposal to DISCOM net-metering & commissioning."
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="pt-20">
        <WorkflowScene />
        <ProblemScene />
        <FinalCtaScene />
      </main>

      <Footer />
    </div>
  );
}
