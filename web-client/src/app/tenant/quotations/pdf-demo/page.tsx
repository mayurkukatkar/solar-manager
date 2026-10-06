"use client";

import React, { useState } from "react";
import { QuotationPDF, generatePDF } from "@/components/pdf/QuotationPDF";
import { Download, Eye } from "lucide-react";

export default function PDFDemoPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Sample data simulating what would come from the ERP database
  const sampleData = {
    quotation_number: "QT-2026-0042",
    quotation_date: "06-Oct-2026",
    valid_until: "20-Oct-2026",
    company_name: "Apex Solar Solutions",
    company_logo: "", // Leaving empty to use fallback icon
    company_address: "Tech Park, Building 4, 12th Floor, Mumbai, MH 400001",
    company_phone: "+91 98765 43210",
    company_email: "hello@apexsolar.in",
    company_website: "www.apexsolar.in",
    
    customer_name: "Rajesh Kumar",
    customer_phone: "+91 99887 76655",
    customer_email: "rajesh.kumar@example.com",
    project_address: "142 Green Avenue, Andheri West, Mumbai, MH 400053",
    consumer_number: "MSED-765432109",
    
    system_capacity: 10,
    annual_generation: 14600,
    panel_type: "Mono PERC Half-Cut 550Wp",
    inverter_brand: "Growatt / Sungrow",
    system_type: "Grid-Tied On-Grid",
    phase: "3-Phase",
    roof_type: "RCC Flat Roof",
    installation_type: "Elevated Structure",
    expected_timeline: "15-20 Working Days",
    
    components: [
      {
        category: "Solar PV Modules",
        brand: "Waaree / Vikram Solar",
        model: "550Wp Mono PERC",
        specification: "Tier-1 ALMM Approved",
        quantity: 18,
        warranty: "25 Yrs Performance"
      },
      {
        category: "Inverter",
        brand: "Growatt",
        model: "10kW 3-Phase On-Grid",
        specification: "Dual MPPT, IP65",
        quantity: 1,
        warranty: "10 Yrs Product"
      },
      {
        category: "Mounting Structure",
        brand: "Apex Custom",
        model: "Hot Dip Galvanized Iron",
        specification: "80 micron HDG, 150kmph Wind",
        quantity: "1 Set",
        warranty: "5 Yrs Structural"
      },
      {
        category: "DC Cable",
        brand: "Polycab / Apar",
        model: "4 sqmm DC Solar Cable",
        specification: "TUV Certified, UV Resistant",
        quantity: "90 mtr",
        warranty: "As per OEM"
      },
      {
        category: "Protection Devices",
        brand: "Hensel / Elmex",
        model: "ACDB & DCDB",
        specification: "IP65 Polycarbonate, SPD included",
        quantity: "1 Set",
        warranty: "1 Year"
      },
      {
        category: "Earthing System",
        brand: "Generic",
        model: "Chemical Earthing",
        specification: "Copper bonded with compound",
        quantity: 3,
        warranty: "1 Year"
      }
    ],
    
    scope_of_supply: [
      "Solar PV Modules",
      "Grid-Tied Inverter",
      "Module Mounting Structure",
      "DC Cables & AC Cables",
      "DCDB & ACDB",
      "Earthing & Lightning Protection",
      "Installation & Commissioning",
      "Civil Work for Foundations",
      "Testing",
      "Net Metering Assistance"
    ],
    
    pricing: [
      {
        description: "Complete 10kW On-Grid Solar System Material",
        qty: 1,
        unit_price: 450000,
        amount: 450000
      },
      {
        description: "Installation, Commissioning & Civil Works",
        qty: 1,
        unit_price: 35000,
        amount: 35000
      },
      {
        description: "Transportation to Site",
        qty: 1,
        unit_price: 8500,
        amount: 8500
      }
    ],
    
    subtotal: 493500,
    discount: 13500,
    taxable_amount: 480000,
    cgst: 33600,
    sgst: 33600,
    gov_charges: 15000,
    other_charges: 0,
    grand_total: 562200,
    
    annual_savings: 116800,
    monthly_savings: 9733,
    payback_period: 4.8,
    lifetime_generation: 365000,
    
    payment_terms: [
      { percentage: 40, description: "Advance along with the Work Order confirmation." },
      { percentage: 50, description: "Against delivery of major materials (Panels & Inverter) at site." },
      { percentage: 10, description: "After successful installation and testing, prior to Net Metering." }
    ],
    
    warranties: {
      modules: "12 Yrs Product, 25 Yrs Performance",
      inverter: "10 Yrs standard warranty from OEM",
      structure: "5 Yrs against manufacturing defects",
      installation: "1 Yr free maintenance and service",
      other: "As per respective OEM terms"
    },
    
    terms_and_conditions: [
      "The quotation is valid for 15 days from the date of issue.",
      "Any additional cable/structure requirements beyond the quoted quantities will be charged extra on actuals.",
      "Approval timeline depends on DISCOM processing speed and is not strictly bound by Apex Solar Solutions.",
      "Price quoted is subject to change if ALMM rules or GST rates are revised by the government.",
      "Water & Electricity for installation activities must be provided by the client free of cost.",
      "If installation is delayed due to site unreadiness by client, a material storage fee may apply after 30 days."
    ],
    
    exclusions: [
      "Any major civil work or roof reinforcement not mentioned.",
      "DISCOM statutory application/processing fees (to be paid by client).",
      "Upgrades to existing electrical panels or incoming supply cable."
    ],
    
    bank_details: {
      account_name: "Apex Solar Solutions Pvt Ltd",
      bank_name: "HDFC Bank",
      account_number: "50200012345678",
      ifsc: "HDFC0001234",
      upi_id: "apexsolar@hdfc"
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
