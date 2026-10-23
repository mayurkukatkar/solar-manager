const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validate');
const { createTenantSchema, createPlanSchema } = require('../validations');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = require('../../db');
const { requireSuperAdmin, invalidateTenantStatusCache } = require('../../middleware/auth');

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
router.post('/tenants', requireSuperAdmin, validate(createTenantSchema), async (req, res) => {
  const { name, legalName, email, phone, city, state, adminName, adminEmail, planId } = req.body;
  
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
      
      // Create Subscription if planId is provided
      if (planId) {
        const plan = await tx.plan.findUnique({ where: { id: planId } });
        if (plan) {
          const endDate = new Date();
          if (plan.billingCycle === 'ANNUAL') endDate.setFullYear(endDate.getFullYear() + 1);
          else endDate.setMonth(endDate.getMonth() + 1);
          
          await tx.subscription.create({
            data: {
              tenantId: tenant.id,
              planId: plan.id,
              status: 'ACTIVE',
              amount: plan.price,
              endDate: endDate
            }
          });
        }
      }
      
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
    // Immediately invalidate in-memory status cache so web & mobile get blocked instantly
    invalidateTenantStatusCache(req.params.id);
    res.json({ message: `Tenant status updated to ${status}`, tenant });
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

// 7.5 Update Plan
router.put('/plans/:id', requireSuperAdmin, async (req, res) => {
  try {
    const plan = await prisma.plan.update({ where: { id: req.params.id }, data: req.body });
    res.json({ message: 'Plan updated successfully', plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// 7.6 Delete Plan
router.delete('/plans/:id', requireSuperAdmin, async (req, res) => {
  try {
    await prisma.plan.delete({ where: { id: req.params.id } });
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete plan' });
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
    
    // Inbound platform leads / demo requests
    const totalLeads = await prisma.platformLead.count();
    const newLeads = await prisma.platformLead.count({ where: { status: 'NEW' } });
    const recentLeads = await prisma.platformLead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    const revenueResult = await prisma.subscription.aggregate({
      _sum: { amount: true },
      where: { status: 'ACTIVE' }
    });
    const totalRevenue = revenueResult._sum.amount || 0;
    
    const tenants = await prisma.tenant.findMany({ select: { createdAt: true } });
    const growthMap = {};
    tenants.forEach(t => {
      const month = t.createdAt.toLocaleString('default', { month: 'short' });
      growthMap[month] = (growthMap[month] || 0) + 1;
    });
    const tenantGrowth = Object.keys(growthMap).map(k => ({ month: k, tenants: growthMap[k] }));

    const recentActivity = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { action: true, entity: true, createdAt: true }
    });
    
    res.json({ 
      totalTenants, 
      activeTenants, 
      totalUsers, 
      totalRevenue, 
      tenantGrowth, 
      recentActivity,
      totalLeads,
      newLeads,
      recentLeads
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

// ----------------------------------------------------
// PHASE 9: INBOUND PLATFORM LEADS & DEMO REQUESTS
// ----------------------------------------------------

// 9.1 Get All Inbound Platform Leads
router.get('/platform-leads', requireSuperAdmin, async (req, res) => {
  try {
    const leads = await prisma.platformLead.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const total = leads.length;
    const newCount = leads.filter(l => l.status === 'NEW').length;
    const contactedCount = leads.filter(l => l.status === 'CONTACTED').length;
    const scheduledCount = leads.filter(l => l.status === 'DEMO_SCHEDULED').length;
    const convertedCount = leads.filter(l => l.status === 'CONVERTED' || l.status === 'TRIAL_PROVISIONED').length;

    res.json({
      leads,
      metrics: {
        total,
        newCount,
        contactedCount,
        scheduledCount,
        convertedCount
      }
    });
  } catch (error) {
    console.error('[WhereReady Solar OS] Failed to fetch platform leads:', error);
    res.status(500).json({ error: 'Failed to fetch platform leads' });
  }
});

// 9.2 Create / Ingest New Inbound Lead (Callable by web client or public form)
router.post('/platform-leads', async (req, res) => {
  const { name, company, phone, email, cityState, businessType, monthlyVolume, preferredTime, notes, source } = req.body;

  if (!name || !company || !phone || !email) {
    return res.status(400).json({ error: 'Name, company, phone, and email are required' });
  }

  try {
    const lead = await prisma.platformLead.create({
      data: {
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        cityState: cityState ? cityState.trim() : null,
        businessType: businessType || 'Rooftop Solar EPC',
        monthlyVolume: monthlyVolume || '5 to 20 projects/month',
        preferredTime: preferredTime || null,
        notes: notes ? notes.trim() : null,
        source: source || 'Marketing Website - Primary Demo Booking Funnel',
        status: 'NEW'
      }
    });

    // Notify Super Admin via Email if EMAIL_USER is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const alertHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <div style="background: #0284c7; padding: 16px; border-radius: 8px; color: white; text-align: center;">
              <h2 style="margin: 0;">🚀 New Qualified Demo Request Received</h2>
              <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">WhereReady Solar OS Platform Lead</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; color: #64748b; width: 35%;">Vendor Name:</td>
                <td style="padding: 10px; color: #0f172a; font-weight: bold;">${lead.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; color: #64748b;">Company:</td>
                <td style="padding: 10px; color: #0f172a; font-weight: bold;">${lead.company}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; color: #64748b;">WhatsApp Mobile:</td>
                <td style="padding: 10px; color: #0f172a;">${lead.phone}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; color: #64748b;">Work Email:</td>
                <td style="padding: 10px; color: #0f172a;">${lead.email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; color: #64748b;">Location:</td>
                <td style="padding: 10px; color: #0f172a;">${lead.cityState || 'Not specified'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; color: #64748b;">Business Type:</td>
                <td style="padding: 10px; color: #0f172a;">${lead.businessType}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; color: #64748b;">Monthly Volume:</td>
                <td style="padding: 10px; color: #0f172a;">${lead.monthlyVolume}</td>
              </tr>
              ${lead.preferredTime ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: bold; color: #64748b;">Preferred Time:</td>
                <td style="padding: 10px; color: #0f172a;">${lead.preferredTime}</td>
              </tr>` : ''}
            </table>

            <div style="margin-top: 24px; text-align: center;">
              <a href="https://solarerp-gamma.vercel.app/super-admin/leads" style="display: inline-block; padding: 12px 24px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                Open Super Admin Portal →
              </a>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"WhereReady Solar OS" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          subject: `⚡ New Solar EPC Demo Request: ${lead.company} (${lead.name})`,
          html: alertHtml
        });
      } catch (emailErr) {
        console.error('[WhereReady Solar OS] Warning: Failed to send email alert for demo lead:', emailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Demo lead saved successfully',
      lead
    });
  } catch (error) {
    console.error('[WhereReady Solar OS] Failed to create platform lead:', error);
    res.status(500).json({ error: 'Failed to record demo request' });
  }
});

// 9.3 Update Lead Status or Notes
router.patch('/platform-leads/:id', requireSuperAdmin, async (req, res) => {
  const { status, notes, assignedTo } = req.body;
  try {
    const data = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;

    const lead = await prisma.platformLead.update({
      where: { id: req.params.id },
      data
    });

    res.json({ message: 'Lead updated successfully', lead });
  } catch (error) {
    console.error('[WhereReady Solar OS] Failed to update lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// 9.4 Delete Lead
router.delete('/platform-leads/:id', requireSuperAdmin, async (req, res) => {
  try {
    await prisma.platformLead.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Lead removed successfully' });
  } catch (error) {
    console.error('[WhereReady Solar OS] Failed to delete lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

module.exports = router;

