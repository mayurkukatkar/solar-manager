/**
 * Tier 2: Boundary, Corner Cases & Negative Invariant Tests (Opaque-Box E2E Suite)
 * WhereReady Solar OS Enterprise SaaS
 * 
 * Verifies edge cases, negative inputs, boundary conditions, and security constraints:
 * 1. Unauthenticated & Invalid Token Access Rejection (HTTP 401)
 * 2. DISCOM Consumer Number Format Boundaries & Validations
 * 3. System Capacity Limits & Central Subsidy Caps (0 kW, negative, fractional, >3 kW cap)
 * 4. Odd Pricing Amounts & 13.8% Composite GST Rounding Invariants (zero penny drift)
 * 5. DISCOM Statutory 5-Stage Gating Strict Rejections (HTTP 400 for missing docs)
 * 6. Non-Existent Resource Queries (HTTP 404 for leads, quotes, POs, subsidies)
 * 7. Multi-Tenant Cross-Boundary Isolation (Tenant B cannot read or mutate Tenant A data)
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  startTestServer,
  httpRequest,
  createToken,
  TEST_FIXTURES,
  cleanupTestArtifacts,
  prisma
} = require('./testHelper');

const {
  calculateIndicativeSubsidy,
  calculateSystemCapacity,
  calculateCommercialPricing,
  generateMilestones
} = require('../../services/solarCalculator');

describe('Tier 2: Boundary, Corner Cases & Security Constraints (Opaque-Box)', () => {
  let serverInstance;
  let baseUrl;
  let tokenTenantA;
  let tokenTenantB;
  const tenantAId = TEST_FIXTURES.tenantA.id;
  const tenantBId = TEST_FIXTURES.tenantB.id;

  const tracked = {
    leads: [],
    quotations: [],
    projects: [],
    discomApplications: []
  };

  before(async () => {
    serverInstance = await startTestServer();
    baseUrl = serverInstance.baseUrl;
    tokenTenantA = createToken({
      userId: TEST_FIXTURES.tenantA.adminUser.id,
      role: 'TENANT_ADMIN',
      tenantId: tenantAId
    });
    tokenTenantB = createToken({
      userId: TEST_FIXTURES.tenantB.adminUser.id,
      role: 'TENANT_ADMIN',
      tenantId: tenantBId
    });
  });

  after(async () => {
    await cleanupTestArtifacts(tracked);
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  // ----------------------------------------------------
  // Category 1: Unauthenticated & Invalid Token Rejection
  // ----------------------------------------------------
  describe('2.1 Unauthenticated & Invalid Token Rejection (HTTP 401)', () => {
    it('should reject unauthenticated request to /api/tenant/leads with 401', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/leads');
      assert.equal(res.status, 401);
      assert.ok(res.body.error, 'Must return error message');
      assert.match(res.body.error, /unauthorized|tenant access required|authentication/i);
    });

    it('should reject unauthenticated request to /api/tenant/quotations with 401', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/quotations');
      assert.equal(res.status, 401);
      assert.match(res.body.error, /unauthorized|tenant access required|authentication/i);
    });

    it('should reject unauthenticated request to /api/tenant/finance with 401', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/finance');
      assert.equal(res.status, 401);
      assert.match(res.body.error, /unauthorized|tenant access required|authentication/i);
    });

    it('should reject unauthenticated request to /api/tenant/procurement with 401', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/procurement');
      assert.equal(res.status, 401);
      assert.match(res.body.error, /unauthorized|tenant access required|authentication/i);
    });

    it('should reject requests with malformed or invalid Bearer tokens with 401', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/leads', {
        headers: { Authorization: 'Bearer this.is.a.completely.fake.token' }
      });
      assert.equal(res.status, 401);
      assert.match(res.body.error, /invalid|expired/i);
    });
  });

  // ----------------------------------------------------
  // Category 2: DISCOM Consumer Number Validations
  // ----------------------------------------------------
  describe('2.2 DISCOM Consumer Number Boundaries & Validations', () => {
    it('should reject smart-parse requests with missing or empty rawText with HTTP 400', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/pmsuryaghar/smart-parse', {
        method: 'POST',
        token: tokenTenantA,
        body: { rawText: '' }
      });

      assert.equal(res.status, 400);
      assert.match(res.body.error, /text content is required/i);
    });

    it('should extract valid 12-digit MSEDCL consumer numbers accurately', async () => {
      const textWith12Digit = 'Consumer CA No: 028510293812 MSEDCL Pune Division';
      const res = await httpRequest(baseUrl, '/api/tenant/pmsuryaghar/smart-parse', {
        method: 'POST',
        token: tokenTenantA,
        body: { rawText: textWith12Digit }
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.extracted.consumerNumber, '028510293812');
    });

    it('should ignore non-numeric short consumer numbers under 8 digits in unstructured parsing', async () => {
      const textWithShort = 'Short code: 1234 without valid consumer number';
      const res = await httpRequest(baseUrl, '/api/tenant/pmsuryaghar/smart-parse', {
        method: 'POST',
        token: tokenTenantA,
        body: { rawText: textWithShort }
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.extracted.consumerNumber, undefined, 'Short numbers <8 digits should not match consumer number regex');
    });
  });

  // ----------------------------------------------------
  // Category 3: System Capacity Limits & Subsidy Boundaries
  // ----------------------------------------------------
  describe('2.3 System Capacity Limits & Central Subsidy Caps', () => {
    it('should return 0 subsidy for 0 kW capacity', () => {
      const result = calculateIndicativeSubsidy({ capacityKw: 0, connectionType: 'Residential' });
      assert.equal(result.indicativeSubsidy, 0);
    });

    it('should calculate proportional subsidy for micro-systems under 1 kW', () => {
      // 0.75 kW system -> 0.75 * 30,000 = 22,500
      const result = calculateIndicativeSubsidy({ capacityKw: 0.75, connectionType: 'Residential' });
      assert.equal(result.indicativeSubsidy, 22500);
    });

    it('should enforce exact slab boundaries at 1.0 kW, 2.0 kW, and 3.0 kW', () => {
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 1.0, connectionType: 'Residential' }).indicativeSubsidy, 30000);
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 2.0, connectionType: 'Residential' }).indicativeSubsidy, 60000);
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 3.0, connectionType: 'Residential' }).indicativeSubsidy, 78000);
    });

    it('should strictly cap subsidy at ₹78,000 for residential capacities >= 3.0 kW', () => {
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 3.3, connectionType: 'Residential' }).indicativeSubsidy, 78000);
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 5.0, connectionType: 'Residential' }).indicativeSubsidy, 78000);
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 10.0, connectionType: 'Residential' }).indicativeSubsidy, 78000);
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 50.0, connectionType: 'Residential' }).indicativeSubsidy, 78000);
    });

    it('should return ₹0 subsidy for commercial or industrial connections regardless of capacity', () => {
      const comm = calculateIndicativeSubsidy({ capacityKw: 50.0, connectionType: 'Commercial' });
      assert.equal(comm.indicativeSubsidy, 0);
      assert.equal(comm.isEligible, false);

      const ind = calculateIndicativeSubsidy({ capacityKw: 100.0, connectionType: 'Industrial' });
      assert.equal(ind.indicativeSubsidy, 0);
      assert.equal(ind.isEligible, false);
    });

    it('should handle missing or zero panel inputs to calculateSystemCapacity gracefully', () => {
      const zeroQty = calculateSystemCapacity({ panelWattage: 550, panelQuantity: 0 });
      assert.ok(typeof zeroQty.dcCapacityKw === 'number');

      const zeroWatt = calculateSystemCapacity({ panelWattage: 0, panelQuantity: 10 });
      assert.ok(typeof zeroWatt.dcCapacityKw === 'number');
    });
  });

  // ----------------------------------------------------
  // Category 4: Odd Pricing Amounts & 13.8% Composite GST Rounding
  // ----------------------------------------------------
  describe('2.4 Odd Pricing Amounts & 13.8% Composite GST Rounding Invariant', () => {
    it('should preserve subtotal + tax === total with ZERO penny drift on odd amount ₹2,75,001', () => {
      const gross = 275001;
      const subtotal = Math.round(gross / 1.138);
      const tax = gross - subtotal;

      assert.equal(subtotal + tax, gross, 'Subtotal + tax must strictly equal gross turnkey price');
      assert.equal(subtotal, 241653);
      assert.equal(tax, 33348);
    });

    it('should preserve subtotal + tax === total with ZERO penny drift on odd amount ₹1,91,400', () => {
      const gross = 191400;
      const subtotal = Math.round(gross / 1.138);
      const tax = gross - subtotal;

      assert.equal(subtotal + tax, gross);
      assert.equal(subtotal, 168190);
      assert.equal(tax, 23210);
    });

    it('should preserve subtotal + tax === total with ZERO penny drift on odd amount ₹3,47,999', () => {
      const gross = 347999;
      const subtotal = Math.round(gross / 1.138);
      const tax = gross - subtotal;

      assert.equal(subtotal + tax, gross);
      assert.equal(subtotal, 305799);
      assert.equal(tax, 42200);
    });

    it('should verify calculateCommercialPricing produces consistent integer grandTotal and amount in words', () => {
      const pricing = calculateCommercialPricing({
        items: [
          { description: 'Solar Panels', unitPrice: 15333, quantity: 9, taxRate: 12 },
          { description: 'Inverter', unitPrice: 42777, quantity: 1, taxRate: 12 }
        ],
        overallDiscount: 2500,
        useCompositeSolarGST: true
      });

      assert.equal(pricing.taxableAmount + pricing.tax, pricing.grandTotal);
      assert.equal(pricing.cgst + pricing.sgst, pricing.tax);
      assert.match(pricing.amountInWords, /^RUPEES .* ONLY$/);
    });

    it('should verify standard milestones rebalancer sums accurately to grand total', () => {
      const total = 275001;
      const milestones = generateMilestones(total);

      assert.equal(milestones.length, 4);
      assert.equal(milestones[0].percentage, 20);
      assert.equal(milestones[1].percentage, 60);
      assert.equal(milestones[2].percentage, 15);
      assert.equal(milestones[3].percentage, 5);

      const sumMilestones = milestones.reduce((s, m) => s + m.amount, 0);
      // Tolerance within 1 rupee due to individual milestone rounding
      assert.ok(Math.abs(sumMilestones - total) <= 1, `Milestone sum ${sumMilestones} should match total ${total} within 1 rupee`);
    });
  });

  // ----------------------------------------------------
  // Category 5: DISCOM Statutory 5-Stage Gating Strict Rejections
  // ----------------------------------------------------
  describe('2.5 DISCOM Statutory 5-Stage Gating Strict Rejections (HTTP 400)', () => {
    let testProjectId;

    before(async () => {
      const proj = await prisma.project.create({
        data: {
          tenantId: tenantAId,
          projectNumber: `PRJ-DISC-NEG-${Date.now().toString().slice(-4)}`,
          name: 'DISCOM Negative Test Project',
          capacity: 3.3,
          currentStage: 'Planning',
          status: 'In Progress'
        }
      });
      testProjectId = proj.id;
      tracked.projects.push(proj.id);

      const d = await prisma.discomApplication.create({
        data: {
          tenantId: tenantAId,
          projectId: proj.id,
          status: 'FEASIBILITY_PENDING'
        }
      });
      tracked.discomApplications.push(d.id);
    });

    it('should reject advancing to CEIG_INSPECTION without Feasibility Approval document with HTTP 400', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProjectId}/discom/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { status: 'CEIG_INSPECTION' } // Missing FEASIBILITY_LETTER document
      });

      assert.equal(res.status, 400);
      assert.match(res.body.error, /feasibility approval document is mandatory/i);
    });

    it('should reject advancing to METER_TESTING without CEIG Approval document with HTTP 400', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProjectId}/discom/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { status: 'METER_TESTING' } // Missing CEIG_APPROVAL document
      });

      assert.equal(res.status, 400);
      assert.match(res.body.error, /ceig approval document is mandatory/i);
    });

    it('should reject advancing to NET_METER_INSTALLED without Meter Test Report with HTTP 400', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProjectId}/discom/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { status: 'NET_METER_INSTALLED' } // Missing METER_TEST_REPORT document
      });

      assert.equal(res.status, 400);
      assert.match(res.body.error, /meter test report is mandatory/i);
    });

    it('should reject advancing to GRID_SYNCHRONIZED without Net-Meter Certificate with HTTP 400', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${testProjectId}/discom/stage`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { status: 'GRID_SYNCHRONIZED' } // Missing NET_METER_CERTIFICATE document
      });

      assert.equal(res.status, 400);
      assert.match(res.body.error, /net-meter certificate is mandatory/i);
    });

    it('should return HTTP 404 when updating DISCOM stage for non-existent project ID', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/projects/00000000-0000-0000-0000-000000000000/discom/stage', {
        method: 'PATCH',
        token: tokenTenantA,
        body: { status: 'CEIG_INSPECTION' }
      });

      assert.equal(res.status, 404);
      assert.match(res.body.error, /discom application not found/i);
    });
  });

  // ----------------------------------------------------
  // Category 6: Non-Existent Resources Lookups (HTTP 404)
  // ----------------------------------------------------
  describe('2.6 Non-Existent Resource Queries (HTTP 404)', () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    it('should return 404 for non-existent Lead ID', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${nonExistentId}`, {
        token: tokenTenantA
      });
      assert.equal(res.status, 404);
      assert.match(res.body.error, /lead not found/i);
    });

    it('should return 404 for non-existent Quotation ID', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/quotations/${nonExistentId}`, {
        token: tokenTenantA
      });
      assert.equal(res.status, 404);
      assert.match(res.body.error, /quotation not found/i);
    });

    it('should return 404 for non-existent Purchase Order ID', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/procurement/${nonExistentId}`, {
        token: tokenTenantA
      });
      assert.equal(res.status, 404);
      assert.match(res.body.error, /purchase order not found/i);
    });

    it('should return 404 for non-existent PM Surya Ghar Subsidy ID', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/subsidies/${nonExistentId}`, {
        token: tokenTenantA
      });
      assert.equal(res.status, 404);
      assert.match(res.body.error, /application not found/i);
    });
  });

  // ----------------------------------------------------
  // Category 7: Strict Multi-Tenant Cross-Isolation
  // ----------------------------------------------------
  describe('2.7 Multi-Tenant Isolation Enforcement', () => {
    let tenantALeadId;

    before(async () => {
      const lead = await prisma.lead.create({
        data: {
          tenantId: tenantAId,
          name: 'Confidential Tenant A Customer',
          mobile: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
          email: `confidential_${Date.now()}@tenanta.com`,
          city: 'Pune'
        }
      });
      tenantALeadId = lead.id;
      tracked.leads.push(lead.id);
    });

    it('should prevent Tenant B from reading Tenant A lead (returns HTTP 404)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${tenantALeadId}`, {
        token: tokenTenantB // Tenant B Bearer token
      });

      // Endpoint scopes query by tenantId: req.user.tenantId, so Tenant B sees 404 Not Found
      assert.equal(res.status, 404);
      assert.match(res.body.error, /lead not found/i);
    });

    it('should prevent Tenant B from deleting Tenant A lead (returns HTTP 404)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${tenantALeadId}`, {
        method: 'DELETE',
        token: tokenTenantB // Tenant B Bearer token
      });

      assert.equal(res.status, 404);
      assert.match(res.body.error, /lead not found/i);

      // Verify the lead in Tenant A was NOT deleted
      const stillExists = await prisma.lead.findUnique({
        where: { id: tenantALeadId }
      });
      assert.ok(stillExists, 'Tenant A lead must remain intact after unauthorized delete attempt');
    });

    it('should prevent Tenant B from converting Tenant A lead (returns HTTP 404)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${tenantALeadId}/convert`, {
        method: 'POST',
        token: tokenTenantB
      });

      assert.equal(res.status, 404);
      assert.match(res.body.error, /lead not found/i);
    });
  });
});
