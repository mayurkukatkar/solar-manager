const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Test that the mobile pdfService contains all required sections matching the web client
const pdfServicePath = path.join(__dirname, '../../mobile-app/src/services/pdfService.ts');
const content = fs.readFileSync(pdfServicePath, 'utf8');

console.log('--- TESTING MOBILE & WEB UNIFIED TEMPLATE PARITY ---');

// 1. Verify all 8 core sections exist in the HTML template generator
const requiredSections = [
  'PAGE 1: EXECUTIVE COVER PAGE',
  'PAGE 2: CUSTOMER REQUIREMENTS & AUDIT',
  'PAGE 3: RECOMMENDED SOLAR SOLUTION ARCHITECTURE',
  'PAGE 4: SAVINGS ANALYSIS & FINANCIAL ROI',
  'PAGE 5: ITEMIZED COMMERCIAL QUOTATION & BOQ',
  'PAGE 6: SCOPE OF WORK & EPC DELIVERABLES',
  'PAGE 7: WARRANTIES, TERMS & CONDITIONS',
  'PAGE 8: ACCEPTANCE & SIGNATORY BLOCK'
];

for (const sec of requiredSections) {
  assert.ok(content.includes(sec), `Missing section in mobile-app pdfService: ${sec}`);
  console.log(`✅ Section verified in mobile template: ${sec}`);
}

// 2. Verify all template variants are supported
const supportedTemplates = [
  'quick_quote',
  'residential_proposal',
  'commercial_epc',
  'hybrid_offgrid'
];

for (const tmpl of supportedTemplates) {
  assert.ok(content.includes(tmpl), `Missing template variant handling: ${tmpl}`);
  console.log(`✅ Template variant verified: ${tmpl}`);
}

// 3. Verify key financial & technical elements
const keyElements = [
  'PM Surya Ghar Muft Bijli Yojana',
  'Section 32 Accelerated Depreciation',
  'Milestone Payment Schedule',
  'Amount Payable in Words',
  'Energy Storage System',
  'HOT-DIP GALVANIZED',
  'Official EPC Bank Account'
];

for (const el of keyElements) {
  assert.ok(content.toLowerCase().includes(el.toLowerCase()), `Missing key financial/technical element: ${el}`);
  console.log(`✅ Financial/Technical element verified: ${el}`);
}

// 4. Verify QuotationPdfProps interface matches web QuotationData capabilities
const requiredProps = [
  'templateType',
  'primaryColor',
  'accentColor',
  'companyLegalName',
  'consumerNumber',
  'discomName',
  'sanctionedLoad',
  'tariffRate',
  'batteryCapacity',
  'backupLoadWatts',
  'commercialTaxBenefit',
  'pricingItems',
  'scopeOfSupply',
  'paymentTerms',
  'warranties'
];

for (const prop of requiredProps) {
  assert.ok(content.includes(prop), `Missing prop in QuotationPdfProps: ${prop}`);
  console.log(`✅ Interface property verified: ${prop}`);
}

console.log('--- ALL UNIFIED TEMPLATE PARITY CHECKS PASSED SUCCESSFULLY! ---');
