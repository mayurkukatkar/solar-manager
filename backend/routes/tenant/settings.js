const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { uploadFileBuffer } = require('../../services/storageService');

// TENANT - SETTINGS & COMPANY PROFILE
// ----------------------------------------------------

// Get tenant profile / settings
router.get('/api/tenant/settings', requireTenantAuth, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { users: true, projects: true, leads: true, customers: true } }
      }
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ tenant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update tenant profile
router.patch('/api/tenant/settings', requireTenantAuth, async (req, res) => {
  try {
    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Admin can update settings' });
    }

    const {
      name, legalName, email, phone, address, city, state, country, pincode,
      gstin, pan, website, tagline, msmeNumber, contractorLicense,
      logoUrl, signatureUrl, companyStampUrl, signatoryName, signatoryTitle,
      primaryColor, accentColor, bankDetails, commercialDefaults, documentPrefixes
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (legalName !== undefined) updateData.legalName = legalName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (gstin !== undefined) updateData.gstin = gstin;
    if (pan !== undefined) updateData.pan = pan;
    if (website !== undefined) updateData.website = website;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (msmeNumber !== undefined) updateData.msmeNumber = msmeNumber;
    if (contractorLicense !== undefined) updateData.contractorLicense = contractorLicense;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (signatureUrl !== undefined) updateData.signatureUrl = signatureUrl;
    if (companyStampUrl !== undefined) updateData.companyStampUrl = companyStampUrl;
    if (signatoryName !== undefined) updateData.signatoryName = signatoryName;
    if (signatoryTitle !== undefined) updateData.signatoryTitle = signatoryTitle;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (accentColor !== undefined) updateData.accentColor = accentColor;
    if (bankDetails !== undefined) updateData.bankDetails = bankDetails;
    if (commercialDefaults !== undefined) updateData.commercialDefaults = commercialDefaults;
    if (documentPrefixes !== undefined) updateData.documentPrefixes = documentPrefixes;

    const tenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: updateData
    });
    res.json({ tenant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Upload image (logo / signature)
router.post('/api/tenant/settings/upload', requireTenantAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const uploaded = await uploadFileBuffer(req.file, 'settings', req);
    res.json({ url: uploaded.fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Tenant audit logs
router.get('/api/tenant/audit-logs', requireTenantAuth, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json({ logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Tenant notifications (announcements from platform)
router.get('/api/tenant/notifications', requireTenantAuth, async (req, res) => {
  try {
    const notifications = await prisma.announcement.findMany({
      where: {
        OR: [
          { target: 'ALL' },
          { target: 'SPECIFIC_TENANT' }
        ],
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
