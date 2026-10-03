const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/tenant/installations/dashboard
// Fetch high-level KPIs for installations
router.get('/dashboard', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [
      scheduledToday,
      inProgress,
      pendingAssignment,
      pendingReview,
      completedToday,
      delayed,
      thisMonth
    ] = await Promise.all([
      // Scheduled Today
      prisma.installationJob.count({
        where: {
          tenantId,
          status: 'SCHEDULED',
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      // In Progress
      prisma.installationJob.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      // Pending Assignment
      prisma.installationJob.count({
        where: {
          tenantId,
          status: 'SCHEDULED',
          assignments: { none: {} }
        }
      }),
      // Pending Review
      prisma.installationJob.count({ where: { tenantId, status: 'PENDING_REVIEW' } }),
      // Completed Today
      prisma.installationJob.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      // Delayed
      prisma.installationJob.count({ where: { tenantId, status: 'DELAYED' } }),
      // Completed This Month
      prisma.installationJob.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
          }
        }
      })
    ]);

    res.json({
      scheduledToday,
      inProgress,
      pendingAssignment,
      pendingReview,
      completedToday,
      delayed,
      thisMonth
    });
  } catch (error) {
    console.error('Error fetching installation dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/tenant/installations
// List all installations with optional status filter
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status } = req.query;

    const where = { tenantId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const installations = await prisma.installationJob.findMany({
      where,
      include: {
        project: true,
        customer: true,
        assignments: {
          include: { user: true }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    res.json({ installations });
  } catch (error) {
    console.error('Error fetching installations:', error);
    res.status(500).json({ error: 'Failed to fetch installations' });
  }
});

// POST /api/tenant/installations/schedule
// Schedule a new installation from a project
router.post('/schedule', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { projectId, scheduledDate, scheduledStartTime, estimatedDuration, priority, notes, assignments } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { customer: true }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Generate unique Job ID
    const count = await prisma.installationJob.count({ where: { tenantId } });
    const jobId = `INS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newJob = await prisma.installationJob.create({
      data: {
        tenantId,
        jobId,
        projectId,
        customerId: project.customerId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledStartTime,
        estimatedDuration: parseFloat(estimatedDuration) || null,
        priority: priority || 'NORMAL',
        notes,
        status: 'SCHEDULED',
        installationAddress: project.address,
        city: project.city,
        state: project.state,
        pincode: project.pincode,
        assignments: {
          create: assignments?.map(userId => ({
            userId,
            role: 'TECHNICIAN'
          })) || []
        }
      }
    });

    res.status(201).json({ installation: newJob });
  } catch (error) {
    console.error('Error scheduling installation:', error);
    res.status(500).json({ error: 'Failed to schedule installation' });
  }
});

// GET /api/tenant/installations/:id
// Get full details of an installation job
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const installation = await prisma.installationJob.findUnique({
      where: { id, tenantId: req.user.tenantId },
      include: {
        project: true,
        customer: true,
        assignments: { include: { user: true } },
        checklists: true,
        photos: true,
        materials: { include: { product: true } },
        issues: true
      }
    });

    if (!installation) return res.status(404).json({ error: 'Installation not found' });
    res.json({ installation });
  } catch (error) {
    console.error('Error fetching installation details:', error);
    res.status(500).json({ error: 'Failed to fetch installation' });
  }
});

// PUT /api/tenant/installations/:id/status
// Update installation status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progressPercent, delayReason } = req.body;
    
    const updateData = { status };
    if (progressPercent !== undefined) updateData.progressPercent = progressPercent;
    if (delayReason) updateData.delayReason = delayReason;
    
    // Auto-set timestamps based on status
    if (status === 'IN_PROGRESS') {
      updateData.actualStartAt = new Date();
    } else if (status === 'COMPLETED' || status === 'PENDING_REVIEW') {
      updateData.actualEndAt = new Date();
    }

    const updated = await prisma.installationJob.update({
      where: { id, tenantId: req.user.tenantId },
      data: updateData
    });
    
    res.json({ installation: updated });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
