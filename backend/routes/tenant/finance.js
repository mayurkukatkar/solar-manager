const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT - FINANCE, PAYMENTS, SERVICE, PROCUREMENT, WAREHOUSES
// ============================================================

// DASHBOARD (Enhanced KPIs)
// ----------------------------------------------------
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

// INVOICES / FINANCE
// ----------------------------------------------------
router.get('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    const finance = await prisma.invoice.findMany({ 
      where: { tenantId: req.user.tenantId },
      include: { customer: true, project: true, payments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ finance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/api/tenant/finance/:id', requireTenantAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { customer: true, project: true, payments: { orderBy: { date: 'desc' } } }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

router.post('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    if (!req.body.customerId) return res.status(400).json({ error: 'customerId required' });
    
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: req.body.customerId,
        projectId: req.body.projectId || null,
        invoiceNumber: `INV-${Date.now()}`,
        amount: parseFloat(req.body.amount) || 0,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        status: 'UNPAID'
      },
      include: { customer: true, project: true }
    });
    res.status(201).json({ invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.delete('/api/tenant/finance/:id', requireTenantAuth, async (req, res) => {
  try {
    await prisma.invoice.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// PAYMENTS (Record payments against invoices)
// ----------------------------------------------------
router.get('/api/tenant/invoices/:id/payments', requireTenantAuth, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { invoice: { id: req.params.id, tenantId: req.user.tenantId } },
      orderBy: { date: 'desc' }
    });
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/api/tenant/invoices/:id/payments', requireTenantAuth, async (req, res) => {
  try {
    const { amount, mode, reference, date } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { payments: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const newTotal = totalPaid + parseFloat(amount);

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: req.params.id,
        amount: parseFloat(amount),
        mode: mode || 'BANK_TRANSFER',
        reference: reference || null,
        date: date ? new Date(date) : new Date()
      }
    });

    // Auto-update invoice status
    let newStatus = 'PARTIAL';
    if (newTotal >= invoice.amount) newStatus = 'PAID';
    
    await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: newStatus }
    });

    res.status(201).json({ payment, invoiceStatus: newStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// PROCUREMENT (PURCHASE ORDERS)
// ----------------------------------------------------
router.get('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const procurement = await prisma.purchaseOrder.findMany({
      where: { tenantId: req.user.tenantId },
      include: { items: { include: { product: true } }, project: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ procurement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

router.post('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const { vendor, projectId, items, status } = req.body;
    if (!vendor) return res.status(400).json({ error: 'vendor is required' });

    const count = await prisma.purchaseOrder.count({ where: { tenantId: req.user.tenantId } });
    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: req.user.tenantId,
        poNumber: `PO-${(count + 1).toString().padStart(5, '0')}`,
        vendor,
        projectId: projectId || null,
        status: status || 'DRAFT',
        items: items && items.length > 0 ? {
          create: items.map(i => ({
            productId: i.productId,
            quantity: parseInt(i.quantity) || 1,
            unitPrice: parseFloat(i.unitPrice) || 0,
            total: (parseInt(i.quantity) || 1) * (parseFloat(i.unitPrice) || 0)
          }))
        } : undefined
      },
      include: { items: { include: { product: true } } }
    });
    res.status(201).json({ procurement: po });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.patch('/api/tenant/procurement/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const po = await prisma.purchaseOrder.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { status },
      include: { items: { include: { product: true } } }
    });
    res.json({ procurement: po });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

router.delete('/api/tenant/procurement/:id', requireTenantAuth, async (req, res) => {
  try {
    await prisma.purchaseOrder.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Purchase order deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

// SERVICE / TICKETS
// ----------------------------------------------------
router.get('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const service = await prisma.supportTicket.findMany({ 
      where: { tenantId: req.user.tenantId },
      include: { customer: true, project: true, assignee: true, visits: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.post('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: req.body.customerId || null,
        projectId: req.body.projectId || null,
        subject: req.body.subject || 'Service Issue',
        description: req.body.description || null,
        priority: req.body.priority || 'MEDIUM',
        status: 'OPEN',
        assigneeId: req.body.assigneeId || null
      },
      include: { customer: true, project: true }
    });
    res.status(201).json({ ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

router.patch('/api/tenant/service/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, priority, assigneeId } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData,
      include: { customer: true }
    });
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

router.delete('/api/tenant/service/:id', requireTenantAuth, async (req, res) => {
  try {
    await prisma.supportTicket.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// SERVICE VISITS
router.post('/api/tenant/service/:id/visits', requireTenantAuth, async (req, res) => {
  try {
    const visit = await prisma.serviceVisit.create({
      data: {
        ticketId: req.params.id,
        notes: req.body.notes || '',
        visitDate: req.body.visitDate ? new Date(req.body.visitDate) : new Date(),
        status: req.body.status || 'COMPLETED'
      }
    });
    res.status(201).json({ visit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log service visit' });
  }
});

// WAREHOUSE CRUD
// ----------------------------------------------------
router.post('/api/tenant/inventory/warehouses', requireTenantAuth, async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ error: 'Warehouse name is required' });

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        location: location || null
      }
    });
    res.status(201).json({ warehouse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

router.patch('/api/tenant/inventory/warehouses/:id', requireTenantAuth, async (req, res) => {
  try {
    const { name, location } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { ...(name && { name }), ...(location !== undefined && { location }) }
    });
    res.json({ warehouse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

router.delete('/api/tenant/inventory/warehouses/:id', requireTenantAuth, async (req, res) => {
  try {
    await prisma.warehouse.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Warehouse deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

// STOCK TRANSFERS
// ----------------------------------------------------
router.get('/api/tenant/inventory/transfers', requireTenantAuth, async (req, res) => {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        sourceWarehouse: true,
        destWarehouse: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ transfers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

router.post('/api/tenant/inventory/transfers', requireTenantAuth, async (req, res) => {
  try {
    const { sourceWarehouseId, destWarehouseId, items } = req.body;
    if (!sourceWarehouseId || !destWarehouseId) {
      return res.status(400).json({ error: 'Source and destination warehouses required' });
    }
    if (sourceWarehouseId === destWarehouseId) {
      return res.status(400).json({ error: 'Source and destination must be different' });
    }

    const count = await prisma.stockTransfer.count({ where: { tenantId: req.user.tenantId } });
    const transfer = await prisma.stockTransfer.create({
      data: {
        tenantId: req.user.tenantId,
        transferNumber: `TRF-${(count + 1).toString().padStart(5, '0')}`,
        sourceWarehouseId,
        destWarehouseId,
        status: 'DRAFT',
        items: items && items.length > 0 ? {
          create: items.map(i => ({
            productId: i.productId,
            quantity: parseFloat(i.quantity) || 1
          }))
        } : undefined
      },
      include: { sourceWarehouse: true, destWarehouse: true, items: { include: { product: true } } }
    });
    res.status(201).json({ transfer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create stock transfer' });
  }
});

// TASKS (Global view)
// ----------------------------------------------------
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

// COMPLETION CERTIFICATES
// ----------------------------------------------------
router.post('/api/tenant/projects/:id/certificate', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { customer: true }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const count = await prisma.completionCertificate.count({ where: { tenantId: req.user.tenantId } });
    const certificate = await prisma.completionCertificate.create({
      data: {
        tenantId: req.user.tenantId,
        projectId: req.params.id,
        installationId: req.body.installationId || '',
        certificateNo: `CERT-${(count + 1).toString().padStart(4, '0')}`,
        customerName: project.customer?.name || 'Customer',
        systemCapacity: project.capacity ? `${project.capacity} ${project.capacityUnit}` : null,
        issuedBy: req.user.userId
      }
    });
    res.status(201).json({ certificate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

module.exports = router;