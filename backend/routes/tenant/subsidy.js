const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT - SUBSIDY APPLICATIONS
// ----------------------------------------------------

// List all subsidies
router.get('/api/tenant/subsidies', requireTenantAuth, async (req, res) => {
  try {
    const { status, customerId } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const subsidies = await prisma.subsidyApplication.findMany({
      where,
      include: { customer: true, project: true },
      orderBy: { createdAt: 'desc' }
    });

    const metrics = {
      total: subsidies.length,
      submitted: subsidies.filter(s => s.status === 'SUBMITTED').length,
      processing: subsidies.filter(s => s.status === 'PROCESSING').length,
      approved: subsidies.filter(s => s.status === 'APPROVED').length,
      rejected: subsidies.filter(s => s.status === 'REJECTED').length,
      totalAmount: subsidies.filter(s => s.status === 'APPROVED').reduce((sum, s) => sum + (s.amount || 0), 0)
    };

    res.json({ subsidies, metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch subsidies' });
  }
});

// Get subsidy detail
router.get('/api/tenant/subsidies/:id', requireTenantAuth, async (req, res) => {
  try {
    const subsidy = await prisma.subsidyApplication.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { customer: true, project: true }
    });
    if (!subsidy) return res.status(404).json({ error: 'Subsidy application not found' });
    res.json({ subsidy });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subsidy details' });
  }
});

// Create subsidy application
router.post('/api/tenant/subsidies', requireTenantAuth, async (req, res) => {
  try {
    const { customerId, projectId, applicationNo, amount } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });

    const subsidy = await prisma.subsidyApplication.create({
      data: {
        tenantId: req.user.tenantId,
        customerId,
        projectId: projectId || null,
        applicationNo: applicationNo || `SUB-${Date.now()}`,
        amount: parseFloat(amount) || 0,
        status: 'SUBMITTED'
      },
      include: { customer: true, project: true }
    });
    res.status(201).json({ subsidy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create subsidy application' });
  }
});

// Update subsidy stage
router.patch('/api/tenant/subsidies/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, applicationNo, amount, documentUrl, documentType } = req.body;
    
    const subsidy = await prisma.subsidyApplication.findUnique({ where: { id: req.params.id, tenantId: req.user.tenantId } });
    if (!subsidy) return res.status(404).json({ error: 'Subsidy application not found' });

    const updateData = {};
    if (status) updateData.status = status;
    if (applicationNo) updateData.applicationNo = applicationNo;
    if (amount !== undefined) updateData.amount = parseFloat(amount);

    if (status === 'CLAIM_APPROVED') {
      if (documentType === 'CLAIM_DOCUMENT' && documentUrl) {
        updateData.claimDocumentUrl = documentUrl;
      } else if (!subsidy.claimDocumentUrl) {
        return res.status(400).json({ error: 'Claim approval document is mandatory to proceed to CLAIM_APPROVED stage.' });
      }
    }

    if (status === 'DISBURSED') {
      if (documentType === 'DISBURSEMENT_PROOF' && documentUrl) {
        updateData.disbursementProofUrl = documentUrl;
      } else if (!subsidy.disbursementProofUrl) {
        return res.status(400).json({ error: 'Disbursement proof is mandatory to finalize the subsidy.' });
      }
    }

    const updated = await prisma.subsidyApplication.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData,
      include: { customer: true, project: true }
    });

    if (updated.projectId) {
      await prisma.projectTimelineEvent.create({
        data: {
          tenantId: req.user.tenantId,
          projectId: updated.projectId,
          title: 'Subsidy Stage Updated',
          description: `Subsidy application moved to ${status}`,
          eventType: 'STAGE_CHANGE'
        }
      });
    }

    res.json({ subsidy: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update subsidy application' });
  }
});

// Delete subsidy
router.delete('/api/tenant/subsidies/:id', requireTenantAuth, async (req, res) => {
  try {
    await prisma.subsidyApplication.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Subsidy application deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete subsidy application' });
  }
});

module.exports = router;
