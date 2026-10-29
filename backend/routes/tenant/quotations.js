const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireTenantAuth } = require('../../middleware/auth');
const solarCalc = require('../../services/solarCalculator');

// Utility: Calculate solar generation and economics using Centralized Calculation Engine
function calculateSolarMetrics({ capacity, totalCost, connectionType = 'Residential', gridTariff, monthlyBill }) {
  const cap = Number(capacity) || 5;
  const genData = solarCalc.calculateSolarGeneration({ capacityKw: cap });
  const subsidyData = solarCalc.calculateIndicativeSubsidy({ capacityKw: cap, connectionType });
  const roiData = solarCalc.calculateFinancialROI({
    capacityKw: cap,
    totalInvestment: totalCost,
    connectionType,
    currentMonthlyBill: monthlyBill,
    gridTariff,
    indicativeSubsidy: subsidyData.indicativeSubsidy
  });

  return {
    annualGeneration: genData.annualGeneration,
    lifetimeGeneration: genData.lifetimeGeneration,
    annualSavings: roiData.annualSavings,
    monthlySavings: roiData.monthlySavings,
    lifetimeSavings: roiData.lifetimeSavings,
    paybackYears: roiData.paybackYears,
    co2ReductionKg: genData.co2ReductionKg,
    treeEquivalent: genData.treeEquivalent,
    indicativeSubsidy: subsidyData.indicativeSubsidy,
    monthlyDistribution: genData.monthlyDistribution,
    financialProjections: roiData.financialProjections,
    commercialTaxBenefit: roiData.commercialTaxBenefit,
    peakMonth: genData.peakMonth
  };
}

// ----------------------------------------------------
// 1. GET ALL QUOTATIONS + DASHBOARD METRICS
// ----------------------------------------------------
router.get('/api/tenant/quotations', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, search, customerId, dateFrom, dateTo } = req.query;

    const where = { tenantId };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { qNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { lead: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [quotations, allQuotesForStats] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: true,
          lead: true,
          items: { include: { product: true } },
          projects: true,
          template: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.quotation.findMany({
        where: { tenantId },
        select: { id: true, total: true, status: true, validityDays: true, date: true, sentAt: true, qNumber: true, customer: { select: { name: true } }, lead: { select: { name: true } } }
      })
    ]);

    // Calculate Dashboard Metrics
    const totalQuotations = allQuotesForStats.length;
    const awaitingResponse = allQuotesForStats.filter(q => ['SENT', 'VIEWED', 'NEGOTIATION'].includes(q.status)).length;
    const accepted = allQuotesForStats.filter(q => q.status === 'ACCEPTED').length;
    const totalQuotedValue = allQuotesForStats.reduce((sum, q) => sum + (q.total || 0), 0);

    // Follow-up reminders (Sent or viewed >= 3 days ago, or expiring in next 3 days)
    const now = new Date();
    const followUpReminders = allQuotesForStats
      .filter(q => ['SENT', 'VIEWED', 'NEGOTIATION'].includes(q.status))
      .map(q => {
        const quoteDate = new Date(q.sentAt || q.date);
        const daysPassed = Math.floor((now - quoteDate) / (1000 * 60 * 60 * 24));
        const expiryDate = new Date(quoteDate);
        expiryDate.setDate(expiryDate.getDate() + (q.validityDays || 15));
        const daysToExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        let urgency = 'NORMAL';
        let reason = `Follow-up on proposal (${daysPassed} days elapsed)`;
        if (daysToExpiry <= 3 && daysToExpiry > 0) {
          urgency = 'HIGH';
          reason = `Validity expiring in ${daysToExpiry} day(s)!`;
        } else if (daysToExpiry <= 0) {
          urgency = 'EXPIRED';
          reason = `Quotation has expired (${Math.abs(daysToExpiry)} days ago)`;
        } else if (daysPassed >= 3) {
          urgency = 'MEDIUM';
          reason = `No response since 3+ days`;
        }

        return {
          id: q.id,
          qNumber: q.qNumber,
          customerName: q.customer?.name || q.lead?.name || 'Customer',
          total: q.total,
          daysPassed,
          daysToExpiry,
          urgency,
          reason
        };
      })
      .filter(rem => rem.daysPassed >= 2 || rem.daysToExpiry <= 3)
      .slice(0, 5);

    res.json({
      quotations,
      metrics: {
        totalQuotations,
        awaitingResponse,
        accepted,
        totalQuotedValue
      },
      followUpReminders
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// ----------------------------------------------------
// 2. GET SINGLE QUOTATION (WITH TENANT BRANDING)
// ----------------------------------------------------
router.get('/api/tenant/quotations/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const [quotation, tenant] = await Promise.all([
      prisma.quotation.findFirst({
        where: { id, tenantId },
        include: {
          customer: true,
          lead: true,
          items: { include: { product: true } },
          projects: true,
          template: true
        }
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          legalName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          gstin: true,
          logoUrl: true,
          signatureUrl: true
        }
      })
    ]);

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({ quotation, tenant });
  } catch (error) {
    console.error('Error fetching quotation details:', error);
    res.status(500).json({ error: 'Failed to fetch quotation details' });
  }
});

// ----------------------------------------------------
// 3. CREATE QUOTATION (WITH GUIDED CALCULATION ENGINE)
// ----------------------------------------------------
router.post('/api/tenant/quotations', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      customerId,
      leadId,
      newCustomer,
      templateId,
      templateType = 'RESIDENTIAL_PROPOSAL',
      sectionsConfig,
      designConfig,
      systemCapacity = 5.0,
      systemType = 'On-grid',
      connectionType = 'Residential',
      phase = 'Single Phase',
      roofType = 'RCC Flat Roof',
      panelBrand = 'Waaree',
      panelModel = '550Wp Mono PERC Bifacial',
      panelWattage = 550,
      panelQuantity = 9,
      panelWarranty = '25 Years Performance',
      inverterBrand = 'Growatt',
      inverterModel = '5kW Single Phase On-Grid Inverter',
      inverterCapacity = 5.0,
      inverterQuantity = 1,
      inverterWarranty = '10 Years Replacement',
      structureBrand = 'Galvanized HDG High Rise',
      structureWarranty = '10 Years Structural',
      batteryBrand,
      batteryModel,
      batteryCapacity,
      batteryQuantity,
      batteryWarranty,
      backupLoadWatts,
      consumerNumber,
      discom,
      billingUnit,
      sanctionedLoad,
      tariffRate,
      monthlyBill,
      monthlyUnits,
      billDocumentUrl,
      roofAreaSqFt,
      financingDetails,
      commercialAnalysis,
      items = [],
      subtotal = 0,
      tax = 0,
      discount = 0,
      validityDays = 15,
      paymentMilestones,
      scopeOfSupply,
      warranties,
      termsAndConditions,
      exclusions,
      bankDetails
    } = req.body;

    // Handle new customer creation if requested
    let targetCustomerId = customerId || null;
    let targetLeadId = leadId || null;

    const custName = newCustomer?.name || req.body.customerName || req.body.prospectName;
    const custMobile = newCustomer?.mobile || req.body.customerPhone || req.body.prospectPhone || '';
    const custEmail = newCustomer?.email || req.body.customerEmail || '';
    const custAddress = newCustomer?.address || req.body.customerAddress || '';

    if (!targetCustomerId && !targetLeadId && custName) {
      const createdCustomer = await prisma.customer.create({
        data: {
          tenantId,
          name: custName,
          mobile: custMobile,
          email: custEmail,
          address: custAddress,
          city: newCustomer?.city || req.body.city || 'Pune',
          state: newCustomer?.state || req.body.state || 'Maharashtra',
          pincode: newCustomer?.pincode || req.body.pincode || ''
        }
      });
      targetCustomerId = createdCustomer.id;
    }

    // Auto calculate line pricing using Centralized Pricing Engine
    let finalSubtotal = Number(subtotal);
    let finalTax = Number(tax);
    let finalDiscount = Number(discount);
    let totalPayable = req.body.totalSystemCost || req.body.total;
    let lineItemsToCreate = [];

    if (items && Array.isArray(items) && items.length > 0) {
      const pricingResult = solarCalc.calculateCommercialPricing({
        items,
        overallDiscount: discount,
        useCompositeSolarGST: req.body.useCompositeSolarGST || false
      });
      finalSubtotal = pricingResult.subtotal;
      finalTax = pricingResult.tax;
      finalDiscount = pricingResult.discount;
      totalPayable = pricingResult.grandTotal;
      lineItemsToCreate = pricingResult.items.map(it => ({
        productId: it.productId || null,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        taxRate: it.taxRate,
        total: it.total
      }));
    } else if (totalPayable) {
      totalPayable = Number(totalPayable);
      finalSubtotal = Math.round(totalPayable / 1.138);
      finalTax = totalPayable - finalSubtotal;
      finalDiscount = 0;
      lineItemsToCreate = [
        {
          description: `${systemCapacity} kWp Solar PV Power Plant Equipment (Modules, Inverter, Structure, Cables)`,
          quantity: 1,
          unitPrice: Math.round(Number(finalSubtotal) * 0.75),
          taxRate: 12.0,
          total: Math.round(Number(finalSubtotal) * 0.75)
        },
        {
          description: 'Comprehensive Installation, Testing, Liasoning & Commissioning Services',
          quantity: 1,
          unitPrice: finalSubtotal - Math.round(Number(finalSubtotal) * 0.75),
          taxRate: 18.0,
          total: finalSubtotal - Math.round(Number(finalSubtotal) * 0.75)
        }
      ];
    } else {
      totalPayable = finalSubtotal + finalTax - finalDiscount;
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const effectiveTariff = tariffRate || tenant?.commercialDefaults?.defaultTariff || 8.5;

    const solarMetrics = calculateSolarMetrics({
      capacity: systemCapacity,
      totalCost: totalPayable,
      connectionType,
      gridTariff: effectiveTariff,
      monthlyBill
    });

    const qPrefix = tenant?.documentPrefixes?.quotation || 'QT-';
    const qNumber = `${qPrefix}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Milestone schedule
    const calculatedMilestones = solarCalc.generateMilestones(totalPayable, paymentMilestones);

    // Default Scope of Supply
    const defaultScope = scopeOfSupply || [
      `${systemCapacity} kWp Tier-1 Solar PV Modules (${panelBrand} ${panelWattage}Wp)`,
      `${systemCapacity} kW High-Efficiency Inverter (${inverterBrand})`,
      'Hot-Dip Galvanized / Anodized Aluminum Mounting Structure with SS304 Fasteners',
      'Solar Grade DC Cables (Polycab/LAPP 4 sq.mm) with UV Protection Conduits',
      'AC Distribution Box (ACDB) and DC Distribution Box (DCDB) with Type-II SPDs',
      'Dedicated Dual Chemical Earthing with Maintenance-Free Earthing Electrodes',
      'Lightning Arrester (ESE / Copper Rod) with GI Down Conductor',
      'Complete Installation, Testing, MSEDCL Net Metering Liasoning & Commissioning'
    ];

    // Default Warranties
    const defaultWarranties = warranties || {
      modules: `${panelWarranty || '25 Years Performance'}`,
      inverter: `${inverterWarranty || '10 Years Standard'}`,
      structure: `${structureWarranty || '10 Years Structural'}`,
      installation: '5 Years Workmanship & Work Integrity',
      other: 'OEM Terms as applicable'
    };

    // Default Terms
    const defaultTerms = termsAndConditions || [
      `Quotation valid for ${validityDays} days from the date of issue.`,
      'Statutory MSEDCL processing fees, meter testing, and deposit to be borne directly by the customer or charged as actuals.',
      'Rooftop accessibility, water supply for cleaning, and single/three-phase grid power supply at site are customer responsibilities.',
      'Central/State government subsidy is an indicative estimate under PM Surya Ghar and is directly credited by MNRE/DISCOM to the consumer account upon approved commissioning.'
    ];

    // Default Exclusions
    const defaultExclusions = exclusions || [
      'Major structural modification, civil masonry repair, or waterproofing on the roof.',
      'MSEDCL sanctioned load extension or tariff category alteration charges if required.',
      'Additional AC cable cabling exceeding 25 meters from inverter to LT distribution board.'
    ];

    const quotation = await prisma.quotation.create({
      data: {
        tenantId,
        customerId: targetCustomerId,
        leadId: targetLeadId,
        qNumber,
        date: new Date(),
        validityDays: Number(validityDays),
        subtotal: Number(finalSubtotal),
        tax: Number(finalTax),
        discount: Number(finalDiscount),
        total: totalPayable,
        status: req.body.status || 'SENT',
        sentAt: (req.body.status === 'DRAFT') ? null : new Date(),

        // Template and Layout bindings
        templateId: templateId || null,
        templateType: templateType || 'RESIDENTIAL_PROPOSAL',
        sectionsConfig: sectionsConfig || null,
        designConfig: designConfig || null,

        // System Configuration
        systemCapacity: Number(systemCapacity),
        systemType,
        connectionType,
        phase,
        roofType,
        panelBrand,
        panelModel,
        panelWattage: Number(panelWattage),
        panelQuantity: Number(panelQuantity),
        panelWarranty,
        inverterBrand,
        inverterModel,
        inverterCapacity: Number(inverterCapacity),
        inverterQuantity: Number(inverterQuantity),
        inverterWarranty,
        structureBrand,
        structureWarranty,

        // Hybrid & Battery Specs
        batteryBrand: batteryBrand || null,
        batteryModel: batteryModel || null,
        batteryCapacity: batteryCapacity ? Number(batteryCapacity) : null,
        batteryQuantity: batteryQuantity ? Number(batteryQuantity) : null,
        batteryWarranty: batteryWarranty || null,
        backupLoadWatts: backupLoadWatts ? Number(backupLoadWatts) : null,

        // Utility Bill & Site Data
        consumerNumber: consumerNumber || null,
        discom: discom || null,
        billingUnit: billingUnit || null,
        sanctionedLoad: sanctionedLoad ? Number(sanctionedLoad) : null,
        tariffRate: tariffRate ? Number(tariffRate) : null,
        monthlyBill: monthlyBill ? Number(monthlyBill) : null,
        monthlyUnits: monthlyUnits ? Number(monthlyUnits) : null,
        billDocumentUrl: billDocumentUrl || null,
        roofAreaSqFt: roofAreaSqFt ? Number(roofAreaSqFt) : Math.round(Number(systemCapacity || 5) * 65),

        // Financial & Solar Metrics
        annualGeneration: solarMetrics.annualGeneration,
        lifetimeGeneration: solarMetrics.lifetimeGeneration,
        monthlySavings: solarMetrics.monthlySavings,
        annualSavings: solarMetrics.annualSavings,
        lifetimeSavings: solarMetrics.lifetimeSavings,
        paybackYears: solarMetrics.paybackYears,
        co2ReductionKg: solarMetrics.co2ReductionKg,
        treeEquivalent: solarMetrics.treeEquivalent,
        indicativeSubsidy: solarMetrics.indicativeSubsidy,
        netCustomerCost: Math.max(0, totalPayable - solarMetrics.indicativeSubsidy),

        // Structured JSON Fields
        paymentMilestones: calculatedMilestones,
        scopeOfSupply: defaultScope,
        warranties: defaultWarranties,
        termsAndConditions: defaultTerms,
        exclusions: defaultExclusions,
        bankDetails: bankDetails || tenant?.bankDetails || null,
        financingDetails: financingDetails || null,
        commercialAnalysis: commercialAnalysis || null,

        version: 1,
        isLocked: false,
        revisionHistory: [],

        items: {
          create: lineItemsToCreate
        }
      },
      include: {
        customer: true,
        lead: true,
        items: { include: { product: true } },
        template: true
      }
    });

    // Sync with CRM Lead pipeline: update Lead status to PROPOSAL_SENT, sync deal value & capacity
    if (targetLeadId) {
      await prisma.lead.update({
        where: { id: targetLeadId },
        data: {
          status: 'PROPOSAL_SENT',
          estimatedValue: totalPayable,
          estimatedCap: Number(systemCapacity)
        }
      }).catch(err => console.log('Lead update skipped:', err.message));

      await prisma.leadActivity.create({
        data: {
          leadId: targetLeadId,
          type: 'QUOTE_SENT',
          description: `Created proposal ${quotation.qNumber} for ${systemCapacity} kWp (₹${totalPayable.toLocaleString()})`,
          performedBy: req.user.id
        }
      });
    }

    res.status(201).json({ quotation });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ error: 'Failed to create quotation', details: error.message });
  }
});

// ----------------------------------------------------
// 4. UPDATE QUOTATION (WITH LOCKING & REVISION AUDIT TRAIL)
// ----------------------------------------------------
router.patch('/api/tenant/quotations/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const existingQuote = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: { items: true, customer: true, lead: true }
    });

    if (!existingQuote) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    const {
      status,
      subtotal,
      tax,
      discount,
      templateId,
      templateType,
      sectionsConfig,
      designConfig,
      systemCapacity,
      systemType,
      connectionType,
      phase,
      roofType,
      panelBrand,
      panelModel,
      panelWattage,
      panelQuantity,
      panelWarranty,
      inverterBrand,
      inverterModel,
      inverterCapacity,
      inverterQuantity,
      inverterWarranty,
      structureBrand,
      structureWarranty,
      batteryBrand,
      batteryModel,
      batteryCapacity,
      batteryQuantity,
      batteryWarranty,
      backupLoadWatts,
      consumerNumber,
      discom,
      billingUnit,
      sanctionedLoad,
      tariffRate,
      monthlyBill,
      monthlyUnits,
      billDocumentUrl,
      roofAreaSqFt,
      financingDetails,
      commercialAnalysis,
      validityDays,
      paymentMilestones,
      scopeOfSupply,
      warranties,
      termsAndConditions,
      exclusions,
      bankDetails,
      items
    } = req.body;

    // IF JUST UPDATING STATUS (Without changing price/config)
    if (status && Object.keys(req.body).length === 1) {
      const updateData = { status };
      if (status === 'SENT') updateData.sentAt = new Date();
      if (status === 'VIEWED') {
        updateData.viewedAt = new Date();
        updateData.viewCount = (existingQuote.viewCount || 0) + 1;
      }
      if (status === 'ACCEPTED') {
        updateData.acceptedAt = new Date();
        updateData.isLocked = true;
      }
      if (status === 'REJECTED') updateData.rejectedAt = new Date();

      const updated = await prisma.quotation.update({
        where: { id, tenantId },
        data: updateData,
        include: {
          customer: true,
          lead: true,
          items: { include: { product: true } },
          projects: true,
          template: true
        }
      });

      if (existingQuote.leadId) {
        await prisma.leadActivity.create({
          data: {
            leadId: existingQuote.leadId,
            type: 'STATUS_CHANGE',
            description: `Quotation ${existingQuote.qNumber} status updated to ${status}`,
            performedBy: req.user.id
          }
        });
      }

      return res.json({ quotation: updated });
    }

    // IF EDITING CONTENT OF AN ACCEPTED / LOCKED QUOTATION -> CREATE REVISION SNAPSHOT
    let revisionHistory = Array.isArray(existingQuote.revisionHistory) ? [...existingQuote.revisionHistory] : [];
    let nextVersion = existingQuote.version || 1;

    if (existingQuote.isLocked || existingQuote.status === 'ACCEPTED' || existingQuote.status === 'SENT') {
      // Archive current version snapshot
      revisionHistory.push({
        version: existingQuote.version,
        savedAt: new Date().toISOString(),
        savedBy: req.user.id,
        reason: req.body.revisionReason || 'Quotation updated after issuance',
        snapshot: {
          qNumber: existingQuote.qNumber,
          total: existingQuote.total,
          subtotal: existingQuote.subtotal,
          tax: existingQuote.tax,
          discount: existingQuote.discount,
          systemCapacity: existingQuote.systemCapacity,
          status: existingQuote.status,
          templateType: existingQuote.templateType,
          items: existingQuote.items
        }
      });
      nextVersion += 1;
    }

    // Recalculate totals and solar metrics if capacity or costs changed
    let newSubtotal = subtotal !== undefined ? Number(subtotal) : existingQuote.subtotal;
    let newTax = tax !== undefined ? Number(tax) : existingQuote.tax;
    let newDiscount = discount !== undefined ? Number(discount) : existingQuote.discount;
    let newTotal = newSubtotal + newTax - newDiscount;

    if (items && Array.isArray(items) && items.length > 0) {
      const pricingResult = solarCalc.calculateCommercialPricing({
        items,
        overallDiscount: newDiscount,
        useCompositeSolarGST: req.body.useCompositeSolarGST || false
      });
      newSubtotal = pricingResult.subtotal;
      newTax = pricingResult.tax;
      newDiscount = pricingResult.discount;
      newTotal = pricingResult.grandTotal;
    }

    const newCap = systemCapacity !== undefined ? Number(systemCapacity) : (existingQuote.systemCapacity || 5.0);
    const newConn = connectionType || existingQuote.connectionType || 'Residential';

    const solarMetrics = calculateSolarMetrics({
      capacity: newCap,
      totalCost: newTotal,
      connectionType: newConn,
      gridTariff: tariffRate !== undefined ? tariffRate : existingQuote.tariffRate,
      monthlyBill: monthlyBill !== undefined ? monthlyBill : existingQuote.monthlyBill
    });

    const calculatedMilestones = paymentMilestones !== undefined 
      ? solarCalc.generateMilestones(newTotal, paymentMilestones)
      : (existingQuote.paymentMilestones ? solarCalc.generateMilestones(newTotal, existingQuote.paymentMilestones) : null);

    const updateData = {
      subtotal: newSubtotal,
      tax: newTax,
      discount: newDiscount,
      total: newTotal,
      version: nextVersion,
      revisionHistory,
      templateId: templateId !== undefined ? templateId : existingQuote.templateId,
      templateType: templateType || existingQuote.templateType,
      sectionsConfig: sectionsConfig !== undefined ? sectionsConfig : existingQuote.sectionsConfig,
      designConfig: designConfig !== undefined ? designConfig : existingQuote.designConfig,
      systemCapacity: newCap,
      systemType: systemType || existingQuote.systemType,
      connectionType: newConn,
      phase: phase || existingQuote.phase,
      roofType: roofType || existingQuote.roofType,
      panelBrand: panelBrand || existingQuote.panelBrand,
      panelModel: panelModel || existingQuote.panelModel,
      panelWattage: panelWattage !== undefined ? Number(panelWattage) : existingQuote.panelWattage,
      panelQuantity: panelQuantity !== undefined ? Number(panelQuantity) : existingQuote.panelQuantity,
      panelWarranty: panelWarranty || existingQuote.panelWarranty,
      inverterBrand: inverterBrand || existingQuote.inverterBrand,
      inverterModel: inverterModel || existingQuote.inverterModel,
      inverterCapacity: inverterCapacity !== undefined ? Number(inverterCapacity) : existingQuote.inverterCapacity,
      inverterQuantity: inverterQuantity !== undefined ? Number(inverterQuantity) : existingQuote.inverterQuantity,
      inverterWarranty: inverterWarranty || existingQuote.inverterWarranty,
      structureBrand: structureBrand || existingQuote.structureBrand,
      structureWarranty: structureWarranty || existingQuote.structureWarranty,
      batteryBrand: batteryBrand !== undefined ? batteryBrand : existingQuote.batteryBrand,
      batteryModel: batteryModel !== undefined ? batteryModel : existingQuote.batteryModel,
      batteryCapacity: batteryCapacity !== undefined ? Number(batteryCapacity) : existingQuote.batteryCapacity,
      batteryQuantity: batteryQuantity !== undefined ? Number(batteryQuantity) : existingQuote.batteryQuantity,
      batteryWarranty: batteryWarranty !== undefined ? batteryWarranty : existingQuote.batteryWarranty,
      backupLoadWatts: backupLoadWatts !== undefined ? Number(backupLoadWatts) : existingQuote.backupLoadWatts,
      consumerNumber: consumerNumber !== undefined ? consumerNumber : existingQuote.consumerNumber,
      discom: discom !== undefined ? discom : existingQuote.discom,
      billingUnit: billingUnit !== undefined ? billingUnit : existingQuote.billingUnit,
      sanctionedLoad: sanctionedLoad !== undefined ? Number(sanctionedLoad) : existingQuote.sanctionedLoad,
      tariffRate: tariffRate !== undefined ? Number(tariffRate) : existingQuote.tariffRate,
      monthlyBill: monthlyBill !== undefined ? Number(monthlyBill) : existingQuote.monthlyBill,
      monthlyUnits: monthlyUnits !== undefined ? Number(monthlyUnits) : existingQuote.monthlyUnits,
      billDocumentUrl: billDocumentUrl !== undefined ? billDocumentUrl : existingQuote.billDocumentUrl,
      roofAreaSqFt: roofAreaSqFt !== undefined ? Number(roofAreaSqFt) : existingQuote.roofAreaSqFt,
      validityDays: validityDays !== undefined ? Number(validityDays) : existingQuote.validityDays,

      // Recalculated metrics
      annualGeneration: solarMetrics.annualGeneration,
      lifetimeGeneration: solarMetrics.lifetimeGeneration,
      monthlySavings: solarMetrics.monthlySavings,
      annualSavings: solarMetrics.annualSavings,
      lifetimeSavings: solarMetrics.lifetimeSavings,
      paybackYears: solarMetrics.paybackYears,
      co2ReductionKg: solarMetrics.co2ReductionKg,
      treeEquivalent: solarMetrics.treeEquivalent,
      indicativeSubsidy: solarMetrics.indicativeSubsidy,
      netCustomerCost: Math.max(0, newTotal - solarMetrics.indicativeSubsidy),

      paymentMilestones: calculatedMilestones,
      scopeOfSupply: scopeOfSupply || existingQuote.scopeOfSupply,
      warranties: warranties || existingQuote.warranties,
      termsAndConditions: termsAndConditions || existingQuote.termsAndConditions,
      exclusions: exclusions || existingQuote.exclusions,
      bankDetails: bankDetails !== undefined ? bankDetails : existingQuote.bankDetails,
      financingDetails: financingDetails !== undefined ? financingDetails : existingQuote.financingDetails,
      commercialAnalysis: commercialAnalysis !== undefined ? commercialAnalysis : existingQuote.commercialAnalysis
    };

    if (status) {
      updateData.status = status;
      if (status === 'ACCEPTED') {
        updateData.acceptedAt = new Date();
        updateData.isLocked = true;
      }
    }

    // Update line items if provided
    if (items && Array.isArray(items)) {
      await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
      updateData.items = {
        create: items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          taxRate: Number(item.taxRate) || 0,
          total: Number(item.total) || (Number(item.quantity) * Number(item.unitPrice))
        }))
      };
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id, tenantId },
      data: updateData,
      include: { 
        customer: true, 
        lead: true, 
        items: { include: { product: true } },
        projects: true,
        template: true
      }
    });

    res.json({ quotation: updatedQuotation });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ error: 'Failed to update quotation' });
  }
});

// ----------------------------------------------------
// 5. SHARE VIA WHATSAPP / EMAIL TRACKING
// ----------------------------------------------------
router.post('/api/tenant/quotations/:id/share', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { channel, recipientPhone, recipientEmail } = req.body;
    const tenantId = req.user.tenantId;

    const [quotation, tenant] = await Promise.all([
      prisma.quotation.findFirst({
        where: { id, tenantId },
        include: { customer: true, lead: true }
      }),
      prisma.tenant.findUnique({ where: { id: tenantId } })
    ]);

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const client = quotation.customer || quotation.lead;
    const clientName = client?.name || 'Valued Customer';
    const phone = recipientPhone || client?.mobile || client?.phone || '';
    const email = recipientEmail || client?.email || '';

    // Mark quotation status as SENT
    await prisma.quotation.update({
      where: { id, tenantId },
      data: {
        status: quotation.status === 'DRAFT' ? 'SENT' : quotation.status,
        sentAt: quotation.sentAt || new Date()
      }
    });

    if (quotation.leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: quotation.leadId,
          type: 'QUOTE_SENT',
          description: `Quotation ${quotation.qNumber} shared via ${channel.toUpperCase()}`,
          performedBy: req.user.id
        }
      });
    }

    // Build WhatsApp message text
    const message = `Dear ${clientName},\n\nGreetings from *${tenant?.name || 'WhereReady Solar'}*!\n\nWe have prepared your personalized Solar Project Proposal for *${quotation.systemCapacity} kWp Rooftop System*.\n\n*Proposal Highlights:*\n• System Capacity: ${quotation.systemCapacity} kWp (${quotation.systemType})\n• Total Investment: ₹${quotation.total?.toLocaleString()}\n• Est. Annual Savings: ₹${quotation.annualSavings?.toLocaleString()}\n• Indicative Subsidy: ₹${quotation.indicativeSubsidy?.toLocaleString()}\n• Proposal No: ${quotation.qNumber}\n\nPlease review your complete proposal. Feel free to contact us for any questions!\n\nBest Regards,\n*${tenant?.name || 'WhereReady Solar'}*\nPhone: ${tenant?.phone || ''}`;

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      channel,
      whatsappUrl,
      message,
      emailSent: channel === 'email' ? true : false
    });
  } catch (error) {
    console.error('Error sharing quotation:', error);
    res.status(500).json({ error: 'Failed to share quotation' });
  }
});

// ----------------------------------------------------
// 6. CONVERT ACCEPTED QUOTATION TO PROJECT (NO RE-ENTRY)
// ----------------------------------------------------
router.post('/api/tenant/quotations/:id/convert', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const body = req.body || {};

    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } }, customer: true, lead: true }
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Check if project was already created for this quotation (idempotent 1-click check)
    const existingProject = await prisma.project.findFirst({
      where: { quotationId: id, tenantId },
      include: { customer: true, lead: true, quotation: true, discomApplication: true, subsidies: true, Document: true }
    });

    if (existingProject) {
      return res.status(200).json({
        success: true,
        message: 'Quotation already converted to project',
        project: existingProject,
        quotation
      });
    }

    // Wrap conversion operations atomically in prisma.$transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-verify existing project inside transaction
      const txExistingProject = await tx.project.findFirst({
        where: { quotationId: id, tenantId },
        include: { customer: true, lead: true, quotation: true, discomApplication: true, subsidies: true, Document: true }
      });

      if (txExistingProject) {
        return {
          project: txExistingProject,
          quotation
        };
      }

      // Lock quotation and mark ACCEPTED
      const updatedQuotation = await tx.quotation.update({
        where: { id, tenantId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: quotation.acceptedAt || new Date(),
          isLocked: true
        }
      });

      let customerId = quotation.customerId;

      // Convert Lead to Customer if linked
      if (quotation.leadId) {
        try {
          await tx.lead.update({
            where: { id: quotation.leadId, tenantId },
            data: { status: 'WON' }
          });
        } catch (err) {
          console.warn('Lead WON update skipped:', err.message);
        }

        let existingCustomer = await tx.customer.findFirst({
          where: { leadId: quotation.leadId, tenantId }
        });

        if (!existingCustomer) {
          const lead = quotation.lead || await tx.lead.findUnique({ where: { id: quotation.leadId, tenantId } });
          if (lead) {
            try {
              existingCustomer = await tx.customer.create({
                data: {
                  tenantId,
                  leadId: quotation.leadId,
                  name: lead.name || 'Solar Customer',
                  email: lead.email || null,
                  mobile: lead.mobile || '0000000000',
                  company: lead.company || null,
                  address: lead.address || null,
                  city: lead.city || 'Pune',
                  customerType: 'RESIDENTIAL'
                }
              });
            } catch (cErr) {
              console.warn('Customer auto-create warning:', cErr.message);
              existingCustomer = await tx.customer.findFirst({
                where: { tenantId, OR: [{ leadId: quotation.leadId }, { mobile: lead.mobile || '0000000000' }] }
              });
            }
          }
        }

        if (existingCustomer) {
          customerId = existingCustomer.id;
          await tx.quotation.update({
            where: { id, tenantId },
            data: { customerId }
          }).catch(() => {});
        }
      }

      // Find existing site survey for this lead or customer
      const existingSurvey = await tx.siteSurvey.findFirst({
        where: {
          tenantId,
          OR: [
            ...(quotation.leadId ? [{ leadId: quotation.leadId }] : []),
            ...(customerId ? [{ customerId }] : [])
          ]
        }
      }).catch(() => null);

      const projectCount = await tx.project.count({ where: { tenantId } });
      const projectNumber = `PRJ-${(projectCount + 1).toString().padStart(5, '0')}`;

      const createdProject = await tx.project.create({
        data: {
          tenantId,
          projectNumber,
          quotationId: id,
          customerId: customerId || null,
          leadId: quotation.leadId || null,
          surveyId: existingSurvey ? existingSurvey.id : null,
          name: `${projectNumber}: ${quotation.customer?.name || quotation.lead?.name || 'Solar Installation'} (${quotation.systemCapacity || 5} kWp)`,
          capacity: quotation.systemCapacity || 5.0,
          capacityUnit: 'kWp',
          systemType: quotation.systemType || 'On-grid',
          projectType: quotation.connectionType || 'Residential',
          currentStage: body.currentStage || 'Planning',
          status: 'In Progress',
          progressPercent: 15,
          estimatedValue: quotation.total || 0,
          estimatedCost: Math.round((quotation.total || 0) * 0.72),
          city: quotation.customer?.city || quotation.lead?.city || 'Pune',
          state: 'Maharashtra',
          installationAddress: quotation.customer?.address || quotation.lead?.address || 'Site Roof'
        }
      });

      // Auto-create BOM (ProjectMaterialRequirement) entries from quotation line items
      if (quotation.items && quotation.items.length > 0) {
        for (const item of quotation.items) {
          try {
            await tx.projectMaterialRequirement.create({
              data: {
                projectId: createdProject.id,
                productId: item.productId || null,
                description: item.description,
                quantity: item.quantity || 1,
                status: 'Required'
              }
            });
          } catch (e) {
            console.warn('BOM item skipped:', e.message);
          }
        }
      }

      // Auto-create Site Survey Task
      try {
        await tx.projectTask.create({
          data: {
            projectId: createdProject.id,
            name: 'Site Feasibility & Shadow Analysis Survey',
            description: `Detailed roof structural measurement and shadow analysis for ${quotation.systemCapacity || 5} kWp system`,
            priority: 'High',
            status: 'To Do',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        });
      } catch (tErr) {
        console.warn('Project task creation skipped:', tErr.message);
      }

      // Auto-create Discom Net Metering Application
      try {
        const existingDiscom = await tx.discomApplication.findUnique({
          where: { projectId: createdProject.id }
        });
        if (!existingDiscom) {
          await tx.discomApplication.create({
            data: {
              tenantId,
              projectId: createdProject.id,
              status: 'FEASIBILITY_PENDING'
            }
          });
        }
      } catch (dErr) {
        console.warn('Discom creation skipped:', dErr.message);
      }

      // Auto-create Initial Proforma / Milestone Invoices if customer exists
      if (customerId && Array.isArray(quotation.paymentMilestones) && quotation.paymentMilestones.length > 0) {
        try {
          const firstMilestone = quotation.paymentMilestones[0];
          await tx.invoice.create({
            data: {
              tenantId,
              projectId: createdProject.id,
              customerId,
              invoiceNumber: `INV-${quotation.qNumber}-01`,
              status: 'UNPAID',
              amount: Number(firstMilestone.amount) || Math.round((quotation.total || 0) * 0.2),
              date: new Date(),
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          });
        } catch (invErr) {
          console.warn('Invoice creation skipped:', invErr.message);
        }
      }

      // Log Project Timeline Event
      try {
        await tx.projectTimelineEvent.create({
          data: {
            projectId: createdProject.id,
            title: 'Project Auto-Created',
            description: `Created from accepted Quotation ${quotation.qNumber} (${quotation.systemCapacity || 5} kWp for ₹${(quotation.total || 0).toLocaleString()})`,
            eventType: 'STATUS_UPDATE',
            createdBy: req.user.id
          }
        });
      } catch (tlErr) {
        console.warn('Project timeline event skipped:', tlErr.message);
      }

      // Log Lead Activity if leadId exists
      if (quotation.leadId) {
        try {
          await tx.leadActivity.create({
            data: {
              leadId: quotation.leadId,
              type: 'PROJECT_CONVERTED',
              description: `Converted to project ${createdProject.name}`,
              performedBy: req.user.id
            }
          });
        } catch (laErr) {
          console.warn('LeadActivity skipped:', laErr.message);
        }
      }

      return {
        project: createdProject,
        quotation: updatedQuotation
      };
    });

    res.status(200).json({
      success: true,
      message: 'Quotation successfully converted to project',
      project: result.project,
      quotation: result.quotation
    });
  } catch (error) {
    console.error('Error converting quotation to project:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to convert quotation to project', 
      details: error.message 
    });
  }
});

// ----------------------------------------------------
// 7. DELETE QUOTATION (WITH INTEGRITY CHECKS)
// ----------------------------------------------------
router.delete('/api/tenant/quotations/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: { projects: true }
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (quotation.projects && quotation.projects.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete quotation that is converted to an active project. Manage the project directly.' 
      });
    }

    // Delete items first
    await prisma.quotationItem.deleteMany({
      where: { quotationId: id }
    });

    await prisma.quotation.delete({
      where: { id }
    });

    if (quotation.leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: quotation.leadId,
          type: 'STATUS_CHANGE',
          description: `Quotation ${quotation.qNumber} was deleted`,
          performedBy: req.user.id
        }
      }).catch(() => {});
    }

    res.json({ success: true, message: `Quotation ${quotation.qNumber} deleted successfully` });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ error: 'Failed to delete quotation', details: error.message });
  }
});

// ----------------------------------------------------
// 8. CREATE FORMAL REVISION (INCREMENT VERSION & ARCHIVE SNAPSHOT)
// ----------------------------------------------------
router.post('/api/tenant/quotations/:id/revision', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { revisionReason = 'Quotation revised per client negotiation' } = req.body;

    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: { 
        items: { include: { product: true } }, 
        customer: true, 
        lead: true,
        projects: true
      }
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    let revisionHistory = Array.isArray(quotation.revisionHistory) ? [...quotation.revisionHistory] : [];

    // Save snapshot of current version
    revisionHistory.push({
      version: quotation.version || 1,
      savedAt: new Date().toISOString(),
      savedBy: req.user.id,
      reason: revisionReason,
      snapshot: {
        qNumber: quotation.qNumber,
        total: quotation.total,
        subtotal: quotation.subtotal,
        tax: quotation.tax,
        discount: quotation.discount,
        systemCapacity: quotation.systemCapacity,
        status: quotation.status,
        items: quotation.items
      }
    });

    const nextVersion = (quotation.version || 1) + 1;

    const updated = await prisma.quotation.update({
      where: { id, tenantId },
      data: {
        version: nextVersion,
        status: 'NEGOTIATION',
        isLocked: false,
        revisionHistory
      },
      include: { 
        customer: true, 
        lead: true, 
        items: { include: { product: true } }, 
        projects: true 
      }
    });

    if (quotation.leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: quotation.leadId,
          type: 'STATUS_CHANGE',
          description: `Created revision v${nextVersion} for quotation ${quotation.qNumber} (${revisionReason})`,
          performedBy: req.user.id
        }
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: `Quotation updated to revision v${nextVersion}`,
      quotation: updated
    });
  } catch (error) {
    console.error('Error creating revision:', error);
    res.status(500).json({ error: 'Failed to create revision', details: error.message });
  }
});

// ----------------------------------------------------
// 9. DUPLICATE QUOTATION
// ----------------------------------------------------
router.post('/api/tenant/quotations/:id/duplicate', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const source = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: { items: true, customer: true, lead: true }
    });

    if (!source) {
      return res.status(404).json({ error: 'Source quotation not found' });
    }

    const qNumber = `QT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const duplicated = await prisma.quotation.create({
      data: {
        tenantId,
        customerId: source.customerId,
        leadId: source.leadId,
        qNumber,
        date: new Date(),
        validityDays: source.validityDays,
        subtotal: source.subtotal,
        tax: source.tax,
        discount: source.discount,
        total: source.total,
        status: 'DRAFT',
        templateId: source.templateId,
        templateType: source.templateType,
        sectionsConfig: source.sectionsConfig,
        designConfig: source.designConfig,
        systemCapacity: source.systemCapacity,
        systemType: source.systemType,
        connectionType: source.connectionType,
        phase: source.phase,
        roofType: source.roofType,
        panelBrand: source.panelBrand,
        panelModel: source.panelModel,
        panelWattage: source.panelWattage,
        panelQuantity: source.panelQuantity,
        panelWarranty: source.panelWarranty,
        inverterBrand: source.inverterBrand,
        inverterModel: source.inverterModel,
        inverterCapacity: source.inverterCapacity,
        inverterQuantity: source.inverterQuantity,
        inverterWarranty: source.inverterWarranty,
        structureBrand: source.structureBrand,
        structureWarranty: source.structureWarranty,
        batteryBrand: source.batteryBrand,
        batteryModel: source.batteryModel,
        batteryCapacity: source.batteryCapacity,
        batteryQuantity: source.batteryQuantity,
        batteryWarranty: source.batteryWarranty,
        backupLoadWatts: source.backupLoadWatts,
        consumerNumber: source.consumerNumber,
        discom: source.discom,
        billingUnit: source.billingUnit,
        sanctionedLoad: source.sanctionedLoad,
        tariffRate: source.tariffRate,
        monthlyBill: source.monthlyBill,
        monthlyUnits: source.monthlyUnits,
        billDocumentUrl: source.billDocumentUrl,
        roofAreaSqFt: source.roofAreaSqFt,
        annualGeneration: source.annualGeneration,
        lifetimeGeneration: source.lifetimeGeneration,
        monthlySavings: source.monthlySavings,
        annualSavings: source.annualSavings,
        lifetimeSavings: source.lifetimeSavings,
        paybackYears: source.paybackYears,
        co2ReductionKg: source.co2ReductionKg,
        treeEquivalent: source.treeEquivalent,
        indicativeSubsidy: source.indicativeSubsidy,
        netCustomerCost: source.netCustomerCost,
        paymentMilestones: source.paymentMilestones,
        scopeOfSupply: source.scopeOfSupply,
        warranties: source.warranties,
        termsAndConditions: source.termsAndConditions,
        exclusions: source.exclusions,
        bankDetails: source.bankDetails,
        financingDetails: source.financingDetails,
        commercialAnalysis: source.commercialAnalysis,
        version: 1,
        isLocked: false,
        revisionHistory: [],
        items: {
          create: source.items.map(it => ({
            productId: it.productId,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            total: it.total
          }))
        }
      },
      include: {
        customer: true,
        lead: true,
        items: { include: { product: true } },
        template: true
      }
    });

    if (source.leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: source.leadId,
          type: 'QUOTE_SENT',
          description: `Duplicated proposal from ${source.qNumber} to ${duplicated.qNumber}`,
          performedBy: req.user.id
        }
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: `Quotation duplicated as ${duplicated.qNumber}`,
      quotation: duplicated
    });
  } catch (error) {
    console.error('Error duplicating quotation:', error);
    res.status(500).json({ error: 'Failed to duplicate quotation', details: error.message });
  }
});

module.exports = router;
