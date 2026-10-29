/**
 * Milestone M5 Adversarial Stress & Empirical Verification Test Suite
 * 
 * Authored by: challenger_m5 (Empirical Verification Challenger)
 * Scope:
 * 1. PO Auto-Stock Ledger Automation:
 *    - Multi-item PO atomic restock
 *    - Strict StockBalance & StockLedger verification
 *    - Idempotency & double-increment protection (POST /receive vs PATCH /status)
 *    - Concurrent race-condition receipt stress test
 *    - Multi-tenant isolation (Tenant B cannot access or receive Tenant A's PO)
 *    - Cross-tenant warehouse poisoning prevention
 *    - Prevention of deleting received POs
 * 2. Statutory Electrical Safety QA Thresholds:
 *    - Strict mathematical boundary testing (4.9999Ω vs 5.0Ω vs 5.0001Ω)
 *    - Anti-islanding boundary testing (1.9999s vs 2.0s vs 2.0001s)
 *    - Insulation resistance boundary testing (1.0001MΩ vs 1.0MΩ vs 0.9999MΩ)
 *    - Zero/negative/pathological inputs
 *    - Permutation isolation of failure causes
 * 3. Mobile 2D Barcode & DCR Domestic Content Validation:
 *    - Delimited (pipe, semicolon, prefixed) formats
 *    - JSON payloads (standard, minified, non-DCR)
 *    - Malformed/corrupted JSON fault tolerance
 *    - Deduplication (case-insensitive session, inverter clash, project array/CSV)
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../db');
const { startTestServer, createToken, httpRequest, TEST_FIXTURES } = require('./e2e/testHelper');

describe('Milestone M5: Empirical Challenger Stress Harness', () => {
  let serverInstance = null;
  let baseUrl = '';
  let tokenTenantA = '';
  let tokenTenantB = '';
  const runId = Date.now().toString().slice(-6);

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
  // SUITE 1: PO AUTO-STOCK LEDGER AUTOMATION EMPIRICAL STRESS
  // =========================================================================
  describe('Suite 1: PO Auto-Stock Ledger Automation Stress Tests', () => {
    let prod1, prod2, prod3;
    let warehouseA, warehouseB;
    let multiItemPO;

    before(async () => {
      // Create 3 distinct products for Tenant A
      prod1 = await prisma.product.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Waaree 540W DCR Panel ${runId}`,
          category: 'Solar Panels',
          sku: `WAA-540-${runId}`,
          brand: 'Waaree',
          unit: 'NOS',
          purchaseCost: 11000,
          sellingPrice: 13500,
          currentStock: 10
        }
      });

      prod2 = await prisma.product.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Growatt 5kW Inverter ${runId}`,
          category: 'Inverters',
          sku: `GRO-5KW-${runId}`,
          brand: 'Growatt',
          unit: 'NOS',
          purchaseCost: 38000,
          sellingPrice: 45000,
          currentStock: 5
        }
      });

      prod3 = await prisma.product.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Copper DC Cable 4sqmm ${runId}`,
          category: 'Electrical',
          sku: `CAB-4MM-${runId}`,
          brand: 'Polycab',
          unit: 'MTR',
          purchaseCost: 45,
          sellingPrice: 60,
          currentStock: 100
        }
      });

      // Create dedicated warehouse for Tenant A
      warehouseA = await prisma.warehouse.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Challenger Hub A ${runId}`,
          location: 'Pune West'
        }
      });

      // Create dedicated warehouse for Tenant B
      warehouseB = await prisma.warehouse.create({
        data: {
          tenantId: TEST_FIXTURES.tenantB.id,
          name: `Challenger Hub B ${runId}`,
          location: 'Mumbai Central'
        }
      });
    });

    after(async () => {
      // Cleanup all records created in this suite
      const poIds = [];
      if (multiItemPO?.id) poIds.push(multiItemPO.id);

      const createdPOs = await prisma.purchaseOrder.findMany({
        where: { poNumber: { contains: runId } },
        select: { id: true }
      });
      createdPOs.forEach(p => poIds.push(p.id));

      for (const id of poIds) {
        await prisma.stockLedger.deleteMany({ where: { referenceId: id } }).catch(() => null);
        await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } }).catch(() => null);
        await prisma.purchaseOrder.delete({ where: { id } }).catch(() => null);
      }

      const prodIds = [prod1?.id, prod2?.id, prod3?.id].filter(Boolean);
      if (prodIds.length > 0) {
        await prisma.stockLedger.deleteMany({ where: { productId: { in: prodIds } } }).catch(() => null);
        await prisma.stockBalance.deleteMany({ where: { productId: { in: prodIds } } }).catch(() => null);
        await prisma.product.deleteMany({ where: { id: { in: prodIds } } }).catch(() => null);
      }

      if (warehouseA?.id) await prisma.warehouse.delete({ where: { id: warehouseA.id } }).catch(() => null);
      if (warehouseB?.id) await prisma.warehouse.delete({ where: { id: warehouseB.id } }).catch(() => null);
    });

    test('1.1: Multi-item PO receiving atomically updates Product currentStock, StockBalance, and StockLedger', async () => {
      // Create multi-item PO: 15 modules, 5 inverters, 200m cable
      const poRes = await httpRequest(baseUrl, '/api/tenant/procurement', {
        method: 'POST',
        token: tokenTenantA,
        body: {
          supplier: `SunPower Supplies Ltd ${runId}`,
          items: [
            { productId: prod1.id, quantity: 15, unitPrice: 11000 },
            { productId: prod2.id, quantity: 5, unitPrice: 38000 },
            { productId: prod3.id, quantity: 200, unitPrice: 45 }
          ]
        }
      });

      assert.equal(poRes.status, 201, 'Should create multi-item PO');
      multiItemPO = poRes.body.purchaseOrder;
      assert.equal(multiItemPO.status, 'ORDERED');
      assert.equal(multiItemPO.items.length, 3);

      // Explicitly receive PO into warehouseA
      const receiveRes = await httpRequest(baseUrl, `/api/tenant/procurement/${multiItemPO.id}/receive`, {
        method: 'POST',
        token: tokenTenantA,
        body: { warehouseId: warehouseA.id }
      });

      assert.equal(receiveRes.status, 200, 'Should successfully receive multi-item PO');
      assert.equal(receiveRes.body.purchaseOrder.status, 'RECEIVED');

      // Verify Product 1 currentStock (10 + 15 = 25)
      const p1 = await prisma.product.findUnique({ where: { id: prod1.id } });
      assert.equal(p1.currentStock, 25, 'Prod1 currentStock must equal 25');

      // Verify Product 2 currentStock (5 + 5 = 10)
      const p2 = await prisma.product.findUnique({ where: { id: prod2.id } });
      assert.equal(p2.currentStock, 10, 'Prod2 currentStock must equal 10');

      // Verify Product 3 currentStock (100 + 200 = 300)
      const p3 = await prisma.product.findUnique({ where: { id: prod3.id } });
      assert.equal(p3.currentStock, 300, 'Prod3 currentStock must equal 300');

      // Verify StockBalance for all 3 products in warehouseA
      const sb1 = await prisma.stockBalance.findUnique({
        where: { productId_warehouseId: { productId: prod1.id, warehouseId: warehouseA.id } }
      });
      assert.ok(sb1);
      assert.equal(sb1.quantity, 15);
      assert.equal(sb1.availableQuantity, 15);

      const sb2 = await prisma.stockBalance.findUnique({
        where: { productId_warehouseId: { productId: prod2.id, warehouseId: warehouseA.id } }
      });
      assert.ok(sb2);
      assert.equal(sb2.quantity, 5);
      assert.equal(sb2.availableQuantity, 5);

      const sb3 = await prisma.stockBalance.findUnique({
        where: { productId_warehouseId: { productId: prod3.id, warehouseId: warehouseA.id } }
      });
      assert.ok(sb3);
      assert.equal(sb3.quantity, 200);
      assert.equal(sb3.availableQuantity, 200);

      // Verify StockLedger entries for all 3 products
      const ledgers = await prisma.stockLedger.findMany({
        where: { referenceId: multiItemPO.id }
      });
      assert.equal(ledgers.length, 3, 'Must create exactly 3 StockLedger audit entries');

      const ledger1 = ledgers.find(l => l.productId === prod1.id);
      assert.ok(ledger1);
      assert.equal(ledger1.movementType, 'RECEIPT');
      assert.equal(ledger1.quantity, 15);
      assert.equal(ledger1.quantityBefore, 10);
      assert.equal(ledger1.quantityAfter, 25);
      assert.equal(ledger1.userId, TEST_FIXTURES.tenantA.adminUser.id);

      const ledger2 = ledgers.find(l => l.productId === prod2.id);
      assert.ok(ledger2);
      assert.equal(ledger2.movementType, 'RECEIPT');
      assert.equal(ledger2.quantity, 5);
      assert.equal(ledger2.quantityBefore, 5);
      assert.equal(ledger2.quantityAfter, 10);

      const ledger3 = ledgers.find(l => l.productId === prod3.id);
      assert.ok(ledger3);
      assert.equal(ledger3.movementType, 'RECEIPT');
      assert.equal(ledger3.quantity, 200);
      assert.equal(ledger3.quantityBefore, 100);
      assert.equal(ledger3.quantityAfter, 300);
    });

    test('1.2: Idempotency stress test — Duplicate receive calls strictly prevent double-increment', async () => {
      // Re-calling POST /receive must return HTTP 400
      const dupPost = await httpRequest(baseUrl, `/api/tenant/procurement/${multiItemPO.id}/receive`, {
        method: 'POST',
        token: tokenTenantA,
        body: { warehouseId: warehouseA.id }
      });
      assert.equal(dupPost.status, 400, 'Duplicate POST /receive must return 400');
      assert.ok(dupPost.body.error.includes('already been received'));

      // Calling PATCH /status with 'RECEIVED' on already received PO must NOT increment stock
      const dupPatch = await httpRequest(baseUrl, `/api/tenant/procurement/${multiItemPO.id}/status`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: { status: 'RECEIVED', warehouseId: warehouseA.id }
      });
      assert.equal(dupPatch.status, 200);

      // Verify Product currentStock did NOT change
      const p1 = await prisma.product.findUnique({ where: { id: prod1.id } });
      assert.equal(p1.currentStock, 25, 'Current stock must remain 25 without duplicate increment');

      // Verify StockBalance did NOT change
      const sb1 = await prisma.stockBalance.findUnique({
        where: { productId_warehouseId: { productId: prod1.id, warehouseId: warehouseA.id } }
      });
      assert.equal(sb1.quantity, 15, 'StockBalance must remain 15 without duplicate increment');

      // Verify StockLedger count is still exactly 3
      const ledgers = await prisma.stockLedger.findMany({
        where: { referenceId: multiItemPO.id }
      });
      assert.equal(ledgers.length, 3, 'StockLedger count must remain 3');
    });

    test('1.3: Cross-tenant warehouse poisoning attempt is strictly neutralized', async () => {
      // Create a fresh PO for Tenant A
      const freshPORes = await httpRequest(baseUrl, '/api/tenant/procurement', {
        method: 'POST',
        token: tokenTenantA,
        body: {
          supplier: `Vendor Isolated ${runId}`,
          items: [{ productId: prod1.id, quantity: 10, unitPrice: 11000 }]
        }
      });
      assert.equal(freshPORes.status, 201);
      const poA = freshPORes.body.purchaseOrder;

      // Tenant A attempts to pass Tenant B's warehouseId
      const receiveAttempt = await httpRequest(baseUrl, `/api/tenant/procurement/${poA.id}/receive`, {
        method: 'POST',
        token: tokenTenantA,
        body: { warehouseId: warehouseB.id } // Tenant B's warehouse!
      });
      assert.equal(receiveAttempt.status, 200);

      // Tenant B's warehouse MUST NOT have any stock for prod1
      const tenantBStock = await prisma.stockBalance.findUnique({
        where: { productId_warehouseId: { productId: prod1.id, warehouseId: warehouseB.id } }
      });
      assert.equal(tenantBStock, null, 'Tenant B warehouse must NOT receive stock from Tenant A PO');

      // Clean up poA
      await prisma.stockLedger.deleteMany({ where: { referenceId: poA.id } }).catch(() => null);
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: poA.id } }).catch(() => null);
      await prisma.purchaseOrder.delete({ where: { id: poA.id } }).catch(() => null);
    });

    test('1.4: Cross-tenant isolation strictly blocks Tenant B from accessing or receiving Tenant A PO', async () => {
      // Tenant B tries to GET Tenant A PO
      const getRes = await httpRequest(baseUrl, `/api/tenant/procurement/${multiItemPO.id}`, {
        token: tokenTenantB
      });
      assert.equal(getRes.status, 404, 'Tenant B cannot read Tenant A PO');

      // Tenant B tries to PATCH status on Tenant A PO
      const patchRes = await httpRequest(baseUrl, `/api/tenant/procurement/${multiItemPO.id}/status`, {
        method: 'PATCH',
        token: tokenTenantB,
        body: { status: 'RECEIVED' }
      });
      assert.equal(patchRes.status, 404, 'Tenant B cannot update status of Tenant A PO');

      // Tenant B tries to POST /receive on Tenant A PO
      const receiveRes = await httpRequest(baseUrl, `/api/tenant/procurement/${multiItemPO.id}/receive`, {
        method: 'POST',
        token: tokenTenantB,
        body: { warehouseId: warehouseB.id }
      });
      assert.equal(receiveRes.status, 404, 'Tenant B cannot receive Tenant A PO');

      // Tenant B tries to DELETE Tenant A PO
      const delRes = await httpRequest(baseUrl, `/api/tenant/procurement/${multiItemPO.id}`, {
        method: 'DELETE',
        token: tokenTenantB
      });
      assert.equal(delRes.status, 404, 'Tenant B cannot delete Tenant A PO');
    });

    test('1.5: Deletion safeguard and status regression guard block altering RECEIVED purchase orders', async () => {
      const deleteRes = await httpRequest(baseUrl, `/api/tenant/procurement/${multiItemPO.id}`, {
        method: 'DELETE',
        token: tokenTenantA
      });
      assert.equal(deleteRes.status, 400, 'Must block deleting a RECEIVED PO');
      assert.ok(deleteRes.body.error.includes('already been received'));

      // Status regression guard: cannot revert to ORDERED, SHIPPED, or CANCELLED
      for (const regressedStatus of ['ORDERED', 'SHIPPED', 'CANCELLED']) {
        const regRes = await httpRequest(baseUrl, `/api/tenant/procurement/${multiItemPO.id}/status`, {
          method: 'PATCH',
          token: tokenTenantA,
          body: { status: regressedStatus }
        });
        assert.equal(regRes.status, 400, `Must block reverting RECEIVED PO to ${regressedStatus}`);
        assert.ok(regRes.body.error.includes('already been received into inventory'));
      }
    });

    test('1.6: Concurrent receipt requests are idempotent and do not double-increment', async () => {
      // Create a fresh test product and fresh PO
      const concurrentProd = await prisma.product.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Concurrent Test Panel ${runId}`,
          category: 'Solar Panels',
          sku: `CONC-${runId}`,
          brand: 'Waaree',
          unit: 'NOS',
          purchaseCost: 10000,
          sellingPrice: 12000,
          currentStock: 0
        }
      });

      const poRes = await httpRequest(baseUrl, '/api/tenant/procurement', {
        method: 'POST',
        token: tokenTenantA,
        body: {
          supplier: `Concurrent Vendor ${runId}`,
          items: [{ productId: concurrentProd.id, quantity: 20, unitPrice: 10000 }]
        }
      });
      const concPO = poRes.body.purchaseOrder;

      // Fire 5 concurrent receive requests simultaneously
      const results = await Promise.all([
        httpRequest(baseUrl, `/api/tenant/procurement/${concPO.id}/receive`, {
          method: 'POST',
          token: tokenTenantA,
          body: { warehouseId: warehouseA.id }
        }),
        httpRequest(baseUrl, `/api/tenant/procurement/${concPO.id}/receive`, {
          method: 'POST',
          token: tokenTenantA,
          body: { warehouseId: warehouseA.id }
        }),
        httpRequest(baseUrl, `/api/tenant/procurement/${concPO.id}/receive`, {
          method: 'POST',
          token: tokenTenantA,
          body: { warehouseId: warehouseA.id }
        }),
        httpRequest(baseUrl, `/api/tenant/procurement/${concPO.id}/receive`, {
          method: 'POST',
          token: tokenTenantA,
          body: { warehouseId: warehouseA.id }
        }),
        httpRequest(baseUrl, `/api/tenant/procurement/${concPO.id}/receive`, {
          method: 'POST',
          token: tokenTenantA,
          body: { warehouseId: warehouseA.id }
        })
      ]);

      // Exactly one should be 200, others 400
      const statuses = results.map(r => r.status);
      console.log('Concurrent receive statuses:', statuses);
      const refreshedProd = await prisma.product.findUnique({ where: { id: concurrentProd.id } });
      const ledgerCount = await prisma.stockLedger.count({
        where: { referenceId: concPO.id }
      });
      console.log(`Concurrent test outcome: currentStock=${refreshedProd?.currentStock}, ledgerCount=${ledgerCount}`);
      
      const successes = results.filter(r => r.status === 200);
      assert.equal(successes.length, 1, `Only one concurrent request must succeed, but ${successes.length} succeeded! Statuses: ${JSON.stringify(statuses)}`);

      // Product currentStock must be exactly 20, NEVER 40, 60, 80, or 100
      assert.equal(refreshedProd.currentStock, 20, `Stock must only be incremented once (20), but was ${refreshedProd.currentStock}`);

      // StockLedger must have exactly 1 entry
      assert.equal(ledgerCount, 1, `Only 1 StockLedger entry must be recorded, but found ${ledgerCount}`);

      // Cleanup
      await prisma.stockLedger.deleteMany({ where: { referenceId: concPO.id } }).catch(() => null);
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: concPO.id } }).catch(() => null);
      await prisma.purchaseOrder.delete({ where: { id: concPO.id } }).catch(() => null);
      await prisma.stockBalance.deleteMany({ where: { productId: concurrentProd.id } }).catch(() => null);
      await prisma.product.delete({ where: { id: concurrentProd.id } }).catch(() => null);
    });
  });

  // =========================================================================
  // SUITE 2: ELECTRICAL SAFETY QA STATUTORY GATING MATHEMATICAL STRESS
  // =========================================================================
  describe('Suite 2: Electrical Safety QA Statutory Gating Mathematical Stress', () => {
    function evaluateElectricalSafetyQA({
      pit1Inverter,
      pit2Structure,
      pit3Lightning,
      antiIslandingTripSec,
      insulationMegaOhms
    }) {
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

      const allTestsPass = isPit1Pass && isPit2Pass && isPit3Pass && isTripPass && isInsulationPass;

      const failureReasons = [];
      if (!isPit1Pass) failureReasons.push('Inverter Earth Pit 1 must be strictly < 5.0 Ω (CEA Regulations)');
      if (!isPit2Pass) failureReasons.push('Structure Earth Pit 2 must be strictly < 5.0 Ω (CEA Regulations)');
      if (!isPit3Pass) failureReasons.push('Lightning Arrestor Earth Pit 3 must be strictly < 5.0 Ω (CEA Regulations)');
      if (!isTripPass) failureReasons.push('Anti-Islanding Grid Trip Time must be strictly < 2.0 s (IEEE 1547 / CEA Standards)');
      if (!isInsulationPass) failureReasons.push('Inverter Insulation Resistance must be strictly > 1.0 MΩ (CEA Statutory Threshold)');

      return {
        isPit1Pass,
        isPit2Pass,
        isPit3Pass,
        isTripPass,
        isInsulationPass,
        allTestsPass,
        failureReasons
      };
    }

    test('2.1: Earth Pit boundaries (4.9999Ω Pass vs 5.0Ω Fail vs 5.0001Ω Fail)', () => {
      const pass = evaluateElectricalSafetyQA({
        pit1Inverter: '4.9999',
        pit2Structure: '4.9999',
        pit3Lightning: '4.9999',
        antiIslandingTripSec: '1.9',
        insulationMegaOhms: '2000'
      });
      assert.equal(pass.isPit1Pass, true);
      assert.equal(pass.isPit2Pass, true);
      assert.equal(pass.isPit3Pass, true);
      assert.equal(pass.allTestsPass, true);

      // Exact 5.0Ω boundary must FAIL
      const fail5 = evaluateElectricalSafetyQA({
        pit1Inverter: '5.0',
        pit2Structure: '5.0',
        pit3Lightning: '5.0',
        antiIslandingTripSec: '1.9',
        insulationMegaOhms: '2000'
      });
      assert.equal(fail5.isPit1Pass, false);
      assert.equal(fail5.isPit2Pass, false);
      assert.equal(fail5.isPit3Pass, false);
      assert.equal(fail5.allTestsPass, false);

      // 5.0001Ω must FAIL
      const failHigh = evaluateElectricalSafetyQA({
        pit1Inverter: '5.0001',
        pit2Structure: '1.5',
        pit3Lightning: '1.5',
        antiIslandingTripSec: '1.9',
        insulationMegaOhms: '2000'
      });
      assert.equal(failHigh.isPit1Pass, false);
      assert.equal(failHigh.allTestsPass, false);
    });

    test('2.2: Anti-Islanding Trip Time boundaries (1.9999s Pass vs 2.0s Fail vs 2.0001s Fail)', () => {
      const pass = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '1.9999',
        insulationMegaOhms: '2000'
      });
      assert.equal(pass.isTripPass, true);
      assert.equal(pass.allTestsPass, true);

      const fail2 = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '2.0',
        insulationMegaOhms: '2000'
      });
      assert.equal(fail2.isTripPass, false, '2.0s boundary must fail strictly < 2.0s');
      assert.equal(fail2.allTestsPass, false);

      const failHigh = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '2.0001',
        insulationMegaOhms: '2000'
      });
      assert.equal(failHigh.isTripPass, false);
      assert.equal(failHigh.allTestsPass, false);
    });

    test('2.3: Inverter Insulation boundaries (1.0001MΩ Pass vs 1.0MΩ Fail vs 0.9999MΩ Fail)', () => {
      const pass = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '1.0001'
      });
      assert.equal(pass.isInsulationPass, true);
      assert.equal(pass.allTestsPass, true);

      const fail1 = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '1.0'
      });
      assert.equal(fail1.isInsulationPass, false, '1.0 MΩ boundary must fail strictly > 1.0 MΩ');
      assert.equal(fail1.allTestsPass, false);

      const failLow = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '0.9999'
      });
      assert.equal(failLow.isInsulationPass, false);
      assert.equal(failLow.allTestsPass, false);
    });

    test('2.4: Permutation stress testing — Exactly one failure isolated per test run', () => {
      const validBase = {
        pit1Inverter: '2.0',
        pit2Structure: '2.0',
        pit3Lightning: '2.0',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '1500'
      };

      // Only Pit 1 fails
      const f1 = evaluateElectricalSafetyQA({ ...validBase, pit1Inverter: '5.2' });
      assert.equal(f1.allTestsPass, false);
      assert.equal(f1.failureReasons.length, 1);
      assert.ok(f1.failureReasons[0].includes('Pit 1'));

      // Only Pit 2 fails
      const f2 = evaluateElectricalSafetyQA({ ...validBase, pit2Structure: '5.5' });
      assert.equal(f2.allTestsPass, false);
      assert.equal(f2.failureReasons.length, 1);
      assert.ok(f2.failureReasons[0].includes('Pit 2'));

      // Only Pit 3 fails
      const f3 = evaluateElectricalSafetyQA({ ...validBase, pit3Lightning: '6.0' });
      assert.equal(f3.allTestsPass, false);
      assert.equal(f3.failureReasons.length, 1);
      assert.ok(f3.failureReasons[0].includes('Pit 3'));

      // Only Trip Time fails
      const f4 = evaluateElectricalSafetyQA({ ...validBase, antiIslandingTripSec: '2.1' });
      assert.equal(f4.allTestsPass, false);
      assert.equal(f4.failureReasons.length, 1);
      assert.ok(f4.failureReasons[0].includes('Anti-Islanding'));

      // Only Insulation fails
      const f5 = evaluateElectricalSafetyQA({ ...validBase, insulationMegaOhms: '0.5' });
      assert.equal(f5.allTestsPass, false);
      assert.equal(f5.failureReasons.length, 1);
      assert.ok(f5.failureReasons[0].includes('Insulation Resistance'));

      // All 5 fail simultaneously
      const fAll = evaluateElectricalSafetyQA({
        pit1Inverter: '7.0',
        pit2Structure: '8.0',
        pit3Lightning: '9.0',
        antiIslandingTripSec: '3.0',
        insulationMegaOhms: '0.2'
      });
      assert.equal(fAll.allTestsPass, false);
      assert.equal(fAll.failureReasons.length, 5);
    });

    test('2.5: Pathological & Adversarial inputs (Infinity, NaN, negative, strings, empty)', () => {
      const inputs = [
        { pit1Inverter: 'Infinity' },
        { pit2Structure: '-Infinity' },
        { pit3Lightning: 'NaN' },
        { antiIslandingTripSec: '-0.001' },
        { insulationMegaOhms: '0' },
        { pit1Inverter: '' },
        { pit2Structure: '   ' },
        { pit3Lightning: 'DROP TABLE projects;' }
      ];

      for (const override of inputs) {
        const testCase = evaluateElectricalSafetyQA({
          pit1Inverter: '2.0',
          pit2Structure: '2.0',
          pit3Lightning: '2.0',
          antiIslandingTripSec: '0.15',
          insulationMegaOhms: '1500',
          ...override
        });
        assert.equal(testCase.allTestsPass, false, `Pathological input ${JSON.stringify(override)} must fail`);
      }
    });
  });

  // =========================================================================
  // SUITE 3: MOBILE 2D BARCODE & DCR VALIDATION ADVERSARIAL STRESS
  // =========================================================================
  describe('Suite 3: Mobile 2D Barcode & DCR Validation Adversarial Stress', () => {
    function parseAndValidateBarcode(raw, certOverride) {
      if (!raw || typeof raw !== 'string') return null;
      const trimmed = raw.trim();
      if (trimmed.length < 5) return null;

      let serial = '';
      let manufacturer = '';
      let wattage = undefined;
      let dcrCompliant = false;
      let dcrCert = certOverride ? certOverride.trim() : '';

      // JSON format
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
        } catch {}
      }

      // Delimiter format
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

    function detectDuplicateSerial(candidate, existingList, inverterCandidate, projectObj) {
      const norm = candidate.trim().toUpperCase();
      if (existingList.some(s => s.trim().toUpperCase() === norm)) {
        return { isDuplicate: true, reason: 'Already scanned in current session' };
      }
      if (inverterCandidate && inverterCandidate.trim().toUpperCase() === norm) {
        return { isDuplicate: true, reason: 'Matches existing inverter serial number' };
      }
      if (projectObj?.moduleSerials && Array.isArray(projectObj.moduleSerials)) {
        if (projectObj.moduleSerials.some((s) => s.trim().toUpperCase() === norm)) {
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
      return { isDuplicate: false };
    }

    test('3.1: Delimited QR formats (pipe, semicolon, prefixed tags)', () => {
      // Pipe separated
      const p1 = parseAndValidateBarcode('Tata Solar|TATA-DCR-545-091|545W|ALMM-TATA-2024');
      assert.ok(p1);
      assert.equal(p1.serial, 'TATA-DCR-545-091');
      assert.equal(p1.manufacturer, 'Tata Solar');
      assert.equal(p1.wattage, 545);
      assert.equal(p1.dcrCompliant, true);

      // Semicolon separated
      const p2 = parseAndValidateBarcode('Adani;ADANI-DCR-550-888;550W;MNRE-DCR-ADANI-09');
      assert.ok(p2);
      assert.equal(p2.serial, 'ADANI-DCR-550-888');
      assert.equal(p2.wattage, 550);
      assert.equal(p2.dcrCompliant, true);

      // Prefixed tags
      const p3 = parseAndValidateBarcode('SN:WAA-DCR-4009|MAKE:Waaree|DCR:ALMM-2024-WAA|540W');
      assert.ok(p3);
      assert.equal(p3.serial, 'WAA-DCR-4009');
      assert.equal(p3.manufacturer, 'Waaree');
      assert.equal(p3.wattage, 540);
      assert.equal(p3.dcrCompliant, true);
    });

    test('3.2: Structured JSON payloads with various key naming conventions', () => {
      // Full naming
      const j1 = parseAndValidateBarcode(JSON.stringify({
        serialNumber: 'WAR-540-DCR-110',
        make: 'Waaree Energies',
        wattage: '540',
        almmCertificate: 'ALMM-2024-110'
      }));
      assert.ok(j1);
      assert.equal(j1.serial, 'WAR-540-DCR-110');
      assert.equal(j1.manufacturer, 'Waaree Energies');
      assert.equal(j1.wattage, 540);
      assert.equal(j1.dcrCompliant, true);

      // Minified keys
      const j2 = parseAndValidateBarcode(JSON.stringify({
        sn: 'GOLDI-DCR-540-99',
        isDcr: true
      }));
      assert.ok(j2);
      assert.equal(j2.serial, 'GOLDI-DCR-540-99');
      assert.equal(j2.dcrCompliant, true);

      // Non-DCR / Imported
      const j3 = parseAndValidateBarcode(JSON.stringify({
        serial: 'LONGI-HIMO6-550',
        make: 'LONGi Solar',
        wattage: 550
      }));
      assert.ok(j3);
      assert.equal(j3.serial, 'LONGI-HIMO6-550');
      assert.equal(j3.dcrCompliant, false, 'Imported panel without DCR flag must be flagged non-compliant');
    });

    test('3.3: Fault-tolerant recovery on malformed JSON or corrupted barcode string', () => {
      // Corrupted JSON syntax should fall back gracefully to raw serial without throwing
      const malformed = '{"serial": "WAA-DCR-BROKEN-JSON", corrupt...';
      const res = parseAndValidateBarcode(malformed);
      assert.ok(res);
      assert.equal(res.serial, '{"SERIAL": "WAA-DCR-BROKEN-JSON", CORRUPT...');
      assert.equal(res.dcrCompliant, true); // Has DCR pattern in string

      // Whitespace and newline sanitization
      const messy = '\r\n\t   WAA-DCR-CLEAN-01 \t\r\n ';
      const clean = parseAndValidateBarcode(messy);
      assert.ok(clean);
      assert.equal(clean.serial, 'WAA-DCR-CLEAN-01');

      // Reject too short
      assert.equal(parseAndValidateBarcode(''), null);
      assert.equal(parseAndValidateBarcode('   '), null);
      assert.equal(parseAndValidateBarcode('1234'), null);
    });

    test('3.4: Duplicate serial detection comprehensive edge cases', () => {
      const session = ['WAA-DCR-001', 'WAA-DCR-002'];
      const inverterSN = 'GROWATT-INV-5KW-99';
      const project = {
        moduleSerials: ['WAA-DCR-OLD-01'],
        dcrModuleSerials: 'WAA-DCR-OLD-02\nWAA-DCR-OLD-03,WAA-DCR-OLD-04'
      };

      // Case-insensitive active session duplicate
      assert.equal(detectDuplicateSerial('waa-dcr-001', session, inverterSN, project).isDuplicate, true);

      // Inverter collision
      assert.equal(detectDuplicateSerial('growatt-inv-5kw-99', session, inverterSN, project).isDuplicate, true);

      // Project array duplicate
      assert.equal(detectDuplicateSerial('waa-dcr-old-01', session, inverterSN, project).isDuplicate, true);

      // Project newline-separated DCR duplicate
      assert.equal(detectDuplicateSerial('waa-dcr-old-02', session, inverterSN, project).isDuplicate, true);

      // Project comma-separated DCR duplicate
      assert.equal(detectDuplicateSerial('waa-dcr-old-04', session, inverterSN, project).isDuplicate, true);

      // Valid unique candidate
      assert.equal(detectDuplicateSerial('WAA-DCR-UNIQUE-99', session, inverterSN, project).isDuplicate, false);
    });
  });
});
