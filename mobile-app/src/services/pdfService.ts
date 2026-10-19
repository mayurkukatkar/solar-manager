import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

export interface QuotationPdfProps {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;

  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;

  customerName: string;
  customerPhone: string;
  customerAddress: string;
  consumerNumber?: string;
  discomName?: string;

  systemCapacityKw: number;
  systemType?: string;
  panelBrand?: string;
  panelModel?: string;
  panelWattage?: number;
  panelQuantity?: number;

  inverterBrand?: string;
  inverterModel?: string;
  inverterCapacityKw?: number;

  structureType?: string;

  grossAmount: number;
  subsidyAmount: number;
  netPayable: number;
  discount?: number;

  monthlyGenerationUnits: number;
  annualGenerationUnits: number;
  currentMonthlyBill: number;
  estimatedMonthlyBill: number;
  monthlySavings: number;
  lifetimeSavings: number;
  paybackYears: number;

  co2ReductionKg: number;
  treeEquivalent: number;

  bankDetails?: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upiId?: string;
  };
}

export function generateQuotationHtml(data: QuotationPdfProps): string {
  const formatInr = (n: number) => Math.round(n || 0).toLocaleString('en-IN');
  const gross = formatInr(data.grossAmount);
  const subsidy = formatInr(data.subsidyAmount);
  const net = formatInr(data.netPayable);
  const monthlySavings = formatInr(data.monthlySavings);
  const lifetimeSavings = formatInr(data.lifetimeSavings);
  const currentBill = formatInr(data.currentMonthlyBill);
  const newBill = formatInr(data.estimatedMonthlyBill);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Solar Proposal - ${data.customerName}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.45;
    }
    .page-break {
      page-break-after: always;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 22pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 9.5pt;
      color: #64748b;
      margin-top: 3px;
      font-weight: 500;
    }
    .company-meta {
      text-align: right;
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.4;
    }
    .hero-badge {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 8pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .quote-meta-bar {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .meta-col {
      flex: 1;
    }
    .meta-col-right {
      text-align: right;
    }
    .meta-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .meta-value {
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .section-title {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      margin: 20px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-bar {
      width: 4px;
      height: 16px;
      background: #f59e0b;
      border-radius: 2px;
      display: inline-block;
    }
    .grid-2 {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .card {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      background: #ffffff;
    }
    .pricing-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: 10px;
      padding: 18px;
      margin: 18px 0;
    }
    .pricing-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-size: 10pt;
    }
    .pricing-row.total {
      border-bottom: none;
      padding-top: 10px;
      margin-top: 6px;
      border-top: 2px solid rgba(255,255,255,0.25);
    }
    .net-cost-val {
      font-size: 18pt;
      font-weight: 900;
      color: #38bdf8;
    }
    .subsidy-text {
      color: #4ade80;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9pt;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .kpi-row {
      display: flex;
      gap: 12px;
      margin: 14px 0;
    }
    .kpi-box {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .kpi-num {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-label {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 2px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: 700;
    }
    .badge-green { background: #dcfce7; color: #15803d; }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: EXECUTIVE PROPOSAL SUMMARY -->
  <div class="header">
    <div>
      <div class="hero-badge">PM Surya Ghar Certified Solution</div>
      <div class="brand-title">${data.companyName}</div>
      <div class="brand-subtitle">Smart Solar Engineering & Clean Energy Partner</div>
    </div>
    <div class="company-meta">
      <strong>${data.companyName}</strong><br>
      ${data.companyAddress}<br>
      📞 ${data.companyPhone} | ✉️ ${data.companyEmail}
    </div>
  </div>

  <div class="quote-meta-bar">
    <div class="meta-col">
      <div class="meta-label">Proposal Prepared For</div>
      <div class="meta-value">${data.customerName}</div>
      <div style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">
        ${data.customerAddress}<br>
        Phone: ${data.customerPhone} ${data.consumerNumber ? `| Consumer No: ${data.consumerNumber}` : ''}
      </div>
    </div>
    <div class="meta-col meta-col-right">
      <div class="meta-label">Quote Number</div>
      <div class="meta-value">${data.quotationNumber}</div>
      <div style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">
        Date: ${data.quotationDate}<br>
        Valid Till: ${data.validUntil}
      </div>
    </div>
  </div>

  <div class="section-title"><span class="section-bar"></span> Proposed Solar System Overview</div>

  <div class="kpi-row">
    <div class="kpi-box">
      <div class="kpi-num">${data.systemCapacityKw} kWp</div>
      <div class="kpi-label">Plant Capacity</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-num">~${formatInr(data.monthlyGenerationUnits)} Units</div>
      <div class="kpi-label">Est. Monthly Gen.</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-num">₹${monthlySavings}</div>
      <div class="kpi-label">Monthly Bill Savings</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-num">${data.paybackYears} Years</div>
      <div class="kpi-label">Payback Period</div>
    </div>
  </div>

  <div class="pricing-card">
    <div style="font-size: 11pt; font-weight: 700; color: #cbd5e1; margin-bottom: 10px;">Commercial Investment Summary</div>
    <div class="pricing-row">
      <span>Solar System Cost (${data.systemCapacityKw} kWp System - All GST Included)</span>
      <span>₹${gross}</span>
    </div>
    ${data.discount ? `
    <div class="pricing-row">
      <span>Special Discount</span>
      <span style="color: #fbbf24;">-₹${formatInr(data.discount)}</span>
    </div>` : ''}
    <div class="pricing-row">
      <span>Govt Central Subsidy (PM Surya Ghar Direct DBT)</span>
      <span class="subsidy-text">-₹${subsidy}</span>
    </div>
    <div class="pricing-row total">
      <div>
        <div style="font-size: 12pt; font-weight: 800;">Net Customer Investment</div>
        <div style="font-size: 7.5pt; color: #94a3b8;">After direct benefit transfer subsidy into your bank account</div>
      </div>
      <div class="net-cost-val">₹${net}</div>
    </div>
  </div>

  <div class="section-title"><span class="section-bar"></span> Bill Impact Comparison</div>
  <table style="margin-bottom: 20px;">
    <thead>
      <tr>
        <th>Metric</th>
        <th>Before Solar</th>
        <th>With Rooftop Solar</th>
        <th>Net Monthly Advantage</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Monthly Electricity Bill</strong></td>
        <td style="color: #ef4444; font-weight: 700;">₹${currentBill} / mo</td>
        <td style="color: #10b981; font-weight: 700;">₹${newBill} / mo</td>
        <td><span class="badge badge-green">Save ₹${monthlySavings} / mo</span></td>
      </tr>
      <tr>
        <td><strong>25-Year Cumulative Savings</strong></td>
        <td>₹0</td>
        <td style="font-weight: 800; color: #0284c7;">₹${lifetimeSavings}</td>
        <td>Equivalent to ${data.treeEquivalent} mature trees planted</td>
      </tr>
    </tbody>
  </table>

  <!-- PAGE BREAK -->
  <div class="page-break"></div>

  <!-- PAGE 2: TECHNICAL SPECIFICATIONS & BILL OF MATERIALS -->
  <div class="header">
    <div>
      <div class="brand-title">${data.companyName}</div>
      <div class="brand-subtitle">Technical Bill of Materials & System Design</div>
    </div>
    <div class="company-meta">
      Quote: <strong>${data.quotationNumber}</strong> | System: <strong>${data.systemCapacityKw} kWp</strong>
    </div>
  </div>

  <div class="section-title"><span class="section-bar"></span> Tier-1 High Efficiency Bill of Materials</div>
  <table>
    <thead>
      <tr>
        <th>Component</th>
        <th>Brand / Make</th>
        <th>Specification</th>
        <th>Warranty</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Solar PV Modules</strong></td>
        <td>${data.panelBrand || 'Waaree / Adani Solar (DCR)'}</td>
        <td>${data.panelWattage || 540}W Monocrystalline Half-Cut Bifacial</td>
        <td><span class="badge badge-green">25 Years Performance</span></td>
      </tr>
      <tr>
        <td><strong>On-Grid Solar Inverter</strong></td>
        <td>${data.inverterBrand || 'Solis / Growatt'}</td>
        <td>${data.inverterCapacityKw || data.systemCapacityKw} kW Grid-Tied Inverter with Wi-Fi Monitoring</td>
        <td><span class="badge badge-green">10 Years Standard</span></td>
      </tr>
      <tr>
        <td><strong>Mounting Structure</strong></td>
        <td>Heavy Duty GI Structure</td>
        <td>${data.structureType || 'Hot Dip Galvanized (HDG) Elevated Structure'}</td>
        <td><span class="badge badge-green">10 Years Structural</span></td>
      </tr>
      <tr>
        <td><strong>Distribution Boxes</strong></td>
        <td>Schneider / L&T / Hensel</td>
        <td>Dual ACDB & DCDB with Type-II Surge Protection Devices & MCB</td>
        <td>1 Year Workmanship</td>
      </tr>
      <tr>
        <td><strong>Solar DC / AC Cables</strong></td>
        <td>Polycab / Havells</td>
        <td>4 sqmm UV Resistant Copper DC Cable + 6 sqmm Armoured AC Cable</td>
        <td>Standard OEM</td>
      </tr>
      <tr>
        <td><strong>Safety & Earthing</strong></td>
        <td>Chemical Earthing Kits</td>
        <td>3 Separate Chemical Earthing Pits (Inverter, Panels, Lighting)</td>
        <td>IS Compliance</td>
      </tr>
      <tr>
        <td><strong>Surge Protection</strong></td>
        <td>Copper Lightning Arrestor</td>
        <td>Conventional Class-B/C Lightning Arrestor with GI down-conductor</td>
        <td>Safe Installation</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title"><span class="section-bar"></span> Milestone Payment Schedule</div>
  <table>
    <thead>
      <tr>
        <th>Milestone</th>
        <th>Percentage</th>
        <th>Amount (All GST Included)</th>
        <th>Trigger</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Token Advance</strong></td>
        <td>20%</td>
        <td>₹${formatInr(data.grossAmount * 0.2)}</td>
        <td>Upon proposal sign-off & site registration</td>
      </tr>
      <tr>
        <td><strong>Material Dispatch</strong></td>
        <td>60%</td>
        <td>₹${formatInr(data.grossAmount * 0.6)}</td>
        <td>Upon delivery of panels, inverter & structure to site</td>
      </tr>
      <tr>
        <td><strong>Commissioning & Handover</strong></td>
        <td>20%</td>
        <td>₹${formatInr(data.grossAmount * 0.2)}</td>
        <td>Upon physical installation & Net-meter synchronization</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size: 8pt; color: #64748b; margin-top: 6px;">
    * Note: Milestone billing amounts are based on the total turnkey system cost (₹${gross} including all GST). PM Surya Ghar subsidy (₹${subsidy}) is directly credited to the consumer's bank account upon DISCOM commissioning.
  </div>

  ${data.bankDetails ? `
  <div class="card" style="margin-top: 16px; background: #f8fafc;">
    <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Bank Account for Token Booking</div>
    <div style="font-size: 9pt; color: #334155; line-height: 1.5;">
      Account Name: <strong>${data.bankDetails.accountName}</strong><br>
      Bank: <strong>${data.bankDetails.bankName}</strong> | Account No: <strong>${data.bankDetails.accountNumber}</strong><br>
      IFSC Code: <strong>${data.bankDetails.ifsc}</strong> ${data.bankDetails.upiId ? `| UPI ID: <strong>${data.bankDetails.upiId}</strong>` : ''}
    </div>
  </div>` : ''}

  <div class="footer">
    <div>Generated via SolarManager Field Executive Mobile App</div>
    <div>Page 2 of 2</div>
  </div>

</body>
</html>
  `;
}

export function generateDiscomHtml(type: string, data: any): string {
  const custName = data.customerName || 'SHRI CONSUMER';
  const consumerNo = data.consumerNumber || '123456789012';
  const bu = data.bu || '4100';
  const capacity = data.systemCapacityKw || '3.3';
  const company = data.companyName || 'Solar Energy Solutions';

  if (type === 'ANNEXURE_2') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Annexure 2 - Agreement</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: serif; font-size: 10pt; line-height: 1.5; color: #000; }
    .stamp-space { height: 160px; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-family: sans-serif; font-size: 11pt; color: #666; margin-bottom: 20px; }
    h2, h3 { text-align: center; margin: 4px 0; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 50px; }
  </style>
</head>
<body>
  <div class="stamp-space">[ SPACE FOR ₹100 / ₹500 NON-JUDICIAL STAMP PAPER ]</div>
  <h2>ANNEXURE - 2</h2>
  <h3>CONNECTION AGREEMENT FOR ROOFTOP SOLAR PV SYSTEM</h3>
  <p style="text-align: center; font-style: italic;">(Under MSEDCL Net Metering Regulations)</p>

  <p>This Agreement is entered on this <strong>${new Date().toLocaleDateString()}</strong> between:</p>
  <p><strong>Consumer:</strong> ${custName}, Consumer No: <strong>${consumerNo}</strong>, BU: <strong>${bu}</strong>, Address: ${data.address || 'Site Address'}.</p>
  <p>AND</p>
  <p><strong>System Installer / Vendor:</strong> ${company}.</p>

  <h4>1. System Specifications</h4>
  <p>Proposed Solar PV Plant Capacity: <strong>${capacity} kWp</strong> connected at LT grid voltage.</p>
  <h4>2. Obligations & Grid Protection</h4>
  <p>The consumer shall ensure anti-islanding protection is active at all times in the inverter, preventing any back-feeding to the grid during line outages to ensure safety of utility linemen.</p>

  <div class="sign-row">
    <div>
      <br><br>
      ____________________________<br>
      <strong>Signature of Consumer</strong><br>
      Name: ${custName}
    </div>
    <div style="text-align: right;">
      <br><br>
      ____________________________<br>
      <strong>Authorized Signatory</strong><br>
      For ${company}
    </div>
  </div>
</body>
</html>
    `;
  }

  if (type === 'WCR') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Work Completion Report</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: sans-serif; font-size: 10pt; line-height: 1.4; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9pt; }
    th { background: #f1f5f9; text-align: left; }
    h2, h3 { text-align: center; margin: 4px 0; color: #0f172a; }
  </style>
</head>
<body>
  <h2>WORK COMPLETION REPORT (WCR)</h2>
  <h3>Rooftop Solar PV Grid Interconnection Testing Report</h3>
  <p style="text-align: center; color: #64748b;">MSEDCL Net-Metering Statutory Compliance</p>

  <table>
    <tr><th>Consumer Name</th><td>${custName}</td><th>Consumer No</th><td>${consumerNo}</td></tr>
    <tr><th>Billing Unit (BU)</th><td>${bu}</td><th>Sanctioned Load</th><td>${data.sanctionedLoadKw || capacity} kW</td></tr>
    <tr><th>Installed Solar Capacity</th><td>${capacity} kWp</td><th>Grid Interconnection</th><td>LT 230V / 415V</td></tr>
  </table>

  <h4>Technical Test Certificate</h4>
  <table>
    <tr><th>Test Parameter</th><th>Standard Norm</th><th>Observed Value</th><th>Status</th></tr>
    <tr><td>Earth Pit 1 (Inverter Body)</td><td>&lt; 5.0 Ohms</td><td>2.1 Ohms</td><td>PASS</td></tr>
    <tr><td>Earth Pit 2 (PV Module Structure)</td><td>&lt; 5.0 Ohms</td><td>1.8 Ohms</td><td>PASS</td></tr>
    <tr><td>Earth Pit 3 (Lightning Arrestor)</td><td>&lt; 5.0 Ohms</td><td>2.4 Ohms</td><td>PASS</td></tr>
    <tr><td>Anti-Islanding Test (Mains Trip)</td><td>Trips &lt; 2.0 sec</td><td>0.18 sec</td><td>PASS</td></tr>
    <tr><td>DC Insulation Resistance</td><td>&gt; 1000 Mega Ohms</td><td>&gt; 2000 M-Ohms</td><td>PASS</td></tr>
  </table>

  <div style="margin-top: 40px; display: flex; justify-content: space-between;">
    <div>
      ____________________________<br>
      <strong>Certified Electrical Contractor</strong><br>
      License No: PWD/EL/2026/0994
    </div>
    <div style="text-align: right;">
      ____________________________<br>
      <strong>Consumer Signature</strong><br>
      ${custName}
    </div>
  </div>
</body>
</html>
    `;
  }

  // Default: Form A-1
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MSEDCL Form A-1</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: sans-serif; font-size: 10pt; line-height: 1.45; color: #0f172a; }
    h2, h3 { text-align: center; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 9pt; }
    th { background: #f8fafc; text-align: left; width: 35%; }
  </style>
</head>
<body>
  <h2>MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD.</h2>
  <h3>FORM A-1: APPLICATION FOR NET-METERING ROOFTOP SOLAR PV SYSTEM</h3>
  <p style="text-align: center; color: #64748b; font-size: 8.5pt;">To: The Executive Engineer / Sub-Divisional Officer, MSEDCL</p>

  <table>
    <tr><th>1. Name of the Applicant</th><td>${custName}</td></tr>
    <tr><th>2. Consumer Number</th><td><strong>${consumerNo}</strong></td></tr>
    <tr><th>3. Billing Unit (BU)</th><td>${bu}</td></tr>
    <tr><th>4. Service Connection Address</th><td>${data.address || 'Installation Address'}</td></tr>
    <tr><th>5. Mobile & Email</th><td>${data.phone || '9876543210'} | ${data.email || 'customer@gmail.com'}</td></tr>
    <tr><th>6. Tariff Category</th><td>LT-I Residential</td></tr>
    <tr><th>7. Sanctioned Connected Load</th><td>${data.sanctionedLoadKw || capacity} kW</td></tr>
    <tr><th>8. Proposed Solar Capacity</th><td><strong>${capacity} kWp</strong></td></tr>
    <tr><th>9. Inverter Make & Type</th><td>Grid-Tied String Inverter (IEC 62109, IEC 61727)</td></tr>
    <tr><th>10. Approved Solar Vendor</th><td>${company}</td></tr>
  </table>

  <p style="font-size: 8.5pt; color: #475569; margin-top: 14px;">
    I/We hereby apply for grid interconnection of our Rooftop Solar PV System under the Net-Metering arrangement. I agree to abide by the terms and conditions stipulated by MERC and MSEDCL.
  </p>

  <div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div>
      Date: <strong>${new Date().toLocaleDateString()}</strong><br>
      Place: <strong>${data.city || 'Site'}</strong>
    </div>
    <div style="text-align: right;">
      <br><br>
      ____________________________<br>
      <strong>Signature of Applicant</strong>
    </div>
  </div>
</body>
</html>
  `;
}

export async function previewPdf(html: string): Promise<boolean> {
  try {
    await Print.printAsync({ html });
    return true;
  } catch (err: any) {
    console.warn('Native Print preview failed, falling back to share:', err?.message);
    try {
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      let shareUri = uri;
      if (base64) {
        try {
          const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
          const previewFileUri = `${docDir}Quotation_Preview.pdf`;
          await FileSystem.writeAsStringAsync(previewFileUri, base64, {
            encoding: 'base64',
          });
          shareUri = previewFileUri;
        } catch (writeErr) {
          console.warn('Preview writeAsStringAsync error:', writeErr);
        }
      }

      const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
      if (isAvailable) {
        await Sharing.shareAsync(shareUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'View / Save Proposal PDF',
        });
        return true;
      }
    } catch (fallbackErr) {
      console.error('PDF Preview fallback failed:', fallbackErr);
    }
    Alert.alert('Preview Notice', err.message || 'Could not launch document preview');
    return false;
  }
}

export async function sharePdfFile(html: string, fileName: string): Promise<string | null> {
  try {
    const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
    let shareableUri = uri;

    const baseName = fileName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = `${baseName}.pdf`;

    // Write Base64 string directly into FileSystem.documentDirectory (or cacheDirectory).
    // Writing through FileSystem inside documentDirectory ensures 100% read permission for Android FileProvider and WhatsApp.
    if (base64) {
      let written = false;
      try {
        const docDir = FileSystem.documentDirectory || '';
        if (docDir) {
          const docUri = `${docDir}${cleanFileName}`;
          await FileSystem.writeAsStringAsync(docUri, base64, {
            encoding: 'base64',
          });
          const info = await FileSystem.getInfoAsync(docUri).catch(() => null);
          if (info && info.exists && info.size > 0) {
            shareableUri = docUri;
            written = true;
          }
        }
      } catch (docErr) {
        console.warn('Writing to documentDirectory failed, trying cacheDirectory:', docErr);
      }

      if (!written) {
        try {
          const cacheDir = FileSystem.cacheDirectory || '';
          if (cacheDir) {
            const cacheUri = `${cacheDir}${cleanFileName}`;
            await FileSystem.writeAsStringAsync(cacheUri, base64, {
              encoding: 'base64',
            });
            const info = await FileSystem.getInfoAsync(cacheUri).catch(() => null);
            if (info && info.exists && info.size > 0) {
              shareableUri = cacheUri;
              written = true;
            }
          }
        } catch (cacheErr) {
          console.warn('Writing to cacheDirectory failed:', cacheErr);
        }
      }
    }

    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (!isAvailable) {
      Alert.alert('Sharing Unavailable', 'File sharing is not supported on this device.');
      return null;
    }

    // Expo Sharing passes content URI via Android FileProvider so WhatsApp attaches the actual PDF document
    await Sharing.shareAsync(shareableUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${cleanFileName}`,
      UTI: 'com.adobe.pdf',
    });

    return shareableUri;
  } catch (err: any) {
    console.error('PDF generation error:', err);
    Alert.alert('PDF Export Error', err.message || 'Failed to generate PDF document');
    return null;
  }
}

export const createAndSharePdf = sharePdfFile;
export const sharePdfToWhatsApp = sharePdfFile;

export async function printDirectly(html: string): Promise<void> {
  try {
    await Print.printAsync({ html });
  } catch (err: any) {
    Alert.alert('Print Error', err.message || 'Failed to send document to printer');
  }
}
