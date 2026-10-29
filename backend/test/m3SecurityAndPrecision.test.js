const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const solarCalc = require('../services/solarCalculator');
const { requireTenantAuth, requirePermission, JWT_SECRET } = require('../middleware/auth');

describe('Milestone M3: Security, Multi-Tenancy & Financial Precision Test Suite', () => {

  // 1. FINANCIAL PRECISION & GST TRADE DISCOUNT MATH
  describe('Financial Engine: Section 15(3) CGST Act Trade Discount & Taxable Base Scaling', () => {
    test('calculateCommercialPricing scales taxable base proportionally when overallDiscount is applied', () => {
      // Single line item: 100 @ 18% GST with 20 discount -> taxable base = 80, tax = 14 (Math.round(80 * 0.18)), grandTotal = 94
      const result = solarCalc.calculateCommercialPricing({
        items: [{ unitPrice: 100, quantity: 1, taxRate: 18 }],
        overallDiscount: 20
      });

      assert.equal(result.subtotal, 100);
      assert.equal(result.discount, 20);
      assert.equal(result.overallDiscount, 20);
      assert.equal(result.taxableAmount, 80);
      assert.equal(result.tax, 14);
      assert.equal(result.totalTax, 14);
      assert.equal(result.grandTotal, 94);
      assert.equal(result.items[0].baseAmount, 80);
      assert.equal(result.items[0].taxAmount, 14);
      assert.equal(result.items[0].total, 94);
    });

    test('calculateCommercialPricing rebalances multi-item mixed GST rates so sums strictly match totals', () => {
      const items = [
        { description: 'Modules', quantity: 10, unitPrice: 10000, taxRate: 12 },   // 100,000
        { description: 'Inverter', quantity: 1, unitPrice: 50000, taxRate: 12 },    // 50,000
        { description: 'Installation', quantity: 1, unitPrice: 50000, taxRate: 18 } // 50,000
      ];
      // Total subtotal = 200,000. Discount = 20,000 (10%). Taxable = 180,000.
      const pricing = solarCalc.calculateCommercialPricing({ items, overallDiscount: 20000 });

      assert.equal(pricing.subtotal, 200000);
      assert.equal(pricing.discount, 20000);
      assert.equal(pricing.taxableAmount, 180000);

      // Verify line item base sum matches taxableAmount exactly
      const baseSum = pricing.items.reduce((acc, it) => acc + it.baseAmount, 0);
      assert.equal(baseSum, pricing.taxableAmount);

      // Verify line item tax sum matches total tax exactly
      const taxSum = pricing.items.reduce((acc, it) => acc + it.taxAmount, 0);
      assert.equal(taxSum, pricing.tax);
      assert.equal(pricing.cgst + pricing.sgst, pricing.tax);
      assert.equal(pricing.grandTotal, pricing.taxableAmount + pricing.tax);
    });

    test('calculateCommercialPricing handles zero discount and composite GST accurately', () => {
      const items = [
        { description: 'Solar Panels', unitPrice: 20000, quantity: 5, taxRate: 12 }
      ];
      const pricing = solarCalc.calculateCommercialPricing({
        items,
        overallDiscount: 0,
        useCompositeSolarGST: true
      });

      assert.equal(pricing.subtotal, 100000);
      assert.equal(pricing.discount, 0);
      assert.equal(pricing.taxableAmount, 100000);
      assert.equal(pricing.tax, 13800); // 13.8% of 100,000
      assert.equal(pricing.grandTotal, 113800);
      assert.equal(pricing.items[0].baseAmount, 100000);
    });
  });

  // 2. MILESTONE INTEGER RECONCILIATION & ROUNDING DRIFT
  describe('Financial Engine: Milestone Payment Schedule Integer Reconciliation', () => {
    test('generateMilestones strictly reconciles grandTotal with zero 1-rupee rounding drift on odd totals', () => {
      const oddTotals = [275001, 333333, 999999, 101, 103, 1, 0];

      for (const total of oddTotals) {
        const milestones = solarCalc.generateMilestones(total);
        assert.equal(milestones.length, 4);
        const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
        assert.equal(sum, total, `Milestone sum ${sum} failed to reconcile with grand total ${total}`);
      }
    });

    test('generateMilestones correctly reconciles custom milestone distributions', () => {
      const customMilestones = [
        { percentage: 33.33, description: 'Deposit' },
        { percentage: 33.33, description: 'Progress' },
        { percentage: 33.34, description: 'Completion' }
      ];
      const total = 500001;
      const result = solarCalc.generateMilestones(total, customMilestones);
      assert.equal(result.length, 3);
      const sum = result.reduce((acc, m) => acc + m.amount, 0);
      assert.equal(sum, total);
    });
  });

  // 3. ZERO & NEGATIVE CAPACITY SUBSIDY SAFEGUARD
  describe('Financial Engine: PM Surya Ghar Central Subsidy Validation Safeguard', () => {
    test('calculateIndicativeSubsidy returns 0 and invalid capacity breakdown on zero or negative capacity', () => {
      const zeroRes = solarCalc.calculateIndicativeSubsidy({ capacityKw: 0, connectionType: 'Residential' });
      assert.equal(zeroRes.indicativeSubsidy, 0);
      assert.equal(zeroRes.isEligible, false);
      assert.equal(zeroRes.breakdown, 'Invalid capacity');
      assert.equal(zeroRes.netPayableEstimate, 0);

      const negRes = solarCalc.calculateIndicativeSubsidy({ capacityKw: -3.5, connectionType: 'Residential' });
      assert.equal(negRes.indicativeSubsidy, 0);
      assert.equal(negRes.isEligible, false);
      assert.equal(negRes.breakdown, 'Invalid capacity');
      assert.equal(negRes.netPayableEstimate, 0);

      const nanRes = solarCalc.calculateIndicativeSubsidy({ capacityKw: null, connectionType: 'Residential' });
      assert.equal(nanRes.indicativeSubsidy, 0);
      assert.equal(nanRes.isEligible, false);
      assert.equal(nanRes.breakdown, 'Invalid capacity');
    });

    test('calculateIndicativeSubsidy returns valid slabs for positive capacity', () => {
      const posRes = solarCalc.calculateIndicativeSubsidy({ capacityKw: 3.0, connectionType: 'Residential' });
      assert.equal(posRes.indicativeSubsidy, 78000);
      assert.equal(posRes.isEligible, true);
    });
  });

  // 4. JWT IDENTITY NORMALIZATION & AUTH MIDDLEWARE
  describe('Authentication & Identity: JWT req.user.id and req.user.userId Normalization', () => {
    test('requireTenantAuth normalizes req.user to provide both id and userId', async () => {
      const tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } }) || await prisma.tenant.findFirst();
      const tenantId = tenant ? tenant.id : 'tenant_test_456';
      const fakePayload = {
        userId: 'usr_test_123',
        role: 'TENANT_ADMIN',
        tenantId,
        permissions: ['*']
      };
      const token = jwt.sign(fakePayload, JWT_SECRET, { expiresIn: '1h' });

      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {}
      };
      let nextCalled = false;
      const res = {
        status: (code) => ({ json: (data) => ({ code, data }) })
      };

      await requireTenantAuth(req, res, () => { nextCalled = true; });

      assert.ok(nextCalled, 'requireTenantAuth should call next()');
      assert.equal(req.user.userId, 'usr_test_123');
      assert.equal(req.user.id, 'usr_test_123');
      assert.equal(req.user.tenantId, tenantId);
      assert.equal(req.user.role, 'TENANT_ADMIN');
    });

    test('requireTenantAuth rejects requests with missing or expired token', async () => {
      const req = { headers: {}, cookies: {} };
      let statusCode = 0;
      let errorResponse = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { errorResponse = data; } };
        }
      };

      await requireTenantAuth(req, res, () => {});
      assert.equal(statusCode, 401);
      assert.ok(errorResponse.error.includes('Tenant Access Required'));
    });
  });

  // 5. GRANULAR RBAC ROUTE ENFORCEMENT
  describe('Authorization: Granular RBAC Permission Middleware', () => {
    test('requirePermission allows TENANT_ADMIN without checking individual permissions', async () => {
      const req = {
        user: { id: 'admin_1', userId: 'admin_1', role: 'TENANT_ADMIN', tenantId: 'tenant_1', permissions: [] }
      };
      let nextCalled = false;
      const res = { status: () => ({ json: () => {} }) };

      const middleware = requirePermission('leads.delete', 'finance.create_invoice');
      await middleware(req, res, () => { nextCalled = true; });

      assert.ok(nextCalled, 'TENANT_ADMIN must have implicit full permission bypass');
    });

    test('requirePermission allows TENANT_SUB_ADMIN with wildcard permission', async () => {
      const req = {
        user: { id: 'emp_1', userId: 'emp_1', role: 'TENANT_SUB_ADMIN', tenantId: 'tenant_1', permissions: ['*'] }
      };
      let nextCalled = false;
      const res = { status: () => ({ json: () => {} }) };

      const middleware = requirePermission('inventory.dispatch');
      await middleware(req, res, () => { nextCalled = true; });

      assert.ok(nextCalled, 'TENANT_SUB_ADMIN with * must pass');
    });

    test('requirePermission allows TENANT_SUB_ADMIN who possesses required permission', async () => {
      const req = {
        user: {
          id: 'emp_2',
          userId: 'emp_2',
          role: 'TENANT_SUB_ADMIN',
          tenantId: 'tenant_1',
          permissions: ['leads.view', 'leads.create']
        }
      };
      let nextCalled = false;
      const res = { status: () => ({ json: () => {} }) };

      const middleware = requirePermission('leads.view');
      await middleware(req, res, () => { nextCalled = true; });

      assert.ok(nextCalled, 'TENANT_SUB_ADMIN with leads.view must pass');
    });

    test('requirePermission rejects TENANT_SUB_ADMIN missing required permission with 403', async () => {
      const req = {
        user: {
          id: 'emp_3',
          userId: 'emp_3',
          role: 'TENANT_SUB_ADMIN',
          tenantId: 'tenant_1',
          permissions: ['leads.view']
        }
      };
      let statusCode = 0;
      let errorResponse = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { errorResponse = data; } };
        }
      };

      const middleware = requirePermission('leads.delete');
      await middleware(req, res, () => {});

      assert.equal(statusCode, 403);
      assert.equal(errorResponse.error, 'Forbidden: Insufficient permissions');
      assert.deepEqual(errorResponse.required, ['leads.delete']);
    });
  });

  // 6. OCR ROUTE PROTECTION VERIFICATION
  describe('API Surface Security: OCR Endpoints Protected by Tenant Auth', () => {
    test('OCR router routes have requireTenantAuth middleware attached', () => {
      const ocrRouter = require('../routes/tenant/ocr');
      
      const routes = ocrRouter.stack.filter(layer => layer.route);
      const scanBillRoute = routes.find(l => l.route.path === '/api/tenant/ocr/scan-bill');
      const fetchConsumerRoute = routes.find(l => l.route.path === '/api/tenant/ocr/fetch-consumer');

      assert.ok(scanBillRoute, 'POST /api/tenant/ocr/scan-bill route must exist');
      assert.ok(fetchConsumerRoute, 'POST /api/tenant/ocr/fetch-consumer route must exist');

      // Check that route stack has at least 2 middleware handlers (requireTenantAuth + async controller)
      assert.ok(scanBillRoute.route.stack.length >= 2, 'scan-bill route must include auth middleware');
      assert.ok(fetchConsumerRoute.route.stack.length >= 2, 'fetch-consumer route must include auth middleware');
    });
  });

  // 7. ROUTE SHADOWING VERIFICATION
  describe('Routing Architecture: Elimination of Redundant Quotation Shadowing', () => {
    test('crm.js does not register redundant router.patch(/api/tenant/quotations/:id)', () => {
      const crmRouter = require('../routes/tenant/crm');
      const routes = crmRouter.stack.filter(layer => layer.route);
      const shadowedQuotePatch = routes.find(
        l => l.route.path === '/api/tenant/quotations/:id' && l.route.methods.patch
      );

      assert.equal(shadowedQuotePatch, undefined, 'crm.js must not shadow quotations.js PATCH /api/tenant/quotations/:id');
    });
  });
});
