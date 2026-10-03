const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
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

    res.json({ message: 'Login successful', role: user.role });
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

router.post('/logout', (req, res) => {
  res.clearCookie('super_admin_token');
  res.clearCookie('tenant_token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
