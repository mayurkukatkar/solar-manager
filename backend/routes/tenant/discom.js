const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// TENANT - DISCOM APPLICATIONS
// ----------------------------------------------------

// Get discom detail by project ID
router.get('/api/tenant/projects/:projectId/discom', requireTenantAuth, async (req, res) => {
  try {
    const discom = await prisma.discomApplication.findUnique({
      where: { projectId: req.params.projectId, tenantId: req.user.tenantId }
    });
    res.json({ discom });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch DISCOM details' });
  }
});

// Create discom application
router.post('/api/tenant/projects/:projectId/discom', requireTenantAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const existing = await prisma.discomApplication.findUnique({ where: { projectId } });
    if (existing) return res.status(400).json({ error: 'DISCOM application already exists for this project' });

    const discom = await prisma.discomApplication.create({
      data: {
        tenantId: req.user.tenantId,
        projectId,
        status: 'FEASIBILITY_PENDING'
      }
    });
    res.status(201).json({ discom });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create DISCOM application' });
  }
});

// Update discom stage (with strict document validation)
router.patch('/api/tenant/projects/:projectId/discom/stage', requireTenantAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, documentUrl, documentType } = req.body;
    
    const discom = await prisma.discomApplication.findUnique({ where: { projectId, tenantId: req.user.tenantId } });
    if (!discom) return res.status(404).json({ error: 'DISCOM application not found' });

    const updateData = { status };
    
    // Strict Validation Rule: Moving to CEIG_INSPECTION requires Feasibility Letter
    if (status === 'CEIG_INSPECTION') {
      if (documentType === 'FEASIBILITY_LETTER' && documentUrl) {
        updateData.feasibilityDocumentUrl = documentUrl;
      } else if (!discom.feasibilityDocumentUrl) {
        return res.status(400).json({ error: 'Feasibility Approval document is mandatory to proceed to CEIG Inspection.' });
      }
    }

    // Strict Validation Rule: Moving to METER_TESTING requires CEIG Document
    if (status === 'METER_TESTING') {
      if (documentType === 'CEIG_APPROVAL' && documentUrl) {
        updateData.ceigDocumentUrl = documentUrl;
      } else if (!discom.ceigDocumentUrl) {
        return res.status(400).json({ error: 'CEIG Approval document is mandatory to proceed to Meter Testing.' });
      }
    }

    // Strict Validation Rule: Moving to NET_METER_INSTALLED requires Meter Test Report
    if (status === 'NET_METER_INSTALLED') {
        if (documentType === 'METER_TEST_REPORT' && documentUrl) {
          updateData.meterTestReportUrl = documentUrl;
        } else if (!discom.meterTestReportUrl) {
          return res.status(400).json({ error: 'Meter Test Report is mandatory to proceed to Net-Meter Installed.' });
        }
    }

    // Strict Validation Rule: Moving to GRID_SYNCHRONIZED requires Net Meter Certificate
    if (status === 'GRID_SYNCHRONIZED') {
        if (documentType === 'NET_METER_CERTIFICATE' && documentUrl) {
          updateData.netMeterCertificateUrl = documentUrl;
        } else if (!discom.netMeterCertificateUrl) {
          return res.status(400).json({ error: 'Net-Meter Certificate is mandatory to finalize Grid Synchronization.' });
        }
    }

    const updated = await prisma.discomApplication.update({
      where: { projectId },
      data: updateData
    });

    // Phase 2 Sync: Log timeline event
    await prisma.projectTimelineEvent.create({
      data: {
        tenantId: req.user.tenantId,
        projectId,
        title: 'DISCOM Stage Updated',
        description: `DISCOM application moved to ${status}`,
        eventType: 'STAGE_CHANGE'
      }
    });

    res.json({ discom: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update DISCOM stage' });
  }
});

// Document Upload endpoint for Discom
router.post('/api/tenant/projects/:projectId/discom/upload', requireTenantAuth, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        res.json({ documentUrl: req.file.path });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

module.exports = router;
