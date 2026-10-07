const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-solar-erp-jwt-key';

const requireSuperAdmin = (req, res, next) => {
  const token = req.cookies.super_admin_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (!token) return res.status(401).json({ error: 'Unauthorized: Platform Access Required' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden: Super Admin only' });
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
};

const requireTenantAuth = (req, res, next) => {
  const token = req.cookies.tenant_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (!token) return res.status(401).json({ error: 'Unauthorized: Tenant Access Required' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'TENANT_ADMIN' && payload.role !== 'TENANT_SUB_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Tenant only' });
    }
    if (!payload.tenantId) {
       return res.status(403).json({ error: 'Forbidden: No tenant context' });
    }
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
};

// Granular permission enforcement for TENANT_SUB_ADMIN users
// Usage: router.post('/api/tenant/leads', requireTenantAuth, requirePermission('leads.create'), handler)
const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      // TENANT_ADMIN has implicit full access to their tenant
      if (req.user.role === 'TENANT_ADMIN') return next();

      // TENANT_SUB_ADMIN — fetch permissions from DB
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { permissions: true }
      });

      const userPerms = Array.isArray(user?.permissions) ? user.permissions : [];
      const hasAll = permissions.every(p => userPerms.includes(p));

      if (!hasAll) {
        return res.status(403).json({
          error: 'Forbidden: Insufficient permissions',
          required: permissions
        });
      }

      next();
    } catch (err) {
      console.error('Permission check error:', err.message);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Audit logging utility — call from route handlers after successful operations
// Usage: await logAudit(req, 'CREATE', 'Lead', lead.id, { name: lead.name });
const logAudit = async (req, action, entity, entityId = null, details = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.userId || req.user?.id || 'SYSTEM',
        tenantId: req.user?.tenantId || null,
        action,
        entity,
        entityId,
        details,
        ipAddress: req.ip || req.connection?.remoteAddress || null
      }
    });
  } catch (err) {
    // Audit logging should never break the main request
    console.error('Audit log error:', err.message);
  }
};

module.exports = { requireSuperAdmin, requireTenantAuth, requirePermission, logAudit, JWT_SECRET };
