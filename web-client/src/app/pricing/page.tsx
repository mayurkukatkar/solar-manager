import React from "react";
import Navbar from "@/components/marketing/Navbar";
import PricingScene from "@/components/marketing/PricingScene";
import FaqSection from "@/components/marketing/FaqSection";
import FinalCtaScene from "@/components/marketing/FinalCtaScene";
import Footer from "@/components/marketing/Footer";

export const metadata = {
  title: "Pricing & Plans | WhereReady Solar OS",
  description: "Transparent pricing plans for Indian solar EPCs and rooftop installers. Monthly and annual plans with full GST tax invoice."
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="pt-20">
        <PricingScene />
        <FaqSection />
        <FinalCtaScene />
      </main>

      <Footer />
    </div>
  );
}
