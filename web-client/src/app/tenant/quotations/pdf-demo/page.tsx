"use client";

import React, { useState } from "react";
import { QuotationPDF, generatePDF } from "@/components/pdf/QuotationPDF";
import { Download, Eye } from "lucide-react";

export default function PDFDemoPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Sample data simulating what would come from the ERP database
  const sampleData: any = {
  quotation_number: "QT-2026-0042",
  quotation_date: "06-Oct-2026",
  valid_until: "06-Nov-2026",
  
  company_name: "Demo Solar Energy",
  company_logo: "",
  company_address: "123 Solar Park, Tech City",
  company_phone: "+91 98765 43210",
  company_email: "hello@demosolar.com",
  company_website: "www.demosolar.com",
  
  customer_name: "Rahul Sharma",
  customer_phone: "+91 87654 32109",
  customer_email: "rahul.sharma@example.com",
  project_address: "45 Green Avenue, Spring Valley",
  consumer_number: "5040123456",
  
  system_capacity: 5,
  annual_generation: 7200,
  system_type: "Grid-Tied (On-Grid)",
  connection_type: "Net Metering",
  phase: "3 Phase",
  roof_type: "Flat RCC",
  installation_type: "Elevated Structure",
  expected_timeline: "14-21 Days",
  
  panel_brand: "Trina Solar",
  panel_model: "Vertex S+ N-type 540W",
  panel_wattage: 540,
  panel_quantity: 10,
  panel_warranty: "25-Year Performance",
  
  inverter_brand: "Growatt",
  inverter_model: "MIN 5000TL-X",
  inverter_capacity: 5,
  inverter_quantity: 1,
  inverter_warranty: "10-Year Replacement",
  
  structure_brand: "Loom Solar",
  structure_warranty: "10 Years Structural",
  
  components: [
    { category: "Solar Panel", brand: "Trina Solar", model: "Vertex S+ 540W", specification: "Monocrystalline Half-cut", quantity: 10, warranty: "25 Yrs" },
    { category: "Grid Inverter", brand: "Growatt", model: "MIN 5000TL", specification: "5kW Single Phase", quantity: 1, warranty: "10 Yrs" },
    { category: "Mounting Structure", brand: "Custom", model: "HDG", specification: "Hot Dip Galvanized Iron", quantity: "1 Lot", warranty: "10 Yrs" },
    { category: "ACDB", brand: "L&T / Schneider", model: "Standard", specification: "Surge Protection, MCB", quantity: 1, warranty: "1 Yr" },
    { category: "DCDB", brand: "L&T / Schneider", model: "Standard", specification: "DC SPD, DC MCB, Fuses", quantity: 1, warranty: "1 Yr" },
    { category: "DC Cable", brand: "Polycab", model: "4 sqmm", specification: "UV protected XLPE", quantity: "40 m", warranty: "Standard" },
    { category: "AC Cable", brand: "Polycab", model: "6 sqmm 3 Core", specification: "Armored XLPE", quantity: "25 m", warranty: "Standard" },
    { category: "Earthing", brand: "Copper Bonded", model: "1.2m", specification: "Chemical Earthing with Pit", quantity: 3, warranty: "Standard" },
    { category: "Lightning Protection", brand: "Standard", model: "Spike", specification: "Copper conventional", quantity: 1, warranty: "Standard" }
  ],
  
  scope_of_supply: [
    "High-Efficiency Solar Modules",
    "On-Grid String Inverter",
    "HDG Mounting Structure",
    "DC Cables (UV Protected)",
    "AC Cables (Armored)",
    "DC Distribution Box (DCDB)",
    "AC Distribution Box (ACDB)",
    "Chemical Earthing Kits (3 Pits)",
    "Lightning Arrestor System",
    "End-to-End Installation",
    "Testing and Commissioning",
    "Net Metering Assistance & Documentation"
  ],
  
  pricing: [
    { description: "5kW Solar PV System Complete Material Kit", qty: 1, unit_price: 250000, amount: 250000 },
    { description: "Installation & Commissioning Charges", qty: 1, unit_price: 35000, amount: 35000 },
    { description: "Net Metering Liaisoning", qty: 1, unit_price: 10000, amount: 10000 }
  ],
  
  subtotal: 295000,
  discount: 10000,
  tax: 40000,
  other_charges: 0,
  grand_total: 325000,
  amount_in_words: "Rupees Three Lakh Twenty Five Thousand Only",
  
  current_monthly_bill: 5500,
  estimated_monthly_bill: 850,
  annual_savings: 55800,
  monthly_savings: 4650,
  payback_period: 4.8,
  lifetime_savings: 1395000,
  lifetime_generation: 175000,
  
  co2_reduction: 6120,
  tree_equivalent: 184,
  peak_month: "April",
  monthly_generation: [
    { month: "January", generation: 550 },
    { month: "February", generation: 600 },
    { month: "March", generation: 720 },
    { month: "April", generation: 750 },
    { month: "May", generation: 710 },
    { month: "June", generation: 580 },
    { month: "July", generation: 450 },
    { month: "August", generation: 480 },
    { month: "September", generation: 590 },
    { month: "October", generation: 650 },
    { month: "November", generation: 620 },
    { month: "December", generation: 500 }
  ],
  
  payment_terms: [
    { percentage: 30, amount: 97500, description: "Advance Payment" },
    { percentage: 60, amount: 195000, description: "Before Material Dispatch" },
    { percentage: 10, amount: 32500, description: "Upon Commissioning" }
  ],
  
  warranties: {
    modules: "25 Years Performance",
    inverter: "10 Years Standard",
    structure: "10 Years Structural",
    installation: "1 Year Workmanship",
    other: "Standard OEM Warranty"
  },
  
  included_terms: [
    "Complete supply and installation of Solar PV System",
    "Testing and commissioning of the plant",
    "Application and processing for Net Metering",
    "One year free preventive maintenance"
  ],
  exclusions: [
    "Cost of Net Meter / Bi-directional meter (paid directly to DISCOM)",
    "Any civil work other than structure foundation",
    "Water arrangement for module cleaning",
    "Internet connection for system monitoring"
  ],
  terms_and_conditions: [
    "Quotation is valid for 30 days from the date of issue.",
    "Delivery timeline: 14 to 21 days from the date of advance payment.",
    "Any change in government taxes/duties will be charged extra as actuals.",
    "System generation depends on clear sunny days and regular module cleaning.",
    "Inverter internet monitoring requires a stable 2.4GHz WiFi connection provided by the client.",
    "Force Majeure: The company is not liable for delays caused by circumstances beyond reasonable control."
  ],
  
  bank_details: {
    account_name: "Demo Solar Energy Pvt Ltd",
    bank_name: "HDFC Bank",
    account_number: "50200012345678",
    ifsc: "HDFC0001234",
    upi_id: "demosolar@hdfcbank"
  }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const filename = `${sampleData.company_name.replace(/\s+/g, '_')}_Quotation_${sampleData.quotation_number}.pdf`;
      await generatePDF("quotation-pdf-content", filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Quotation Generator</h1>
            <p className="text-slate-500 text-sm mt-1">Preview and generate premium solar quotations.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              <Eye size={18} />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium shadow-sm shadow-emerald-200 transition-colors"
            >
              <Download size={18} />
              {isGenerating ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="flex justify-center bg-slate-200 p-8 rounded-2xl overflow-auto shadow-inner h-[80vh]">
            <div id="quotation-pdf-content" className="shadow-2xl bg-white flex-shrink-0" style={{ width: '210mm' }}>
              <QuotationPDF data={sampleData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
