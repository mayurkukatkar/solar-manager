const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// ----------------------------------------------------
// USERS & RBAC PERMISSIONS (TENANT)
// ----------------------------------------------------

// GET /api/tenant/users
router.get('/api/tenant/users', requireTenantAuth, async (req, res) => {
  try {
    const { role, search, status } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        staffProfile: {
          select: {
            id: true,
            employeeId: true,
            department: true,
            designation: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format for Users & Permissions screen
    const formatted = users.map(u => {
      let department = u.staffProfile?.department || 'Operations';
      if (!u.staffProfile) {
        if (u.role === 'TENANT_ADMIN') department = 'Executive Management';
        else if (u.permissions?.modules?.includes('finance')) department = 'Finance & Accounts';
        else if (u.permissions?.modules?.includes('leads') || u.permissions?.modules?.includes('crm')) department = 'Sales & CRM';
        else if (u.permissions?.modules?.includes('surveys') || u.permissions?.modules?.includes('installations')) department = 'Field Engineering';
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department,
        staffProfile: u.staffProfile || null,
        permissions: u.permissions || {},
        mfaEnabled: true,
        status: u.mustChangePassword ? 'INVITED' : 'ACTIVE',
        lastActive: 'Active recently'
      };
    });

    res.json({ users: formatted });
  } catch (error) {
    console.error('Error fetching tenant users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/tenant/users/invite
// Invite/create new team member
router.post('/api/tenant/users/invite', requireTenantAuth, async (req, res) => {
  try {
    const { name, email, role, department, permissions, staffId } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate secure temporary password
    const tempPassword = `Solar@${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role === 'TENANT_ADMIN' ? 'TENANT_ADMIN' : 'TENANT_SUB_ADMIN',
        tenantId: req.user.tenantId,
        mustChangePassword: true,
        permissions: permissions || {
          modules: ['leads', 'crm', 'projects', 'surveys', 'quotations']
        }
      }
    });

    // Auto-link to staff profile if specified or matching by email
    if (staffId) {
      await prisma.staff.update({
        where: { id: staffId, tenantId: req.user.tenantId },
        data: { userId: newUser.id }
      }).catch(() => null);
    } else {
      await prisma.staff.updateMany({
        where: { email: email.trim().toLowerCase(), tenantId: req.user.tenantId, userId: null },
        data: { userId: newUser.id }
      }).catch(() => null);
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        tenantId: req.user.tenantId,
        action: 'INVITE_USER',
        entity: 'User',
        entityId: newUser.id,
        details: { name: newUser.name, email: newUser.email, role: newUser.role, department },
        ipAddress: req.ip || '127.0.0.1'
      }
    }).catch(() => null);

    res.status(201).json({
      message: 'User invited successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: department || 'Operations',
        status: 'INVITED'
      },
      tempPassword
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// PATCH /api/tenant/users/:id/role
// Update user role and permissions
router.patch('/api/tenant/users/:id/role', requireTenantAuth, async (req, res) => {
  try {
    const { role, permissions } = req.body;
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: role ? (role === 'TENANT_ADMIN' ? 'TENANT_ADMIN' : 'TENANT_SUB_ADMIN') : user.role,
        permissions: permissions !== undefined ? permissions : user.permissions
      }
    });

    res.json({ message: 'User updated successfully', user: updated });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /api/tenant/users/:id/reset-password
router.post('/api/tenant/users/:id/reset-password', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tempPassword = `Solar@${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword, mustChangePassword: true }
    });

    res.json({ message: 'Password reset successfully', tempPassword });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// DELETE /api/tenant/users/:id
router.delete('/api/tenant/users/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own user account' });
    }

    const user = await prisma.user.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
