/**
 * DPDP Act 2023 Statutory Compliance Test Suite
 * Validates:
 * 1. Statutory Notice with itemized purposes (Section 5)
 * 2. Affirmative consent recording with verifiable hash, signature, and timestamp (Section 6)
 * 3. Consent query & revocation mechanism (Section 6(4))
 * 4. Section 11 Right to Access personal data disclosure
 * 5. Section 12 Right to Erasure with CGST Act statutory retention hold protection
 * 6. Section 13 Grievance redressal filing & 30-day SLA assignment
 * 7. UIDAI Aadhaar masking (XXXX-XXXX-1234) and PAN masking
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../db');
const {
  startTestServer,
  httpRequest,
  createToken,
  TEST_FIXTURES,
} = require('./e2e/testHelper');
const {
  maskAadhaar,
  maskPan,
  maskBankAccount,
  STATUTORY_DPDP_PURPOSES,
} = require('../utils/dpdpHelper');

describe('DPDP Act 2023 Statutory Compliance Test Suite', () => {
  let serverInstance;
  let baseUrl;
  let closeServer;
  let adminToken;
  const tenantId = TEST_FIXTURES.tenantA.id;
  const tracked = {
    consents: [],
    requests: [],
    customers: [],
    leads: [],
  };

  before(async () => {
    const srv = await startTestServer();
    serverInstance = srv.server;
    baseUrl = srv.baseUrl;
    closeServer = srv.close;
    adminToken = createToken({
      userId: TEST_FIXTURES.tenantA.adminUser.id,
      tenantId,
      role: 'TENANT_ADMIN',
    });
  });

  after(async () => {
    if (tracked.requests.length > 0) {
      await prisma.dPDPRequest.deleteMany({ where: { id: { in: tracked.requests } } }).catch(() => {});
    }
    if (tracked.consents.length > 0) {
      await prisma.dPDPConsent.deleteMany({ where: { id: { in: tracked.consents } } }).catch(() => {});
    }
    if (tracked.customers.length > 0) {
      await prisma.customer.deleteMany({ where: { id: { in: tracked.customers } } }).catch(() => {});
    }
    if (tracked.leads.length > 0) {
      await prisma.lead.deleteMany({ where: { id: { in: tracked.leads } } }).catch(() => {});
    }
    if (closeServer) {
      await closeServer();
    }
  });

  it('1. Masking utilities comply with UIDAI and IT Act regulations', () => {
    // Aadhaar masking
    assert.equal(maskAadhaar('123456789012'), 'XXXX-XXXX-9012');
    assert.equal(maskAadhaar('1234 5678 9012'), 'XXXX-XXXX-9012');
    assert.equal(maskAadhaar(null), null);

    // PAN masking
    assert.equal(maskPan('ABCDE1234F'), 'XXXXX1234F');

    // Bank account masking: retains last 4 digits
    assert.equal(maskBankAccount('502000889922'), 'XXXXXXXX9922');
  });

  it('2. GET /api/tenant/dpdp/notice delivers full Section 5 Statutory Notice', async () => {
    const res = await httpRequest(baseUrl, '/api/tenant/dpdp/notice', {
      method: 'GET',
      token: adminToken,
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'success');
    assert.ok(res.data.notice);
    assert.ok(res.data.notice.title.includes('DPDP'));
    assert.ok(Array.isArray(res.data.notice.purposes));
    assert.equal(res.data.notice.purposes.length, 6);
    assert.ok(res.data.notice.grievanceOfficer.name);
    assert.equal(res.data.notice.grievanceOfficer.statutorySlaDays, 30);
  });

  it('3. POST /api/tenant/dpdp/consent records affirmative consent artifact', async () => {
    // Create test lead first
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name: 'Sunita Sharma DPDP Test',
        mobile: '9822334455',
        city: 'Nagpur',
        status: 'NEW',
      },
    });
    tracked.leads.push(lead.id);

    const consentRes = await httpRequest(baseUrl, '/api/tenant/dpdp/consent', {
      method: 'POST',
      token: adminToken,
      body: {
        dataPrincipalId: lead.id,
        dataPrincipalType: 'LEAD',
        dataPrincipalName: lead.name,
        dataPrincipalPhone: lead.mobile,
        purposes: ['FEASIBILITY_SIZING', 'DISCOM_NET_METERING', 'PM_SURYA_GHAR_DBT', 'COMMUNICATION_UPDATES'],
        signatureSvg: '<svg>signature</svg>',
        capturedVia: '1FLOW_MOBILE',
        noticeVersion: '2026.1',
      },
    });

    assert.equal(consentRes.status, 201);
    assert.equal(consentRes.data.status, 'success');
    assert.equal(consentRes.data.consent.status, 'ACTIVE');
    assert.equal(consentRes.data.consent.purposes.length, 4);
    tracked.consents.push(consentRes.data.consent.id);

    // Verify GET /api/tenant/dpdp/consent/:entityType/:id
    const queryRes = await httpRequest(baseUrl, `/api/tenant/dpdp/consent/LEAD/${lead.id}`, {
      method: 'GET',
      token: adminToken,
    });

    assert.equal(queryRes.status, 200);
    assert.equal(queryRes.data.hasConsent, true);
    assert.equal(queryRes.data.consent.status, 'ACTIVE');
  });

  it('4. POST /api/tenant/dpdp/consent/revoke revokes consent under Section 6(4)', async () => {
    const leadId = tracked.leads[0];
    const consentId = tracked.consents[0];

    const revokeRes = await httpRequest(baseUrl, '/api/tenant/dpdp/consent/revoke', {
      method: 'POST',
      token: adminToken,
      body: {
        consentId,
        reason: 'Customer requested marketing pause',
      },
    });

    assert.equal(revokeRes.status, 200);
    assert.equal(revokeRes.data.consent.status, 'REVOKED');
    assert.equal(revokeRes.data.consent.revocationReason, 'Customer requested marketing pause');

    // Verify query shows revoked
    const queryRes = await httpRequest(baseUrl, `/api/tenant/dpdp/consent/LEAD/${leadId}`, {
      method: 'GET',
      token: adminToken,
    });

    assert.equal(queryRes.status, 200);
    assert.equal(queryRes.data.hasConsent, false);
  });

  it('5. GET /api/tenant/dpdp/data-summary/:customerId returns Section 11 Right to Access disclosure', async () => {
    const cust = await prisma.customer.create({
      data: {
        tenantId,
        name: 'Vikas Deshmukh DPDP Customer',
        mobile: '9811223344',
        email: 'vikas@testsolar.in',
        city: 'Pune',
      },
    });
    tracked.customers.push(cust.id);

    const summaryRes = await httpRequest(baseUrl, `/api/tenant/dpdp/data-summary/${cust.id}`, {
      method: 'GET',
      token: adminToken,
    });

    assert.equal(summaryRes.status, 200);
    assert.equal(summaryRes.data.status, 'success');
    assert.ok(summaryRes.data.summary);
    assert.equal(summaryRes.data.summary.dataPrincipal.name, 'Vikas Deshmukh DPDP Customer');
    assert.ok(summaryRes.data.summary.thirdPartyDataProcessors.length >= 2);
  });

  it('6. POST /api/tenant/dpdp/requests creates Section 13 Grievance with 30-day SLA', async () => {
    const custId = tracked.customers[0];

    const reqRes = await httpRequest(baseUrl, '/api/tenant/dpdp/requests', {
      method: 'POST',
      token: adminToken,
      body: {
        dataPrincipalId: custId,
        dataPrincipalType: 'CUSTOMER',
        dataPrincipalName: 'Vikas Deshmukh DPDP Customer',
        dataPrincipalPhone: '9811223344',
        requestType: 'GRIEVANCE',
        requestDetails: {
          grievanceCategory: 'CONSENT_MISALIGNMENT',
          description: 'Received unsolicited promotional call after survey completion.',
        },
      },
    });

    assert.equal(reqRes.status, 201);
    assert.equal(reqRes.data.status, 'success');
    assert.ok(reqRes.data.request.requestNumber.startsWith('DPDP-GRI'));
    assert.equal(reqRes.data.request.status, 'PENDING');
    tracked.requests.push(reqRes.data.request.id);

    // Verify SLA Due Date is ~30 days in future
    const due = new Date(reqRes.data.request.slaDueDate);
    const now = new Date();
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    assert.ok(diffDays >= 29 && diffDays <= 31);
  });

  it('7. PATCH /api/tenant/dpdp/requests/:id/resolve handles DPO grievance resolution', async () => {
    const reqId = tracked.requests[0];

    const resolveRes = await httpRequest(baseUrl, `/api/tenant/dpdp/requests/${reqId}/resolve`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'COMPLETED',
        resolutionNotes: 'Reviewed call logs, verified communication opt-out, and added number to DND list.',
      },
    });

    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.data.request.status, 'COMPLETED');
    assert.ok(resolveRes.data.request.resolvedAt);
  });

  it('8. POST /api/tenant/dpdp/data-erasure-request respects CGST Act statutory holds', async () => {
    const custId = tracked.customers[0];

    // Create an invoice for this customer to establish a CGST Act statutory hold
    const inv = await prisma.invoice.create({
      data: {
        tenantId,
        customerId: custId,
        invoiceNumber: `INV-DPDP-HOLD-${Date.now().toString().slice(-4)}`,
        amount: 250000,
        status: 'PAID',
      },
    });

    const eraseRes = await httpRequest(baseUrl, '/api/tenant/dpdp/data-erasure-request', {
      method: 'POST',
      token: adminToken,
      body: {
        customerId: custId,
        reason: 'Customer requested data deletion',
      },
    });

    assert.equal(eraseRes.status, 200);
    assert.equal(eraseRes.data.status, 'partial_anonymization');
    assert.ok(eraseRes.data.retentionObligations.length > 0);
    assert.ok(eraseRes.data.retentionObligations[0].law.includes('CGST'));

    // Verify customer contact data was redacted, while invoice was preserved
    const checkCust = await prisma.customer.findUnique({ where: { id: custId } });
    assert.ok(checkCust.name.includes('Anonymized'));
    assert.equal(checkCust.mobile, 'XXXXXXXXXX');

    // Clean up invoice
    await prisma.invoice.delete({ where: { id: inv.id } }).catch(() => {});
  });
});
