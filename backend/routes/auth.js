const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// =========================================================================
// SECURITY LAYER: RATE LIMITING & BRUTE FORCE SHIELD
// =========================================================================
// In-Memory store for failed authentication attempts (IP + Email key)
const failedLoginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15-minute lockout

// Automatic GC cleanup of expired rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of failedLoginAttempts.entries()) {
    if (record.lockedUntil && record.lockedUntil < now) {
      failedLoginAttempts.delete(key);
    } else if (now - record.lastAttempt > LOCKOUT_WINDOW_MS) {
      failedLoginAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Pre-computed constant-time dummy hash to defeat email enumeration timing attacks
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '127.0.0.1';
};

const recordFailedAttempt = (key) => {
  const now = Date.now();
  const current = failedLoginAttempts.get(key) || { count: 0, lastAttempt: now, lockedUntil: null };
  current.count += 1;
  current.lastAttempt = now;
  if (current.count >= MAX_ATTEMPTS) {
    current.lockedUntil = now + LOCKOUT_WINDOW_MS;
  }
  failedLoginAttempts.set(key, current);
  return current;
};

// =========================================================================
// 1. LOGIN ENDPOINT (Hardened with Remember Me & Hack-Proof Protections)
// =========================================================================
router.post('/login', async (req, res) => {
  try {
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;
    const rememberMe = req.body.rememberMe !== false; // Defaults to true for seamless mobile UX

    // 1. Strict Input Sanitization & Type Checks
    if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (typeof rawPassword !== 'string' || !rawPassword) {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;

    // Defense against Buffer Overflow & ReDoS Denial of Service
    if (email.length > 120) {
      return res.status(400).json({ error: 'Email address exceeds maximum length of 120 characters.' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password exceeds maximum length of 128 characters.' });
    }

    // Standard RFC-5322 Email Syntax Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address format (e.g. name@company.com).' });
    }

    // 2. Brute Force & Credential Stuffing Check
    const clientIp = getClientIp(req);
    const rateLimitKey = `${clientIp}:${email}`;
    const attemptRecord = failedLoginAttempts.get(rateLimitKey);
    const now = Date.now();

    if (attemptRecord && attemptRecord.lockedUntil && attemptRecord.lockedUntil > now) {
      const remainingMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
      return res.status(429).json({
        error: `Too many failed login attempts. For security, access is temporarily locked. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
        code: 'RATE_LIMITED',
        retryAfterSeconds: Math.ceil((attemptRecord.lockedUntil - now) / 1000)
      });
    }

    // 3. User Lookup
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
        },
        staffProfile: {
          select: { id: true, status: true, department: true, designation: true }
        }
      }
    });

    // 4. Timing Attack Mitigation: Always execute bcrypt.compare even if user does not exist
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      recordFailedAttempt(rateLimitKey);
      return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      recordFailedAttempt(rateLimitKey);
      return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
    }

    // Authentication Success -> Clear failed attempts immediately
    failedLoginAttempts.delete(rateLimitKey);

    // 5. ENFORCE SUSPENSION: Block suspended or cancelled tenant accounts
    if (user.role !== 'SUPER_ADMIN' && user.tenant) {
      if (user.tenant.status === 'SUSPENDED') {
        return res.status(403).json({
          error: 'Account Suspended: Your company account has been suspended by the platform administrator. Access to solar operations is disabled.',
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

    // 6. ENFORCE EMPLOYEE SUSPENSION: Block suspended/deactivated staff members
    if (user.staffProfile && (user.staffProfile.status === 'SUSPENDED' || user.staffProfile.status === 'INACTIVE')) {
      return res.status(403).json({
        error: 'Access Suspended: Your employee account has been suspended or deactivated by your organization administrator.',
        code: 'EMPLOYEE_SUSPENDED',
        isSuspended: true
      });
    }

    if (user.mustChangePassword) {
      return res.json({ requiresPasswordReset: true, email: user.email });
    }

    // 7. Resolve Effective Permissions
    let effectivePermissions = [];
    if (user.role === 'TENANT_ADMIN' || user.role === 'SUPER_ADMIN') {
      effectivePermissions = ['*'];
    } else if (Array.isArray(user.permissions)) {
      effectivePermissions = user.permissions;
    } else if (user.permissions && Array.isArray(user.permissions.modules)) {
      effectivePermissions = user.permissions.modules;
    }

    // 8. SESSION EXPIRATION & REMEMBER ME LOGIC (Long-lived tokens: 90 days vs 30 days)
    const tokenLifetime = rememberMe ? '90d' : '30d';
    const cookieMaxAgeMs = (rememberMe ? 90 : 30) * 24 * 60 * 60 * 1000;

    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        role: user.role,
        tenantId: user.tenantId,
        permissions: effectivePermissions,
        rememberMe
      },
      JWT_SECRET,
      { expiresIn: tokenLifetime, algorithm: 'HS256' }
    );

    const cookieName = user.role === 'SUPER_ADMIN' ? 'super_admin_token' : 'tenant_token';
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: cookieMaxAgeMs
    });

    res.json({
      message: 'Login successful',
      role: user.role,
      token,
      expiresIn: tokenLifetime,
      rememberMe,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: effectivePermissions,
        department: user.staffProfile?.department || null,
        designation: user.staffProfile?.designation || null,
        tenantName: user.tenant?.name || null
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'An unexpected authentication error occurred. Please try again.' });
  }
});

// =========================================================================
// 2. FORCE RESET TEMPORARY PASSWORD
// =========================================================================
router.post('/force-reset-password', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const { temporaryPassword, newPassword } = req.body;
  try {
    if (!email || !temporaryPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide all required password fields.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });
    if (!user || !user.mustChangePassword) {
      return res.status(400).json({ error: 'Password reset is not required or user not found.' });
    }

    const validTempPass = await bcrypt.compare(temporaryPassword, user.password);
    if (!validTempPass) {
      return res.status(401).json({ error: 'Invalid temporary password.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword, mustChangePassword: false }
    });

    res.json({ message: 'Password updated successfully. Please sign in with your new password.' });
  } catch (err) {
    console.error('Password reset error:', err.message);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// =========================================================================
// 3. ME ENDPOINT (With Sliding Session Renewal for Active Users)
// =========================================================================
router.get('/me', async (req, res) => {
  const token =
    req.cookies?.tenant_token ||
    req.cookies?.super_admin_token ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const user = await prisma.user.findUnique({
      where: { id: payload.userId || payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        permissions: true,
        mustChangePassword: true,
        staffProfile: {
          select: {
            id: true,
            employeeId: true,
            department: true,
            designation: true,
            status: true
          }
        },
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
    if (!user) return res.status(404).json({ error: 'User account not found.' });

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

    // ENFORCE EMPLOYEE SUSPENSION on profile validation
    if (
      user.role === 'TENANT_SUB_ADMIN' &&
      user.staffProfile &&
      (user.staffProfile.status === 'SUSPENDED' || user.staffProfile.status === 'INACTIVE')
    ) {
      return res.status(403).json({
        error: 'Account Suspended: Your staff access has been suspended by your organization administrator.',
        code: 'EMPLOYEE_SUSPENDED',
        isSuspended: true
      });
    }

    let effectivePermissions = [];
    if (user.role === 'TENANT_ADMIN' || user.role === 'SUPER_ADMIN') {
      effectivePermissions = ['*'];
    } else if (Array.isArray(user.permissions)) {
      effectivePermissions = user.permissions;
    } else if (user.permissions && Array.isArray(user.permissions.modules)) {
      effectivePermissions = user.permissions.modules;
    }

    // SLIDING SESSION RENEWAL:
    // Generate fresh 90-day token so active mobile / web users never expire unexpectedly
    const refreshedToken = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        role: user.role,
        tenantId: user.tenantId,
        permissions: effectivePermissions
      },
      JWT_SECRET,
      { expiresIn: '90d', algorithm: 'HS256' }
    );

    const cookieName = user.role === 'SUPER_ADMIN' ? 'super_admin_token' : 'tenant_token';
    res.cookie(cookieName, refreshedToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 90 * 24 * 60 * 60 * 1000
    });

    res.json({
      token: refreshedToken,
      user: {
        ...user,
        permissions: effectivePermissions
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
});

// =========================================================================
// 4. LOGOUT
// =========================================================================
router.post('/logout', (req, res) => {
  res.clearCookie('super_admin_token');
  res.clearCookie('tenant_token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
