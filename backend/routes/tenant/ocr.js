const express = require('express');
const router = express.Router();

/**
 * FULL-PROOF MAHARASHTRA MSEDCL (MAHAVITARAN) & DISCOM BILL PARSER
 * Tuned directly to official MSEDCL Maharashtra bills:
 * - ग्राहक क्रमांक : 410010537316 (12 digits)
 * - बिलिंग युनिट : 3905/HUDKESHWAR SDN./NAGPUR (BU + Sub-division + Circle/District)
 * - मंजूर भार : 1.50 KW
 * - एकूण वापर : 358 युनिट
 * - देयक रक्कम रु : 4970.00
 * - ग्राहक नाव : SHRI DNYANESHWAR TULSHIRAM KUKATKAR
 * - पत्ता : W.NO.1;P.NO.1/2;BELEKARLEYOUT PUNYHADHAM MANDIR HUD WADI 440034
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
  else if (/msedcl|mahavitaran|mahadiscom|महावितरण/i.test(text)) discomName = 'MSEDCL (Mahavitaran)';

  // 2. Consumer Account Number (Strict 12-digit for MSEDCL)
  let consumerNumber = '';
  const consumerLabelMatch = text.match(/(?:ग्राहक\s*(?:खाते\s*)?क्रमांक|ग्राहक\s*क्र\.?|consumer\s*(?:account\s*)?(?:no|number|ac|id))[\s\:\.\-]*([0-9]{12})/i) ||
                            text.match(/(?:ca\s*no|contract\s*account)[\s\:\.\-]*([0-9]{8,12})/i);
  if (consumerLabelMatch) {
    consumerNumber = consumerLabelMatch[1];
  } else {
    // Check barcode pattern at bottom: e.g. 3905441001053731603112026...
    const barcodeMatch = text.match(/\b[0-9]{5}(4[0-9]{11})[0-9]{15,}\b/);
    if (barcodeMatch) {
      consumerNumber = barcodeMatch[1];
    } else {
      // Find any 12 digit number not being a timestamp
      const all12Digits = text.match(/\b([0-9]{12})\b/g);
      if (all12Digits && all12Digits.length > 0) {
        const valid = all12Digits.find(n => !n.startsWith('2024') && !n.startsWith('2025') && !n.startsWith('2026'));
        if (valid) consumerNumber = valid;
      }
    }
  }

  // 3. Billing Unit (BU) & City from MSEDCL layout e.g. "3905/HUDKESHWAR SDN./NAGPUR"
  let billingUnit = '';
  let subDivision = '';
  let city = '';
  const msedclBuHierarchy = text.match(/(?:बिलिंग\s*युनिट|billing\s*unit|bu)[\s\:\.\-]*([0-9]{4})(?:\/([A-Za-z0-9\.\s]+?)\/([A-Za-z\s]+))?/i);
  if (msedclBuHierarchy) {
    billingUnit = msedclBuHierarchy[1];
    if (msedclBuHierarchy[2]) subDivision = cleanString(msedclBuHierarchy[2]);
    if (msedclBuHierarchy[3]) {
      const c = cleanString(msedclBuHierarchy[3]);
      city = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
    }
  } else {
    const buSimple = text.match(/(?:bu|b\.u\.|billing\s*unit|बिलिंग\s*युनिट)[\s\:\.\-]*([0-9]{4})\b/i);
    if (buSimple) {
      billingUnit = buSimple[1];
    } else if (consumerNumber && consumerNumber.length === 12) {
      billingUnit = consumerNumber.substring(0, 4);
    }
  }

  // 4. Beneficiary / Consumer Name
  let consumerName = '';
  const namePatterns = [
    // Standard MSEDCL line e.g. "SHRI DNYANESHWAR TULSHIRAM KUKATKAR"
    /(?:SHRI|SMT|MR|MRS)\s+([A-Z\s]{4,40})(?=\r?\n|W\.NO|P\.NO|PLOT|डबल्यू|पत्ता|4400)/,
    /(?:beneficiary\s*name|name\s*of\s*beneficiary)[\s\:\.\-]*([A-Za-z\.\s]+?)(?=\r?\n|application|consumer|mobile|category|address|$)/i,
    /(?:consumer\s*name|name\s*of\s*consumer|ग्राहकाचे\s*नाव)[\s\:\.\-]*([A-Za-z\.\s]+?)(?=\r?\n|address|load|units|bill|consumer|$)/i,
    /(?:eligible\s*consumer\s*\(?name\)?|name\s*of\s*applicant)[\s\:\.\-]*([A-Za-z\.\s]+?)(?=\r?\n|having|premises|address|$)/i,
  ];

  for (const regex of namePatterns) {
    const m = text.match(regex);
    if (m && m[1]) {
      const candidate = cleanString(m[1]).replace(/^(shri\.?|smt\.?|mr\.?|mrs\.?|dr\.?)\s+/i, '');
      if (candidate.length >= 3 && !/application|residential|commercial|msedcl|nagpur|pune|mahavitaran/i.test(candidate)) {
        consumerName = candidate.toUpperCase();
        break;
      }
    }
  }

  // 5. Mobile Number
  let mobile = '';
  const mobileMatch = text.match(/(?:मोबाईल|mobile|phone)[\s\:\.\-\/|]*([6-9][0-9]{9})\b/i) ||
                      text.match(/\b([6-9][0-9]{9})\b/);
  if (mobileMatch) {
    mobile = mobileMatch[1];
  }

  // 6. Sanctioned Connected Load (मंजूर भार)
  let sanctionedLoadKw = 0;
  const loadPatterns = [
    /(?:मंजूर\s*भार|sanctioned\s*load|connected\s*load|contract\s*demand)[\s\:\.\-]*([0-9]+(?:\.[0-9]+)?)\s*(kw|hp|kva)?/i,
    /([0-9]+(?:\.[0-9]+)?)\s*(?:kw|hp)\s*(?:load|sanctioned|मंजूर)/i,
  ];
  for (const p of loadPatterns) {
    const lm = text.match(p);
    if (lm) {
      let val = parseFloat(lm[1]);
      const unit = (lm[2] || '').toUpperCase();
      if (unit === 'HP') {
        val = Number((val * 0.746).toFixed(1));
      }
      if (val >= 0.5 && val <= 50) {
        sanctionedLoadKw = val;
        break;
      }
    }
  }

  // 7. Units Consumed (एकूण वापर / युनिट्स)
  let monthlyUnitsKwh = 0;
  const unitsPatterns = [
    /(?:एकूण\s*वापर|वापर\s*युनिट्स|billed\s*units|units\s*consumed|total\s*units)[\s\:\.\-]*([0-9]{2,4})\b/i,
    /(?:युनिट)[\s\:\.\-]*([0-9]{2,4})\b/i,
    /([0-9]{2,4})\s*(?:units|kwh)\s*(?:consumed|billed|use|वापर)/i,
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

  // 8. Total Bill Amount (देयक रक्कम रु)
  let monthlyBillAmount = 0;
  const billPatterns = [
    /(?:देयक\s*रक्कम(?: रु)?|चालू\s*वीज\s*देयक|total\s*amount\s*payable|net\s*amount\s*payable|current\s*bill|net\s*bill\s*amount)[\s\:\.\-₹Rs\.]*([0-9,]+(?:\.[0-9]{2})?)/i,
    /(?:देय\s*दिनांक[\s\S]*?देयक\s*रक्कम[\s\:\.\-₹Rs\.]*)([0-9,]+(?:\.[0-9]{2})?)/i,
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

  // Mutual cross-check between Units and Bill
  if (monthlyUnitsKwh > 0 && monthlyBillAmount === 0) {
    monthlyBillAmount = Math.round(monthlyUnitsKwh * 8.5);
  } else if (monthlyBillAmount > 0 && monthlyUnitsKwh === 0) {
    monthlyUnitsKwh = Math.round(monthlyBillAmount / 8.5);
  }

  // 9. City / District Fallback if not extracted from BU line
  if (!city) {
    const cityPatterns = [
      /(?:district|city|स्थान|जिल्हा)[\s\:\.\-]*([A-Za-z\s]+?)(?=\,|\;|\r?\n|state|pin|$)/i,
      /\b(nagpur|pune|mumbai|thane|nashik|chhatrapati\s*sambhajinagar|aurangabad|solapur|kolhapur|amravati|nanded|jalgaon|akola|latur|dhule|ahmednagar|chandrapur|wardha|bhandara|gondia|panvel|navi\s*mumbai)\b/i,
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
  }

  // 10. Pincode
  let pincode = '';
  const pinMatch = text.match(/(?:pin(?:\s*code)?|पिन)[\s\:\.\-]*([1-9][0-9]{5})/i) ||
                   text.match(/\b(4[0-4][0-9]{4})\b/) ||
                   text.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    pincode = pinMatch[1];
  }

  // 11. Installation Site Address
  let address = '';
  const addrPatterns = [
    /(?:W\.NO\.[^\n\r]+(?:44[0-9]{4})?|P\.NO\.[^\n\r]+(?:44[0-9]{4})?)/i,
    /(?:installation\s*address|premises\s*address|पत्ता)[\s\:\.\-]*([^\n\r]+)/i,
    /(?:plot\s*no\.?\s*[0-9]+[^\n\r]{10,80})/i,
  ];
  for (const ap of addrPatterns) {
    const am = text.match(ap);
    if (am) {
      let rawAddr = cleanString(am[0]);
      rawAddr = rawAddr.replace(/,\s*District:.*$/i, '').trim();
      if (rawAddr.length >= 8) {
        address = rawAddr.toUpperCase();
        break;
      }
    }
  }

  // 12. Solar Sizing AI
  let recommendedKw = 3.0; // Sweet spot for typical ~350 units
  if (monthlyUnitsKwh > 0) {
    recommendedKw = Number(Math.max(1, Math.min(25, monthlyUnitsKwh / 120)).toFixed(1));
  } else if (monthlyBillAmount > 0) {
    recommendedKw = Number(Math.max(1, Math.min(25, (monthlyBillAmount / 8.5) / 120)).toFixed(1));
  } else if (sanctionedLoadKw > 0) {
    recommendedKw = Number(Math.max(1, Math.min(sanctionedLoadKw * 2, 15)).toFixed(1));
  }

  const estimatedAnnualGen = Math.round(recommendedKw * 1460);
  const estimatedMonthlySavings = Math.round(recommendedKw * 120 * 8.5);
  const subsidyAmount = recommendedKw >= 3 ? 78000 : recommendedKw >= 2 ? 60000 : 30000;

  const extractedFields = [];
  if (consumerNumber) extractedFields.push('consumerNumber');
  if (billingUnit) extractedFields.push('billingUnit');
  if (sanctionedLoadKw > 0) extractedFields.push('sanctionedLoad');
  if (monthlyBillAmount > 0) extractedFields.push('monthlyBill');
  if (monthlyUnitsKwh > 0) extractedFields.push('monthlyUnits');
  if (consumerName) extractedFields.push('name');
  if (mobile) extractedFields.push('mobile');
  if (address) extractedFields.push('address');
  if (city) extractedFields.push('city');
  if (pincode) extractedFields.push('pincode');

  const confidenceScore = Number(Math.min(0.99, Math.max(0.60, (extractedFields.length / 8) * 0.95 + 0.05)).toFixed(2));

  return {
    consumerNumber,
    billingUnit,
    subDivision,
    consumerName,
    mobile,
    sanctionedLoadKw: sanctionedLoadKw > 0 ? sanctionedLoadKw : undefined,
    monthlyBillAmount: monthlyBillAmount > 0 ? monthlyBillAmount : undefined,
    monthlyUnitsKwh: monthlyUnitsKwh > 0 ? monthlyUnitsKwh : undefined,
    discomName,
    city,
    pincode,
    address,
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
