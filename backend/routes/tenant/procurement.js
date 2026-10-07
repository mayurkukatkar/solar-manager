const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// GET /api/tenant/procurement/pos
// List all purchase orders
router.get('/api/tenant/procurement/pos', requireTenantAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (projectId) where.projectId = projectId;

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: {
        project: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ purchaseOrders: pos });
  } catch (error) {
    console.error('Error fetching POs:', error);
    res.status(500).json({ error: 'Failed to fetch Purchase Orders' });
  }
});

module.exports = router;
