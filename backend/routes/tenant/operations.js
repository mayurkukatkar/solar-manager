const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const tenantInstallationsRoutes = require('./installations');
const { validate } = require('../../middleware/validate');
const { createTaskSchema } = require('../validations');
const PDFDocument = require('pdfkit');

// TENANT ADMIN - PHASE 2: CORE OPERATIONS
// ----------------------------------------------------

// SURVEYS
router.get('/api/tenant/surveys', requireTenantAuth, async (req, res) => {
  try {
    const surveys = await prisma.siteSurvey.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true, lead: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ surveys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

router.post('/api/tenant/surveys', requireTenantAuth, async (req, res) => {
  try {
    const survey = await prisma.siteSurvey.create({
      data: {
        ...req.body,
        tenantId: req.user.tenantId
      }
    });
    res.json({ survey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

router.post('/api/tenant/surveys/:id/photos', requireTenantAuth, upload.array('photos', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await prisma.siteSurvey.findUnique({ where: { id, tenantId: req.user.tenantId } });
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    
    const newPhotos = req.files.map(file => file.path);
    const updatedSurvey = await prisma.siteSurvey.update({
      where: { id },
      data: { photos: { push: newPhotos } }
    });
    
    res.json({ message: 'Photos uploaded successfully', photos: updatedSurvey.photos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});


// QUOTATIONS
router.get('/api/tenant/quotations', requireTenantAuth, async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true, lead: true, items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ quotations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

router.post('/api/tenant/quotations', requireTenantAuth, async (req, res) => {
  try {
    const quotation = await prisma.quotation.create({
      data: {
        ...req.body,
        qNumber: `QT-${Date.now()}`,
        tenantId: req.user.tenantId
      }
    });
    res.json({ quotation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});



router.get('/api/tenant/quotations/:id/pdf', requireTenantAuth, async (req, res) => {
  try {
    const quote = await prisma.quotation.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { customer: true, lead: true, items: true }
    });
    
    if (!quote) return res.status(404).json({ error: 'Quotation not found' });
    
    const doc = new PDFDocument({ margin: 50 });
    
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${quote.qNumber || 'Quotation'}.pdf"`);
      res.end(pdfData);
    });
    
    // Header
    doc.fontSize(22).fillColor('#10B981').text("QUOTATION", { align: 'left' });
    doc.moveDown();
    
    doc.fontSize(10).fillColor('#666666');
    doc.text(`Quote No: ${quote.qNumber || 'Unknown'}`);
    doc.text(`Date: ${new Date(quote.date || quote.createdAt).toLocaleDateString()}`);
    
    const validUntil = new Date(quote.date || quote.createdAt);
    validUntil.setDate(validUntil.getDate() + (quote.validityDays || 15));
    doc.text(`Valid Until: ${validUntil.toLocaleDateString()}`);
    
    doc.moveDown(2);
    
    // Client Info
    doc.fontSize(12).fillColor('#1E1E1E').text("Bill To:");
    doc.fontSize(10).fillColor('#666666');
    const client = quote.customer || quote.lead;
    doc.text(client?.name || 'Customer');
    if (client?.email) doc.text(String(client.email));
    if (client?.mobile) doc.text(String(client.mobile));
    
    doc.moveDown(2);
    
    // Safe Numbers
    const safeSubtotal = Number(quote.subtotal || 0);
    const safeTax = Number(quote.tax || 0);
    const safeDiscount = Number(quote.discount || 0);
    const safeTotal = Number(quote.total || 0);

    // Table Header
    doc.rect(50, doc.y, 500, 20).fill('#10B981');
    doc.fillColor('#FFFFFF').text("Description", 60, doc.y - 14);
    doc.text("Qty", 350, doc.y - 14);
    doc.text("Unit Price", 400, doc.y - 14);
    doc.text("Total", 480, doc.y - 14);
    
    // Table Row
    doc.moveDown(1.5);
    doc.fillColor('#3C3C3C');
    doc.text("Solar System Installation & Equipment", 60, doc.y);
    doc.text("1", 350, doc.y - 12);
    doc.text(`Rs. ${safeSubtotal.toLocaleString()}`, 400, doc.y - 12);
    doc.text(`Rs. ${safeSubtotal.toLocaleString()}`, 480, doc.y - 12);
    
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#CCCCCC').stroke();
    
    doc.moveDown();
    
    // Summary
    doc.text("Subtotal:", 380, doc.y);
    doc.text(`Rs. ${safeSubtotal.toLocaleString()}`, 480, doc.y - 12, { align: 'right' });
    
    doc.moveDown();
    doc.text("Tax:", 380, doc.y);
    doc.text(`Rs. ${safeTax.toLocaleString()}`, 480, doc.y - 12, { align: 'right' });
    
    doc.moveDown();
    doc.text("Discount:", 380, doc.y);
    doc.text(`-Rs. ${safeDiscount.toLocaleString()}`, 480, doc.y - 12, { align: 'right' });
    
    doc.moveDown(1.5);
    doc.fontSize(12).fillColor('#10B981').text("Grand Total:", 380, doc.y);
    doc.text(`Rs. ${safeTotal.toLocaleString()}`, 480, doc.y - 14, { align: 'right' });
    
    doc.moveDown(4);
    doc.fontSize(10).fillColor('#999999').text("Thank you for choosing Solar ERP. This is a system generated quotation.", { align: 'center' });
    
    doc.end();
    
  } catch (error) {
    console.error("PDF Generation Route Error:", error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.post('/api/tenant/quotations/:id/convert', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const quotation = await prisma.quotation.findUnique({ where: { id, tenantId } });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    // Mark Quotation as ACCEPTED
    await prisma.quotation.update({
      where: { id, tenantId },
      data: { status: 'ACCEPTED' }
    });

    let customerId = quotation.customerId;

    // If quotation is linked to a lead, convert lead to customer
    if (quotation.leadId) {
      // Mark Lead as WON
      await prisma.lead.update({
        where: { id: quotation.leadId },
        data: { status: 'WON' }
      });

      const lead = await prisma.lead.findUnique({ where: { id: quotation.leadId } });

      let customer = await prisma.customer.findFirst({ where: { leadId: quotation.leadId, tenantId } });
      if (!customer && lead) {
        customer = await prisma.customer.create({
          data: {
            tenantId,
            leadId: quotation.leadId,
            name: lead.name,
            email: lead.email,
            mobile: lead.mobile,
            company: lead.company,
            address: lead.address,
            city: lead.city,
          }
        });
      }
      if (customer) {
        customerId = customer.id;
      }
    }

    // Create Project
    const project = await prisma.project.create({
      data: {
        tenantId,
        quotationId: id,
        customerId: customerId,
        leadId: quotation.leadId,
        name: `PRJ-${quotation.qNumber}`,
        status: 'PLANNING',
      }
    });

    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to convert quotation to project' });
  }
});

router.use('/api/tenant/installations', requireTenantAuth, tenantInstallationsRoutes);

// PROJECTS
router.get('/api/tenant/projects', requireTenantAuth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/api/tenant/projects', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.create({
      data: {
        ...req.body,
        tenantId: req.user.tenantId
      }
    });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/api/tenant/projects/:id', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { 
        customer: true,
        tasks: true,
        purchaseOrders: true,
        invoices: true
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.patch('/api/tenant/projects/:id/status', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { status: req.body.status }
    });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

// TASKS
router.get('/api/tenant/tasks', requireTenantAuth, async (req, res) => {
  try {
    const tasks = await prisma.projectTask.findMany({
      where: { project: { tenantId: req.user.tenantId } },
      include: { project: true, assignee: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/api/tenant/tasks', requireTenantAuth, validate(createTaskSchema), async (req, res) => {
  try {
    const task = await prisma.projectTask.create({
      data: req.body
    });
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// INVENTORY (PRODUCTS)
router.get('/api/tenant/inventory', requireTenantAuth, async (req, res) => {
  try {
    const inventory = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.post('/api/tenant/inventory', requireTenantAuth, async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: {
        ...req.body,
        currentStock: req.body.stock,
        tenantId: req.user.tenantId
      }
    });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// PROCUREMENT (PURCHASE ORDERS)
router.get('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const procurement = await prisma.purchaseOrder.findMany({
      where: { tenantId: req.user.tenantId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ procurement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

router.post('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: req.user.tenantId,
        poNumber: `PO-${Date.now()}`,
        vendor: req.body.supplier,
        status: req.body.status,
        items: {
          create: [{
            productId: req.body.productId,
            quantity: req.body.qty
          }]
        }
      },
      include: { items: true }
    });
    res.json({ procurement: po });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// FINANCE (INVOICES)
router.get('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    const finance = await prisma.invoice.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true, project: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ finance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.post('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: req.user.tenantId,
        invoiceNumber: `INV-${Date.now()}`,
        customerId: req.body.customerId,
        projectId: req.body.projectId || null,
        amount: req.body.amount,
        status: req.body.status
      },
      include: { customer: true, project: true }
    });
    res.json({ finance: invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// SERVICE (SUPPORT TICKETS)
router.get('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const service = await prisma.supportTicket.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true, project: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

router.post('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: req.body.customerId,
        projectId: req.body.projectId || null,
        subject: req.body.subject,
        priority: req.body.priority,
        status: req.body.status
      },
      include: { customer: true, project: true }
    });
    res.json({ service: ticket });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// ----------------------------------------------------
module.exports = router;