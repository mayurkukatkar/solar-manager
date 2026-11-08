/**
 * Shared Test Helpers & Domain Oracles for WhereReady Solar OS Mobile Client E2E Testing
 * 
 * Provides authoritative models and utilities for:
 * 1. PM Surya Ghar Central Subsidy Slabs & System Sizing
 * 2. Dynamic Hardware Modules & ALMM Inverter Allocation
 * 3. Customer Onboarding & Compulsory Consumer No. Validation
 * 4. Statutory 13.8% Composite Solar GST Arithmetic
 * 5. DISCOM Document Studio 7-Template Verification
 * 6. 2D Barcode / DataMatrix Parsing & DCR Validation
 * 7. CEA Electrical QA Safety Gating (<5.0Ω, <2.0s, >1.0MΩ)
 * 8. Milestone Invoicing & Indian Rupee Words Converter
 * 9. Resilient Offline Draft Storage Engine
 */

// -----------------------------------------------------------------------------
// 1. PM SURYA GHAR DBT SUBSIDY & SYSTEM SIZING
// -----------------------------------------------------------------------------
function computeSubsidy(kw) {
  const cap = parseFloat(kw);
  if (isNaN(cap) || cap <= 0) return 0;
  if (cap <= 1.0) return 30000;
  if (cap <= 2.0) return 60000;
  return 78000; // Statutory residential ceiling for >= 3.0 kW
}

function calculateSolarFinancials(capKw, turnkeyRate = 58000) {
  const cap = parseFloat(capKw) || 3.3;
  const gross = Math.round(cap * turnkeyRate);
  const subsidy = computeSubsidy(cap);
  const net = Math.max(0, gross - subsidy);
  const monthlyUnits = Math.round(cap * 120);
  const annualUnits = Math.round(cap * 1460);
  const monthlySavings = Math.round(monthlyUnits * 8.5);
  const lifetimeSavings = Math.round(annualUnits * 25 * 8.5 * 0.92);
  const paybackYears = monthlySavings > 0 ? Number((net / (monthlySavings * 12)).toFixed(1)) : 0;
  const co2ReductionKg = Math.round(annualUnits * 0.82);
  const treeEquivalent = Math.round((annualUnits * 0.82) / 20);

  return {
    cap,
    gross,
    subsidy,
    net,
    monthlyUnits,
    annualUnits,
    monthlySavings,
    lifetimeSavings,
    paybackYears,
    co2ReductionKg,
    treeEquivalent,
  };
}

// -----------------------------------------------------------------------------
// 2. DYNAMIC HARDWARE MODULES & INVERTERS
// -----------------------------------------------------------------------------
const DEFAULT_PANEL_OPTIONS = [
  { id: 'waaree_540', name: 'Waaree 540W Mono PERC Bifacial', brand: 'Waaree', wattage: 540 },
  { id: 'adani_545', name: 'Adani 545W TopCon DCR Bifacial', brand: 'Adani', wattage: 545 },
  { id: 'tata_545', name: 'Tata Power 545W Mono PERC DCR', brand: 'Tata Power', wattage: 545 },
  { id: 'vikram_550', name: 'Vikram Solar 550W Somera DCR', brand: 'Vikram Solar', wattage: 550 },
  { id: 'goldi_545', name: 'Goldi Solar 545W Heloc Plus DCR', brand: 'Goldi Solar', wattage: 545 },
  { id: 'premier_545', name: 'Premier Energies 545W DCR Bifacial', brand: 'Premier Energies', wattage: 545 },
  { id: 'rayzon_545', name: 'Rayzon Solar 545W Alpex DCR', brand: 'Rayzon Solar', wattage: 545 },
];

const DEFAULT_INVERTER_OPTIONS = [
  { id: 'solis_dual', name: 'Solis Dual MPPT Smart Inverter', phase: 'Single/Three Phase' },
  { id: 'growatt_grid', name: 'Growatt Smart On-Grid Inverter', phase: 'Single Phase' },
  { id: 'polycab_solar', name: 'Polycab Solar Grid-Tied Inverter', phase: 'Single Phase' },
  { id: 'sungrow_multi', name: 'Sungrow Multi-MPPT On-Grid Inverter', phase: 'Three Phase' },
  { id: 'goodwe_smart', name: 'GoodWe Smart Grid-Tied Inverter', phase: 'Single Phase' },
  { id: 'deye_grid', name: 'Deye On-Grid High Efficiency Inverter', phase: 'Three Phase' },
  { id: 'havells_enviro', name: 'Havells Enviro Grid-Tied Inverter', phase: 'Single Phase' },
];

function resolveModuleQuantity(capacityKw, panelName, panelsList = DEFAULT_PANEL_OPTIONS) {
  const matched = panelsList.find(p => p.name === panelName || p.id === panelName);
  let wattage = matched ? matched.wattage : null;
  if (!wattage && panelName) {
    const m = panelName.match(/(\d{3})\s*W/i);
    wattage = m ? Number(m[1]) : 540;
  }
  if (!wattage) wattage = 540;
  return {
    wattage,
    quantity: Math.ceil((capacityKw * 1000) / wattage),
  };
}

// -----------------------------------------------------------------------------
// 3. CUSTOMER ONBOARDING VALIDATION & COMPULSORY CONSUMER NO.
// -----------------------------------------------------------------------------
function validateOnboardingSubmission(formData) {
  if (!formData || typeof formData !== 'object') {
    return { valid: false, error: 'Invalid form data' };
  }
  const trimmedLegal = (formData.legalName || '').trim();
  const trimmedMobile = (formData.mobile || '').trim();
  const trimmedConsumer = (formData.consumerNumber || '').trim();

  if (!trimmedLegal) {
    return { valid: false, error: 'Customer Name Required' };
  }
  if (trimmedMobile.length < 10) {
    return { valid: false, error: 'Mobile Number Incomplete' };
  }
  if (!trimmedConsumer) {
    return { valid: false, error: 'DISCOM Consumer No. Compulsory' };
  }
  if (trimmedConsumer.length < 6) {
    return { valid: false, error: 'Invalid Consumer Number' };
  }
  return {
    valid: true,
    data: {
      legalName: trimmedLegal,
      mobile: trimmedMobile,
      consumerNumber: trimmedConsumer,
      address: (formData.address || '').trim(),
      city: (formData.city || '').trim(),
      pincode: (formData.pincode || '').trim(),
      capacity: parseFloat(formData.capacity) || 3.3,
      bankName: formData.bankName || 'HDFC Bank',
      accountNumber: (formData.accountNumber || '').trim(),
      ifscCode: (formData.ifscCode || '').trim().toUpperCase(),
    },
  };
}

function canSubmitWithoutDocuments(onboardingDocs) {
  if (!Array.isArray(onboardingDocs)) return true;
  const blockingIncomplete = onboardingDocs.filter(d => d.required && !d.uri);
  return blockingIncomplete.length === 0;
}

// -----------------------------------------------------------------------------
// 4. STATUTORY 13.8% COMPOSITE SOLAR GST ARITHMETIC
// -----------------------------------------------------------------------------
function calculateCompositeSolarGst(grossAmount, tradeDiscount = 0) {
  const gross = Math.max(0, parseFloat(grossAmount) || 0);
  const discount = Math.max(0, parseFloat(tradeDiscount) || 0);
  const effectiveGross = Math.max(0, gross - discount);

  // 13.8% Composite Rate = 70% supply of goods @ 12% + 30% supply of services @ 18%
  // 0.70 * 0.12 + 0.30 * 0.18 = 0.084 + 0.054 = 0.138 (13.8%)
  const compositeRate = 0.138;
  const taxableSubtotal = Math.round(effectiveGross / (1 + compositeRate));
  const taxAmount = effectiveGross - taxableSubtotal;

  // Breakdown across goods (70%) and services (30%)
  const goodsPortion = Math.round(taxableSubtotal * 0.70);
  const servicesPortion = taxableSubtotal - goodsPortion;
  const goodsGst = Math.round(goodsPortion * 0.12);
  const servicesGst = Math.round(servicesPortion * 0.18);

  return {
    gross,
    discount,
    effectiveGross,
    compositeRate: 13.8,
    taxableSubtotal,
    taxAmount,
    goodsPortion,
    goodsGst,
    servicesPortion,
    servicesGst,
    zeroPennyDrift: taxableSubtotal + taxAmount === effectiveGross,
  };
}

// -----------------------------------------------------------------------------
// 5. STATUTORY DISCOM DOCUMENT STUDIO & STAMP MARGIN
// -----------------------------------------------------------------------------
const STATUTORY_TEMPLATES = [
  { id: 'WCR_FULL', title: 'Work Completion Report Pack (3-Page Dossier)', pages: 3 },
  { id: 'WCR', title: 'WCR Page 1 (Work Completion Report)', pages: 1 },
  { id: 'AnnexureI', title: 'Annexure - I (Commissioning Certificate)', pages: 1 },
  { id: 'DCR', title: 'Annexure - A (DCR & Module Serials)', pages: 1 },
  { id: 'NetMetering', title: 'Annexure – 3 (Net Metering Agreement - 6 Pages)', pages: 6 },
  { id: 'ConsumerVendor', title: 'Annexure 2 (PM Surya Ghar Agreement - 3 Pages)', pages: 3 },
  { id: 'StandardQuotation', title: 'Official Standard 1-Page Quotation', pages: 1 },
];

function renderAgreementHeader(includeStampGraphic, isPageOne) {
  if (!isPageOne) {
    return { type: 'STANDARD_PAGE_HEADER', heightMm: 20 };
  }
  if (includeStampGraphic) {
    return {
      type: 'DIGITAL_STAMP_GRAPHIC',
      stampValue: 100,
      state: 'Maharashtra',
      heightMm: 75,
    };
  }
  return {
    type: 'PHYSICAL_BLANK_MARGIN',
    marginMm: 115,
    note: 'Blank space preserved for printing directly on treasury stamp paper',
  };
}

// -----------------------------------------------------------------------------
// 6. 2D BARCODE / DATAMATRIX PARSER & DCR VALIDATION
// -----------------------------------------------------------------------------
function parseAndValidateBarcode(raw, certOverride) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length < 5) return null;

  let serial = '';
  let manufacturer = '';
  let wattage;
  let dcrCompliant = false;
  let dcrCert = certOverride ? certOverride.trim() : '';

  // 1. JSON-encoded 2D Barcodes
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      serial = (obj.serial || obj.serialNumber || obj.sn || obj.id || '').toString().trim().toUpperCase();
      manufacturer = (obj.manufacturer || obj.make || obj.brand || '').toString().trim();
      wattage = obj.wattage ? Number(obj.wattage) : undefined;
      if (obj.dcrCertificate || obj.almmCertificate || obj.cert) {
        dcrCert = (obj.dcrCertificate || obj.almmCertificate || obj.cert).toString().trim();
      }
      dcrCompliant = Boolean(obj.isDcr || obj.dcrCompliant || /dcr|almm/i.test(dcrCert) || /dcr|almm/i.test(serial));
    } catch {
      // fallback
    }
  }

  // 2. Delimiter-encoded 2D QR / DataMatrix codes (| or ;)
  if (!serial && (trimmed.includes('|') || trimmed.includes(';'))) {
    const parts = trimmed.split(/[|;]/).map(s => s.trim());
    for (const p of parts) {
      if (/^(SN:|SERIAL:)/i.test(p)) {
        serial = p.replace(/^(SN:|SERIAL:)/i, '').trim().toUpperCase();
      } else if (/^(CERT:|DCR:|ALMM:)/i.test(p)) {
        dcrCert = p.replace(/^(CERT:|DCR:|ALMM:)/i, '').trim();
        dcrCompliant = true;
      } else if (/^(MAKE:|MFG:)/i.test(p)) {
        manufacturer = p.replace(/^(MAKE:|MFG:)/i, '').trim();
      } else if (/^\d{3}W?$/i.test(p)) {
        wattage = parseInt(p, 10);
      }
    }

    if (!serial && parts.length >= 2) {
      if (/waaree|adani|tata|vikram|goldi|premier|rayzon/i.test(parts[0])) {
        manufacturer = parts[0];
        serial = parts[1].toUpperCase();
        if (parts[2] && /^\d{3}W?$/i.test(parts[2])) wattage = parseInt(parts[2], 10);
        if (parts[3]) dcrCert = parts[3];
      } else {
        serial = parts[0].toUpperCase();
      }
    }
  }

  // 3. Fallback raw serial string
  if (!serial) {
    serial = trimmed.replace(/[\r\n\t]/g, '').toUpperCase();
  }

  if (serial.length < 5) return null;

  const dcrPatterns = [
    /DCR/i,
    /ALMM/i,
    /DOMESTIC/i,
    /^WAA[\-_]?DCR/i,
    /^ADANI[\-_]?DCR/i,
    /^TATA[\-_]?DCR/i,
    /^VIKRAM[\-_]?DCR/i,
    /^GOLDI[\-_]?DCR/i,
    /^PREMIER[\-_]?DCR/i,
    /^RAYZON[\-_]?DCR/i,
    /^IND[\-_]/i,
  ];

  if (!dcrCompliant) {
    dcrCompliant = dcrPatterns.some(p => p.test(serial)) ||
      (Boolean(dcrCert) && /^(ALMM|DCR|MNRE|BIS)[\w\-\/]+/i.test(dcrCert));
  }

  return {
    serial,
    manufacturer,
    wattage,
    dcrCompliant,
    dcrCertificate: dcrCert,
  };
}

function detectDuplicateSerial(candidate, existingList = [], inverterCandidate = '', projectObj = {}) {
  if (!candidate || typeof candidate !== 'string') return { isDuplicate: false };
  const norm = candidate.trim().toUpperCase();
  if (existingList.some(s => s && s.trim().toUpperCase() === norm)) {
    return { isDuplicate: true, reason: 'Already scanned in current session' };
  }
  if (inverterCandidate && inverterCandidate.trim().toUpperCase() === norm) {
    return { isDuplicate: true, reason: 'Matches existing inverter serial number' };
  }
  if (projectObj?.moduleSerials && Array.isArray(projectObj.moduleSerials)) {
    if (projectObj.moduleSerials.some(s => s && s.trim().toUpperCase() === norm)) {
      return { isDuplicate: true, reason: 'Already recorded in project module serials' };
    }
  }
  if (projectObj?.dcrModuleSerials) {
    const arr = typeof projectObj.dcrModuleSerials === 'string'
      ? projectObj.dcrModuleSerials.split(/[\n,]/).map(s => s.trim().toUpperCase())
      : projectObj.dcrModuleSerials;
    if (Array.isArray(arr) && arr.some(s => s === norm)) {
      return { isDuplicate: true, reason: 'Already registered in project DCR certificate records' };
    }
  }
  if (projectObj?.existingSerials && Array.isArray(projectObj.existingSerials)) {
    if (projectObj.existingSerials.some(s => s && s.trim().toUpperCase() === norm)) {
      return { isDuplicate: true, reason: 'Already registered in company inventory serial records' };
    }
  }
  return { isDuplicate: false };
}

// -----------------------------------------------------------------------------
// 7. ELECTRICAL QA TEST READINGS & CEA SAFETY GATING
// -----------------------------------------------------------------------------
function evaluateElectricalQATests({ pit1Inverter, pit2Structure, pit3Lightning, antiIslandingTripSec, insulationMegaOhms }) {
  const numPit1 = parseFloat(pit1Inverter);
  const numPit2 = parseFloat(pit2Structure);
  const numPit3 = parseFloat(pit3Lightning);
  const numTrip = parseFloat(antiIslandingTripSec);
  const numInsulation = parseFloat(insulationMegaOhms);

  const isPit1Pass = !isNaN(numPit1) && numPit1 >= 0 && numPit1 < 5.0;
  const isPit2Pass = !isNaN(numPit2) && numPit2 >= 0 && numPit2 < 5.0;
  const isPit3Pass = !isNaN(numPit3) && numPit3 >= 0 && numPit3 < 5.0;
  const isTripPass = !isNaN(numTrip) && numTrip >= 0 && numTrip < 2.0;
  const isInsulationPass = !isNaN(numInsulation) && numInsulation > 1.0;

  const allPass = isPit1Pass && isPit2Pass && isPit3Pass && isTripPass && isInsulationPass;

  const failureReasons = [];
  if (!isPit1Pass) failureReasons.push('Inverter Earth Pit 1 must be strictly < 5.0 Ω (CEA Regulations)');
  if (!isPit2Pass) failureReasons.push('Structure Earth Pit 2 must be strictly < 5.0 Ω (CEA Regulations)');
  if (!isPit3Pass) failureReasons.push('Lightning Arrestor Earth Pit 3 must be strictly < 5.0 Ω (CEA Regulations)');
  if (!isTripPass) failureReasons.push('Anti-Islanding Grid Trip Time must be strictly < 2.0 s (IEEE 1547 / CEA Standards)');
  if (!isInsulationPass) failureReasons.push('Inverter Insulation Resistance must be strictly > 1.0 MΩ (CEA Statutory Threshold)');

  return {
    pass: allPass,
    isPit1Pass,
    isPit2Pass,
    isPit3Pass,
    isTripPass,
    isInsulationPass,
    failureReasons,
  };
}

// -----------------------------------------------------------------------------
// 8. MILESTONE INVOICING & PAYMENT RECONCILIATION
// -----------------------------------------------------------------------------
function generateMilestoneSchedule(grossTotal) {
  const gross = Math.round(parseFloat(grossTotal) || 0);
  const m1 = Math.round(gross * 0.20); // Advance 20%
  const m2 = Math.round(gross * 0.60); // Material Delivery 60%
  const m3 = Math.round(gross * 0.15); // Installation 15%
  // Reconcile final milestone to guarantee 0 penny drift
  const m4 = gross - (m1 + m2 + m3); // Commissioning 5%

  return [
    { id: 'ADVANCE', name: 'Stage 1: Advance Booking', percentage: 20, amount: m1, hsn: '9954' },
    { id: 'DELIVERY', name: 'Stage 2: Material Delivery', percentage: 60, amount: m2, hsn: '8541' },
    { id: 'INSTALLATION', name: 'Stage 3: Installation & Earthing', percentage: 15, amount: m3, hsn: '9954' },
    { id: 'COMMISSIONING', name: 'Stage 4: DISCOM Sync & Commissioning', percentage: 5, amount: m4, hsn: '9954' },
  ];
}

function toIndianWords(num) {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'Overflow';
    const nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return '';
    let str = '';
    str += Number(nArr[1]) !== 0 ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
    str += Number(nArr[2]) !== 0 ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
    str += Number(nArr[3]) !== 0 ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
    str += Number(nArr[4]) !== 0 ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
    str += Number(nArr[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
    return str.trim();
  }

  const rounded = Math.round(Number(num));
  return inWords(rounded) + ' Rupees Only';
}

// -----------------------------------------------------------------------------
// 9. RESILIENT OFFLINE DRAFT STORAGE ENGINE
// -----------------------------------------------------------------------------
class MockAsyncStorage {
  constructor() {
    this.store = new Map();
  }
  async getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  async setItem(key, value) {
    this.store.set(key, String(value));
  }
  async removeItem(key) {
    this.store.delete(key);
  }
  async clear() {
    this.store.clear();
  }
  async getAllKeys() {
    return Array.from(this.store.keys());
  }
}

function createOfflineSyncService(storage = new MockAsyncStorage()) {
  const DRAFT_LEADS_KEY = '@solar_manager_draft_leads';
  const DRAFT_QUOTES_KEY = '@solar_manager_draft_quotes';

  return {
    storage,
    async saveDraftLead(lead) {
      const existing = await this.getDraftLeads();
      const newDraft = {
        ...lead,
        localId: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newDraft, ...existing];
      await storage.setItem(DRAFT_LEADS_KEY, JSON.stringify(updated));
      return newDraft;
    },

    async getDraftLeads() {
      try {
        const data = await storage.getItem(DRAFT_LEADS_KEY);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    },

    async removeDraftLead(localId) {
      const existing = await this.getDraftLeads();
      const filtered = existing.filter((l) => l.localId !== localId);
      await storage.setItem(DRAFT_LEADS_KEY, JSON.stringify(filtered));
    },

    async saveDraftQuote(leadId, quoteData) {
      const key = `${DRAFT_QUOTES_KEY}_${leadId}`;
      await storage.setItem(key, JSON.stringify(quoteData));
    },

    async getDraftQuote(leadId) {
      try {
        const key = `${DRAFT_QUOTES_KEY}_${leadId}`;
        const data = await storage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    },
  };
}

// -----------------------------------------------------------------------------
// 10. 8-POINT STATUTORY PIPELINE AUDIT
// -----------------------------------------------------------------------------
function computePipelineAudit(projectData) {
  const checks = [
    { id: 'beneficiary', verified: Boolean(projectData.beneficiaryName && projectData.beneficiaryName.length >= 3) },
    { id: 'consumerNo', verified: Boolean(projectData.consumerNumber && projectData.consumerNumber.length >= 6) },
    { id: 'address', verified: Boolean(projectData.address && projectData.address.length >= 6) },
    { id: 'capacity', verified: Boolean(Number(projectData.appliedCapacity) > 0 && Number(projectData.sanctionedLoad) > 0) },
    { id: 'appRef', verified: Boolean(projectData.applicationRefNo && projectData.applicationRefNo.length >= 4) },
    { id: 'boqSpecs', verified: Boolean(projectData.moduleMake && projectData.moduleWattage && projectData.moduleQuantity) },
    { id: 'barcodes', verified: Boolean(projectData.moduleSerialNumbers && projectData.moduleSerialNumbers.length >= (projectData.moduleQuantity || 1)) },
    { id: 'vendor', verified: Boolean(projectData.vendorName && projectData.gstin) },
  ];
  const passed = checks.filter(c => c.verified).length;
  return {
    total: checks.length,
    passed,
    allVerified: passed === checks.length,
  };
}

module.exports = {
  computeSubsidy,
  calculateSolarFinancials,
  DEFAULT_PANEL_OPTIONS,
  DEFAULT_INVERTER_OPTIONS,
  resolveModuleQuantity,
  validateOnboardingSubmission,
  canSubmitWithoutDocuments,
  calculateCompositeSolarGst,
  STATUTORY_TEMPLATES,
  renderAgreementHeader,
  parseAndValidateBarcode,
  detectDuplicateSerial,
  evaluateElectricalQATests,
  generateMilestoneSchedule,
  toIndianWords,
  MockAsyncStorage,
  createOfflineSyncService,
  computePipelineAudit,
};
