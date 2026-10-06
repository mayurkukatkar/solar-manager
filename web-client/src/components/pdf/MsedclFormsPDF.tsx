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

export const NetMeteringAgreement = ({ data }: { data: any }) => (
  <div className="flex flex-col">
    <PdfPage className="text-[13px] leading-relaxed text-justify">
      <h2 className="text-center font-bold text-lg mb-6">Net Metering Connection Agreement</h2>
      <p className="mb-4">
        This Agreement is made and entered into at <strong>{data.city || '________________'}</strong> on this <strong>{new Date().getDate()}</strong> day of <strong>{new Date().getMonth()+1}/{new Date().getFullYear()}</strong> between the Eligible Consumer <strong>{data.customerName}</strong> having premises at <strong>{data.address}</strong> and Consumer No. <strong>{data.consumerNumber || '________________'}</strong> As the first Party,
      </p>
      <p className="text-center font-bold my-4">AND</p>
      <p className="mb-4">
        The Distribution Licensee- Maharashtra State Electricity Distribution Co. Ltd; and having its Registered Office at Prakashgad, Plot No. G-9, Anant Kanekar Marg, Bandra (E), Mumbai 400051 as second Party of this Agreement;
      </p>
      <p className="mb-4">
        Whereas, the Eligible Consumer has applied to the Licensee for approval of a Net Metering Arrangement under the provisions of the Maharashtra Electricity Regulatory Commission (Net Metering for Roof-top Solar Photo Voltaic Systems) Regulations, 2015 ('the Net Metering Regulations') and sought its connectivity to the Licensee's Distribution Network;
      </p>
      <p className="mb-4">
        And whereas, the Licensee has agreed to provide Network connectivity to the Eligible Consumer for injection of electricity generated from its Roof-top Solar PV System of <strong>{data.capacity}</strong> kilowatt;
      </p>
      <p className="mb-4 font-bold">Both Parties hereby agree as follows:-</p>
      
      <h3 className="font-bold mt-4 mb-2">1. Eligibility:</h3>
      <p className="mb-4 pl-6">
        The Roof-top Solar PV System meets the applicable norms for being integrated into the Distribution Network, and that the Eligible Consumer shall maintain the System accordingly for the duration of this Agreement.
      </p>

      <h3 className="font-bold mt-4 mb-2">2. Technical and Inter-connection Requirements:</h3>
      <p className="mb-2 pl-6">
        The metering arrangement and the inter-connection of the Roof-top Solar PV System with the Network of the Licensee shall be as per the provisions of the Net Metering Regulations and the technical standards and norms specified by the Central Electricity Authority for connectivity of distributed generation resources and for the installation and operation of meters.
      </p>
      <p className="mb-2 pl-6">
        The Eligible Consumer agrees, that he shall install, prior to connection of the Roof-top Solar PV System to the Network of the Licensee, an isolation device (both automatic and in built within inverter and external manual relays); and the Licensee shall have access to it if required for the repair and maintenance of the Distribution Network.
      </p>
      <p className="mb-2 pl-6">
        The Licensee shall specify the interface/inter-connection point and metering point.
      </p>
      <p className="mb-4 pl-6">
        The Eligible Consumer shall furnish all relevant data, such as voltage, frequency, circuit breaker, isolator position in his System, as and when required by the Licensee.
      </p>

      <h3 className="font-bold mt-4 mb-2">3. Safety:</h3>
      <p className="mb-2 pl-6">
        The equipment connected to the Licensee's Distribution System shall be compliant with relevant International (IEEE/IEC) or Indian Standards (BIS), as the case may be, and the installation of electrical equipment shall comply with the requirements specified by the Central Electricity Authority regarding safety and electricity supply.
      </p>
    </PdfPage>

    <PdfPage className="text-[13px] leading-relaxed text-justify">
      <p className="mb-2 pl-6">
        The design, installation, maintenance and operation of the Roof-top Solar PV System shall be undertaken in a manner conducive to the safety of the Roof-top Solar PV System as well as the Licensee's Network.
      </p>
      <p className="mb-2 pl-6">
        If, at any time, the Licensee determines that the Eligible Consumer's Roof-top Solar PV System is causing or may cause damage to and/or results in the Licensee's other consumers or its assets, the Eligible Consumer shall disconnect the Roof-top Solar PV System from the distribution Network upon direction from the Licensee, and Shall undertake corrective measures at his own expense prior to re-connection.
      </p>
      <p className="mb-6 pl-6">
        The Licensee shall not be responsible for any accident resulting in injury to human beings or animals or damage to property that may occur due to back-feeding from the Roof-top Solar PV System when the grid supply is off. The Licensee may disconnect the installation at any time in the event of such exigencies to prevent such accident.
      </p>

      <h3 className="font-bold mt-4 mb-2">4. Other Clearances and Approvals:</h3>
      <p className="mb-6 pl-6">
        The Eligible Consumer shall obtain any statutory approvals and clearances that maybe required, such as from the Electrical Inspector or the municipal or other authorities, before connecting the Roof-top Solar PV System to the distribution Network.
      </p>

      <h3 className="font-bold mt-4 mb-2">5. Period of Agreement, and Termination:</h3>
      <p className="mb-2 pl-6">
        This Agreement shall be for a period for 20 years, but may be terminated prematurely:
      </p>
      <p className="mb-1 pl-10">(a) By mutual consent; or</p>
      <p className="mb-1 pl-10">(b) By the Eligible Consumer, by giving 30 days' notice to the Licensee;</p>
      <p className="mb-6 pl-10">(c) By the Licensee, by giving 30 days' notice, if the Eligible Consumer breaches any terms of this Agreement or the provisions of the Net Metering Regulations and does not remedy such breach within 30 days, or such other reasonable period as may be provided, of receiving notice of such breach, or for any other valid reason communicated by the Licensee in writing.</p>

      <h3 className="font-bold mt-4 mb-2">6. Access and Disconnection:</h3>
      <p className="mb-2 pl-6">
        The Eligible Consumer shall provide access to the Licensee to the metering equipment and disconnecting devices of Roof-top Solar PV System, both automatic and manual, by the Eligible Consumer.
      </p>
      <p className="mb-2 pl-6">
        If, in an emergent or outage situation, the Licensee cannot access the disconnecting devices of the Roof-top Solar PV System, both automatic and manual, it may disconnect power supply to the premises.
      </p>
      <p className="mb-6 pl-6">
        6.3 Upon termination of this Agreement under Clause 5, the Eligible Consumer shall disconnect the Roof-top Solar PV System forthwith from the Network of the Licensee.
      </p>

      <h3 className="font-bold mt-4 mb-2">7. Liabilities:</h3>
      <p className="mb-2 pl-6">
        The Parties shall indemnify each other for damages or adverse effects of either Party's negligence or misconduct during the installation of the Roof-top Solar PV System, connectivity with the distribution Network and operation of the System.
      </p>
    </PdfPage>

    <PdfPage className="text-[13px] leading-relaxed text-justify">
      <p className="mb-6 pl-6">
        The Parties shall not be liable to each other for any loss of profits or revenues, business interruption losses, loss of contract or goodwill, or for indirect, consequential, incidental or special damages including, but not limited to, punitive or exemplary damages, whether any of these liabilities, losses or damages arise in contract, or otherwise.
      </p>

      <h3 className="font-bold mt-4 mb-2">8. Commercial Settlement:</h3>
      <p className="mb-2 pl-6">
        The commercial settlements under this Agreement shall be in accordance with the Net Metering Regulations.
      </p>
      <p className="mb-2 pl-6">
        The Licensee shall not be liable to compensate the Eligible Consumer if his Rooftop Solar PV System is unable to inject surplus power generated into the Licensee's Network on account of failure of power supply in the grid/Network.
      </p>
      <p className="mb-2 pl-6">
        The existing metering System, if not in accordance with the Net Metering Regulations, shall be replaced by a bi-directional meter (whole current/CT operated) or a pair of meters (as per the definition of 'Net Meter' in the Regulations), and a separate generation meter may be provided to measure Solar power generation. The bi-directional meter (whole current/CT operated) or pair of meters shall be installed at the inter-connection point to the Licensee's Network for recording export and import of energy.
      </p>
      <p className="mb-2 pl-6">
        The uni-directional and bi-directional or pair of meters shall be fixed in separate meter boxes in the same proximity.
      </p>
      <p className="mb-6 pl-6">
        The Licensee shall issue monthly electricity bill for the net metered energy on the scheduled date of meter reading. If the exported energy exceeds the imported energy, the Licensee shall show the net energy exported as credited Units of electricity as specified in the Net Metering Regulations, 2015. If the exported energy is less than the imported energy, the Eligible Consumer shall pay the Distribution Licensee for the net energy imported at the prevailing tariff approved by the Commission for the consumer category to which he belongs.
      </p>

      <h3 className="font-bold mt-4 mb-2">9. Connection Costs:</h3>
      <p className="mb-6 pl-6">
        The Eligible Consumer shall bear all costs related to the setting up of the Roof-top Solar PV System, excluding the Net Metering Arrangement costs.
      </p>

      <h3 className="font-bold mt-4 mb-2">10. Dispute Resolution:</h3>
      <p className="mb-2 pl-6">
        Any dispute arising under this Agreement shall be resolved promptly, in good faith and in an equitable manner by both the Parties.
      </p>
      <p className="mb-12 pl-6">
        The Eligible Consumer shall have recourse to the concerned Consumer Grievance Redressal Forum constituted under the relevant Regulations in respect of any grievance regarding billing which has not been redressed by the Licensee.
      </p>

      <p className="mb-12">
        In the witness where of <strong>{data.vendorName}</strong> for and on behalf of Eligible Consumer and Shri. __________________________________ for and on behalf of MSEDCL agree to this agreement.
      </p>

      <div className="grid grid-cols-2 gap-y-12">
        <div>
          <p className="font-bold mb-10">{data.customerName}</p>
          <p className="border-t border-black pt-2 w-64">For Eligible Consumer</p>
        </div>
        <div>
          <p className="font-bold mb-10">Shri. ____________________</p>
          <p className="border-t border-black pt-2 w-64">for and on behalf of MSEDCL</p>
        </div>
        <div>
          <p className="font-bold mb-8"></p>
          <p className="border-t border-black pt-2 w-64">Witness 1 (VENDOR)</p>
        </div>
        <div>
          <p className="font-bold mb-8"></p>
          <p className="border-t border-black pt-2 w-64">Witness 2</p>
        </div>
      </div>
    </PdfPage>
  </div>
);
