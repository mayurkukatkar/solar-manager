const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireTenantAuth } = require('../../middleware/auth');

// ----------------------------------------------------
// 1. GET ALL TEMPLATES FOR TENANT
// ----------------------------------------------------
router.get('/api/tenant/templates', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { projectType } = req.query;

    const where = { tenantId };
    if (projectType && projectType !== 'ALL') {
      where.OR = [
        { projectType: 'ALL' },
        { projectType }
      ];
    }

    const templates = await prisma.proposalTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch proposal templates' });
  }
});

// ----------------------------------------------------
// 2. GET SINGLE TEMPLATE
// ----------------------------------------------------
router.get('/api/tenant/templates/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const template = await prisma.proposalTemplate.findFirst({
      where: { id, tenantId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Proposal template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Error fetching template details:', error);
    res.status(500).json({ error: 'Failed to fetch template details' });
  }
});

// ----------------------------------------------------
// 3. CREATE CUSTOM TEMPLATE
// ----------------------------------------------------
router.post('/api/tenant/templates', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      name,
      code,
      description,
      projectType = 'RESIDENTIAL',
      isDefault = false,
      primaryColor = '#0284c7',
      accentColor = '#059669',
      fontFamily = 'Inter',
      coverLayout = 'MODERN_FULL',
      showFinancialCharts = true,
      showEquipmentImages = true,
      headerText,
      footerText,
      showPageNumbers = true,
      sections,
      defaultScope,
      defaultWarranties,
      defaultTerms,
      defaultMilestones,
      defaultExclusions,
      signatoryName,
      signatoryTitle,
      signatureUrl,
      companyStampUrl
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    const templateCode = code || `template_${Date.now()}`;

    // If marked as default, unset other defaults for the same project type
    if (isDefault) {
      await prisma.proposalTemplate.updateMany({
        where: { tenantId, projectType },
        data: { isDefault: false }
      });
    }

    const template = await prisma.proposalTemplate.create({
      data: {
        tenantId,
        name,
        code: templateCode,
        description,
        projectType,
        isDefault,
        primaryColor,
        accentColor,
        fontFamily,
        coverLayout,
        showFinancialCharts,
        showEquipmentImages,
        headerText,
        footerText,
        showPageNumbers,
        sections: sections || [],
        defaultScope,
        defaultWarranties,
        defaultTerms,
        defaultMilestones,
        defaultExclusions,
        signatoryName,
        signatoryTitle,
        signatureUrl,
        companyStampUrl
      }
    });

    res.status(201).json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template', details: error.message });
  }
});

// ----------------------------------------------------
// 4. UPDATE TEMPLATE
// ----------------------------------------------------
router.patch('/api/tenant/templates/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const existing = await prisma.proposalTemplate.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Proposal template not found' });
    }

    const {
      name,
      description,
      projectType,
      isDefault,
      primaryColor,
      accentColor,
      fontFamily,
      coverLayout,
      showFinancialCharts,
      showEquipmentImages,
      headerText,
      footerText,
      showPageNumbers,
      sections,
      defaultScope,
      defaultWarranties,
      defaultTerms,
      defaultMilestones,
      defaultExclusions,
      signatoryName,
      signatoryTitle,
      signatureUrl,
      companyStampUrl
    } = req.body;

    // Handle default unsetting
    if (isDefault && !existing.isDefault) {
      await prisma.proposalTemplate.updateMany({
        where: { tenantId, projectType: projectType || existing.projectType },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.proposalTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(projectType && { projectType }),
        ...(isDefault !== undefined && { isDefault }),
        ...(primaryColor && { primaryColor }),
        ...(accentColor && { accentColor }),
        ...(fontFamily && { fontFamily }),
        ...(coverLayout && { coverLayout }),
        ...(showFinancialCharts !== undefined && { showFinancialCharts }),
        ...(showEquipmentImages !== undefined && { showEquipmentImages }),
        ...(headerText !== undefined && { headerText }),
        ...(footerText !== undefined && { footerText }),
        ...(showPageNumbers !== undefined && { showPageNumbers }),
        ...(sections && { sections }),
        ...(defaultScope !== undefined && { defaultScope }),
        ...(defaultWarranties !== undefined && { defaultWarranties }),
        ...(defaultTerms !== undefined && { defaultTerms }),
        ...(defaultMilestones !== undefined && { defaultMilestones }),
        ...(defaultExclusions !== undefined && { defaultExclusions }),
        ...(signatoryName !== undefined && { signatoryName }),
        ...(signatoryTitle !== undefined && { signatoryTitle }),
        ...(signatureUrl !== undefined && { signatureUrl }),
        ...(companyStampUrl !== undefined && { companyStampUrl })
      }
    });

    res.json({ template: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template', details: error.message });
  }
});

// ----------------------------------------------------
// 5. DUPLICATE TEMPLATE
// ----------------------------------------------------
router.post('/api/tenant/templates/:id/duplicate', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const source = await prisma.proposalTemplate.findFirst({
      where: { id, tenantId }
    });

    if (!source) {
      return res.status(404).json({ error: 'Source template not found' });
    }

    const duplicated = await prisma.proposalTemplate.create({
      data: {
        tenantId,
        name: `${source.name} (Copy)`,
        code: `${source.code}_copy_${Date.now()}`,
        description: source.description,
        projectType: source.projectType,
        isDefault: false,
        primaryColor: source.primaryColor,
        accentColor: source.accentColor,
        fontFamily: source.fontFamily,
        coverLayout: source.coverLayout,
        showFinancialCharts: source.showFinancialCharts,
        showEquipmentImages: source.showEquipmentImages,
        headerText: source.headerText,
        footerText: source.footerText,
        showPageNumbers: source.showPageNumbers,
        sections: source.sections,
        defaultScope: source.defaultScope,
        defaultWarranties: source.defaultWarranties,
        defaultTerms: source.defaultTerms,
        defaultMilestones: source.defaultMilestones,
        defaultExclusions: source.defaultExclusions,
        signatoryName: source.signatoryName,
        signatoryTitle: source.signatoryTitle,
        signatureUrl: source.signatureUrl,
        companyStampUrl: source.companyStampUrl
      }
    });

    res.status(201).json({ template: duplicated });
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ error: 'Failed to duplicate template', details: error.message });
  }
});

// ----------------------------------------------------
// 6. SET AS DEFAULT TEMPLATE
// ----------------------------------------------------
router.post('/api/tenant/templates/:id/set-default', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const template = await prisma.proposalTemplate.findFirst({
      where: { id, tenantId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Unset current default
    await prisma.proposalTemplate.updateMany({
      where: { tenantId, projectType: template.projectType },
      data: { isDefault: false }
    });

    // Set new default
    const updated = await prisma.proposalTemplate.update({
      where: { id },
      data: { isDefault: true }
    });

    res.json({ success: true, template: updated });
  } catch (error) {
    console.error('Error setting default template:', error);
    res.status(500).json({ error: 'Failed to set default template' });
  }
});

// ----------------------------------------------------
// 7. DELETE TEMPLATE
// ----------------------------------------------------
router.delete('/api/tenant/templates/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const count = await prisma.proposalTemplate.count({ where: { tenantId } });
    if (count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only proposal template for this tenant.' });
    }

    const template = await prisma.proposalTemplate.findFirst({
      where: { id, tenantId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Unlink quotations if any before deleting
    await prisma.quotation.updateMany({
      where: { templateId: id },
      data: { templateId: null }
    });

    await prisma.proposalTemplate.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;
