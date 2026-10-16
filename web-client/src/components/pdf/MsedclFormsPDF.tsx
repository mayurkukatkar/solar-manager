"use client";

import React from "react";

// ============================================================================
// UTILITIES & HELPERS
// ============================================================================

export function toIndianWords(num: number): string {
  if (!num || isNaN(num)) return "ZERO ONLY";
  const a = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
    "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"
  ];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  function convertTens(n: number): string {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
  }

  function convertHundreds(n: number): string {
    if (n > 99) {
      return a[Math.floor(n / 100)] + " HUNDRED" + (n % 100 !== 0 ? " " + convertTens(n % 100) : "");
    }
    return convertTens(n);
  }

  let n = Math.round(num);
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;
  let remainder = Math.floor(n);

  let str = "";
  if (crore > 0) str += convertHundreds(crore) + " CRORE ";
  if (lakh > 0) str += convertHundreds(lakh) + " LAKH ";
  if (thousand > 0) str += convertHundreds(thousand) + " THOUSAND ";
  if (remainder > 0) str += convertHundreds(remainder) + " ";

  return (str.trim() + " ONLY").toUpperCase();
}

export function formatINR(val: number): string {
  if (!val && val !== 0) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(val);
}

export const generateDiscomPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`generateDiscomPDF: Element #${elementId} not found`);
    return;
  }
  
  // Patch window.getComputedStyle to strip lab/oklch colors for html2canvas
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(el, pseudoElt) {
    const style = originalGetComputedStyle.call(window, el, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        let value = (target as any)[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        if (typeof value === 'string' && (value.includes('lab(') || value.includes('oklch(') || value.includes('color('))) {
          if (prop === 'color' || prop === 'backgroundColor') return 'rgb(0, 0, 0)';
          return 'rgba(0, 0, 0, 0)'; 
        }
        return value;
      }
    });
  };

  const opt: any = {
    margin: 0,
    filename: filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] }
  };

  try {
    let html2pdf: any;
    try {
      const mod = await import("html2pdf.js");
      html2pdf = mod.default || mod;
    } catch {
      const _html2pdf = require("html2pdf.js");
      html2pdf = _html2pdf.default || _html2pdf;
    }
    return await html2pdf().set(opt).from(element).save();
  } catch (err: any) {
    console.error("PDF generation error:", err);
    throw err;
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
};

export const printHtmlElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`printHtmlElement: Element #${elementId} not found`);
    return;
  }

  // Remove any previously created print iframe
  const oldIframe = document.getElementById("discom-isolated-print-iframe");
  if (oldIframe) {
    oldIframe.remove();
  }

  // Create an isolated iframe positioned off-screen to the left (NOT opacity 0, NOT -99999px)
  const iframe = document.createElement("iframe");
  iframe.id = "discom-isolated-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.left = "-3000px";
  iframe.style.top = "0";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.border = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Extract all loaded styles & link stylesheets from parent window
  const links = Array.from(document.querySelectorAll("link[rel='stylesheet']"))
    .map((el) => el.outerHTML)
    .join("\n");
  
  // Filter out any style that has conflicting visibility: hidden
  const styles = Array.from(document.querySelectorAll("style"))
    .filter((el) => !el.innerHTML.includes("visibility: hidden") && !el.innerHTML.includes("discom-live-preview-content"))
    .map((el) => el.outerHTML)
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <base href="${typeof window !== 'undefined' ? window.location.origin : ''}" />
  <title>Official Solar Statutory Document</title>
  ${links}
  ${styles}
  <style>
    @page {
      size: A4 portrait;
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 210mm !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .page-break-after-always, 
    [style*="page-break-after: always"],
    [style*="break-after: page"] {
      page-break-after: always !important;
      break-after: page !important;
    }
    .page-break-after-always:last-child,
    div[style*="page-break-after: always"]:last-child,
    div[style*="break-after: page"]:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background: #ffffff; color: #000000;">
  <div id="${elementId}" class="${element.className}" style="width: 210mm; margin: 0 auto; background: #ffffff; visibility: visible !important; opacity: 1 !important;">
    ${element.innerHTML}
  </div>
</body>
</html>`;

  doc.open();
  doc.write(html);
  doc.close();

  // Give enough time for fonts & styles to compute
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("Iframe print error:", err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  }, 500);
};

// ============================================================================
// STAMP PAPER HEADER COMPONENT (₹100 MAHARASHTRA NON-JUDICIAL)
// ============================================================================

export const StampPaperHeader = ({
  city = "NAGPUR",
  year = "2026",
  serial = "55AB 416416",
  includeGraphic = true
}: {
  city?: string;
  year?: string;
  serial?: string;
  includeGraphic?: boolean;
}) => {
  if (!includeGraphic) {
    return (
      <div className="w-full h-[115mm] flex flex-col items-center justify-center border-b-2 border-dashed border-slate-300 mb-6 text-slate-400 text-xs text-center p-4">
        <p className="font-bold tracking-wider uppercase text-slate-500">Reserved For Physical ₹100 Non-Judicial Stamp Paper</p>
        <p className="text-[10px] mt-1">Feed pre-purchased ₹100 stamp paper into printer tray. Content will print below this margin.</p>
      </div>
    );
  }

  return (
    <div className="w-full mb-6 select-none" style={{ fontFamily: "serif" }}>
      {/* Decorative Stamp Outer Container */}
      <div className="relative border-4 border-double border-[#8b1e42] p-3 rounded bg-gradient-to-br from-[#fbf4f6] via-[#f7e6eb] to-[#fbf4f6] shadow-sm">
        {/* Intricate Inner Border */}
        <div className="border border-[#aa3355] p-2 relative">
          
          {/* Top Row: Values in Hindi & English */}
          <div className="flex justify-between items-center text-[#8b1e42] px-2 font-bold">
            <div className="text-left">
              <div className="text-[14px]">एक सौ रुपये</div>
              <div className="text-[24px] font-black tracking-tight leading-none mt-0.5">रु. 100</div>
            </div>

            {/* Top Center Title */}
            <div className="text-center">
              <div className="text-[18px] tracking-wide font-extrabold text-[#7a1232]">
                भारतीय गैर न्यायिक
              </div>
              <div className="text-[10px] tracking-widest text-[#a83250] mt-0.5 font-sans uppercase">
                India Non Judicial
              </div>
            </div>

            <div className="text-right">
              <div className="text-[14px]">Rs. 100</div>
              <div className="text-[15px] font-black leading-none mt-0.5">ONE HUNDRED RUPEES</div>
            </div>
          </div>

          {/* Center Ashoka Emblem & Guilloche Pattern */}
          <div className="my-2 py-1 flex items-center justify-center relative">
            <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#aa3355] to-transparent"></div>
            <div className="bg-[#fbf4f6] px-4 py-1 flex flex-col items-center z-10">
              {/* Ashoka Stambh Emblem Representation */}
              <div className="w-12 h-14 border border-[#8b1e42] rounded-sm flex flex-col items-center justify-between p-1 bg-white/80">
                <div className="flex gap-1 justify-center">
                  <div className="w-2.5 h-3 bg-[#8b1e42] rounded-t-sm opacity-80"></div>
                  <div className="w-3 h-4 bg-[#8b1e42] rounded-t-sm"></div>
                  <div className="w-2.5 h-3 bg-[#8b1e42] rounded-t-sm opacity-80"></div>
                </div>
                <div className="w-8 h-1 bg-[#8b1e42] rounded-full"></div>
                <div className="text-[6px] font-bold text-[#8b1e42] tracking-tighter">सत्यमेव जयते</div>
              </div>
            </div>
          </div>

          {/* Central Bold Heading: भारत INDIA */}
          <div className="text-center mt-1">
            <div className="text-[26px] font-black tracking-[0.2em] text-[#8b1e42] leading-tight">
              भारत INDIA
            </div>
            <div className="text-[13px] font-extrabold tracking-[0.3em] text-[#7a1232] mt-0.5 font-sans uppercase">
              INDIA NON JUDICIAL
            </div>
          </div>

        </div>
      </div>

      {/* State & Treasury Bar */}
      <div className="flex justify-between items-center px-4 py-1 mt-1 text-[11px] font-bold text-slate-800 border-b border-slate-300">
        <div>
          <span>महाराष्ट्र </span>
          <span className="tracking-wider">MAHARASHTRA</span>
        </div>
        <div className="tracking-widest font-mono text-[12px]">
          ● {year} ●
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-600 uppercase mr-3">{city} TREASURY</span>
          <span className="font-mono text-purple-900 font-extrabold">{serial}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PDF PAGE WRAPPER (A4 FORMAT)
// ============================================================================

export const PdfPage = ({ 
  children, 
  className = "",
  style = {}
}: { 
  children: React.ReactNode; 
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div 
    className={`w-[210mm] min-h-[297mm] bg-white text-black p-[15mm] relative box-border flex flex-col justify-between ${className}`}
    style={{
      fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
      pageBreakAfter: "always",
      breakAfter: "page",
      ...style
    }}
  >
    {children}
  </div>
);

// ============================================================================
// DOCUMENT 1 (PAGE 1): WORK COMPLETION REPORT (WCR)
// ============================================================================

export const WorkCompletionReport = ({ data }: { data: any }) => {
  const beneficiaryName = (data.beneficiaryName || data.customerName || "SHRI. SURENDRA RAMBHAU THAKRE").toUpperCase();
  const appRef = data.applicationRefNo || data.nationalPortalAppNo || "NP-MHSED26-11317031";
  const appDate = data.applicationDate || data.quotationDate || "08-04-2026";
  const consumerNo = data.consumerNumber || data.consumerAccountNo || "410022120526";
  const mobile = data.mobileNo || data.customerMobile || data.customerPhone || "8605849639";
  const email = data.email || data.customerEmail || "thakresurendra933@gmail.com";
  const category = data.category || "Residential";
  const address = (data.address || data.installationAddress || "PLOT NO 87 NAVIN NAGAR LIKKLYAN HOUS. SOC. NAGPUR").toUpperCase();
  const district = (data.district || data.city || "Nagpur").toUpperCase();
  const state = (data.state || "MAHARASHTRA").toUpperCase();
  const pincode = data.pincode || "440008";

  const sanctionedLoad = data.sanctionedLoad ? Number(data.sanctionedLoad).toFixed(3) : "1.000";
  const appliedCap = data.appliedCapacity ? Number(data.appliedCapacity).toFixed(3) : Number(data.capacity || 3.3).toFixed(3);
  const installedCap = data.installedCapacity ? Number(data.installedCapacity).toFixed(3) : (Number(appliedCap) * 0.97).toFixed(3);
  const moduleQty = data.moduleQuantity || 6;
  const moduleWatt = data.moduleWattage || 535;
  const moduleMake = (data.moduleMake || "ADANI SOLAR").toUpperCase();
  const moduleMfr = (data.moduleManufacturer || data.cellManufacturer || "MUNDRA SOLAR PV LIMITED").toUpperCase();
  const inverterCap = data.inverterCapacity || appliedCap;
  const inverterMake = data.inverterMake || "Grid-Tied";
  const earthing = data.earthingProtection || "Separate AC, DC & LA Earthing provided as per MNRE standards";
  const vendorName = (data.vendorName || "M/S EKVARTA ENERGY SOLUTIONS").toUpperCase();

  return (
    <PdfPage className="text-[12px] leading-tight">
      <div>
        {/* Official Header */}
        <div className="text-center mb-6">
          <h1 className="text-[14px] font-bold tracking-tight text-black uppercase">
            MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD. (MSEDCL)
          </h1>
          <h2 className="text-[13px] font-bold tracking-tight text-black uppercase mt-1">
            WORK COMPLETION REPORT (WCR) FOR GRID-CONNECTED SOLAR PV SYSTEM
          </h2>
        </div>

        {/* Section 1: Beneficiary Details */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th colSpan={2} className="border border-black p-1.5 text-left font-bold text-[11.5px]">
                  1. Beneficiary Details
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1.5 font-bold w-[35%]">Beneficiary Name</td>
                <td className="border border-black p-1.5 font-bold">{beneficiaryName}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Application Ref. No. &amp; Date</td>
                <td className="border border-black p-1.5">{appRef} / {appDate}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Consumer Account No.</td>
                <td className="border border-black p-1.5 font-semibold">{consumerNo}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Mobile No. &amp; Email</td>
                <td className="border border-black p-1.5">{mobile} | {email}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Category</td>
                <td className="border border-black p-1.5">{category}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Installation Address</td>
                <td className="border border-black p-1.5 leading-snug">
                  {address}, District: {district}, State: {state}, PIN Code: {pincode}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: System Technical Specifications */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th colSpan={2} className="border border-black p-1.5 text-left font-bold text-[11.5px]">
                  2. System Technical Specifications
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1.5 font-bold w-[35%]">Sanctioned Load</td>
                <td className="border border-black p-1.5">{sanctionedLoad} kW</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Applied Capacity</td>
                <td className="border border-black p-1.5">{appliedCap} kWp</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Total Solar Capacity Installed</td>
                <td className="border border-black p-1.5">
                  {installedCap} kWp ({moduleQty} x {moduleWatt} Wp) / {appliedCap} kWp Applied
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">System Type</td>
                <td className="border border-black p-1.5">Grid-Tied Rooftop Solar PV System</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">PV Module Make &amp; Rating</td>
                <td className="border border-black p-1.5">
                  {moduleMake} / {moduleMfr} ({moduleWatt} Wp - {moduleQty} NOS)
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Solar Inverter Capacity</td>
                <td className="border border-black p-1.5">{inverterCap} kW {inverterMake} Inverter</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Earthing &amp; Protection</td>
                <td className="border border-black p-1.5">{earthing}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Formal Certification Statement */}
        <p className="text-justify text-[11.5px] leading-relaxed my-5">
          Certified that the solar rooftop system of <strong>{appliedCap} kWp</strong> capacity has been installed, tested, and 
          commissioned satisfactorily at the above-mentioned premise in accordance with MSEDCL and MNRE specifications.
        </p>
      </div>

      {/* Signatures & Seal Block */}
      <div className="pt-8">
        <div className="grid grid-cols-3 gap-4 text-center items-end text-[11px]">
          <div>
            <div className="h-16 flex items-center justify-center font-cursive text-slate-700 italic">
              {data.customerSignature ? (
                <img src={data.customerSignature} className="max-h-14 object-contain mx-auto" alt="Consumer Sign" />
              ) : (
                <span>{beneficiaryName.split(" ")[0]}</span>
              )}
            </div>
            <div className="border-t border-black pt-1">
              <p className="font-bold">(Signature of Consumer)</p>
              <p className="mt-0.5 font-semibold text-[10px]">{beneficiaryName}</p>
            </div>
          </div>

          <div>
            <div className="h-16 flex flex-col items-center justify-center">
              {data.signatureUrl ? (
                <img src={data.signatureUrl} className="max-h-12 object-contain mx-auto" alt="Vendor Stamp" />
              ) : (
                <div className="border border-blue-900 text-blue-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-center">
                  <span>{vendorName}</span><br/>
                  <span className="text-[8px]">PROPRIETOR</span>
                </div>
              )}
            </div>
            <div className="border-t border-black pt-1">
              <p className="font-bold">(Authorized Vendor)</p>
              <p className="mt-0.5 font-semibold text-[10px]">{vendorName}</p>
            </div>
          </div>

          <div>
            <div className="h-16 flex items-center justify-center">
              <div className="w-16 h-14 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400">
                Official Seal
              </div>
            </div>
            <div className="border-t border-black pt-1">
              <p className="font-bold">(MSEDCL Officer)</p>
              <p className="mt-0.5 text-[10px]">Seal &amp; Signature</p>
            </div>
          </div>
        </div>
      </div>
    </PdfPage>
  );
};

// ============================================================================
// DOCUMENT 1 (PAGE 2) / DOCUMENT 2: COMMISSIONING CERTIFICATE (ANNEXURE - I)
// ============================================================================

export const CommissioningCertificate = ({ data }: { data: any }) => {
  const beneficiaryName = (data.beneficiaryName || data.customerName || "SHRI. SURENDRA RAMBHAU THAKRE").toUpperCase();
  const consumerNo = data.consumerNumber || data.consumerAccountNo || "410022120526";
  const address = (data.address || data.installationAddress || "PLOT NO 87 NAVIN NAGAR LIKKLYAN HOUS. SOC. NAGPUR").toUpperCase();
  const district = (data.district || data.city || "Nagpur").toUpperCase();
  const state = (data.state || "MAHARASHTRA").toUpperCase();
  const pincode = data.pincode || "440008";

  const appliedCap = data.appliedCapacity ? Number(data.appliedCapacity).toFixed(3) : Number(data.capacity || 3.3).toFixed(3);
  const installedCap = data.installedCapacity ? Number(data.installedCapacity).toFixed(3) : (Number(appliedCap) * 0.97).toFixed(3);
  const sanctionedLoad = data.sanctionedLoad ? Number(data.sanctionedLoad).toFixed(3) : "1.000";
  const moduleQty = data.moduleQuantity || 6;
  const moduleWatt = data.moduleWattage || 535;
  const moduleMake = (data.moduleMake || "ADANI SOLAR").toUpperCase();
  const moduleMfr = (data.moduleManufacturer || "MUNDRA SOLAR PV LIMITED").toUpperCase();
  const inverterCap = data.inverterCapacity || appliedCap;
  const phase = data.phase || "Single Phase";
  const commDate = data.commissioningDate || "09-10-2026";
  const vendorName = (data.vendorName || "M/S EKVARTA ENERGY SOLUTIONS").toUpperCase();

  return (
    <PdfPage className="text-[12px] leading-snug">
      <div>
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-[14px] font-bold tracking-wider uppercase">ANNEXURE - I</h1>
          <h2 className="text-[13px] font-bold tracking-tight uppercase mt-1">
            COMMISSIONING CERTIFICATE FOR GRID CONNECTED SOLAR ROOFTOP PV SYSTEM
          </h2>
        </div>

        {/* Certificate Paragraph */}
        <p className="text-justify text-[12px] leading-relaxed mb-6">
          Certified that the Solar Power Plant of capacity <strong>{appliedCap} kWp</strong> installed at{" "}
          <strong>{address}, District: {district}, State: {state}, PIN Code: {pincode}</strong> for{" "}
          <strong>{beneficiaryName}</strong> (Consumer No. <strong>{consumerNo}</strong>) is complete in all
          respects and ready for Grid Connection.
        </p>

        {/* Table 1: System Technical Details */}
        <div className="mb-5 border border-black">
          <div className="bg-gray-100 p-1.5 font-bold text-[11.5px] border-b border-black">
            System Technical Details
          </div>
          <div className="grid grid-cols-2 divide-x divide-black text-[11px]">
            {/* Left: Solar PV Array Details */}
            <div className="p-2.5 space-y-1.5">
              <p className="font-bold text-[11.5px] mb-2 underline">Solar PV Array Details</p>
              <p>• <strong>Capacity:</strong> {appliedCap} kWp (Installed: {installedCap} kWp)</p>
              <p>• <strong>Make:</strong> {moduleMake} ({moduleMfr})</p>
              <p>• <strong>Module Rating:</strong> {moduleWatt} Wp ({moduleQty} NOS)</p>
              <p>• <strong>Sanctioned Load:</strong> {sanctionedLoad} kW</p>
            </div>

            {/* Right: Power Conditioning Unit Details */}
            <div className="p-2.5 space-y-1.5">
              <p className="font-bold text-[11.5px] mb-2 underline">Power Conditioning Unit (Inverter) Details</p>
              <p>• <strong>Capacity:</strong> {inverterCap} kW Grid-Tied</p>
              <p>• <strong>Type:</strong> {phase}</p>
              <p>• <strong>Protections:</strong> IP65 / Anti-Islanding Embedded</p>
            </div>
          </div>
        </div>

        {/* Table 2: Metering & Earthing Details */}
        <div className="mb-6 border border-black">
          <div className="bg-gray-100 p-1.5 font-bold text-[11.5px] border-b border-black">
            Metering &amp; Earthing Details
          </div>
          <div className="grid grid-cols-2 divide-x divide-black text-[11px]">
            <div className="p-2.5">
              <p className="leading-relaxed">
                • <strong>Metering Type:</strong> Bi-directional Net Meter &amp; Solar Generation Meter
              </p>
            </div>
            <div className="p-2.5">
              <p className="leading-relaxed">
                • <strong>Earthing:</strong> Dedicated Earthing provided for Solar PV System
              </p>
            </div>
          </div>
        </div>

        <p className="text-[12px] font-bold mt-6">
          Date of Commissioning: {commDate}
        </p>
      </div>

      {/* Bottom Signatures */}
      <div className="pt-16 pb-8">
        <div className="grid grid-cols-2 gap-12 text-center text-[11px]">
          <div>
            <div className="h-16 flex items-center justify-center font-cursive text-slate-700 italic">
              {data.customerSignature ? (
                <img src={data.customerSignature} className="max-h-14 object-contain mx-auto" alt="Consumer Sign" />
              ) : (
                <span>{beneficiaryName.split(" ")[0]}</span>
              )}
            </div>
            <div className="border-t border-black pt-1">
              <p className="font-bold text-[12px]">Consumer Signature</p>
              <p className="font-semibold text-[10.5px] mt-0.5">{beneficiaryName}</p>
            </div>
          </div>

          <div>
            <div className="h-16 flex flex-col items-center justify-center">
              {data.signatureUrl ? (
                <img src={data.signatureUrl} className="max-h-12 object-contain mx-auto" alt="Vendor Stamp" />
              ) : (
                <div className="border border-blue-900 text-blue-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-center">
                  <span>{vendorName}</span><br/>
                  <span className="text-[8px]">PROPRIETOR</span>
                </div>
              )}
            </div>
            <div className="border-t border-black pt-1">
              <p className="font-bold text-[12px]">Vendor Signature &amp; Stamp</p>
              <p className="font-semibold text-[10.5px] mt-0.5">{vendorName}</p>
            </div>
          </div>
        </div>
      </div>
    </PdfPage>
  );
};

// ============================================================================
// DOCUMENT 1 (PAGE 3): ANNEXURE - A (DOMESTIC CONTENT REQUIREMENT - DCR)
// ============================================================================

export const DcrUndertaking = ({ data }: { data: any }) => {
  const beneficiaryName = (data.beneficiaryName || data.customerName || "SHRI. SURENDRA RAMBHAU THAKRE").toUpperCase();
  const address = (data.address || data.installationAddress || "PLOT NO 87 NAVIN NAGAR LIKKLYAN HOUS. SOC. NAGPUR").toUpperCase();
  const district = (data.district || data.city || "Nagpur").toUpperCase();
  const state = (data.state || "MAHARASHTRA").toUpperCase();
  const pincode = data.pincode || "440008";
  const appRef = data.applicationRefNo || data.nationalPortalAppNo || "NP-MHSED26-11317031";
  const commDate = data.commissioningDate || "09-10-2026";

  const appliedCap = data.appliedCapacity ? Number(data.appliedCapacity).toFixed(3) : Number(data.capacity || 3.3).toFixed(3);
  const installedCap = data.installedCapacity ? Number(data.installedCapacity).toFixed(3) : (Number(appliedCap) * 0.97).toFixed(3);
  const moduleQty = Number(data.moduleQuantity || 6);
  const moduleWatt = data.moduleWattage || 535;
  const moduleMake = (data.moduleMake || "ADANI SOLAR").toUpperCase();
  const cellMfr = (data.cellManufacturer || "MUNDRA SOLAR PV LIMITED (ADANI SOLAR)").toUpperCase();
  const moduleMfr = (data.moduleManufacturer || "MUNDRA SOLAR PV LIMITED (ADANI SOLAR)").toUpperCase();
  const vendorName = (data.vendorName || "M/S EKVARTA ENERGY SOLUTIONS").toUpperCase();

  // Dynamic Serial Numbers
  const serials: string[] = Array.isArray(data.moduleSerialNumbers) && data.moduleSerialNumbers.length > 0
    ? data.moduleSerialNumbers
    : (data.dcrModuleSerials ? data.dcrModuleSerials.split(/[,\n]/).map((s:string) => s.trim()).filter(Boolean) : [
        "MS2608211A3882", "MS2608211A3908", "MS2608211A4160", 
        "MS2608211A4181", "MS2608211A4247", "MS2608211A4462"
      ]);

  return (
    <PdfPage className="text-[11.5px] leading-snug">
      <div>
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-[13.5px] font-bold tracking-wider uppercase">ANNEXURE - A</h1>
          <h2 className="text-[12px] font-bold tracking-tight uppercase mt-0.5">
            (SELF-DECLARATION / UNDERTAKING FOR DOMESTIC CONTENT REQUIREMENT)
          </h2>
        </div>

        {/* Lead Paragraph */}
        <p className="text-justify leading-relaxed mb-3">
          This is to certify that <strong>{vendorName}</strong> has installed <strong>{appliedCap} kWp</strong> Grid Connected 
          Rooftop Solar (GCRTS) Power Plant for <strong>{beneficiaryName}</strong> at <strong>{address}, District: {district}, State: {state}, PIN Code: {pincode}</strong>, 
          under MNRE Rooftop Solar Scheme Phase-II, against Application Reference Number: <strong>{appRef}</strong>.
        </p>

        <p className="text-justify leading-relaxed mb-3">
          The system has been commissioned on <strong>{commDate}</strong>. The details of domestically manufactured Solar 
          PV Modules installed are as below:
        </p>

        {/* Details Box */}
        <div className="border border-black p-3 mb-4 space-y-1 text-[11px] bg-slate-50/50">
          <p className="font-bold underline mb-2 text-[11.5px]">Details of Solar PV Modules</p>
          <div className="grid grid-cols-[220px_1fr] gap-y-1">
            <span>1. Total No. of Modules Installed</span>
            <span className="font-semibold">: {moduleQty} NOS</span>

            <span>2. Rating of Each Module</span>
            <span className="font-semibold">: {moduleWatt} Wp</span>

            <span>3. Total Capacity Installed (kWp)</span>
            <span className="font-semibold">: {installedCap} kWp (Applied: {appliedCap} kWp)</span>

            <span>4. PV Module Make</span>
            <span className="font-semibold">: {moduleMake}</span>

            <span>5. Cell Manufacturer's Name</span>
            <span className="font-semibold">: {cellMfr}</span>

            <span>6. Module Manufacturer's Name</span>
            <span className="font-semibold">: {moduleMfr}</span>
          </div>
        </div>

        {/* Serial Numbers Table */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th colSpan={3} className="border border-black p-1.5 text-left font-bold text-[11px]">
                  List of Serial Numbers of {moduleQty} NOS {moduleMake} PV Modules ({moduleWatt} Wp)
                </th>
              </tr>
              <tr className="bg-gray-50 text-center font-bold">
                <td className="border border-black p-1 w-16">Sr. No.</td>
                <td className="border border-black p-1 text-left px-3">PV Module Serial Number</td>
                <td className="border border-black p-1 w-24">Rating</td>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: moduleQty }).map((_, i) => (
                <tr key={i}>
                  <td className="border border-black p-1 text-center font-semibold">{i + 1}</td>
                  <td className="border border-black p-1 px-3 font-mono">
                    {serials[i] || `MS2608211A${4000 + i * 15}`}
                  </td>
                  <td className="border border-black p-1 text-center">{moduleWatt} Wp</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legal Undertaking Paragraphs */}
        <div className="space-y-2 text-justify text-[10.5px] leading-relaxed">
          <p>
            I / We hereby undertake that the above mentioned Solar PV Modules are domestically manufactured 
            using domestic manufactured solar cells and conform to the Domestic Content Requirement (DCR) 
            criteria as per MNRE guidelines. The cell and module manufacturer(s) have also provided requisite 
            declarations/certificates regarding DCR compliance.
          </p>
          <p>
            In case any information/document is found to be false/incorrect at a later stage, MNRE / MSEDCL 
            may take appropriate action against us, including blacklisting or recovery of CFA. We also agree to 
            provide supporting documents as and when required by MNRE or its designated agency.
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-6 pb-2">
        <div className="grid grid-cols-2 gap-12 text-center text-[11px]">
          <div>
            <div className="h-14 flex items-center justify-center font-cursive text-slate-700 italic">
              {data.customerSignature ? (
                <img src={data.customerSignature} className="max-h-12 object-contain mx-auto" alt="Beneficiary Sign" />
              ) : (
                <span>{beneficiaryName.split(" ")[0]}</span>
              )}
            </div>
            <div className="border-t border-black pt-1">
              <p className="font-bold text-[11.5px]">(Signature of Beneficiary)</p>
              <p className="font-semibold text-[10px] mt-0.5">Name: {beneficiaryName}</p>
            </div>
          </div>

          <div>
            <div className="h-14 flex flex-col items-center justify-center">
              {data.signatureUrl ? (
                <img src={data.signatureUrl} className="max-h-12 object-contain mx-auto" alt="Vendor Stamp" />
              ) : (
                <div className="border border-blue-900 text-blue-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-center">
                  <span>{vendorName}</span><br/>
                  <span className="text-[8px]">PROPRIETOR</span>
                </div>
              )}
            </div>
            <div className="border-t border-black pt-1">
              <p className="font-bold text-[11.5px]">(Signature of Authorized Signatory)</p>
              <p className="font-semibold text-[10px] mt-0.5">For {vendorName}</p>
              <p className="text-[9px] text-slate-500">(With Seal &amp; Date)</p>
            </div>
          </div>
        </div>
      </div>
    </PdfPage>
  );
};

// ============================================================================
// DOCUMENT 1 FULL PACK (3-PAGE WCR DOSSIER)
// ============================================================================

export const WcrFullPack = ({ data }: { data: any }) => (
  <div className="bg-white">
    <WorkCompletionReport data={data} />
    <CommissioningCertificate data={data} />
    <DcrUndertaking data={data} />
  </div>
);

// ============================================================================
// DOCUMENT 3: ANNEXURE – 3: NET METERING CONNECTION AGREEMENT (6 PAGES)
// ============================================================================

export const NetMeteringAgreement2019 = ({ data, includeStamp = true }: { data: any; includeStamp?: boolean }) => {
  const beneficiaryName = (data.beneficiaryName || data.customerName || "SURENDRA RAMBHAU THAKRE").toUpperCase();
  const address = (data.address || data.installationAddress || "PLOT NO 87 NAVIN NAGAR LIKKLYAN HOUS. SOC. NAGPUR").toUpperCase();
  const district = (data.district || data.city || "Nagpur").toUpperCase();
  const consumerNo = data.consumerNumber || "410022120526";
  const capacity = data.appliedCapacity || data.capacity || "1.1";
  const location = (data.agreementCity || data.city || "NAGPUR").toUpperCase();
  const day = data.agreementDay || "10";
  const month = (data.agreementMonth || "OCT").toUpperCase();
  const year = data.agreementYear || "2026";
  const subDivision = (data.subDivision || `${district} S/DN`).toUpperCase();
  const vendorName = (data.vendorName || "EKVARTA ENERGY SOLUTIONS").toUpperCase();
  const witness1 = (data.witness1 || beneficiaryName).toUpperCase();
  const witness2 = (data.witness2 || data.customerFatherName || "RAMBHAU THAKRE").toUpperCase();

  return (
    <div className="bg-white text-black text-[12px] leading-relaxed text-justify">
      
      {/* PAGE 1 */}
      <PdfPage>
        <StampPaperHeader city={location} year={year} includeGraphic={includeStamp} />
        
        <div className="text-center mb-5">
          <h2 className="font-bold text-[13px] uppercase tracking-wide">Annexure – 3</h2>
          <h1 className="font-bold text-[14px] uppercase mt-1">Net Metering Connection Agreement</h1>
        </div>

        <div className="space-y-4">
          <p>
            This Agreement is made and entered into at (location) <strong>{location}</strong> on this (date) <strong>{day}</strong>day of (month) <strong>{month}</strong> (year) <strong>{year}</strong> between the Eligible Consumer (Name <strong>{beneficiaryName}</strong> having premises at (address <strong>{address}, District: {district}</strong> and Consumer No. <strong>{consumerNo}</strong> as the first Party, AND
          </p>

          <p>
            <strong>MSEDCL) {subDivision}</strong> (hereinafter referred to as ‘the Licensee’) and having its Registered Office at (address) <strong>{location}</strong> as second Party of this Agreement. Whereas the Eligible Consumer has applied to MSEDCL for approval of a Net Metering Arrangement under the provisions of the Maharashtra Electricity Regulatory Commission (Grid Interactive Renewable Energy Generating Systems) Regulations, 2019 (‘the Grid Interactive Renewable Regulations’) and sought its connectivity to MSEDCL’s distribution Network;
          </p>

          <p>
            And whereas MSEDCL has agreed to provide Network connectivity to the Eligible Consumer for injection of electricity generated from its Renewable Energy Generating System of <strong>{capacity}kilowatt</strong>;
          </p>
        </div>
      </PdfPage>

      {/* PAGE 2 */}
      <PdfPage>
        <StampPaperHeader city={location} year={year} includeGraphic={includeStamp} />

        <p className="font-bold mb-3">Both Parties hereby agree as follows:</p>

        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-[12.5px] mb-1">1 Eligibility</h3>
            <p>
              The Renewable Energy Generating System meets the applicable norms for being integrated into the distribution network, and that the Eligible Consumer shall maintain the System accordingly for the duration of this Agreement.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[12.5px] mb-1">2 Technical and Inter-connection Requirements</h3>
            <p className="mb-2">
              <strong>2.1</strong> The metering arrangement and the inter-connection of the Renewable Energy Generating System with the Network of MSEDCL shall be as per the provisions of the Grid Interactive Renewable Regulations, and the technical standards and norms specified by the Central Electricity Authority for connectivity of distributed generation resources and for the installation and operation of meters.
            </p>
            <p className="mb-2">
              <strong>2.2</strong> The Eligible Consumer agrees, that he shall install, prior to connection of the Renewable Energy Generating System to the Network of MSEDCL, an isolation device (both automatic and in-built within inverter and external manual relays); and MSEDCL shall have access to it if required for the repair and maintenance of the distribution Network.
            </p>
            <p>
              <strong>2.3</strong> MSEDCL shall specify the interface/inter-connection point and metering point.
            </p>
          </div>
        </div>
      </PdfPage>

      {/* PAGE 3 */}
      <PdfPage>
        <div className="space-y-4 pt-4">
          <p>
            <strong>2.4</strong> The Eligible Consumer shall furnish all relevant data, such as voltage, frequency, circuit breaker, isolator position in his System, as and when required by MSEDCL.
          </p>

          <div>
            <h3 className="font-bold text-[12.5px] mb-1">3 Safety</h3>
            <p className="mb-2">
              <strong>3.1</strong> The equipment connected to MSEDCL’s distribution System shall be compliant with relevant International (IEEE/IEC) or Indian standards (BIS), as the case may be, and the installation of electrical equipment shall comply with the requirements specified by the Central Electricity Authority regarding safety and electricity supply.
            </p>
            <p className="mb-2">
              <strong>3.2</strong> The design, installation, maintenance and operation of the Renewable Energy Generating System shall be undertaken in a manner conducive to the safety of the Renewable Energy Generating System as well as MSEDCL’s Network.
            </p>
            <p className="mb-2">
              <strong>3.3</strong> If, at any time, MSEDCL determines that the Eligible Consumer’s Renewable Energy Generating System is causing or may cause damage to and/or results in MSEDCL’s other consumers or its assets, the Eligible Consumer shall disconnect the Renewable Energy Generating System from the distribution Network upon direction from MSEDCL, and shall undertake corrective measures at his own expense prior to re- connection.
            </p>
            <p>
              <strong>3.4</strong> MSEDCL shall not be responsible for any accident resulting in injury to human beings or animals or damage to property that may occur due to back-feeding from the Renewable Energy Generating System when the grid supply is off. MSEDCL may disconnect the installation at any time in the event of such exigencies to prevent such accident.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[12.5px] mb-1">4 Other Clearances and Approvals</h3>
            <p>
              The Eligible Consumer shall obtain any statutory approvals and clearances that may be required, such as from the Electrical Inspector or the municipal or other authorities, before connecting the Renewable Energy Generating System to the distribution Network.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[12.5px] mb-1">5 Period of Agreement, and Termination</h3>
            <p className="mb-1">
              <strong>5.1</strong> This Agreement shall be for a period for 20 years, but may be terminated prematurely:
            </p>
            <p className="pl-6 mb-1">a) By mutual consent; or</p>
            <p className="pl-6 mb-1">b) By the Eligible Consumer, by giving 90 days’ notice to MSEDCL;</p>
            <p className="pl-6">
              c) By MSEDCL, by giving 30 days’ notice, if the Eligible Consumer breaches any terms of this Agreement or the provisions of the Grid Interactive Rooftop Renewable Energy Generating Systems Regulations and does not remedy such breach within 30 days, or such other reasonable period as may be provided, of receiving notice of such breach, or for any other valid reason communicated by MSEDCL in writing;
            </p>
          </div>
        </div>
      </PdfPage>

      {/* PAGE 4 */}
      <PdfPage>
        <div className="space-y-4 pt-4">
          <p className="pl-6">
            d) By MSEDCL, by giving 30 days’ notice, if the Eligible Consumer fails to pay his dues in a timely manner or indulges in any malpractices.
          </p>

          <div>
            <h3 className="font-bold text-[12.5px] mb-1">6 Access and Disconnection</h3>
            <p className="mb-2">
              <strong>6.1</strong> The Eligible Consumer shall provide access to MSEDCL to the metering equipment and disconnecting devices of Renewable Energy Generating System, both automatic and manual, by the Eligible Consumer.
            </p>
            <p className="mb-2">
              <strong>6.2</strong> If, in an emergent or outage situation, MSEDCL cannot access the disconnecting devices of the Renewable Energy Generating System, both automatic and manual, it may disconnect power supply to the premises.
            </p>
            <p>
              <strong>6.3</strong> Upon termination of this Agreement under Clause 5, the Eligible Consumer shall disconnect the Renewable Energy Generating System forthwith from the Network of MSEDCL.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[12.5px] mb-1">7 Liabilities</h3>
            <p className="mb-2">
              <strong>7.1</strong> The Parties shall indemnify each other for damages or adverse effects of either Party’s negligence or misconduct during the installation of the Renewable Energy Generating System, connectivity with the distribution Network and operation of the System.
            </p>
            <p>
              <strong>7.2</strong> The Parties shall not be liable to each other for any loss of profits or revenues, business interruption losses, loss of contract or goodwill, or for indirect, consequential, incidental or special damages including, but not limited to, punitive or exemplary damages, whether any of these liabilities, losses or damages arise in contract, or otherwise.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[12.5px] mb-1">8 Commercial Settlement</h3>
            <p className="mb-2">
              <strong>8.1</strong> The commercial settlements under this Agreement shall be in accordance with the Grid Interactive Renewable Regulations.
            </p>
            <p className="mb-2">
              <strong>8.2</strong> MSEDCL shall not be liable to compensate the Eligible Consumer if his Renewable Energy Generating System is unable to inject surplus power generated into MSEDCL’s Network on account of failure of power supply in the grid/Network.
            </p>
            <p className="mb-2">
              <strong>8.3</strong> The existing metering System, if not in accordance with the Grid Interactive Renewable Regulations, shall be replaced by a bi-directional meter (whole current/CT operated) and a separate Renewable Energy Generation Meter shall be provided to measure Renewable Energy generation. The bi-directional meter (whole current/CT operated) shall be installed at the inter-connection point to MSEDCL’s Network for recording export and import of energy.
            </p>
            <p>
              <strong>8.4</strong> The uni-directional and bi-directional meters shall be fixed in separate meter boxes in the same proximity.
            </p>
          </div>
        </div>
      </PdfPage>

      {/* PAGE 5 */}
      <PdfPage>
        <div className="space-y-4 pt-4">
          <p>
            <strong>8.5</strong> The energy generated by the Renewable Energy Generating Station shall be offset against the energy consumption of the consumer from the MSEDCL in the following manner:
          </p>

          <div className="pl-6 space-y-2 text-[11.5px]">
            <p>
              a) If the quantum of electricity exported exceeds the quantum imported during the Billing Period, the excess quantum shall be carried forward to the next Billing Period as credited Units of electricity;
            </p>
            <p>
              b) If the quantum of electricity Units imported by the Eligible Consumer during any Billing Period exceeds the quantum exported, the MSEDCL shall raise its invoice for the net electricity consumption after adjusting the credited Units;
            </p>
            <p>
              c) The unadjusted net credited Units of electricity as at the end of each financial year shall be purchased by the MSEDCL at the Generic Tariff approved by the Commission for that year, within the first month of the following year: Provided that, at the beginning of each Settlement Period, the cumulative quantum of injected electricity carried forward will be re-set to zero;
            </p>
            <p>
              d) In case the Eligible Consumer is within the ambit of Time of Day (ToD) tariff, the electricity consumption in any time block, i.e. peak hours, off-peak hours, etc., shall be first compensated with the quantum of electricity injected in the same time block; any excess injection over and above the consumption in any other time block in a Billing Cycle shall be accounted as if the excess injection had occurred during off- peak hours;
            </p>
            <p>
              e) MSEDCL shall compute the amount payable to the Eligible Consumer for the excess Renewable Energy purchased by it as specified in Clause 8.5 (c), and shall provide credit equivalent to the amount payable in the immediately succeeding Billing Cycle.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[12.5px] mb-1">9 Connection Costs</h3>
            <p>
              The Eligible Consumer shall bear all costs related to the setting up of the Renewable Energy Generating System, including the cost of the Renewable Energy Generation Meter.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[12.5px] mb-1">10 Dispute Resolution</h3>
            <p className="mb-2">
              <strong>10.1</strong> Any dispute arising under this Agreement shall be resolved promptly, in good faith and in an equitable manner by both the Parties.
            </p>
            <p>
              <strong>10.2</strong> The Eligible Consumer shall have recourse to the concerned Consumer Grievance Redressal Forum constituted under the relevant Regulations in respect of any grievance regarding billing, which has not been redressed by MSEDCL.
            </p>
          </div>

          <p className="pt-2">
            In the witness, where of (Name) <strong>{vendorName}</strong> for and on behalf of Eligible Consumer) and (Name) <strong>{beneficiaryName}</strong> for and on behalf of MSEDCL (Licensee) agree to this agreement.
          </p>
        </div>
      </PdfPage>

      {/* PAGE 6 */}
      <PdfPage>
        <div className="pt-8">
          <div className="flex justify-between items-start mb-8 text-[12px]">
            <div>
              <p className="font-bold text-[13px]">{beneficiaryName}</p>
              <p className="text-slate-600">for and on behalf of Eligible Consumer</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[13px]">for and on behalf of MSEDCL Witness</p>
            </div>
          </div>

          <div className="space-y-8 mb-16">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">1: Witness . {witness1}</p>
                <div className="h-10 border-b border-black w-64 mt-2"></div>
              </div>
              <div className="text-right">
                <p className="font-bold">2: Witness __________________</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">1: Witness {witness2}</p>
                <div className="h-10 border-b border-black w-64 mt-2"></div>
              </div>
              <div className="text-right">
                <p className="font-bold">2: Witness __________________</p>
              </div>
            </div>
          </div>

          {/* Vendor Stamp */}
          <div className="mt-16 flex justify-end">
            <div className="text-center w-64">
              <div className="h-20 flex flex-col items-center justify-center">
                {data.signatureUrl ? (
                  <img src={data.signatureUrl} className="max-h-16 object-contain" alt="Vendor Seal" />
                ) : (
                  <div className="border border-blue-900 text-blue-900 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    <span>{vendorName}</span><br/>
                    <span className="text-[9px]">PROPRIETOR</span>
                  </div>
                )}
              </div>
              <div className="border-t border-black pt-1">
                <p className="font-bold text-xs uppercase">{vendorName}</p>
                <p className="text-[10px] text-slate-500">Authorized Vendor Stamp &amp; Sign</p>
              </div>
            </div>
          </div>
        </div>
      </PdfPage>

    </div>
  );
};

// ============================================================================
// DOCUMENT 4: ANNEXURE 2 - CONSUMER & VENDOR AGREEMENT (PM SURYA GHAR - 3 PAGES)
// ============================================================================

export const Annexure2ConsumerVendorAgreement = ({ data, includeStamp = true }: { data: any; includeStamp?: boolean }) => {
  const beneficiaryName = (data.beneficiaryName || data.customerName || "RAVI DODKUJI KAWALE").toUpperCase();
  const address = (data.address || data.installationAddress || "TEMBHARI BUTIBORI").toUpperCase();
  const district = (data.district || data.city || "Nagpur").toUpperCase();
  const state = (data.state || "MAHARASHTRA").toUpperCase();
  const pincode = data.pincode || "440016";
  const day = data.agreementDay || "12";
  const month = data.agreementMonth || "10";
  const year = data.agreementYear || "26";
  const location = (data.agreementCity || data.city || "Nagpur").toUpperCase();

  const vendorName = (data.vendorName || "EKVARTA ENERGY SOLUTIONS").toUpperCase();
  const vendorAddress = (data.vendorAddress || "PLOT NO 4 HOUSE NO 85, TAJ HOUSING SOCIETY, HUDKESHWAR ROAD, PIPLA FATA, Nagpur, Maharashtra").toUpperCase();
  const vendorPincode = data.vendorPincode || "440034";

  return (
    <div className="bg-white text-black text-[12px] leading-relaxed text-justify">
      
      {/* PAGE 1 */}
      <PdfPage>
        <StampPaperHeader city={location} year={`20${year}`} includeGraphic={includeStamp} />

        <div className="text-center mb-6">
          <h2 className="font-bold text-[13px] uppercase tracking-wide">Annexure 2</h2>
          <h1 className="font-bold text-[13px] uppercase mt-1 leading-snug">
            Model Draft Agreement between Consumer &amp; Vendor for installation of grid<br/>
            connected rooftop solar (RTS) project under PM – Surya Ghar: Muft Bijli Yojana
          </h1>
        </div>

        <div className="space-y-6">
          <p>
            This agreement is executed on --<strong>{day}</strong>--(Day)-----<strong>{month}</strong>-----(Month)-----<strong>{year}</strong>-----(Year) for design, supply, installation, commissioning and 5-year comprehensive maintenance of RTS project/system along with warranty under PM Surya Ghar: Muft Bijli Yojana
          </p>

          <div className="text-center font-bold text-[13px] my-4">Between</div>

          <div>
            <p className="font-bold text-[13px] mb-1">{beneficiaryName}</p>
            <p className="leading-relaxed">
              having address at <strong>{address}, District: {district}, State: {state}, PIN Code: {pincode}</strong> (hereinafter referred to as First Party / Consumer)
            </p>
          </div>

          <div className="text-center font-bold text-[13px] my-4">And</div>
        </div>
      </PdfPage>

      {/* PAGE 2 */}
      <PdfPage>
        <div className="space-y-4 pt-4">
          <p>
            (<strong>{vendorName}</strong>) having registered office at <strong>{vendorAddress} {vendorPincode}</strong> (hereinafter referred to as Second Party / Vendor).
          </p>

          <div className="my-3 text-center">
            <h3 className="font-bold text-[13px]">Whereas</h3>
            <p className="font-semibold text-[11px] text-slate-600">Guidelines for PM-Surya Ghar: Muft Bijli Yojana</p>
            <p className="font-semibold text-[11px] text-slate-600">Central Financial Assistance to Residential Consumers</p>
          </div>

          <p>
            First Party wishes to install a Grid Connected Rooftop Solar Plant on the rooftop of the residential building of the Consumer under PM Surya Ghar: Muft Bijli Yojana.
          </p>

          <p>
            <strong>And whereas</strong><br/>
            Second Party has verified availability of appropriate roof and found it feasible to install a Grid Connected Roof Top Solar plant and that the second party is willing to design, supply, install, test, commission and carry out Operation &amp; Maintenance of the Rooftop Solar plant for 5 year period.
          </p>

          <p>
            On this day, the First Party and Second Party agree to the following: The First Party hereby undertakes to perform the following activities:
          </p>

          <div className="pl-4 space-y-1.5 text-[11px]">
            <p><strong>1.</strong> Submission of online application at National Portal for installation of RTS project/system, Submission of application for net-metering and system inspection and upload of the relevant documents on the National Portal of the scheme</p>
            <p><strong>2.</strong> Provide secure storage of the material of the RTS plant delivered at the premises till handover of the system.</p>
            <p><strong>3.</strong> Provide access to the Roof Top during installation of the plant, operation &amp; maintenance, testing of the plant and equipment and for meter reading from solar meter, inverter etc.</p>
            <p><strong>4.</strong> Provide electricity during plant installation and water for cleaning of the panels.</p>
            <p><strong>5.</strong> Report any malfunctioning of the plant to the Vendor during the warranty period.</p>
            <p><strong>6.</strong> Pay the amount as per the payment schedule as mutually agreed with the vendor, including any additional amount to the second party for any additional work /customization required depending upon the building condition</p>
          </div>

          <p className="pt-2">
            The Second Party hereby undertakes to perform the following activities:
          </p>

          <div className="pl-4 text-[11px]">
            <p>
              <strong>1.</strong> The Vendor must follow all the standards and safety guidelines prescribed under state regulations and technical standards prescribed by MNRE for RTS projects, failing which the vendor is liable for blacklisting from participation in the govt. project/ scheme and other
            </p>
          </div>
        </div>
      </PdfPage>

      {/* PAGE 3 */}
      <PdfPage>
        <div className="space-y-3.5 pt-4 text-[11.5px]">
          <p>
            penal actions in accordance with the law. The responsibility of supply, installation and commissioning of the rooftop solar project/system in complete compliance with MNRE scheme guidelines lies with the Vendor.
          </p>

          <p>
            <strong>2. Site Survey:</strong> Site visit, survey and development of detailed project report for installation of RTS system. This also includes, feasibility study of roof, strength of roof and shadow free area. If any additional work or customization is involved for the plant installation as per site condition and requirement of the consumer building, the Vendor shall prepare an estimate and can raise separate invoice including GST in addition to the amount towards standard plant cost. The consumer shall pay the amount for such additional work directly to the Vendor.
          </p>

          <p>
            <strong>3. Design &amp; Engineering:</strong> Design of plant along with drawings and selection of components as per standard provided by the DISCOM/SERC/MNRE for best performance and safety of the plant.
          </p>

          <p>
            <strong>4. Module and Inverter:</strong> The solar modules, including the solar cells, should be manufactured in India. Both the solar modules and inverters shall conform to the relevant standards and specifications prescribed by MNRE. Any other requirement, viz. star labelling (solar modules), quality control orders and standards &amp; labelling (inverters) etc., shall also be complied.
          </p>

          <div className="py-1 text-center font-semibold text-[11px] text-slate-700">
            <p>Guidelines for PM-Surya Ghar: Muft Bijli Yojana</p>
            <p>Central Financial Assistance to Residential Consumers</p>
          </div>

          <p>
            maintain the PR of the plant till warranty of project i.e. 5 years from the date of commissioning.
          </p>

          <p className="font-bold text-[12px]">
            19. Mutually Agreed Terms of Payment …
          </p>

          {/* Signatures Grid */}
          <div className="pt-8 border-t border-slate-300">
            <div className="grid grid-cols-2 gap-8 text-[11.5px]">
              <div className="space-y-4">
                <p className="font-bold underline">First Party (Consumer)</p>
                <p>Name: <strong>{beneficiaryName}</strong></p>
                <p className="leading-snug">Address: {address}, {district}</p>
                <div className="pt-8">
                  <div className="h-10 border-b border-black w-48 mb-1"></div>
                  <p className="text-[10.5px] font-semibold">Sign: ____________________</p>
                  <p className="text-[10.5px] mt-2">Date: {day}/{month}/20{year}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-bold underline">Second Party (Vendor)</p>
                <p>Name: <strong>{vendorName}</strong></p>
                <p className="leading-snug">Address: {vendorAddress}</p>
                <div className="pt-8">
                  <div className="h-10 border-b border-black w-48 mb-1"></div>
                  <p className="text-[10.5px] font-semibold">Sign: ____________________</p>
                  <p className="text-[10.5px] mt-2">Date: {day}/{month}/20{year}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PdfPage>

    </div>
  );
};

// ============================================================================
// DOCUMENT 5: OFFICIAL STANDARD 1-PAGE QUOTATION
// ============================================================================

export const StandardQuotationPDF = ({ data }: { data: any }) => {
  const vendorName = data.company_name || data.vendorName || "Ekvarta Energy Solutions";
  const gstin = data.gstin || "27DTXPM6427E1Z3";
  const date = data.quotation_date || data.quotationDate || "12 /10/ 2026";
  const qNumber = data.quotation_number || data.qNumber || "EES/2026/031";

  const customerName = (data.customer_name || data.customerName || "RAVI DODKUJI KAWALE").toUpperCase();
  const consumerNumber = data.consumer_number || data.consumerNumber || "413472965142";

  const panelBrand = data.panel_brand || data.panelBrand || "Adani";
  const panelWattage = data.panel_wattage || data.panelWattage || 550;
  const panelQty = data.panel_quantity || data.panelQuantity || 8;

  const inverterBrand = data.inverter_brand || data.inverterBrand || "Polycab";
  const inverterCap = data.inverter_capacity || data.inverterCapacity || 4.3;
  const inverterQty = data.inverter_quantity || data.inverterQuantity || 1;

  const structureBrand = data.structure_brand || data.structureBrand || "GI Structure";

  const totalAmount = data.grand_total || data.total || 245000;
  const totalInWords = data.amount_in_words_custom || toIndianWords(totalAmount);

  return (
    <PdfPage className="text-[12px] leading-normal justify-between">
      <div>
        {/* Title */}
        <h1 className="text-center font-black text-[22px] tracking-wider mb-8 text-black uppercase">
          QUOTATION
        </h1>

        {/* Company & Quote Metadata */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-[14px] font-extrabold text-black">{vendorName}</h2>
            <p className="text-[11px] font-semibold text-slate-700 mt-0.5">GST No.: {gstin}</p>
            <p className="text-[11px] font-semibold text-slate-700">Date: {date}</p>
            <p className="text-[11px] font-semibold text-slate-700">Quotation No.: {qNumber}</p>
          </div>
        </div>

        {/* Consumer Details */}
        <div className="mb-4">
          <p className="font-bold text-[12px] underline mb-1">Consumer Details</p>
          <p className="text-[11.5px] font-bold">Consumer Name:- {customerName}</p>
          <p className="text-[11.5px] font-bold">Consumer Number: {consumerNumber}</p>
        </div>

        {/* Quotation Items Table */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-black text-[11.5px]">
            <thead>
              <tr className="bg-gray-100 text-center font-bold">
                <th className="border border-black p-2 w-14">Sr No</th>
                <th className="border border-black p-2 text-left px-4">Item Description</th>
                <th className="border border-black p-2 w-28">Quantity</th>
                <th className="border border-black p-2 text-left px-4">Specification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 text-center font-semibold">1</td>
                <td className="border border-black p-2 px-4 font-medium">Solar Inverter / PV Modules</td>
                <td className="border border-black p-2 text-center">{panelQty}</td>
                <td className="border border-black p-2 px-4">{panelBrand} Panel – {panelWattage} Watt</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-center font-semibold">2</td>
                <td className="border border-black p-2 px-4 font-medium">Solar Inverter</td>
                <td className="border border-black p-2 text-center">{inverterQty}</td>
                <td className="border border-black p-2 px-4">{inverterBrand} {inverterCap}kW</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-center font-semibold">3</td>
                <td className="border border-black p-2 px-4 font-medium">Mounting Structure</td>
                <td className="border border-black p-2 text-center">1 Set</td>
                <td className="border border-black p-2 px-4">{structureBrand}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-center font-semibold">4</td>
                <td className="border border-black p-2 px-4 font-medium">DC/AC Wiring &amp; Accessories</td>
                <td className="border border-black p-2 text-center">1 Set</td>
                <td className="border border-black p-2 px-4">Standard Solar Cable</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-center font-semibold">5</td>
                <td className="border border-black p-2 px-4 font-medium">Installation &amp; Commissioning</td>
                <td className="border border-black p-2 text-center">1</td>
                <td className="border border-black p-2 px-4">Complete Setup</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Amount in Figures & Words */}
        <div className="mb-6 p-2 bg-gray-50 border border-slate-300">
          <p className="font-bold text-[12.5px]">
            Total Quotation Amount: {formatINR(totalAmount)}/- ({totalInWords})
          </p>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-8 space-y-1 text-[11px] text-slate-800">
          <p className="font-bold text-[11.5px] mb-1">Terms &amp; Conditions</p>
          <p>• Price includes installation and standard accessories.</p>
          <p>• Transportation charges may apply depending on site location.</p>
          <p>• Payment Terms: 50% advance and 50% after installation.</p>
          <p>• Product warranty as per manufacturer policy.</p>
        </div>
      </div>

      {/* Authorized Signatory Block */}
      <div className="pb-8">
        <div className="w-64">
          <p className="font-bold text-[11.5px]">Authorized Signatory</p>
          <p className="font-semibold text-[11px] text-slate-700">For {vendorName}</p>
          
          <div className="h-14 flex items-center my-1">
            {data.signatureUrl ? (
              <img src={data.signatureUrl} className="max-h-12 object-contain" alt="Authorized Signature" />
            ) : null}
          </div>
          
          <p className="text-[11px] font-semibold">Signature: _________________________</p>
        </div>
      </div>
    </PdfPage>
  );
};

// ============================================================================
// LEGACY BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

export const GuaranteeCertificate = ({ data }: { data: any }) => (
  <PdfPage className="text-[13px] leading-relaxed">
    <h2 className="font-bold text-lg mb-8 underline text-center">Guarantee Certificate Undertaking to be submitted by VENDOR</h2>
    
    <p className="mb-8 text-justify">
      The undersigned will provide the services to the consumers for repairs/maintenance of the RTS plant 
      free of cost for 5 years of the comprehensive Maintenance Contract (CMC) period from the date of 
      commissioning of the plant. Non performing/under-performing system component will be 
      replaced/repaired free of cost in the CMC period.
    </p>

    <div className="space-y-4 mb-10">
      <p>Signature [Vendor]: _________________________</p>
      <p>Stamp &amp; Seal: _________________________</p>
    </div>

    <div className="space-y-3 mb-10">
      <h3 className="font-semibold underline">Identity Details of Consumer:</h3>
      <p>Name: <strong>{data.beneficiaryName || data.customerName}</strong></p>
      <p>Aadhar Number: ___________________________________________</p>
    </div>

    <div className="border-2 border-dashed border-gray-400 p-20 text-center">
      <p className="text-gray-500 font-semibold mb-1">Attach Xerox copy of AADHAR CARD HERE</p>
      <p className="text-gray-400 text-xs">SHOULD BE SELF ATTESTED BY CONSUMER</p>
    </div>
  </PdfPage>
);

export const DcrDeclaration = DcrUndertaking;
export const AnnexureProforma = CommissioningCertificate;
export const NetMeteringAgreement = NetMeteringAgreement2019;
