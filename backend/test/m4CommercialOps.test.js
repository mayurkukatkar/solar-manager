/**
 * Milestone M4: Commercial & Operations Automated Verification Test Suite
 * 
 * Verifies:
 * 1. Strict 7-Stage Project State Machine Gating (sequential enforcement, illegal skip rejection, backward transitions)
 * 2. Idempotent 1-Click Lead Conversion (atomic transaction, consecutive call deduplication, duplicate DB row prevention)
 * 3. Idempotent 1-Click Quotation Conversion (atomic transaction, consecutive call deduplication, duplicate DB row prevention)
 * 4. Multi-Tenant Isolation Preservation across stage transitions, lead conversion, and quotation conversion.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../db');
const { startTestServer, createToken, httpRequest, TEST_FIXTURES } = require('./e2e/testHelper');

describe('Milestone M4: Commercial & Operations Test Suite', () => {
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
  // 1. SEQUENTIAL 7-STAGE PROJECT STATE MACHINE
  // =========================================================================
  describe('Sequential 7-Stage Project State Machine Gating', () => {
    let testProject = null;

    before(async () => {
      // Create initial project in stage SURVEY_COMPLETED for Tenant A
      testProject = await prisma.project.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `M4 State Machine Test Project ${testSuffix}`,
          projectNumber: `PRJ-M4-${testSuffix}`,
          currentStage: 'SURVEY_COMPLETED',
          progressPercent: 15,
          status: 'In Progress',
          capacity: 5.0,
          capacityUnit: 'kWp'
        }
      });
    });

    after(async () => {
      if (testProject) {
        await prisma.projectStageHistory.deleteMany({ where: { projectId: testProject.id } }).catch(() => {});
        await prisma.projectTimelineEvent.deleteMany({ where: { projectId: testProject.id } }).catch(() => {});
        await prisma.projectMaterialRequirement.deleteMany({ where: { projectId: testProject.id } }).catch(() => {});
        await prisma.purchaseOrder.deleteMany({ where: { projectId: testProject.id } }).catch(() => {});
        await prisma.aMC.deleteMany({ where: { projectId: testProject.id } }).catch(() => {});
        await prisma.invoice.deleteMany({ where: { projectId: testProject.id } }).catch(() => {});
        await prisma.completionCertificate.deleteMany({ where: { projectId: testProject.id } }).catch(() => {});
        await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
      }
    });

    test('Rejects invalid or unmapped stage names with HTTP 400', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'NON_EXISTENT_STAGE' }
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.error, 'Invalid stage: NON_EXISTENT_STAGE');
    });

    test('Rejects transition when already in the requested stage with HTTP 400', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'SURVEY_COMPLETED' }
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.error, 'Already in this stage');
    });

    test('Rejects illegal stage jump (e.g. SURVEY_COMPLETED -> COMMISSIONED) with HTTP 400 and strict error message', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'COMMISSIONED' }
      });

      assert.equal(res.status, 400);
      assert.equal(
        res.data.error,
        `Invalid stage transition: cannot jump from SURVEY_COMPLETED to COMMISSIONED`
      );
    });

    test('Rejects illegal stage jump skipping intermediate steps (e.g. SURVEY_COMPLETED -> MATERIAL_DISPATCHED)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'MATERIAL_DISPATCHED' }
      });

      assert.equal(res.status, 400);
      assert.equal(
        res.data.error,
        `Invalid stage transition: cannot jump from SURVEY_COMPLETED to MATERIAL_DISPATCHED`
      );
    });

    test('Permits valid sequential transition from SURVEY_COMPLETED to STRUCTURE_APPROVED', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'STRUCTURE_APPROVED', comment: 'Structural roof engineering verified' }
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.project.currentStage, 'STRUCTURE_APPROVED');
      assert.equal(res.data.project.progressPercent, 30);

      // Verify in DB
      const dbProject = await prisma.project.findUnique({ where: { id: testProject.id } });
      assert.equal(dbProject.currentStage, 'STRUCTURE_APPROVED');
      assert.equal(dbProject.progressPercent, 30);
    });

    test('Permits valid sequential transition from STRUCTURE_APPROVED to MATERIAL_DISPATCHED', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'MATERIAL_DISPATCHED', comment: 'BOM hardware dispatched to site' }
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.project.currentStage, 'MATERIAL_DISPATCHED');
      assert.equal(res.data.project.progressPercent, 50);
    });

    test('Permits backward transition / re-check (e.g. MATERIAL_DISPATCHED back to STRUCTURE_APPROVED)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'STRUCTURE_APPROVED', comment: 'Re-checking roof ballast after wind assessment' }
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.project.currentStage, 'STRUCTURE_APPROVED');
      assert.equal(res.data.project.progressPercent, 30);
    });

    test('Completes the entire sequential workflow up to COMMISSIONED cleanly', async () => {
      // Step back forward to MATERIAL_DISPATCHED
      const step1 = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'MATERIAL_DISPATCHED' }
      });
      assert.equal(step1.status, 200);

      // Step to INSTALLATION_STARTED
      const step2 = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'INSTALLATION_STARTED' }
      });
      assert.equal(step2.status, 200);
      assert.equal(step2.data.project.currentStage, 'INSTALLATION_STARTED');
      assert.equal(step2.data.project.progressPercent, 75);

      // Step to TESTING_COMPLETED
      const step3 = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'TESTING_COMPLETED' }
      });
      assert.equal(step3.status, 200);
      assert.equal(step3.data.project.currentStage, 'TESTING_COMPLETED');
      assert.equal(step3.data.project.progressPercent, 90);

      // Step to NET_METER_APPLIED
      const step4 = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'NET_METER_APPLIED' }
      });
      assert.equal(step4.status, 200);
      assert.equal(step4.data.project.currentStage, 'NET_METER_APPLIED');
      assert.equal(step4.data.project.progressPercent, 95);

      // Step to COMMISSIONED
      const step5 = await httpRequest(baseUrl, `/api/tenant/projects/${testProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { newStage: 'COMMISSIONED', comment: 'Net meter energized and commissioned' }
      });
      assert.equal(step5.status, 200);
      assert.equal(step5.data.project.currentStage, 'COMMISSIONED');
      assert.equal(step5.data.project.progressPercent, 100);
      assert.equal(step5.data.project.status, 'Completed');
      assert.ok(step5.data.project.actualCompletionDate);
    });
  });

  // =========================================================================
  // 2. IDEMPOTENT 1-CLICK LEAD CONVERSIONS
  // =========================================================================
  describe('Idempotent 1-Click Lead Conversions', () => {
    let testLead = null;
    let createdCustomerId = null;
    let createdProjectId = null;

    before(async () => {
      testLead = await prisma.lead.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `M4 Test Lead ${testSuffix}`,
          email: `m4lead${testSuffix}@solarops.test`,
          mobile: `9899${testSuffix}`,
          status: 'QUALIFIED',
          estimatedCap: 4.5,
          estimatedValue: 247500,
          customerType: 'RESIDENTIAL',
          address: '100 Sunshine Way, Baner',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411045'
        }
      });
    });

    after(async () => {
      if (testLead) {
        if (createdProjectId) {
          await prisma.projectTask.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
          await prisma.discomApplication.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
          await prisma.subsidyApplication.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
          await prisma.projectTimelineEvent.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
          await prisma.project.delete({ where: { id: createdProjectId } }).catch(() => {});
        }
        await prisma.leadActivity.deleteMany({ where: { leadId: testLead.id } }).catch(() => {});
        await prisma.siteSurvey.deleteMany({ where: { leadId: testLead.id } }).catch(() => {});
        if (createdCustomerId) {
          await prisma.customer.delete({ where: { id: createdCustomerId } }).catch(() => {});
        }
        await prisma.lead.delete({ where: { id: testLead.id } }).catch(() => {});
      }
    });

    test('First conversion call creates Customer and Project with SURVEY_COMPLETED stage', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${testLead.id}/convert`, {
        method: 'POST',
        token: tokenTenantA,
        body: {
          customerName: `M4 Converted Customer ${testSuffix}`,
          capacity: 4.5
        }
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.customer, 'Customer must be returned');
      assert.ok(res.data.project, 'Project must be returned');
      assert.equal(res.data.lead.status, 'WON');
      assert.ok(['Planning', 'SURVEY_COMPLETED'].includes(res.data.project.currentStage));
      assert.equal(res.data.project.progressPercent, 15);

      createdCustomerId = res.data.customer.id;
      createdProjectId = res.data.project.id;

      // Verify in DB
      const customersCount = await prisma.customer.count({
        where: { leadId: testLead.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(customersCount, 1, 'Exactly one customer row must exist');

      const projectsCount = await prisma.project.count({
        where: { leadId: testLead.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(projectsCount, 1, 'Exactly one project row must exist');
    });

    test('Consecutive second conversion call returns identical records without duplicating DB rows', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${testLead.id}/convert`, {
        method: 'POST',
        token: tokenTenantA,
        body: {
          customerName: `M4 Converted Customer ${testSuffix}`
        }
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.customer.id, createdCustomerId, 'Must return same customer ID');
      assert.equal(res.data.project.id, createdProjectId, 'Must return same project ID');

      // Verify DB row counts are strictly preserved (no duplication)
      const customersCount = await prisma.customer.count({
        where: { leadId: testLead.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(customersCount, 1, 'Customer row count must remain exactly 1');

      const projectsCount = await prisma.project.count({
        where: { leadId: testLead.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(projectsCount, 1, 'Project row count must remain exactly 1');
    });

    test('Consecutive third conversion call remains idempotent and succeeds with HTTP 200', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${testLead.id}/convert`, {
        method: 'POST',
        token: tokenTenantA,
        body: {}
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.customer.id, createdCustomerId);
      assert.equal(res.data.project.id, createdProjectId);

      const projectsCount = await prisma.project.count({
        where: { leadId: testLead.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(projectsCount, 1);
    });
  });

  // =========================================================================
  // 3. IDEMPOTENT 1-CLICK QUOTATION CONVERSIONS
  // =========================================================================
  describe('Idempotent 1-Click Quotation Conversions', () => {
    let testQuotation = null;
    let createdProjectId = null;

    before(async () => {
      testQuotation = await prisma.quotation.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          qNumber: `Q-M4-${testSuffix}`,
          systemCapacity: 6.0,
          systemType: 'On-grid',
          connectionType: 'Residential',
          subtotal: 300000,
          tax: 41400,
          total: 341400,
          status: 'SENT',
          paymentMilestones: [
            { stage: 'Advance', percentage: 20, amount: 68280 },
            { stage: 'Dispatch', percentage: 50, amount: 170700 },
            { stage: 'Testing', percentage: 20, amount: 68280 },
            { stage: 'Handover', percentage: 10, amount: 34140 }
          ],
          items: {
            create: [
              { description: 'Mono PERC 540W PV Modules', quantity: 11, unitPrice: 16000, taxRate: 12, total: 176000 },
              { description: '5kW Single Phase Grid Tie Inverter', quantity: 1, unitPrice: 50000, taxRate: 12, total: 50000 }
            ]
          }
        }
      });
    });

    after(async () => {
      if (testQuotation) {
        if (createdProjectId) {
          await prisma.projectTask.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
          await prisma.discomApplication.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
          await prisma.invoice.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
          await prisma.projectTimelineEvent.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
          await prisma.projectMaterialRequirement.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
          await prisma.project.delete({ where: { id: createdProjectId } }).catch(() => {});
        }
        await prisma.quotationItem.deleteMany({ where: { quotationId: testQuotation.id } }).catch(() => {});
        await prisma.quotation.delete({ where: { id: testQuotation.id } }).catch(() => {});
      }
    });

    test('First conversion call creates Project, locks quotation, and initializes SURVEY_COMPLETED stage', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/quotations/${testQuotation.id}/convert`, {
        method: 'POST',
        token: tokenTenantA,
        body: {}
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.project, 'Project must be returned');
      assert.equal(res.data.project.quotationId, testQuotation.id);
      assert.ok(['Planning', 'SURVEY_COMPLETED'].includes(res.data.project.currentStage));
      assert.equal(res.data.project.progressPercent, 15);
      assert.equal(res.data.quotation.status, 'ACCEPTED');
      assert.equal(res.data.quotation.isLocked, true);

      createdProjectId = res.data.project.id;

      // Verify in DB
      const projectsCount = await prisma.project.count({
        where: { quotationId: testQuotation.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(projectsCount, 1, 'Exactly one project row must exist for this quotation');

      // Verify BOM requirements were populated
      const bomCount = await prisma.projectMaterialRequirement.count({
        where: { projectId: createdProjectId }
      });
      assert.equal(bomCount, 2, 'Two BOM items must be created from quotation items');
    });

    test('Consecutive second conversion call returns existing project with HTTP 200 without duplicate DB rows', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/quotations/${testQuotation.id}/convert`, {
        method: 'POST',
        token: tokenTenantA,
        body: {}
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.project.id, createdProjectId, 'Must return same project ID');

      // Verify DB row counts are strictly preserved
      const projectsCount = await prisma.project.count({
        where: { quotationId: testQuotation.id, tenantId: TEST_FIXTURES.tenantA.id }
      });
      assert.equal(projectsCount, 1, 'Project count must remain exactly 1');

      const bomCount = await prisma.projectMaterialRequirement.count({
        where: { projectId: createdProjectId }
      });
      assert.equal(bomCount, 2, 'BOM count must remain exactly 2 without duplication');
    });

    test('Consecutive third conversion call remains idempotent and succeeds with HTTP 200', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/quotations/${testQuotation.id}/convert`, {
        method: 'POST',
        token: tokenTenantA,
        body: {}
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.project.id, createdProjectId);
    });
  });

  // =========================================================================
  // 4. MULTI-TENANT ISOLATION PRESERVATION
  // =========================================================================
  describe('Multi-Tenant Isolation Preservation', () => {
    let tenantAProject = null;
    let tenantALead = null;
    let tenantAQuotation = null;

    before(async () => {
      tenantAProject = await prisma.project.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Tenant A Isolated Project ${testSuffix}`,
          currentStage: 'SURVEY_COMPLETED'
        }
      });

      tenantALead = await prisma.lead.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Tenant A Isolated Lead ${testSuffix}`,
          mobile: `9888${testSuffix}`,
          status: 'QUALIFIED'
        }
      });

      tenantAQuotation = await prisma.quotation.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          qNumber: `Q-ISO-${testSuffix}`,
          status: 'SENT',
          total: 100000
        }
      });
    });

    after(async () => {
      if (tenantAProject) {
        await prisma.project.delete({ where: { id: tenantAProject.id } }).catch(() => {});
      }
      if (tenantALead) {
        await prisma.lead.delete({ where: { id: tenantALead.id } }).catch(() => {});
      }
      if (tenantAQuotation) {
        await prisma.quotation.delete({ where: { id: tenantAQuotation.id } }).catch(() => {});
      }
    });

    test('Tenant B cannot change stage of Tenant A project (returns 404)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${tenantAProject.id}/stage`, {
        method: 'PATCH',
        token: tokenTenantB,
        body: { newStage: 'STRUCTURE_APPROVED' }
      });

      assert.equal(res.status, 404);
      assert.equal(res.data.error, 'Project not found');

      // Verify Tenant A project stage was not altered
      const p = await prisma.project.findUnique({ where: { id: tenantAProject.id } });
      assert.equal(p.currentStage, 'SURVEY_COMPLETED');
    });

    test('Tenant B cannot convert Tenant A lead (returns 404)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${tenantALead.id}/convert`, {
        method: 'POST',
        token: tokenTenantB,
        body: {}
      });

      assert.equal(res.status, 404);
      assert.equal(res.data.error, 'Lead not found');

      // Verify Tenant A lead status was not altered
      const l = await prisma.lead.findUnique({ where: { id: tenantALead.id } });
      assert.equal(l.status, 'QUALIFIED');
    });

    test('Tenant B cannot convert Tenant A quotation (returns 404)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/quotations/${tenantAQuotation.id}/convert`, {
        method: 'POST',
        token: tokenTenantB,
        body: {}
      });

      assert.equal(res.status, 404);
      assert.equal(res.data.error, 'Quotation not found');

      // Verify Tenant A quotation status was not altered
      const q = await prisma.quotation.findUnique({ where: { id: tenantAQuotation.id } });
      assert.equal(q.status, 'SENT');
    });
  });
});
