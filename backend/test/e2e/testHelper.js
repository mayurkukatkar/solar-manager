/**
 * Opaque-Box E2E Test Helper Infrastructure
 * WhereReady Solar OS Enterprise SaaS
 * 
 * Provides ephemeral HTTP server management, multi-tenant JWT token minting,
 * opaque HTTP client execution, and test fixture isolation.
 */

const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
const prisma = require('../../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-solar-erp-jwt-key';

// Authoritative multi-tenant test fixtures (from active database)
const TEST_FIXTURES = {
  tenantA: {
    id: '4bd192c4-717a-411c-a41d-926793dd57eb',
    name: 'WhereReady IT Solutions',
    adminUser: {
      id: 'f060c497-6efa-4769-8aab-068237b2863a',
      email: 'mayurkukatkar43@gmail.com',
      role: 'TENANT_ADMIN'
    },
    subAdminUser: {
      id: '49528634-3d3d-4e12-bbd9-2676bd2c6731',
      email: 'mayurkukatkar1@gmail.com',
      role: 'TENANT_SUB_ADMIN'
    }
  },
  tenantB: {
    id: '136ca4ed-8324-4c7a-9d27-12c6219750a4',
    name: 'Solar Energy Solutions India',
    adminUser: {
      id: '1b750371-5d1c-4625-a7e0-62edd96aa215',
      email: '2018pkunal@gmail.com',
      role: 'TENANT_ADMIN'
    }
  }
};

/**
 * Mint a valid signed JWT Bearer token with full tenant and user context.
 */
function createToken({
  userId = TEST_FIXTURES.tenantA.adminUser.id,
  role = 'TENANT_ADMIN',
  tenantId = TEST_FIXTURES.tenantA.id,
  permissions = ['*'],
  expiresIn = '1d'
} = {}) {
  return jwt.sign(
    {
      userId,
      id: userId,
      role,
      tenantId,
      permissions
    },
    JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Start an ephemeral HTTP test server binding to port 0 (OS allocated free port).
 * Ensures server.js does not collide on port 5000 by setting NODE_ENV = 'production'.
 */
function startTestServer() {
  return new Promise((resolve, reject) => {
    // Prevent server.js from auto-listening on port 5000
    process.env.NODE_ENV = 'production';
    const app = require('../../server');

    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const baseUrl = `http://127.0.0.1:${address.port}`;
      
      const close = () => {
        return new Promise((resClose) => {
          server.close(() => resClose());
        });
      };

      resolve({ server, baseUrl, close });
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Opaque-box HTTP request dispatcher using native fetch.
 * Sends raw HTTP requests over the network and returns the parsed response.
 */
async function httpRequest(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...options.headers };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  let body = undefined;
  if (options.body !== undefined) {
    if (typeof options.body === 'object') {
      body = JSON.stringify(options.body);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    } else {
      body = String(options.body);
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  let text = '';

  try {
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      text = await response.text();
    }
  } catch (err) {
    // Body parsing error fallback
    text = await response.text().catch(() => '');
  }

  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    body: data !== null ? data : text,
    data: data !== null ? data : text
  };
}

/**
 * Safe cleanup utility for tracked test artifacts.
 */
async function cleanupTestArtifacts(tracked) {
  if (!tracked) return;
  try {
    if (tracked.invoices && tracked.invoices.length > 0) {
      await prisma.payment.deleteMany({ where: { invoiceId: { in: tracked.invoices } } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { id: { in: tracked.invoices } } }).catch(() => {});
    }
    if (tracked.discomApplications && tracked.discomApplications.length > 0) {
      await prisma.discomApplication.deleteMany({ where: { id: { in: tracked.discomApplications } } }).catch(() => {});
    }
    if (tracked.subsidies && tracked.subsidies.length > 0) {
      await prisma.subsidyApplication.deleteMany({ where: { id: { in: tracked.subsidies } } }).catch(() => {});
    }
    if (tracked.projects && tracked.projects.length > 0) {
      await prisma.projectTimelineEvent.deleteMany({ where: { projectId: { in: tracked.projects } } }).catch(() => {});
      await prisma.projectTask.deleteMany({ where: { projectId: { in: tracked.projects } } }).catch(() => {});
      await prisma.projectMilestone.deleteMany({ where: { projectId: { in: tracked.projects } } }).catch(() => {});
      await prisma.projectMaterialRequirement.deleteMany({ where: { projectId: { in: tracked.projects } } }).catch(() => {});
      await prisma.project.deleteMany({ where: { id: { in: tracked.projects } } }).catch(() => {});
    }
    if (tracked.quotations && tracked.quotations.length > 0) {
      await prisma.quotationItem.deleteMany({ where: { quotationId: { in: tracked.quotations } } }).catch(() => {});
      await prisma.quotation.deleteMany({ where: { id: { in: tracked.quotations } } }).catch(() => {});
    }
    if (tracked.surveys && tracked.surveys.length > 0) {
      await prisma.siteSurvey.deleteMany({ where: { id: { in: tracked.surveys } } }).catch(() => {});
    }
    if (tracked.purchaseOrders && tracked.purchaseOrders.length > 0) {
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: { in: tracked.purchaseOrders } } }).catch(() => {});
      await prisma.purchaseOrder.deleteMany({ where: { id: { in: tracked.purchaseOrders } } }).catch(() => {});
    }
    if (tracked.products && tracked.products.length > 0) {
      await prisma.stockLedger.deleteMany({ where: { productId: { in: tracked.products } } }).catch(() => {});
      await prisma.product.deleteMany({ where: { id: { in: tracked.products } } }).catch(() => {});
    }
    if (tracked.leads && tracked.leads.length > 0) {
      await prisma.leadActivity.deleteMany({ where: { leadId: { in: tracked.leads } } }).catch(() => {});
      await prisma.leadNote.deleteMany({ where: { leadId: { in: tracked.leads } } }).catch(() => {});
      await prisma.leadFollowUp.deleteMany({ where: { leadId: { in: tracked.leads } } }).catch(() => {});
      await prisma.lead.deleteMany({ where: { id: { in: tracked.leads } } }).catch(() => {});
    }
    if (tracked.customers && tracked.customers.length > 0) {
      await prisma.customer.deleteMany({ where: { id: { in: tracked.customers } } }).catch(() => {});
    }
  } catch (err) {
    console.warn('Artifact cleanup warning:', err.message);
  }
}

module.exports = {
  TEST_FIXTURES,
  createToken,
  startTestServer,
  httpRequest,
  cleanupTestArtifacts,
  prisma
};
