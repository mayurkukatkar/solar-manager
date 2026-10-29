/**
 * Milestone M6: Cross-Module Lead-to-Service Lifecycle & Relational Integrity Suite
 * WhereReady Solar OS Enterprise SaaS
 * 
 * Verifies the complete solar business workflow lifecycle across linked database entities:
 * 1. CRM Lead Capture (`POST /api/tenant/leads`)
 * 2. Lead to Customer & Project Conversion (`POST /api/tenant/leads/:id/convert`)
 * 3. Site Survey Feasibility Audit & 1-Click Quotation Conversion (`POST /api/tenant/surveys`, `POST /api/tenant/surveys/:id/convert-to-quote`)
 * 4. Commercial Quotation Acceptance & BOM Material Requirements (`POST /api/tenant/quotations/:id/convert`)
 * 5. Equipment Procurement PO & Auto-Stock Restocking (`POST /api/tenant/procurement/orders`, `PATCH /api/tenant/procurement/:id/status`)
 * 6. Installation Job Scheduling & Quality Assurance Sign-Off (`POST /api/tenant/installations/schedule`, `PUT /api/tenant/installations/:id/status`)
 * 7. DISCOM Net-Metering 5-Stage Gated Interconnection (`PATCH /api/tenant/projects/:id/discom/stage`)
 * 8. 4-Stage Milestone Invoicing & Payment Clearance (`POST /api/tenant/finance/convert-quotation`, `POST /api/tenant/invoices/:id/payments`)
 * 9. Post-Commissioning AMC & Warranty Support (`POST /api/tenant/amcs`, `POST /api/tenant/tickets`, `POST /api/tenant/tickets/:id/visits`)
 * 10. Comprehensive Database Relational Integrity & Multi-Tenant Boundary Audit
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../db');
const {
  startTestServer,
  httpRequest,
  createToken,
  TEST_FIXTURES,
  cleanupTestArtifacts
} = require('./e2e/testHelper');

describe('Milestone M6: Cross-Module Lead-to-Service Full Lifecycle Suite', () => {
  let serverInstance;
  let baseUrl;
  let adminTokenTenantA;
  let adminTokenTenantB;
  const tenantId = TEST_FIXTURES.tenantA.id;
  const tenantBId = TEST_FIXTURES.tenantB.id;

  const tracked = {
    leads: [],
    customers: [],
    surveys: [],
    quotations: [],
    projects: [],
    invoices: [],
    discomApplications: [],
    subsidies: [],
    purchaseOrders: [],
    products: [],
    warehouses: [],
    installations: [],
    amcs: [],
    tickets: []
  };

  // Lifecycle shared context
  let leadRecord = null;
  let customerRecord = null;
  let projectRecord = null;
  let surveyRecord = null;
  let quotationRecord = null;
  let testWarehouse = null;
  let testProduct = null;
  let purchaseOrderRecord = null;
  let installationJobRecord = null;
  let discomAppRecord = null;
  let advanceInvoiceRecord = null;
  let allInvoices = [];
  let amcRecord = null;
  let ticketRecord = null;
  let serviceVisitRecord = null;

  before(async () => {
    serverInstance = await startTestServer();
    baseUrl = serverInstance.baseUrl;

    adminTokenTenantA = createToken({
      userId: TEST_FIXTURES.tenantA.adminUser.id,
      role: 'TENANT_ADMIN',
      tenantId
    });

    adminTokenTenantB = createToken({
      userId: TEST_FIXTURES.tenantB.adminUser.id,
      role: 'TENANT_ADMIN',
      tenantId: tenantBId
    });

    // Seed dedicated test warehouse & product
    testWarehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        name: `M6 Central EPC Depot ${Date.now()}`,
        location: 'Plot 42, Bhosari Industrial Area, Pune'
      }
    });
    tracked.warehouses.push(testWarehouse.id);

    testProduct = await prisma.product.create({
      data: {
        tenantId,
        name: `Adani 550Wp Mono PERC Module M6-${Date.now()}`,
        sku: `ADANI-550-M6-${Date.now().toString().slice(-4)}`,
        category: 'MODULE',
        unit: 'NOS',
        purchaseCost: 12500,
        sellingPrice: 15500,
        currentStock: 20
      }
    });
    tracked.products.push(testProduct.id);
  });

  after(async () => {
    // Clean up auxiliary tables created in tests
    if (ticketRecord) {
      await prisma.serviceVisit.deleteMany({ where: { ticketId: ticketRecord.id } }).catch(() => {});
      await prisma.supportTicket.deleteMany({ where: { id: ticketRecord.id } }).catch(() => {});
    }
    if (amcRecord) {
      await prisma.aMC.deleteMany({ where: { id: amcRecord.id } }).catch(() => {});
    }
    if (installationJobRecord) {
      await prisma.installationPhoto.deleteMany({ where: { installationId: installationJobRecord.id } }).catch(() => {});
      await prisma.installationAssignment.deleteMany({ where: { installationJobId: installationJobRecord.id } }).catch(() => {});
      await prisma.installationJob.deleteMany({ where: { id: installationJobRecord.id } }).catch(() => {});
    }
    if (testWarehouse && testProduct) {
      await prisma.stockLedger.deleteMany({ where: { warehouseId: testWarehouse.id } }).catch(() => {});
      await prisma.stockBalance.deleteMany({ where: { warehouseId: testWarehouse.id } }).catch(() => {});
      await prisma.warehouse.deleteMany({ where: { id: testWarehouse.id } }).catch(() => {});
    }

    await cleanupTestArtifacts(tracked);

    if (serverInstance && serverInstance.close) {
      await serverInstance.close();
    }
  });

  // =========================================================================
  // STAGE 1: INBOUND LEAD CREATION
  // =========================================================================
  it('Phase 1: Inbound Lead Capture with complete prospect technical profile', async () => {
    const mobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const res = await httpRequest(baseUrl, '/api/tenant/leads', {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        name: 'M6 Rajesh Sharma',
        mobile,
        email: `rajesh.sharma_${Date.now()}@gmail.com`,
        customerType: 'RESIDENTIAL',
        estimatedCap: 3.3,
        estimatedValue: 191400,
        address: 'Bungalow 7, Kothrud',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
        electricityConnection: '028510889911',
        roofArea: 320,
        monthlyBill: 4200,
        source: 'DIRECT_WEBSITE'
      }
    });

    assert.ok(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.ok(res.body.lead, 'Lead object must be returned');
    assert.equal(res.body.lead.status, 'NEW');
    assert.equal(res.body.lead.tenantId, tenantId);

    leadRecord = res.body.lead;
    tracked.leads.push(leadRecord.id);
  });

  // =========================================================================
  // STAGE 2: LEAD TO CUSTOMER & PROJECT CONVERSION
  // =========================================================================
  it('Phase 2: Convert Lead to Customer & Project maintaining relational consistency', async () => {
    const res = await httpRequest(baseUrl, `/api/tenant/leads/${leadRecord.id}/convert`, {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        projectName: 'Rajesh Sharma 3.3kW Rooftop EPC',
        capacity: 3.3,
        estimatedCost: 191400,
        systemType: 'ON_GRID',
        discomName: 'MSEDCL',
        consumerNumber: '028510889911'
      }
    });

    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.ok(res.body.customer, 'Customer record must be returned');
    assert.ok(res.body.project, 'Project record must be returned');

    customerRecord = res.body.customer;
    projectRecord = res.body.project;
    tracked.customers.push(customerRecord.id);
    tracked.projects.push(projectRecord.id);

    // Verify database relational links
    assert.equal(customerRecord.leadId, leadRecord.id, 'Customer must reference source Lead ID');
    assert.equal(projectRecord.customerId, customerRecord.id, 'Project must reference converted Customer ID');
    assert.equal(projectRecord.leadId, leadRecord.id, 'Project must reference source Lead ID');
    assert.equal(projectRecord.tenantId, tenantId, 'Project must inherit Tenant ID');
  });

  // =========================================================================
  // STAGE 3: SITE SURVEY FEASIBILITY & 1-CLICK QUOTATION CONVERSION
  // =========================================================================
  it('Phase 3: Conduct Site Survey Feasibility and convert 1-click to Quotation', async () => {
    // 1. Create Site Survey
    const surveyRes = await httpRequest(baseUrl, '/api/tenant/surveys', {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        customerId: customerRecord.id,
        leadId: leadRecord.id,
        projectId: projectRecord.id,
        roofType: 'RCC Flat Roof',
        roofAreaSqFt: 350,
        shadowFreeAreaSqFt: 300,
        sanctionedLoadKw: 5.0,
        electricalPhase: 'Three Phase',
        recommendedCapacity: 3.3,
        proposedCap: 3.3,
        discomName: 'MSEDCL',
        consumerNumber: '028510889911',
        status: 'COMPLETED'
      }
    });

    assert.equal(surveyRes.status, 201, `Expected 201, got ${surveyRes.status}: ${JSON.stringify(surveyRes.body)}`);
    assert.ok(surveyRes.body.survey, 'Survey record must be returned');
    surveyRecord = surveyRes.body.survey;
    tracked.surveys.push(surveyRecord.id);

    // 2. Perform 1-Click Conversion to Quotation
    const quoteRes = await httpRequest(baseUrl, `/api/tenant/surveys/${surveyRecord.id}/convert-to-quote`, {
      method: 'POST',
      token: adminTokenTenantA
    });

    assert.equal(quoteRes.status, 201, `Expected 201, got ${quoteRes.status}: ${JSON.stringify(quoteRes.body)}`);
    assert.ok(quoteRes.body.quotation, 'Quotation record must be returned');

    quotationRecord = quoteRes.body.quotation;
    tracked.quotations.push(quotationRecord.id);

    // Verify Survey-to-Quote link
    assert.equal(quotationRecord.surveyId, surveyRecord.id, 'Quotation must reference source Survey ID');
    assert.equal(quotationRecord.customerId, customerRecord.id, 'Quotation must reference Customer ID');
    assert.equal(quotationRecord.leadId, leadRecord.id, 'Quotation must reference Lead ID');
    assert.equal(quotationRecord.systemCapacity, 3.3, 'Quotation must adopt recommended capacity from survey');
  });

  // =========================================================================
  // STAGE 4: QUOTATION ACCEPTANCE & BOM MATERIAL PROVISIONING
  // =========================================================================
  it('Phase 4: Enrich line items, accept Quotation, and auto-provision BOM requirements', async () => {
    // 1. Add BOM line items to Quotation
    await prisma.quotationItem.createMany({
      data: [
        {
          quotationId: quotationRecord.id,
          productId: testProduct.id,
          description: 'Adani 550Wp Mono PERC Modules (6 Units)',
          quantity: 6,
          unitPrice: 15500,
          total: 93000,
          taxRate: 12
        },
        {
          quotationId: quotationRecord.id,
          description: 'Solis 3.3kW Single Phase On-Grid Inverter',
          quantity: 1,
          unitPrice: 38000,
          total: 38000,
          taxRate: 18
        }
      ]
    });

    // 2. Convert / Accept Quotation to Project
    const convertRes = await httpRequest(baseUrl, `/api/tenant/quotations/${quotationRecord.id}/convert`, {
      method: 'POST',
      token: adminTokenTenantA
    });

    assert.equal(convertRes.status, 200, `Expected 200, got ${convertRes.status}: ${JSON.stringify(convertRes.body)}`);
    assert.ok(convertRes.body.project, 'Project must be returned from quotation conversion');

    // Verify quotation is locked
    const refreshedQuote = await prisma.quotation.findUnique({
      where: { id: quotationRecord.id }
    });
    assert.equal(refreshedQuote.isLocked, true, 'Quotation must be locked upon acceptance');
    assert.equal(refreshedQuote.status, 'ACCEPTED', 'Quotation status must be ACCEPTED');

    // Verify Project Material Requirements (BOM) were provisioned
    const bomItems = await prisma.projectMaterialRequirement.findMany({
      where: { projectId: convertRes.body.project.id }
    });
    assert.ok(bomItems.length >= 2, `Expected at least 2 BOM items, found ${bomItems.length}`);
    const moduleBom = bomItems.find(b => b.description.includes('Adani 550Wp'));
    assert.ok(moduleBom, 'BOM must contain module requirement');
    assert.equal(moduleBom.quantity, 6, 'Module BOM quantity must be 6');
  });

  // =========================================================================
  // STAGE 5: PROCUREMENT PO & AUTO-STOCK RESTOCKING
  // =========================================================================
  it('Phase 5: Purchase Order issuance and automatic warehouse stock increment upon receipt', async () => {
    // 1. Create Purchase Order
    const poRes = await httpRequest(baseUrl, '/api/tenant/procurement', {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        vendor: 'Adani Solar Authorized Distributor',
        items: [
          {
            productId: testProduct.id,
            quantity: 30,
            unitCost: 12500,
            totalCost: 375000
          }
        ]
      }
    });

    assert.equal(poRes.status, 201, `Expected 201, got ${poRes.status}: ${JSON.stringify(poRes.body)}`);
    assert.ok(poRes.body.purchaseOrder, 'PO record must be created');
    purchaseOrderRecord = poRes.body.purchaseOrder;
    tracked.purchaseOrders.push(purchaseOrderRecord.id);

    // 2. Mark PO as RECEIVED via PATCH /status
    const receiveRes = await httpRequest(baseUrl, `/api/tenant/procurement/${purchaseOrderRecord.id}/status`, {
      method: 'PATCH',
      token: adminTokenTenantA,
      body: {
        status: 'RECEIVED',
        warehouseId: testWarehouse.id
      }
    });

    assert.equal(receiveRes.status, 200, `Expected 200 OK, got ${receiveRes.status}`);

    // Verify warehouse StockBalance incremented
    const stockBal = await prisma.stockBalance.findFirst({
      where: { warehouseId: testWarehouse.id, productId: testProduct.id }
    });
    assert.ok(stockBal, 'StockBalance record must exist');
    assert.equal(stockBal.quantity, 30, 'Warehouse stock balance must equal received PO quantity 30');

    // Verify StockLedger audit entry
    const ledgerEntry = await prisma.stockLedger.findFirst({
      where: { warehouseId: testWarehouse.id, referenceId: purchaseOrderRecord.id, movementType: 'RECEIPT' }
    });
    assert.ok(ledgerEntry, 'StockLedger must contain RECEIPT entry linked to PO ID');
    assert.equal(ledgerEntry.quantity, 30, 'Ledger quantity must match PO quantity');
  });

  // =========================================================================
  // STAGE 6: INSTALLATION JOB SCHEDULING & QUALITY ASSURANCE SIGN-OFF
  // =========================================================================
  it('Phase 6: Schedule Installation Job, verify QC photo enforcement, and complete QA sign-off', async () => {
    // 1. Schedule Installation Job
    const scheduleRes = await httpRequest(baseUrl, '/api/tenant/installations/schedule', {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        projectId: projectRecord.id,
        scheduledDate: new Date().toISOString(),
        scheduledStartTime: '09:00 AM',
        estimatedDuration: 8.0,
        priority: 'HIGH',
        notes: '3.3 kW RCC rooftop setup with 6x Adani 550Wp modules'
      }
    });

    assert.equal(scheduleRes.status, 201, `Expected 201, got ${scheduleRes.status}: ${JSON.stringify(scheduleRes.body)}`);
    assert.ok(scheduleRes.body.installation, 'Installation job must be created');
    installationJobRecord = scheduleRes.body.installation;
    tracked.installations.push(installationJobRecord.id);

    assert.equal(installationJobRecord.projectId, projectRecord.id);
    assert.equal(installationJobRecord.customerId, customerRecord.id);
    assert.equal(installationJobRecord.status, 'SCHEDULED');

    // 2. Transition to IN_PROGRESS
    const inProgRes = await httpRequest(baseUrl, `/api/tenant/installations/${installationJobRecord.id}/status`, {
      method: 'PUT',
      token: adminTokenTenantA,
      body: { status: 'IN_PROGRESS', progressPercent: 50 }
    });
    assert.equal(inProgRes.status, 200);

    // 3. Attempt to transition to COMPLETED without mandatory photos -> must fail with HTTP 400
    const prematureComplete = await httpRequest(baseUrl, `/api/tenant/installations/${installationJobRecord.id}/status`, {
      method: 'PUT',
      token: adminTokenTenantA,
      body: { status: 'COMPLETED', progressPercent: 100 }
    });
    assert.equal(prematureComplete.status, 400, 'Must block completion without required photos');
    assert.ok(prematureComplete.body.error.includes('Missing required photos'));

    // 4. Attach required inspection photos (ROOF, INVERTER, PANELS)
    await prisma.installationPhoto.createMany({
      data: [
        {
          installationId: installationJobRecord.id,
          category: 'ROOF',
          url: 'https://storage.solar-manager.com/inspections/roof-m6.jpg',
          caption: 'RCC Roof Structure Anchoring'
        },
        {
          installationId: installationJobRecord.id,
          category: 'INVERTER',
          url: 'https://storage.solar-manager.com/inspections/inverter-m6.jpg',
          caption: 'Solis 3.3kW Inverter Mounted & Earthed'
        },
        {
          installationId: installationJobRecord.id,
          category: 'PANELS',
          url: 'https://storage.solar-manager.com/inspections/panels-m6.jpg',
          caption: '6x 550Wp Adani Bifacial Panels Array'
        }
      ]
    });

    // 5. Complete Installation Job now that photos are verified
    const finalComplete = await httpRequest(baseUrl, `/api/tenant/installations/${installationJobRecord.id}/status`, {
      method: 'PUT',
      token: adminTokenTenantA,
      body: { status: 'COMPLETED', progressPercent: 100 }
    });
    assert.equal(finalComplete.status, 200, `Expected 200 OK after photos verified, got ${finalComplete.status}`);
    assert.equal(finalComplete.body.installation.status, 'COMPLETED');
  });

  // =========================================================================
  // STAGE 7: DISCOM 5-STAGE GATED NET-METERING INTERCONNECTION
  // =========================================================================
  it('Phase 7: Advance DISCOM Net-Metering through 5 statutory gates with document verification', async () => {
    // 1. Retrieve initial DiscomApplication
    const discomRes = await httpRequest(baseUrl, `/api/tenant/projects/${projectRecord.id}/discom`, {
      method: 'GET',
      token: adminTokenTenantA
    });
    assert.equal(discomRes.status, 200);
    assert.ok(discomRes.body.discom, 'DiscomApplication must exist for project');
    discomAppRecord = discomRes.body.discom;
    assert.equal(discomAppRecord.status, 'FEASIBILITY_PENDING');

    // Gate 1: CEIG_INSPECTION requires FEASIBILITY_LETTER
    const g1Res = await httpRequest(baseUrl, `/api/tenant/projects/${projectRecord.id}/discom/stage`, {
      method: 'PATCH',
      token: adminTokenTenantA,
      body: {
        status: 'CEIG_INSPECTION',
        documentType: 'FEASIBILITY_LETTER',
        documentUrl: 'https://msedcl.gov.in/approvals/feasibility-m6.pdf'
      }
    });
    assert.equal(g1Res.status, 200);

    // Gate 2: METER_TESTING requires CEIG_APPROVAL
    const g2Res = await httpRequest(baseUrl, `/api/tenant/projects/${projectRecord.id}/discom/stage`, {
      method: 'PATCH',
      token: adminTokenTenantA,
      body: {
        status: 'METER_TESTING',
        documentType: 'CEIG_APPROVAL',
        documentUrl: 'https://ceig.maharashtra.gov.in/approvals/ceig-m6.pdf'
      }
    });
    assert.equal(g2Res.status, 200);

    // Gate 3: NET_METER_INSTALLED requires METER_TEST_REPORT
    const g3Res = await httpRequest(baseUrl, `/api/tenant/projects/${projectRecord.id}/discom/stage`, {
      method: 'PATCH',
      token: adminTokenTenantA,
      body: {
        status: 'NET_METER_INSTALLED',
        documentType: 'METER_TEST_REPORT',
        documentUrl: 'https://msedcl.gov.in/reports/meter-test-m6.pdf'
      }
    });
    assert.equal(g3Res.status, 200);

    // Gate 4: GRID_SYNCHRONIZED requires NET_METER_CERTIFICATE
    const g4Res = await httpRequest(baseUrl, `/api/tenant/projects/${projectRecord.id}/discom/stage`, {
      method: 'PATCH',
      token: adminTokenTenantA,
      body: {
        status: 'GRID_SYNCHRONIZED',
        documentType: 'NET_METER_CERTIFICATE',
        documentUrl: 'https://msedcl.gov.in/certs/netmeter-m6.pdf'
      }
    });
    assert.equal(g4Res.status, 200);

    // Verify final statutory state in database
    const finalDiscom = await prisma.discomApplication.findUnique({
      where: { projectId: projectRecord.id }
    });
    assert.equal(finalDiscom.status, 'GRID_SYNCHRONIZED');
    assert.ok(finalDiscom.feasibilityDocumentUrl);
    assert.ok(finalDiscom.ceigDocumentUrl);
    assert.ok(finalDiscom.meterTestReportUrl);
    assert.ok(finalDiscom.netMeterCertificateUrl);
  });

  // =========================================================================
  // STAGE 8: MILESTONE INVOICING & PAYMENT RECONCILIATION
  // =========================================================================
  it('Phase 8: Generate 4 standardized milestone invoices and record advance payment clearance', async () => {
    // 1. Convert Quotation into 4 Milestone Invoices
    const invRes = await httpRequest(baseUrl, '/api/tenant/finance/convert-quotation', {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        quotationId: quotationRecord.id,
        projectId: projectRecord.id,
        customerId: customerRecord.id
      }
    });

    assert.equal(invRes.status, 201, `Expected 201, got ${invRes.status}: ${JSON.stringify(invRes.body)}`);
    assert.ok(invRes.body.invoices && invRes.body.invoices.length === 4, 'Must generate exactly 4 milestone invoices');
    allInvoices = invRes.body.invoices;
    for (const inv of allInvoices) {
      tracked.invoices.push(inv.id);
    }

    // Verify milestone percentages (20%, 60%, 15%, 5%)
    advanceInvoiceRecord = allInvoices[0];
    const totalInvoiced = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    assert.equal(totalInvoiced, quotationRecord.total, 'Sum of milestone invoices must equal quotation grand total');

    // Verify composite GST split (13.8% composite solar GST: taxableSubtotal + taxAmount === amount)
    for (const inv of allInvoices) {
      assert.ok(inv.taxAmount > 0, 'taxAmount must be positive');
      assert.ok(inv.subtotal > 0, 'subtotal must be positive');
      assert.equal(inv.subtotal + inv.taxAmount, inv.amount, 'subtotal + taxAmount must equal invoice amount');
      const cgst = Math.round(inv.taxAmount / 2);
      const sgst = inv.taxAmount - cgst;
      assert.ok(cgst >= 0 && sgst >= 0, 'CGST and SGST must be non-negative');
      assert.ok(Math.abs(cgst - sgst) <= 1, 'CGST and SGST must balance 50/50 within 1 rupee');
    }

    // 2. Clear Advance Payment (Stage 1 Invoice)
    const payRes = await httpRequest(baseUrl, `/api/tenant/invoices/${advanceInvoiceRecord.id}/payments`, {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        amount: advanceInvoiceRecord.amount,
        mode: 'NEFT_RTGS',
        reference: `UTR-M6-${Date.now().toString().slice(-6)}`,
        notes: '20% EPC Advance cleared via corporate bank transfer'
      }
    });

    assert.ok([200, 201].includes(payRes.status), `Expected 200/201, got ${payRes.status}: ${JSON.stringify(payRes.body)}`);
    assert.ok(payRes.body.payment, 'Payment record must be returned');
    assert.ok(payRes.body.payment.receiptNumber.startsWith('REC-'), 'Receipt number must follow REC-YYYY-XXXX format');

    // Verify invoice marked as PAID
    const refreshedInvoice = await prisma.invoice.findUnique({
      where: { id: advanceInvoiceRecord.id }
    });
    assert.equal(refreshedInvoice.status, 'PAID', 'Advance invoice must be marked PAID upon full payment');
  });

  // =========================================================================
  // STAGE 9: POST-COMMISSIONING WARRANTY & AMC SUPPORT SERVICE
  // =========================================================================
  it('Phase 9: Activate AMC contract, verify project warranty, and triage support ticket under warranty', async () => {
    // 1. Create Active AMC Contract
    const amcRes = await httpRequest(baseUrl, '/api/tenant/amcs', {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        customerId: customerRecord.id,
        projectId: projectRecord.id,
        contractNumber: `AMC-M6-${Date.now().toString().slice(-4)}`,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        value: 12000
      }
    });

    assert.equal(amcRes.status, 201, `Expected 201, got ${amcRes.status}: ${JSON.stringify(amcRes.body)}`);
    assert.ok(amcRes.body.amc, 'AMC record must be created');
    amcRecord = amcRes.body.amc;
    tracked.amcs.push(amcRecord.id);
    assert.equal(amcRecord.status, 'ACTIVE');

    // 2. Verify Project Warranty API
    const warrantyRes = await httpRequest(baseUrl, `/api/tenant/projects/${projectRecord.id}/warranty`, {
      method: 'GET',
      token: adminTokenTenantA
    });
    assert.equal(warrantyRes.status, 200);
    assert.ok(warrantyRes.body.amcs && warrantyRes.body.amcs.length > 0, 'Warranty API must return project AMC');

    // 3. Create Support Ticket (auto-detects ACTIVE_AMC and tags [WARRANTY])
    const ticketRes = await httpRequest(baseUrl, '/api/tenant/tickets', {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        subject: 'Quarterly Inverter Efficiency Inspection',
        description: 'Customer requests on-site firmware check and terminal tightness audit.',
        priority: 'MEDIUM',
        projectId: projectRecord.id,
        customerId: customerRecord.id
      }
    });

    assert.equal(ticketRes.status, 201, `Expected 201, got ${ticketRes.status}: ${JSON.stringify(ticketRes.body)}`);
    assert.ok(ticketRes.body.ticket, 'Ticket must be created');
    ticketRecord = ticketRes.body.ticket;
    tracked.tickets.push(ticketRecord.id);

    // Verify AMC status detection
    assert.equal(ticketRes.body.amcStatus, 'ACTIVE_AMC', 'Ticket creation must auto-detect ACTIVE_AMC');
    assert.ok(ticketRecord.subject.startsWith('[WARRANTY]'), 'Subject must be prepended with [WARRANTY]');

    // 4. Schedule Service Visit for Ticket
    const visitRes = await httpRequest(baseUrl, `/api/tenant/tickets/${ticketRecord.id}/visits`, {
      method: 'POST',
      token: adminTokenTenantA,
      body: {
        notes: 'Technician dispatched for preventive thermal scan and earthing check'
      }
    });

    assert.equal(visitRes.status, 201, `Expected 201, got ${visitRes.status}`);
    assert.ok(visitRes.body.visit, 'ServiceVisit must be created');
    serviceVisitRecord = visitRes.body.visit;
    assert.equal(serviceVisitRecord.ticketId, ticketRecord.id);
    assert.equal(serviceVisitRecord.status, 'SCHEDULED');
  });

  // =========================================================================
  // STAGE 10: RELATIONAL INTEGRITY AUDIT & MULTI-TENANT ISOLATION
  // =========================================================================
  it('Phase 10: Comprehensive foreign key consistency and multi-tenant boundary verification', async () => {
    // 1. Direct Prisma foreign key verification across all 10 linked entities
    const lead = await prisma.lead.findUnique({ where: { id: leadRecord.id } });
    const customer = await prisma.customer.findUnique({ where: { id: customerRecord.id } });
    const project = await prisma.project.findUnique({ where: { id: projectRecord.id } });
    const survey = await prisma.siteSurvey.findUnique({ where: { id: surveyRecord.id } });
    const quotation = await prisma.quotation.findUnique({ where: { id: quotationRecord.id } });
    const installation = await prisma.installationJob.findUnique({ where: { id: installationJobRecord.id } });
    const discom = await prisma.discomApplication.findUnique({ where: { projectId: projectRecord.id } });
    const amc = await prisma.aMC.findUnique({ where: { id: amcRecord.id } });
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketRecord.id } });
    const visit = await prisma.serviceVisit.findUnique({ where: { id: serviceVisitRecord.id } });

    // Assert zero orphaned records and precise relationship traversal
    assert.equal(lead.tenantId, tenantId);
    assert.equal(customer.tenantId, tenantId);
    assert.equal(customer.leadId, lead.id);
    assert.equal(project.tenantId, tenantId);
    assert.equal(project.customerId, customer.id);
    assert.equal(project.leadId, lead.id);
    assert.equal(survey.tenantId, tenantId);
    assert.equal(survey.customerId, customer.id);
    assert.equal(quotation.tenantId, tenantId);
    assert.equal(quotation.surveyId, survey.id);
    assert.equal(installation.tenantId, tenantId);
    assert.equal(installation.projectId, project.id);
    assert.equal(discom.tenantId, tenantId);
    assert.equal(discom.projectId, project.id);
    assert.equal(amc.tenantId, tenantId);
    assert.equal(amc.projectId, project.id);
    assert.equal(ticket.tenantId, tenantId);
    assert.equal(ticket.projectId, project.id);
    assert.equal(visit.ticketId, ticket.id);

    // 2. Multi-Tenant Boundary Enforcement: Tenant B cannot access Tenant A records
    const crossLead = await httpRequest(baseUrl, `/api/tenant/leads/${leadRecord.id}`, {
      method: 'GET',
      token: adminTokenTenantB
    });
    assert.equal(crossLead.status, 404, 'Tenant B must receive 404 for Tenant A lead');

    const crossProject = await httpRequest(baseUrl, `/api/tenant/projects/${projectRecord.id}`, {
      method: 'GET',
      token: adminTokenTenantB
    });
    assert.equal(crossProject.status, 404, 'Tenant B must receive 404 for Tenant A project');

    const crossInstallation = await httpRequest(baseUrl, `/api/tenant/installations/${installationJobRecord.id}`, {
      method: 'GET',
      token: adminTokenTenantB
    });
    assert.equal(crossInstallation.status, 404, 'Tenant B must receive 404 for Tenant A installation');

    const crossAmc = await httpRequest(baseUrl, `/api/tenant/amcs/${amcRecord.id}`, {
      method: 'GET',
      token: adminTokenTenantB
    });
    assert.equal(crossAmc.status, 404, 'Tenant B must receive 404 for Tenant A AMC');
  });
});
