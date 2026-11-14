/**
 * 1-Flow Seamless Solar Journey E2E Integration Test Suite
 * Tests the entire 1-Flow pipeline:
 * 1. Capture Lead with statutory survey parameters (Step 1-5)
 * 2. Dispatch Proposal & Update Pipeline Stage (Step 8)
 * 3. Convert Lead to active Customer & Project with DBT bank details & statutory hardware (Step 10-13)
 * 4. Finance Invoice Creation for Advance Booking Token with Project linking (Step 14)
 * 5. Record Token Payment in Ledger & Verify Status Transitions to PAID (Step 14)
 * 6. Advance Project to DISCOM Net-Metering Stage with WCR verification (Step 15)
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../db');
const {
  startTestServer,
  httpRequest,
  createToken,
  TEST_FIXTURES
} = require('./e2e/testHelper');

describe('1-Flow Seamless Solar Journey Lifecycle Suite', () => {
  let serverInstance;
  let baseUrl;
  let adminToken;
  const tenantId = TEST_FIXTURES.tenantA.id;
  const tracked = {
    leads: [],
    customers: [],
    projects: [],
    invoices: [],
    payments: []
  };

  const testMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  let createdLead = null;
  let convertedProject = null;
  let convertedCustomer = null;
  let tokenInvoice = null;

  before(async () => {
    serverInstance = await startTestServer();
    baseUrl = serverInstance.baseUrl;
    adminToken = createToken({
      userId: TEST_FIXTURES.tenantA.adminUser.id,
      tenantId,
      role: 'TENANT_ADMIN',
      permissions: ['*']
    });
  });

  after(async () => {
    // Clean up created entities
    for (const invId of tracked.invoices) {
      await prisma.payment.deleteMany({ where: { invoiceId: invId } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { id: invId } }).catch(() => {});
    }
    for (const prjId of tracked.projects) {
      await prisma.projectTimelineEvent.deleteMany({ where: { projectId: prjId } }).catch(() => {});
      await prisma.projectTask.deleteMany({ where: { projectId: prjId } }).catch(() => {});
      await prisma.discomApplication.deleteMany({ where: { projectId: prjId } }).catch(() => {});
      await prisma.subsidyApplication.deleteMany({ where: { projectId: prjId } }).catch(() => {});
      await prisma.siteSurvey.deleteMany({ where: { Project: { some: { id: prjId } } } }).catch(() => {});
      await prisma.project.deleteMany({ where: { id: prjId } }).catch(() => {});
    }
    for (const custId of tracked.customers) {
      await prisma.customer.deleteMany({ where: { id: custId } }).catch(() => {});
    }
    for (const leadId of tracked.leads) {
      await prisma.leadActivity.deleteMany({ where: { leadId } }).catch(() => {});
      await prisma.lead.deleteMany({ where: { id: leadId } }).catch(() => {});
    }
    if (serverInstance?.close) {
      await serverInstance.close();
    }
    await prisma.$disconnect().catch(() => {});
  });

  it('Step 1-5: 1-Flow Lead Capture saves full statutory parameters', async () => {
    const leadPayload = {
      name: 'Ramesh Patil 1-Flow Test',
      mobile: testMobile,
      address: 'Flat 402, Shanti Heights, Baner Road',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      latitude: 18.5590,
      longitude: 73.7868,
      consumerNumber: '410010537316',
      sanctionedLoad: 5.0,
      phase: 'Three Phase',
      roofType: 'Flat RCC Concrete',
      monthlyBill: 6000,
      estimatedCap: 5.0,
      notes: 'Roof: Flat RCC Concrete, Modules: Waaree 540Wp Mono PERC DCR × 10, Inverter: Solis 5.0kW Three Phase',
      forceCreate: true
    };

    const res = await httpRequest(baseUrl, '/api/tenant/leads', {
      method: 'POST',
      token: adminToken,
      body: leadPayload
    });

    assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.ok(res.body.lead?.id, 'Lead ID should be returned');
    createdLead = res.body.lead;
    tracked.leads.push(createdLead.id);

    assert.equal(createdLead.name, 'Ramesh Patil 1-Flow Test');
    assert.equal(createdLead.mobile, testMobile);
    assert.equal(createdLead.estimatedCap, 5.0);
    assert.equal(createdLead.electricityConnection, '410010537316');
  });

  it('Step 8: 1-Flow advances Lead stage to PROPOSAL_SENT', async () => {
    assert.ok(createdLead?.id, 'Lead must exist');

    const res = await httpRequest(baseUrl, `/api/tenant/leads/${createdLead.id}/stage`, {
      method: 'PATCH',
      token: adminToken,
      body: { stage: 'PROPOSAL_SENT' }
    });

    assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.lead?.status, 'PROPOSAL_SENT');
  });

  it('Step 10-13: 1-Flow converts Lead to Customer & Project with full DBT & statutory data', async () => {
    assert.ok(createdLead?.id, 'Lead must exist');

    const convertPayload = {
      customerName: 'Ramesh Patil 1-Flow Test',
      mobile: testMobile,
      address: 'Flat 402, Shanti Heights, Baner Road',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      capacity: 5.0,
      estimatedValue: 285000,
      latitude: 18.5590,
      longitude: 73.7868,
      consumerNumber: '410010537316',
      sanctionedLoad: 5.0,
      phase: 'Three Phase',
      roofType: 'Flat RCC Concrete',
      bankName: 'State Bank of India',
      accountNumber: '38192049102',
      ifscCode: 'SBIN0000455',
      bankBranch: 'Pune Main Branch',
      signatureSvg: 'M 10 10 L 50 50'
    };

    const res = await httpRequest(baseUrl, `/api/tenant/leads/${createdLead.id}/convert`, {
      method: 'POST',
      token: adminToken,
      body: convertPayload
    });

    assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.ok(res.body.project?.id, 'Provisioned Project ID should be returned');
    assert.ok(res.body.customer?.id, 'Provisioned Customer ID should be returned');

    convertedProject = res.body.project;
    convertedCustomer = res.body.customer;
    tracked.projects.push(convertedProject.id);
    tracked.customers.push(convertedCustomer.id);

    // Verify Project Details
    assert.equal(convertedProject.capacity, 5.0);
    assert.equal(convertedProject.estimatedValue, 285000);
    assert.equal(convertedProject.consumerNumber, '410010537316');

    // Verify Site Survey created with matching parameters
    const survey = await prisma.siteSurvey.findFirst({
      where: { leadId: createdLead.id, tenantId }
    });
    assert.ok(survey, 'SiteSurvey should be created');
    assert.equal(survey.discomConsumerNo, '410010537316');
    assert.equal(survey.sanctionedLoad, 5.0);
    assert.equal(survey.electricalPhase, 'Three Phase');
    assert.equal(survey.roofType, 'Flat RCC Concrete');

    // Verify Subsidy Application with DBT Bank Details
    const subsidy = await prisma.subsidyApplication.findFirst({
      where: { projectId: convertedProject.id, tenantId }
    });
    assert.ok(subsidy, 'SubsidyApplication should be created');
    assert.equal(subsidy.bankName, 'State Bank of India');
    assert.equal(subsidy.accountNumber, '38192049102');
    assert.equal(subsidy.ifscCode, 'SBIN0000455');
    assert.equal(subsidy.proposedCapacity, 5.0);
  });

  it('Step 14: 1-Flow generates Turnkey EPC Invoice with Total Contract Value linked to Project', async () => {
    assert.ok(convertedProject?.id, 'Project must exist');

    const totalTurnkeyAmount = 285000;
    const baseTaxable = Math.round(totalTurnkeyAmount / 1.138);
    const gstAmount = totalTurnkeyAmount - baseTaxable;

    const invoicePayload = {
      customerId: convertedCustomer.id,
      customerName: 'Ramesh Patil 1-Flow Test',
      mobile: testMobile,
      projectId: convertedProject.id,
      milestone: 'TOTAL_CONTRACT',
      milestoneTitle: 'Solar EPC Turnkey Contract (5.0 kWp On-Grid)',
      subtotal: baseTaxable,
      taxRate: 13.8,
      taxAmount: gstAmount,
      amount: totalTurnkeyAmount,
      notes: `Total Contract: ₹${totalTurnkeyAmount}, First Advance: ₹25000, Remaining Balance: ₹260000. Mobile: ${testMobile}, Mode: UPI`
    };

    const res = await httpRequest(baseUrl, '/api/tenant/finance', {
      method: 'POST',
      token: adminToken,
      body: invoicePayload
    });

    assert.equal(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.ok(res.body.invoice?.id, 'Invoice ID must be returned');
    assert.ok(res.body.invoice?.invoiceNumber, 'Invoice number must be generated');

    tokenInvoice = res.body.invoice;
    tracked.invoices.push(tokenInvoice.id);

    assert.equal(tokenInvoice.amount, 285000, 'Total contract amount must be 285,000');
    assert.equal(tokenInvoice.milestone, 'TOTAL_CONTRACT');
    assert.equal(tokenInvoice.projectId, convertedProject.id);
    assert.equal(tokenInvoice.status, 'UNPAID');
  });

  it('Step 14: 1-Flow records first advance in ledger with Remaining Balance and transitions Invoice to PARTIAL', async () => {
    assert.ok(tokenInvoice?.id, 'Invoice must exist');

    const firstAdvanceAmount = 25000;
    const paymentPayload = {
      amount: firstAdvanceAmount,
      mode: 'UPI',
      reference: 'UPI-REF-9928172',
      notes: 'First advance booking token received via 1-Flow onboarding. Remaining Balance: ₹260000',
      date: new Date().toISOString()
    };

    const res = await httpRequest(baseUrl, `/api/tenant/invoices/${tokenInvoice.id}/payments`, {
      method: 'POST',
      token: adminToken,
      body: paymentPayload
    });

    assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.ok(res.body.payment?.receiptNumber, 'Payment receipt number must be generated');
    assert.equal(res.body.payment?.amount, 25000, 'First advance payment must be recorded as 25,000');
    assert.equal(res.body.invoice?.status, 'PARTIAL', 'Invoice status must transition to PARTIAL');

    // Verify invoice list from finance API reflects Total Amount, First Advance & Remaining Balance
    const finRes = await httpRequest(baseUrl, '/api/tenant/finance', {
      method: 'GET',
      token: adminToken
    });
    assert.equal(finRes.status, 200);
    const invoiceList = Array.isArray(finRes.body.finance) ? finRes.body.finance : (finRes.body.invoices || []);
    const matched = invoiceList.find((inv) => inv.id === tokenInvoice.id);
    assert.ok(matched, 'Invoice must appear in Finance');
    assert.equal(matched.amount, 285000, 'Finance must show Total Contract Amount 285,000');
    assert.equal(matched.totalPaid, 25000, 'Finance must show First Advance 25,000');
    assert.equal(matched.balance, 260000, 'Finance must show Remaining Balance 260,000');
    assert.equal(matched.computedStatus, 'PARTIAL', 'Finance must compute status as PARTIAL');
  });

  it('Step 15: 1-Flow advances Project to NET_METERING stage for DISCOM dossier', async () => {
    assert.ok(convertedProject?.id, 'Project must exist');

    const res = await httpRequest(baseUrl, `/api/tenant/projects/${convertedProject.id}/stage`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        stage: 'NET_METERING',
        note: 'DISCOM WCR Statutory Dossier Generated via 1-Flow',
        force: true
      }
    });

    assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.project?.currentStage, 'NET_METERING', 'Project stage must be NET_METERING');
  });

  it('Step 16: Mobile Field Cockpit advances Project from NET_METERING to INSPECTION', async () => {
    assert.ok(convertedProject?.id, 'Project must exist');

    const res = await httpRequest(baseUrl, `/api/tenant/projects/${convertedProject.id}/stage`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        stage: 'INSPECTION',
        note: 'Advanced to 6. Inspection & QA via Mobile Field Cockpit'
      }
    });

    assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.project?.currentStage, 'INSPECTION');
    assert.equal(res.body.project?.progressPercent, 90);
  });

  it('Step 17: Mobile Field Cockpit advances Project from INSPECTION to HANDOVER (Completion)', async () => {
    assert.ok(convertedProject?.id, 'Project must exist');

    const res = await httpRequest(baseUrl, `/api/tenant/projects/${convertedProject.id}/stage`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        stage: 'HANDOVER',
        note: 'Advanced to 7. Handover & DBT via Mobile Field Cockpit'
      }
    });

    assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.project?.currentStage, 'HANDOVER');
    assert.equal(res.body.project?.status, 'Completed');
    assert.equal(res.body.project?.progressPercent, 100);
  });
});
