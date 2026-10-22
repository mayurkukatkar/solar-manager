const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Tenant Configuration & Settings Integration Tests', () => {
  test('Tenant configuration supports bank details, commercial defaults, prefixes, and branding', async () => {
    const tenant = await prisma.tenant.findFirst();
    assert.ok(tenant, 'Should have at least 1 tenant in the database');

    const testBankDetails = {
      accountName: 'SunVolt Solar Solutions Pvt Ltd',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200088992211',
      ifsc: 'HDFC0001234',
      branch: 'Shivajinagar, Pune',
      upiId: 'sunvolt@hdfcbank'
    };

    const testCommercialDefaults = {
      defaultTariff: 8.75,
      defaultDiscom: 'MSEDCL',
      defaultSubsidy: 'PM_SURYA_GHAR',
      quoteValidityDays: 21,
      panelWarrantyYears: 25,
      inverterWarrantyYears: 10,
      workmanshipWarrantyYears: 5
    };

    const testDocumentPrefixes = {
      lead: 'LEAD-',
      quotation: 'SUN-QT-',
      project: 'SUN-PRJ-',
      invoice: 'SUN-INV-',
      survey: 'SUN-SRV-',
      purchaseOrder: 'SUN-PO-'
    };

    // Update tenant configuration
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        website: 'https://sunvoltsolar.com',
        tagline: 'Powering India with Clean Solar Energy',
        msmeNumber: 'UDYAM-MH-26-0019283',
        contractorLicense: 'MSEDCL/ELECT/2023/8892',
        signatoryName: 'Vikram Joshi',
        signatoryTitle: 'Managing Director & Lead Engineer',
        primaryColor: '#059669',
        accentColor: '#0284c7',
        bankDetails: testBankDetails,
        commercialDefaults: testCommercialDefaults,
        documentPrefixes: testDocumentPrefixes
      }
    });

    assert.equal(updated.website, 'https://sunvoltsolar.com');
    assert.equal(updated.msmeNumber, 'UDYAM-MH-26-0019283');
    assert.equal(updated.contractorLicense, 'MSEDCL/ELECT/2023/8892');
    assert.equal(updated.bankDetails.bankName, 'HDFC Bank Ltd');
    assert.equal(updated.bankDetails.accountNumber, '50200088992211');
    assert.equal(updated.commercialDefaults.defaultTariff, 8.75);
    assert.equal(updated.commercialDefaults.defaultDiscom, 'MSEDCL');
    assert.equal(updated.documentPrefixes.quotation, 'SUN-QT-');

    // Retrieve again to confirm persistence
    const fetched = await prisma.tenant.findUnique({
      where: { id: tenant.id }
    });

    assert.ok(fetched.bankDetails);
    assert.equal(fetched.bankDetails.ifsc, 'HDFC0001234');
    assert.equal(fetched.commercialDefaults.quoteValidityDays, 21);
    assert.equal(fetched.documentPrefixes.invoice, 'SUN-INV-');
  });
});
