const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT - STAFF / SUB-ADMIN MANAGEMENT
// ----------------------------------------------------

// List all staff (sub-admins) for this tenant
router.get('/api/tenant/staff', requireTenantAuth, async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        tenantId: req.user.tenantId,
        role: { in: ['TENANT_ADMIN', 'TENANT_SUB_ADMIN'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ staff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Get staff detail
router.get('/api/tenant/staff/:id', requireTenantAuth, async (req, res) => {
  try {
    const member = await prisma.user.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { assignedLeads: true, assignedTasks: true, assignedTickets: true } }
      }
    });
    if (!member) return res.status(404).json({ error: 'Staff member not found' });
    res.json({ member });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff details' });
  }
});

// Create new sub-admin
router.post('/api/tenant/staff', requireTenantAuth, async (req, res) => {
  try {
    // Only TENANT_ADMIN can create staff
    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Admin can create staff members' });
    }

    const { name, email, permissions } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already exists in the system' });

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'TENANT_SUB_ADMIN',
        tenantId: req.user.tenantId,
        mustChangePassword: true,
        permissions: permissions || []
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        mustChangePassword: true,
        createdAt: true
      }
    });

    res.status(201).json({ member: user, tempPassword });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// Update staff member
router.patch('/api/tenant/staff/:id', requireTenantAuth, async (req, res) => {
  try {
    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Admin can update staff' });
    }

    const { name, permissions } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;

    const user = await prisma.user.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json({ member: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// Update staff permissions
router.patch('/api/tenant/staff/:id/permissions', requireTenantAuth, async (req, res) => {
  try {
    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Admin can manage permissions' });
    }

    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions must be an array' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { permissions },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true
      }
    });
    res.json({ member: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// Delete (deactivate) staff member
router.delete('/api/tenant/staff/:id', requireTenantAuth, async (req, res) => {
  try {
    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Admin can remove staff' });
    }

    // Prevent deleting yourself
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Staff member removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove staff member' });
  }
});

// Reset staff password
router.post('/api/tenant/staff/:id/reset-password', requireTenantAuth, async (req, res) => {
  try {
    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Admin can reset passwords' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { password: hashedPassword, mustChangePassword: true }
    });

    res.json({ message: 'Password reset successfully', tempPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
