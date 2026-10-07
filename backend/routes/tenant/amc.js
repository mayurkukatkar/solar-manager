const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT - AMC (ANNUAL MAINTENANCE CONTRACTS)
// ----------------------------------------------------

// List all AMCs
router.get('/api/tenant/amcs', requireTenantAuth, async (req, res) => {
  try {
    const { status, customerId } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const amcs = await prisma.aMC.findMany({
      where,
      include: { customer: true, project: true },
      orderBy: { createdAt: 'desc' }
    });

    const metrics = {
      total: amcs.length,
      active: amcs.filter(a => a.status === 'ACTIVE').length,
      expired: amcs.filter(a => a.status === 'EXPIRED').length,
      expiringSoon: amcs.filter(a => {
        if (a.status !== 'ACTIVE') return false;
        const daysLeft = Math.ceil((new Date(a.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 30 && daysLeft > 0;
      }).length,
      totalValue: amcs.filter(a => a.status === 'ACTIVE').reduce((sum, a) => sum + (a.value || 0), 0)
    };

    res.json({ amcs, metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch AMCs' });
  }
});

// Get AMC detail
router.get('/api/tenant/amcs/:id', requireTenantAuth, async (req, res) => {
  try {
    const amc = await prisma.aMC.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { customer: true, project: true }
    });
    if (!amc) return res.status(404).json({ error: 'AMC not found' });
    res.json({ amc });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AMC details' });
  }
});

// Phase 3: Get Warranty Info for a Project
router.get('/api/tenant/projects/:projectId/warranty', requireTenantAuth, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const tenantId = req.user.tenantId;

    // Get all consumed materials from installation jobs for this project
    const installations = await prisma.installationJob.findMany({
      where: { projectId, tenantId },
      include: {
        materials: {
          include: { product: true }
        }
      }
    });

    const amcs = await prisma.aMC.findMany({
      where: { projectId, tenantId }
    });

    res.json({ installations, amcs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch warranty info' });
  }
});

// Create AMC
router.post('/api/tenant/amcs', requireTenantAuth, async (req, res) => {
  try {
    const { customerId, projectId, contractNumber, startDate, endDate, value } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });

    const count = await prisma.aMC.count({ where: { tenantId: req.user.tenantId } });
    const amc = await prisma.aMC.create({
      data: {
        tenantId: req.user.tenantId,
        customerId,
        projectId: projectId || null,
        contractNumber: contractNumber || `AMC-${(count + 1).toString().padStart(4, '0')}`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        value: parseFloat(value) || 0,
        status: 'ACTIVE'
      },
      include: { customer: true, project: true }
    });
    res.status(201).json({ amc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create AMC' });
  }
});

// Update AMC
router.patch('/api/tenant/amcs/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, contractNumber, startDate, endDate, value } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (contractNumber) updateData.contractNumber = contractNumber;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (value !== undefined) updateData.value = parseFloat(value);

    const amc = await prisma.aMC.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData,
      include: { customer: true, project: true }
    });
    res.json({ amc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update AMC' });
  }
});

// Delete AMC
router.delete('/api/tenant/amcs/:id', requireTenantAuth, async (req, res) => {
  try {
    await prisma.aMC.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'AMC deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete AMC' });
  }
});

module.exports = router;
