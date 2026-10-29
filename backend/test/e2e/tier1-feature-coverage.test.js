/**
 * Tier 1: Core Feature Coverage (Opaque-Box E2E Integration Suite)
 * WhereReady Solar OS Enterprise SaaS
 * 
 * Verifies each core solar ERP feature in isolation over genuine HTTP requests:
 * 1. Authentication (login rejection, bearer token authorization, session context)
 * 2. Lead Capture (creation, validation, query by ID)
 * 3. Sizing Calculation Engine (DC capacity, 25-yr degradation, irradiance curves)
 * 4. Quotation Generation (pricing, technical specs, payment schedule)
 * 5. Project Conversion (quotation locking, project provisioning, tasks & discom linking)
 * 6. Milestone Invoicing (4-stage solar EPC breakdown with 13.8% composite GST)
 * 7. DISCOM Gating (initial state, prerequisite statutory document progression)
 * 8. PM Surya Ghar Central Subsidy (30k/60k/78k slabs, national portal smart parser)
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
  calculateSystemCapacity,
  calculateSolarGeneration,
  calculateIndicativeSubsidy
} = require('../../services/solarCalculator');

describe('Tier 1: Core Solar ERP Feature Coverage (Opaque-Box)', () => {
  let serverInstance;
  let baseUrl;
  let adminToken;
  const tenantId = TEST_FIXTURES.tenantA.id;

  // Track entities created during tests for reliable teardown
  const tracked = {
    leads: [],
    quotations: [],
    projects: [],
    invoices: [],
    discomApplications: []
  };

  before(async () => {
    serverInstance = await startTestServer();
    baseUrl = serverInstance.baseUrl;
    adminToken = createToken({
      userId: TEST_FIXTURES.tenantA.adminUser.id,
      role: 'TENANT_ADMIN',
      tenantId: TEST_FIXTURES.tenantA.id
    });
  });

  after(async () => {
    await cleanupTestArtifacts(tracked);
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  // ----------------------------------------------------
  // Feature 1: Authentication
  // ----------------------------------------------------
  describe('Feature 1: Authentication & Access Control', () => {
    it('1.1 should reject invalid login credentials with HTTP 401', async () => {
      const res = await httpRequest(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: {
          email: 'invalid.user@whereready.invalid',
          password: 'wrongpassword123'
        }
      });

      assert.equal(res.status, 401);
      assert.ok(res.body.error, 'Should return an error message on 401');
      assert.match(res.body.error, /invalid credentials/i);
    });

    it('1.2 should allow access to protected tenant endpoints with valid Bearer token', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/leads/dashboard', {
        token: adminToken
      });

      assert.equal(res.status, 200);
      assert.ok(typeof res.body === 'object', 'Dashboard response must be an object');
      assert.ok(res.body.dashboard !== undefined, 'Response must contain dashboard metrics');
      assert.ok(typeof res.body.dashboard.totalLeads === 'number');
    });
  });

  // ----------------------------------------------------
  // Feature 2: Lead Capture
  // ----------------------------------------------------
  describe('Feature 2: CRM Lead Capture', () => {
    let createdLeadId;

    it('2.1 should create a new solar inquiry lead with valid properties', async () => {
      const uniqueMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const leadPayload = {
        name: 'Tier1 Test Customer',
        mobile: uniqueMobile,
        email: `tier1_${Date.now()}@testsolar.in`,
        customerType: 'RESIDENTIAL',
        estimatedCap: 3.3,
        estimatedValue: 191400,
        city: 'Pune',
        address: 'Baner Road, Pune, Maharashtra',
        source: 'WEBSITE',
        notes: 'Interested in PM Surya Ghar 3.3 kW rooftop solar'
      };

      const res = await httpRequest(baseUrl, '/api/tenant/leads', {
        method: 'POST',
        token: adminToken,
        body: leadPayload
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.lead, 'Response must contain created lead');
      assert.ok(res.body.lead.id, 'Created lead must have an ID');
      assert.equal(res.body.lead.name, leadPayload.name);
      assert.equal(res.body.lead.mobile, leadPayload.mobile);
      assert.equal(res.body.lead.status, 'NEW');
      assert.equal(res.body.lead.tenantId, tenantId);

      createdLeadId = res.body.lead.id;
      tracked.leads.push(createdLeadId);
    });

    it('2.2 should retrieve the created lead by ID with complete profile', async () => {
      assert.ok(createdLeadId, 'Lead must have been created in prior test');

      const res = await httpRequest(baseUrl, `/api/tenant/leads/${createdLeadId}`, {
        token: adminToken
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.lead.id, createdLeadId);
      assert.equal(res.body.lead.city, 'Pune');
      assert.equal(res.body.lead.customerType, 'RESIDENTIAL');
    });
  });

  // ----------------------------------------------------
  // Feature 3: Sizing Calculation Engine
  // ----------------------------------------------------
  describe('Feature 3: Solar Engineering Sizing Calculation Engine', () => {
    it('3.1 should calculate system capacity and roof area accurately', () => {
      const sizing = calculateSystemCapacity({
        panelWattage: 550,
        panelQuantity: 6
      });

      assert.equal(sizing.dcCapacityKw, 3.3);
      assert.equal(sizing.panelWattage, 550);
      assert.equal(sizing.panelQuantity, 6);
      assert.equal(sizing.estimatedRoofAreaSqFt, Math.round(3.3 * 65)); // 215 sq ft
    });

    it('3.2 should compute 25-year degradation and monthly solar irradiance distribution', () => {
      const gen = calculateSolarGeneration({
        capacityKw: 3.3,
        annualSpecificYieldKwhPerKwp: 1460,
        annualDegradationRate: 0.007
      });

      assert.equal(gen.annualGeneration, Math.round(3.3 * 1460)); // 4,818 kWh
      assert.ok(gen.lifetimeGeneration > 100000, 'Lifetime generation must exceed 100,000 kWh');
      assert.equal(gen.yearlyGeneration.length, 25);
      assert.equal(gen.monthlyDistribution.length, 12);
      assert.equal(gen.peakMonth, 'May');

      // Verify Year 25 generation is degraded by compounding 0.7%/year
      const expectedYr25 = Math.round(gen.annualGeneration * Math.pow(1 - 0.007, 24));
      assert.equal(gen.yearlyGeneration[24].generationKwh, expectedYr25);

      // Verify environmental offsets
      assert.equal(gen.co2ReductionKg, Math.round(gen.annualGeneration * 0.82));
    });
  });

  // ----------------------------------------------------
  // Feature 4: Quotation Generation
  // ----------------------------------------------------
  describe('Feature 4: Solar Commercial Quotation Generation', () => {
    let createdQuoteId;

    it('4.1 should generate a quotation with technical specs and pricing', async () => {
      const qNumber = `QT-E2E-T1-${Date.now()}`;
      const quotePayload = {
        qNumber,
        systemCapacity: 3.3,
        systemType: 'On-grid',
        connectionType: 'Residential',
        panelBrand: 'Waaree Energies',
        panelModel: '550Wp Mono PERC Bifacial',
        panelWattage: 550,
        panelQuantity: 6,
        inverterBrand: 'Growatt 3.3kW',
        inverterCapacity: 3.3,
        subtotal: 168189,
        tax: 23211,
        discount: 0,
        total: 191400,
        paymentMilestones: [
          { stage: 1, percentage: 20, amount: 38280, description: 'Advance Booking' },
          { stage: 2, percentage: 60, amount: 114840, description: 'Material Delivery' },
          { stage: 3, percentage: 15, amount: 28710, description: 'Installation & Testing' },
          { stage: 4, percentage: 5, amount: 9570, description: 'Net Metering & Grid Sync' }
        ],
        status: 'DRAFT'
      };

      const res = await httpRequest(baseUrl, '/api/tenant/quotations', {
        method: 'POST',
        token: adminToken,
        body: quotePayload
      });

      assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}`);
      assert.ok(res.body.quotation, 'Response must include created quotation');
      assert.ok(res.body.quotation.id, 'Quotation must have an ID');
      assert.equal(res.body.quotation.status, 'DRAFT');
      assert.equal(res.body.quotation.systemCapacity, 3.3);
      assert.equal(res.body.quotation.total, 191400);

      createdQuoteId = res.body.quotation.id;
      tracked.quotations.push(createdQuoteId);
    });

    it('4.2 should fetch the quotation by ID', async () => {
      assert.ok(createdQuoteId, 'Quotation must have been created');

      const res = await httpRequest(baseUrl, `/api/tenant/quotations/${createdQuoteId}`, {
        token: adminToken
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.quotation.id, createdQuoteId);
      assert.equal(res.body.quotation.panelBrand, 'Waaree Energies');
      assert.equal(res.body.quotation.inverterCapacity, 3.3);
    });
  });

  // ----------------------------------------------------
  // Feature 5: Project Conversion
  // ----------------------------------------------------
  describe('Feature 5: Quotation to Project Conversion Workflow', () => {
    let quotationForConversion;
    let convertedProjectId;

    before(async () => {
      // Create a quotation with line items for conversion
      const q = await prisma.quotation.create({
        data: {
          tenantId,
          qNumber: `QT-CONV-${Date.now()}`,
          status: 'DRAFT',
          systemCapacity: 3.3,
          systemType: 'On-grid',
          connectionType: 'Residential',
          subtotal: 168189,
          tax: 23211,
          discount: 0,
          total: 191400,
          items: {
            create: [
              {
                description: 'Waaree 550Wp Mono PERC Bifacial Modules',
                quantity: 6,
                unitPrice: 15000,
                taxRate: 12,
                total: 100800
              },
              {
                description: 'Growatt 3.3kW Grid-Tied Solar Inverter',
                quantity: 1,
                unitPrice: 42000,
                taxRate: 12,
                total: 47040
              }
            ]
          }
        }
      });
      quotationForConversion = q;
      tracked.quotations.push(q.id);
    });

    it('5.1 should convert quotation to project and lock quotation state', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/quotations/${quotationForConversion.id}/convert`, {
        method: 'POST',
        token: adminToken
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.project, 'Must return created project');
      assert.ok(res.body.project.id, 'Project must have an ID');
      assert.match(res.body.project.projectNumber, /^PRJ-/);
      assert.equal(res.body.project.currentStage, 'Planning');
      assert.equal(res.body.project.status, 'In Progress');

      convertedProjectId = res.body.project.id;
      tracked.projects.push(convertedProjectId);

      // Verify quotation was locked and marked ACCEPTED
      const updatedQuote = await prisma.quotation.findUnique({
        where: { id: quotationForConversion.id }
      });
      assert.equal(updatedQuote.status, 'ACCEPTED');
      assert.equal(updatedQuote.isLocked, true);
    });

    it('5.2 should auto-create BOM items and DISCOM application for converted project', async () => {
      assert.ok(convertedProjectId, 'Project must have been created');

      const bomItems = await prisma.projectMaterialRequirement.findMany({
        where: { projectId: convertedProjectId }
      });
      assert.equal(bomItems.length, 2, 'Should create 2 BOM items from quotation line items');

      const discomApp = await prisma.discomApplication.findUnique({
        where: { projectId: convertedProjectId }
      });
      assert.ok(discomApp, 'Project must have an auto-provisioned DISCOM application');
      assert.equal(discomApp.status, 'FEASIBILITY_PENDING');
      tracked.discomApplications.push(discomApp.id);
    });
  });

  // ----------------------------------------------------
  // Feature 6: Invoicing & Milestone Conversion
  // ----------------------------------------------------
  describe('Feature 6: Solar Milestone Invoicing & Composite GST Breakdown', () => {
    let quoteForInvoicing;

    before(async () => {
      const customer = await prisma.customer.create({
        data: {
          tenantId,
          name: 'Milestone Test Client',
          mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
          city: 'Pune'
        }
      });
      tracked.customers = tracked.customers || [];
      tracked.customers.push(customer.id);

      quoteForInvoicing = await prisma.quotation.create({
        data: {
          tenantId,
          customerId: customer.id,
          qNumber: `QT-INV-${Date.now()}`,
          status: 'ACCEPTED',
          systemCapacity: 3.3,
          subtotal: 168189,
          tax: 23211,
          discount: 0,
          total: 191400
        }
      });
      tracked.quotations.push(quoteForInvoicing.id);
    });

    it('6.1 should convert quotation into 4 standardized solar EPC milestone invoices', async () => {
      const res = await httpRequest(baseUrl, '/api/tenant/finance/convert-quotation', {
        method: 'POST',
        token: adminToken,
        body: {
          quotationId: quoteForInvoicing.id,
          template: 'STANDARD_4_STAGE'
        }
      });

      assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}`);
      assert.ok(Array.isArray(res.body.invoices), 'Must return array of invoices');
      assert.equal(res.body.invoices.length, 4, 'Must create 4 milestone invoices');

      const invoices = res.body.invoices;
      for (const inv of invoices) {
        tracked.invoices.push(inv.id);
      }

      // Stage 1: Advance (20%) = 38280
      assert.equal(invoices[0].milestone, 'ADVANCE');
      assert.equal(invoices[0].amount, 38280);
      assert.equal(invoices[0].items[0].hsn, '9954');
      // Verify 13.8% composite GST math
      const expectedSubtotal1 = Math.round(38280 / 1.138);
      assert.equal(invoices[0].subtotal, expectedSubtotal1);
      assert.equal(invoices[0].taxAmount, 38280 - expectedSubtotal1);

      // Stage 2: Material Delivery (60%) = 114840
      assert.equal(invoices[1].milestone, 'MATERIAL_DELIVERY');
      assert.equal(invoices[1].amount, 114840);
      assert.equal(invoices[1].items[0].hsn, '8541');

      // Stage 3: Installation (15%) = 28710
      assert.equal(invoices[2].milestone, 'INSTALLATION');
      assert.equal(invoices[2].amount, 28710);

      // Stage 4: Commissioning (5%) = 9570
      assert.equal(invoices[3].milestone, 'COMMISSIONING');
      assert.equal(invoices[3].amount, 9570);

      // Sum of milestone amounts equals total
      const totalMilestoneSum = invoices.reduce((s, i) => s + i.amount, 0);
      assert.equal(totalMilestoneSum, 191400);
    });
  });

  // ----------------------------------------------------
  // Feature 7: DISCOM Gating
  // ----------------------------------------------------
  describe('Feature 7: DISCOM Statutory Net Metering Gating', () => {
    let discomProjectId;

    before(async () => {
      const proj = await prisma.project.create({
        data: {
          tenantId,
          projectNumber: `PRJ-DISC-${Date.now().toString().slice(-5)}`,
          name: 'DISCOM Gating Test Project',
          capacity: 3.3,
          currentStage: 'Planning',
          status: 'In Progress'
        }
      });
      discomProjectId = proj.id;
      tracked.projects.push(proj.id);
    });

    it('7.1 should initialize DISCOM application in FEASIBILITY_PENDING status', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${discomProjectId}/discom`, {
        method: 'POST',
        token: adminToken
      });

      assert.equal(res.status, 201);
      assert.ok(res.body.discom, 'Response must include created discom record');
      assert.equal(res.body.discom.status, 'FEASIBILITY_PENDING');
      tracked.discomApplications.push(res.body.discom.id);
    });

    it('7.2 should successfully advance to CEIG_INSPECTION when FEASIBILITY_LETTER document is supplied', async () => {
      const res = await httpRequest(baseUrl, `/api/tenant/projects/${discomProjectId}/discom/stage`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'CEIG_INSPECTION',
          documentType: 'FEASIBILITY_LETTER',
          documentUrl: 'https://storage.whereready.com/statutory/msedcl_feasibility_ok.pdf'
        }
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.discom.status, 'CEIG_INSPECTION');
      assert.equal(res.body.discom.feasibilityDocumentUrl, 'https://storage.whereready.com/statutory/msedcl_feasibility_ok.pdf');
    });
  });

  // ----------------------------------------------------
  // Feature 8: PM Surya Ghar Subsidy Caps & Smart Parser
  // ----------------------------------------------------
  describe('Feature 8: PM Surya Ghar Central Subsidy Slabs & Portal Smart Parser', () => {
    it('8.1 should compute statutory central subsidy slabs accurately', () => {
      // 1.0 kW -> ₹30,000
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 1.0, connectionType: 'Residential' }).indicativeSubsidy, 30000);
      // 2.0 kW -> ₹60,000
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 2.0, connectionType: 'Residential' }).indicativeSubsidy, 60000);
      // 3.0 kW -> ₹78,000
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 3.0, connectionType: 'Residential' }).indicativeSubsidy, 78000);
      // 3.3 kW -> ₹78,000 (strictly capped at ₹78k max)
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 3.3, connectionType: 'Residential' }).indicativeSubsidy, 78000);
      // 5.0 kW -> ₹78,000 (strictly capped)
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 5.0, connectionType: 'Residential' }).indicativeSubsidy, 78000);
      // Commercial connection -> ₹0
      assert.equal(calculateIndicativeSubsidy({ capacityKw: 5.0, connectionType: 'Commercial' }).indicativeSubsidy, 0);
    });

    it('8.2 should parse unstructured text from pmsuryaghar.gov.in via smart-parse', async () => {
      const sampleRawText = `
        PM SURYA GHAR NATIONAL PORTAL RECEIPT
        Application Number: PMSG-MH-2024-884920
        Consumer No: 028510293812
        Consumer Name: Ramesh Shinde
        Mobile: 9822114477
        System Size: 3.3 kW
        DISCOM: MSEDCL
        Bank Name: State Bank of India
        Stage: Feasibility Approved
      `;

      const res = await httpRequest(baseUrl, '/api/tenant/pmsuryaghar/smart-parse', {
        method: 'POST',
        token: adminToken,
        body: { rawText: sampleRawText }
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.success, 'Parsing must be marked success');
      const extracted = res.body.extracted;
      assert.equal(extracted.nationalPortalAppNo, 'PMSG-MH-2024-884920');
      assert.equal(extracted.consumerNumber, '028510293812');
      assert.equal(extracted.customerName, 'Ramesh Shinde');
      assert.equal(extracted.customerMobile, '9822114477');
      assert.equal(parseFloat(extracted.proposedCapacity), 3.3);
      assert.equal(extracted.portalStage, 'FEASIBILITY_APPROVED');
    });
  });
});
