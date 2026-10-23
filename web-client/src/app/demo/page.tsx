import React from "react";
import Navbar from "@/components/marketing/Navbar";
import DemoBookingSection from "@/components/marketing/DemoBookingSection";
import TrustSecuritySection from "@/components/marketing/TrustSecuritySection";
import FaqSection from "@/components/marketing/FaqSection";
import Footer from "@/components/marketing/Footer";

export const metadata = {
  title: "Book a Free 1-on-1 Demo | WhereReady Solar OS",
  description: "Schedule a personalized product walkthrough of WhereReady Solar OS for your solar EPC business."
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="pt-20">
        <DemoBookingSection />
        <TrustSecuritySection />
        <FaqSection />
      </main>

      <Footer />
    </div>
  );
}
