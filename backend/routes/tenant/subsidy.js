const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// Helper: Calculate PM Surya Ghar Central Subsidy Slab
// 1 kW: ₹30,000 | 2 kW: ₹60,000 | >=3 kW: ₹78,000
const calculatePmSuryaGharSubsidy = (capacityKw) => {
  if (!capacityKw || capacityKw <= 0) return 0;
  if (capacityKw <= 1.0) return 30000;
  if (capacityKw <= 2.0) return 60000;
  return 78000;
};

// ----------------------------------------------------
// PM SURYA GHAR (pmsuryaghar.gov.in) VENDOR STUDIO API
// ----------------------------------------------------

// 1. List PM Surya Ghar Applications with Metrics & Filters
router.get(['/api/tenant/subsidies', '/api/tenant/pmsuryaghar'], requireTenantAuth, async (req, res) => {
  try {
    const { status, portalStage, search, customerId, projectId } = req.query;
    const where = { tenantId: req.user.tenantId };
    
    if (portalStage && portalStage !== 'ALL') {
      where.portalStage = portalStage;
    } else if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customerId) where.customerId = customerId;
    if (projectId) where.projectId = projectId;

    if (search) {
      where.OR = [
        { nationalPortalAppNo: { contains: search, mode: 'insensitive' } },
        { consumerNumber: { contains: search, mode: 'insensitive' } },
        { applicationNo: { contains: search, mode: 'insensitive' } },
        { discomName: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { mobile: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const subsidies = await prisma.subsidyApplication.findMany({
      where,
      include: {
        customer: true,
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            capacity: true,
            currentStage: true,
            status: true,
            quotation: {
              select: {
                id: true,
                qNumber: true,
                panelBrand: true,
                panelWattage: true,
                panelQuantity: true,
                inverterBrand: true,
                inverterCapacity: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute Vendor Portal Key Metrics
    const allTenantSubsidies = await prisma.subsidyApplication.findMany({
      where: { tenantId: req.user.tenantId }
    });

    const metrics = {
      total: allTenantSubsidies.length,
      consumerSelection: allTenantSubsidies.filter(s => s.portalStage === 'CONSUMER_SELECTION').length,
      feasibilityPending: allTenantSubsidies.filter(s => s.portalStage === 'FEASIBILITY_PENDING').length,
      feasibilityApproved: allTenantSubsidies.filter(s => s.portalStage === 'FEASIBILITY_APPROVED').length,
      workCompleted: allTenantSubsidies.filter(s => s.portalStage === 'WORK_COMPLETED').length,
      meterInspected: allTenantSubsidies.filter(s => s.portalStage === 'METER_INSPECTED').length,
      claimGenerated: allTenantSubsidies.filter(s => s.portalStage === 'CLAIM_GENERATED').length,
      dbtDisbursed: allTenantSubsidies.filter(s => s.portalStage === 'DBT_DISBURSED').length,
      rejected: allTenantSubsidies.filter(s => s.portalStage === 'REJECTED').length,
      totalSubsidySanctioned: allTenantSubsidies
        .filter(s => ['CLAIM_GENERATED', 'DBT_DISBURSED'].includes(s.portalStage))
        .reduce((sum, s) => sum + (s.amount || 0), 0),
      totalCapacityKw: allTenantSubsidies
        .reduce((sum, s) => sum + (s.proposedCapacity || 0), 0)
        .toFixed(1)
    };

    res.json({ subsidies, metrics });
  } catch (error) {
    console.error('Fetch subsidies error:', error);
    res.status(500).json({ error: 'Failed to fetch PM Surya Ghar applications' });
  }
});

// 2. Get Application Detail
router.get(['/api/tenant/subsidies/:id', '/api/tenant/pmsuryaghar/:id'], requireTenantAuth, async (req, res) => {
  try {
    const subsidy = await prisma.subsidyApplication.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        customer: true,
        project: {
          include: {
            quotation: true,
            discomApplication: true
          }
        }
      }
    });

    if (!subsidy) return res.status(404).json({ error: 'PM Surya Ghar application not found' });
    res.json({ subsidy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch application details' });
  }
});

// Helper: Parse Unstructured PM Surya Ghar Portal Text / Receipt / SMS
const parsePortalText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return {};
  const text = rawText.trim();
  const extracted = {};

  // 1. National Portal Application Number (e.g. PMSG-MH-2024-12345, MH123456789, PMSG2024..., APP...)
  const appMatch = text.match(/(?:Application\s*(?:No|Number|ID)?|App\s*#?)\s*[:#-]?\s*([A-Za-z0-9\-_]{6,30})/i) ||
                   text.match(/\b(PMSG[A-Za-z0-9\-_]{5,25})\b/i);
  if (appMatch) extracted.nationalPortalAppNo = appMatch[1].trim();

  // 2. Consumer Number / CA Number / Account ID (e.g. 028510293812)
  const consumerMatch = text.match(/(?:Consumer\s*(?:No|Number|ID)?|CA\s*(?:No|Number)?|K\s*No|Account\s*No)\s*[:#-]?\s*([0-9]{8,16})/i) ||
                        text.match(/\b([0-9]{10,12})\b/);
  if (consumerMatch) extracted.consumerNumber = consumerMatch[1].trim();

  // 3. Consumer Name
  const nameMatch = text.match(/(?:Consumer\s*Name|Applicant\s*Name|Customer\s*Name|Name)\s*[:#-]?\s*([A-Za-z\s.]{3,40})(?:\r|\n|$|,|;)/i);
  if (nameMatch) {
    const n = nameMatch[1].trim().replace(/\s+/g, ' ');
    if (!/^(pmsuryaghar|national|solar|subsidy|portal)$/i.test(n)) {
      extracted.customerName = n;
      extracted.accountHolderName = n;
    }
  }

  // 4. Mobile Number (Indian 10-digit starting with 6,7,8,9)
  const mobileMatch = text.match(/(?:Mobile|Phone|Contact)\s*[:#-]?\s*([6-9][0-9]{9})\b/i) ||
                      text.match(/\b([6-9][0-9]{9})\b/);
  if (mobileMatch) extracted.customerMobile = mobileMatch[1].trim();

  // 5. Proposed / Applied Capacity (kW / kWp)
  const capMatch = text.match(/(?:Capacity|Sanctioned\s*Load|Plant\s*Capacity|Applied\s*Capacity|System\s*Size)\s*[:#-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:kw|kwp)?/i) ||
                   text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:kwp|kw)\b/i);
  if (capMatch) {
    const val = parseFloat(capMatch[1]);
    if (val > 0 && val <= 100) extracted.proposedCapacity = val.toString();
  }

  // 6. DISCOM
  const discomList = ['MSEDCL', 'Tata Power', 'BESCOM', 'UPPCL', 'Torrent Power', 'Adani Electricity', 'DHBVN', 'PSPCL', 'WBSEDCL', 'TANGEDCO', 'BSES'];
  for (const d of discomList) {
    if (new RegExp(d, 'i').test(text)) {
      extracted.discomName = d;
      break;
    }
  }

  // 7. Division / Sub-division / City
  const divMatch = text.match(/(?:Division|Circle)\s*[:#-]?\s*([A-Za-z\s]{3,30})(?:\r|\n|$|,)/i);
  if (divMatch) extracted.division = divMatch[1].trim();

  const subDivMatch = text.match(/(?:Sub-?Division|Sub\s*Div)\s*[:#-]?\s*([A-Za-z\s]{3,30})(?:\r|\n|$|,)/i);
  if (subDivMatch) extracted.subDivision = subDivMatch[1].trim();

  // 8. Bank Details
  const ifscMatch = text.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/i);
  if (ifscMatch) extracted.ifscCode = ifscMatch[1].toUpperCase();

  const accMatch = text.match(/(?:Account\s*(?:No|Number)|A\/C\s*No|Bank\s*A\/C)\s*[:#-]?\s*([0-9]{9,18})\b/i);
  if (accMatch) extracted.accountNumber = accMatch[1].trim();

  const bankNameMatch = text.match(/(?:Bank\s*Name|Bank)\s*[:#-]?\s*([A-Za-z\s]{3,35})(?:\r|\n|$|,)/i);
  if (bankNameMatch) extracted.bankName = bankNameMatch[1].trim();

  // 9. Portal Stage Detection
  if (/DBT|Disbursed|Credited|Subsidy\s*Paid/i.test(text)) extracted.portalStage = 'DBT_DISBURSED';
  else if (/Claim|Sanctioned|Voucher/i.test(text)) extracted.portalStage = 'CLAIM_GENERATED';
  else if (/Meter|Commissioned|Commissioning|Bi-directional/i.test(text)) extracted.portalStage = 'METER_INSPECTED';
  else if (/Work\s*Completed|Installation\s*Done|Geo/i.test(text)) extracted.portalStage = 'WORK_COMPLETED';
  else if (/Feasibility\s*Approved|Feasibility\s*Cleared/i.test(text)) extracted.portalStage = 'FEASIBILITY_APPROVED';
  else if (/Feasibility|Review|DISCOM\s*Pending/i.test(text)) extracted.portalStage = 'FEASIBILITY_PENDING';
  else extracted.portalStage = 'CONSUMER_SELECTION';

  return extracted;
};

// 2a. Smart Parse Text from pmsuryaghar.gov.in (Receipt / Screen / SMS)
router.post('/api/tenant/pmsuryaghar/smart-parse', requireTenantAuth, async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) return res.status(400).json({ error: 'Text content is required' });

    const extracted = parsePortalText(rawText);
    res.json({ success: true, extracted });
  } catch (error) {
    console.error('Smart parse error:', error);
    res.status(500).json({ error: 'Failed to parse text' });
  }
});

// 2b. Bulk Import Applications (From National Portal Vendor Table / CSV)
router.post('/api/tenant/pmsuryaghar/bulk-import', requireTenantAuth, async (req, res) => {
  try {
    const { applications } = req.body;
    if (!Array.isArray(applications) || applications.length === 0) {
      return res.status(400).json({ error: 'Array of applications required' });
    }

    const created = [];
    for (const app of applications) {
      let resolvedCustomerId = app.customerId;

      // Find or create customer by mobile / name if not provided
      if (!resolvedCustomerId && (app.customerMobile || app.customerName)) {
        let cust = null;
        if (app.customerMobile) {
          cust = await prisma.customer.findFirst({
            where: { tenantId: req.user.tenantId, mobile: app.customerMobile }
          });
        }
        if (!cust) {
          cust = await prisma.customer.create({
            data: {
              tenantId: req.user.tenantId,
              name: app.customerName || `Consumer ${app.consumerNumber || 'PMSG'}`,
              mobile: app.customerMobile || `98${Math.floor(10000000 + Math.random() * 90000000)}`,
              city: app.city || 'Pune',
              customerType: 'RESIDENTIAL'
            }
          });
        }
        resolvedCustomerId = cust.id;
      }

      if (!resolvedCustomerId) continue;

      const cap = parseFloat(app.proposedCapacity || 3.0);
      const centralSubsidy = calculatePmSuryaGharSubsidy(cap);
      const stateSub = app.stateSubsidyAmount ? parseFloat(app.stateSubsidyAmount) : 0;

      const newApp = await prisma.subsidyApplication.create({
        data: {
          tenantId: req.user.tenantId,
          customerId: resolvedCustomerId,
          projectId: app.projectId || null,
          applicationNo: app.applicationNo || `PMSG-${Date.now().toString().slice(-6)}`,
          nationalPortalAppNo: app.nationalPortalAppNo || `PMSG-MH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
          consumerNumber: app.consumerNumber || null,
          discomName: app.discomName || 'MSEDCL',
          division: app.division || 'Pune Urban',
          subDivision: app.subDivision || 'Shivajinagar',
          proposedCapacity: cap,
          centralSubsidyAmount: centralSubsidy,
          stateSubsidyAmount: stateSub,
          amount: centralSubsidy + stateSub,
          status: 'APPLICATION_SUBMITTED',
          portalStage: app.portalStage || 'CONSUMER_SELECTION',
          inverterMakeModel: app.inverterMakeModel || null,
          inverterSerial: app.inverterSerial || null,
          dcrModuleSerials: app.dcrModuleSerials || null,
          bankName: app.bankName || null,
          accountNumber: app.accountNumber || null,
          ifscCode: app.ifscCode || null,
          accountHolderName: app.accountHolderName || app.customerName || null,
          submittedDate: new Date()
        }
      });
      created.push(newApp);
    }

    res.json({ success: true, count: created.length, created });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to bulk import applications' });
  }
});

// 3. Register / Link New PM Surya Ghar Application (Dual Mode & Auto-Customer Creation)
router.post(['/api/tenant/subsidies', '/api/tenant/pmsuryaghar'], requireTenantAuth, async (req, res) => {
  try {
    const { 
      customerId, projectId, customerName, customerMobile, customerAddress, customerCity,
      applicationNo, nationalPortalAppNo, consumerNumber,
      discomName, division, subDivision, proposedCapacity, portalStage,
      dcrModuleSerials, inverterMakeModel, inverterSerial, latitude, longitude,
      bankName, accountNumber, ifscCode, accountHolderName, stateSubsidyAmount
    } = req.body;

    let resolvedCustomerId = customerId;
    let resolvedCapacity = proposedCapacity ? parseFloat(proposedCapacity) : null;
    let autoInverter = inverterMakeModel || '';
    let autoSerials = dcrModuleSerials || '';

    // If projectId provided, auto-link technical hardware from Project and Quotation
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId, tenantId: req.user.tenantId },
        include: { customer: true, quotation: true }
      });

      if (project) {
        resolvedCustomerId = project.customerId || resolvedCustomerId;
        if (!resolvedCapacity) resolvedCapacity = project.capacity || 5.0;
        if (!autoInverter && project.quotation) {
          autoInverter = `${project.quotation.inverterBrand || 'Solar Inverter'} ${project.quotation.inverterCapacity || resolvedCapacity}kW`;
        }
      }
    }

    // Auto-create customer if customerName / mobile passed directly (from Smart Paste / Portal Import)
    if (!resolvedCustomerId && (customerName || consumerNumber)) {
      const name = customerName || `Consumer ${consumerNumber}`;
      const mob = customerMobile || `98${Math.floor(10000000 + Math.random() * 90000000)}`;

      // Check if existing customer matches
      let existingCust = await prisma.customer.findFirst({
        where: { tenantId: req.user.tenantId, mobile: mob }
      });

      if (!existingCust) {
        existingCust = await prisma.customer.create({
          data: {
            tenantId: req.user.tenantId,
            name,
            mobile: mob,
            address: customerAddress || null,
            city: customerCity || 'Pune',
            customerType: 'RESIDENTIAL'
          }
        });
      }
      resolvedCustomerId = existingCust.id;
    }

    if (!resolvedCustomerId) {
      return res.status(400).json({ error: 'Valid Customer could not be determined. Please provide a Customer, Project, or Consumer details.' });
    }

    const capacityVal = resolvedCapacity || 3.0;
    const centralSubsidy = calculatePmSuryaGharSubsidy(capacityVal);
    const stateSubsidy = stateSubsidyAmount ? parseFloat(stateSubsidyAmount) : 0;
    const totalAmount = centralSubsidy + stateSubsidy;

    const autoAppNo = applicationNo || `PMSG-${Date.now().toString().slice(-6)}`;
    const autoNationalNo = nationalPortalAppNo || `PMSG-MH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const subsidy = await prisma.subsidyApplication.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: resolvedCustomerId,
        projectId: projectId || null,
        applicationNo: autoAppNo,
        nationalPortalAppNo: autoNationalNo,
        consumerNumber: consumerNumber || null,
        discomName: discomName || 'MSEDCL',
        division: division || 'Pune Urban',
        subDivision: subDivision || 'Shivajinagar',
        proposedCapacity: capacityVal,
        centralSubsidyAmount: centralSubsidy,
        stateSubsidyAmount: stateSubsidy,
        amount: totalAmount,
        status: 'APPLICATION_SUBMITTED',
        portalStage: portalStage || 'CONSUMER_SELECTION',
        dcrModuleSerials: autoSerials || null,
        inverterMakeModel: autoInverter || null,
        inverterSerial: inverterSerial || null,
        latitude: latitude ? parseFloat(latitude) : 18.5204,
        longitude: longitude ? parseFloat(longitude) : 73.8567,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        ifscCode: ifscCode || null,
        accountHolderName: accountHolderName || customerName || null,
        submittedDate: new Date()
      },
      include: { customer: true, project: true }
    });

    res.status(201).json({ subsidy });
  } catch (error) {
    console.error('Create PM Surya Ghar app error:', error);
    res.status(500).json({ error: 'Failed to create PM Surya Ghar application' });
  }
});

// 4. Update Application Stage & Details
router.patch(['/api/tenant/subsidies/:id', '/api/tenant/pmsuryaghar/:id'], requireTenantAuth, async (req, res) => {
  try {
    const { 
      portalStage, status, nationalPortalAppNo, consumerNumber, discomName,
      division, subDivision, proposedCapacity, dcrModuleSerials, inverterMakeModel,
      inverterSerial, latitude, longitude, bankName, accountNumber, ifscCode,
      accountHolderName, nameMatchVerified, geoPhotos, documentUrl, documentType,
      stateSubsidyAmount
    } = req.body;

    const existing = await prisma.subsidyApplication.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!existing) return res.status(404).json({ error: 'Application not found' });

    const updateData = {};
    if (portalStage) {
      updateData.portalStage = portalStage;
      // Stamp audit timestamps
      if (portalStage === 'FEASIBILITY_APPROVED' && !existing.feasibilityDate) updateData.feasibilityDate = new Date();
      if (portalStage === 'WORK_COMPLETED' && !existing.workCompletedDate) updateData.workCompletedDate = new Date();
      if (portalStage === 'METER_INSPECTED' && !existing.commissionedDate) updateData.commissionedDate = new Date();
      if (portalStage === 'DBT_DISBURSED' && !existing.disbursedDate) updateData.disbursedDate = new Date();
      
      // Keep legacy status synchronized
      if (['CLAIM_GENERATED', 'DBT_DISBURSED'].includes(portalStage)) updateData.status = 'CLAIM_APPROVED';
      if (portalStage === 'REJECTED') updateData.status = 'REJECTED';
    }

    if (status) updateData.status = status;
    if (nationalPortalAppNo) updateData.nationalPortalAppNo = nationalPortalAppNo;
    if (consumerNumber) updateData.consumerNumber = consumerNumber;
    if (discomName) updateData.discomName = discomName;
    if (division) updateData.division = division;
    if (subDivision) updateData.subDivision = subDivision;

    if (proposedCapacity !== undefined) {
      const cap = parseFloat(proposedCapacity);
      updateData.proposedCapacity = cap;
      const central = calculatePmSuryaGharSubsidy(cap);
      updateData.centralSubsidyAmount = central;
      const stateSub = stateSubsidyAmount !== undefined ? parseFloat(stateSubsidyAmount) : (existing.stateSubsidyAmount || 0);
      updateData.stateSubsidyAmount = stateSub;
      updateData.amount = central + stateSub;
    }

    if (dcrModuleSerials !== undefined) updateData.dcrModuleSerials = dcrModuleSerials;
    if (inverterMakeModel !== undefined) updateData.inverterMakeModel = inverterMakeModel;
    if (inverterSerial !== undefined) updateData.inverterSerial = inverterSerial;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);

    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
    if (accountHolderName !== undefined) updateData.accountHolderName = accountHolderName;
    if (nameMatchVerified !== undefined) updateData.nameMatchVerified = Boolean(nameMatchVerified);
    if (geoPhotos !== undefined) updateData.geoPhotos = typeof geoPhotos === 'string' ? geoPhotos : JSON.stringify(geoPhotos);

    if (documentType === 'CLAIM_DOCUMENT' && documentUrl) updateData.claimDocumentUrl = documentUrl;
    if (documentType === 'DISBURSEMENT_PROOF' && documentUrl) updateData.disbursementProofUrl = documentUrl;
    if (documentType === 'APPLICATION_DOCUMENT' && documentUrl) updateData.applicationDocumentUrl = documentUrl;

    const updated = await prisma.subsidyApplication.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData,
      include: { customer: true, project: true }
    });

    // If attached to a project, log timeline event
    if (updated.projectId && portalStage) {
      try {
        await prisma.projectTimelineEvent.create({
          data: {
            projectId: updated.projectId,
            title: 'PM Surya Ghar Stage Updated',
            description: `Portal application moved to ${portalStage.replace(/_/g, ' ')}`,
            eventType: 'STAGE_CHANGE',
            createdBy: req.user.id
          }
        });
      } catch (e) {
        console.warn('Timeline event skipped:', e.message);
      }
    }

    res.json({ subsidy: updated });
  } catch (error) {
    console.error('Update PM Surya Ghar app error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// 5. Verify Customer Bank Account Name Matching (DBT Rejection Pre-check)
router.post('/api/tenant/pmsuryaghar/:id/verify-bank', requireTenantAuth, async (req, res) => {
  try {
    const subsidy = await prisma.subsidyApplication.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { customer: true }
    });

    if (!subsidy) return res.status(404).json({ error: 'Application not found' });

    const customerName = (subsidy.customer?.name || '').trim().toLowerCase();
    const bankName = (subsidy.accountHolderName || req.body.accountHolderName || '').trim().toLowerCase();

    if (!customerName || !bankName) {
      return res.status(400).json({ error: 'Customer name and Bank Account Holder Name are required for verification' });
    }

    // Similarity checker: compare tokens / common name elements
    const custTokens = customerName.split(/\s+/);
    const bankTokens = bankName.split(/\s+/);

    const matchCount = custTokens.filter(t => bankTokens.some(bt => bt.includes(t) || t.includes(bt))).length;
    const similarityScore = Math.round((matchCount / Math.max(custTokens.length, bankTokens.length)) * 100);

    const isVerified = similarityScore >= 65;

    await prisma.subsidyApplication.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: {
        nameMatchVerified: isVerified,
        accountHolderName: req.body.accountHolderName || subsidy.accountHolderName
      }
    });

    res.json({
      verified: isVerified,
      similarityScore,
      customerName: subsidy.customer?.name,
      bankAccountName: bankName,
      recommendation: isVerified 
        ? 'High confidence match. Safe for PM Surya Ghar DBT disbursement.'
        : 'Name variation detected. Upload cancelled cheque or bank passbook to prevent portal rejection.'
    });
  } catch (error) {
    console.error('Bank verification error:', error);
    res.status(500).json({ error: 'Failed to verify bank details' });
  }
});

// 6. Delete Application
router.delete(['/api/tenant/subsidies/:id', '/api/tenant/pmsuryaghar/:id'], requireTenantAuth, async (req, res) => {
  try {
    await prisma.subsidyApplication.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ success: true, message: 'PM Surya Ghar application removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

module.exports = router;
