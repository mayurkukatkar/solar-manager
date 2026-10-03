const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT ADMIN - PHASE 4 & 5: FINAL OPERATIONS
// ----------------------------------------------------

// INVENTORY (Products)
router.get('/api/tenant/inventory', requireTenantAuth, async (req, res) => {
  try {
    const inventory = await prisma.product.findMany({ where: { tenantId: req.user.tenantId } });
    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});
router.post('/api/tenant/inventory', requireTenantAuth, async (req, res) => {
  try {
    const item = await prisma.product.create({
      data: { ...req.body, tenantId: req.user.tenantId }
    });
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PROCUREMENT
router.get('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const procurement = await prisma.purchaseOrder.findMany({ where: { tenantId: req.user.tenantId } });
    res.json({ procurement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch POs' });
  }
});
router.post('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    // We map frontend simpler request to the schema
    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: req.user.tenantId,
        poNumber: `PO-${Date.now()}`,
        vendor: req.body.supplier || 'Vendor',
        status: req.body.status || 'ORDERED'
      }
    });
    res.json({ po });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create PO' });
  }
});

// FINANCE (Invoices)
router.get('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    const finance = await prisma.invoice.findMany({ 
      where: { tenantId: req.user.tenantId },
      include: { customer: true, project: true }
    });
    // Map to frontend expected shape temporarily while UI updates
    const mapped = finance.map(f => ({
      id: f.invoiceNumber,
      customer: f.customer?.name || 'Unknown',
      project: f.project?.name || 'General',
      date: f.date,
      amount: f.amount,
      status: f.status
    }));
    res.json({ finance: mapped });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});
router.post('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    // If no customerId provided from the old frontend form, create a dummy or fail.
    // We'll return 400 for safety, as we expect the new frontend to pass it.
    if (!req.body.customerId) return res.status(400).json({ error: 'customerId required' });
    
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: req.body.customerId,
        projectId: req.body.projectId,
        invoiceNumber: `INV-${Date.now()}`,
        amount: req.body.amount || 0,
        status: req.body.status || 'UNPAID'
      }
    });
    res.json({ invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// SERVICE / TICKETS
router.get('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const service = await prisma.supportTicket.findMany({ 
      where: { tenantId: req.user.tenantId },
      include: { customer: true }
    });
    // Map to frontend expected shape
    const mapped = service.map(s => ({
      id: s.id,
      customer: s.customer?.name || 'Unknown',
      issue: s.subject || s.description,
      status: s.status,
      priority: s.priority,
      date: s.createdAt
    }));
    res.json({ service: mapped });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});
router.post('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: req.body.customerId,
        subject: req.body.issue || 'Service Issue',
        priority: req.body.priority || 'MEDIUM',
        status: req.body.status || 'OPEN'
      }
    });
    res.json({ ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// DASHBOARD
router.get('/api/tenant/dashboard', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [totalLeads, totalCustomers, totalProjects, pendingInvoices, openTickets, revenueData, invoices] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.project.count({ where: { tenantId, status: { notIn: ['COMPLETED', 'HANDOVER'] } } }),
      prisma.invoice.count({ where: { tenantId, status: 'UNPAID' } }),
      prisma.supportTicket.count({ where: { tenantId, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: 'UNPAID' },
        _sum: { amount: true }
      })
    ]);
    
    res.json({
      totalLeads,
      totalCustomers,
      totalProjects,
      pendingInvoices,
      openTickets,
      totalRevenue: revenueData._sum.amount || 0,
      outstanding: invoices._sum.amount || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;