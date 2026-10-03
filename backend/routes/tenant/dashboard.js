const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT ADMIN - DASHBOARD KPIs
// ----------------------------------------------------
router.get('/api/tenant/dashboard', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const totalLeads = await prisma.lead.count({ where: { tenantId } });
    const totalProjects = await prisma.project.count({ where: { tenantId } });
    const wonLeads = await prisma.lead.count({ where: { tenantId, status: 'WON' } });
    
    res.json({ totalLeads, totalProjects, totalCustomers: wonLeads });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tenant dashboard' });
  }
});

module.exports = router;