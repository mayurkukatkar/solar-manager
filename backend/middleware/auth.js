const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-solar-erp-jwt-key';

const requireSuperAdmin = (req, res, next) => {
  const token = req.cookies.super_admin_token;
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
  const token = req.cookies.tenant_token;
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

module.exports = { requireSuperAdmin, requireTenantAuth, JWT_SECRET };
