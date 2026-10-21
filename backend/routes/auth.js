const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
      include: {
        tenant: {
          select: { id: true, name: true, status: true }
        }
      }
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ENFORCE SUSPENSION: Block suspended or cancelled tenant accounts
    if (user.role !== 'SUPER_ADMIN' && user.tenant) {
      if (user.tenant.status === 'SUSPENDED') {
        return res.status(403).json({
          error: 'Account Suspended: Your company account has been suspended by the platform administrator. Access to solar management operations is disabled.',
          code: 'TENANT_SUSPENDED',
          isSuspended: true
        });
      }

      if (user.tenant.status === 'CANCELLED') {
        return res.status(403).json({
          error: 'Account Cancelled: Your company subscription has ended. Please contact platform administration.',
          code: 'TENANT_CANCELLED',
          isSuspended: true
        });
      }
    }

    if (user.mustChangePassword) {
      return res.json({ requiresPasswordReset: true, email: user.email });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenantId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const cookieName = user.role === 'SUPER_ADMIN' ? 'super_admin_token' : 'tenant_token';
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: true, 
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Login successful', role: user.role, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/force-reset-password', async (req, res) => {
  const { email, temporaryPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.mustChangePassword) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const validTempPass = await bcrypt.compare(temporaryPassword, user.password);
    if (!validTempPass) {
      return res.status(401).json({ error: 'Invalid temporary password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword, mustChangePassword: false }
    });

    res.json({ message: 'Password updated successfully. Please login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req, res) => {
  const token = req.cookies?.tenant_token || req.cookies?.super_admin_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            logoUrl: true,
            status: true
          }
        }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // ENFORCE SUSPENSION on profile validation
    if (user.role !== 'SUPER_ADMIN' && user.tenant?.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Account Suspended: Your company account has been suspended by the platform administrator.',
        code: 'TENANT_SUSPENDED',
        isSuspended: true,
        user
      });
    }

    if (user.role !== 'SUPER_ADMIN' && user.tenant?.status === 'CANCELLED') {
      return res.status(403).json({
        error: 'Account Cancelled: Your company subscription has ended.',
        code: 'TENANT_CANCELLED',
        isSuspended: true,
        user
      });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid session' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('super_admin_token');
  res.clearCookie('tenant_token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

