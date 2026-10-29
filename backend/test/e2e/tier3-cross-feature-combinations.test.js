/**
 * Tier 3: Cross-Feature Combinations & Multi-Module Lifecycle Interactions (Opaque-Box E2E Suite)
 * WhereReady Solar OS Enterprise SaaS
 * 
 * Verifies core pairwise and multi-stage lifecycle handoffs across ERP modules:
 * 1. Interaction 1: Lead -> Customer -> Project -> Milestone Invoicing & Payment Recording
 * 2. Interaction 2: Survey Feasibility -> Quotation Revision & Audit Trail -> BOM Material Requirements
 * 3. Interaction 3: PO Receipt -> Auto Stock Ledger Increment -> Material Dispatch
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

describe('Tier 3: Cross-Feature Multi-Module Workflows (Opaque-Box)', () => {
  let serverInstance;
  let baseUrl;
  let adminToken;
  const tenantId = TEST_FIXTURES.tenantA.id;

  const tracked = {
    leads: [],
    customers: [],
    surveys: [],
    quotations: [],
    projects: [],
    invoices: [],
    discomApplications: [],
    purchaseOrders: [],
    products: []
  };

  before(async () => {
    serverInstance = await startTestServer();
    baseUrl = serverInstance.baseUrl;
    adminToken = createToken({
      userId: TEST_FIXTURES.tenantA.adminUser.id,
      role: 'TENANT_ADMIN',
      tenantId
    });
  });

  after(async () => {
    await cleanupTestArtifacts(tracked);
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  // ----------------------------------------------------
  // Interaction 1: Lead -> Customer -> Project -> Milestone Invoicing & Payment
  // ----------------------------------------------------
  describe('Interaction 1: Lead -> Customer -> Project -> Milestone Invoicing & Payment', () => {
    let createdLeadId;
    let convertedCustomerId;
    let convertedProjectId;
    let createdInvoiceId;

    it('Step 1.1: Capture raw field lead in CRM', async () => {
      const mobile = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
      const res = await httpRequest(baseUrl, '/api/tenant/leads', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Shri Vinayak Enterprises',
          mobile,
          email: `vinayak_${Date.now()}@solarclient.com`,
          customerType: 'COMMERCIAL',
          estimatedCap: 10.0,
          estimatedValue: 550000,
          city: 'Pune',
          address: 'Hadapsar Industrial Estate, Pune',
          source: 'DIRECT_VISIT',
          notes: 'Commercial rooftop solar feasibility required'
        }
      });

      assert.ok([200, 201].includes(res.status));
      assert.ok(res.body.lead.id);
      assert.equal(res.body.lead.status, 'NEW');

      createdLeadId = res.body.lead.id;
      tracked.leads.push(createdLeadId);
    });

    it('Step 1.2: Convert Lead into Customer & Project idempotently', async () => {
      assert.ok(createdLeadId, 'Lead must exist');

      const res = await httpRequest(baseUrl, `/api/tenant/leads/${createdLeadId}/convert`, {
        method: 'POST',
        token: adminToken,
        body: {
          customerName: 'Shri Vinayak Enterprises Private Limited',
          capacity: 10.0,
          systemType: 'On-Grid',
          estimatedValue: 550000
        }
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.lead, 'Must return updated lead');
      assert.equal(res.body.lead.status, 'WON');
      assert.ok(res.body.customer, 'Must create and return customer');
      assert.ok(res.body.project, 'Must create and return project');

      convertedCustomerId = res.body.customer.id;
      convertedProjectId = res.body.project.id;
      tracked.customers.push(convertedCustomerId);
      tracked.projects.push(convertedProjectId);

      // Verify Project Properties
      assert.equal(res.body.project.capacity, 10.0);
      assert.equal(res.body.project.currentStage, 'Planning');
      assert.equal(res.body.project.status, 'In Progress');

      // Allow background Promise.allSettled to complete auxiliary provisioning
      await new Promise(resolve => setTimeout(resolve, 800));

      const discom = await prisma.discomApplication.findUnique({
        where: { projectId: convertedProjectId }
      });
      if (discom) {
        assert.equal(discom.status, 'FEASIBILITY_PENDING');
        tracked.discomApplications.push(discom.id);
      }
    });

    it('Step 1.3: Verify Idempotency of Lead Conversion (Re-invoking returns existing project)', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/leads/${createdLeadId}/convert`, {
        method: 'POST',
        token: adminToken,
        body: {
          address: 'Updated Hadapsar Industrial Estate Phase 2'
        }
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.project.id, convertedProjectId, 'Must return identical project ID without duplicate');
      assert.equal(res.body.customer.id, convertedCustomerId);
    });

    it('Step 1.4: Generate Quotation & Convert into Milestone Invoices', async () => {
      // Create accepted quotation for this customer
      const quoteRes = await httpRequest(baseUrl, '/api/tenant/quotations', {
        method: 'POST',
        token: adminToken,
        body: {
          customerId: convertedCustomerId,
          leadId: createdLeadId,
          qNumber: `QT-VINAYAK-${Date.now()}`,
          systemCapacity: 10.0,
          systemType: 'On-grid',
          connectionType: 'Commercial',
          subtotal: 483304,
          tax: 66696,
          discount: 0,
          total: 550000,
          status: 'ACCEPTED'
        }
      });

      assert.ok([200, 201].includes(quoteRes.status));
      const quotationId = quoteRes.body.quotation.id;
      tracked.quotations.push(quotationId);

      // Convert quotation into milestone invoices
      const invRes = await httpRequest(baseUrl, '/api/tenant/finance/convert-quotation', {
        method: 'POST',
        token: adminToken,
        body: {
          quotationId,
          template: 'STANDARD_4_STAGE'
        }
      });

      assert.ok([200, 201].includes(invRes.status));
      assert.equal(invRes.body.invoices.length, 4);

      const advanceInvoice = invRes.body.invoices[0];
      assert.equal(advanceInvoice.milestone, 'ADVANCE');
      assert.equal(advanceInvoice.amount, 110000); // 20% of 550,000

      createdInvoiceId = advanceInvoice.id;
      for (const inv of invRes.body.invoices) {
        tracked.invoices.push(inv.id);
      }
    });

    it('Step 1.5: Record Advance Payment against Milestone Invoice', async () => {
      assert.ok(createdInvoiceId, 'Advance invoice must exist');

      const paymentRes = await httpRequest(baseUrl, `/api/tenant/invoices/${createdInvoiceId}/payments`, {
        method: 'POST',
        token: adminToken,
        body: {
          amount: 110000,
          paymentMethod: 'NEFT',
          referenceNumber: `NEFT-SBI-${Date.now()}`,
          paidAt: new Date().toISOString(),
          notes: 'Stage 1 Advance booking payment received via bank transfer'
        }
      });

      assert.ok([200, 201].includes(paymentRes.status));

      // Verify invoice status updated to PAID
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: createdInvoiceId },
        include: { payments: true }
      });
      assert.equal(updatedInvoice.status, 'PAID');
      assert.equal(updatedInvoice.payments.length, 1);
      assert.equal(updatedInvoice.payments[0].amount, 110000);
    });
  });

  // ----------------------------------------------------
  // Interaction 2: Survey Feasibility -> Quotation Revision -> BOM Material Requirements
  // ----------------------------------------------------
  describe('Interaction 2: Survey Feasibility -> Quotation Revision -> BOM Material Requirements', () => {
    let surveyCustomerId;
    let surveyId;
    let convertedQuotationId;
    let postConvertProjectId;

    before(async () => {
      const cust = await prisma.customer.create({
        data: {
          tenantId,
          name: 'TechPark Green Campus',
          mobile: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
          city: 'Pune'
        }
      });
      surveyCustomerId = cust.id;
      tracked.customers.push(cust.id);
    });

    it('Step 2.1: Create Technical Site Survey with electrical and structural parameters', async () => {
      const surveyRes = await httpRequest(baseUrl, '/api/tenant/surveys', {
        method: 'POST',
        token: adminToken,
        body: {
          customerId: surveyCustomerId,
          roofArea: 600,
          shadowFreeArea: 550,
          roofType: 'RCC Flat Roof',
          electricalPhase: 'Three Phase',
          sanctionedLoad: 15.0,
          recommendedCapacity: 6.6,
          proposedCap: 6.6,
          surveyDate: new Date().toISOString(),
          status: 'COMPLETED',
          notes: 'South facing unshaded roof. Ideal for 12 x 550Wp bifacial panels.'
        }
      });

      assert.ok([200, 201].includes(surveyRes.status));
      assert.ok(surveyRes.body.survey.id);
      surveyId = surveyRes.body.survey.id;
      tracked.surveys.push(surveyId);
    });

    it('Step 2.2: Perform 1-Click Conversion from Approved Survey to Quotation', async () => {
      assert.ok(surveyId, 'Survey must exist');

      const convRes = await httpRequest(baseUrl, `/api/tenant/surveys/${surveyId}/convert-to-quote`, {
        method: 'POST',
        token: adminToken
      });

      assert.ok([200, 201].includes(convRes.status));
      assert.ok(convRes.body.quotation, 'Must return created quotation');
      assert.equal(convRes.body.quotation.surveyId, surveyId);
      assert.equal(convRes.body.quotation.systemCapacity, 6.6);
      assert.equal(convRes.body.quotation.status, 'DRAFT');

      convertedQuotationId = convRes.body.quotation.id;
      tracked.quotations.push(convertedQuotationId);
    });

    it('Step 2.3: Populate detailed line items and accept quotation', async () => {
      assert.ok(convertedQuotationId, 'Quotation must exist');

      // Populate quotation line items for the BOM generation workflow
      await prisma.quotationItem.createMany({
        data: [
          {
            quotationId: convertedQuotationId,
            description: 'Waaree 580Wp TOPCon Bifacial Modules',
            quantity: 12,
            unitPrice: 16500,
            taxRate: 12,
            total: 198000
          },
          {
            quotationId: convertedQuotationId,
            description: 'Growatt 7kW Three-Phase Solar Inverter',
            quantity: 1,
            unitPrice: 65000,
            taxRate: 12,
            total: 65000
          }
        ]
      });

      // Update quotation status to ACCEPTED
      const patchRes = await httpRequest(baseUrl, `/api/tenant/quotations/${convertedQuotationId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'ACCEPTED' }
      });

      assert.ok([200, 201].includes(patchRes.status));
      assert.equal(patchRes.body.quotation.status, 'ACCEPTED');
    });

    it('Step 2.4: Convert Revised Quotation into Project and verify auto-generated BOM requirements', async () => {
      assert.ok(convertedQuotationId, 'Quotation must exist');

      const projectRes = await httpRequest(baseUrl, `/api/tenant/quotations/${convertedQuotationId}/convert`, {
        method: 'POST',
        token: adminToken
      });

      assert.ok([200, 201].includes(projectRes.status));
      assert.ok(projectRes.body.project.id);
      postConvertProjectId = projectRes.body.project.id;
      tracked.projects.push(postConvertProjectId);

      // Verify Bill of Materials (ProjectMaterialRequirement) auto-created from line items
      const bomItems = await prisma.projectMaterialRequirement.findMany({
        where: { projectId: postConvertProjectId }
      });

      assert.ok(bomItems.length >= 2, 'BOM entries must be generated for modules and inverter');
      const descriptions = bomItems.map(b => b.description);
      assert.ok(descriptions.some(d => d.includes('Waaree 580Wp')), 'BOM must include Waaree 580Wp modules');
      assert.ok(descriptions.some(d => d.includes('Growatt 7kW')), 'BOM must include Growatt inverter');
    });
  });

  // ----------------------------------------------------
  // Interaction 3: PO Receipt -> Stock Ledger Increment -> Material Dispatch
  // ----------------------------------------------------
  describe('Interaction 3: PO Receipt -> Stock Ledger Increment -> Material Dispatch', () => {
    let testProductId;
    let testWarehouseId;
    let purchaseOrderId;
    let dispatchProjectId;

    before(async () => {
      // 1. Ensure central warehouse exists
      let warehouse = await prisma.warehouse.findFirst({
        where: { tenantId }
      });
      if (!warehouse) {
        warehouse = await prisma.warehouse.create({
          data: {
            tenantId,
            name: 'Central EPC Hub',
            location: 'Pune Headquarters'
          }
        });
      }
      testWarehouseId = warehouse.id;

      // 2. Create catalog product (Product schema uses sellingPrice, purchaseCost, currentStock)
      const product = await prisma.product.create({
        data: {
          tenantId,
          name: 'Waaree 550Wp DCR Solar Panel',
          sku: `WAA-550-${Date.now().toString().slice(-4)}`,
          brand: 'Waaree',
          category: 'MODULE',
          unit: 'Nos',
          currentStock: 10,
          sellingPrice: 15000,
          purchaseCost: 11500
        }
      });
      testProductId = product.id;
      tracked.products.push(product.id);

      // 3. Create project for dispatch recipient
      const proj = await prisma.project.create({
        data: {
          tenantId,
          projectNumber: `PRJ-DISP-${Date.now().toString().slice(-4)}`,
          name: 'Material Dispatch Destination Project',
          capacity: 5.5,
          currentStage: 'Installation',
          status: 'In Progress'
        }
      });
      dispatchProjectId = proj.id;
      tracked.projects.push(proj.id);
    });

    it('Step 3.1: Create Purchase Order for 50 PV Modules with Supplier', async () => {
      const poRes = await httpRequest(baseUrl, '/api/tenant/procurement', {
        method: 'POST',
        token: adminToken,
        body: {
          supplier: 'Waaree Energies Limited',
          items: [
            {
              productId: testProductId,
              quantity: 50,
              unitCost: 11500
            }
          ],
          notes: 'Bulk procurement for Q4 installations'
        }
      });

      assert.ok([200, 201].includes(poRes.status));
      assert.ok(poRes.body.purchaseOrder.id);
      assert.equal(poRes.body.purchaseOrder.status, 'ORDERED');

      purchaseOrderId = poRes.body.purchaseOrder.id;
      tracked.purchaseOrders.push(purchaseOrderId);
    });

    it('Step 3.2: Transition PO status to RECEIVED and verify automatic warehouse stock increment', async () => {
      assert.ok(purchaseOrderId, 'PO must exist');

      const receiveRes = await httpRequest(baseUrl, `/api/tenant/procurement/${purchaseOrderId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'RECEIVED' }
      });

      assert.equal(receiveRes.status, 200);

      // Verify product currentStock incremented from 10 to 60 (+50)
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });
      assert.equal(updatedProduct.currentStock, 60, 'Product stock must increment from 10 to 60 upon PO receipt');

      // Verify StockLedger contains RECEIPT movement
      const ledgerEntry = await prisma.stockLedger.findFirst({
        where: {
          tenantId,
          productId: testProductId,
          movementType: 'RECEIPT',
          referenceType: 'PO',
          referenceId: purchaseOrderId
        }
      });

      assert.ok(ledgerEntry, 'Stock ledger must log RECEIPT movement');
      assert.equal(ledgerEntry.quantity, 50);
      assert.equal(ledgerEntry.quantityBefore, 10);
      assert.equal(ledgerEntry.quantityAfter, 60);
    });

    it('Step 3.3: Dispatch inventory to project site and verify atomic ledger deduction', async () => {
      // Ensure StockBalance entry exists in this warehouse for the dispatch endpoint
      await prisma.stockBalance.upsert({
        where: { productId_warehouseId: { productId: testProductId, warehouseId: testWarehouseId } },
        create: {
          productId: testProductId,
          warehouseId: testWarehouseId,
          quantity: 60,
          availableQuantity: 60
        },
        update: {
          quantity: 60,
          availableQuantity: 60
        }
      });

      const dispatchRes = await httpRequest(baseUrl, '/api/tenant/inventory/dispatch', {
        method: 'POST',
        token: adminToken,
        body: {
          projectId: dispatchProjectId,
          warehouseId: testWarehouseId,
          receiverName: 'Site Supervisor Vikram Patil',
          notes: 'Dispatch for rooftop mounting structure and 10 modules',
          items: [
            {
              productId: testProductId,
              quantity: 10
            }
          ]
        }
      });

      assert.ok([200, 201].includes(dispatchRes.status));
      assert.ok(dispatchRes.body.dispatch, 'Response must include dispatch record');
      assert.equal(dispatchRes.body.dispatch.status, 'DISPATCHED');

      // Verify stock balance decremented from 60 to 50 (-10)
      const balance = await prisma.stockBalance.findUnique({
        where: { productId_warehouseId: { productId: testProductId, warehouseId: testWarehouseId } }
      });
      assert.equal(balance.availableQuantity, 50, 'Warehouse balance must decrement to 50');

      // Verify StockLedger contains DISPATCH movement
      const dispatchLedger = await prisma.stockLedger.findFirst({
        where: {
          tenantId,
          productId: testProductId,
          movementType: 'DISPATCH',
          referenceType: 'DISPATCH'
        },
        orderBy: { createdAt: 'desc' }
      });

      assert.ok(dispatchLedger, 'Stock ledger must log DISPATCH movement');
      assert.equal(dispatchLedger.quantity, -10, 'Dispatch quantity must be negative');
      assert.equal(dispatchLedger.quantityBefore, 60);
      assert.equal(dispatchLedger.quantityAfter, 50);
    });
  });
});
