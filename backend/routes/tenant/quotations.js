const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireTenantAuth } = require('../../middleware/auth');

// Utility: Calculate solar generation and economics for Maharashtra
function calculateSolarMetrics({ capacity, totalCost, connectionType = 'Residential' }) {
  const cap = Number(capacity) || 5;
  // Maharashtra average: ~4.0 to 4.1 kWh per kWp per day -> ~1,460 to 1,500 kWh per kWp per year
  const annualGeneration = Math.round(cap * 1460);
  const lifetimeGeneration = Math.round(annualGeneration * 25 * 0.92); // Accounting for 0.7% annual degradation

  // MSEDCL Average Domestic Tariff: ~₹8.5/unit, C&I: ~₹10.5/unit
  const unitTariff = connectionType === 'Residential' ? 8.5 : 10.5;
  const annualSavings = Math.round(annualGeneration * unitTariff);
  const monthlySavings = Math.round(annualSavings / 12);
  const lifetimeSavings = Math.round(lifetimeGeneration * unitTariff);

  // Payback period
  const cost = Number(totalCost) || (cap * 60000);
  const paybackYears = annualSavings > 0 ? Number((cost / annualSavings).toFixed(1)) : 4.5;

  // Environmental: 0.82 kg CO2 per kWh in Indian grid
  const co2ReductionKg = Math.round(annualGeneration * 0.82);
  const treeEquivalent = Math.round(co2ReductionKg / 20); // 1 tree absorbs ~20kg CO2/yr

  // Indicative Central Subsidy (PM Surya Ghar Muft Bijli Yojana - Residential only)
  let indicativeSubsidy = 0;
  if (connectionType === 'Residential') {
    if (cap <= 1) indicativeSubsidy = 30000;
    else if (cap <= 2) indicativeSubsidy = 60000;
    else indicativeSubsidy = 78000; // Cap at 78,000 for 3kW and above
  }

  // Monthly generation distribution (standard Maharashtra solar irradiance curve)
  const monthlyDistribution = [
    { month: 'January', generation: Math.round(annualGeneration * 0.082) },
    { month: 'February', generation: Math.round(annualGeneration * 0.088) },
    { month: 'March', generation: Math.round(annualGeneration * 0.098) },
    { month: 'April', generation: Math.round(annualGeneration * 0.102) },
    { month: 'May', generation: Math.round(annualGeneration * 0.106) }, // Peak month
    { month: 'June', generation: Math.round(annualGeneration * 0.072) },
    { month: 'July', generation: Math.round(annualGeneration * 0.061) }, // Monsoon low
    { month: 'August', generation: Math.round(annualGeneration * 0.064) },
    { month: 'September', generation: Math.round(annualGeneration * 0.076) },
    { month: 'October', generation: Math.round(annualGeneration * 0.086) },
    { month: 'November', generation: Math.round(annualGeneration * 0.084) },
    { month: 'December', generation: Math.round(annualGeneration * 0.081) },
  ];

  return {
    annualGeneration,
    lifetimeGeneration,
    annualSavings,
    monthlySavings,
    lifetimeSavings,
    paybackYears,
    co2ReductionKg,
    treeEquivalent,
    indicativeSubsidy,
    monthlyDistribution,
    peakMonth: 'May'
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
          projects: true
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
          projects: true
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

    // Auto calculate solar generation & financial ROI with all-inclusive GST pricing
    let totalPayable = req.body.totalSystemCost || req.body.total;
    let finalSubtotal = Number(subtotal);
    let finalTax = Number(tax);
    let finalDiscount = Number(discount);

    if (totalPayable) {
      totalPayable = Number(totalPayable);
      // All-inclusive GST calculation: 13.8% composite solar GST (70% material @ 12% + 30% service @ 18%)
      finalSubtotal = Math.round(totalPayable / 1.138);
      finalTax = totalPayable - finalSubtotal;
      finalDiscount = 0;
    } else {
      totalPayable = finalSubtotal + finalTax - finalDiscount;
    }

    const solarMetrics = calculateSolarMetrics({
      capacity: systemCapacity,
      totalCost: totalPayable,
      connectionType
    });

    const qNumber = `QT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Default Milestone Schedule if not supplied
    const defaultMilestones = paymentMilestones || [
      { percentage: 20, amount: Math.round(totalPayable * 0.2), description: 'Advance booking along with signed work order' },
      { percentage: 60, amount: Math.round(totalPayable * 0.6), description: 'Upon dispatch & delivery of modules, inverter and structure at site' },
      { percentage: 15, amount: Math.round(totalPayable * 0.15), description: 'Upon completion of mechanical & electrical installation' },
      { percentage: 5, amount: Math.round(totalPayable * 0.05), description: 'Upon MSEDCL Net Metering commissioning & project handover' }
    ];

    // Default Scope of Supply
    const defaultScope = scopeOfSupply || [
      `${systemCapacity} kWp Tier-1 Solar PV Modules (${panelBrand} ${panelWattage}Wp)`,
      `${systemCapacity} kW High-Efficiency On-Grid Inverter (${inverterBrand})`,
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

    // Build line items
    let lineItemsToCreate = [];
    if (items && items.length > 0) {
      lineItemsToCreate = items.map(item => ({
        productId: item.productId || null,
        description: item.description || 'Solar Equipment / Service',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        taxRate: Number(item.taxRate) || 0,
        total: Number(item.total) || (Number(item.quantity) * Number(item.unitPrice))
      }));
    } else {
      // Default line items
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
    }

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
        paymentMilestones: defaultMilestones,
        scopeOfSupply: defaultScope,
        warranties: defaultWarranties,
        termsAndConditions: defaultTerms,
        exclusions: defaultExclusions,
        bankDetails: bankDetails || null,

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
        items: true
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
        data: updateData
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
          items: existingQuote.items
        }
      });
      nextVersion += 1;
    }

    // Recalculate totals and solar metrics if capacity or costs changed
    const newSubtotal = subtotal !== undefined ? Number(subtotal) : existingQuote.subtotal;
    const newTax = tax !== undefined ? Number(tax) : existingQuote.tax;
    const newDiscount = discount !== undefined ? Number(discount) : existingQuote.discount;
    const newTotal = newSubtotal + newTax - newDiscount;

    const newCap = systemCapacity !== undefined ? Number(systemCapacity) : (existingQuote.systemCapacity || 5.0);
    const newConn = connectionType || existingQuote.connectionType || 'Residential';

    const solarMetrics = calculateSolarMetrics({
      capacity: newCap,
      totalCost: newTotal,
      connectionType: newConn
    });

    const updateData = {
      subtotal: newSubtotal,
      tax: newTax,
      discount: newDiscount,
      total: newTotal,
      version: nextVersion,
      revisionHistory,
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

      paymentMilestones: paymentMilestones || existingQuote.paymentMilestones,
      scopeOfSupply: scopeOfSupply || existingQuote.scopeOfSupply,
      warranties: warranties || existingQuote.warranties,
      termsAndConditions: termsAndConditions || existingQuote.termsAndConditions,
      exclusions: exclusions || existingQuote.exclusions,
      bankDetails: bankDetails !== undefined ? bankDetails : existingQuote.bankDetails
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
        projects: true 
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

    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } }, customer: true, lead: true }
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Lock quotation and mark ACCEPTED
    await prisma.quotation.update({
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
        await prisma.lead.update({
          where: { id: quotation.leadId },
          data: { status: 'WON' }
        });
      } catch (err) {
        console.warn('Lead WON update skipped:', err.message);
      }

      let existingCustomer = await prisma.customer.findFirst({
        where: { leadId: quotation.leadId, tenantId }
      });

      if (!existingCustomer) {
        const lead = quotation.lead || await prisma.lead.findUnique({ where: { id: quotation.leadId } });
        if (lead) {
          try {
            existingCustomer = await prisma.customer.create({
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
            existingCustomer = await prisma.customer.findFirst({
              where: { tenantId, OR: [{ leadId: quotation.leadId }, { mobile: lead.mobile || '0000000000' }] }
            });
          }
        }
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await prisma.quotation.update({
          where: { id, tenantId },
          data: { customerId }
        }).catch(() => {});
      }
    }

    // Check if project already exists for this quotation
    let project = await prisma.project.findFirst({
      where: { quotationId: id, tenantId }
    });

    if (!project) {
      // Find existing site survey for this lead or customer
      const existingSurvey = await prisma.siteSurvey.findFirst({
        where: {
          tenantId,
          OR: [
            ...(quotation.leadId ? [{ leadId: quotation.leadId }] : []),
            ...(customerId ? [{ customerId }] : [])
          ]
        }
      }).catch(() => null);

      const projectCount = await prisma.project.count({ where: { tenantId } });
      const projectNumber = `PRJ-${(projectCount + 1).toString().padStart(5, '0')}`;

      project = await prisma.project.create({
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
          currentStage: 'Planning',
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
            await prisma.projectMaterialRequirement.create({
              data: {
                projectId: project.id,
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

      // Auto-create Site Survey Task (Notice: ProjectTask does not have tenantId)
      try {
        await prisma.projectTask.create({
          data: {
            projectId: project.id,
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

      // Auto-create Discom Net Metering Application (Notice: DiscomApplication has projectId, tenantId, status)
      try {
        const existingDiscom = await prisma.discomApplication.findUnique({
          where: { projectId: project.id }
        });
        if (!existingDiscom) {
          await prisma.discomApplication.create({
            data: {
              tenantId,
              projectId: project.id,
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
          await prisma.invoice.create({
            data: {
              tenantId,
              projectId: project.id,
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

      // Log Project Timeline Event (Notice: ProjectTimelineEvent does not have tenantId)
      try {
        await prisma.projectTimelineEvent.create({
          data: {
            projectId: project.id,
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
          await prisma.leadActivity.create({
            data: {
              leadId: quotation.leadId,
              type: 'PROJECT_CONVERTED',
              description: `Converted to project ${project.name}`,
              performedBy: req.user.id
            }
          });
        } catch (laErr) {
          console.warn('LeadActivity skipped:', laErr.message);
        }
      }
    }

    res.json({
      success: true,
      message: 'Quotation successfully converted to project',
      project,
      quotation
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

module.exports = router;
