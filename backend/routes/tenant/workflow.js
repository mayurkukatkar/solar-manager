const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT ADMIN - TRANSITION APIs (THE ERP WORKFLOW)
// ----------------------------------------------------

// 1. Customer -> Survey
router.post('/api/tenant/customers/:id/survey', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const customer = await prisma.customer.findUnique({ where: { id, tenantId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const survey = await prisma.siteSurvey.create({
      data: {
        tenantId,
        customerId: id,
        leadId: customer.leadId,
        status: 'SCHEDULED',
        surveyDate: req.body.surveyDate ? new Date(req.body.surveyDate) : new Date(),
        notes: req.body.notes || 'Survey created from customer'
      }
    });
    res.json({ survey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// 2. Survey -> Quotation
router.post('/api/tenant/surveys/:id/quote', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const survey = await prisma.siteSurvey.findUnique({ where: { id, tenantId } });
    if (!survey) return res.status(404).json({ error: 'Survey not found' });

    const quotation = await prisma.quotation.create({
      data: {
        tenantId,
        customerId: survey.customerId,
        leadId: survey.leadId,
        qNumber: `QT-${Date.now()}`,
        status: 'DRAFT',
        subtotal: req.body.subtotal || 0,
        tax: req.body.tax || 0,
        discount: req.body.discount || 0,
        total: (req.body.subtotal || 0) + (req.body.tax || 0) - (req.body.discount || 0)
      }
    });
    res.json({ quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

// 3. Quotation -> Project
router.post('/api/tenant/quotations/:id/project', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const quote = await prisma.quotation.findUnique({ where: { id, tenantId }, include: { customer: true } });
    if (!quote) return res.status(404).json({ error: 'Quotation not found' });

    // Mark quote as ACCEPTED
    await prisma.quotation.update({ where: { id }, data: { status: 'ACCEPTED' } });

    const project = await prisma.project.create({
      data: {
        tenantId,
        customerId: quote.customerId,
        leadId: quote.leadId,
        quotationId: quote.id,
        name: `${quote.customer?.name || 'Customer'} - Project`,
        status: 'PLANNING'
      }
    });
    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// 4. Project -> Invoice
router.post('/api/tenant/projects/:id/invoice', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const project = await prisma.project.findUnique({ where: { id, tenantId }, include: { quotation: true } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!project.customerId) return res.status(400).json({ error: 'Project has no customer attached' });

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        projectId: id,
        customerId: project.customerId,
        invoiceNumber: `INV-${Date.now()}`,
        amount: project.quotation?.total || req.body.amount || 0,
        status: 'UNPAID'
      }
    });
    res.json({ invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// ----------------------------------------------------
module.exports = router;