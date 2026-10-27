const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// Helper to calculate solar estimates
function calculateSolarEstimates(data) {
  const usableArea = parseFloat(data.usableShadowFreeArea || data.totalRoofArea) || 0;
  const monthlyUnits = parseFloat(data.avgMonthlyUnits) || 0;
  const proposed = parseFloat(data.proposedCap) || 0;

  let recCap = proposed;
  if (usableArea > 0) {
    // Approx 100 sq.ft per kWp with 550Wp bifacial / mono PERC modules
    recCap = Math.round((usableArea / 100) * 10) / 10;
  } else if (monthlyUnits > 0) {
    // 1 kWp produces ~120 units/month in India
    recCap = Math.round((monthlyUnits / 120) * 10) / 10;
  }

  if (recCap <= 0) recCap = proposed > 0 ? proposed : 3.0;

  const maxInstallable = usableArea > 0 ? Math.round((usableArea / 90) * 10) / 10 : recCap;
  const annualUnits = Math.round(recCap * 1450); // Indian average annual generation
  const tariffRate = 8.5; // Average grid tariff in ₹/unit
  const annualSavings = Math.round(annualUnits * tariffRate);

  return {
    recommendedCapacity: recCap,
    maxInstallableCapacity: maxInstallable,
    estimatedAnnualUnits: annualUnits,
    estimatedAnnualSavings: annualSavings
  };
}

// ----------------------------------------------------
// 1. GET /api/tenant/surveys
// Rich survey list with metrics, search, and status filtering
// ----------------------------------------------------
router.get('/api/tenant/surveys', requireTenantAuth, async (req, res) => {
  try {
    const { status, search, customerId, engineerId, dateFrom, dateTo } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (engineerId) {
      where.assignedEngineerId = engineerId;
    }
    if (dateFrom || dateTo) {
      where.surveyDate = {};
      if (dateFrom) where.surveyDate.gte = new Date(dateFrom);
      if (dateTo) where.surveyDate.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { surveyNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { mobile: { contains: search, mode: 'insensitive' } } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { roofType: { contains: search, mode: 'insensitive' } },
        { discomConsumerNo: { contains: search, mode: 'insensitive' } }
      ];
    }

    const surveys = await prisma.siteSurvey.findMany({
      where,
      include: {
        customer: true,
        lead: true,
        assignedEngineer: { select: { id: true, name: true, email: true } },
        quotations: { select: { id: true, qNumber: true, total: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Summary KPIs
    const allSurveys = await prisma.siteSurvey.findMany({
      where: { tenantId: req.user.tenantId },
      select: { status: true, proposedCap: true, recommendedCapacity: true, feasibilityVerdict: true }
    });

    const metrics = {
      totalSurveys: allSurveys.length,
      scheduled: allSurveys.filter(s => s.status === 'SCHEDULED').length,
      inProgress: allSurveys.filter(s => s.status === 'IN_PROGRESS').length,
      completed: allSurveys.filter(s => s.status === 'COMPLETED' || s.status === 'SUBMITTED' || s.status === 'APPROVED').length,
      approvedFeasible: allSurveys.filter(s => s.status === 'APPROVED' || s.feasibilityVerdict === 'FEASIBLE').length,
      totalFeasibleKw: Math.round(
        allSurveys
          .filter(s => s.status === 'APPROVED' || s.feasibilityVerdict === 'FEASIBLE')
          .reduce((sum, s) => sum + (s.recommendedCapacity || s.proposedCap || 0), 0) * 10
      ) / 10
    };

    res.json({ surveys, metrics });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// ----------------------------------------------------
// 2. GET /api/tenant/surveys/engineers
// List eligible field engineers / sub-admins for assignment
// ----------------------------------------------------
router.get('/api/tenant/surveys/engineers', requireTenantAuth, async (req, res) => {
  try {
    const engineers = await prisma.user.findMany({
      where: {
        tenantId: req.user.tenantId,
        role: { in: ['TENANT_ADMIN', 'TENANT_SUB_ADMIN'] }
      },
      select: { id: true, name: true, email: true }
    });
    res.json({ engineers });
  } catch (error) {
    console.error('Error fetching survey engineers:', error);
    res.status(500).json({ error: 'Failed to fetch survey engineers' });
  }
});

// ----------------------------------------------------
// 3. GET /api/tenant/surveys/:id
// Get full survey details
// ----------------------------------------------------
router.get('/api/tenant/surveys/:id', requireTenantAuth, async (req, res) => {
  try {
    const survey = await prisma.siteSurvey.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        customer: true,
        lead: true,
        assignedEngineer: { select: { id: true, name: true, email: true } },
        quotations: {
          select: { id: true, qNumber: true, total: true, status: true, systemCapacity: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        },
        projects: {
          select: { id: true, name: true, projectNumber: true, currentStage: true, status: true }
        }
      }
    });

    if (!survey) {
      return res.status(404).json({ error: 'Site survey not found' });
    }

    res.json({ survey });
  } catch (error) {
    console.error('Error fetching single survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey details' });
  }
});

// ----------------------------------------------------
// 4. POST /api/tenant/surveys
// Create / Schedule a new site survey
// ----------------------------------------------------
router.post('/api/tenant/surveys', requireTenantAuth, async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      phone,
      leadId,
      surveyDate,
      proposedCap,
      roofType,
      notes,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      discomConsumerNo,
      discomName,
      sanctionedLoad,
      electricalPhase,
      assignedEngineerId,
      totalRoofArea,
      usableShadowFreeArea,
      avgMonthlyBill,
      avgMonthlyUnits
    } = req.body;

    let targetCustomerId = customerId;

    // Auto-create customer if customerName and phone/mobile provided but no customerId
    const contactPhone = (phone || req.body.mobile || '').trim();
    if (!targetCustomerId && customerName && contactPhone) {
      let existingCust = await prisma.customer.findFirst({
        where: { tenantId: req.user.tenantId, mobile: contactPhone }
      });
      if (!existingCust) {
        existingCust = await prisma.customer.create({
          data: {
            tenantId: req.user.tenantId,
            name: customerName.trim(),
            mobile: contactPhone,
            address: address || null,
            city: city || null
          }
        });
      }
      targetCustomerId = existingCust.id;
    }

    // Auto-generate unique Survey Number: SRV-YYYYMM-XXXX
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const surveyNumber = `SRV-${dateStr}-${randSuffix}`;

    // Calculations
    const estimates = calculateSolarEstimates({
      usableShadowFreeArea,
      totalRoofArea,
      avgMonthlyUnits,
      proposedCap
    });

    const latVal = latitude ? parseFloat(latitude) : null;
    const lngVal = longitude ? parseFloat(longitude) : null;
    const gMapsUrl = (latVal && lngVal) ? `https://maps.google.com/?q=${latVal},${lngVal}` : null;

    const newSurvey = await prisma.siteSurvey.create({
      data: {
        tenantId: req.user.tenantId,
        surveyNumber,
        customerId: targetCustomerId || null,
        leadId: leadId || null,
        surveyDate: surveyDate ? new Date(surveyDate) : new Date(),
        status: 'SCHEDULED',
        proposedCap: parseFloat(proposedCap) || estimates.recommendedCapacity,
        recommendedCapacity: estimates.recommendedCapacity,
        maxInstallableCapacity: estimates.maxInstallableCapacity,
        estimatedAnnualUnits: estimates.estimatedAnnualUnits,
        estimatedAnnualSavings: estimates.estimatedAnnualSavings,
        roofType: roofType || 'RCC Flat Roof',
        notes: notes || '',
        address: address || '',
        city: city || '',
        state: state || 'Maharashtra',
        pincode: pincode || '',
        latitude: latVal,
        longitude: lngVal,
        googleMapsUrl: gMapsUrl,
        discomConsumerNo: discomConsumerNo || '',
        discomName: discomName || '',
        sanctionedLoad: parseFloat(sanctionedLoad) || null,
        electricalPhase: electricalPhase || 'Three Phase',
        assignedEngineerId: assignedEngineerId || null,
        totalRoofArea: parseFloat(totalRoofArea) || null,
        usableShadowFreeArea: parseFloat(usableShadowFreeArea) || null,
        avgMonthlyBill: parseFloat(avgMonthlyBill) || null,
        avgMonthlyUnits: parseFloat(avgMonthlyUnits) || null,
        feasibilityVerdict: 'FEASIBLE',
        photos: []
      },
      include: {
        customer: true,
        assignedEngineer: { select: { id: true, name: true, email: true } }
      }
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        tenantId: req.user.tenantId,
        action: 'SCHEDULE_SITE_SURVEY',
        entity: 'SiteSurvey',
        entityId: newSurvey.id,
        details: { surveyNumber, customerId: targetCustomerId, proposedCap: newSurvey.proposedCap },
        ipAddress: req.ip || '127.0.0.1'
      }
    }).catch(() => null);

    res.status(201).json({ survey: newSurvey, message: 'Site survey scheduled successfully' });
  } catch (error) {
    console.error('Error creating site survey:', error);
    res.status(500).json({ error: 'Failed to create site survey' });
  }
});

// ----------------------------------------------------
// 5. PATCH /api/tenant/surveys/:id
// Update survey assessment parameters, calculations & verdict
// ----------------------------------------------------
router.patch('/api/tenant/surveys/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.siteSurvey.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Site survey not found' });
    }

    const {
      surveyDate,
      proposedCap,
      roofType,
      totalRoofArea,
      usableShadowFreeArea,
      roofObstacles,
      tiltAngle,
      azimuthAngle,
      parapetHeight,
      structurePreference,
      discomName,
      discomConsumerNo,
      sanctionedLoad,
      electricalPhase,
      meterType,
      meterLocation,
      cableRunRoofToMeter,
      inverterLocation,
      earthPitFeasibility,
      lightningArresterReq,
      gridVoltage,
      avgMonthlyBill,
      avgMonthlyUnits,
      assignedEngineerId,
      surveyEngineerName,
      surveyEngineerPhone,
      feasibilityVerdict,
      feasibilityNotes,
      specialRequirements,
      notes,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      categorizedPhotos,
      status
    } = req.body;

    // Recalculate estimates
    const estimates = calculateSolarEstimates({
      usableShadowFreeArea: usableShadowFreeArea !== undefined ? usableShadowFreeArea : existing.usableShadowFreeArea,
      totalRoofArea: totalRoofArea !== undefined ? totalRoofArea : existing.totalRoofArea,
      avgMonthlyUnits: avgMonthlyUnits !== undefined ? avgMonthlyUnits : existing.avgMonthlyUnits,
      proposedCap: proposedCap !== undefined ? proposedCap : existing.proposedCap
    });

    const latVal = latitude !== undefined ? parseFloat(latitude) : existing.latitude;
    const lngVal = longitude !== undefined ? parseFloat(longitude) : existing.longitude;
    const gMapsUrl = (latVal && lngVal) ? `https://maps.google.com/?q=${latVal},${lngVal}` : existing.googleMapsUrl;

    const updateData = {
      ...(surveyDate !== undefined && { surveyDate: new Date(surveyDate) }),
      ...(proposedCap !== undefined && { proposedCap: parseFloat(proposedCap) }),
      ...(roofType !== undefined && { roofType }),
      ...(totalRoofArea !== undefined && { totalRoofArea: parseFloat(totalRoofArea) || null }),
      ...(usableShadowFreeArea !== undefined && { usableShadowFreeArea: parseFloat(usableShadowFreeArea) || null }),
      ...(roofObstacles !== undefined && { roofObstacles }),
      ...(tiltAngle !== undefined && { tiltAngle: parseFloat(tiltAngle) || null }),
      ...(azimuthAngle !== undefined && { azimuthAngle: parseFloat(azimuthAngle) || null }),
      ...(parapetHeight !== undefined && { parapetHeight: parseFloat(parapetHeight) || null }),
      ...(structurePreference !== undefined && { structurePreference }),
      ...(discomName !== undefined && { discomName }),
      ...(discomConsumerNo !== undefined && { discomConsumerNo }),
      ...(sanctionedLoad !== undefined && { sanctionedLoad: parseFloat(sanctionedLoad) || null }),
      ...(electricalPhase !== undefined && { electricalPhase }),
      ...(meterType !== undefined && { meterType }),
      ...(meterLocation !== undefined && { meterLocation }),
      ...(cableRunRoofToMeter !== undefined && { cableRunRoofToMeter: parseFloat(cableRunRoofToMeter) || null }),
      ...(inverterLocation !== undefined && { inverterLocation }),
      ...(earthPitFeasibility !== undefined && { earthPitFeasibility }),
      ...(lightningArresterReq !== undefined && { lightningArresterReq: Boolean(lightningArresterReq) }),
      ...(gridVoltage !== undefined && { gridVoltage: parseFloat(gridVoltage) || 230 }),
      ...(avgMonthlyBill !== undefined && { avgMonthlyBill: parseFloat(avgMonthlyBill) || null }),
      ...(avgMonthlyUnits !== undefined && { avgMonthlyUnits: parseFloat(avgMonthlyUnits) || null }),
      ...(assignedEngineerId !== undefined && { assignedEngineerId: assignedEngineerId || null }),
      ...(surveyEngineerName !== undefined && { surveyEngineerName }),
      ...(surveyEngineerPhone !== undefined && { surveyEngineerPhone }),
      ...(feasibilityVerdict !== undefined && { feasibilityVerdict }),
      ...(feasibilityNotes !== undefined && { feasibilityNotes }),
      ...(specialRequirements !== undefined && { specialRequirements }),
      ...(notes !== undefined && { notes }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(latitude !== undefined && { latitude: latVal }),
      ...(longitude !== undefined && { longitude: lngVal }),
      googleMapsUrl: gMapsUrl,
      ...(categorizedPhotos !== undefined && { categorizedPhotos }),
      ...(status !== undefined && { status }),
      recommendedCapacity: estimates.recommendedCapacity,
      maxInstallableCapacity: estimates.maxInstallableCapacity,
      estimatedAnnualUnits: estimates.estimatedAnnualUnits,
      estimatedAnnualSavings: estimates.estimatedAnnualSavings
    };

    if (status === 'COMPLETED' || status === 'APPROVED') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.siteSurvey.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        assignedEngineer: { select: { id: true, name: true, email: true } },
        quotations: true
      }
    });

    res.json({ survey: updated, message: 'Survey technical evaluation updated' });
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

// ----------------------------------------------------
// 6. PATCH /api/tenant/surveys/:id/status
// Update status lifecycle: SCHEDULED -> IN_PROGRESS -> COMPLETED -> APPROVED / REJECTED
// ----------------------------------------------------
router.patch('/api/tenant/surveys/:id/status', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feasibilityVerdict, feasibilityNotes } = req.body;

    const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updateData = { status };
    if (feasibilityVerdict) updateData.feasibilityVerdict = feasibilityVerdict;
    if (feasibilityNotes) updateData.feasibilityNotes = feasibilityNotes;
    if (status === 'COMPLETED' || status === 'APPROVED') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.siteSurvey.update({
      where: { id },
      data: updateData,
      include: { customer: true }
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        tenantId: req.user.tenantId,
        action: 'UPDATE_SURVEY_STATUS',
        entity: 'SiteSurvey',
        entityId: id,
        details: { status, feasibilityVerdict },
        ipAddress: req.ip || '127.0.0.1'
      }
    }).catch(() => null);

    res.json({ survey: updated, message: `Survey marked as ${status}` });
  } catch (error) {
    console.error('Error updating survey status:', error);
    res.status(500).json({ error: 'Failed to update survey status' });
  }
});

// ----------------------------------------------------
// 7. POST /api/tenant/surveys/:id/photos
// Upload and categorize site inspection photos
// ----------------------------------------------------
router.post('/api/tenant/surveys/:id/photos', requireTenantAuth, upload.array('photos', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body; // e.g., 'rooftop', 'meter', 'inverter', 'shadow', 'cable', 'earthing'

    const survey = await prisma.siteSurvey.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!survey) {
      return res.status(404).json({ error: 'Site survey not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos provided' });
    }

    const newPhotoUrls = req.files.map(f => `/uploads/${f.filename}`);
    const existingPhotos = Array.isArray(survey.photos) ? survey.photos : [];
    const updatedPhotos = [...existingPhotos, ...newPhotoUrls];

    // Update categorizedPhotos JSON
    let categorized = survey.categorizedPhotos && typeof survey.categorizedPhotos === 'object'
      ? { ...survey.categorizedPhotos }
      : { rooftop: [], shadow: [], meter: [], inverter: [], cable: [], earthing: [] };

    const catKey = (category && categorized[category]) ? category : 'rooftop';
    categorized[catKey] = [...(categorized[catKey] || []), ...newPhotoUrls];

    const updated = await prisma.siteSurvey.update({
      where: { id },
      data: {
        photos: updatedPhotos,
        categorizedPhotos: categorized
      }
    });

    res.json({
      message: 'Photos uploaded successfully',
      photos: updated.photos,
      categorizedPhotos: updated.categorizedPhotos
    });
  } catch (error) {
    console.error('Error uploading survey photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// ----------------------------------------------------
// 8. POST /api/tenant/surveys/:id/convert-to-quote
// One-Click conversion from Approved Survey into Quotation
// ----------------------------------------------------
router.post('/api/tenant/surveys/:id/convert-to-quote', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await prisma.siteSurvey.findFirst({
      where: { id, tenantId: req.user.tenantId },
      include: { customer: true }
    });

    if (!survey) {
      return res.status(404).json({ error: 'Site survey not found' });
    }

    const capacityKw = survey.recommendedCapacity || survey.proposedCap || 3.0;
    const ratePerKw = 55000; // Standard commercial EPC baseline ₹55k/kW
    const subtotal = Math.round(capacityKw * ratePerKw);
    const tax = Math.round(subtotal * 0.138); // 13.8% composite solar GST
    const total = subtotal + tax;

    // Calculate panel count (e.g., 550Wp modules)
    const panelWatts = 550;
    const panelCount = Math.ceil((capacityKw * 1000) / panelWatts);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const qNumber = `QT-${dateStr}-${randSuffix}`;

    const quotation = await prisma.quotation.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: survey.customerId || null,
        leadId: survey.leadId || null,
        surveyId: survey.id,
        qNumber,
        status: 'DRAFT',
        systemCapacity: capacityKw,
        systemType: 'On-grid',
        connectionType: 'Residential',
        phase: survey.electricalPhase || 'Three Phase',
        roofType: survey.roofType || 'RCC Flat Roof',
        panelBrand: 'Waaree Energies',
        panelModel: `${panelWatts}Wp Mono PERC Bifacial`,
        panelWattage: panelWatts,
        panelQuantity: panelCount,
        panelWarranty: '12 Years Product, 25 Years Performance',
        inverterBrand: capacityKw > 3 ? 'Growatt / Solis' : 'Deye / SolarEdge',
        inverterCapacity: capacityKw,
        subtotal,
        tax,
        discount: 0,
        total
      }
    });

    // Update survey status to APPROVED if not already
    await prisma.siteSurvey.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        tenantId: req.user.tenantId,
        action: 'CONVERT_SURVEY_TO_QUOTE',
        entity: 'Quotation',
        entityId: quotation.id,
        details: { surveyId: id, qNumber, systemCapacity: capacityKw, total },
        ipAddress: req.ip || '127.0.0.1'
      }
    }).catch(() => null);

    res.status(201).json({
      message: 'Quotation generated successfully from Site Survey',
      quotation
    });
  } catch (error) {
    console.error('Error converting survey to quote:', error);
    res.status(500).json({ error: 'Failed to generate quotation from survey' });
  }
});

// ----------------------------------------------------
// 9. DELETE /api/tenant/surveys/:id
// Cancel / Delete survey record
// ----------------------------------------------------
router.delete('/api/tenant/surveys/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await prisma.siteSurvey.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!survey) {
      return res.status(404).json({ error: 'Site survey not found' });
    }

    await prisma.siteSurvey.delete({ where: { id } });

    res.json({ message: 'Site survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete site survey' });
  }
});

module.exports = router;
