"use client";

import React from "react";

export const generateDiscomPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Patch window.getComputedStyle to strip lab/oklch colors for html2canvas
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(el, pseudoElt) {
    const style = originalGetComputedStyle.call(window, el, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        let value = Reflect.get(target, prop, receiver);
        if (typeof value === 'string' && (value.includes('lab(') || value.includes('oklch(') || value.includes('color('))) {
          if (prop === 'color' || prop === 'backgroundColor') return 'rgb(0, 0, 0)';
          return 'rgba(0, 0, 0, 0)'; 
        }
        return value;
      }
    });
  };

  const opt: any = {
    margin: 10, // Added margin for official forms
    filename: filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] }
  };

  try {
    const _html2pdf = require("html2pdf.js");
    const html2pdf = _html2pdf.default || _html2pdf;
    return await html2pdf().set(opt).from(element).save();
  } catch (err: any) {
    console.error("PDF generation error:", err);
    throw err;
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
};

const PdfPage = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`w-[210mm] min-h-[297mm] relative overflow-hidden flex flex-col bg-white text-black p-8 page-break-after-always ${className}`}>
    {children}
  </div>
);

// Form Components
export const WorkCompletionReport = ({ data }: { data: any }) => (
  <PdfPage className="text-[12px] leading-snug">
    <h2 className="text-center font-bold text-lg mb-6 underline">Work Completion Report for Solar Power Plant</h2>
    
    <table className="w-full border-collapse border border-black mb-6">
      <tbody>
        <tr>
          <td className="border border-black p-2 w-12 text-center">1</td>
          <td className="border border-black p-2 font-semibold">Name</td>
          <td className="border border-black p-2 uppercase font-bold">{data.customerName}</td>
        </tr>
        <tr>
          <td className="border border-black p-2 text-center">2</td>
          <td className="border border-black p-2 font-semibold">Consumer number</td>
          <td className="border border-black p-2 font-bold">{data.consumerNumber || '_________________'}</td>
        </tr>
        <tr>
          <td className="border border-black p-2 text-center">3</td>
          <td className="border border-black p-2 font-semibold">Site/Location With Complete Address</td>
          <td className="border border-black p-2 uppercase">{data.address}</td>
        </tr>
        <tr>
          <td className="border border-black p-2 text-center">4</td>
          <td className="border border-black p-2 font-semibold">Category: Govt/Private Sector</td>
          <td className="border border-black p-2">{data.category || 'Private (Residential)'}</td>
        </tr>
        <tr>
          <td className="border border-black p-2 text-center">5</td>
          <td className="border border-black p-2 font-semibold">Sanction number</td>
          <td className="border border-black p-2">{data.sanctionNumber || '_________________'}</td>
        </tr>
        <tr>
          <td className="border border-black p-2 text-center" rowSpan={2}>6</td>
          <td className="border border-black p-2 font-semibold">Sanctioned Capacity of solar PV system (KW) Installed</td>
          <td className="border border-black p-2">{data.capacity} KW</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">Capacity of solar PV system (KW)</td>
          <td className="border border-black p-2">{data.capacity} KW</td>
        </tr>
        <tr>
          <td colSpan={3} className="border border-black p-2 text-center font-bold bg-gray-100">Specification of the Modules</td>
        </tr>
        <tr>
          <td className="border border-black p-2 text-center" rowSpan={6}>7</td>
          <td className="border border-black p-2 font-semibold">Make of Module</td>
          <td className="border border-black p-2">{data.moduleMake || '_________________'}</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">ALMM Model Number</td>
          <td className="border border-black p-2">{data.almmModel || '_________________'}</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">Wattage per module</td>
          <td className="border border-black p-2">{data.moduleWattage || '___'} W</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">No. of Module</td>
          <td className="border border-black p-2">{data.moduleQuantity || '___'}</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">Total Capacity (KWP)</td>
          <td className="border border-black p-2">{data.capacity} KW</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">Warrantee Details (Product + Performance)</td>
          <td className="border border-black p-2">25 Years Performance</td>
        </tr>
        <tr>
          <td colSpan={3} className="border border-black p-2 text-center font-bold bg-gray-100">PCU</td>
        </tr>
        <tr>
          <td className="border border-black p-2 text-center" rowSpan={6}>8</td>
          <td className="border border-black p-2 font-semibold">Make & Model number of Inverter</td>
          <td className="border border-black p-2">{data.inverterMake || '_________________'}</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">Rating</td>
          <td className="border border-black p-2">{data.capacity} KW</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">Type of charge controller/ MPPT</td>
          <td className="border border-black p-2">MPPT</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">Capacity of Inverter</td>
          <td className="border border-black p-2">{data.capacity} KW</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">HPD</td>
          <td className="border border-black p-2">Provided</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">Year of manufacturing</td>
          <td className="border border-black p-2">{new Date().getFullYear()}</td>
        </tr>
        <tr>
          <td colSpan={3} className="border border-black p-2 text-center font-bold bg-gray-100">Earthing and Protections</td>
        </tr>
        <tr>
          <td className="border border-black p-2 text-center" rowSpan={3}>9</td>
          <td className="border border-black p-2 font-semibold">No of Separate Earthings with earth Resistance</td>
          <td className="border border-black p-2">{data.earthingCount || '3'} nos, &lt; 5 Ohms</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold text-xs text-justify">
            It is certified that the Earth Resistance measure in presence of Licensed Electrical Contractor/Supervisor and found in order i.e. &lt; 5 Ohms as per MNRE OM Dtd. 07.06.24 for CFA Component.
          </td>
          <td className="border border-black p-2 font-bold text-center">CERTIFIED</td>
        </tr>
        <tr>
          <td className="border border-black p-2 font-semibold">Lightening Arrester</td>
          <td className="border border-black p-2 font-bold">PROVIDED</td>
        </tr>
      </tbody>
    </table>

    <div className="space-y-4 text-sm text-justify">
      <p>
        We <strong>{data.vendorName} [Vendor]</strong> & <strong>{data.customerName} [Consumer]</strong> bearing 
        Consumer Number <strong>{data.consumerNumber || '_______________'}</strong> Ensured structural stability of installed solar power plant 
        and obtained requisite permissions from the concerned authority. If in future, by virtue of any 
        means due to collapsing or damage to installed solar power plant, MSEDCL will not be held 
        responsible for any loss to property or human life, if any.
      </p>
      <p>
        This is to Certified above Installed Solar PV System is working properly with electrical safety & 
        Islanding switch in case of any presence of backup inverter an arrangement should be made in such 
        way the backup inverter supply should never be synchronized with solar inverter to avoid any 
        electrical accident due to back feeding. We will be held responsible for non-working of islanding 
        mechanism and back feed to the de-energized grid.
      </p>
    </div>

    <div className="flex justify-between mt-20 pt-8">
      <div className="text-center font-semibold">
        __________________________<br/>
        Signature [Vendor]
      </div>
      <div className="text-center font-semibold">
        __________________________<br/>
        Signature [Consumer]
      </div>
    </div>
  </PdfPage>
);

export const GuaranteeCertificate = ({ data }: { data: any }) => (
  <PdfPage className="text-[14px]">
    <h2 className="font-bold text-lg mb-8 underline">Guarantee Certificate Undertaking to be submitted by VENDOR</h2>
    
    <p className="mb-12 leading-relaxed text-justify">
      The undersigned will provide the services to the consumers for repairs/maintenance of the RTS plant 
      free of cost for 5 years of the comprehensive Maintenance Contract (CMC) period from the date of 
      commissioning of the plant. Non performing/under-performing system component will be 
      replaced/repaired free of cost in the CMC period.
    </p>

    <div className="space-y-6">
      <p>Signature [Vendor]: _________________________</p>
      <p>Stamp & Seal: _________________________</p>
    </div>

    <div className="mt-16 space-y-4">
      <h3 className="font-semibold underline">Identity Details of Consumer:</h3>
      <p>Name: <strong>{data.customerName}</strong></p>
      <p>Aadhar Number: ___________________________________________</p>
    </div>

    <div className="mt-16 border-2 border-dashed border-gray-400 p-24 text-center">
      <p className="text-gray-500 font-semibold mb-2">Upload Xerox of AADHAR CARD HERE</p>
      <p className="text-gray-400 text-sm">SHOULD BE SELF ATTESTED BY CONSUMER</p>
    </div>
  </PdfPage>
);

export const DcrDeclaration = ({ data }: { data: any }) => (
  <PdfPage className="text-[13px] leading-relaxed">
    <h2 className="font-bold text-lg mb-2 text-center">Undertaking/Self- Declaration for Domestic Content Requirement fulfillment</h2>
    <p className="text-center mb-8">(On a plain Paper)</p>
    
    <div className="space-y-4 text-justify">
      <p>
        1. This is to certify that M/S. <strong>{data.vendorName}</strong> [Company Name] has 
        installed <strong>{data.capacity}</strong> KW [Capacity] Grid Connected Rooftop Solar Plant 
        for <strong>{data.customerName}</strong> [Consumer Name] at <strong>{data.address}</strong> [Address] 
        under application number ____________________ dated ____________________ [date of application] 
        under <strong>MSEDCL</strong> [DISCOM Name].
      </p>
      <p>
        2. It is hereby undertaken that the PV modules installed for the above-mentioned project are 
        domestically manufactured using domestic manufactured solar cells. The details of installed PV 
        Modules are follows:
      </p>
      <div className="pl-8 space-y-2 font-medium">
        <p>1. PV Module Capacity: {data.moduleWattage || '___'} W</p>
        <p>2. Number of PV Modules: {data.moduleQuantity || '___'}</p>
        <p>3. Sr No of PV Module: As per packing list</p>
        <p>4. PV Module Make: {data.moduleMake || '________________'}</p>
        <p>5. Cell manufacturer's name: {data.cellMake || '________________'}</p>
        <p>6. Cell GST invoice No: ________________</p>
      </div>
      <p>
        3. The above undertaking is based on the certificate issued by PV Module manufacturer/supplier 
        while supplying the above mentioned order.
      </p>
      <p>
        4. I, __________________ on behalf of M/S. <strong>{data.vendorName}</strong> [Company Name] 
        further declare that the information given above is true and correct and nothing has been 
        concealed therein. If anything is found incorrect at any stage, then REC/ MNRE may take any 
        appropriate action against my company for wrong declaration. Supporting documents and proof 
        of the above information will be provided as and when requested by MNRE.
      </p>
    </div>

    <div className="mt-16 flex justify-end">
      <div className="w-1/2 space-y-4">
        <p className="text-center mb-8">(Signature With official Seal)</p>
        <p>For M/S. <strong>{data.vendorName}</strong></p>
        <p>Name: ______________________________</p>
        <p>Designation: ______________________________</p>
        <p>Phone: ______________________________</p>
        <p>Email: ______________________________</p>
      </div>
    </div>
  </PdfPage>
);

export const AnnexureProforma = ({ data }: { data: any }) => (
  <PdfPage className="text-[12px] leading-snug">
    <h2 className="text-center font-bold text-md text-gray-500 uppercase tracking-widest">Renewable Energy Generating System</h2>
    <h3 className="text-center font-bold text-lg mt-1 mb-1">Annexure-I</h3>
    <p className="text-center font-medium mb-6">(Commissioning Report for RE System)</p>
    
    <table className="w-full text-left mb-10">
      <thead>
        <tr>
          <th className="py-2 w-10">SNo.</th>
          <th className="py-2 w-1/3">Particulars</th>
          <th className="py-2">As Commissioned</th>
        </tr>
      </thead>
      <tbody className="font-medium">
        <tr><td className="py-1">1</td><td className="py-1">Name of the Consumer</td><td className="py-1 font-bold uppercase">{data.customerName}</td></tr>
        <tr><td className="py-1">2</td><td className="py-1">Consumer Number</td><td className="py-1">{data.consumerNumber || '____________________'}</td></tr>
        <tr><td className="py-1">3</td><td className="py-1">Mobile Number</td><td className="py-1">{data.customerPhone || '____________________'}</td></tr>
        <tr><td className="py-1">4</td><td className="py-1">E-mail</td><td className="py-1">{data.customerEmail || '____________________'}</td></tr>
        <tr><td className="py-1">5</td><td className="py-1">Address of Installation</td><td className="py-1">{data.address}</td></tr>
        <tr><td className="py-1 pt-4">6</td><td className="py-1 pt-4">RE Arrangement Type</td><td className="py-1 pt-4">Net Metering Arrangement</td></tr>
        <tr><td className="py-1">7</td><td className="py-1">RE Source</td><td className="py-1">Solar</td></tr>
        <tr><td className="py-1">8</td><td className="py-1">Sanctioned Capacity(KW)</td><td className="py-1">{data.capacity}</td></tr>
        <tr><td className="py-1">9</td><td className="py-1">Capacity Type</td><td className="py-1">KW</td></tr>
        <tr><td className="py-1">10</td><td className="py-1">Project Model</td><td className="py-1">CAPEX</td></tr>
        <tr><td className="py-1">11</td><td className="py-1">RE installed Capacity(Rooftop)(KW)</td><td className="py-1">{data.capacity}</td></tr>
        <tr><td className="py-1">14</td><td className="py-1">Installation date</td><td className="py-1 border border-black px-2">{new Date().toLocaleDateString()}</td></tr>
        <tr><td colSpan={3} className="py-3 font-bold">15 SolarPV Details</td></tr>
        <tr><td></td><td className="py-1 pl-4">Inverter Capacity(KW)</td><td className="py-1 border border-black px-2">{data.capacity}</td></tr>
        <tr><td></td><td className="py-1 pl-4">Inverter Make</td><td className="py-1 border border-black px-2">{data.inverterMake || '________'}</td></tr>
        <tr><td></td><td className="py-1 pl-4">No. of PV Modules</td><td className="py-1 border border-black px-2">{data.moduleQuantity || '____'}</td></tr>
        <tr><td></td><td className="py-1 pl-4">Module Capacity (KW)</td><td className="py-1 border border-black px-2">{data.capacity}</td></tr>
      </tbody>
    </table>

    <div className="mt-8">
      <h3 className="text-center font-bold text-lg mb-4">Proforma-A</h3>
      <p className="text-center font-bold text-sm mb-6 uppercase">Commissioning Report (Provisional) for Grid Connected Solar Photovoltaic Power Plant (with Net-metering facility)</p>
      
      <p className="text-justify leading-loose font-medium">
        Certified that a Grid Connected SPV Power Plant of <strong>{data.capacity} KWp</strong> capacity has been installed at the site <strong>{data.address}</strong> 
        District <strong>{data.city || '________________'}</strong> of MAHARASHTRA which has been installed by M/S <strong>{data.vendorName}</strong> on 
        <strong> {new Date().toLocaleDateString()}</strong>. The system is as per BIS/MNRE specifications. The system has been checked for its 
        performance and found in order for further commissioning.
      </p>

      <div className="flex justify-between mt-24">
        <div className="font-bold">Signature of the beneficiary</div>
        <div className="font-bold">Signature of the agency with name, seal and date</div>
      </div>
    </div>
  </PdfPage>
);
