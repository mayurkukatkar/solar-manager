const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// ----------------------------------------------------
// PROCUREMENT & PURCHASE ORDERS (TENANT)
// ----------------------------------------------------

// GET /api/tenant/procurement
// List all purchase orders with items and summary metrics
router.get('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const { status, supplier, search, projectId } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (status && status !== 'ALL') where.status = status;
    if (supplier) where.vendor = { contains: supplier, mode: 'insensitive' };
    if (projectId) where.projectId = projectId;
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } }
      ];
    }

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, brand: true, category: true, unit: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate metrics
    const allPos = await prisma.purchaseOrder.findMany({
      where: { tenantId: req.user.tenantId },
      include: { items: true }
    });

    const metrics = {
      totalOrders: allPos.length,
      activeOrders: allPos.filter(p => p.status === 'ORDERED' || p.status === 'SHIPPED').length,
      receivedValue: allPos
        .filter(p => p.status === 'RECEIVED' || p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.items.reduce((iSum, item) => iSum + (item.total || 0), 0), 0),
      pendingOrders: allPos.filter(p => p.status === 'ORDERED').length
    };

    // Format for frontend
    const formatted = pos.map(p => {
      const totalAmount = p.items.reduce((sum, i) => sum + (i.total || 0), 0);
      return {
        id: p.id,
        poNumber: p.poNumber,
        supplier: p.vendor,
        vendor: p.vendor,
        status: p.status,
        totalCost: totalAmount,
        createdAt: p.createdAt || p.date,
        project: p.project,
        items: p.items,
        itemSummary: p.items.map(i => `${i.product?.name || 'Item'} (${i.quantity} ${i.product?.unit || 'Nos'})`).join(', ')
      };
    });

    res.json({ procurement: formatted, purchaseOrders: formatted, metrics });
  } catch (error) {
    console.error('Error fetching procurement POs:', error);
    res.status(500).json({ error: 'Failed to fetch Purchase Orders' });
  }
});

// Alias for backwards-compatibility
router.get('/api/tenant/procurement/pos', requireTenantAuth, async (req, res) => {
  const where = { tenantId: req.user.tenantId };
  if (req.query.projectId) where.projectId = req.query.projectId;

  const pos = await prisma.purchaseOrder.findMany({
    where,
    include: {
      project: true,
      items: { include: { product: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ purchaseOrders: pos });
});

// GET /api/tenant/procurement/:id
// Detailed view of a single PO
router.get('/api/tenant/procurement/:id', requireTenantAuth, async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        project: true,
        items: { include: { product: true } }
      }
    });

    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });
    const totalAmount = po.items.reduce((sum, i) => sum + (i.total || 0), 0);
    res.json({ purchaseOrder: { ...po, supplier: po.vendor, totalCost: totalAmount } });
  } catch (error) {
    console.error('Error fetching single PO:', error);
    res.status(500).json({ error: 'Failed to fetch Purchase Order detail' });
  }
});

// POST /api/tenant/procurement
// Create new purchase order
router.post('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const { supplier, vendor, productId, qty, unitCost, projectId, notes, items } = req.body;
    const vendorName = (supplier || vendor || '').trim();

    if (!vendorName) {
      return res.status(400).json({ error: 'Supplier/Vendor name is required' });
    }

    // Generate unique PO Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-${dateStr}-${randSuffix}`;

    // Normalize items list
    let poItemsData = [];
    let calculatedTotal = 0;

    if (Array.isArray(items) && items.length > 0) {
      poItemsData = items.map(item => {
        const itemQty = Math.max(1, Math.round(parseFloat(item.qty || item.quantity) || 1));
        const itemCost = parseFloat(item.unitCost || item.unitPrice || item.cost) || 0;
        const total = itemQty * itemCost;
        calculatedTotal += total;
        return {
          productId: item.productId,
          quantity: itemQty,
          unitPrice: itemCost,
          total: total
        };
      });
    } else if (productId) {
      const parsedQty = Math.max(1, Math.round(parseFloat(qty) || 1));
      let cost = parseFloat(unitCost);

      if (!cost) {
        const prod = await prisma.product.findUnique({ where: { id: productId } });
        cost = prod?.purchaseCost || 0;
      }

      const total = parsedQty * cost;
      calculatedTotal = total;
      poItemsData.push({
        productId,
        quantity: parsedQty,
        unitPrice: cost,
        total: total
      });
    } else {
      return res.status(400).json({ error: 'At least one product item is required' });
    }

    const newPO = await prisma.purchaseOrder.create({
      data: {
        tenantId: req.user.tenantId,
        poNumber,
        vendor: vendorName,
        projectId: projectId || null,
        status: 'ORDERED',
        date: new Date(),
        items: {
          create: poItemsData
        }
      },
      include: {
        items: { include: { product: true } },
        project: true
      }
    });

    // Record audit log entry
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        tenantId: req.user.tenantId,
        action: 'CREATE_PURCHASE_ORDER',
        entity: 'PurchaseOrder',
        entityId: newPO.id,
        details: { poNumber: newPO.poNumber, vendor: newPO.vendor, totalAmount: calculatedTotal },
        ipAddress: req.ip || '127.0.0.1'
      }
    }).catch(() => null);

    res.status(201).json({
      message: 'Purchase Order created successfully',
      purchaseOrder: {
        ...newPO,
        supplier: newPO.vendor,
        totalCost: calculatedTotal
      }
    });
  } catch (error) {
    console.error('Error creating Purchase Order:', error);
    res.status(500).json({ error: error.message || 'Failed to create Purchase Order' });
  }
});

// PATCH /api/tenant/procurement/:id/status
// Update status (ORDERED -> SHIPPED -> RECEIVED -> CANCELLED)
// If marked RECEIVED, automatically restocks warehouse inventory!
router.patch('/api/tenant/procurement/:id/status', requireTenantAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = ['ORDERED', 'SHIPPED', 'RECEIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const existingPO = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: req.user.tenantId },
      include: { items: { include: { product: true } } }
    });

    if (!existingPO) return res.status(404).json({ error: 'Purchase Order not found' });

    // If transitioning to RECEIVED for the first time, increment stock & record goods receipt
    if (status === 'RECEIVED' && existingPO.status !== 'RECEIVED') {
      let warehouse = await prisma.warehouse.findFirst({
        where: { tenantId: req.user.tenantId }
      });
      if (!warehouse) {
        try {
          warehouse = await prisma.warehouse.create({
            data: {
              tenantId: req.user.tenantId,
              name: 'Main Central Hub',
              location: 'Headquarters'
            }
          });
        } catch (e) {
          // ignore
        }
      }

      for (const item of existingPO.items) {
        // Increment product stock
        await prisma.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: Math.round(item.quantity) } }
        }).catch(err => console.warn('Product stock increment error:', err));

        // Update received quantity
        await prisma.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: item.quantity }
        }).catch(err => console.warn('PO item receivedQty update error:', err));

        // Record stock ledger entry
        if (warehouse) {
          await prisma.stockLedger.create({
            data: {
              tenantId: req.user.tenantId,
              warehouseId: warehouse.id,
              productId: item.productId,
              movementType: 'RECEIPT',
              quantity: item.quantity,
              quantityBefore: item.product?.currentStock || 0,
              quantityAfter: (item.product?.currentStock || 0) + item.quantity,
              referenceType: 'PO',
              referenceId: existingPO.id,
              notes: `Received from PO: ${existingPO.poNumber} (${existingPO.vendor})`
            }
          }).catch(err => console.warn('Stock ledger entry error:', err));
        }
      }
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } } }
    });

    // Record audit log entry
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        tenantId: req.user.tenantId,
        action: 'UPDATE_PO_STATUS',
        entity: 'PurchaseOrder',
        entityId: id,
        details: { poNumber: updated.poNumber, oldStatus: existingPO.status, newStatus: status },
        ipAddress: req.ip || '127.0.0.1'
      }
    }).catch(() => null);

    res.json({ message: `Purchase Order marked as ${status}`, purchaseOrder: updated });
  } catch (error) {
    console.error('Error updating PO status:', error);
    res.status(500).json({ error: 'Failed to update Purchase Order status' });
  }
});

// DELETE /api/tenant/procurement/:id
router.delete('/api/tenant/procurement/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });
    if (po.status === 'RECEIVED') {
      return res.status(400).json({ error: 'Cannot delete a Purchase Order that has already been received into inventory' });
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    res.json({ message: 'Purchase Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting PO:', error);
    res.status(500).json({ error: 'Failed to delete Purchase Order' });
  }
});

module.exports = router;
