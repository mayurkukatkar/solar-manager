const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = require('../../db');
const { requireSuperAdmin } = require('../../middleware/auth');

// 3. Get All Tenants
router.get('/tenants', requireSuperAdmin, async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: { select: { users: true, projects: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tenants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// 4. Create New Tenant
router.post('/tenants', requireSuperAdmin, async (req, res) => {
  const { name, legalName, email, phone, city, state, adminName, adminEmail } = req.body;
  
  if (!name || !adminEmail) {
    return res.status(400).json({ error: 'Company Name and Admin Email are required' });
  }

  try {
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 char temp password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Create Tenant
      const tenant = await tx.tenant.create({
        data: { name, legalName, email, phone, city, state, status: 'ACTIVE' }
      });
      
      // Hash password and create Tenant Admin
      const user = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName || 'Tenant Admin',
          role: 'TENANT_ADMIN',
          tenantId: tenant.id,
          mustChangePassword: true
        }
      });
      
      return tenant;
    });

    // Send Welcome Email with Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Solar ERP System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: 'Welcome to Solar ERP - Your Temporary Login Credentials',
      html: `
        <h2>Welcome to Solar ERP</h2>
        <p>Your tenant account <strong>${name}</strong> has been successfully provisioned.</p>
        <p>Here are your temporary login credentials:</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; font-family: monospace;">
          <p><strong>Email:</strong> ${adminEmail}</p>
          <p><strong>Password:</strong> ${tempPassword}</p>
        </div>
        <p><strong>Security Notice:</strong> You will be required to change your password immediately upon your first login.</p>
        <br/>
        <a href="http://localhost:3000/login" style="display:inline-block; padding:10px 20px; background:#2563eb; color:#fff; text-decoration:none; border-radius:5px;">Login to Portal</a>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Tenant provisioned successfully and email sent', tenant: result });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Admin email already exists in the system' });
    res.status(500).json({ error: 'Failed to provision tenant' });
  }
});

// 4.5 Get Single Tenant
router.get('/tenants/:id', requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { users: true, projects: true, leads: true } },
        users: { where: { role: 'TENANT_ADMIN' }, select: { name: true, email: true } }
      }
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ tenant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tenant details' });
  }
});

// 4.6 Toggle Tenant Status
router.put('/tenants/:id/status', requireSuperAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ message: \`Tenant status updated to \${status}\`, tenant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update tenant status' });
  }
});

// ----------------------------------------------------
// PHASE 3: SUBSCRIPTIONS & PLANS
// ----------------------------------------------------

// 6. Get All Plans
router.get('/plans', requireSuperAdmin, async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// 7. Create Plan
router.post('/plans', requireSuperAdmin, async (req, res) => {
  const { name, code, price, billingCycle, trialDays, userLimit, storageLimit, features } = req.body;
  try {
    const plan = await prisma.plan.create({
      data: { name, code, price, billingCycle, trialDays, userLimit, storageLimit, features }
    });
    res.json({ message: 'Plan created successfully', plan });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Plan code already exists' });
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// 8. Get All Subscriptions
router.get('/subscriptions', requireSuperAdmin, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        tenant: { select: { id: true, name: true, status: true } },
        plan: { select: { id: true, name: true, price: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// ----------------------------------------------------
// PHASE 6: SUPPORT TICKETS
// ----------------------------------------------------
router.get('/tickets', requireSuperAdmin, async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: { tenant: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// ----------------------------------------------------
// PHASE 8: AUDIT LOGS
// ----------------------------------------------------
router.get('/audit-logs', requireSuperAdmin, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ----------------------------------------------------
// PHASE 5: DASHBOARD KPIs
// ----------------------------------------------------
// 5. Dashboard KPIs
router.get('/kpis', requireSuperAdmin, async (req, res) => {
  try {
    const totalTenants = await prisma.tenant.count();
    const activeTenants = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
    const totalUsers = await prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } });
    
    res.json({ totalTenants, activeTenants, totalUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

module.exports = router;
