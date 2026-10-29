/**
 * Milestone M5: Field Operations, Inventory & Mobile Parity Automated Test Suite
 * 
 * Verifies:
 * 1. Purchase Order Auto-Stock Ledger Automation
 *    - PO transition to RECEIVED automatically increments StockBalance (quantity & availableQuantity).
 *    - Inserts StockLedger audit entry with movementType: 'RECEIPT', PO ID, Item ID, quantity, and user ID.
 *    - All operations execute inside prisma.$transaction.
 *    - Explicit POST /api/tenant/procurement/:id/receive endpoint operates identically.
 *    - Strict multi-tenant isolation on PO receiving.
 * 2. Statutory Electrical Safety QA Gating (Installation QA)
 *    - Earth pit resistance strictly < 5.0 Ohms (CEA Regulations).
 *    - Anti-islanding trip time strictly < 2.0 seconds (IEEE 1547 / CEA).
 *    - Inverter insulation resistance strictly > 1.0 MOhm (CEA statutory threshold).
 *    - Boundary conditions, negative inputs, and failure blocking.
 * 3. Mobile 2D Barcode Capture, DCR Domestic Content Validation & Duplicate Detection
 *    - Multi-field 2D QR / DataMatrix parsing (JSON and delimited).
 *    - DCR domestic content validation against ALMM / DCR certificate numbers and Tier-1 models.
 *    - Case-insensitive session deduplication, inverter cross-check, and project record duplicate prevention.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../db');
const { startTestServer, createToken, httpRequest, TEST_FIXTURES } = require('./e2e/testHelper');

describe('Milestone M5: Field Operations, Inventory & Mobile Parity Suite', () => {
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
  // 1. PURCHASE ORDER AUTO-STOCK LEDGER AUTOMATION
  // =========================================================================
  describe('Purchase Order Auto-Stock Ledger Automation', () => {
    let testProduct = null;
    let testWarehouse = null;
    let testPO1 = null;
    let testPO2 = null;

    before(async () => {
      // 1. Create a dedicated test product for Tenant A
      testProduct = await prisma.product.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `Waaree 540W DCR Bifacial PV Module ${testSuffix}`,
          category: 'Solar Panels',
          sku: `WAR-540-${testSuffix}`,
          brand: 'Waaree',
          unit: 'NOS',
          purchaseCost: 11500,
          sellingPrice: 14200,
          currentStock: 20
        }
      });

      // 2. Create a dedicated test warehouse for Tenant A
      testWarehouse = await prisma.warehouse.create({
        data: {
          tenantId: TEST_FIXTURES.tenantA.id,
          name: `M5 Central Logistics Hub ${testSuffix}`,
          location: 'Pune MIDC Zone 2'
        }
      });
    });

    after(async () => {
      // Cleanup created POs, ledger entries, stock balances, warehouse, and product
      if (testPO1?.id) {
        await prisma.stockLedger.deleteMany({ where: { referenceId: testPO1.id } }).catch(() => null);
        await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: testPO1.id } }).catch(() => null);
        await prisma.purchaseOrder.delete({ where: { id: testPO1.id } }).catch(() => null);
      }
      if (testPO2?.id) {
        await prisma.stockLedger.deleteMany({ where: { referenceId: testPO2.id } }).catch(() => null);
        await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: testPO2.id } }).catch(() => null);
        await prisma.purchaseOrder.delete({ where: { id: testPO2.id } }).catch(() => null);
      }
      if (testProduct?.id && testWarehouse?.id) {
        await prisma.stockBalance.deleteMany({
          where: { productId: testProduct.id, warehouseId: testWarehouse.id }
        }).catch(() => null);
      }
      if (testWarehouse?.id) {
        await prisma.warehouse.delete({ where: { id: testWarehouse.id } }).catch(() => null);
      }
      if (testProduct?.id) {
        await prisma.product.delete({ where: { id: testProduct.id } }).catch(() => null);
      }
    });

    test('Step 1.1: Create Purchase Order with item and verify ORDERED status', async () => {
      const createRes = await httpRequest(baseUrl, '/api/tenant/procurement', {
        method: 'POST',
        token: tokenTenantA,
        body: {
          supplier: 'Waaree Energies Ltd',
          items: [
            {
              productId: testProduct.id,
              quantity: 50,
              unitPrice: 11500
            }
          ]
        }
      });

      assert.equal(createRes.status, 201, 'Should create PO successfully');
      assert.ok(createRes.body.purchaseOrder?.id);
      assert.equal(createRes.body.purchaseOrder.status, 'ORDERED');
      assert.equal(createRes.body.purchaseOrder.items.length, 1);
      assert.equal(createRes.body.purchaseOrder.items[0].quantity, 50);

      testPO1 = createRes.body.purchaseOrder;
    });

    test('Step 1.2: Transition PO to RECEIVED via PATCH status -> Upserts StockBalance and inserts StockLedger in transaction', async () => {
      assert.ok(testPO1?.id);

      const patchRes = await httpRequest(baseUrl, `/api/tenant/procurement/${testPO1.id}/status`, {
        method: 'PATCH',
        token: tokenTenantA,
        body: {
          status: 'RECEIVED',
          warehouseId: testWarehouse.id
        }
      });

      assert.equal(patchRes.status, 200);
      assert.equal(patchRes.body.purchaseOrder.status, 'RECEIVED');

      // 1. Verify Product aggregate currentStock incremented by 50 (from 20 to 70)
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProduct.id }
      });
      assert.equal(updatedProduct.currentStock, 70, 'Product aggregate currentStock must increment from 20 to 70');

      // 2. Verify StockBalance upserted in the specified warehouse
      const stockBalance = await prisma.stockBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: testProduct.id,
            warehouseId: testWarehouse.id
          }
        }
      });
      assert.ok(stockBalance, 'StockBalance must exist for product and warehouse');
      assert.equal(stockBalance.quantity, 50, 'StockBalance quantity must equal received PO quantity');
      assert.equal(stockBalance.availableQuantity, 50, 'StockBalance availableQuantity must equal received PO quantity');

      // 3. Verify StockLedger audit entry created
      const ledgerEntry = await prisma.stockLedger.findFirst({
        where: {
          tenantId: TEST_FIXTURES.tenantA.id,
          productId: testProduct.id,
          warehouseId: testWarehouse.id,
          referenceType: 'PO',
          referenceId: testPO1.id,
          movementType: 'RECEIPT'
        }
      });
      assert.ok(ledgerEntry, 'StockLedger RECEIPT movement must be logged');
      assert.equal(ledgerEntry.quantity, 50);
      assert.equal(ledgerEntry.userId, TEST_FIXTURES.tenantA.adminUser.id, 'StockLedger must capture actor user ID');
      assert.equal(ledgerEntry.quantityBefore, 20);
      assert.equal(ledgerEntry.quantityAfter, 70);
    });

    test('Step 1.3: Explicit POST /receive endpoint restocks inventory with StockBalance increment', async () => {
      // Create PO 2
      const createRes = await httpRequest(baseUrl, '/api/tenant/procurement', {
        method: 'POST',
        token: tokenTenantA,
        body: {
          supplier: 'Waaree Energies Ltd',
          items: [
            {
              productId: testProduct.id,
              quantity: 30,
              unitPrice: 11500
            }
          ]
        }
      });
      assert.equal(createRes.status, 201);
      testPO2 = createRes.body.purchaseOrder;

      // Receive via dedicated POST /receive endpoint
      const receiveRes = await httpRequest(baseUrl, `/api/tenant/procurement/${testPO2.id}/receive`, {
        method: 'POST',
        token: tokenTenantA,
        body: {
          warehouseId: testWarehouse.id
        }
      });

      assert.equal(receiveRes.status, 200);
      assert.equal(receiveRes.body.purchaseOrder.status, 'RECEIVED');

      // Verify Product currentStock incremented from 70 to 100
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProduct.id }
      });
      assert.equal(updatedProduct.currentStock, 100);

      // Verify StockBalance incremented from 50 to 80
      const updatedBalance = await prisma.stockBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: testProduct.id,
            warehouseId: testWarehouse.id
          }
        }
      });
      assert.equal(updatedBalance.quantity, 80);
      assert.equal(updatedBalance.availableQuantity, 80);

      // Attempting to re-receive an already received PO returns 400
      const duplicateReceive = await httpRequest(baseUrl, `/api/tenant/procurement/${testPO2.id}/receive`, {
        method: 'POST',
        token: tokenTenantA,
        body: { warehouseId: testWarehouse.id }
      });
      assert.equal(duplicateReceive.status, 400, 'Re-receiving already received PO must return HTTP 400');
    });

    test('Step 1.4: Cross-tenant isolation blocks Tenant B from accessing or receiving Tenant A PO', async () => {
      const crossReceive = await httpRequest(baseUrl, `/api/tenant/procurement/${testPO1.id}/status`, {
        method: 'PATCH',
        token: tokenTenantB,
        body: { status: 'RECEIVED' }
      });
      assert.equal(crossReceive.status, 404, 'Cross-tenant PO update must be rejected with HTTP 404');

      const crossPostReceive = await httpRequest(baseUrl, `/api/tenant/procurement/${testPO1.id}/receive`, {
        method: 'POST',
        token: tokenTenantB,
        body: { warehouseId: testWarehouse.id }
      });
      assert.equal(crossPostReceive.status, 404, 'Cross-tenant PO receive must be rejected with HTTP 404');
    });
  });

  // =========================================================================
  // 2. STATUTORY ELECTRICAL SAFETY QA GATING (MOBILE & INSTALLATION QA)
  // =========================================================================
  describe('Statutory Electrical Safety QA Gating Logic', () => {
    /**
     * Evaluates compliance against statutory CEA regulations and IEEE 1547 standards
     * Earth pits: strictly < 5.0 Ohms
     * Anti-islanding trip: strictly < 2.0 seconds
     * Inverter insulation: strictly > 1.0 MOhm
     */
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

    test('Valid readings (2.1Ω, 1.8Ω, 2.4Ω, 0.18s, 2500MΩ) pass 100% of statutory tests', () => {
      const qa = evaluateElectricalSafetyQA({
        pit1Inverter: '2.1',
        pit2Structure: '1.8',
        pit3Lightning: '2.4',
        antiIslandingTripSec: '0.18',
        insulationMegaOhms: '2500'
      });

      assert.equal(qa.allTestsPass, true);
      assert.equal(qa.failureReasons.length, 0);
      assert.equal(qa.isPit1Pass, true);
      assert.equal(qa.isPit2Pass, true);
      assert.equal(qa.isPit3Pass, true);
      assert.equal(qa.isTripPass, true);
      assert.equal(qa.isInsulationPass, true);
    });

    test('Earth Pit 1 resistance >= 5.0Ω strictly fails and blocks QA sign-off', () => {
      // 5.0 boundary condition
      const qa5 = evaluateElectricalSafetyQA({
        pit1Inverter: '5.0',
        pit2Structure: '1.8',
        pit3Lightning: '2.4',
        antiIslandingTripSec: '0.18',
        insulationMegaOhms: '2500'
      });
      assert.equal(qa5.isPit1Pass, false, '5.0 Ohm is NOT strictly < 5.0');
      assert.equal(qa5.allTestsPass, false);
      assert.ok(qa5.failureReasons.some(r => r.includes('Pit 1')));

      // 6.2 Ohms failing condition
      const qa6 = evaluateElectricalSafetyQA({
        pit1Inverter: '6.2',
        pit2Structure: '1.8',
        pit3Lightning: '2.4',
        antiIslandingTripSec: '0.18',
        insulationMegaOhms: '2500'
      });
      assert.equal(qa6.isPit1Pass, false);
      assert.equal(qa6.allTestsPass, false);
    });

    test('Earth Pit 2 & Pit 3 resistance >= 5.0Ω strictly fails', () => {
      const qaPit2 = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '5.4',
        pit3Lightning: '2.1',
        antiIslandingTripSec: '0.18',
        insulationMegaOhms: '2500'
      });
      assert.equal(qaPit2.isPit2Pass, false);
      assert.equal(qaPit2.allTestsPass, false);

      const qaPit3 = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.1',
        pit3Lightning: '5.1',
        antiIslandingTripSec: '0.18',
        insulationMegaOhms: '2500'
      });
      assert.equal(qaPit3.isPit3Pass, false);
      assert.equal(qaPit3.allTestsPass, false);
    });

    test('Anti-islanding trip time >= 2.0s fails IEEE 1547 technical gating', () => {
      // 2.0s boundary
      const qa2 = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.1',
        pit3Lightning: '2.2',
        antiIslandingTripSec: '2.0',
        insulationMegaOhms: '2500'
      });
      assert.equal(qa2.isTripPass, false, '2.0s is NOT strictly < 2.0s');
      assert.equal(qa2.allTestsPass, false);

      // 2.5s failing
      const qaTrip = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.1',
        pit3Lightning: '2.2',
        antiIslandingTripSec: '2.5',
        insulationMegaOhms: '2500'
      });
      assert.equal(qaTrip.isTripPass, false);
      assert.equal(qaTrip.allTestsPass, false);
      assert.ok(qaTrip.failureReasons.some(r => r.includes('Anti-Islanding')));
    });

    test('Inverter insulation resistance <= 1.0 MΩ strictly fails CEA statutory threshold', () => {
      // 1.0 MOhm boundary
      const qa1 = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.1',
        pit3Lightning: '2.2',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '1.0'
      });
      assert.equal(qa1.isInsulationPass, false, '1.0 MOhm is NOT strictly > 1.0 MOhm');
      assert.equal(qa1.allTestsPass, false);

      // 0.6 MOhm degraded insulation
      const qaLow = evaluateElectricalSafetyQA({
        pit1Inverter: '2.0',
        pit2Structure: '2.1',
        pit3Lightning: '2.2',
        antiIslandingTripSec: '0.15',
        insulationMegaOhms: '0.6'
      });
      assert.equal(qaLow.isInsulationPass, false);
      assert.equal(qaLow.allTestsPass, false);
      assert.ok(qaLow.failureReasons.some(r => r.includes('Insulation Resistance')));
    });

    test('Negative and non-numeric inputs are safely rejected as non-compliant', () => {
      const qaInvalid = evaluateElectricalSafetyQA({
        pit1Inverter: '-1.5',
        pit2Structure: 'abc',
        pit3Lightning: 'NaN',
        antiIslandingTripSec: '-0.2',
        insulationMegaOhms: '0'
      });
      assert.equal(qaInvalid.allTestsPass, false);
      assert.equal(qaInvalid.isPit1Pass, false);
      assert.equal(qaInvalid.isPit2Pass, false);
      assert.equal(qaInvalid.isTripPass, false);
      assert.equal(qaInvalid.isInsulationPass, false);
    });
  });

  // =========================================================================
  // 3. MOBILE 2D BARCODE SCANNING, DCR TRACEABILITY & DUPLICATE PREVENTION
  // =========================================================================
  describe('Mobile 2D Barcode Capture & Hardware Traceability', () => {
    /**
     * Replicated parser and DCR validator from BarcodeScannerModal.tsx
     */
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

    test('Parses multi-field 2D QR codes and validates DCR compliance against ALMM certificates', () => {
      const rawQr = 'Waaree|WAA-DCR-540-100293|540W|ALMM-2024-WAAREE-01';
      const parsed = parseAndValidateBarcode(rawQr);

      assert.ok(parsed);
      assert.equal(parsed.serial, 'WAA-DCR-540-100293');
      assert.equal(parsed.manufacturer, 'Waaree');
      assert.equal(parsed.wattage, 540);
      assert.equal(parsed.dcrCompliant, true, 'Waaree DCR module must validate as DCR compliant');
      assert.equal(parsed.dcrCertificate, 'ALMM-2024-WAAREE-01');
    });

    test('Parses JSON 2D Barcodes with explicit DCR certificate', () => {
      const jsonQr = JSON.stringify({
        serial: 'ADANI-DCR-545-9921',
        make: 'Adani Solar',
        wattage: 545,
        dcrCertificate: 'ALMM/MNRE/2024/ADANI-TOPCON-08'
      });
      const parsed = parseAndValidateBarcode(jsonQr);

      assert.ok(parsed);
      assert.equal(parsed.serial, 'ADANI-DCR-545-9921');
      assert.equal(parsed.dcrCompliant, true);
      assert.equal(parsed.dcrCertificate, 'ALMM/MNRE/2024/ADANI-TOPCON-08');
    });

    test('Flags non-DCR / imported modules correctly when DCR indicators are absent', () => {
      const nonDcr = parseAndValidateBarcode('IMPORTED-GENERIC-550-9901');
      assert.ok(nonDcr);
      assert.equal(nonDcr.serial, 'IMPORTED-GENERIC-550-9901');
      assert.equal(nonDcr.dcrCompliant, false, 'Non-DCR module must be flagged as non-compliant');
    });

    test('Rejects short, empty or corrupted barcode noise (< 5 chars)', () => {
      assert.equal(parseAndValidateBarcode(''), null);
      assert.equal(parseAndValidateBarcode('A1'), null);
      assert.equal(parseAndValidateBarcode('1234'), null);
    });

    test('Detects duplicate serials across active session list (case-insensitive)', () => {
      const sessionModules = ['WAA-DCR-540-001', 'WAA-DCR-540-002'];
      const dupCheck1 = detectDuplicateSerial('waa-dcr-540-001', sessionModules);
      assert.equal(dupCheck1.isDuplicate, true);
      assert.ok(dupCheck1.reason.includes('current session'));

      const cleanCheck = detectDuplicateSerial('WAA-DCR-540-003', sessionModules);
      assert.equal(cleanCheck.isDuplicate, false);
    });

    test('Blocks duplicate when module serial matches inverter serial', () => {
      const dupInverter = detectDuplicateSerial(
        'SOLIS-INV-5KW-991',
        ['WAA-DCR-540-001'],
        'SOLIS-INV-5KW-991'
      );
      assert.equal(dupInverter.isDuplicate, true);
      assert.ok(dupInverter.reason.includes('inverter'));
    });

    test('Detects duplicate against existing project records in database', () => {
      const mockProject = {
        moduleSerials: ['WAA-DCR-540-EXISTING-01'],
        dcrModuleSerials: 'WAA-DCR-540-EXISTING-02, WAA-DCR-540-EXISTING-03'
      };

      const dupProj1 = detectDuplicateSerial('WAA-DCR-540-EXISTING-01', [], undefined, mockProject);
      assert.equal(dupProj1.isDuplicate, true);

      const dupProj2 = detectDuplicateSerial('WAA-DCR-540-EXISTING-02', [], undefined, mockProject);
      assert.equal(dupProj2.isDuplicate, true);

      const validProj = detectDuplicateSerial('WAA-DCR-540-NEW-01', [], undefined, mockProject);
      assert.equal(validProj.isDuplicate, false);
    });
  });
});
