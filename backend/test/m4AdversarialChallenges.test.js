/**
 * Milestone M4: Adversarial Challenge & Empirical Stress-Test Suite
 * 
 * Conducts hostile edge-case mining, race-condition simulation, and invariant verification:
 * 1. Sequential 7-Stage State Machine Exhaustive Matrix:
 *    - Canonical forward transitions across all stages
 *    - All illegal forward jumps (skipping 2, 3, 4, 5 stages) rejected with HTTP 400
 *    - Lowercase, whitespace, and malformed stage inputs rejected with HTTP 400
 *    - Missing or empty newStage payload rejected with HTTP 400
 *    - Rejection of transitions when already in target stage
 * 2. High-Concurrency Idempotent Conversions:
 *    - Concurrent burst of 5 simultaneous POST /api/tenant/leads/:id/convert requests
 *    - Concurrent burst of 5 simultaneous POST /api/tenant/quotations/:id/convert requests
 *    - Invariant: Exactly 1 Customer, 1 Project, and deduplicated BOM created
 *    - Empty body payload resilience (does not throw or crash)
 * 3. Statutory Form Generator Leak Audit:
 *    - Static analysis scan for forbidden hardcoded personal/vendor strings in PDF generators and quotation modals
 * 4. Dashboard Zero-Data Integrity Audit:
 *    - Verifies absence of fake mock fallback datasets and presence of EmptyState components
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const prisma = require('../db');
const { startTestServer, createToken, httpRequest, TEST_FIXTURES } = require('./e2e/testHelper');

// Helper to retry transient DB operations
async function withRetry(fn, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

describe('Milestone M4: Adversarial Challenges & Empirical Stress Tests', () => {
  let serverInstance = null;
  let baseUrl = '';
  let tokenTenantA = '';
  let tokenTenantB = '';

  const testSuffix = Date.now().toString().slice(-6);

  before(async () => {
    serverInstance = await startTestServer();
    baseUrl = serverInstance.baseUrl;

    tokenTenantA = createToken({
      tenantId: TEST_FIXTURES.tenantA.id,
      userId: TEST_FIXTURES.tenantA.adminUser.id,
      role: 'TENANT_ADMIN'
    });

    tokenTenantB = createToken({
      tenantId: TEST_FIXTURES.tenantB.id,
      userId: TEST_FIXTURES.tenantB.adminUser.id,
      role: 'TENANT_ADMIN'
    });
  });

  after(async () => {
    if (serverInstance && serverInstance.close) {
      await serverInstance.close();
    }
  });

  // =========================================================================
  // 1. STATE MACHINE EXHAUSTIVE TRANSITION MATRIX & EDGE CASES
  // =========================================================================
  describe('Adversarial State Machine Stress-Testing', () => {
    let project = null;

    before(async () => {
      project = await withRetry(() => prisma.project.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `M4 Adversarial Project ${testSuffix}`,
          projectNumber: `PRJ-ADV-${testSuffix}`,
          currentStage: 'SURVEY_COMPLETED',
          progressPercent: 15,
          status: 'In Progress',
          capacity: 6.0,
          capacityUnit: 'kWp'
        }
      }));
    });

    after(async () => {
      if (project) {
        await prisma.projectStageHistory.deleteMany({ where: { projectId: project.id } }).catch(() => {});
        await prisma.projectTimelineEvent.deleteMany({ where: { projectId: project.id } }).catch(() => {});
        await prisma.projectMaterialRequirement.deleteMany({ where: { projectId: project.id } }).catch(() => {});
        await prisma.purchaseOrder.deleteMany({ where: { projectId: project.id } }).catch(() => {});
        await prisma.aMC.deleteMany({ where: { projectId: project.id } }).catch(() => {});
        await prisma.project.delete({ where: { id: project.id } }).catch(() => {});
      }
    });

    test('Rejects transition when newStage is missing or empty', async () => {
      const res1 = await httpRequest(baseUrl, `/api/tenant/projects/${project.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: {}
      });
      assert.equal(res1.status, 400);
      assert.equal(res1.data.error, 'newStage is required');

      const res2 = await httpRequest(baseUrl, `/api/tenant/projects/${project.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: '' }
      });
      assert.equal(res2.status, 400);
      assert.equal(res2.data.error, 'newStage is required');
    });

    test('Rejects lowercase or malformed stage strings', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${project.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'survey_completed' }
      });
      assert.equal(res.status, 400);
      assert.ok(res.data.error.includes('Invalid stage'));
    });

    test('Rejects all illegal forward jumps from SURVEY_COMPLETED (skipping 2, 3, 4, 5 stages)', async () => {
      const illegalTargets = [
        'INSTALLATION_STARTED',
        'TESTING_COMPLETED',
        'NET_METER_APPLIED',
        'COMMISSIONED'
      ];

      for (const target of illegalTargets) {
        const res = await httpRequest(baseUrl, `/api/tenant/projects/${project.id}/stage`, {
          method: 'PATCH',
          token: tokenTenantA,
          body: { newStage: target }
        });
        assert.equal(res.status, 400, `Expected 400 for jump to ${target}, got ${res.status}`);
        assert.ok(
          res.data.error.includes('cannot jump'),
          `Error message should state cannot jump, got: ${res.data.error}`
        );
      }
    });

    test('Rejects legacy illegal jumps (e.g. Planning to Completed)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${project.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'Completed' }
      });
      assert.equal(res.status, 400);
      assert.ok(res.data.error.includes('cannot jump'));
    });

    test('Advances step-by-step canonically from SURVEY_COMPLETED to COMMISSIONED', async () => {
      const canonicalSteps = [
        { stage: 'STRUCTURE_APPROVED', expectedProgress: 30 },
        { stage: 'MATERIAL_DISPATCHED', expectedProgress: 50 },
        { stage: 'INSTALLATION_STARTED', expectedProgress: 75 },
        { stage: 'TESTING_COMPLETED', expectedProgress: 90 },
        { stage: 'NET_METER_APPLIED', expectedProgress: 95 },
        { stage: 'COMMISSIONED', expectedProgress: 100 }
      ];

      for (const step of canonicalSteps) {
        const res = await httpRequest(baseUrl, `/api/tenant/projects/${project.id}/stage`, {
          method: 'PATCH',
          token: tokenTenantA,
          body: { newStage: step.stage, comment: `Advancing to ${step.stage}` }
        });
        assert.equal(res.status, 200, `Failed advancing to ${step.stage}`);
        assert.equal(res.data.project.currentStage, step.stage);
        assert.equal(res.data.project.progressPercent, step.expectedProgress);
      }

      // Verify in DB that project is marked Completed
      const dbPrj = await prisma.project.findUnique({ where: { id: project.id } });
      assert.equal(dbPrj.currentStage, 'COMMISSIONED');
      assert.equal(dbPrj.status, 'Completed');
      assert.ok(dbPrj.actualCompletionDate);
    });

    test('Rejects advancing when already in COMMISSIONED stage', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${project.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'COMMISSIONED' }
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.error, 'Already in this stage');
    });
  });

  // =========================================================================
  // 2. CONCURRENT RACE CONDITION STRESS-TEST FOR IDEMPOTENT CONVERSIONS
  // =========================================================================
  describe('Concurrent Burst Idempotency Stress-Testing', () => {
    let raceLead = null;
    let quoteLead = null;
    let raceQuote = null;
    let createdProjectIds = [];

    before(async () => {
      // Create fresh lead
      raceLead = await withRetry(() => prisma.lead.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Concurrent Race Lead ${testSuffix}`,
          email: `racelead${testSuffix}@solarops.test`,
          mobile: `9700${testSuffix}`,
          status: 'QUALIFIED',
          estimatedCap: 5.5,
          estimatedValue: 302500,
          customerType: 'RESIDENTIAL'
        }
      }));

      // Create dedicated lead for quotation conversion race test so Test 1 does not pre-convert raceQuote
      quoteLead = await withRetry(() => prisma.lead.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Quote Race Lead ${testSuffix}`,
          email: `quotelead${testSuffix}@solarops.test`,
          mobile: `9701${testSuffix}`,
          status: 'QUALIFIED',
          estimatedCap: 5.5,
          estimatedValue: 302500,
          customerType: 'RESIDENTIAL'
        }
      }));

      // Create fresh quotation
      raceQuote = await withRetry(() => prisma.quotation.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          qNumber: `QT-RACE-${testSuffix}`,
          leadId: quoteLead.id,
          systemCapacity: 5.5,
          panelBrand: 'Mono PERC 550W',
          panelWattage: 550,
          panelQuantity: 10,
          inverterBrand: 'SolarInvert 5kW',
          inverterCapacity: 5.0,
          total: 302500,
          status: 'DRAFT',
          items: {
            create: [
              {
                description: 'Mono PERC 550W Modules',
                quantity: 10,
                unitPrice: 18000,
                taxRate: 12,
                total: 180000
              }
            ]
          }
        }
      }));
    });

    after(async () => {
      for (const prjId of createdProjectIds) {
        await prisma.projectTask.deleteMany({ where: { projectId: prjId } }).catch(() => {});
        await prisma.projectMaterialRequirement.deleteMany({ where: { projectId: prjId } }).catch(() => {});
        await prisma.discomApplication.deleteMany({ where: { projectId: prjId } }).catch(() => {});
        await prisma.subsidyApplication.deleteMany({ where: { projectId: prjId } }).catch(() => {});
        await prisma.projectTimelineEvent.deleteMany({ where: { projectId: prjId } }).catch(() => {});
        await prisma.project.delete({ where: { id: prjId } }).catch(() => {});
      }
      if (raceQuote) {
        await prisma.quotationItem.deleteMany({ where: { quotationId: raceQuote.id } }).catch(() => {});
        await prisma.quotation.delete({ where: { id: raceQuote.id } }).catch(() => {});
      }
      if (raceLead) {
        await prisma.customer.deleteMany({ where: { leadId: raceLead.id } }).catch(() => {});
        await prisma.leadActivity.deleteMany({ where: { leadId: raceLead.id } }).catch(() => {});
        await prisma.lead.delete({ where: { id: raceLead.id } }).catch(() => {});
      }
      if (quoteLead) {
        await prisma.customer.deleteMany({ where: { leadId: quoteLead.id } }).catch(() => {});
        await prisma.leadActivity.deleteMany({ where: { leadId: quoteLead.id } }).catch(() => {});
        await prisma.lead.delete({ where: { id: quoteLead.id } }).catch(() => {});
      }
    });

    test('Simultaneous burst of 5 concurrent lead conversion requests produces exactly ONE customer and project', async () => {
      // Fire 5 conversion requests simultaneously
      const results = await Promise.all([
        httpRequest(baseUrl, `/api/tenant/leads/${raceLead.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: { customerName: `Burst Customer ${testSuffix}` }
        }),
        httpRequest(baseUrl, `/api/tenant/leads/${raceLead.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: { customerName: `Burst Customer ${testSuffix}` }
        }),
        httpRequest(baseUrl, `/api/tenant/leads/${raceLead.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: { customerName: `Burst Customer ${testSuffix}` }
        }),
        httpRequest(baseUrl, `/api/tenant/leads/${raceLead.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: { customerName: `Burst Customer ${testSuffix}` }
        }),
        httpRequest(baseUrl, `/api/tenant/leads/${raceLead.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: { customerName: `Burst Customer ${testSuffix}` }
        })
      ]);

      // All 5 must return HTTP 200
      for (const res of results) {
        assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
      }

      // All must return the same customer ID and project ID
      const firstCustomerId = results[0].data.customer.id;
      const firstProjectId = results[0].data.project.id;
      createdProjectIds.push(firstProjectId);

      for (let i = 1; i < results.length; i++) {
        assert.equal(results[i].data.customer.id, firstCustomerId, 'Customer IDs must match across concurrent calls');
        assert.equal(results[i].data.project.id, firstProjectId, 'Project IDs must match across concurrent calls');
      }

      // Database verification: strictly 1 row in Customer and Project for this lead
      const custCount = await prisma.customer.count({
        where: { leadId: raceLead.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(custCount, 1, 'Strictly 1 Customer record must exist in DB');

      const prjCount = await prisma.project.count({
        where: { leadId: raceLead.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(prjCount, 1, 'Strictly 1 Project record must exist in DB');
    });

    test('Simultaneous burst of 5 concurrent quotation conversion requests produces exactly ONE project without BOM duplication', async () => {
      // Fire 5 conversion requests simultaneously
      const results = await Promise.all([
        httpRequest(baseUrl, `/api/tenant/quotations/${raceQuote.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: {}
        }),
        httpRequest(baseUrl, `/api/tenant/quotations/${raceQuote.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: {}
        }),
        httpRequest(baseUrl, `/api/tenant/quotations/${raceQuote.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: {}
        }),
        httpRequest(baseUrl, `/api/tenant/quotations/${raceQuote.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: {}
        }),
        httpRequest(baseUrl, `/api/tenant/quotations/${raceQuote.id}/convert`, {
          method: 'POST',
          token: tokenTenantA,
          body: {}
        })
      ]);

      // All 5 must return HTTP 200
      for (const res of results) {
        assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
      }

      // All must reference the exact same project ID
      const firstProjectId = results[0].data.project.id;
      if (!createdProjectIds.includes(firstProjectId)) {
        createdProjectIds.push(firstProjectId);
      }

      for (let i = 1; i < results.length; i++) {
        assert.equal(results[i].data.project.id, firstProjectId, 'Project IDs must match across concurrent quotation conversions');
      }

      // Database verification: strictly 1 Project linked to this quotation
      const quotePrjCount = await prisma.project.count({
        where: { quotationId: raceQuote.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(quotePrjCount, 1, 'Strictly 1 Project row must exist for this quotation');

      // BOM Material requirements must NOT be duplicated (exactly 1 BOM item matching the 1 quotation item)
      const bomCount = await prisma.projectMaterialRequirement.count({
        where: { projectId: firstProjectId }
      });
      assert.equal(bomCount, 1, 'BOM requirements must strictly equal 1 without duplication');
    });

    test('Lead conversion with empty body does not crash or throw TypeError', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${raceLead.id}/convert`, {
        method: 'POST',
        token: tokenTenantA,
        body: {}
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.project);
    });

    test('Quotation conversion with empty body does not crash or throw TypeError', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/quotations/${raceQuote.id}/convert`, {
        method: 'POST',
        token: tokenTenantA,
        body: {}
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.project);
    });
  });

  // =========================================================================
  // 3. STATUTORY FORM GENERATOR LEAK AUDIT (HOSTILE CODEBASE SCAN)
  // =========================================================================
  describe('Statutory Form Generator Identity Leak Audit', () => {
    test('Project detail page does not contain hardcoded Thakre or Ekvarta strings', () => {
      const filePath = path.resolve(__dirname, '../../web-client/src/app/tenant/projects/[id]/page.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(
        !content.includes('SHRI. SURENDRA RAMBHAU THAKRE'),
        'page.tsx must not contain SHRI. SURENDRA RAMBHAU THAKRE'
      );
      assert.ok(
        !content.includes('EKVARTA ENERGY SOLUTIONS'),
        'page.tsx must not contain EKVARTA ENERGY SOLUTIONS'
      );
    });

    test('Audit for remaining hardcoded leaks in statutory PDF components and quotation templates', () => {
      const pdfFilePath = path.resolve(__dirname, '../../web-client/src/components/pdf/MsedclFormsPDF.tsx');
      const quotationPagePath = path.resolve(__dirname, '../../web-client/src/app/tenant/quotations/page.tsx');
      const quotationModalPath = path.resolve(__dirname, '../../web-client/src/components/quotations/QuotationDetailModal.tsx');

      const leaksFound = [];

      if (fs.existsSync(pdfFilePath)) {
        const pdfContent = fs.readFileSync(pdfFilePath, 'utf8');
        if (pdfContent.includes('SHRI. SURENDRA RAMBHAU THAKRE')) {
          leaksFound.push('MsedclFormsPDF.tsx: contains "SHRI. SURENDRA RAMBHAU THAKRE" fallback');
        }
        if (pdfContent.includes('EKVARTA ENERGY SOLUTIONS') || pdfContent.includes('Ekvarta Energy Solutions')) {
          leaksFound.push('MsedclFormsPDF.tsx: contains "EKVARTA ENERGY SOLUTIONS" fallback');
        }
        if (pdfContent.includes('410022120526')) {
          leaksFound.push('MsedclFormsPDF.tsx: contains hardcoded CA number "410022120526" fallback');
        }
        if (pdfContent.includes('RAVI DODKUJI KAWALE')) {
          leaksFound.push('MsedclFormsPDF.tsx: contains hardcoded beneficiary "RAVI DODKUJI KAWALE" fallback');
        }
        if (pdfContent.includes('MS2608211A3882')) {
          leaksFound.push('MsedclFormsPDF.tsx: contains hardcoded module serial "MS2608211A3882" fallback array');
        }
      }

      if (fs.existsSync(quotationPagePath)) {
        const qPageContent = fs.readFileSync(quotationPagePath, 'utf8');
        if (qPageContent.includes('Ekvarta Energy Solutions')) {
          leaksFound.push('tenant/quotations/page.tsx: contains "Ekvarta Energy Solutions" fallback');
        }
        if (qPageContent.includes('RAVI DODKUJI KAWALE')) {
          leaksFound.push('tenant/quotations/page.tsx: contains "RAVI DODKUJI KAWALE" fallback');
        }
      }

      if (fs.existsSync(quotationModalPath)) {
        const qModalContent = fs.readFileSync(quotationModalPath, 'utf8');
        if (qModalContent.includes('Ekvarta Energy Solutions')) {
          leaksFound.push('QuotationDetailModal.tsx: contains "Ekvarta Energy Solutions" fallback');
        }
        if (qModalContent.includes('RAVI DODKUJI KAWALE')) {
          leaksFound.push('QuotationDetailModal.tsx: contains "RAVI DODKUJI KAWALE" fallback');
        }
      }

      // Assert report on leaks found
      console.log('--- STATUTORY GENERATOR LEAK AUDIT RESULTS ---');
      console.log('Leaks discovered count:', leaksFound.length);
      leaksFound.forEach(l => console.log('  [LEAK]:', l));
      console.log('----------------------------------------------');

      // Enforce zero leaks
      assert.equal(leaksFound.length, 0, `Expected 0 statutory leaks, found ${leaksFound.length}: ${leaksFound.join('; ')}`);
    });
  });

  // =========================================================================
  // 4. DASHBOARD ZERO-DATA INTEGRITY AUDIT
  // =========================================================================
  describe('Dashboard Zero-Data Integrity Audit', () => {
    test('Dashboard page contains NO synthetic fallback mock datasets', () => {
      const dashPath = path.resolve(__dirname, '../../web-client/src/app/tenant/dashboard/page.tsx');
      const content = fs.readFileSync(dashPath, 'utf8');

      assert.ok(!content.includes('fallbackHorizonDataMap'), 'Must not contain fallbackHorizonDataMap');
      assert.ok(!content.includes('fallbackSegmentationData'), 'Must not contain fallbackSegmentationData');
      assert.ok(!content.includes('fallbackLeadSourceData'), 'Must not contain fallbackLeadSourceData');
      assert.ok(!content.includes('fallbackInventoryRunway'), 'Must not contain fallbackInventoryRunway');
      assert.ok(!content.includes('fallbackSubsidyFunnel'), 'Must not contain fallbackSubsidyFunnel');
    });

    test('Dashboard renders EmptyState in all zero-data conditional blocks', () => {
      const dashPath = path.resolve(__dirname, '../../web-client/src/app/tenant/dashboard/page.tsx');
      const content = fs.readFileSync(dashPath, 'utf8');

      assert.ok(content.includes('import { EmptyState } from \'@/components/ui/EmptyState\''), 'Must import EmptyState');
      assert.ok(content.includes('title="No Horizon Trend Data Available"'), 'Must render EmptyState for Horizon trends');
      assert.ok(content.includes('title="No Hardware Runway Recorded"'), 'Must render EmptyState for hardware runway');
      assert.ok(content.includes('title="No Project Segmentation Data"'), 'Must render EmptyState for system segmentation');
      assert.ok(content.includes('title="No Subsidy Claims Active"'), 'Must render EmptyState for subsidy funnel');
      assert.ok(content.includes('title="No Lead Acquisition Data"'), 'Must render EmptyState for lead sources');
    });
  });
});
