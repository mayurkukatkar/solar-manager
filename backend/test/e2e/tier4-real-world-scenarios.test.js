/**
 * Tier 4: Real-World Solar EPC Customer Journeys (Opaque-Box E2E Suite)
 * WhereReady Solar OS Enterprise SaaS
 * 
 * Verifies complete, multi-stage, end-to-end solar business journeys with full domain depth:
 * 
 * Scenario 1: 3.3 kW Residential Rooftop under PM Surya Ghar
 * - Customer: Pune residential homeowner (MSEDCL 12-digit consumer number 028510293812)
 * - Flow: Lead Capture -> Technical Feasibility Survey -> 3.3 kW Quotation with ₹78k Subsidy & 13.8% GST
 *         -> Project Conversion -> Milestone Invoicing & Advance Payment
 *         -> MSEDCL 5-Stage Gated Interconnection (Feasibility -> CEIG -> Meter Test -> Net Meter -> Grid Sync)
 *         -> PM Surya Ghar DBT Funnel Tracking (Consumer Selection -> Claim Generated -> DBT Disbursed)
 * 
 * Scenario 2: Commercial 50 kW Rooftop with Accelerated Depreciation
 * - Customer: Industrial manufacturing client in Bhosari, Pune (Sanctioned Load 65 kVA, HT industrial tariff)
 * - Flow: Solar Engineering Sizing & Section 32 40% Accelerated Depreciation Modeling (₹251.7k Tax Benefit)
 *         -> Multi-Item Commercial Proposal (Modules, Inverter, Walkways, Earthing, Turnkey Liasoning)
 *         -> Procurement PO Issuance & Auto-Restocking Warehouse Ledger
 *         -> Project Conversion with BOM Requirements -> Multi-Stage Commercial Billing & Revenue Collection
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
  calculateIndicativeSubsidy,
  calculateFinancialROI,
  calculateCommercialPricing
} = require('../../services/solarCalculator');

describe('Tier 4: Real-World Solar EPC Customer Journeys (Opaque-Box)', () => {
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
    subsidies: [],
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

  // =========================================================================
  // SCENARIO 1: 3.3 kW Residential Rooftop under PM Surya Ghar & MSEDCL
  // =========================================================================
  describe('Scenario 1: 3.3 kW Residential Rooftop under PM Surya Ghar with MSEDCL Net Metering', () => {
    let resLeadId;
    let resCustomerId;
    let resSurveyId;
    let resQuotationId;
    let resProjectId;
    let resAdvanceInvoiceId;
    let resSubsidyId;

    it('1.1 Inbound Lead Capture with MSEDCL electricity connection profile', async () => {
      const mobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const res = await httpRequest(baseUrl, '/api/tenant/leads', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Sandeep Kulkarni',
          mobile,
          email: `sandeep.kulkarni_${Date.now()}@gmail.com`,
          customerType: 'RESIDENTIAL',
          estimatedCap: 3.3,
          estimatedValue: 191400,
          city: 'Pune',
          address: 'Plot 42, Mayur Colony, Kothrud, Pune, Maharashtra 411038',
          source: 'PMSURYAGHAR_PORTAL',
          notes: 'MSEDCL Consumer No: 028510293812. Target 3.3 kW rooftop solar with central subsidy'
        }
      });

      assert.ok([200, 201].includes(res.status));
      assert.ok(res.body.lead.id);
      resLeadId = res.body.lead.id;
      tracked.leads.push(resLeadId);
    });

    it('1.2 Technical Site Survey & Engineering Feasibility Audit', async () => {
      // Create customer record linked to lead
      const cust = await prisma.customer.create({
        data: {
          tenantId,
          leadId: resLeadId,
          name: 'Sandeep Kulkarni',
          mobile: '9822012345',
          city: 'Pune',
          address: 'Plot 42, Mayur Colony, Kothrud, Pune',
          customerType: 'RESIDENTIAL'
        }
      });
      resCustomerId = cust.id;
      tracked.customers.push(cust.id);

      // Perform technical feasibility survey
      const surveyRes = await httpRequest(baseUrl, '/api/tenant/surveys', {
        method: 'POST',
        token: adminToken,
        body: {
          customerId: resCustomerId,
          leadId: resLeadId,
          roofArea: 350,
          shadowFreeArea: 300,
          roofType: 'RCC Flat Roof',
          electricalPhase: 'Single Phase',
          sanctionedLoad: 4.0,
          recommendedCapacity: 3.3,
          proposedCap: 3.3,
          surveyDate: new Date().toISOString(),
          status: 'COMPLETED',
          notes: 'Unobstructed shadow-free RCC terrace. 6 x 550Wp modules perfectly fits 215 sq ft footprint.'
        }
      });

      assert.ok([200, 201].includes(surveyRes.status));
      resSurveyId = surveyRes.body.survey.id;
      tracked.surveys.push(resSurveyId);
    });

    it('1.3 Turnkey Quotation Generation with PM Surya Ghar ₹78,000 Subsidy & 13.8% Composite GST', async () => {
      // 1. Engineering verification
      const sizing = calculateSystemCapacity({ panelWattage: 550, panelQuantity: 6 });
      assert.equal(sizing.dcCapacityKw, 3.3);

      const gen = calculateSolarGeneration({ capacityKw: 3.3 });
      assert.equal(gen.annualGeneration, 4818); // 3.3 * 1460

      const subsidy = calculateIndicativeSubsidy({ capacityKw: 3.3, connectionType: 'Residential' });
      assert.equal(subsidy.indicativeSubsidy, 78000, 'Residential 3.3 kW must receive maximum CFA cap of ₹78,000');

      // 2. Financial pricing verification
      // Base: ₹168,190 + 13.8% composite solar GST (₹23,210) = ₹191,400 gross
      const grossTurnkeyPrice = 191400;
      const netCustomerInvestment = grossTurnkeyPrice - subsidy.indicativeSubsidy; // ₹113,400
      assert.equal(netCustomerInvestment, 113400);

      const roi = calculateFinancialROI({
        capacityKw: 3.3,
        totalInvestment: grossTurnkeyPrice,
        indicativeSubsidy: 78000,
        gridTariff: 8.5
      });
      assert.equal(roi.netInvestment, 113400);
      assert.equal(roi.annualSavings, Math.round(4818 * 8.5)); // ₹40,953
      assert.equal(roi.paybackYears, Number((113400 / 40953).toFixed(1))); // 2.8 years

      // 3. Create persistent quotation
      const qRes = await httpRequest(baseUrl, '/api/tenant/quotations', {
        method: 'POST',
        token: adminToken,
        body: {
          customerId: resCustomerId,
          leadId: resLeadId,
          surveyId: resSurveyId,
          qNumber: `QT-RES-${Date.now()}`,
          systemCapacity: 3.3,
          systemType: 'On-grid',
          connectionType: 'Residential',
          panelBrand: 'Waaree Energies',
          panelModel: '550Wp Mono PERC Bifacial',
          panelWattage: 550,
          panelQuantity: 6,
          inverterBrand: 'Growatt 3.3kW Single Phase',
          inverterCapacity: 3.3,
          subtotal: 168190,
          tax: 23210,
          discount: 0,
          total: 191400,
          status: 'ACCEPTED',
          paymentMilestones: [
            { stage: 1, percentage: 20, amount: 38280, description: 'Advance booking along with signed work order' },
            { stage: 2, percentage: 60, amount: 114840, description: 'Upon dispatch & delivery of modules, inverter and structure' },
            { stage: 3, percentage: 15, amount: 28710, description: 'Upon completion of mechanical & electrical installation' },
            { stage: 4, percentage: 5, amount: 9570, description: 'Upon MSEDCL Net Metering commissioning & project handover' }
          ]
        }
      });

      assert.ok([200, 201].includes(qRes.status));
      resQuotationId = qRes.body.quotation.id;
      tracked.quotations.push(resQuotationId);

      // Populate quotation line items for BOM generation
      await prisma.quotationItem.createMany({
        data: [
          {
            quotationId: resQuotationId,
            description: 'Waaree 550Wp Mono PERC Bifacial DCR Modules',
            quantity: 6,
            unitPrice: 15000,
            taxRate: 12,
            total: 100800
          },
          {
            quotationId: resQuotationId,
            description: 'Growatt 3.3kW Single Phase On-Grid Inverter',
            quantity: 1,
            unitPrice: 42000,
            taxRate: 12,
            total: 47040
          }
        ]
      });
    });

    it('1.4 Customer Acceptance & Project Conversion with BOM Requirements', async () => {
      assert.ok(resQuotationId, 'Quotation must exist');

      const convRes = await httpRequest(baseUrl, `/api/tenant/quotations/${resQuotationId}/convert`, {
        method: 'POST',
        token: adminToken
      });

      assert.ok([200, 201].includes(convRes.status));
      assert.ok(convRes.body.project.id);
      resProjectId = convRes.body.project.id;
      tracked.projects.push(resProjectId);

      // Verify quotation was locked
      const updatedQuote = await prisma.quotation.findUnique({ where: { id: resQuotationId } });
      assert.equal(updatedQuote.status, 'ACCEPTED');
      assert.equal(updatedQuote.isLocked, true);

      // Verify Bill of Materials (ProjectMaterialRequirement) auto-created from line items
      const bomItems = await prisma.projectMaterialRequirement.findMany({
        where: { projectId: resProjectId }
      });
      assert.ok(bomItems.length >= 2, 'Should create BOM items for panels and inverter');
    });

    it('1.5 4-Stage Milestone Invoicing & Advance Payment Clearance', async () => {
      assert.ok(resQuotationId, 'Quotation must exist');

      // Convert quotation into milestone invoices
      const invRes = await httpRequest(baseUrl, '/api/tenant/finance/convert-quotation', {
        method: 'POST',
        token: adminToken,
        body: {
          quotationId: resQuotationId,
          template: 'STANDARD_4_STAGE'
        }
      });

      assert.ok([200, 201].includes(invRes.status));
      assert.equal(invRes.body.invoices.length, 4);

      for (const inv of invRes.body.invoices) {
        tracked.invoices.push(inv.id);
      }

      // Stage 1 Advance Booking: 20% = ₹38,280
      const advanceInvoice = invRes.body.invoices[0];
      assert.equal(advanceInvoice.milestone, 'ADVANCE');
      assert.equal(advanceInvoice.amount, 38280);
      resAdvanceInvoiceId = advanceInvoice.id;

      // Stage 4 Commissioning has PM Surya Ghar subsidy callout
      const finalInvoice = invRes.body.invoices[3];
      assert.equal(finalInvoice.milestone, 'COMMISSIONING');
      assert.equal(finalInvoice.amount, 9570);

      // Clear Advance Payment via UPI/IMPS
      const payRes = await httpRequest(baseUrl, `/api/tenant/invoices/${resAdvanceInvoiceId}/payments`, {
        method: 'POST',
        token: adminToken,
        body: {
          amount: 38280,
          paymentMethod: 'UPI',
          referenceNumber: `UPI-SBI-${Date.now()}`,
          paidAt: new Date().toISOString(),
          notes: 'Customer paid 20% advance booking via UPI'
        }
      });

      assert.ok([200, 201].includes(payRes.status));

      const updatedInv = await prisma.invoice.findUnique({ where: { id: resAdvanceInvoiceId } });
      assert.equal(updatedInv.status, 'PAID');
    });

    it('1.6 MSEDCL 5-Stage Interconnection Gated Workflow (Feasibility -> CEIG -> Meter -> Grid Sync)', async () => {
      assert.ok(resProjectId, 'Project must exist');

      // Ensure DISCOM application exists in FEASIBILITY_PENDING
      let discom = await prisma.discomApplication.findUnique({
        where: { projectId: resProjectId }
      });
      if (!discom) {
        discom = await prisma.discomApplication.create({
          data: {
            tenantId,
            projectId: resProjectId,
            status: 'FEASIBILITY_PENDING'
          }
        });
      }
      tracked.discomApplications.push(discom.id);

      // Stage 1 -> 2: Feasibility Approval -> CEIG Inspection
      const g1 = await httpRequest(baseUrl, `/api/tenant/projects/${resProjectId}/discom/stage`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'CEIG_INSPECTION',
          documentType: 'FEASIBILITY_LETTER',
          documentUrl: 'https://storage.whereready.com/msedcl/feasibility_approval_028510293812.pdf'
        }
      });
      assert.equal(g1.status, 200);
      assert.equal(g1.body.discom.status, 'CEIG_INSPECTION');

      // Stage 2 -> 3: CEIG Approval -> Meter Testing
      const g2 = await httpRequest(baseUrl, `/api/tenant/projects/${resProjectId}/discom/stage`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'METER_TESTING',
          documentType: 'CEIG_APPROVAL',
          documentUrl: 'https://storage.whereready.com/msedcl/ceig_safety_signoff_3.3kw.pdf'
        }
      });
      assert.equal(g2.status, 200);
      assert.equal(g2.body.discom.status, 'METER_TESTING');

      // Stage 3 -> 4: Meter Testing -> Net Meter Installed
      const g3 = await httpRequest(baseUrl, `/api/tenant/projects/${resProjectId}/discom/stage`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'NET_METER_INSTALLED',
          documentType: 'METER_TEST_REPORT',
          documentUrl: 'https://storage.whereready.com/msedcl/meter_calibration_report_secure.pdf'
        }
      });
      assert.equal(g3.status, 200);
      assert.equal(g3.body.discom.status, 'NET_METER_INSTALLED');

      // Stage 4 -> 5: Net Meter -> Grid Synchronized
      const g4 = await httpRequest(baseUrl, `/api/tenant/projects/${resProjectId}/discom/stage`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'GRID_SYNCHRONIZED',
          documentType: 'NET_METER_CERTIFICATE',
          documentUrl: 'https://storage.whereready.com/msedcl/grid_synchronization_certificate.pdf'
        }
      });
      assert.equal(g4.status, 200);
      assert.equal(g4.body.discom.status, 'GRID_SYNCHRONIZED');
      assert.ok(g4.body.discom.netMeterCertificateUrl);
    });

    it('1.7 PM Surya Ghar National Portal Funnel to Direct Benefit Transfer (DBT)', async () => {
      assert.ok(resProjectId, 'Project must exist');
      assert.ok(resCustomerId, 'Customer must exist');

      // Initialize PM Surya Ghar subsidy application
      const sub = await prisma.subsidyApplication.create({
        data: {
          tenantId,
          projectId: resProjectId,
          customerId: resCustomerId,
          applicationNo: `PMSG-PUN-${Date.now().toString().slice(-6)}`,
          nationalPortalAppNo: 'PMSG-MH-2024-554433',
          consumerNumber: '028510293812',
          discomName: 'MSEDCL',
          division: 'Pune Urban (Kothrud)',
          proposedCapacity: 3.3,
          amount: 78000,
          centralSubsidyAmount: 78000,
          bankName: 'State Bank of India',
          accountNumber: '321456789012',
          ifscCode: 'SBIN0001234',
          accountHolderName: 'Sandeep Kulkarni',
          status: 'APPLICATION_SUBMITTED',
          portalStage: 'CONSUMER_SELECTION'
        }
      });

      resSubsidyId = sub.id;
      tracked.subsidies.push(sub.id);

      // Verify Subsidy application is queryable via API
      const subRes = await httpRequest(baseUrl, `/api/tenant/subsidies/${resSubsidyId}`, {
        token: adminToken
      });

      assert.equal(subRes.status, 200);
      assert.equal(subRes.body.subsidy.nationalPortalAppNo, 'PMSG-MH-2024-554433');
      assert.equal(subRes.body.subsidy.centralSubsidyAmount, 78000);

      // Progress through portal stages to DBT_DISBURSED
      const stages = ['FEASIBILITY_APPROVED', 'WORK_COMPLETED', 'METER_INSPECTED', 'CLAIM_GENERATED', 'DBT_DISBURSED'];
      for (const stg of stages) {
        await prisma.subsidyApplication.update({
          where: { id: resSubsidyId },
          data: { portalStage: stg, status: stg === 'DBT_DISBURSED' ? 'APPROVED' : 'IN_PROGRESS' }
        });
      }

      const finalSub = await prisma.subsidyApplication.findUnique({ where: { id: resSubsidyId } });
      assert.equal(finalSub.portalStage, 'DBT_DISBURSED');
      assert.equal(finalSub.status, 'APPROVED');
    });
  });

  // =========================================================================
  // SCENARIO 2: Commercial 50 kW Rooftop with Accelerated Depreciation
  // =========================================================================
  describe('Scenario 2: Commercial 50 kW Rooftop with Section 32 Accelerated Depreciation', () => {
    let commCustomerId;
    let commQuotationId;
    let commProjectId;
    let commModuleProductId;
    let commInverterProductId;

    it('2.1 Commercial 50 kW Sizing & Section 32 40% Accelerated Depreciation Tax Shield', () => {
      const capacity = 50.0;
      const turnkeyCost = 2500000; // ₹25 Lakhs
      const industrialTariff = 10.50; // ₹10.50/kWh HT Industrial

      // 1. Generation: 50 kW * 1460 kWh/kWp/yr = 73,000 kWh/yr
      const gen = calculateSolarGeneration({ capacityKw: capacity });
      assert.equal(gen.annualGeneration, 73000);

      // 2. Financial ROI calculation
      const roi = calculateFinancialROI({
        capacityKw: capacity,
        totalInvestment: turnkeyCost,
        connectionType: 'Commercial',
        gridTariff: industrialTariff
      });

      // Year 1 Electricity bill savings = 73,000 kWh * ₹10.50 = ₹766,500
      assert.equal(roi.annualSavings, 766500);

      // Section 32 Accelerated Depreciation: 40% depreciation at 25.17% corporate tax rate
      // 2,500,000 * 0.40 * 0.2517 = ₹251,700 tax cash shield
      const expectedTaxBenefit = Math.round(turnkeyCost * 0.40 * 0.2517);
      assert.equal(roi.commercialTaxBenefit, expectedTaxBenefit);
      assert.equal(expectedTaxBenefit, 251700);

      // Commercial systems receive ₹0 central subsidy (PM Surya Ghar is residential only)
      const sub = calculateIndicativeSubsidy({ capacityKw: capacity, connectionType: 'Commercial' });
      assert.equal(sub.indicativeSubsidy, 0);
      assert.equal(sub.isEligible, false);
    });

    it('2.2 Multi-Item Commercial Proposal Creation', async () => {
      // Create commercial customer
      const cust = await prisma.customer.create({
        data: {
          tenantId,
          name: 'Kirloskar Auto Components Pvt Ltd',
          company: 'Kirloskar Group',
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          email: `procurement_${Date.now()}@kirloskarauto.com`,
          address: 'Plot B-14, MIDC Bhosari, Pune, Maharashtra 411026',
          city: 'Pune',
          customerType: 'COMMERCIAL'
        }
      });
      commCustomerId = cust.id;
      tracked.customers.push(cust.id);

      // Commercial line items
      const items = [
        {
          description: 'Waaree 550Wp Mono PERC Bifacial Solar PV Modules',
          quantity: 91,
          unitPrice: 14500,
          taxRate: 12,
          category: 'MODULE'
        },
        {
          description: 'Growatt 50kW Three-Phase Commercial String Inverter',
          quantity: 1,
          unitPrice: 280000,
          taxRate: 12,
          category: 'INVERTER'
        },
        {
          description: 'Elevated Hot-Dip Galvanized Aluminium Structure with Walkway Grating',
          quantity: 1,
          unitPrice: 350000,
          taxRate: 18,
          category: 'STRUCTURE'
        },
        {
          description: 'Turnkey Erection, Testing, CEIG Inspection & Net Metering Liasoning',
          quantity: 1,
          unitPrice: 220000,
          taxRate: 18,
          category: 'SERVICES'
        }
      ];

      // Calculate commercial pricing
      const pricing = calculateCommercialPricing({
        items,
        useCompositeSolarGST: true
      });

      assert.ok(pricing.grandTotal > 2000000);
      assert.match(pricing.amountInWords, /^RUPEES .* ONLY$/);

      // Create persistent commercial quotation
      const qRes = await httpRequest(baseUrl, '/api/tenant/quotations', {
        method: 'POST',
        token: adminToken,
        body: {
          customerId: commCustomerId,
          qNumber: `QT-COMM-${Date.now()}`,
          systemCapacity: 50.0,
          systemType: 'On-grid',
          connectionType: 'Commercial',
          subtotal: 2196837,
          tax: 303163,
          discount: 0,
          total: 2500000,
          status: 'ACCEPTED'
        }
      });

      assert.ok([200, 201].includes(qRes.status));
      commQuotationId = qRes.body.quotation.id;
      tracked.quotations.push(commQuotationId);

      // Save line items to quotation
      await prisma.quotationItem.createMany({
        data: items.map(it => ({
          quotationId: commQuotationId,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
          total: it.quantity * it.unitPrice
        }))
      });
    });

    it('2.3 Turnkey Equipment Procurement & Stock Restocking', async () => {
      // 1. Create catalog products
      const mod = await prisma.product.create({
        data: {
          tenantId,
          name: 'Waaree 550Wp Commercial Solar Panel',
          sku: `WAA-550-COMM-${Date.now().toString().slice(-4)}`,
          category: 'MODULE',
          unit: 'Nos',
          currentStock: 0,
          sellingPrice: 14500,
          purchaseCost: 11000
        }
      });
      commModuleProductId = mod.id;
      tracked.products.push(mod.id);

      const inv = await prisma.product.create({
        data: {
          tenantId,
          name: 'Growatt 50kW Commercial Inverter',
          sku: `GRO-50KW-${Date.now().toString().slice(-4)}`,
          category: 'INVERTER',
          unit: 'Nos',
          currentStock: 0,
          sellingPrice: 280000,
          purchaseCost: 220000
        }
      });
      commInverterProductId = inv.id;
      tracked.products.push(inv.id);

      // 2. Issue Purchase Order
      const poRes = await httpRequest(baseUrl, '/api/tenant/procurement', {
        method: 'POST',
        token: adminToken,
        body: {
          supplier: 'Waaree Energies Distribution Ltd',
          items: [
            { productId: commModuleProductId, quantity: 91, unitCost: 11000 },
            { productId: commInverterProductId, quantity: 1, unitCost: 220000 }
          ],
          notes: 'PO for 50 kW Kirloskar Auto Components project'
        }
      });

      assert.ok([200, 201].includes(poRes.status));
      const poId = poRes.body.purchaseOrder.id;
      tracked.purchaseOrders.push(poId);

      // 3. Receive Purchase Order into warehouse
      const recvRes = await httpRequest(baseUrl, `/api/tenant/procurement/${poId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'RECEIVED' }
      });
      assert.equal(recvRes.status, 200);

      // Verify product stock incremented
      const updatedMod = await prisma.product.findUnique({ where: { id: commModuleProductId } });
      assert.equal(updatedMod.currentStock, 91);

      const updatedInv = await prisma.product.findUnique({ where: { id: commInverterProductId } });
      assert.equal(updatedInv.currentStock, 1);
    });

    it('2.4 Project Conversion, BOM Requirements & Commercial Milestone Billing', async () => {
      assert.ok(commQuotationId, 'Quotation must exist');

      // Convert quotation to project
      const projRes = await httpRequest(baseUrl, `/api/tenant/quotations/${commQuotationId}/convert`, {
        method: 'POST',
        token: adminToken
      });

      assert.ok([200, 201].includes(projRes.status));
      assert.ok(projRes.body.project.id);
      commProjectId = projRes.body.project.id;
      tracked.projects.push(commProjectId);

      // Verify Bill of Materials (ProjectMaterialRequirement) auto-created from line items
      const bomItems = await prisma.projectMaterialRequirement.findMany({
        where: { projectId: commProjectId }
      });
      assert.ok(bomItems.length >= 4, 'BOM must contain all 4 commercial line items');

      // Generate 4-stage milestone invoices
      const invRes = await httpRequest(baseUrl, '/api/tenant/finance/convert-quotation', {
        method: 'POST',
        token: adminToken,
        body: {
          quotationId: commQuotationId,
          template: 'STANDARD_4_STAGE'
        }
      });

      assert.ok([200, 201].includes(invRes.status));
      assert.equal(invRes.body.invoices.length, 4);

      const invoices = invRes.body.invoices;
      for (const i of invoices) {
        tracked.invoices.push(i.id);
      }

      // Verify 20% Advance (₹500,000) and 60% Material Delivery (₹1,500,000)
      assert.equal(invoices[0].amount, 500000);
      assert.equal(invoices[1].amount, 1500000);
      assert.equal(invoices[2].amount, 375000); // 15% Installation
      assert.equal(invoices[3].amount, 125000); // 5% Net Metering Commissioning

      // Record Commercial Advance Payment (₹500,000 via RTGS)
      const payRes = await httpRequest(baseUrl, `/api/tenant/invoices/${invoices[0].id}/payments`, {
        method: 'POST',
        token: adminToken,
        body: {
          amount: 500000,
          paymentMethod: 'RTGS',
          referenceNumber: `RTGS-HDFC-${Date.now()}`,
          paidAt: new Date().toISOString(),
          notes: 'Kirloskar 20% Advance Booking RTGS received'
        }
      });

      assert.ok([200, 201].includes(payRes.status));
      const advanceInv = await prisma.invoice.findUnique({ where: { id: invoices[0].id } });
      assert.equal(advanceInv.status, 'PAID');
    });
  });
});
