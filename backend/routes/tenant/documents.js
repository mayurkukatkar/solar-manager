const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { uploadFileBuffer, getSignedUrl } = require('../../services/storageService');
const crypto = require('crypto');

// Utility to track document activity
const trackActivity = async (documentId, userId, action, metadata = {}) => {
  await prisma.documentActivity.create({
    data: { documentId, userId, action, metadata }
  });
};

// 1. GET ALL DOCUMENTS (WITH FILTERS AND SEARCH)
router.get('/api/tenant/documents', requireTenantAuth, async (req, res) => {
  try {
    const { 
      entityType, entityId, category, status, search, 
      customerId, projectId, typeId, sort 
    } = req.query;
    
    const tenantId = req.user.tenantId;

    const where = { tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (projectId) where.projectId = projectId;
    if (typeId) where.documentTypeId = typeId;
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'name') orderBy = { title: 'asc' };
    if (sort === 'expiry') orderBy = { expiryDate: 'asc' };

    const documents = await prisma.document.findMany({
      where,
      orderBy,
      include: {
        user: { select: { name: true, email: true } },
        customer: { select: { name: true } },
        project: { select: { id: true, name: true, projectNumber: true } },
        tags: { include: { tag: true } },
        documentType: true
      }
    });

    // Auto-refresh signed URLs for private Supabase bucket storage
    const enrichedDocs = await Promise.all(
      documents.map(async (doc) => {
        if (doc.storageKey) {
          const freshUrl = await getSignedUrl(doc.storageKey, 86400 * 7);
          if (freshUrl) {
            return { ...doc, fileUrl: freshUrl };
          }
        }
        return doc;
      })
    );

    res.json(enrichedDocs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// 1.5. GET PROJECT-CENTRIC DOCUMENT DOSSIER & READINESS SUMMARY
router.get('/api/tenant/documents/projects-summary', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const projects = await prisma.project.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        projectNumber: true,
        capacity: true,
        currentStage: true,
        status: true,
        customer: {
          select: { id: true, name: true, mobile: true, email: true, consumerNumber: true }
        },
        Document: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            storageKey: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = await Promise.all(
      projects.map(async (p) => {
        const rawDocs = p.Document || [];
        // Refresh signed URLs if needed
        const docs = await Promise.all(
          rawDocs.map(async (d) => {
            if (d.storageKey) {
              const fresh = await getSignedUrl(d.storageKey, 86400 * 7);
              if (fresh) return { ...d, fileUrl: fresh };
            }
            return d;
          })
        );

        const total = docs.length;
        const verified = docs.filter(d => d.status === 'VERIFIED').length;
        const pending = docs.filter(d => ['PENDING_UPLOAD', 'UPLOADED', 'UNDER_REVIEW'].includes(d.status)).length;

        // Essential checklist items for Indian Solar EPC
        const hasBill = docs.some(d => d.title.toLowerCase().includes('bill') || d.category === 'Electricity / DISCOM');
        const hasKyc = docs.some(d => d.title.toLowerCase().includes('aadhaar') || d.title.toLowerCase().includes('pan') || d.category === 'Customer KYC');
        const hasBank = docs.some(d => d.title.toLowerCase().includes('cheque') || d.title.toLowerCase().includes('passbook') || d.title.toLowerCase().includes('bank'));
        const hasPhotos = docs.some(d => d.title.toLowerCase().includes('photo') || d.title.toLowerCase().includes('roof') || d.title.toLowerCase().includes('site'));

        let readinessScore = 0;
        if (hasBill) readinessScore += 30;
        if (hasKyc) readinessScore += 25;
        if (hasBank) readinessScore += 25;
        if (hasPhotos) readinessScore += 20;

        const missingChecklist = [];
        if (!hasBill) missingChecklist.push('Electricity Bill (DISCOM)');
        if (!hasKyc) missingChecklist.push('Aadhaar / KYC ID');
        if (!hasBank) missingChecklist.push('Bank Cheque / Passbook (DBT)');
        if (!hasPhotos) missingChecklist.push('Rooftop Survey Photos');

        return {
          id: p.id,
          name: p.name,
          projectNumber: p.projectNumber,
          capacity: p.capacity,
          currentStage: p.currentStage,
          status: p.status,
          customer: p.customer,
          totalDocuments: total,
          verifiedDocuments: verified,
          pendingDocuments: pending,
          readinessScore,
          missingChecklist,
          isDbtReady: hasKyc && hasBank,
          isDiscomReady: hasBill,
          documents: docs
        };
      })
    );

    res.json({ projects: summary });
  } catch (error) {
    console.error('Error fetching project document summary:', error);
    res.status(500).json({ error: 'Failed to fetch project documents summary' });
  }
});

// 2. GET DOCUMENT CHECKLIST FOR PROJECT
router.get('/api/tenant/projects/:projectId/document-checklist', requireTenantAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;

    // Get project
    const project = await prisma.project.findUnique({ where: { id: projectId, tenantId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Get required document types for this project type (e.g. RESIDENTIAL)
    const documentTypes = await prisma.documentType.findMany({
      where: { 
        tenantId, 
        isRequired: true,
        OR: [
          { applicableProjectType: project.type },
          { applicableProjectType: null }
        ]
      }
    });

    // Get uploaded documents for this project
    const projectDocs = await prisma.document.findMany({
      where: { tenantId, projectId }
    });

    const checklist = documentTypes.map(type => {
      const doc = projectDocs.find(d => d.documentTypeId === type.id);
      return {
        documentTypeId: type.id,
        name: type.name,
        category: type.category,
        isRequired: true,
        documentId: doc ? doc.id : null,
        status: doc ? doc.status : 'MISSING',
        fileUrl: doc ? doc.fileUrl : null,
        documentDate: doc ? doc.documentDate : null
      };
    });
    
    // Add documents that are uploaded but not strictly required
    projectDocs.forEach(doc => {
      if (!checklist.find(c => c.documentTypeId === doc.documentTypeId)) {
        checklist.push({
          documentTypeId: doc.documentTypeId,
          name: doc.title,
          category: doc.category,
          isRequired: false,
          documentId: doc.id,
          status: doc.status,
          fileUrl: doc.fileUrl,
          documentDate: doc.documentDate
        });
      }
    });

    res.json(checklist);
  } catch (error) {
    console.error('Error fetching document checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// 3. UPLOAD A DOCUMENT
router.post('/api/tenant/documents/upload', requireTenantAuth, upload.single('file'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { 
      title, description, category, entityType, entityId, 
      documentTypeId, customerId, projectId, documentDate, expiryDate 
    } = req.body;

    if (!req.file && !title) {
      return res.status(400).json({ error: 'Please provide a file or a title for the document.' });
    }

    let finalTitle = title || (req.file ? req.file.originalname : 'Untitled Document');
    let uploadedMeta = null;
    if (req.file) {
      uploadedMeta = await uploadFileBuffer(req.file, 'documents', req);
    }

    const document = await prisma.document.create({
      data: {
        tenantId,
        documentTypeId: documentTypeId || null,
        title: finalTitle,
        description,
        category,
        fileUrl: uploadedMeta ? uploadedMeta.fileUrl : null,
        fileType: uploadedMeta ? uploadedMeta.fileType : null,
        fileSize: uploadedMeta ? uploadedMeta.fileSize : null,
        storageKey: uploadedMeta ? uploadedMeta.storageKey : null,
        entityType,
        entityId,
        customerId: customerId || null,
        projectId: projectId || null,
        documentDate: documentDate ? new Date(documentDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        uploadedBy: userId,
        status: uploadedMeta ? 'UPLOADED' : 'PENDING_UPLOAD',
        version: 1
      }
    });

    await trackActivity(document.id, userId, req.file ? 'UPLOADED' : 'REQUESTED', { 
      filename: req.file ? req.file.originalname : null 
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// 4. GET DOCUMENT DETAILS
router.get('/api/tenant/documents/:id', requireTenantAuth, async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        user: { select: { name: true, email: true } },
        customer: true,
        project: true,
        versions: { orderBy: { versionNumber: 'desc' }, include: { user: { select: { name: true } } } },
        activities: { orderBy: { createdAt: 'desc' } },
        tags: { include: { tag: true } }
      }
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// 5. UPDATE DOCUMENT METADATA
router.patch('/api/tenant/documents/:id', requireTenantAuth, async (req, res) => {
  try {
    const { title, description, category, expiryDate } = req.body;
    
    const doc = await prisma.document.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: {
        title, description, category,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined
      }
    });
    
    await trackActivity(doc.id, req.user.userId, 'UPDATED', { fields: Object.keys(req.body) });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// 6. DELETE DOCUMENT
router.delete('/api/tenant/documents/:id', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await prisma.document.delete({
      where: { id, tenantId }
    });

    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// 7. VERIFY / APPROVE DOCUMENT
router.post('/api/tenant/documents/:id/verify', requireTenantAuth, async (req, res) => {
  try {
    const doc = await prisma.document.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { status: 'VERIFIED' }
    });
    await trackActivity(doc.id, req.user.userId, 'VERIFIED');
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify document' });
  }
});

// 8. REJECT DOCUMENT
router.post('/api/tenant/documents/:id/reject', requireTenantAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const doc = await prisma.document.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { status: 'REJECTED' }
    });
    await trackActivity(doc.id, req.user.userId, 'REJECTED', { reason });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject document' });
  }
});

// 9. UPLOAD NEW VERSION
router.post('/api/tenant/documents/:id/version', requireTenantAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const existingDoc = await prisma.document.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });

    if (!existingDoc) return res.status(404).json({ error: 'Document not found' });

    // Save current as version
    await prisma.documentVersion.create({
      data: {
        documentId: existingDoc.id,
        versionNumber: existingDoc.version,
        fileUrl: existingDoc.fileUrl,
        fileType: existingDoc.fileType,
        fileSize: existingDoc.fileSize,
        storageKey: existingDoc.storageKey,
        uploadedBy: existingDoc.uploadedBy
      }
    });

    let uploadedMeta = null;
    if (req.file) {
      uploadedMeta = await uploadFileBuffer(req.file, 'documents', req);
    }

    // Update main document
    const updatedDoc = await prisma.document.update({
      where: { id: existingDoc.id },
      data: {
        fileUrl: uploadedMeta ? uploadedMeta.fileUrl : existingDoc.fileUrl,
        fileType: uploadedMeta ? uploadedMeta.fileType : existingDoc.fileType,
        fileSize: uploadedMeta ? uploadedMeta.fileSize : existingDoc.fileSize,
        storageKey: uploadedMeta ? uploadedMeta.storageKey : existingDoc.storageKey,
        version: existingDoc.version + 1,
        status: 'UPLOADED',
        uploadedBy: req.user.userId
      }
    });

    await trackActivity(updatedDoc.id, req.user.userId, 'NEW_VERSION', { version: updatedDoc.version });

    res.json(updatedDoc);
  } catch (error) {
    console.error('Error uploading version:', error);
    res.status(500).json({ error: 'Failed to upload new version' });
  }
});

// 10. GENERATE SHARE LINK
router.post('/api/tenant/documents/:id/share', requireTenantAuth, async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Mock signed url generation
    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${shareToken}`;
    
    await trackActivity(doc.id, req.user.userId, 'SHARED', { shareUrl });

    res.json({ shareUrl, expiresIn: '24h' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// 11. DOCUMENT CATEGORIES & TYPES
router.get('/api/tenant/document-settings', requireTenantAuth, async (req, res) => {
  try {
    const types = await prisma.documentType.findMany({
      where: { tenantId: req.user.tenantId }
    });
    res.json({ types });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// 12. PROJECT DOCUMENT READINESS
router.get('/api/tenant/projects/:projectId/document-readiness', requireTenantAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;

    const project = await prisma.project.findUnique({ where: { id: projectId, tenantId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const requiredTypes = await prisma.documentType.findMany({
      where: { 
        tenantId, 
        isRequired: true,
        OR: [{ applicableProjectType: project.type }, { applicableProjectType: null }]
      }
    });

    const docs = await prisma.document.findMany({
      where: { tenantId, projectId }
    });

    let completed = 0;
    let required = requiredTypes.length;
    let pending = 0;
    let missingDocs = [];

    requiredTypes.forEach(rt => {
      const doc = docs.find(d => d.documentTypeId === rt.id);
      if (!doc || doc.status === 'MISSING' || doc.status === 'PENDING_UPLOAD') {
        missingDocs.push(rt.name);
      } else if (doc.status === 'VERIFIED') {
        completed++;
      } else {
        pending++;
      }
    });

    let score = required === 0 ? 100 : Math.round((completed / required) * 100);

    let readinessStatus = 'Ready for Installation ✓';
    if (score < 100) readinessStatus = 'Installation Blocked';

    res.json({
      score,
      required,
      completed,
      pending,
      missingDocs,
      readinessStatus
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate readiness' });
  }
});

// 13. GET ON-DEMAND SIGNED URL FOR PRIVATE STORAGE
router.get('/api/tenant/documents/:id/secure-url', requireTenantAuth, async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.storageKey) {
      const signedUrl = await getSignedUrl(doc.storageKey, 3600); // 1-hour secure link
      if (signedUrl) {
        return res.json({ url: signedUrl, title: doc.title, fileType: doc.fileType });
      }
    }

    res.json({ url: doc.fileUrl, title: doc.title, fileType: doc.fileType });
  } catch (error) {
    console.error('Error generating secure URL:', error);
    res.status(500).json({ error: 'Failed to generate secure URL' });
  }
});

module.exports = router;
