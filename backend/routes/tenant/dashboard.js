const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT DASHBOARD - ROLE-AWARE & RBAC-SECURED METRICS
// ----------------------------------------------------
router.get('/api/tenant/dashboard', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const isTenantAdmin = req.user.role === 'TENANT_ADMIN' || req.user.role === 'SUPER_ADMIN';

    let userPerms = [];
    if (isTenantAdmin) {
      userPerms = ['*'];
    } else {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId || req.user.id },
        select: { permissions: true }
      });
      if (Array.isArray(user?.permissions)) userPerms = user.permissions;
      else if (user?.permissions?.modules && Array.isArray(user.permissions.modules)) userPerms = user.permissions.modules;
    }

    const hasFinanceAccess = isTenantAdmin || userPerms.includes('finance') || userPerms.includes('*');

    // Operational metrics (Safe for all team members)
    const [
      totalLeads,
      totalProjects,
      totalCustomers,
      openSurveys,
      openTickets,
      projectsList
    ] = await Promise.all([
      prisma.lead.count({ where: { tenantId, status: { notIn: ['WON', 'LOST'] } } }),
      prisma.project.count({ where: { tenantId, status: { notIn: ['COMPLETED', 'HANDOVER'] } } }),
      prisma.lead.count({ where: { tenantId, status: 'WON' } }),
      prisma.siteSurvey.count({ where: { tenantId, status: { notIn: ['COMPLETED', 'REJECTED'] } } }).catch(() => 0),
      prisma.supportTicket.count({ where: { tenantId, status: { notIn: ['RESOLVED', 'CLOSED'] } } }).catch(() => 0),
      prisma.project.findMany({
        where: { tenantId },
        select: { systemCapacity: true }
      }).catch(() => [])
    ]);

    let totalCapacity = 0;
    projectsList.forEach(p => {
      const cap = Number(p.systemCapacity || 0);
      if (!isNaN(cap)) totalCapacity += cap;
    });

    const response = {
      isFinanceAuthorized: hasFinanceAccess,
      userRole: req.user.role,
      permissions: userPerms,
      totalLeads,
      totalProjects,
      totalCustomers,
      totalCapacity: Math.round(totalCapacity * 10) / 10,
      openSurveys,
      openTickets,
      environmental: {
        monthlyEnergyKWh: Math.round((totalCapacity || 25) * 120),
        co2Tons: Math.round((totalCapacity || 25) * 120 * 0.82 / 1000 * 10) / 10,
        coalTons: Math.round((totalCapacity || 25) * 120 * 0.4 / 1000 * 10) / 10,
        trees: Math.round((totalCapacity || 25) * 4)
      }
    };

    // CRITICAL FINANCIAL METRICS: ONLY returned if user has explicit finance authorization
    if (hasFinanceAccess) {
      const invoices = await prisma.invoice.findMany({
        where: { tenantId },
        select: { totalAmount: true, status: true, paidAmount: true, dueDate: true, createdAt: true }
      }).catch(() => []);

      let totalRevenue = 0;
      let totalCollected = 0;
      let outstanding = 0;

      const now = Date.now();
      let under15 = 0;
      let under30 = 0;
      let over30 = 0;

      invoices.forEach(inv => {
        const total = Number(inv.totalAmount || 0);
        const paid = Number(inv.paidAmount || (inv.status === 'PAID' ? total : 0));
        totalRevenue += total;
        totalCollected += paid;
        const due = Math.max(0, total - paid);
        outstanding += due;

        if (due > 0) {
          const daysOld = Math.floor((now - new Date(inv.dueDate || inv.createdAt).getTime()) / 86400000);
          if (daysOld < 15) under15 += due;
          else if (daysOld <= 30) under30 += due;
          else over30 += due;
        }
      });

      response.totalRevenue = totalRevenue;
      response.totalCollected = totalCollected;
      response.outstanding = outstanding;
      response.orderBook = totalRevenue;
      response.pendingInvoices = invoices.filter(i => i.status !== 'PAID').length;
      response.aging = { under15, under30, over30 };
    } else {
      // ZERO financial values leaked to non-finance employees
      response.totalRevenue = 0;
      response.totalCollected = 0;
      response.outstanding = 0;
      response.orderBook = 0;
      response.pendingInvoices = 0;
      response.aging = null;
    }

    res.json(response);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch tenant dashboard' });
  }
});

module.exports = router;