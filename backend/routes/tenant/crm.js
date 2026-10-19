const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validate');
const { createLeadSchema, createProductSchema } = require('../validations');
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT ADMIN - PHASE 1: SALES & CRM
// ----------------------------------------------------

// LEADS
router.get('/api/tenant/leads/dashboard', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const totalLeads = await prisma.lead.count({ where: { tenantId } });
    const newLeads = await prisma.lead.count({ where: { tenantId, status: 'NEW' } });
    const qualifiedLeads = await prisma.lead.count({ where: { tenantId, status: 'QUALIFIED' } });
    const wonLeads = await prisma.lead.count({ where: { tenantId, status: 'WON' } });
    const lostLeads = await prisma.lead.count({ where: { tenantId, status: 'LOST' } });
    
    // Quick Conversion Rate
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;
    
    res.json({ dashboard: { totalLeads, newLeads, qualifiedLeads, wonLeads, lostLeads, conversionRate } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});
router.get('/api/tenant/leads', requireTenantAuth, async (req, res) => {
  try {
    const { source, status, assigneeId, search, all } = req.query;
    let where = { tenantId: req.user.tenantId };
    if (source) where.source = source;
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignee: true,
        customer: true,
        projects: { select: { id: true, name: true, status: true, capacity: true } },
        quotations: { select: { id: true, qNumber: true, total: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ leads });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.delete('/api/tenant/leads/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const lead = await prisma.lead.findUnique({
      where: { id, tenantId },
      include: { customer: true, projects: true }
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Clean up dependent records safely
    await prisma.leadNote.deleteMany({ where: { leadId: id } });
    await prisma.leadFollowUp.deleteMany({ where: { leadId: id } });
    await prisma.leadActivity.deleteMany({ where: { leadId: id } });
    await prisma.quotation.deleteMany({ where: { leadId: id, tenantId } });
    await prisma.siteSurvey.deleteMany({ where: { leadId: id, tenantId } });

    await prisma.lead.delete({
      where: { id, tenantId }
    });

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

router.get('/api/tenant/leads/:id', requireTenantAuth, async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        activities: { orderBy: { createdAt: 'desc' } },
        followUps: { orderBy: { scheduledAt: 'asc' } },
        leadNotes: { orderBy: { createdAt: 'desc' } },
        assignee: true,
        customer: true,
        projects: true
      }
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

router.post('/api/tenant/leads', requireTenantAuth, validate(createLeadSchema), async (req, res) => {
  try {
    const { mobile, email, forceCreate, name, ...rest } = req.body;
    
    // Duplicate Detection
    const duplicate = await prisma.lead.findFirst({
      where: {
        tenantId: req.user.tenantId,
        OR: [
          { mobile: mobile },
          ...(email ? [{ email: email }] : [])
        ]
      }
    });
    
    let lead;
    if (duplicate && !forceCreate) {
      // Update existing lead with latest details so data is never lost
      lead = await prisma.lead.update({
        where: { id: duplicate.id },
        data: {
          ...rest,
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          updatedAt: new Date()
        }
      });
      return res.json({ lead, message: 'Existing lead updated' });
    } else {
      lead = await prisma.lead.create({
        data: {
          ...rest,
          name,
          mobile,
          email,
          tenantId: req.user.tenantId
        }
      });
    }
    
    // Log Activity
    try {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'STATUS_CHANGE',
          description: duplicate ? 'Lead updated with new inquiry' : 'Lead created',
          performedBy: req.user.userId || req.user.id || 'SYSTEM'
        }
      });
    } catch (e) {
      console.warn('Could not log lead activity:', e.message);
    }
    
    res.json({ lead });
  } catch (error) {
    console.error('Lead create error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

router.patch('/api/tenant/leads/:id', requireTenantAuth, async (req, res) => {
  try {
    const lead = await prisma.lead.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: req.body
    });
    
    if (req.body.status) {
       await prisma.leadActivity.create({
         data: {
           leadId: lead.id,
           type: 'STATUS_CHANGE',
           description: `Lead status changed to ${req.body.status}`,
           performedBy: req.user.id
         }
       });
    }
    
    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

router.post('/api/tenant/leads/:id/followups', requireTenantAuth, async (req, res) => {
  try {
    const followup = await prisma.leadFollowUp.create({
      data: { ...req.body, leadId: req.params.id, scheduledAt: new Date(req.body.scheduledAt) }
    });
    res.json({ followup });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add followup' });
  }
});

router.post('/api/tenant/leads/:id/notes', requireTenantAuth, async (req, res) => {
  try {
    const note = await prisma.leadNote.create({
      data: { content: req.body.content, leadId: req.params.id, createdBy: req.user.id }
    });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

router.post('/api/tenant/leads/:id/convert', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId || req.user.id;

    const lead = await prisma.lead.findUnique({ where: { id, tenantId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Mark Lead as WON
    const updatedLead = await prisma.lead.update({
      where: { id, tenantId },
      data: { status: 'WON' }
    });

    // Check if Project was ALREADY created for this lead (Idempotent check prevents duplicates & timeouts)
    const existingProject = await prisma.project.findFirst({
      where: { leadId: id, tenantId },
      include: {
        customer: true,
        lead: true,
        quotation: true,
        discomApplication: true,
        subsidies: true,
        Document: true
      }
    });

    if (existingProject) {
      if (req.body.customerName || req.body.mobile || req.body.address) {
        await prisma.customer.update({
          where: { id: existingProject.customerId },
          data: {
            name: req.body.customerName || undefined,
            mobile: req.body.mobile || undefined,
            address: req.body.address || undefined,
            city: req.body.city || undefined,
          }
        }).catch(() => {});
      }
      return res.json({ lead: updatedLead, customer: existingProject.customer, project: existingProject });
    }

    // Get or Create Customer
    let customer = await prisma.customer.findFirst({ where: { leadId: id, tenantId } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId,
          leadId: id,
          name: req.body.customerName || lead.name,
          email: req.body.email || lead.email,
          mobile: req.body.mobile || lead.mobile,
          company: lead.company,
          address: req.body.address || lead.address,
          city: req.body.city || lead.city || 'Pune',
          customerType: req.body.customerType || lead.customerType || 'RESIDENTIAL'
        }
      });
    }

    // Auto-link latest quotation if any exists for this lead
    const latestQuote = await prisma.quotation.findFirst({
      where: { leadId: id, tenantId },
      orderBy: { createdAt: 'desc' }
    });

    if (latestQuote) {
      await prisma.quotation.update({
        where: { id: latestQuote.id },
        data: { status: 'ACCEPTED', customerId: customer.id, isLocked: true }
      }).catch(() => {});
    }

    // Auto-Initialize Site Survey
    const surveyDate = new Date();
    surveyDate.setDate(surveyDate.getDate() + 3);

    let survey = await prisma.siteSurvey.findFirst({
      where: { leadId: id, tenantId }
    });
    if (!survey) {
      survey = await prisma.siteSurvey.create({
        data: {
          tenantId,
          customerId: customer.id,
          leadId: id,
          surveyDate,
          status: 'SCHEDULED'
        }
      });
    }

    // Generate unique project number
    const projectNumber = `PRJ-${Date.now().toString().slice(-5)}`;

    const capacityVal = parseFloat(req.body.capacity) || (latestQuote ? latestQuote.systemCapacity : null) || lead.estimatedCap || 3.3;
    const systemTypeVal = req.body.systemType || (latestQuote ? latestQuote.systemType : null) || lead.systemType || 'On-Grid';
    const estimatedValueVal = parseFloat(req.body.estimatedValue) || (latestQuote ? latestQuote.total : null) || lead.estimatedValue || Math.round(capacityVal * 55000);
    const estimatedCostVal = Math.round(estimatedValueVal * 0.72);

    const project = await prisma.project.create({
      data: {
        tenantId,
        projectNumber,
        customerId: customer.id,
        leadId: id,
        surveyId: survey.id,
        quotationId: latestQuote ? latestQuote.id : null,
        name: req.body.projectName || `${projectNumber}: ${lead.name} (${capacityVal} kWp)`,
        capacity: capacityVal,
        capacityUnit: 'kWp',
        systemType: systemTypeVal,
        projectType: req.body.projectType || lead.customerType || 'Residential',
        installationAddress: req.body.address || lead.address || 'Site Roof',
        city: req.body.city || lead.city || 'Pune',
        state: req.body.state || lead.state || 'Maharashtra',
        pincode: req.body.pincode || lead.pincode || '411001',
        currentStage: 'Planning',
        status: 'In Progress',
        progressPercent: 15,
        estimatedValue: estimatedValueVal,
        estimatedCost: estimatedCostVal,
        startDate: new Date(),
        createdBy: userId
      }
    });

    // Run auxiliary initializations concurrently in background (non-blocking)
    const defaultSubsidy = capacityVal >= 3 ? 78000 : capacityVal >= 2 ? 60000 : 30000;
    Promise.allSettled([
      prisma.projectTask.create({
        data: {
          projectId: project.id,
          name: 'Initial Site Survey',
          description: 'Perform site survey and measurements',
          priority: 'High',
          status: 'To Do',
        }
      }),
      prisma.discomApplication.create({
        data: {
          tenantId,
          projectId: project.id,
          status: 'FEASIBILITY_PENDING'
        }
      }),
      prisma.subsidyApplication.create({
        data: {
          tenantId,
          projectId: project.id,
          customerId: customer.id,
          consumerNumber: req.body.consumerNumber || lead.electricityConnection || '410022120526',
          discomName: req.body.discomName || 'MSEDCL',
          proposedCapacity: capacityVal,
          centralSubsidyAmount: defaultSubsidy,
          amount: defaultSubsidy,
          bankName: req.body.bankName || null,
          accountNumber: req.body.accountNumber || null,
          ifscCode: req.body.ifscCode || null,
          accountHolderName: req.body.accountHolderName || lead.name || null,
          status: 'APPLICATION_SUBMITTED',
          portalStage: 'CONSUMER_SELECTION'
        }
      }),
      prisma.projectTimelineEvent.create({
        data: {
          projectId: project.id,
          title: 'Project Created',
          description: `Project auto-created from direct Lead Conversion: ${project.name}`,
          eventType: 'STATUS_UPDATE',
          createdBy: userId
        }
      }),
      prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'STATUS_CHANGE',
          description: `Lead won and converted to Customer & Project: ${project.name}`,
          performedBy: userId
        }
      })
    ]).catch(() => {});

    // Return populated project immediately (< 300ms response time)
    const fullProject = {
      ...project,
      customer,
      lead: updatedLead,
      quotation: latestQuote,
      subsidies: [],
      Document: []
    };

    res.json({ lead: updatedLead, customer, project: fullProject });
  } catch (error) {
    console.error('Lead conversion error:', error);
    res.status(500).json({ error: error.message || 'Failed to convert lead' });
  }
});

// QUOTATIONS
router.get('/api/tenant/leads/:id/quotations', requireTenantAuth, async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      where: { leadId: req.params.id, tenantId: req.user.tenantId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ quotations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

router.post('/api/tenant/leads/:id/quotations', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { items, discount = 0 } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Quotation must have at least one item' });
    }

    let subtotal = 0;
    let taxTotal = 0;
    
    const processedItems = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const lineTax = lineTotal * (item.taxRate / 100);
      subtotal += lineTotal;
      taxTotal += lineTax;
      
      return {
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        total: lineTotal + lineTax
      };
    });
    
    const grandTotal = subtotal + taxTotal - discount;

    const quotation = await prisma.quotation.create({
      data: {
        tenantId: req.user.tenantId,
        leadId: id,
        subtotal,
        taxTotal,
        discount,
        total: grandTotal,
        items: {
          create: processedItems
        }
      },
      include: { items: true }
    });

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: 'QUOTE_SENT',
        description: `Generated a quotation for ₹${grandTotal.toLocaleString()}`,
        performedBy: req.user.id
      }
    });

    res.status(201).json({ quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

router.patch('/api/tenant/quotations/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const quotation = await prisma.quotation.update({
      where: { id, tenantId: req.user.tenantId },
      data: { status }
    });

    if (quotation.leadId) {
       await prisma.leadActivity.create({
         data: {
           leadId: quotation.leadId,
           type: 'STATUS_CHANGE',
           description: `Quotation status updated to ${status}`,
           performedBy: req.user.id
         }
       });
    }

    res.json({ quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update quotation' });
  }
});

// PRODUCTS
router.get('/api/tenant/products', requireTenantAuth, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { category: 'asc' }
    });
    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/api/tenant/products', requireTenantAuth, validate(createProductSchema), async (req, res) => {
  try {
    const { name, category, sku, brand, unit, purchaseCost, sellingPrice, taxRate, minStock, currentStock } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const product = await prisma.product.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        category,
        sku,
        brand,
        unit,
        purchaseCost: purchaseCost || 0,
        sellingPrice: sellingPrice || 0,
        taxRate: taxRate || 0,
        minStock: minStock || 0,
        currentStock: currentStock || 0
      }
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.patch('/api/tenant/products/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await prisma.product.update({
      where: { id, tenantId: req.user.tenantId },
      data: updateData
    });

    res.json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});


// ----------------------------------------------------
// INVENTORY MANAGEMENT API
// ----------------------------------------------------

router.get('/api/tenant/inventory/dashboard', requireTenantAuth, async (req, res) => {
  try {
    const productsCount = await prisma.product.count({ where: { tenantId: req.user.tenantId } });
    const warehousesCount = await prisma.warehouse.count({ where: { tenantId: req.user.tenantId } });
    
    const balances = await prisma.stockBalance.findMany({
      where: { warehouse: { tenantId: req.user.tenantId } }
    });
    
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let reservedStock = 0;
    
    // Low stock involves joining product info, so let's get products
    const products = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      include: { stockBalances: true }
    });
    
    products.forEach(p => {
      const totalPhysical = p.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
      const totalReserved = p.stockBalances.reduce((sum, b) => sum + b.reservedQuantity, 0);
      const avgCost = p.purchaseCost; // simplified valuation for dashboard
      
      totalStockValue += (totalPhysical * avgCost);
      reservedStock += totalReserved;
      
      if (totalPhysical === 0) {
        outOfStockCount++;
      } else if (p.reorderLevel > 0 && totalPhysical <= p.reorderLevel) {
        lowStockCount++;
      }
    });
    
    const pendingReceipts = await prisma.goodsReceipt.count({
      where: { tenantId: req.user.tenantId, status: 'DRAFT' }
    });
    
    res.json({
      totalProducts: productsCount,
      totalStockValue,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      reserved: reservedStock,
      pendingReceipts,
      warehouses: warehousesCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load inventory dashboard' });
  }
});

router.get('/api/tenant/inventory/products', requireTenantAuth, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        stockBalances: {
          include: { warehouse: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const formatted = products.map(p => {
      const totalPhysical = p.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
      const totalReserved = p.stockBalances.reduce((sum, b) => sum + b.reservedQuantity, 0);
      const totalAvailable = p.stockBalances.reduce((sum, b) => sum + b.availableQuantity, 0);
      return {
        ...p,
        totalPhysical,
        totalReserved,
        totalAvailable,
        status: totalPhysical === 0 ? 'Out of Stock' : (p.reorderLevel > 0 && totalPhysical <= p.reorderLevel) ? 'Low Stock' : 'Healthy'
      };
    });
    
    res.json({ products: formatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.post('/api/tenant/inventory/products', requireTenantAuth, validate(createProductSchema), async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: {
        tenantId: req.user.tenantId,
        name: req.body.name,
        sku: req.body.sku,
        category: req.body.category,
        brand: req.body.brand,
        unit: req.body.unit,
        purchaseCost: parseFloat(req.body.purchaseCost || 0),
        sellingPrice: parseFloat(req.body.sellingPrice || 0),
        taxRate: parseFloat(req.body.taxRate || 0),
        minStock: parseInt(req.body.minStock || 0),
        reorderLevel: parseInt(req.body.reorderLevel || 0),
        isSerialized: req.body.isSerialized === true,
        isBatchTracked: req.body.isBatchTracked === true
      }
    });
    res.json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.get('/api/tenant/inventory/warehouses', requireTenantAuth, async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        balances: {
          include: { product: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ warehouses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load warehouses' });
  }
});

router.get('/api/tenant/inventory/stock-ledger', requireTenantAuth, async (req, res) => {
  try {
    const ledger = await prisma.stockLedger.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        product: true,
        warehouse: true
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json({ ledger });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load stock ledger' });
  }
});

router.get('/api/tenant/inventory/serial-numbers', requireTenantAuth, async (req, res) => {
  try {
    const serials = await prisma.serialNumber.findMany({
      where: { product: { tenantId: req.user.tenantId } },
      include: {
        product: true,
        warehouse: true
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json({ serials });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load serial numbers' });
  }
});

// DISPATCH LOGIC
router.post('/api/tenant/inventory/dispatch', requireTenantAuth, async (req, res) => {
  try {
    const { projectId, warehouseId, items, receiverName, notes } = req.body;
    
    // Start transaction for atomic ledger and balance updates
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Dispatch Document
      const count = await tx.materialDispatch.count({ where: { tenantId: req.user.tenantId } });
      const dispatchNumber = `DIS-${(count + 1).toString().padStart(5, '0')}`;
      
      const dispatch = await tx.materialDispatch.create({
        data: {
          tenantId: req.user.tenantId,
          dispatchNumber,
          projectId,
          warehouseId,
          status: 'DISPATCHED',
          receiverName,
          notes,
          items: {
            create: items.map(i => ({
              productId: i.productId,
              quantity: parseFloat(i.quantity),
              serialNumbers: i.serialNumbers || []
            }))
          }
        }
      });
      
      // 2. Process each item
      for (const item of items) {
        const qty = parseFloat(item.quantity);
        
        // 2a. Update StockBalance
        const balance = await tx.stockBalance.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId } }
        });
        
        if (!balance || balance.availableQuantity < qty) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
        
        const newBalance = await tx.stockBalance.update({
          where: { id: balance.id },
          data: {
            quantity: { decrement: qty },
            availableQuantity: { decrement: qty }
          }
        });
        
        // 2b. Add StockLedger entry
        await tx.stockLedger.create({
          data: {
            tenantId: req.user.tenantId,
            productId: item.productId,
            warehouseId,
            movementType: 'DISPATCH',
            quantity: -qty, // Negative for dispatch
            quantityBefore: balance.quantity,
            quantityAfter: newBalance.quantity,
            referenceType: 'DISPATCH',
            referenceId: dispatch.id,
            userId: req.user.id
          }
        });
        
        // 2c. Update Serial Numbers if provided
        if (item.serialNumbers && item.serialNumbers.length > 0) {
          await tx.serialNumber.updateMany({
            where: {
              productId: item.productId,
              serialNumber: { in: item.serialNumbers },
              warehouseId
            },
            data: {
              status: 'INSTALLED',
              projectId,
              warehouseId: null // It left the warehouse
            }
          });
        }
      }
      
      return dispatch;
    });
    
    res.json({ dispatch: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to dispatch material' });
  }
});

// GOODS RECEIPT LOGIC
router.post('/api/tenant/inventory/receipt', requireTenantAuth, async (req, res) => {
  try {
    const { warehouseId, purchaseOrderId, vendor, items } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create GRN
      const count = await tx.goodsReceipt.count({ where: { tenantId: req.user.tenantId } });
      const grnNumber = `GRN-${(count + 1).toString().padStart(5, '0')}`;
      
      const receipt = await tx.goodsReceipt.create({
        data: {
          tenantId: req.user.tenantId,
          grnNumber,
          warehouseId,
          purchaseOrderId,
          vendor,
          status: 'APPROVED',
          items: {
            create: items.map(i => ({
              productId: i.productId,
              receivedQty: parseFloat(i.quantity),
              acceptedQty: parseFloat(i.quantity),
              unitCost: parseFloat(i.unitCost || 0),
              totalCost: parseFloat(i.quantity) * parseFloat(i.unitCost || 0)
            }))
          }
        }
      });
      
      // 2. Process each item
      for (const item of items) {
        const qty = parseFloat(item.quantity);
        const unitCost = parseFloat(item.unitCost || 0);
        
        // 2a. Upsert StockBalance
        const balance = await tx.stockBalance.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId } }
        });
        
        let newQuantity = qty;
        let avgCost = unitCost;
        
        if (balance) {
          newQuantity = balance.quantity + qty;
          // Weighted Average Cost
          const currentTotalValue = balance.quantity * balance.averageCost;
          const newTotalValue = qty * unitCost;
          avgCost = newQuantity > 0 ? (currentTotalValue + newTotalValue) / newQuantity : 0;
          
          await tx.stockBalance.update({
            where: { id: balance.id },
            data: {
              quantity: { increment: qty },
              availableQuantity: { increment: qty },
              averageCost: avgCost
            }
          });
        } else {
          await tx.stockBalance.create({
            data: {
              productId: item.productId,
              warehouseId,
              quantity: qty,
              availableQuantity: qty,
              averageCost: avgCost
            }
          });
        }
        
        // 2b. Add StockLedger entry
        await tx.stockLedger.create({
          data: {
            tenantId: req.user.tenantId,
            productId: item.productId,
            warehouseId,
            movementType: 'RECEIPT',
            quantity: qty, // Positive for receipt
            quantityBefore: balance ? balance.quantity : 0,
            quantityAfter: newQuantity,
            referenceType: 'RECEIPT',
            referenceId: receipt.id,
            userId: req.user.id
          }
        });
        
        // 2c. Insert Serial Numbers if provided
        if (item.serialNumbers && item.serialNumbers.length > 0) {
          const serialsToInsert = item.serialNumbers.map(sn => ({
            productId: item.productId,
            warehouseId,
            serialNumber: sn,
            status: 'AVAILABLE'
          }));
          await tx.serialNumber.createMany({ data: serialsToInsert, skipDuplicates: true });
        }
      }
      
      return receipt;
    });
    
    res.json({ receipt: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to receive goods' });
  }
});



// PROJECTS
router.get('/api/tenant/projects', requireTenantAuth, async (req, res) => {
  try {
    const { stage, status, search } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (stage && stage !== 'ALL') where.currentStage = stage;
    if (status && status !== 'ALL') where.status = status;

    if (search) {
      where.OR = [
        { projectNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { quotation: { qNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, mobile: true, email: true, city: true, address: true }
        },
        lead: {
          select: { id: true, name: true, mobile: true, email: true, city: true, state: true }
        },
        quotation: {
          select: { id: true, qNumber: true, total: true, systemCapacity: true, status: true, version: true }
        },
        projectOwner: {
          select: { id: true, name: true, email: true }
        },
        discomApplication: true,
        subsidies: true,
        Document: {
          select: { id: true, title: true, fileUrl: true, fileType: true, category: true, status: true, createdAt: true }
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
            materialReqs: true
          }
        }
      }
    });

    // Compute comprehensive operational metrics
    const allTenantProjects = await prisma.project.findMany({
      where: { tenantId: req.user.tenantId },
      select: { currentStage: true, status: true, capacity: true, estimatedValue: true, estimatedCost: true, actualCost: true }
    });

    const metrics = {
      total: allTenantProjects.length,
      planning: allTenantProjects.filter(p => p.currentStage === 'Planning').length,
      design: allTenantProjects.filter(p => p.currentStage === 'Design').length,
      procurement: allTenantProjects.filter(p => p.currentStage === 'Procurement').length,
      installation: allTenantProjects.filter(p => p.currentStage === 'Installation').length,
      testing: allTenantProjects.filter(p => p.currentStage === 'Testing').length,
      handover: allTenantProjects.filter(p => p.currentStage === 'Handover').length,
      completed: allTenantProjects.filter(p => p.currentStage === 'Completed').length,
      inProgress: allTenantProjects.filter(p => ['Planning', 'Design', 'Procurement', 'Installation', 'Testing'].includes(p.currentStage) && p.status !== 'Delayed').length,
      delayed: allTenantProjects.filter(p => p.status === 'Delayed').length,
      totalCapacity: Math.round(allTenantProjects.reduce((acc, p) => acc + (p.capacity || 0), 0) * 10) / 10,
      totalValue: allTenantProjects.reduce((acc, p) => acc + (p.estimatedValue || 0), 0),
      totalCost: allTenantProjects.reduce((acc, p) => acc + (p.actualCost || 0), 0),
      expectedProfit: allTenantProjects.reduce((acc, p) => acc + ((p.estimatedValue || 0) - (p.estimatedCost || 0)), 0),
    };

    res.json({ projects, metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/api/tenant/projects', requireTenantAuth, async (req, res) => {
  try {
    let { 
      name, customerId, leadId, quotationId, surveyId, capacity, 
      systemType, projectType, projectOwnerId, installationAddress, 
      city, state, pincode, startDate, expectedCompletionDate, 
      priority, estimatedValue, estimatedCost 
    } = req.body;
    
    // Auto-fill from Quotation if linked
    if (quotationId) {
      const quote = await prisma.quotation.findFirst({
        where: { id: quotationId, tenantId: req.user.tenantId },
        include: { customer: true, lead: true, items: true }
      });
      if (quote) {
        if (!customerId && quote.customerId) customerId = quote.customerId;
        if (!leadId && quote.leadId) leadId = quote.leadId;
        if (!capacity && quote.systemCapacity) capacity = quote.systemCapacity;
        if (!systemType && quote.systemType) systemType = quote.systemType;
        if (!estimatedValue && quote.total) estimatedValue = quote.total;
        if (!estimatedCost && quote.subtotal) estimatedCost = Math.round(quote.subtotal * 0.75); // Standard 25% margin estimate
        if (!name) {
          const clientName = quote.customer?.name || quote.lead?.name || 'Solar Customer';
          name = `${clientName} - ${quote.systemCapacity || 5} kWp ${quote.systemType || 'On-Grid'} Solar`;
        }
        
        // Auto-lock and accept quotation
        await prisma.quotation.update({
          where: { id: quote.id },
          data: { status: 'ACCEPTED', isLocked: true }
        });
      } else {
        quotationId = null;
      }
    } else {
      quotationId = null;
    }

    // Defensive Foreign Key Validations to prevent P2003 constraint failures
    if (customerId) {
      const custExists = await prisma.customer.findFirst({ where: { id: customerId, tenantId: req.user.tenantId } });
      if (!custExists) customerId = null;
    } else {
      customerId = null;
    }

    if (leadId) {
      const leadExists = await prisma.lead.findFirst({ where: { id: leadId, tenantId: req.user.tenantId } });
      if (!leadExists) leadId = null;
    } else {
      leadId = null;
    }

    if (surveyId) {
      const surveyExists = await prisma.siteSurvey.findFirst({ where: { id: surveyId, tenantId: req.user.tenantId } });
      if (!surveyExists) surveyId = null;
    } else {
      surveyId = null;
    }

    if (projectOwnerId) {
      const ownerExists = await prisma.user.findFirst({ where: { id: projectOwnerId, tenantId: req.user.tenantId } });
      if (!ownerExists) projectOwnerId = null;
    } else {
      projectOwnerId = null;
    }

    // Generate clean unique project number
    const count = await prisma.project.count({ where: { tenantId: req.user.tenantId } });
    let projectNumber = `PRJ-${(count + 1).toString().padStart(5, '0')}`;
    const existingNum = await prisma.project.findFirst({ where: { tenantId: req.user.tenantId, projectNumber } });
    if (existingNum) {
      projectNumber = `PRJ-${Date.now().toString().slice(-5)}`;
    }

    const validStartDate = startDate && !isNaN(new Date(startDate).getTime()) 
      ? new Date(startDate) 
      : new Date();
    const validEndDate = expectedCompletionDate && !isNaN(new Date(expectedCompletionDate).getTime()) 
      ? new Date(expectedCompletionDate) 
      : null;

    const project = await prisma.project.create({
      data: {
        tenantId: req.user.tenantId,
        projectNumber,
        name: name || `Solar Project ${projectNumber}`,
        customerId: customerId || null,
        leadId: leadId || null,
        quotationId: quotationId || null,
        surveyId: surveyId || null,
        capacity: parseFloat(capacity) > 0 ? parseFloat(capacity) : 5.0,
        capacityUnit: 'kWp',
        systemType: systemType || 'On-Grid',
        projectType: projectType || 'Residential',
        projectOwnerId: projectOwnerId || null,
        installationAddress: installationAddress || '',
        city: city || 'Pune',
        state: state || 'Maharashtra',
        pincode: pincode || '411001',
        startDate: validStartDate,
        expectedCompletionDate: validEndDate,
        priority: priority || 'Medium',
        estimatedValue: parseFloat(estimatedValue) >= 0 ? parseFloat(estimatedValue) : 0,
        estimatedCost: parseFloat(estimatedCost) >= 0 ? parseFloat(estimatedCost) : 0,
        progressPercent: 15,
        currentStage: 'Planning',
        status: 'In Progress',
        createdBy: req.user.id
      }
    });

    // Initial Stage History & Timeline Events
    await prisma.projectStageHistory.create({
      data: {
        projectId: project.id,
        newStage: 'Planning',
        changedBy: req.user.id,
        comment: quotationId ? 'Project provisioned from accepted quotation' : 'Project Created'
      }
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: project.id,
        title: 'Project Initialized',
        description: `Project ${projectNumber} created with capacity ${project.capacity} kWp`,
        eventType: 'CREATION',
        createdBy: req.user.id
      }
    });

    // Auto-create initial Site Survey Task
    try {
      await prisma.projectTask.create({
        data: {
          projectId: project.id,
          name: 'Conduct Detailed Engineering Roof Survey',
          description: 'Verify roof shadow patterns, azimuth angle, structure anchor points, and net metering cable runs.',
          priority: 'High',
          status: 'Pending',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // +3 days
        }
      });
    } catch (e) {
      console.warn('Site survey task creation skipped:', e.message);
    }

    // Auto-initialize DISCOM Tracking if customer assigned
    if (project.customerId) {
      try {
        const existingDiscom = await prisma.discomApplication.findUnique({
          where: { projectId: project.id }
        });
        if (!existingDiscom) {
          await prisma.discomApplication.create({
            data: {
              tenantId: req.user.tenantId,
              projectId: project.id,
              status: 'FEASIBILITY_PENDING'
            }
          });
        }
      } catch (e) {
        console.warn('DISCOM tracking creation skipped:', e.message);
      }
    }

    res.status(201).json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project: ' + error.message });
  }
});

router.get('/api/tenant/projects/:id', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        tenant: true,
        customer: true,
        lead: true,
        quotation: { 
          include: { 
            items: { include: { product: true } }
          } 
        },
        projectOwner: true,
        tasks: { include: { assignee: true }, orderBy: { createdAt: 'asc' } },
        milestones: { orderBy: { targetDate: 'asc' } },
        materialReqs: { include: { product: true }, orderBy: { createdAt: 'asc' } },
        costs: true,
        stageHistory: { orderBy: { createdAt: 'desc' } },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
        statusUpdates: { orderBy: { createdAt: 'desc' } },
        discomApplication: true,
        subsidies: true,
        amcs: true,
        InstallationJob: true,
        Document: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

router.patch('/api/tenant/projects/:id', requireTenantAuth, async (req, res) => {
  try {
    const updateData = req.body;
    
    // Prevent changing stage or status via this generic endpoint
    delete updateData.currentStage;
    delete updateData.status;

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.expectedCompletionDate) updateData.expectedCompletionDate = new Date(updateData.expectedCompletionDate);
    if (updateData.actualCompletionDate) updateData.actualCompletionDate = new Date(updateData.actualCompletionDate);
    
    if (updateData.capacity) updateData.capacity = parseFloat(updateData.capacity);
    if (updateData.estimatedValue) updateData.estimatedValue = parseFloat(updateData.estimatedValue);
    if (updateData.estimatedCost) updateData.estimatedCost = parseFloat(updateData.estimatedCost);
    if (updateData.actualCost) updateData.actualCost = parseFloat(updateData.actualCost);
    if (updateData.progressPercent) updateData.progressPercent = parseFloat(updateData.progressPercent);

    const project = await prisma.project.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData
    });
    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.patch('/api/tenant/projects/:id/stage', requireTenantAuth, async (req, res) => {
  try {
    const { newStage, comment } = req.body;
    const project = await prisma.project.findUnique({ where: { id: req.params.id, tenantId: req.user.tenantId } });
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.currentStage === newStage) return res.status(400).json({ error: 'Already in this stage' });

    const STAGE_PROGRESS = {
      'Planning': 15,
      'Design': 30,
      'Procurement': 50,
      'Installation': 75,
      'Testing': 90,
      'Handover': 95,
      'Completed': 100
    };
    const progressPercent = STAGE_PROGRESS[newStage] !== undefined ? STAGE_PROGRESS[newStage] : (project.progressPercent || 0);

    const updateData = {
      currentStage: newStage,
      progressPercent
    };
    if (newStage === 'Completed') {
      updateData.status = 'Completed';
      updateData.actualCompletionDate = new Date();
    }

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData
    });

    await prisma.projectStageHistory.create({
      data: {
        projectId: project.id,
        previousStage: project.currentStage,
        newStage,
        changedBy: req.user.id,
        comment
      }
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: project.id,
        title: `Stage Changed to ${newStage}`,
        description: comment,
        eventType: 'STAGE_CHANGE',
        createdBy: req.user.id
      }
    });

    // Phase 2 Sync: Material Procurement Sync
    if (newStage === 'Procurement') {
      await prisma.projectMaterialRequirement.updateMany({
        where: { projectId: project.id, tenantId: req.user.tenantId },
        data: { status: 'Required' }
      });

      // Phase 7 Sync: Auto-draft Purchase Order
      const reqs = await prisma.projectMaterialRequirement.findMany({
        where: { projectId: project.id, tenantId: req.user.tenantId, productId: { not: null } }
      });

      if (reqs.length > 0) {
        await prisma.purchaseOrder.create({
          data: {
            tenantId: req.user.tenantId,
            projectId: project.id,
            poNumber: `PO-${Date.now()}`,
            vendor: 'Pending Assignment',
            status: 'DRAFT',
            items: {
              create: reqs.map(r => ({
                productId: r.productId,
                quantity: Math.ceil(r.quantity),
                unitPrice: 0 // To be filled by purchasing manager
              }))
            }
          }
        });
      }
    }

    // Phase 3 Sync: Auto-create AMC on Completion
    if (newStage === 'Completed') {
      const existingAmc = await prisma.aMC.findFirst({
        where: { projectId: project.id, tenantId: req.user.tenantId }
      });

      if (!existingAmc && project.customerId) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 5); // Default 5 years

        await prisma.aMC.create({
          data: {
            tenantId: req.user.tenantId,
            projectId: project.id,
            customerId: project.customerId,
            contractNumber: `AMC-${project.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
            startDate,
            endDate,
            value: 0,
            status: 'ACTIVE'
          }
        });
      }

      // Phase 6 Sync: Auto-create Invoice on Completion
      const existingInvoice = await prisma.invoice.findFirst({
        where: { projectId: project.id, tenantId: req.user.tenantId }
      });

      if (!existingInvoice && project.customerId) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

        await prisma.invoice.create({
          data: {
            tenantId: req.user.tenantId,
            customerId: project.customerId,
            projectId: project.id,
            invoiceNumber: `INV-${Date.now()}`,
            amount: project.estimatedValue || 0,
            dueDate,
            status: 'UNPAID'
          }
        });
      }

      // Phase 10 Sync: Auto-create Completion Certificate
      const existingCert = await prisma.completionCertificate.findFirst({
        where: { projectId: project.id, tenantId: req.user.tenantId }
      });

      if (!existingCert && project.customerId) {
        const customer = await prisma.customer.findUnique({ where: { id: project.customerId } });
        const installation = await prisma.installationJob.findFirst({ where: { projectId: project.id } });
        
        await prisma.completionCertificate.create({
          data: {
            tenantId: req.user.tenantId,
            projectId: project.id,
            installationId: installation ? installation.id : 'N/A',
            certificateNo: `CC-${project.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
            customerName: customer ? customer.name : 'Unknown',
            systemCapacity: project.capacity ? `${project.capacity} ${project.capacityUnit || 'kW'}` : null,
            issuedBy: req.user.id
          }
        });
      }
    }

    res.json({ project: updatedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

router.patch('/api/tenant/projects/:id/status', requireTenantAuth, async (req, res) => {
  try {
    const { status, progress, updateText, nextAction } = req.body;
    
    const project = await prisma.project.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { 
        status, 
        ...(progress !== undefined && { progressPercent: parseFloat(progress) }) 
      }
    });

    const statusUpdate = await prisma.projectStatusUpdate.create({
      data: {
        projectId: project.id,
        status,
        progress: progress ? parseFloat(progress) : null,
        updateText,
        nextAction,
        updatedBy: req.user.id
      }
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: project.id,
        title: `Status Updated to ${status}`,
        description: updateText,
        eventType: 'STATUS_UPDATE',
        createdBy: req.user.id
      }
    });

    res.json({ project, statusUpdate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.delete('/api/tenant/projects/:id', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Safe transactional cleanup of children
    await prisma.$transaction([
      prisma.projectStageHistory.deleteMany({ where: { projectId: project.id } }),
      prisma.projectTimelineEvent.deleteMany({ where: { projectId: project.id } }),
      prisma.projectStatusUpdate.deleteMany({ where: { projectId: project.id } }),
      prisma.projectTask.deleteMany({ where: { projectId: project.id } }),
      prisma.projectMilestone.deleteMany({ where: { projectId: project.id } }),
      prisma.projectMaterialRequirement.deleteMany({ where: { projectId: project.id } }),
      prisma.projectCost.deleteMany({ where: { projectId: project.id } }),
      prisma.project.delete({ where: { id: project.id } })
    ]);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project: ' + error.message });
  }
});

// TASKS
router.post('/api/tenant/projects/:id/tasks', requireTenantAuth, async (req, res) => {
  try {
    const { name, description, priority, dueDate, assigneeId } = req.body;
    
    const task = await prisma.projectTask.create({
      data: {
        projectId: req.params.id,
        name,
        description,
        priority: priority || 'Medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId
      },
      include: { assignee: true }
    });
    
    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.patch('/api/tenant/tasks/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, progress } = req.body;
    const task = await prisma.projectTask.update({
      where: { id: req.params.id },
      data: { 
        status, 
        ...(progress !== undefined && { progress: parseFloat(progress) })
      },
      include: { assignee: true }
    });
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// MILESTONES
router.post('/api/tenant/projects/:id/milestones', requireTenantAuth, async (req, res) => {
  try {
    const { name, description, targetDate, responsibleId } = req.body;
    
    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId: req.params.id,
        name,
        description,
        targetDate: targetDate ? new Date(targetDate) : null,
        responsibleId
      }
    });
    
    res.status(201).json({ milestone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

router.patch('/api/tenant/milestones/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, actualDate } = req.body;
    const milestone = await prisma.projectMilestone.update({
      where: { id: req.params.id },
      data: { 
        status,
        actualDate: actualDate ? new Date(actualDate) : null
      }
    });
    res.json({ milestone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// MATERIAL REQS
router.post('/api/tenant/projects/:id/materials', requireTenantAuth, async (req, res) => {
  try {
    const { productId, description, quantity } = req.body;
    
    const material = await prisma.projectMaterialRequirement.create({
      data: {
        projectId: req.params.id,
        productId: productId || null,
        description,
        quantity: parseFloat(quantity) || 1
      },
      include: { product: true }
    });
    
    res.status(201).json({ material });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add material requirement' });
  }
});

router.patch('/api/tenant/materials/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, quantity } = req.body;
    const material = await prisma.projectMaterialRequirement.update({
      where: { id: req.params.id },
      data: { 
        ...(status && { status }),
        ...(quantity && { quantity: parseFloat(quantity) })
      },
      include: { product: true }
    });
    res.json({ material });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update material requirement' });
  }
});


// CUSTOMERS
router.get(['/api/tenant/customers', '/api/tenant/crm/customers'], requireTenantAuth, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        lead: true,
        projects: { select: { id: true, name: true, status: true, capacity: true, estimatedValue: true, currentStage: true } },
        quotations: { select: { id: true, qNumber: true, total: true, status: true } },
        invoices: { select: { id: true, invoiceNumber: true, amount: true, status: true } },
        amcs: { select: { id: true, contractNumber: true, status: true } },
        tickets: { select: { id: true, subject: true, status: true } }
      }
    });
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/api/tenant/customers/:id', requireTenantAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { 
        lead: {
          include: {
            activities: { orderBy: { createdAt: 'desc' } },
            followUps: { orderBy: { scheduledAt: 'asc' } },
            notes: { orderBy: { createdAt: 'desc' } }
          }
        },
        surveys: true,
        quotations: true,
        projects: true,
        invoices: true,
        tickets: true
      }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

// ----------------------------------------------------
module.exports = router;