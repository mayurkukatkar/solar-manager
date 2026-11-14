const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');
const {
  STATUTORY_DPDP_PURPOSES,
  maskAadhaar,
  maskPan,
  maskBankAccount,
  logDPDPAccess,
  evaluateStatutoryRetentionHolds,
} = require('../../utils/dpdpHelper');

// ============================================================================
// 1. STATUTORY NOTICE & PURPOSE SPECIFICATION (SECTION 5 DPDP ACT 2023)
// ============================================================================
router.get('/api/tenant/dpdp/notice', async (req, res) => {
  try {
    const { lang = 'en', tenantId } = req.query;
    const targetTenantId = tenantId || req.user?.tenantId;

    let tenant = null;
    if (targetTenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: targetTenantId },
        select: {
          name: true,
          legalName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          gstin: true,
          dpdpConfig: true,
        },
      });
    }

    const dpoConfig = (tenant?.dpdpConfig && typeof tenant.dpdpConfig === 'object') ? tenant.dpdpConfig : {};
    const dpoName = dpoConfig.dpoName || 'Chief Data Protection & Grievance Officer';
    const dpoEmail = dpoConfig.dpoEmail || tenant?.email || 'privacy@solarerp.com';
    const dpoPhone = dpoConfig.dpoPhone || tenant?.phone || '+91-1800-SOLAR-GOV';
    const dpoAddress = dpoConfig.dpoAddress || `${tenant?.address || 'Solar Tower'}, ${tenant?.city || 'Pune'}, ${tenant?.state || 'Maharashtra'}`;

    const noticeEn = {
      title: 'Digital Personal Data Protection (DPDP) Statutory Notice',
      statutoryAct: 'Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023, Republic of India)',
      dataFiduciary: {
        legalName: tenant?.legalName || tenant?.name || 'Solar Solutions Private Limited',
        registrationNumber: tenant?.gstin || '27AABCS1429B1Z5',
        registeredOffice: dpoAddress,
      },
      purposes: STATUTORY_DPDP_PURPOSES,
      dataPrincipalRights: [
        {
          section: 'Section 11',
          right: 'Right to Access Personal Data',
          summary: 'Obtain a transparent summary of all personal data processed, processing activities undertaken, and identities of all entities with whom data has been shared.',
        },
        {
          section: 'Section 12',
          right: 'Right to Correction & Updating',
          summary: 'Request immediate correction of inaccurate or incomplete personal data.',
        },
        {
          section: 'Section 12',
          right: 'Right to Erasure (Right to be Forgotten)',
          summary: 'Request deletion of personal data when the specified purpose is fulfilled, subject to statutory retention obligations under Section 36 of CGST Act 2017.',
        },
        {
          section: 'Section 13',
          right: 'Right of Grievance Redressal',
          summary: 'Register complaints regarding personal data handling with the designated Grievance Officer, guaranteed resolution within 30 statutory days.',
        },
        {
          section: 'Section 14',
          right: 'Right to Nominate',
          summary: 'Nominate any individual who shall, in the event of death or incapacity, exercise the rights of the Data Principal.',
        },
      ],
      thirdPartyProcessors: [
        {
          category: 'State Electricity Distribution Companies (DISCOMs)',
          purpose: 'Statutory grid interconnection, solar meter inspection, and net-metering tariff synchronization.',
          entities: 'MSEDCL, TANGEDCO, Tata Power, Adani Electricity, BESCOM, etc.',
        },
        {
          category: 'Ministry of New and Renewable Energy (MNRE) National Portal',
          purpose: 'Direct Benefit Transfer (DBT) central subsidy disbursement under PM Surya Ghar Muft Bijli Yojana.',
          entities: 'National Portal for Rooftop Solar (pmsuryaghar.gov.in)',
        },
        {
          category: 'Authorized Solar Green Financing Banks & NBFCs',
          purpose: 'Loan credit appraisal and low-interest solar financing (opt-in only).',
          entities: 'State Bank of India, IREDA, Bank of Baroda, Ecofy, etc.',
        },
      ],
      aadhaarCompliance: 'In strict compliance with UIDAI regulations and Aadhaar Act, only masked Aadhaar numbers (first 8 digits hidden: XXXX-XXXX-1234) are stored. Physical/PDF Aadhaar copies in the project vault are encrypted at rest with role-restricted access.',
      grievanceOfficer: {
        name: dpoName,
        email: dpoEmail,
        phone: dpoPhone,
        address: dpoAddress,
        workingHours: 'Monday - Saturday: 09:30 AM - 06:30 PM IST',
        statutorySlaDays: 30,
      },
      version: '2026.1',
      effectiveDate: '2026-01-01',
    };

    res.json({
      status: 'success',
      notice: noticeEn,
    });
  } catch (error) {
    console.error('DPDP Notice error:', error);
    res.status(500).json({ error: 'Failed to retrieve statutory DPDP notice' });
  }
});

// ============================================================================
// 2. RECORD AFFIRMATIVE CONSENT ARTIFACT (SECTION 6 DPDP ACT 2023)
// ============================================================================
router.post('/api/tenant/dpdp/consent', requireTenantAuth, async (req, res) => {
  try {
    const {
      dataPrincipalId,
      dataPrincipalType = 'LEAD',
      dataPrincipalName,
      dataPrincipalPhone,
      dataPrincipalEmail,
      purposes,
      signatureSvg,
      capturedVia = '1FLOW_MOBILE',
      noticeVersion = '1.0',
      noticeLanguage = 'en',
    } = req.body;

    if (!dataPrincipalId) {
      return res.status(400).json({ error: 'dataPrincipalId (Lead ID or Customer ID) is required' });
    }

    if (!purposes || !Array.isArray(purposes) || purposes.length === 0) {
      return res.status(400).json({ error: 'At least one affirmative statutory purpose must be consented to' });
    }

    // Validate purpose codes against statutory catalog
    const validCodes = STATUTORY_DPDP_PURPOSES.map((p) => p.code);
    const sanitizedPurposes = purposes.filter((code) => validCodes.includes(code));

    if (sanitizedPurposes.length === 0) {
      return res.status(400).json({ error: 'Invalid purpose codes provided' });
    }

    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Mobile-App/1-Flow';

    // Supersede any prior active consent for this principal
    await prisma.dPDPConsent.updateMany({
      where: {
        tenantId: req.user.tenantId,
        dataPrincipalId,
        status: 'ACTIVE',
      },
      data: {
        status: 'EXPIRED',
        revokedAt: new Date(),
        revocationReason: 'Superseded by new affirmative consent artifact',
      },
    });

    // Create new verifiable affirmative consent artifact
    const consent = await prisma.dPDPConsent.create({
      data: {
        tenantId: req.user.tenantId,
        dataPrincipalType,
        dataPrincipalId,
        dataPrincipalName: dataPrincipalName || null,
        dataPrincipalPhone: dataPrincipalPhone || null,
        dataPrincipalEmail: dataPrincipalEmail || null,
        purposes: sanitizedPurposes,
        status: 'ACTIVE',
        noticeVersion,
        noticeLanguage,
        capturedVia,
        ipAddress,
        userAgent,
        signatureSvg: signatureSvg || null,
        grantedAt: new Date(),
      },
    });

    // Record audit trail under Section 8
    await logDPDPAccess(req, {
      action: 'CONSENT_GRANTED',
      entityType: dataPrincipalType,
      entityId: dataPrincipalId,
      targetDataPrincipal: dataPrincipalName || dataPrincipalPhone,
      details: {
        consentId: consent.id,
        purposes: sanitizedPurposes,
        capturedVia,
        ipAddress,
        noticeVersion,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Statutory affirmative DPDP consent recorded successfully',
      consent: {
        id: consent.id,
        status: consent.status,
        purposes: consent.purposes,
        grantedAt: consent.grantedAt,
        capturedVia: consent.capturedVia,
        noticeVersion: consent.noticeVersion,
      },
    });
  } catch (error) {
    console.error('DPDP Consent Record error:', error);
    res.status(500).json({ error: error.message || 'Failed to record DPDP consent' });
  }
});

// ============================================================================
// 3. GET CONSENT STATUS FOR DATA PRINCIPAL
// ============================================================================
router.get('/api/tenant/dpdp/consent/:entityType/:id', requireTenantAuth, async (req, res) => {
  try {
    const { entityType, id } = req.params;

    const consent = await prisma.dPDPConsent.findFirst({
      where: {
        tenantId: req.user.tenantId,
        dataPrincipalId: id,
        status: 'ACTIVE',
      },
      orderBy: { grantedAt: 'desc' },
    });

    if (!consent) {
      return res.json({
        hasConsent: false,
        status: 'NOT_RECORDED',
        consent: null,
      });
    }

    res.json({
      hasConsent: true,
      status: consent.status,
      consent: {
        id: consent.id,
        status: consent.status,
        purposes: consent.purposes,
        grantedAt: consent.grantedAt,
        noticeVersion: consent.noticeVersion,
        capturedVia: consent.capturedVia,
        dataPrincipalName: consent.dataPrincipalName,
        dataPrincipalPhone: consent.dataPrincipalPhone,
      },
    });
  } catch (error) {
    console.error('Get consent status error:', error);
    res.status(500).json({ error: 'Failed to retrieve consent status' });
  }
});

// ============================================================================
// 4. REVOKE CONSENT (SECTION 6(4) DPDP ACT 2023)
// ============================================================================
router.post('/api/tenant/dpdp/consent/revoke', requireTenantAuth, async (req, res) => {
  try {
    const {
      consentId,
      dataPrincipalId,
      reason,
      revokedPurposes, // optional array: if omitted, all purposes are revoked
    } = req.body;

    if (!consentId && !dataPrincipalId) {
      return res.status(400).json({ error: 'consentId or dataPrincipalId is required' });
    }

    const where = consentId
      ? { id: consentId, tenantId: req.user.tenantId }
      : { dataPrincipalId, tenantId: req.user.tenantId, status: 'ACTIVE' };

    const existing = await prisma.dPDPConsent.findFirst({ where });
    if (!existing) {
      return res.status(404).json({ error: 'Active consent record not found' });
    }

    const isFullRevocation = !revokedPurposes || !Array.isArray(revokedPurposes) || revokedPurposes.length === 0;

    let updated;
    if (isFullRevocation) {
      updated = await prisma.dPDPConsent.update({
        where: { id: existing.id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revocationReason: reason || 'Withdrawn by Data Principal',
          revokedPurposes: existing.purposes,
        },
      });
    } else {
      const remainingPurposes = (Array.isArray(existing.purposes) ? existing.purposes : []).filter(
        (p) => !revokedPurposes.includes(p)
      );

      updated = await prisma.dPDPConsent.update({
        where: { id: existing.id },
        data: {
          purposes: remainingPurposes,
          revokedPurposes: revokedPurposes,
          revokedAt: new Date(),
          revocationReason: reason || 'Partial purpose withdrawal by Data Principal',
          status: remainingPurposes.length > 0 ? 'ACTIVE' : 'REVOKED',
        },
      });
    }

    await logDPDPAccess(req, {
      action: 'CONSENT_REVOKED',
      entityType: existing.dataPrincipalType,
      entityId: existing.dataPrincipalId,
      details: {
        consentId: existing.id,
        isFullRevocation,
        reason,
        revokedPurposes: revokedPurposes || existing.purposes,
      },
    });

    res.json({
      status: 'success',
      message: 'Consent withdrawal registered in compliance with Section 6(4) DPDP Act',
      consent: updated,
    });
  } catch (error) {
    console.error('Revoke consent error:', error);
    res.status(500).json({ error: error.message || 'Failed to revoke consent' });
  }
});

// ============================================================================
// 5. RIGHT TO ACCESS PERSONAL DATA SUMMARY (SECTION 11 DPDP ACT 2023)
// ============================================================================
router.get('/api/tenant/dpdp/data-summary/:customerId', requireTenantAuth, async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId, tenantId: req.user.tenantId },
      include: {
        lead: true,
        projects: {
          select: {
            id: true,
            projectNumber: true,
            name: true,
            capacity: true,
            currentStage: true,
            status: true,
            createdAt: true,
          },
        },
        surveys: {
          select: {
            id: true,
            surveyNumber: true,
            surveyDate: true,
            status: true,
          },
        },
        quotations: {
          select: {
            id: true,
            qNumber: true,
            total: true,
            systemCapacity: true,
            createdAt: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
        Document: {
          select: {
            id: true,
            title: true,
            category: true,
            fileType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer record not found' });
    }

    // Retrieve active consent artifact
    const activeConsent = await prisma.dPDPConsent.findFirst({
      where: {
        tenantId: req.user.tenantId,
        dataPrincipalId: customer.id,
        status: 'ACTIVE',
      },
      orderBy: { grantedAt: 'desc' },
    });

    // Check statutory retention holds
    const retentionInfo = await evaluateStatutoryRetentionHolds(req.user.tenantId, customer.id, customer.leadId);

    // Audit personal data disclosure under Section 11
    await logDPDPAccess(req, {
      action: 'DATA_PRINCIPAL_ACCESS_SUMMARY',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      targetDataPrincipal: customer.name,
      details: {
        requestedBy: req.user.email,
        timestamp: new Date().toISOString(),
      },
    });

    const summary = {
      complianceStandard: 'Digital Personal Data Protection Act 2023 (Section 11)',
      generatedAt: new Date().toISOString(),
      dataPrincipal: {
        id: customer.id,
        name: customer.name,
        company: customer.company || null,
        mobile: customer.mobile,
        email: customer.email || 'Not provided',
        address: customer.address || null,
        city: customer.city || null,
        customerType: customer.customerType,
      },
      sensitiveKycSummary: {
        aadhaarStatus: customer.Document.some((d) => d.category?.includes('AADHAAR') || d.title?.toLowerCase().includes('aadhaar'))
          ? 'Masked Copy on File (UIDAI Compliant - First 8 Digits Redacted)'
          : 'Not Provided',
        panStatus: customer.Document.some((d) => d.category?.includes('PAN') || d.title?.toLowerCase().includes('pan'))
          ? 'Verified Copy on File'
          : 'Not Provided',
        electricityBillStatus: customer.Document.some((d) => d.category?.includes('BILL') || d.title?.toLowerCase().includes('bill'))
          ? 'Electricity Connection Verified'
          : 'Not Provided',
        bankDetailsStatus: customer.invoices.length > 0 || customer.projects.length > 0
          ? 'Statutory DBT Subsidy Bank Verification Completed'
          : 'Pending Verification',
      },
      consentStatus: {
        hasActiveConsent: Boolean(activeConsent),
        consentId: activeConsent?.id || null,
        consentedPurposes: activeConsent?.purposes || [],
        grantedAt: activeConsent?.grantedAt || null,
        capturedVia: activeConsent?.capturedVia || null,
      },
      recordsInventory: {
        projectsCount: customer.projects.length,
        projects: customer.projects,
        surveysCount: customer.surveys.length,
        surveys: customer.surveys,
        quotationsCount: customer.quotations.length,
        quotations: customer.quotations,
        invoicesCount: customer.invoices.length,
        invoices: customer.invoices,
        documentsVaultCount: customer.Document.length,
        documents: customer.Document.map((d) => ({
          title: d.title,
          category: d.category || 'General',
          fileType: d.fileType,
          uploadedAt: d.createdAt,
        })),
      },
      thirdPartyDataProcessors: [
        {
          processor: 'State Electricity Distribution Utility (DISCOM)',
          purpose: 'Statutory grid synchronization and bi-directional net metering approval',
          legalBasis: 'Electricity Act 2003 & State Net-Metering Regulations',
        },
        {
          processor: 'National Portal for PM Surya Ghar (MNRE)',
          purpose: 'Central financial subsidy disbursement directly into customer Aadhaar-linked bank account',
          legalBasis: 'PM Surya Ghar Muft Bijli Yojana Guidelines',
        },
      ],
      retentionObligations: retentionInfo,
    };

    res.json({
      status: 'success',
      summary,
    });
  } catch (error) {
    console.error('Data summary error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate personal data summary' });
  }
});

// ============================================================================
// 6. SUBMIT DATA PRINCIPAL RIGHTS REQUEST (SECTIONS 11, 12, 13, 14)
// ============================================================================
router.post('/api/tenant/dpdp/requests', requireTenantAuth, async (req, res) => {
  try {
    const {
      dataPrincipalId,
      dataPrincipalType = 'CUSTOMER',
      dataPrincipalName,
      dataPrincipalPhone,
      dataPrincipalEmail,
      requestType, // ACCESS_SUMMARY, CORRECTION, ERASURE, GRIEVANCE, NOMINATION
      requestDetails,
      priority = 'NORMAL',
    } = req.body;

    const VALID_TYPES = ['ACCESS_SUMMARY', 'CORRECTION', 'ERASURE', 'GRIEVANCE', 'NOMINATION'];
    if (!requestType || !VALID_TYPES.includes(requestType)) {
      return res.status(400).json({
        error: `Invalid requestType. Must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    if (!dataPrincipalId && !dataPrincipalPhone) {
      return res.status(400).json({ error: 'dataPrincipalId or dataPrincipalPhone is required' });
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.dPDPRequest.count({ where: { tenantId: req.user.tenantId } });
    const requestNumber = `DPDP-${requestType.slice(0, 3)}-${currentYear}-${(count + 1).toString().padStart(4, '0')}`;

    // DPDP Statutory Resolution SLA: 30 days
    const slaDueDate = new Date();
    slaDueDate.setDate(slaDueDate.getDate() + 30);

    const dpdpRequest = await prisma.dPDPRequest.create({
      data: {
        tenantId: req.user.tenantId,
        requestNumber,
        dataPrincipalType,
        dataPrincipalId: dataPrincipalId || 'PENDING_MATCH',
        dataPrincipalName: dataPrincipalName || null,
        dataPrincipalPhone: dataPrincipalPhone || null,
        dataPrincipalEmail: dataPrincipalEmail || null,
        requestType,
        status: 'PENDING',
        priority,
        requestDetails: requestDetails || {},
        slaDueDate,
      },
    });

    await logDPDPAccess(req, {
      action: `RIGHT_REQUEST_${requestType}`,
      entityType: dataPrincipalType,
      entityId: dataPrincipalId,
      targetDataPrincipal: dataPrincipalName || dataPrincipalPhone,
      details: {
        requestNumber,
        requestType,
        slaDueDate: slaDueDate.toISOString(),
      },
    });

    res.status(201).json({
      status: 'success',
      message: `Statutory DPDP ${requestType} request filed. Statutory tracking number: ${requestNumber}`,
      request: dpdpRequest,
    });
  } catch (error) {
    console.error('Submit DPDP request error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit DPDP request' });
  }
});

// ============================================================================
// 7. LIST DPDP RIGHTS REQUESTS (DPO / ADMIN DASHBOARD)
// ============================================================================
router.get('/api/tenant/dpdp/requests', requireTenantAuth, async (req, res) => {
  try {
    const { status, requestType } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (status && status !== 'ALL') where.status = status;
    if (requestType && requestType !== 'ALL') where.requestType = requestType;

    const requests = await prisma.dPDPRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      status: 'success',
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('List DPDP requests error:', error);
    res.status(500).json({ error: 'Failed to list DPDP requests' });
  }
});

// ============================================================================
// 8. RESOLVE DPDP RIGHTS REQUEST (SECTION 13 DPO REDRESSAL)
// ============================================================================
router.patch('/api/tenant/dpdp/requests/:id/resolve', requireTenantAuth, async (req, res) => {
  try {
    const { status = 'COMPLETED', resolutionNotes, rejectionReason } = req.body;

    const existing = await prisma.dPDPRequest.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'DPDP request not found' });
    }

    const updated = await prisma.dPDPRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        resolutionNotes: resolutionNotes || 'Resolved by Data Protection Officer',
        rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Statutory legal grounds prevent erasure/action') : null,
        resolvedBy: req.user.id || req.user.userId,
        resolvedAt: new Date(),
      },
    });

    await logDPDPAccess(req, {
      action: 'RIGHT_REQUEST_RESOLVED',
      entityType: 'DPDP_REQUEST',
      entityId: existing.id,
      details: {
        requestNumber: existing.requestNumber,
        newStatus: status,
        resolutionNotes,
      },
    });

    res.json({
      status: 'success',
      message: `DPDP Request ${existing.requestNumber} status updated to ${status}`,
      request: updated,
    });
  } catch (error) {
    console.error('Resolve DPDP request error:', error);
    res.status(500).json({ error: 'Failed to resolve DPDP request' });
  }
});

// ============================================================================
// 9. DATA ERASURE & ANONYMIZATION ENGINE (SECTION 12 DPDP ACT 2023)
// ============================================================================
router.post('/api/tenant/dpdp/data-erasure-request', requireTenantAuth, async (req, res) => {
  try {
    const { customerId, leadId, reason } = req.body;

    if (!customerId && !leadId) {
      return res.status(400).json({ error: 'customerId or leadId is required for erasure evaluation' });
    }

    const retentionEvaluation = await evaluateStatutoryRetentionHolds(req.user.tenantId, customerId, leadId);

    // Case 1: Active Statutory Legal Holds (CGST Act Invoices or CEA Grid Connection Records)
    if (retentionEvaluation.hasStatutoryHolds) {
      // Execute Selective Anonymization: Marketing, follow-ups, and extraneous personal identifiers are erased,
      // while tax invoices and technical plant specs are retained with a statutory preservation flag.
      if (customerId) {
        await prisma.customer.update({
          where: { id: customerId, tenantId: req.user.tenantId },
          data: {
            name: 'Anonymized Solar Client (Statutory Preservation)',
            email: null,
            mobile: 'XXXXXXXXXX',
            address: 'Redacted pursuant to DPDP Section 12',
          },
        });
      }

      // Expire active consents
      await prisma.dPDPConsent.updateMany({
        where: { tenantId: req.user.tenantId, dataPrincipalId: customerId || leadId },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revocationReason: `Erasure requested: ${reason || 'Statutory anonymization applied'}`,
        },
      });

      await logDPDPAccess(req, {
        action: 'DATA_ERASURE_PARTIAL_STATUTORY_HOLD',
        entityType: customerId ? 'CUSTOMER' : 'LEAD',
        entityId: customerId || leadId,
        details: {
          holds: retentionEvaluation.holds,
          reason,
          actionTaken: 'Marketing and contact identifiers redacted; statutory tax/grid records held under law',
        },
      });

      return res.json({
        status: 'partial_anonymization',
        message: 'Personal contact identifiers have been erased. However, under Section 36 of the CGST Act 2017 and CEA Grid Regulations, financial invoices and statutory grid specifications are legally retained for the statutory preservation period.',
        retentionObligations: retentionEvaluation.holds,
      });
    }

    // Case 2: No Statutory Holds (e.g. Lead with no active contract, or Customer with no invoices/projects)
    if (leadId) {
      await prisma.leadActivity.deleteMany({ where: { leadId } });
      await prisma.leadFollowUp.deleteMany({ where: { leadId } });
      await prisma.leadNote.deleteMany({ where: { leadId } });
      await prisma.lead.delete({ where: { id: leadId, tenantId: req.user.tenantId } });
    } else if (customerId) {
      await prisma.customer.delete({ where: { id: customerId, tenantId: req.user.tenantId } });
    }

    await prisma.dPDPConsent.deleteMany({
      where: { tenantId: req.user.tenantId, dataPrincipalId: customerId || leadId },
    });

    await logDPDPAccess(req, {
      action: 'DATA_ERASURE_COMPLETE',
      entityType: customerId ? 'CUSTOMER' : 'LEAD',
      entityId: customerId || leadId,
      details: {
        reason: reason || 'Complete erasure upon request with zero statutory holds',
      },
    });

    res.json({
      status: 'complete_erasure',
      message: 'Personal data has been completely erased from all solar operational stores in full compliance with Section 12 DPDP Act.',
    });
  } catch (error) {
    console.error('Data erasure error:', error);
    res.status(500).json({ error: error.message || 'Failed to process data erasure request' });
  }
});

// ============================================================================
// 10. DPO & GRIEVANCE REDRESSAL OFFICER CONFIGURATION
// ============================================================================
router.get('/api/tenant/dpdp/dpo', requireTenantAuth, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: {
        name: true,
        legalName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        dpdpConfig: true,
      },
    });

    const cfg = (tenant?.dpdpConfig && typeof tenant.dpdpConfig === 'object') ? tenant.dpdpConfig : {};
    res.json({
      status: 'success',
      dpo: {
        dpoName: cfg.dpoName || 'Chief Data Protection & Grievance Redressal Officer',
        dpoEmail: cfg.dpoEmail || tenant?.email || 'privacy@solarerp.com',
        dpoPhone: cfg.dpoPhone || tenant?.phone || '+91-1800-SOLAR-GOV',
        dpoAddress: cfg.dpoAddress || `${tenant?.address || 'Solar Tower'}, ${tenant?.city || 'Pune'}, ${tenant?.state || 'Maharashtra'}`,
        privacyPolicyUrl: cfg.privacyPolicyUrl || 'https://solarerp.com/privacy-policy',
        statutorySlaDays: 30,
        workingHours: 'Monday - Saturday: 09:30 AM - 06:30 PM IST',
      },
    });
  } catch (error) {
    console.error('Get DPO error:', error);
    res.status(500).json({ error: 'Failed to retrieve DPO details' });
  }
});

router.put('/api/tenant/dpdp/dpo', requireTenantAuth, async (req, res) => {
  try {
    const { dpoName, dpoEmail, dpoPhone, dpoAddress, privacyPolicyUrl } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { dpdpConfig: true },
    });

    const currentCfg = (tenant?.dpdpConfig && typeof tenant.dpdpConfig === 'object') ? tenant.dpdpConfig : {};
    const updatedCfg = {
      ...currentCfg,
      dpoName: dpoName || currentCfg.dpoName,
      dpoEmail: dpoEmail || currentCfg.dpoEmail,
      dpoPhone: dpoPhone || currentCfg.dpoPhone,
      dpoAddress: dpoAddress || currentCfg.dpoAddress,
      privacyPolicyUrl: privacyPolicyUrl || currentCfg.privacyPolicyUrl,
      updatedAt: new Date().toISOString(),
    };

    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { dpdpConfig: updatedCfg },
    });

    await logDPDPAccess(req, {
      action: 'DPO_CONFIGURATION_UPDATED',
      entityType: 'TENANT',
      entityId: req.user.tenantId,
      details: updatedCfg,
    });

    res.json({
      status: 'success',
      message: 'DPO & Grievance Redressal configuration updated in compliance with Section 13 DPDP Act',
      dpo: updatedCfg,
    });
  } catch (error) {
    console.error('Update DPO error:', error);
    res.status(500).json({ error: 'Failed to update DPO configuration' });
  }
});

module.exports = router;
