const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// List Tickets (Can filter by projectId or status)
router.get('/api/tenant/tickets', requireTenantAuth, async (req, res) => {
  try {
    const { projectId, status } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: { customer: true, project: true, assignee: true, visits: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Create Ticket
router.post('/api/tenant/tickets', requireTenantAuth, async (req, res) => {
  try {
    const { subject, description, priority, projectId, customerId } = req.body;
    
    // Phase 5 Sync: Check AMC status
    let amcStatus = 'NO_AMC';
    if (projectId) {
      const activeAmc = await prisma.aMC.findFirst({
        where: { projectId, tenantId: req.user.tenantId, status: 'ACTIVE' }
      });
      if (activeAmc) {
        amcStatus = 'ACTIVE_AMC';
      } else {
        const expiredAmc = await prisma.aMC.findFirst({
          where: { projectId, tenantId: req.user.tenantId, status: 'EXPIRED' }
        });
        if (expiredAmc) amcStatus = 'EXPIRED_AMC';
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: req.user.tenantId,
        subject: `${amcStatus === 'ACTIVE_AMC' ? '[WARRANTY] ' : ''}${subject}`, // Tag subject if under warranty
        description: `${description}\n\n[System]: AMC Status at creation - ${amcStatus}`,
        priority: priority || 'MEDIUM',
        projectId: projectId || null,
        customerId: customerId || null,
        status: 'OPEN'
      }
    });
    res.status(201).json({ ticket, amcStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update Ticket Status
router.patch('/api/tenant/tickets/:id/status', requireTenantAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { status }
    });
    res.json({ ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// Add Service Visit (Manual Triage)
router.post('/api/tenant/tickets/:id/visits', requireTenantAuth, async (req, res) => {
  try {
    const { notes } = req.body;
    const visit = await prisma.serviceVisit.create({
      data: {
        ticketId: req.params.id,
        notes,
        status: 'SCHEDULED'
      }
    });
    res.status(201).json({ visit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to schedule service visit' });
  }
});

module.exports = router;
