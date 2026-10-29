const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const solarCalc = require('../services/solarCalculator');
const { startTestServer, createToken, httpRequest, TEST_FIXTURES } = require('./e2e/testHelper');

describe('Adversarial Empirical Challenges — Milestones M2 & M3', () => {
  let serverInstance;
  let baseUrl;
  let tenantAToken;
  let tenantBToken;
  let tenantAProject;
  let tenantATask;
  let tenantAMilestone;
  let tenantAMaterial;
  let tenantATicket;

  before(async () => {
    serverInstance = await startTestServer();
    baseUrl = serverInstance.baseUrl;

    tenantAToken = createToken({
      userId: TEST_FIXTURES.tenantA.adminUser.id,
      tenantId: TEST_FIXTURES.tenantA.id,
      role: 'TENANT_ADMIN'
    });

    tenantBToken = createToken({
      userId: TEST_FIXTURES.tenantB.adminUser.id,
      tenantId: TEST_FIXTURES.tenantB.id,
      role: 'TENANT_ADMIN'
    });

    // 1. Create a project under Tenant A
    tenantAProject = await prisma.project.create({
      data: {
        tenantId: TEST_FIXTURES.tenantA.id,
        name: 'Adversarial Test Solar Project Tenant A',
        status: 'IN_PROGRESS',
        capacity: 5.0
      }
    });

    // 2. Create sub-entities directly under Project A
    tenantATask = await prisma.projectTask.create({
      data: {
        projectId: tenantAProject.id,
        name: 'Tenant A Sensitive Task',
        priority: 'High',
        status: 'PENDING'
      }
    });

    tenantAMilestone = await prisma.projectMilestone.create({
      data: {
        projectId: tenantAProject.id,
        name: 'Tenant A Structural Foundation',
        status: 'PENDING'
      }
    });

    tenantAMaterial = await prisma.projectMaterialRequirement.create({
      data: {
        projectId: tenantAProject.id,
        description: 'Tier-1 Mono PERC 550W Panels',
        quantity: 10,
        status: 'PENDING'
      }
    });

    // 3. Create a Support Ticket under Tenant A
    tenantATicket = await prisma.supportTicket.create({
      data: {
        tenantId: TEST_FIXTURES.tenantA.id,
        subject: 'Tenant A Inverter Fault Ticket',
        status: 'OPEN',
        priority: 'HIGH'
      }
    });
  });

  after(async () => {
    // Clean up test fixtures created in setup
    try {
      if (tenantATask) await prisma.projectTask.deleteMany({ where: { projectId: tenantAProject.id } });
      if (tenantAMilestone) await prisma.projectMilestone.deleteMany({ where: { projectId: tenantAProject.id } });
      if (tenantAMaterial) await prisma.projectMaterialRequirement.deleteMany({ where: { projectId: tenantAProject.id } });
      if (tenantATicket) {
        await prisma.serviceVisit.deleteMany({ where: { ticketId: tenantATicket.id } });
        await prisma.supportTicket.deleteMany({ where: { id: tenantATicket.id } });
      }
      if (tenantAProject) await prisma.project.deleteMany({ where: { id: tenantAProject.id } });
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }

    if (serverInstance && serverInstance.close) {
      await serverInstance.close();
    }
  });

  // =========================================================================
  // CHALLENGE 1: Child entity cross-tenant mutations (verify 404 rejection)
  // =========================================================================
  describe('Challenge 1: Child Entity Cross-Tenant Isolation Enforcement', () => {
    test('1.1 Tenant B cannot create task on Tenant A project -> HTTP 404', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${tenantAProject.id}/tasks`, {
        method: 'POST',
        token: tenantBToken,
        body: {
          name: 'Hostile Task Injection by Tenant B',
          priority: 'Urgent'
        }
      });

      assert.equal(res.status, 404, `Expected 404, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.error, 'Project not found');
    });

    test('1.2 Tenant B cannot update task on Tenant A project -> HTTP 404', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/tasks/${tenantATask.id}`, {
        method: 'PATCH',
        token: tenantBToken,
        body: {
          status: 'COMPLETED',
          progress: 100
        }
      });

      assert.equal(res.status, 404, `Expected 404, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.error, 'Task not found or access denied');
    });

    test('1.3 Tenant B cannot create milestone on Tenant A project -> HTTP 404', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${tenantAProject.id}/milestones`, {
        method: 'POST',
        token: tenantBToken,
        body: {
          name: 'Hostile Milestone Injection by Tenant B'
        }
      });

      assert.equal(res.status, 404, `Expected 404, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.error, 'Project not found');
    });

    test('1.4 Tenant B cannot update milestone on Tenant A project -> HTTP 404', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/milestones/${tenantAMilestone.id}`, {
        method: 'PATCH',
        token: tenantBToken,
        body: {
          status: 'COMPLETED'
        }
      });

      assert.equal(res.status, 404, `Expected 404, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.error, 'Milestone not found or access denied');
    });

    test('1.5 Tenant B cannot create material requirement on Tenant A project -> HTTP 404', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${tenantAProject.id}/materials`, {
        method: 'POST',
        token: tenantBToken,
        body: {
          description: 'Hostile Material Order',
          quantity: 1000
        }
      });

      assert.equal(res.status, 404, `Expected 404, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.error, 'Project not found');
    });

    test('1.6 Tenant B cannot update material requirement on Tenant A project -> HTTP 404', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/materials/${tenantAMaterial.id}`, {
        method: 'PATCH',
        token: tenantBToken,
        body: {
          status: 'FULFILLED',
          quantity: 500
        }
      });

      assert.equal(res.status, 404, `Expected 404, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.error, 'Material requirement not found or access denied');
    });

    test('1.7 Tenant B cannot schedule service visit on Tenant A ticket (support.js) -> HTTP 404', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/tickets/${tenantATicket.id}/visits`, {
        method: 'POST',
        token: tenantBToken,
        body: {
          notes: 'Adversarial Visit Attempt via support.js'
        }
      });

      assert.equal(res.status, 404, `Expected 404, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.error, 'Ticket not found or access denied');
    });

    test('1.8 Tenant B cannot schedule service visit on Tenant A ticket (finance.js) -> HTTP 404', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/service/${tenantATicket.id}/visits`, {
        method: 'POST',
        token: tenantBToken,
        body: {
          notes: 'Adversarial Visit Attempt via finance.js'
        }
      });

      assert.equal(res.status, 404, `Expected 404, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.error, 'Ticket not found or access denied');
    });
  });

  // =========================================================================
  // CHALLENGE 2: Unauthenticated OCR access & User Self-Protection
  // =========================================================================
  describe('Challenge 2: Unauthenticated Access & User Self-Protection', () => {
    test('2.1 Unauthenticated POST /api/tenant/ocr/scan-bill -> HTTP 401', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/ocr/scan-bill', {
        method: 'POST',
        body: { imageUrl: 'https://example.com/fake-bill.jpg' }
      });

      assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
      assert.ok(res.body.error.includes('Tenant Access Required'));
    });

    test('2.2 Unauthenticated POST /api/tenant/ocr/fetch-consumer -> HTTP 401', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/ocr/fetch-consumer', {
        method: 'POST',
        body: { consumerNumber: '012345678901' }
      });

      assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
      assert.ok(res.body.error.includes('Tenant Access Required'));
    });

    test('2.3 Invalid token POST /api/tenant/ocr/scan-bill -> HTTP 401', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/ocr/scan-bill', {
        method: 'POST',
        headers: { authorization: 'Bearer invalid.token.signature' },
        body: {}
      });

      assert.equal(res.status, 401);
    });

    test('2.4 User self-deletion prevention in users.js (req.user.id guard) -> HTTP 400', async () => {
      const userRes = await httpRequest(baseUrl, `/api/tenant/users/${TEST_FIXTURES.tenantA.adminUser.id}`, {
        method: 'DELETE',
        token: tenantAToken
      });

      assert.equal(userRes.status, 400, `Expected 400, got ${userRes.status}: ${JSON.stringify(userRes.body)}`);
      assert.equal(userRes.body.error, 'Cannot delete your own user account');
    });
  });

  // =========================================================================
  // CHALLENGE 3: Section 15(3) CGST Act trade discount math across multi-rate lines
  // =========================================================================
  describe('Challenge 3: Section 15(3) CGST Act Trade Discount Multi-Rate Mathematical Compliance', () => {
    test('3.1 Multi-rate trade discount: tax must strictly compute on discounted taxable base', () => {
      // 4-item scenario with mixed GST rates:
      // Item 1: Solar Modules (100 @ 1000 = 100,000) @ 12% GST
      // Item 2: Solar Inverter (1 @ 50,000 = 50,000) @ 12% GST
      // Item 3: Structure & BOS (1 @ 30,000 = 30,000) @ 18% GST
      // Item 4: Installation Services (1 @ 20,000 = 20,000) @ 18% GST
      // Subtotal = 200,000. Trade discount = 25,000 (12.5%). Taxable = 175,000.
      const items = [
        { description: 'Modules', quantity: 100, unitPrice: 1000, taxRate: 12 },
        { description: 'Inverter', quantity: 1, unitPrice: 50000, taxRate: 12 },
        { description: 'Structure', quantity: 1, unitPrice: 30000, taxRate: 18 },
        { description: 'Installation', quantity: 1, unitPrice: 20000, taxRate: 18 }
      ];

      const pricing = solarCalc.calculateCommercialPricing({ items, overallDiscount: 25000 });

      // Invariants under Section 15(3) CGST Act:
      assert.equal(pricing.subtotal, 200000);
      assert.equal(pricing.overallDiscount, 25000);
      assert.equal(pricing.taxableAmount, 175000);

      // Verify each item's taxable base has been discounted:
      assert.equal(pricing.items[0].baseAmount, 87500);  // 100000 * 0.875
      assert.equal(pricing.items[1].baseAmount, 43750);  // 50000 * 0.875
      assert.equal(pricing.items[2].baseAmount, 26250);  // 30000 * 0.875
      assert.equal(pricing.items[3].baseAmount, 17500);  // 20000 * 0.875

      // Sum of line item bases MUST equal taxableAmount exactly:
      const totalBase = pricing.items.reduce((s, it) => s + it.baseAmount, 0);
      assert.equal(totalBase, 175000);

      // Taxes computed on discounted bases:
      // Item 0: 87500 * 0.12 = 10500
      // Item 1: 43750 * 0.12 = 5250
      // Item 2: 26250 * 0.18 = 4725
      // Item 3: 17500 * 0.18 = 3150
      assert.equal(pricing.items[0].taxAmount, 10500);
      assert.equal(pricing.items[1].taxAmount, 5250);
      assert.equal(pricing.items[2].taxAmount, 4725);
      assert.equal(pricing.items[3].taxAmount, 3150);

      const expectedTotalTax = 10500 + 5250 + 4725 + 3150; // 23625
      assert.equal(pricing.tax, expectedTotalTax);
      assert.equal(pricing.totalTax, expectedTotalTax);

      // Undiscounted tax would have been 100000*0.12 + 50000*0.12 + 30000*0.18 + 20000*0.18 = 27000.
      // Confirm we did NOT charge tax on the discount!
      assert.notEqual(pricing.tax, 27000, 'Tax must not be computed on undiscounted base!');

      // Grand total = taxable + tax
      assert.equal(pricing.grandTotal, 175000 + 23625);
      assert.equal(pricing.grandTotal, 198625);
    });

    test('3.2 100% discount boundary: taxable base and taxes must be zero', () => {
      const items = [
        { description: 'Gift Panel', quantity: 1, unitPrice: 10000, taxRate: 12 },
        { description: 'Gift Inverter', quantity: 1, unitPrice: 20000, taxRate: 18 }
      ];
      const pricing = solarCalc.calculateCommercialPricing({ items, overallDiscount: 30000 });

      assert.equal(pricing.subtotal, 30000);
      assert.equal(pricing.overallDiscount, 30000);
      assert.equal(pricing.taxableAmount, 0);
      assert.equal(pricing.tax, 0);
      assert.equal(pricing.grandTotal, 0);
      assert.equal(pricing.items[0].baseAmount, 0);
      assert.equal(pricing.items[0].taxAmount, 0);
      assert.equal(pricing.items[1].baseAmount, 0);
      assert.equal(pricing.items[1].taxAmount, 0);
    });

    test('3.3 Fractional prime amounts with multi-rate discount: zero discrepancy invariant', () => {
      const items = [
        { description: 'Part A', quantity: 3, unitPrice: 3333, taxRate: 5 },   // 9999
        { description: 'Part B', quantity: 7, unitPrice: 7777, taxRate: 12 },  // 54439
        { description: 'Part C', quantity: 1, unitPrice: 13333, taxRate: 18 }  // 13333
      ];
      // Subtotal = 77,771. Discount = 7,777.
      const pricing = solarCalc.calculateCommercialPricing({ items, overallDiscount: 7777 });

      assert.equal(pricing.subtotal, 77771);
      assert.equal(pricing.taxableAmount, 77771 - 7777); // 69994

      const sumBase = pricing.items.reduce((s, it) => s + it.baseAmount, 0);
      assert.equal(sumBase, pricing.taxableAmount, 'Line item base amounts must sum to exact taxableAmount');

      const sumTax = pricing.items.reduce((s, it) => s + it.taxAmount, 0);
      assert.equal(sumTax, pricing.tax, 'Line item tax amounts must sum to exact total tax');

      assert.equal(pricing.grandTotal, pricing.taxableAmount + pricing.tax);
    });
  });

  // =========================================================================
  // CHALLENGE 4: Milestone rounding drift across 1,000 totals (verify 0% drift)
  // =========================================================================
  describe('Challenge 4: Milestone Rounding Drift Stress-Test across 1,000 Totals', () => {
    test('4.1 1,000 sequential integer totals (1 to 1,000) have 0% rounding drift', () => {
      let driftCount = 0;
      for (let total = 1; total <= 1000; total++) {
        const milestones = solarCalc.generateMilestones(total);
        assert.equal(milestones.length, 4, `Must produce 4 milestones for total ${total}`);
        const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
        if (sum !== total) {
          driftCount++;
        }
      }
      assert.equal(driftCount, 0, `Detected ${driftCount} drift occurrences across 1,000 sequential totals!`);
    });

    test('4.2 1,000 randomized large and odd integer totals (up to ₹1,00,00,000) have 0% rounding drift', () => {
      let driftCount = 0;
      // Seeded-style pseudo-random sequence
      let seed = 123456789;
      function nextRand(max) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return (seed % max) + 1;
      }

      for (let i = 0; i < 1000; i++) {
        const total = nextRand(10000000); // 1 to 10,000,000
        const milestones = solarCalc.generateMilestones(total);
        const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
        if (sum !== total) {
          driftCount++;
        }
      }
      assert.equal(driftCount, 0, `Detected ${driftCount} drift occurrences across 1,000 random large totals!`);
    });

    test('4.3 1,000 totals with asymmetric custom milestone distributions have 0% rounding drift', () => {
      const customMilestones = [
        { percentage: 15, description: 'Token Advance' },
        { percentage: 35, description: 'Material Dispatch' },
        { percentage: 25, description: 'Installation Complete' },
        { percentage: 15, description: 'Net Meter Commissioned' },
        { percentage: 10, description: 'Handover & Subsidy Claim' }
      ];

      let driftCount = 0;
      for (let total = 999; total < 1999; total++) {
        const milestones = solarCalc.generateMilestones(total, customMilestones);
        assert.equal(milestones.length, 5);
        const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
        if (sum !== total) {
          driftCount++;
        }
      }
      assert.equal(driftCount, 0, `Detected ${driftCount} drift occurrences across 1,000 custom milestone totals!`);
    });
  });
});
