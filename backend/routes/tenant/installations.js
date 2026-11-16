const express = require('express');
const router = express.Router();
const prisma = require('../../db');

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
    const { status, search } = req.query;

    const where = { tenantId };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { jobId: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { project: { name: { contains: q, mode: 'insensitive' } } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const installations = await prisma.installationJob.findMany({
      where,
      include: {
        project: true,
        customer: true,
        assignments: {
          include: { user: true }
        },
        photos: true,
        checklists: true,
        materials: { include: { product: true } },
        issues: true,
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
      },
      include: {
        project: true,
        customer: true,
        assignments: { include: { user: true } }
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
        checklists: { orderBy: { category: 'asc' } },
        photos: { orderBy: { createdAt: 'desc' } },
        materials: { include: { product: true } },
        issues: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!installation) return res.status(404).json({ error: 'Installation not found' });

    // Parse structured notes for QA readings or digital signoff if present
    let qaReadings = null;
    let customerSignoff = null;
    try {
      if (installation.notes && installation.notes.startsWith('{')) {
        const parsed = JSON.parse(installation.notes);
        qaReadings = parsed.qaReadings || null;
        customerSignoff = parsed.customerSignoff || null;
      }
    } catch (_) {}

    res.json({
      installation: {
        ...installation,
        qaReadings,
        customerSignoff,
      }
    });
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
    if (status === 'IN_PROGRESS' || status === 'ON_SITE') {
      updateData.actualStartAt = new Date();
    } else if (status === 'COMPLETED' || status === 'PENDING_REVIEW') {
      updateData.actualEndAt = new Date();
    }

    // Phase 4 Sync: Quality Control Enforcement
    if (status === 'PENDING_REVIEW' || status === 'COMPLETED') {
      const photos = await prisma.installationPhoto.findMany({
        where: { installationId: id }
      });
      const categories = photos.map(p => p.category.toUpperCase());
      const required = ['ROOF', 'INVERTER', 'PANELS'];
      const missing = required.filter(c => !categories.includes(c));
      
      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required statutory photos for commissioning: ${missing.join(', ')}` });
      }
    }

    const updated = await prisma.installationJob.update({
      where: { id, tenantId: req.user.tenantId },
      data: updateData,
      include: {
        project: true,
        customer: true,
        assignments: { include: { user: true } },
        checklists: true,
        photos: true,
        materials: { include: { product: true } },
        issues: true,
      }
    });
    
    res.json({ installation: updated });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status: ' + (error.message || 'Unknown error') });
  }
});

// PUT /api/tenant/installations/:id/checklist
// Update or batch upsert checklist responses and recalculate progress percentage
router.put('/:id/checklist', async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { id?, itemId, category, item, isChecked, status, comment }

    const job = await prisma.installationJob.findUnique({
      where: { id, tenantId: req.user.tenantId },
      include: { checklists: true }
    });
    if (!job) return res.status(404).json({ error: 'Installation not found' });

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (item.id) {
          await prisma.installationChecklistResponse.update({
            where: { id: item.id },
            data: {
              isChecked: item.isChecked !== undefined ? Boolean(item.isChecked) : undefined,
              status: item.status || (item.isChecked ? 'PASS' : null),
              comment: item.comment || undefined,
              completedBy: req.user.name || req.user.email || 'Technician',
              completedAt: item.isChecked ? new Date() : null,
            }
          });
        } else {
          await prisma.installationChecklistResponse.create({
            data: {
              installationId: id,
              itemId: item.itemId || `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              category: item.category || 'GENERAL',
              item: item.item || item.taskName || item.title || 'Checklist Item',
              isChecked: Boolean(item.isChecked),
              status: item.status || (item.isChecked ? 'PASS' : null),
              comment: item.comment || null,
              completedBy: req.user.name || req.user.email || 'Technician',
              completedAt: item.isChecked ? new Date() : null,
            }
          });
        }
      }
    }

    // Recalculate progressPercent
    const allChecklists = await prisma.installationChecklistResponse.findMany({
      where: { installationId: id }
    });
    const completedCount = allChecklists.filter(c => c.isChecked || c.status === 'PASS').length;
    const progressPercent = allChecklists.length > 0
      ? Math.round((completedCount / allChecklists.length) * 100)
      : job.progressPercent;

    const updatedJob = await prisma.installationJob.update({
      where: { id },
      data: { progressPercent },
      include: {
        checklists: { orderBy: { category: 'asc' } },
        photos: true,
        materials: { include: { product: true } },
        assignments: { include: { user: true } },
        issues: true,
      }
    });

    res.json({ installation: updatedJob, progressPercent });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ error: 'Failed to update checklist' });
  }
});

// POST /api/tenant/installations/:id/photos
// Upload or save on-site statutory inspection photo
router.post('/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, url, caption } = req.body;

    if (!category || !url) {
      return res.status(400).json({ error: 'Photo category and URL are required' });
    }

    const job = await prisma.installationJob.findUnique({
      where: { id, tenantId: req.user.tenantId }
    });
    if (!job) return res.status(404).json({ error: 'Installation not found' });

    const photo = await prisma.installationPhoto.create({
      data: {
        installationId: id,
        category: category.toUpperCase(),
        url,
        caption: caption || null,
        uploadedBy: req.user.name || req.user.email || 'Technician',
      }
    });

    res.status(201).json({ photo });
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

// DELETE /api/tenant/installations/:id/photos/:photoId
// Remove an installation photo
router.delete('/:id/photos/:photoId', async (req, res) => {
  try {
    const { id, photoId } = req.params;
    const job = await prisma.installationJob.findUnique({
      where: { id, tenantId: req.user.tenantId }
    });
    if (!job) return res.status(404).json({ error: 'Installation not found' });

    await prisma.installationPhoto.delete({
      where: { id: photoId }
    });

    res.json({ success: true, message: 'Photo removed successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// PUT /api/tenant/installations/:id/materials
// Save material consumption and 2D scanned serial numbers
router.put('/:id/materials', async (req, res) => {
  try {
    const { id } = req.params;
    const { materials, serialNumbers, productId } = req.body;

    const job = await prisma.installationJob.findUnique({
      where: { id, tenantId: req.user.tenantId },
      include: { materials: true }
    });
    if (!job) return res.status(404).json({ error: 'Installation not found' });

    if (Array.isArray(materials)) {
      for (const m of materials) {
        if (m.id) {
          await prisma.installationMaterialConsumption.update({
            where: { id: m.id },
            data: {
              consumedQty: m.consumedQty !== undefined ? parseFloat(m.consumedQty) : undefined,
              returnedQty: m.returnedQty !== undefined ? parseFloat(m.returnedQty) : undefined,
              serialNumbers: Array.isArray(m.serialNumbers) ? m.serialNumbers : undefined,
            }
          });
        } else if (m.productId) {
          await prisma.installationMaterialConsumption.create({
            data: {
              installationId: id,
              productId: m.productId,
              dispatchedQty: parseFloat(m.dispatchedQty || m.quantity || 0),
              consumedQty: parseFloat(m.consumedQty || m.quantity || 0),
              returnedQty: parseFloat(m.returnedQty || 0),
              serialNumbers: Array.isArray(m.serialNumbers) ? m.serialNumbers : [],
            }
          });
        }
      }
    } else if (Array.isArray(serialNumbers)) {
      if (job.materials.length > 0) {
        const targetMat = productId 
          ? job.materials.find(m => m.productId === productId) || job.materials[0]
          : job.materials[0];
        await prisma.installationMaterialConsumption.update({
          where: { id: targetMat.id },
          data: { serialNumbers }
        });
      } else {
        const defaultProduct = await prisma.product.findFirst({
          where: { tenantId: req.user.tenantId }
        });
        if (defaultProduct) {
          await prisma.installationMaterialConsumption.create({
            data: {
              installationId: id,
              productId: defaultProduct.id,
              dispatchedQty: serialNumbers.length,
              consumedQty: serialNumbers.length,
              serialNumbers,
            }
          });
        }
      }
    }

    const updated = await prisma.installationJob.findUnique({
      where: { id },
      include: { materials: { include: { product: true } } }
    });

    res.json({ materials: updated.materials });
  } catch (error) {
    console.error('Error updating materials:', error);
    res.status(500).json({ error: 'Failed to update materials' });
  }
});

// PUT /api/tenant/installations/:id/qa
// Save CEA electrical safety test readings (Earthing pit ohms, anti-islanding trip, insulation resistance)
router.put('/:id/qa', async (req, res) => {
  try {
    const { id } = req.params;
    const { pit1Inverter, pit2Structure, pit3Lightning, antiIslandingTripSec, insulationMegaOhms, notes } = req.body;

    const job = await prisma.installationJob.findUnique({
      where: { id, tenantId: req.user.tenantId }
    });
    if (!job) return res.status(404).json({ error: 'Installation not found' });

    const pit1 = parseFloat(pit1Inverter) || 0;
    const pit2 = parseFloat(pit2Structure) || 0;
    const pit3 = parseFloat(pit3Lightning) || 0;
    const tripSec = parseFloat(antiIslandingTripSec) || 0;
    const insulation = parseFloat(insulationMegaOhms) || 0;

    const isEarthingCompliant = pit1 > 0 && pit1 < 5.0 && pit2 > 0 && pit2 < 5.0 && pit3 > 0 && pit3 < 5.0;
    const isAntiIslandingCompliant = tripSec > 0 && tripSec <= 2.0;
    const isInsulationCompliant = insulation >= 1000;
    const isCeaCertified = isEarthingCompliant && isAntiIslandingCompliant && isInsulationCompliant;

    const qaData = {
      pit1Inverter: pit1,
      pit2Structure: pit2,
      pit3Lightning: pit3,
      antiIslandingTripSec: tripSec,
      insulationMegaOhms: insulation,
      isCeaCertified,
      testedAt: new Date().toISOString(),
      testedBy: req.user.name || req.user.email || 'Technician',
      notes: notes || '',
    };

    let existingNotesObj = {};
    try {
      if (job.notes && job.notes.startsWith('{')) {
        existingNotesObj = JSON.parse(job.notes);
      }
    } catch (_) {}

    const mergedNotes = JSON.stringify({
      ...existingNotesObj,
      qaReadings: qaData,
    });

    const updatedJob = await prisma.installationJob.update({
      where: { id },
      data: { notes: mergedNotes }
    });

    res.json({
      success: true,
      qaReadings: qaData,
      isCeaCertified,
      installation: updatedJob,
    });
  } catch (error) {
    console.error('Error updating QA readings:', error);
    res.status(500).json({ error: 'Failed to update QA test readings' });
  }
});

// POST /api/tenant/installations/:id/issues
// Report an on-site technical or civil issue
router.post('/:id/issues', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, severity, description } = req.body;

    const job = await prisma.installationJob.findUnique({
      where: { id, tenantId: req.user.tenantId }
    });
    if (!job) return res.status(404).json({ error: 'Installation not found' });

    const issue = await prisma.installationIssue.create({
      data: {
        installationId: id,
        category: category || 'ELECTRICAL',
        severity: severity || 'MEDIUM',
        description,
        status: 'OPEN',
        reportedBy: req.user.name || req.user.email || 'Technician',
      }
    });

    res.status(201).json({ issue });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// PUT /api/tenant/installations/:id/issues/:issueId
// Update issue status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
router.put('/:id/issues/:issueId', async (req, res) => {
  try {
    const { id, issueId } = req.params;
    const { status } = req.body;

    const issue = await prisma.installationIssue.update({
      where: { id: issueId },
      data: { status }
    });

    res.json({ issue });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// POST /api/tenant/installations/:id/assignments
// Assign technician or supervisor to installation job
router.post('/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    const job = await prisma.installationJob.findUnique({
      where: { id, tenantId: req.user.tenantId }
    });
    if (!job) return res.status(404).json({ error: 'Installation not found' });

    const assignment = await prisma.installationAssignment.create({
      data: {
        installationId: id,
        userId,
        role: role || 'TECHNICIAN',
        status: 'ASSIGNED',
      },
      include: { user: true }
    });

    if (job.status === 'SCHEDULED') {
      await prisma.installationJob.update({
        where: { id },
        data: { status: 'ASSIGNED' }
      });
    }

    res.status(201).json({ assignment });
  } catch (error) {
    console.error('Error assigning technician:', error);
    res.status(500).json({ error: 'Failed to assign technician' });
  }
});

// DELETE /api/tenant/installations/:id/assignments/:assignmentId
// Remove technician assignment
router.delete('/:id/assignments/:assignmentId', async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    await prisma.installationAssignment.delete({
      where: { id: assignmentId }
    });
    res.json({ success: true, message: 'Assignment removed' });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

// POST /api/tenant/installations/:id/signoff
// Customer digital sign-off and completion handover
router.post('/:id/signoff', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, signatureData, handoverConfirmed, notes } = req.body;

    const job = await prisma.installationJob.findUnique({
      where: { id, tenantId: req.user.tenantId }
    });
    if (!job) return res.status(404).json({ error: 'Installation not found' });

    let existingNotesObj = {};
    try {
      if (job.notes && job.notes.startsWith('{')) {
        existingNotesObj = JSON.parse(job.notes);
      }
    } catch (_) {}

    const signoffRecord = {
      customerName: customerName || job.customerId,
      signatureData: signatureData ? 'Captured digital signature' : 'Signed on glass',
      handoverConfirmed: true,
      signOffTime: new Date().toISOString(),
      signedBy: customerName || 'Customer',
      notes: notes || '',
    };

    const mergedNotes = JSON.stringify({
      ...existingNotesObj,
      customerSignoff: signoffRecord,
    });

    // If signatureData contains an image URL, record as HANDOVER photo
    if (signatureData && (signatureData.startsWith('data:image') || signatureData.startsWith('http'))) {
      await prisma.installationPhoto.create({
        data: {
          installationId: id,
          category: 'HANDOVER',
          url: signatureData,
          caption: `Customer Digital Signature - ${customerName}`,
          uploadedBy: req.user.name || 'Customer Handover',
        }
      });
    }

    const updatedJob = await prisma.installationJob.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        progressPercent: 100,
        actualEndAt: new Date(),
        notes: mergedNotes,
      },
      include: {
        project: true,
        customer: true,
        checklists: true,
        photos: true,
        materials: { include: { product: true } },
        assignments: { include: { user: true } },
      }
    });

    res.json({
      success: true,
      message: 'Zero-defect handover certified and job completed!',
      signoff: signoffRecord,
      installation: updatedJob,
    });
  } catch (error) {
    console.error('Error recording signoff:', error);
    res.status(500).json({ error: 'Failed to record customer signoff' });
  }
});

module.exports = router;
