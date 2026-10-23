import React from "react";
import Navbar from "@/components/marketing/Navbar";
import PricingSection from "@/components/marketing/PricingSection";
import FaqSection from "@/components/marketing/FaqSection";
import DemoBookingSection from "@/components/marketing/DemoBookingSection";
import Footer from "@/components/marketing/Footer";

export const metadata = {
  title: "Pricing & Plans | WhereReady Solar OS",
  description: "Transparent pricing plans for Indian solar EPCs and rooftop installers. Monthly and annual plans with full GST tax invoice."
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="pt-20">
        <PricingSection />
        <FaqSection />
        <DemoBookingSection />
      </main>

      <Footer />
    </div>
  );
}
