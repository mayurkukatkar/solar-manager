import React from "react";
import Navbar from "@/components/marketing/Navbar";
import ProductExperienceScene from "@/components/marketing/ProductExperienceScene";
import QuotationScene from "@/components/marketing/QuotationScene";
import WorkflowScene from "@/components/marketing/WorkflowScene";
import FinalCtaScene from "@/components/marketing/FinalCtaScene";
import Footer from "@/components/marketing/Footer";

export const metadata = {
  title: "Features & Capabilities | WhereReady Solar OS",
  description: "Explore all modules of WhereReady Solar OS: Bill OCR, 6-page proposals, DISCOM net-metering, serialized inventory, and PM Surya Ghar studio."
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="pt-20">
        <ProductExperienceScene />
        <QuotationScene />
        <WorkflowScene />
        <FinalCtaScene />
      </main>

      <Footer />
    </div>
  );
}
