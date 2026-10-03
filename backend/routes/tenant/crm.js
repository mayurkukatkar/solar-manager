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
    const { source, status, assigneeId, search } = req.query;
    let where = { tenantId: req.user.tenantId };
    if (source) where.source = source;
    if (status) {
      where.status = status;
    } else {
      where.status = { notIn: ['WON', 'LOST'] }; // Default to active leads only
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
      include: { assignee: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ leads });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
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
    const { mobile, email, forceCreate, ...rest } = req.body;
    
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
    
    if (duplicate && !forceCreate) {
      return res.status(409).json({ error: 'Duplicate lead found', duplicate });
    }
    
    const lead = await prisma.lead.create({
      data: {
        ...rest,
        mobile,
        email,
        tenantId: req.user.tenantId
      }
    });
    
    // Log Activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'STATUS_CHANGE',
        description: 'Lead created',
        performedBy: req.user.id
      }
    });
    
    res.json({ lead });
  } catch (error) {
    console.error(error);
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

    const lead = await prisma.lead.findUnique({ where: { id, tenantId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Mark Lead as WON
    const updatedLead = await prisma.lead.update({
      where: { id, tenantId },
      data: { status: 'WON' }
    });

    // Get or Create Customer
    let customer = await prisma.customer.findFirst({ where: { leadId: id, tenantId } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId,
          leadId: id,
          name: lead.name,
          email: lead.email,
          mobile: lead.mobile,
          company: lead.company,
          address: lead.address,
          city: lead.city,
        }
      });
    }

    const project = await prisma.project.create({
      data: {
        tenantId,
        customerId: customer.id,
        leadId: id,
        name: req.body.projectName || `${lead.name} Project`,
        status: 'PLANNING'
      }
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'STATUS_CHANGE',
        description: `Lead won and converted to Customer & Project: ${project.name}`,
        performedBy: req.user.id
      }
    });

    res.json({ lead: updatedLead, customer, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to convert lead' });
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
    const projects = await prisma.project.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        projectOwner: true
      }
    });

    const metrics = {
      total: projects.length,
      planning: projects.filter(p => p.currentStage === 'Planning').length,
      inProgress: projects.filter(p => ['Design', 'Procurement', 'Installation', 'Testing'].includes(p.currentStage) && p.status !== 'Delayed').length,
      delayed: projects.filter(p => p.status === 'Delayed').length,
      completed: projects.filter(p => p.currentStage === 'Completed').length,
      totalValue: projects.reduce((acc, p) => acc + (p.estimatedValue || 0), 0),
      totalCost: projects.reduce((acc, p) => acc + (p.actualCost || 0), 0),
      expectedProfit: projects.reduce((acc, p) => acc + ((p.estimatedValue || 0) - (p.estimatedCost || 0)), 0),
    };

    res.json({ projects, metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/api/tenant/projects', requireTenantAuth, async (req, res) => {
  try {
    const { name, customerId, leadId, quotationId, surveyId, capacity, systemType, projectType, projectOwnerId, installationAddress, city, state, pincode, startDate, expectedCompletionDate, priority, estimatedValue, estimatedCost } = req.body;
    
    // Generate simple project number
    const count = await prisma.project.count({ where: { tenantId: req.user.tenantId } });
    const projectNumber = `PRJ-${(count + 1).toString().padStart(5, '0')}`;

    const project = await prisma.project.create({
      data: {
        tenantId: req.user.tenantId,
        projectNumber,
        name,
        customerId,
        leadId,
        quotationId,
        surveyId,
        capacity: parseFloat(capacity) || null,
        systemType,
        projectType,
        projectOwnerId,
        installationAddress,
        city,
        state,
        pincode,
        startDate: startDate ? new Date(startDate) : null,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
        priority: priority || 'Medium',
        estimatedValue: parseFloat(estimatedValue) || 0,
        estimatedCost: parseFloat(estimatedCost) || 0,
        createdBy: req.user.id
      }
    });

    // Initial Stage History
    await prisma.projectStageHistory.create({
      data: {
        projectId: project.id,
        newStage: 'Planning',
        changedBy: req.user.id,
        comment: 'Project Created'
      }
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/api/tenant/projects/:id', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        customer: true,
        lead: true,
        quotation: { include: { items: { include: { product: true } } } },
        projectOwner: true,
        tasks: { include: { assignee: true }, orderBy: { createdAt: 'asc' } },
        milestones: { orderBy: { targetDate: 'asc' } },
        materialReqs: { include: { product: true }, orderBy: { createdAt: 'asc' } },
        costs: true,
        stageHistory: { orderBy: { createdAt: 'desc' } },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
        statusUpdates: { orderBy: { createdAt: 'desc' } }
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

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: { currentStage: newStage }
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
router.get('/api/tenant/customers', requireTenantAuth, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: { lead: true }
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