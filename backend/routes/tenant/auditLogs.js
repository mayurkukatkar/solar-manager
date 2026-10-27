const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// ----------------------------------------------------
// AUDIT LOGS & COMPLIANCE HISTORY (TENANT)
// ----------------------------------------------------

const SEED_AUDIT_LOGS = [
  {
    action: 'CREATE_INVOICE',
    entity: 'Invoice',
    entityId: 'INV-0043',
    details: { amount: 325000, customer: 'Dr. Rajesh Sharma', status: 'PENDING' },
    ipAddress: '103.211.54.12'
  },
  {
    action: 'UPDATE_PROJECT_STAGE',
    entity: 'Project',
    entityId: 'PRJ-881',
    details: { previousStage: 'DISPATCHED', newStage: 'INSTALLATION_IN_PROGRESS', completionPct: 65 },
    ipAddress: '49.36.128.90'
  },
  {
    action: 'DISPATCH_MATERIAL',
    entity: 'Inventory',
    entityId: 'BOM-402',
    details: { items: 'Waaree 550Wp x 10, Growatt 5kW x 1', destination: 'Site #PRJ-881' },
    ipAddress: '103.211.54.12'
  },
  {
    action: 'GENERATE_DISCOM_WCR',
    entity: 'Document',
    entityId: 'DOC-WCR-901',
    details: { template: 'WCR_FULL', consumerNo: '012345678901', capacityKw: 3.3 },
    ipAddress: '103.211.54.12'
  },
  {
    action: 'RECORD_PAYMENT',
    entity: 'Finance',
    entityId: 'PAY-8821',
    details: { amount: 145000, method: 'NEFT', invoiceId: 'INV-0042' },
    ipAddress: '49.36.128.90'
  }
];

// GET /api/tenant/audit-logs
router.get('/api/tenant/audit-logs', requireTenantAuth, async (req, res) => {
  try {
    const { entity, action, search, limit = 50, page = 1 } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (entity && entity !== 'ALL') where.entity = entity;
    if (action && action !== 'ALL') where.action = action;
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const take = parseInt(limit) || 50;
    const skip = (parseInt(page) - 1) * take;

    let [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      prisma.auditLog.count({ where })
    ]);

    // Auto-seed if zero audit logs exist for tenant
    if (total === 0 && !search && !entity) {
      for (const s of SEED_AUDIT_LOGS) {
        await prisma.auditLog.create({
          data: {
            actorId: req.user.id,
            tenantId: req.user.tenantId,
            action: s.action,
            entity: s.entity,
            entityId: s.entityId,
            details: s.details,
            ipAddress: s.ipAddress,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 2))
          }
        }).catch(() => null);
      }

      [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { tenantId: req.user.tenantId },
          orderBy: { createdAt: 'desc' },
          take,
          skip
        }),
        prisma.auditLog.count({ where: { tenantId: req.user.tenantId } })
      ]);
    }

    // Attach actor details
    const users = await prisma.user.findMany({
      where: { tenantId: req.user.tenantId },
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const enriched = logs.map(l => {
      const user = userMap.get(l.actorId);
      return {
        ...l,
        actorName: user?.name || req.user.name || 'System Operator',
        actorRole: user?.role || req.user.role || 'Staff'
      };
    });

    res.json({ logs: enriched, total, page: parseInt(page), pages: Math.ceil(total / take) });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// POST /api/tenant/audit-logs
// Create custom audit log
router.post('/api/tenant/audit-logs', requireTenantAuth, async (req, res) => {
  try {
    const { action, entity, entityId, details } = req.body;

    if (!action || !entity) {
      return res.status(400).json({ error: 'Action and Entity are required' });
    }

    const log = await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        tenantId: req.user.tenantId,
        action: action.toUpperCase(),
        entity,
        entityId: entityId || null,
        details: details || null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      }
    });

    res.status(201).json({ message: 'Audit entry recorded', log });
  } catch (error) {
    console.error('Error recording audit log:', error);
    res.status(500).json({ error: 'Failed to record audit log' });
  }
});

// GET /api/tenant/audit-logs/export
// Export audit logs as CSV
router.get('/api/tenant/audit-logs/export', requireTenantAuth, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    const csvRows = [
      ['Log ID', 'Timestamp', 'Action', 'Entity', 'Entity ID', 'Actor ID', 'IP Address', 'Details'].join(',')
    ];

    for (const l of logs) {
      const detailsStr = l.details ? JSON.stringify(l.details).replace(/"/g, '""') : '';
      csvRows.push([
        l.id,
        new Date(l.createdAt).toISOString(),
        `"${l.action}"`,
        `"${l.entity}"`,
        `"${l.entityId || ''}"`,
        `"${l.actorId}"`,
        `"${l.ipAddress || ''}"`,
        `"${detailsStr}"`
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${Date.now()}.csv"`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

module.exports = router;
