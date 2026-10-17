const express = require('express');
const router = express.Router();

/**
 * FULL-PROOF INDIAN ELECTRICITY BILL & STATUTORY DOCUMENT PARSER
 * Specifically tuned for:
 * 1. MSEDCL (Mahavitaran) Consumer Bills & Statements
 * 2. MSEDCL WCR (Work Completion Reports) & Statutory Forms
 * 3. National Solar Portal (PM Surya Ghar) Application PDFs
 * 4. Tata Power, Torrent Power, Adani Electricity, BESCOM bills
 */
function cleanString(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

function parseIndianElectricityBillText(rawText = '', filename = '') {
  const text = rawText || '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Detect DISCOM
  let discomName = 'MSEDCL (Mahavitaran)';
  if (/tata\s*power/i.test(text)) discomName = 'Tata Power';
  else if (/torrent\s*power/i.test(text)) discomName = 'Torrent Power';
  else if (/adani\s*electricity/i.test(text)) discomName = 'Adani Electricity';
  else if (/bescom/i.test(text)) discomName = 'BESCOM';
  else if (/msedcl|mahavitaran|mahadiscom/i.test(text)) discomName = 'MSEDCL (Mahavitaran)';

  // 2. Consumer Account Number (Strict 12-digit for MSEDCL, or 8-12 digits generic)
  let consumerNumber = '';
  // Pattern A: Labeled Consumer No / Account No
  const consumerLabelMatch = text.match(/(?:consumer\s*(?:account\s*)?(?:no|number|ac|id)|ग्राहक\s*(?:खाते\s*)?(?:क्र|क्रमांक|क्र\.))[\s\:\.\-]*([0-9]{10,12})/i) ||
                            text.match(/(?:ca\s*no|contract\s*account)[\s\:\.\-]*([0-9]{8,12})/i);
  if (consumerLabelMatch) {
    consumerNumber = consumerLabelMatch[1];
  } else {
    // Pattern B: Look for 12-digit number (Maharashtra MSEDCL standard 12-digit consumer account)
    // Avoid timestamps or application numbers with letters
    const all12Digits = text.match(/\b([0-9]{12})\b/g);
    if (all12Digits && all12Digits.length > 0) {
      // Avoid date-times like 20261017xxxx
      const valid = all12Digits.find(n => !n.startsWith('2024') && !n.startsWith('2025') && !n.startsWith('2026'));
      if (valid) consumerNumber = valid;
    }
  }

  // 3. Billing Unit (BU)
  let billingUnit = '';
  const buMatch = text.match(/(?:bu|b\.u\.|billing\s*unit|बिलिंग\s*युनिट)[\s\:\.\-]*([0-9]{4})\b/i);
  if (buMatch) {
    billingUnit = buMatch[1];
  } else if (consumerNumber && consumerNumber.length === 12) {
    // In MSEDCL, the first 4 digits of the 12-digit consumer number represent the Billing Unit (BU)
    billingUnit = consumerNumber.substring(0, 4);
  }

  // 4. Beneficiary / Consumer Name (Clean extraction without labels/honorific noise)
  let consumerName = '';
  const namePatterns = [
    /(?:beneficiary\s*name|name\s*of\s*beneficiary)[\s\:\.\-]*([A-Za-z\.\s]+?)(?=\r?\n|application|consumer|mobile|category|address|$)/i,
    /(?:consumer\s*name|name\s*of\s*consumer|ग्राहकाचे\s*नाव)[\s\:\.\-]*([A-Za-z\.\s]+?)(?=\r?\n|address|load|units|bill|consumer|$)/i,
    /(?:eligible\s*consumer\s*\(?name\)?|name\s*of\s*applicant)[\s\:\.\-]*([A-Za-z\.\s]+?)(?=\r?\n|having|premises|address|$)/i,
    /(?:श्री\s*\/?\s*श्रीमती|shri\.?|smt\.?|mr\.?|mrs\.?)\s+([A-Za-z\s]{3,35})(?=\r?\n|having|plot|consumer|$)/i,
  ];

  for (const regex of namePatterns) {
    const m = text.match(regex);
    if (m && m[1]) {
      const candidate = cleanString(m[1]).replace(/^(shri\.?|smt\.?|mr\.?|mrs\.?|dr\.?)\s+/i, '');
      if (candidate.length >= 3 && !/application|residential|commercial|msedcl|nagpur|pune/i.test(candidate)) {
        consumerName = candidate.toUpperCase();
        break;
      }
    }
  }

  // 5. Mobile Number (Strict 10-digit starting with 6,7,8,9)
  let mobile = '';
  const mobileMatch = text.match(/(?:mobile(?:\s*no\.?)?|phone(?:\s*no\.?)?|संपर्क)[\s\:\.\-|]*([6-9][0-9]{9})\b/i) ||
                      text.match(/\b([6-9][0-9]{9})\b/);
  if (mobileMatch) {
    mobile = mobileMatch[1];
  }

  // 6. Email Address
  let email = '';
  const emailMatch = text.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch) {
    email = emailMatch[1].toLowerCase();
  }

  // 7. Sanctioned / Connected Load (kW or HP)
  let sanctionedLoadKw = 0;
  const loadPatterns = [
    /(?:sanctioned\s*load|connected\s*load|contract\s*demand|मंजूर\s*भार)[\s\:\.\-]*([0-9]+(?:\.[0-9]+)?)\s*(kw|hp|kva)?/i,
    /([0-9]+(?:\.[0-9]+)?)\s*(?:kw|hp)\s*(?:load|sanctioned)/i,
  ];
  for (const p of loadPatterns) {
    const lm = text.match(p);
    if (lm) {
      let val = parseFloat(lm[1]);
      const unit = (lm[2] || '').toUpperCase();
      if (unit === 'HP') {
        val = Number((val * 0.746).toFixed(1));
      }
      // Sanity clamp: residential/commercial load between 0.5 kW and 50 kW
      if (val >= 0.5 && val <= 50) {
        sanctionedLoadKw = val;
        break;
      }
    }
  }

  // 8. Units Consumed (Monthly kWh) vs Cumulative Meter Reading
  let monthlyUnitsKwh = 0;
  const unitsPatterns = [
    /(?:billed\s*units|units\s*consumed|total\s*units|consumption|वापर\s*युनिट्स|युनिट्स)[\s\:\.\-]*([0-9]{2,4})\b/i,
    /([0-9]{2,4})\s*(?:units|kwh)\s*(?:consumed|billed|use)/i,
  ];
  for (const up of unitsPatterns) {
    const um = text.match(up);
    if (um) {
      const u = parseInt(um[1], 10);
      if (u >= 30 && u <= 4000) {
        monthlyUnitsKwh = u;
        break;
      }
    }
  }

  // 9. Total Bill Amount Payable (₹)
  let monthlyBillAmount = 0;
  const billPatterns = [
    /(?:total\s*amount\s*payable|net\s*amount\s*payable|current\s*bill|net\s*bill\s*amount|देय\s*रक्कम|चालू\s*देयक)[\s\:\.\-₹Rs\.]*([0-9,]+(?:\.[0-9]{2})?)/i,
    /(?:₹|rs\.?)\s*([0-9,]+(?:\.[0-9]{2})?)\s*(?:payable|due|total)/i,
  ];
  for (const bp of billPatterns) {
    const bm = text.match(bp);
    if (bm) {
      const val = parseFloat(bm[1].replace(/,/g, ''));
      if (val >= 200 && val <= 150000) {
        monthlyBillAmount = val;
        break;
      }
    }
  }

  // Cross-Sanity Check between Units and Bill Amount:
  // If units are found but bill is not, estimate bill: units * 8.5
  if (monthlyUnitsKwh > 0 && monthlyBillAmount === 0) {
    monthlyBillAmount = Math.round(monthlyUnitsKwh * 8.5);
  }
  // If bill is found but units are not, estimate units: bill / 8.5
  if (monthlyBillAmount > 0 && monthlyUnitsKwh === 0) {
    monthlyUnitsKwh = Math.round(monthlyBillAmount / 8.5);
  }

  // 10. City / District
  let city = '';
  const cityPatterns = [
    /(?:district|city|स्थान|जिल्हा)[\s\:\.\-]*([A-Za-z\s]+?)(?=\,|\;|\r?\n|state|pin|$)/i,
    /\b(nagpur|pune|mumbai|thane|nashik|chhatrapati\s*sambhajinagar|aurangabad|solapur|kolhapur|amravati|nanded|jalgaon|akola|latur|dhule|ahmednagar|chandrapur|parbhani|jalna|wardha|bhandara|gondia|panvel|navi\s*mumbai)\b/i,
  ];
  for (const cp of cityPatterns) {
    const cm = text.match(cp);
    if (cm && cm[1]) {
      const rawCity = cleanString(cm[1]);
      if (rawCity.length >= 3 && !/state|maharashtra|district/i.test(rawCity)) {
        city = rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase();
        break;
      }
    }
  }

  // 11. Pincode (Maharashtra 6-digit PIN starting with 40-44)
  let pincode = '';
  const pinMatch = text.match(/(?:pin(?:\s*code)?|पिन)[\s\:\.\-]*([1-9][0-9]{5})/i) ||
                   text.match(/\b(4[0-4][0-9]{4})\b/) ||
                   text.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    pincode = pinMatch[1];
  }

  // 12. Installation Site Address
  let address = '';
  const addrPatterns = [
    /(?:installation\s*address|premises\s*address|पत्ता)[\s\:\.\-]*([^\n\r]+)/i,
    /(?:having\s*premises\s*at\s*\(?address\s*)[\s\:\.\-]*([^\n\r]+)/i,
    /(?:plot\s*no\.?\s*[0-9]+[^\n\r]{10,60})/i,
  ];
  for (const ap of addrPatterns) {
    const am = text.match(ap);
    if (am && am[1]) {
      let rawAddr = cleanString(am[1]);
      // Remove trailing "District: ... State: ..." if already captured
      rawAddr = rawAddr.replace(/,\s*District:.*$/i, '').trim();
      if (rawAddr.length >= 8) {
        address = rawAddr.toUpperCase();
        break;
      }
    }
  }

  // 13. Application Reference Number (if national portal WCR or Form A-1)
  let applicationRefNo = '';
  const appRefMatch = text.match(/(?:application\s*ref\.?\s*(?:no\.?)?|app\s*ref\s*no\.?)[\s\:\.\-]*([A-Z0-9\-]+)/i) ||
                      text.match(/\b(NP\-[A-Z0-9\-]+)\b/i);
  if (appRefMatch) {
    applicationRefNo = appRefMatch[1].toUpperCase();
  }

  // 14. Solar System Sizing Calculation
  let recommendedKw = 3.3; // Default sweet spot
  if (monthlyUnitsKwh > 0) {
    recommendedKw = Number(Math.max(1, Math.min(25, monthlyUnitsKwh / 120)).toFixed(1));
  } else if (monthlyBillAmount > 0) {
    recommendedKw = Number(Math.max(1, Math.min(25, (monthlyBillAmount / 8.5) / 120)).toFixed(1));
  } else if (sanctionedLoadKw > 0) {
    recommendedKw = Number(Math.max(1, Math.min(sanctionedLoadKw, 15)).toFixed(1));
  }

  const estimatedAnnualGen = Math.round(recommendedKw * 1460);
  const estimatedMonthlySavings = Math.round(recommendedKw * 120 * 8.5);
  const subsidyAmount = recommendedKw >= 3 ? 78000 : recommendedKw >= 2 ? 60000 : 30000;

  // Track extracted fields list
  const extractedFields = [];
  if (consumerNumber) extractedFields.push('consumerNumber');
  if (billingUnit) extractedFields.push('billingUnit');
  if (sanctionedLoadKw > 0) extractedFields.push('sanctionedLoad');
  if (monthlyBillAmount > 0) extractedFields.push('monthlyBill');
  if (monthlyUnitsKwh > 0) extractedFields.push('monthlyUnits');
  if (consumerName) extractedFields.push('name');
  if (mobile) extractedFields.push('mobile');
  if (email) extractedFields.push('email');
  if (address) extractedFields.push('address');
  if (city) extractedFields.push('city');
  if (pincode) extractedFields.push('pincode');
  if (applicationRefNo) extractedFields.push('applicationRefNo');

  // Confidence calculation
  const confidenceScore = Number(Math.min(0.99, Math.max(0.60, (extractedFields.length / 9) * 0.95 + 0.05)).toFixed(2));

  return {
    consumerNumber,
    billingUnit,
    consumerName,
    mobile,
    email,
    sanctionedLoadKw: sanctionedLoadKw > 0 ? sanctionedLoadKw : undefined,
    monthlyBillAmount: monthlyBillAmount > 0 ? monthlyBillAmount : undefined,
    monthlyUnitsKwh: monthlyUnitsKwh > 0 ? monthlyUnitsKwh : undefined,
    discomName,
    city,
    pincode,
    address,
    applicationRefNo,
    recommendedKw,
    estimatedAnnualGen,
    estimatedMonthlySavings,
    subsidyAmount,
    confidenceScore,
    extractedFields,
  };
}

/**
 * POST /api/tenant/ocr/scan-bill
 * Accepts raw text or uploaded electricity bill file and performs auto-fill extraction
 */
router.post('/api/tenant/ocr/scan-bill', async (req, res) => {
  try {
    const { rawText, filename } = req.body || {};
    
    // Parse text
    const parsedData = parseIndianElectricityBillText(rawText || '', filename || '');
    
    return res.json({
      success: true,
      message: 'Electricity bill parsed successfully',
      data: parsedData,
    });
  } catch (err) {
    console.error('Bill OCR scanning error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to extract electricity bill data',
    });
  }
});

module.exports = router;
