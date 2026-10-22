const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Test that the mobile pdfService contains all required sections matching the web client
const pdfServicePath = path.join(__dirname, '../../mobile-app/src/services/pdfService.ts');
const content = fs.readFileSync(pdfServicePath, 'utf8');

console.log('--- TESTING MOBILE & WEB UNIFIED TEMPLATE PARITY ---');

// 1. Verify all 6 core luxury editorial sections exist in the HTML template generator
const requiredSections = [
  'PAGE 1: CINEMATIC COVER PAGE',
  'PAGE 2: YOUR ENERGY PROFILE',
  'PAGE 3: YOUR SOLAR SYSTEM',
  'PAGE 4: ENERGY & SAVINGS',
  'PAGE 5: YOUR INVESTMENT',
  'PAGE 6: INSTALLATION ROADMAP, WARRANTIES & ACCEPTANCE'
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
  'Milestone Payment Schedule',
  'Amount in Words',
  'HOT-DIP GALVANIZED',
  'bankDetails'
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
