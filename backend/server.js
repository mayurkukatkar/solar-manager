const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tenantInstallationsRoutes = require('./routes/tenant/installations');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'solar-erp/surveys',
    allowed_formats: ['jpg', 'png', 'jpeg']
  },
});
const upload = multer({ storage: storage });

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-solar-erp-jwt-key';

const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------
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

// ----------------------------------------------------------------------
// AUTHENTICATION (Unified Role-Based Login)
// ----------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Verify hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Force Password Reset Flow
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
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ message: 'Login successful', role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/force-reset-password', async (req, res) => {
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

// ----------------------------------------------------
// UNIFIED LOGOUT
// ----------------------------------------------------
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('super_admin_token');
  res.clearCookie('tenant_token');
  res.json({ message: 'Logged out successfully' });
});

// 3. Get All Tenants
app.get('/api/super-admin/tenants', requireSuperAdmin, async (req, res) => {
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
app.post('/api/super-admin/tenants', requireSuperAdmin, async (req, res) => {
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
app.get('/api/super-admin/tenants/:id', requireSuperAdmin, async (req, res) => {
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
app.put('/api/super-admin/tenants/:id/status', requireSuperAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status }
    });
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
app.get('/api/super-admin/plans', requireSuperAdmin, async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// 7. Create Plan
app.post('/api/super-admin/plans', requireSuperAdmin, async (req, res) => {
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
app.get('/api/super-admin/subscriptions', requireSuperAdmin, async (req, res) => {
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
app.get('/api/super-admin/tickets', requireSuperAdmin, async (req, res) => {
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
app.get('/api/super-admin/audit-logs', requireSuperAdmin, async (req, res) => {
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
app.get('/api/super-admin/kpis', requireSuperAdmin, async (req, res) => {
  try {
    const totalTenants = await prisma.tenant.count();
    const activeTenants = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
    const totalUsers = await prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } });
    
    res.json({ totalTenants, activeTenants, totalUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

// ----------------------------------------------------
// TENANT ADMIN - DASHBOARD KPIs
// ----------------------------------------------------
app.get('/api/tenant/dashboard', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const totalLeads = await prisma.lead.count({ where: { tenantId } });
    const totalProjects = await prisma.project.count({ where: { tenantId } });
    const wonLeads = await prisma.lead.count({ where: { tenantId, status: 'WON' } });
    
    res.json({ totalLeads, totalProjects, totalCustomers: wonLeads });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tenant dashboard' });
  }
});

// ----------------------------------------------------
// TENANT ADMIN - PHASE 1: SALES & CRM
// ----------------------------------------------------

// LEADS
app.get('/api/tenant/leads/dashboard', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const totalLeads = await prisma.lead.count({ where: { tenantId } });
    const newLeads = await prisma.lead.count({ where: { tenantId, status: 'NEW' } });
    const qualifiedLeads = await prisma.lead.count({ where: { tenantId, status: 'QUALIFIED' } });
    const wonLeads = await prisma.lead.count({ where: { tenantId, status: 'WON' } });
    const lostLeads = await prisma.lead.count({ where: { tenantId, status: 'LOST' } });
    
    // Quick Conversion Rate
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;
    
    res.json({ dashboard: { totalLeads, newLeads, qualifiedLeads, wonLeads, lostLeads, conversionRate } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});
app.get('/api/tenant/leads', requireTenantAuth, async (req, res) => {
  try {
    const { source, status, assigneeId, search } = req.query;
    let where = { tenantId: req.user.tenantId };
    if (source) where.source = source;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const leads = await prisma.lead.findMany({
      where,
      include: { assignee: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ leads });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.get('/api/tenant/leads/:id', requireTenantAuth, async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        activities: { orderBy: { createdAt: 'desc' } },
        followUps: { orderBy: { scheduledAt: 'asc' } },
        leadNotes: { orderBy: { createdAt: 'desc' } },
        assignee: true,
        customer: true,
        projects: true
      }
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

app.post('/api/tenant/leads', requireTenantAuth, async (req, res) => {
  try {
    const { mobile, email, forceCreate, ...rest } = req.body;
    
    // Duplicate Detection
    const duplicate = await prisma.lead.findFirst({
      where: {
        tenantId: req.user.tenantId,
        OR: [
          { mobile: mobile },
          ...(email ? [{ email: email }] : [])
        ]
      }
    });
    
    if (duplicate && !forceCreate) {
      return res.status(409).json({ error: 'Duplicate lead found', duplicate });
    }
    
    const lead = await prisma.lead.create({
      data: {
        ...rest,
        mobile,
        email,
        tenantId: req.user.tenantId
      }
    });
    
    // Log Activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'STATUS_CHANGE',
        description: 'Lead created',
        performedBy: req.user.id
      }
    });
    
    res.json({ lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

app.patch('/api/tenant/leads/:id', requireTenantAuth, async (req, res) => {
  try {
    const lead = await prisma.lead.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: req.body
    });
    
    if (req.body.status) {
       await prisma.leadActivity.create({
         data: {
           leadId: lead.id,
           type: 'STATUS_CHANGE',
           description: `Lead status changed to ${req.body.status}`,
           performedBy: req.user.id
         }
       });
    }
    
    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

app.post('/api/tenant/leads/:id/followups', requireTenantAuth, async (req, res) => {
  try {
    const followup = await prisma.leadFollowUp.create({
      data: { ...req.body, leadId: req.params.id, scheduledAt: new Date(req.body.scheduledAt) }
    });
    res.json({ followup });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add followup' });
  }
});

app.post('/api/tenant/leads/:id/notes', requireTenantAuth, async (req, res) => {
  try {
    const note = await prisma.leadNote.create({
      data: { content: req.body.content, leadId: req.params.id, createdBy: req.user.id }
    });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

app.post('/api/tenant/leads/:id/convert', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const lead = await prisma.lead.findUnique({ where: { id, tenantId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Mark Lead as WON
    const updatedLead = await prisma.lead.update({
      where: { id, tenantId },
      data: { status: 'WON' }
    });

    // Get or Create Customer
    let customer = await prisma.customer.findFirst({ where: { leadId: id, tenantId } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId,
          leadId: id,
          name: lead.name,
          email: lead.email,
          mobile: lead.mobile,
          company: lead.company,
          address: lead.address,
          city: lead.city,
        }
      });
    }

    const project = await prisma.project.create({
      data: {
        tenantId,
        customerId: customer.id,
        leadId: id,
        name: req.body.projectName || `${lead.name} Project`,
        status: 'PLANNING'
      }
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'STATUS_CHANGE',
        description: `Lead won and converted to Customer & Project: ${project.name}`,
        performedBy: req.user.id
      }
    });

    res.json({ lead: updatedLead, customer, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
});

// QUOTATIONS
app.get('/api/tenant/leads/:id/quotations', requireTenantAuth, async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      where: { leadId: req.params.id, tenantId: req.user.tenantId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ quotations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

app.post('/api/tenant/leads/:id/quotations', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { items, discount = 0 } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Quotation must have at least one item' });
    }

    let subtotal = 0;
    let taxTotal = 0;
    
    const processedItems = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const lineTax = lineTotal * (item.taxRate / 100);
      subtotal += lineTotal;
      taxTotal += lineTax;
      
      return {
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        total: lineTotal + lineTax
      };
    });
    
    const grandTotal = subtotal + taxTotal - discount;

    const quotation = await prisma.quotation.create({
      data: {
        tenantId: req.user.tenantId,
        leadId: id,
        subtotal,
        taxTotal,
        discount,
        total: grandTotal,
        items: {
          create: processedItems
        }
      },
      include: { items: true }
    });

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: 'QUOTE_SENT',
        description: `Generated a quotation for ₹${grandTotal.toLocaleString()}`,
        performedBy: req.user.id
      }
    });

    res.status(201).json({ quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

app.patch('/api/tenant/quotations/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const quotation = await prisma.quotation.update({
      where: { id, tenantId: req.user.tenantId },
      data: { status }
    });

    if (quotation.leadId) {
       await prisma.leadActivity.create({
         data: {
           leadId: quotation.leadId,
           type: 'STATUS_CHANGE',
           description: `Quotation status updated to ${status}`,
           performedBy: req.user.id
         }
       });
    }

    res.json({ quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update quotation' });
  }
});

// PRODUCTS
app.get('/api/tenant/products', requireTenantAuth, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { category: 'asc' }
    });
    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/tenant/products', requireTenantAuth, async (req, res) => {
  try {
    const { name, category, sku, brand, unit, purchaseCost, sellingPrice, taxRate, minStock, currentStock } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const product = await prisma.product.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        category,
        sku,
        brand,
        unit,
        purchaseCost: purchaseCost || 0,
        sellingPrice: sellingPrice || 0,
        taxRate: taxRate || 0,
        minStock: minStock || 0,
        currentStock: currentStock || 0
      }
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.patch('/api/tenant/products/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await prisma.product.update({
      where: { id, tenantId: req.user.tenantId },
      data: updateData
    });

    res.json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});


// ----------------------------------------------------
// INVENTORY MANAGEMENT API
// ----------------------------------------------------

app.get('/api/tenant/inventory/dashboard', requireTenantAuth, async (req, res) => {
  try {
    const productsCount = await prisma.product.count({ where: { tenantId: req.user.tenantId } });
    const warehousesCount = await prisma.warehouse.count({ where: { tenantId: req.user.tenantId } });
    
    const balances = await prisma.stockBalance.findMany({
      where: { warehouse: { tenantId: req.user.tenantId } }
    });
    
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let reservedStock = 0;
    
    // Low stock involves joining product info, so let's get products
    const products = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      include: { stockBalances: true }
    });
    
    products.forEach(p => {
      const totalPhysical = p.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
      const totalReserved = p.stockBalances.reduce((sum, b) => sum + b.reservedQuantity, 0);
      const avgCost = p.purchaseCost; // simplified valuation for dashboard
      
      totalStockValue += (totalPhysical * avgCost);
      reservedStock += totalReserved;
      
      if (totalPhysical === 0) {
        outOfStockCount++;
      } else if (p.reorderLevel > 0 && totalPhysical <= p.reorderLevel) {
        lowStockCount++;
      }
    });
    
    const pendingReceipts = await prisma.goodsReceipt.count({
      where: { tenantId: req.user.tenantId, status: 'DRAFT' }
    });
    
    res.json({
      totalProducts: productsCount,
      totalStockValue,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      reserved: reservedStock,
      pendingReceipts,
      warehouses: warehousesCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load inventory dashboard' });
  }
});

app.get('/api/tenant/inventory/products', requireTenantAuth, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        stockBalances: {
          include: { warehouse: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const formatted = products.map(p => {
      const totalPhysical = p.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
      const totalReserved = p.stockBalances.reduce((sum, b) => sum + b.reservedQuantity, 0);
      const totalAvailable = p.stockBalances.reduce((sum, b) => sum + b.availableQuantity, 0);
      return {
        ...p,
        totalPhysical,
        totalReserved,
        totalAvailable,
        status: totalPhysical === 0 ? 'Out of Stock' : (p.reorderLevel > 0 && totalPhysical <= p.reorderLevel) ? 'Low Stock' : 'Healthy'
      };
    });
    
    res.json({ products: formatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.post('/api/tenant/inventory/products', requireTenantAuth, async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: {
        tenantId: req.user.tenantId,
        name: req.body.name,
        sku: req.body.sku,
        category: req.body.category,
        brand: req.body.brand,
        unit: req.body.unit,
        purchaseCost: parseFloat(req.body.purchaseCost || 0),
        sellingPrice: parseFloat(req.body.sellingPrice || 0),
        taxRate: parseFloat(req.body.taxRate || 0),
        minStock: parseInt(req.body.minStock || 0),
        reorderLevel: parseInt(req.body.reorderLevel || 0),
        isSerialized: req.body.isSerialized === true,
        isBatchTracked: req.body.isBatchTracked === true
      }
    });
    res.json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.get('/api/tenant/inventory/warehouses', requireTenantAuth, async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        balances: {
          include: { product: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ warehouses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load warehouses' });
  }
});

app.get('/api/tenant/inventory/stock-ledger', requireTenantAuth, async (req, res) => {
  try {
    const ledger = await prisma.stockLedger.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        product: true,
        warehouse: true
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json({ ledger });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load stock ledger' });
  }
});

app.get('/api/tenant/inventory/serial-numbers', requireTenantAuth, async (req, res) => {
  try {
    const serials = await prisma.serialNumber.findMany({
      where: { product: { tenantId: req.user.tenantId } },
      include: {
        product: true,
        warehouse: true
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json({ serials });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load serial numbers' });
  }
});

// DISPATCH LOGIC
app.post('/api/tenant/inventory/dispatch', requireTenantAuth, async (req, res) => {
  try {
    const { projectId, warehouseId, items, receiverName, notes } = req.body;
    
    // Start transaction for atomic ledger and balance updates
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Dispatch Document
      const count = await tx.materialDispatch.count({ where: { tenantId: req.user.tenantId } });
      const dispatchNumber = `DIS-${(count + 1).toString().padStart(5, '0')}`;
      
      const dispatch = await tx.materialDispatch.create({
        data: {
          tenantId: req.user.tenantId,
          dispatchNumber,
          projectId,
          warehouseId,
          status: 'DISPATCHED',
          receiverName,
          notes,
          items: {
            create: items.map(i => ({
              productId: i.productId,
              quantity: parseFloat(i.quantity),
              serialNumbers: i.serialNumbers || []
            }))
          }
        }
      });
      
      // 2. Process each item
      for (const item of items) {
        const qty = parseFloat(item.quantity);
        
        // 2a. Update StockBalance
        const balance = await tx.stockBalance.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId } }
        });
        
        if (!balance || balance.availableQuantity < qty) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
        
        const newBalance = await tx.stockBalance.update({
          where: { id: balance.id },
          data: {
            quantity: { decrement: qty },
            availableQuantity: { decrement: qty }
          }
        });
        
        // 2b. Add StockLedger entry
        await tx.stockLedger.create({
          data: {
            tenantId: req.user.tenantId,
            productId: item.productId,
            warehouseId,
            movementType: 'DISPATCH',
            quantity: -qty, // Negative for dispatch
            quantityBefore: balance.quantity,
            quantityAfter: newBalance.quantity,
            referenceType: 'DISPATCH',
            referenceId: dispatch.id,
            userId: req.user.id
          }
        });
        
        // 2c. Update Serial Numbers if provided
        if (item.serialNumbers && item.serialNumbers.length > 0) {
          await tx.serialNumber.updateMany({
            where: {
              productId: item.productId,
              serialNumber: { in: item.serialNumbers },
              warehouseId
            },
            data: {
              status: 'INSTALLED',
              projectId,
              warehouseId: null // It left the warehouse
            }
          });
        }
      }
      
      return dispatch;
    });
    
    res.json({ dispatch: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to dispatch material' });
  }
});

// GOODS RECEIPT LOGIC
app.post('/api/tenant/inventory/receipt', requireTenantAuth, async (req, res) => {
  try {
    const { warehouseId, purchaseOrderId, vendor, items } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create GRN
      const count = await tx.goodsReceipt.count({ where: { tenantId: req.user.tenantId } });
      const grnNumber = `GRN-${(count + 1).toString().padStart(5, '0')}`;
      
      const receipt = await tx.goodsReceipt.create({
        data: {
          tenantId: req.user.tenantId,
          grnNumber,
          warehouseId,
          purchaseOrderId,
          vendor,
          status: 'APPROVED',
          items: {
            create: items.map(i => ({
              productId: i.productId,
              receivedQty: parseFloat(i.quantity),
              acceptedQty: parseFloat(i.quantity),
              unitCost: parseFloat(i.unitCost || 0),
              totalCost: parseFloat(i.quantity) * parseFloat(i.unitCost || 0)
            }))
          }
        }
      });
      
      // 2. Process each item
      for (const item of items) {
        const qty = parseFloat(item.quantity);
        const unitCost = parseFloat(item.unitCost || 0);
        
        // 2a. Upsert StockBalance
        const balance = await tx.stockBalance.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId } }
        });
        
        let newQuantity = qty;
        let avgCost = unitCost;
        
        if (balance) {
          newQuantity = balance.quantity + qty;
          // Weighted Average Cost
          const currentTotalValue = balance.quantity * balance.averageCost;
          const newTotalValue = qty * unitCost;
          avgCost = newQuantity > 0 ? (currentTotalValue + newTotalValue) / newQuantity : 0;
          
          await tx.stockBalance.update({
            where: { id: balance.id },
            data: {
              quantity: { increment: qty },
              availableQuantity: { increment: qty },
              averageCost: avgCost
            }
          });
        } else {
          await tx.stockBalance.create({
            data: {
              productId: item.productId,
              warehouseId,
              quantity: qty,
              availableQuantity: qty,
              averageCost: avgCost
            }
          });
        }
        
        // 2b. Add StockLedger entry
        await tx.stockLedger.create({
          data: {
            tenantId: req.user.tenantId,
            productId: item.productId,
            warehouseId,
            movementType: 'RECEIPT',
            quantity: qty, // Positive for receipt
            quantityBefore: balance ? balance.quantity : 0,
            quantityAfter: newQuantity,
            referenceType: 'RECEIPT',
            referenceId: receipt.id,
            userId: req.user.id
          }
        });
        
        // 2c. Insert Serial Numbers if provided
        if (item.serialNumbers && item.serialNumbers.length > 0) {
          const serialsToInsert = item.serialNumbers.map(sn => ({
            productId: item.productId,
            warehouseId,
            serialNumber: sn,
            status: 'AVAILABLE'
          }));
          await tx.serialNumber.createMany({ data: serialsToInsert, skipDuplicates: true });
        }
      }
      
      return receipt;
    });
    
    res.json({ receipt: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to receive goods' });
  }
});



// PROJECTS
app.get('/api/tenant/projects', requireTenantAuth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        projectOwner: true
      }
    });

    const metrics = {
      total: projects.length,
      planning: projects.filter(p => p.currentStage === 'Planning').length,
      inProgress: projects.filter(p => ['Design', 'Procurement', 'Installation', 'Testing'].includes(p.currentStage) && p.status !== 'Delayed').length,
      delayed: projects.filter(p => p.status === 'Delayed').length,
      completed: projects.filter(p => p.currentStage === 'Completed').length,
      totalValue: projects.reduce((acc, p) => acc + (p.estimatedValue || 0), 0),
      totalCost: projects.reduce((acc, p) => acc + (p.actualCost || 0), 0),
      expectedProfit: projects.reduce((acc, p) => acc + ((p.estimatedValue || 0) - (p.estimatedCost || 0)), 0),
    };

    res.json({ projects, metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/tenant/projects', requireTenantAuth, async (req, res) => {
  try {
    const { name, customerId, leadId, quotationId, surveyId, capacity, systemType, projectType, projectOwnerId, installationAddress, city, state, pincode, startDate, expectedCompletionDate, priority, estimatedValue, estimatedCost } = req.body;
    
    // Generate simple project number
    const count = await prisma.project.count({ where: { tenantId: req.user.tenantId } });
    const projectNumber = `PRJ-${(count + 1).toString().padStart(5, '0')}`;

    const project = await prisma.project.create({
      data: {
        tenantId: req.user.tenantId,
        projectNumber,
        name,
        customerId,
        leadId,
        quotationId,
        surveyId,
        capacity: parseFloat(capacity) || null,
        systemType,
        projectType,
        projectOwnerId,
        installationAddress,
        city,
        state,
        pincode,
        startDate: startDate ? new Date(startDate) : null,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
        priority: priority || 'Medium',
        estimatedValue: parseFloat(estimatedValue) || 0,
        estimatedCost: parseFloat(estimatedCost) || 0,
        createdBy: req.user.id
      }
    });

    // Initial Stage History
    await prisma.projectStageHistory.create({
      data: {
        projectId: project.id,
        newStage: 'Planning',
        changedBy: req.user.id,
        comment: 'Project Created'
      }
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/tenant/projects/:id', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        customer: true,
        lead: true,
        quotation: { include: { items: { include: { product: true } } } },
        projectOwner: true,
        tasks: { include: { assignee: true }, orderBy: { createdAt: 'asc' } },
        milestones: { orderBy: { targetDate: 'asc' } },
        materialReqs: { include: { product: true }, orderBy: { createdAt: 'asc' } },
        costs: true,
        stageHistory: { orderBy: { createdAt: 'desc' } },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
        statusUpdates: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

app.patch('/api/tenant/projects/:id', requireTenantAuth, async (req, res) => {
  try {
    const updateData = req.body;
    
    // Prevent changing stage or status via this generic endpoint
    delete updateData.currentStage;
    delete updateData.status;

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.expectedCompletionDate) updateData.expectedCompletionDate = new Date(updateData.expectedCompletionDate);
    if (updateData.actualCompletionDate) updateData.actualCompletionDate = new Date(updateData.actualCompletionDate);
    
    if (updateData.capacity) updateData.capacity = parseFloat(updateData.capacity);
    if (updateData.estimatedValue) updateData.estimatedValue = parseFloat(updateData.estimatedValue);
    if (updateData.estimatedCost) updateData.estimatedCost = parseFloat(updateData.estimatedCost);
    if (updateData.actualCost) updateData.actualCost = parseFloat(updateData.actualCost);
    if (updateData.progressPercent) updateData.progressPercent = parseFloat(updateData.progressPercent);

    const project = await prisma.project.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData
    });
    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.patch('/api/tenant/projects/:id/stage', requireTenantAuth, async (req, res) => {
  try {
    const { newStage, comment } = req.body;
    const project = await prisma.project.findUnique({ where: { id: req.params.id, tenantId: req.user.tenantId } });
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.currentStage === newStage) return res.status(400).json({ error: 'Already in this stage' });

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: { currentStage: newStage }
    });

    await prisma.projectStageHistory.create({
      data: {
        projectId: project.id,
        previousStage: project.currentStage,
        newStage,
        changedBy: req.user.id,
        comment
      }
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: project.id,
        title: `Stage Changed to ${newStage}`,
        description: comment,
        eventType: 'STAGE_CHANGE',
        createdBy: req.user.id
      }
    });

    res.json({ project: updatedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

app.patch('/api/tenant/projects/:id/status', requireTenantAuth, async (req, res) => {
  try {
    const { status, progress, updateText, nextAction } = req.body;
    
    const project = await prisma.project.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { 
        status, 
        ...(progress !== undefined && { progressPercent: parseFloat(progress) }) 
      }
    });

    const statusUpdate = await prisma.projectStatusUpdate.create({
      data: {
        projectId: project.id,
        status,
        progress: progress ? parseFloat(progress) : null,
        updateText,
        nextAction,
        updatedBy: req.user.id
      }
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: project.id,
        title: `Status Updated to ${status}`,
        description: updateText,
        eventType: 'STATUS_UPDATE',
        createdBy: req.user.id
      }
    });

    res.json({ project, statusUpdate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// TASKS
app.post('/api/tenant/projects/:id/tasks', requireTenantAuth, async (req, res) => {
  try {
    const { name, description, priority, dueDate, assigneeId } = req.body;
    
    const task = await prisma.projectTask.create({
      data: {
        projectId: req.params.id,
        name,
        description,
        priority: priority || 'Medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId
      },
      include: { assignee: true }
    });
    
    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tenant/tasks/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, progress } = req.body;
    const task = await prisma.projectTask.update({
      where: { id: req.params.id },
      data: { 
        status, 
        ...(progress !== undefined && { progress: parseFloat(progress) })
      },
      include: { assignee: true }
    });
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// MILESTONES
app.post('/api/tenant/projects/:id/milestones', requireTenantAuth, async (req, res) => {
  try {
    const { name, description, targetDate, responsibleId } = req.body;
    
    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId: req.params.id,
        name,
        description,
        targetDate: targetDate ? new Date(targetDate) : null,
        responsibleId
      }
    });
    
    res.status(201).json({ milestone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

app.patch('/api/tenant/milestones/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, actualDate } = req.body;
    const milestone = await prisma.projectMilestone.update({
      where: { id: req.params.id },
      data: { 
        status,
        actualDate: actualDate ? new Date(actualDate) : null
      }
    });
    res.json({ milestone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// MATERIAL REQS
app.post('/api/tenant/projects/:id/materials', requireTenantAuth, async (req, res) => {
  try {
    const { productId, description, quantity } = req.body;
    
    const material = await prisma.projectMaterialRequirement.create({
      data: {
        projectId: req.params.id,
        productId: productId || null,
        description,
        quantity: parseFloat(quantity) || 1
      },
      include: { product: true }
    });
    
    res.status(201).json({ material });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add material requirement' });
  }
});

app.patch('/api/tenant/materials/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, quantity } = req.body;
    const material = await prisma.projectMaterialRequirement.update({
      where: { id: req.params.id },
      data: { 
        ...(status && { status }),
        ...(quantity && { quantity: parseFloat(quantity) })
      },
      include: { product: true }
    });
    res.json({ material });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update material requirement' });
  }
});


// CUSTOMERS
app.get('/api/tenant/customers', requireTenantAuth, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      include: { lead: true }
    });
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.get('/api/tenant/customers/:id', requireTenantAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { 
        lead: true,
        surveys: true,
        quotations: true,
        projects: true,
        invoices: true,
        tickets: true
      }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

// ----------------------------------------------------
// TENANT ADMIN - PHASE 2: CORE OPERATIONS
// ----------------------------------------------------

// SURVEYS
app.get('/api/tenant/surveys', requireTenantAuth, async (req, res) => {
  try {
    const surveys = await prisma.siteSurvey.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true, lead: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ surveys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

app.post('/api/tenant/surveys', requireTenantAuth, async (req, res) => {
  try {
    const survey = await prisma.siteSurvey.create({
      data: {
        ...req.body,
        tenantId: req.user.tenantId
      }
    });
    res.json({ survey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

app.post('/api/tenant/surveys/:id/photos', requireTenantAuth, upload.array('photos', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await prisma.siteSurvey.findUnique({ where: { id, tenantId: req.user.tenantId } });
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    
    const newPhotos = req.files.map(file => file.path);
    const updatedSurvey = await prisma.siteSurvey.update({
      where: { id },
      data: { photos: { push: newPhotos } }
    });
    
    res.json({ message: 'Photos uploaded successfully', photos: updatedSurvey.photos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});


// QUOTATIONS
app.get('/api/tenant/quotations', requireTenantAuth, async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ quotations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

app.post('/api/tenant/quotations', requireTenantAuth, async (req, res) => {
  try {
    const quotation = await prisma.quotation.create({
      data: {
        ...req.body,
        qNumber: `QT-${Date.now()}`,
        tenantId: req.user.tenantId
      }
    });
    res.json({ quotation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

app.post('/api/tenant/quotations/:id/convert', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const quotation = await prisma.quotation.findUnique({ where: { id, tenantId } });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    // Mark Quotation as ACCEPTED
    await prisma.quotation.update({
      where: { id, tenantId },
      data: { status: 'ACCEPTED' }
    });

    // Create Project
    const project = await prisma.project.create({
      data: {
        tenantId,
        quotationId: id,
        customerId: quotation.customerId,
        leadId: quotation.leadId,
        name: `PRJ-${quotation.qNumber}`,
        status: 'PLANNING',
      }
    });

    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to convert quotation to project' });
  }
});

app.use('/api/tenant/installations', requireTenantAuth, tenantInstallationsRoutes);

// PROJECTS
app.get('/api/tenant/projects', requireTenantAuth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/tenant/projects', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.create({
      data: {
        ...req.body,
        tenantId: req.user.tenantId
      }
    });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/tenant/projects/:id', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { 
        customer: true,
        tasks: true,
        purchaseOrders: true,
        invoices: true
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.patch('/api/tenant/projects/:id/status', requireTenantAuth, async (req, res) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { status: req.body.status }
    });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

// TASKS
app.get('/api/tenant/tasks', requireTenantAuth, async (req, res) => {
  try {
    const tasks = await prisma.projectTask.findMany({
      where: { project: { tenantId: req.user.tenantId } },
      include: { project: true, assignee: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tenant/tasks', requireTenantAuth, async (req, res) => {
  try {
    const task = await prisma.projectTask.create({
      data: req.body
    });
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// INVENTORY (PRODUCTS)
app.get('/api/tenant/inventory', requireTenantAuth, async (req, res) => {
  try {
    const inventory = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.post('/api/tenant/inventory', requireTenantAuth, async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: {
        ...req.body,
        currentStock: req.body.stock,
        tenantId: req.user.tenantId
      }
    });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// PROCUREMENT (PURCHASE ORDERS)
app.get('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const procurement = await prisma.purchaseOrder.findMany({
      where: { tenantId: req.user.tenantId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ procurement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

app.post('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: req.user.tenantId,
        poNumber: `PO-${Date.now()}`,
        vendor: req.body.supplier,
        status: req.body.status,
        items: {
          create: [{
            productId: req.body.productId,
            quantity: req.body.qty
          }]
        }
      },
      include: { items: true }
    });
    res.json({ procurement: po });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// FINANCE (INVOICES)
app.get('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    const finance = await prisma.invoice.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true, project: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ finance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.post('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: req.user.tenantId,
        invoiceNumber: `INV-${Date.now()}`,
        customerId: req.body.customerId,
        projectId: req.body.projectId || null,
        amount: req.body.amount,
        status: req.body.status
      },
      include: { customer: true, project: true }
    });
    res.json({ finance: invoice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// SERVICE (SUPPORT TICKETS)
app.get('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const service = await prisma.supportTicket.findMany({
      where: { tenantId: req.user.tenantId },
      include: { customer: true, project: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

app.post('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: req.body.customerId,
        projectId: req.body.projectId || null,
        subject: req.body.subject,
        priority: req.body.priority,
        status: req.body.status
      },
      include: { customer: true, project: true }
    });
    res.json({ service: ticket });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// ----------------------------------------------------
// TENANT ADMIN - TRANSITION APIs (THE ERP WORKFLOW)
// ----------------------------------------------------

// 1. Customer -> Survey
app.post('/api/tenant/customers/:id/survey', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const customer = await prisma.customer.findUnique({ where: { id, tenantId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const survey = await prisma.siteSurvey.create({
      data: {
        tenantId,
        customerId: id,
        leadId: customer.leadId,
        status: 'SCHEDULED',
        surveyDate: req.body.surveyDate ? new Date(req.body.surveyDate) : new Date(),
        notes: req.body.notes || 'Survey created from customer'
      }
    });
    res.json({ survey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// 2. Survey -> Quotation
app.post('/api/tenant/surveys/:id/quote', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const survey = await prisma.siteSurvey.findUnique({ where: { id, tenantId } });
    if (!survey) return res.status(404).json({ error: 'Survey not found' });

    const quotation = await prisma.quotation.create({
      data: {
        tenantId,
        customerId: survey.customerId,
        leadId: survey.leadId,
        qNumber: `QT-${Date.now()}`,
        status: 'DRAFT',
        subtotal: req.body.subtotal || 0,
        tax: req.body.tax || 0,
        discount: req.body.discount || 0,
        total: (req.body.subtotal || 0) + (req.body.tax || 0) - (req.body.discount || 0)
      }
    });
    res.json({ quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

// 3. Quotation -> Project
app.post('/api/tenant/quotations/:id/project', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const quote = await prisma.quotation.findUnique({ where: { id, tenantId }, include: { customer: true } });
    if (!quote) return res.status(404).json({ error: 'Quotation not found' });

    // Mark quote as ACCEPTED
    await prisma.quotation.update({ where: { id }, data: { status: 'ACCEPTED' } });

    const project = await prisma.project.create({
      data: {
        tenantId,
        customerId: quote.customerId,
        leadId: quote.leadId,
        quotationId: quote.id,
        name: `${quote.customer?.name || 'Customer'} - Project`,
        status: 'PLANNING'
      }
    });
    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// 4. Project -> Invoice
app.post('/api/tenant/projects/:id/invoice', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const project = await prisma.project.findUnique({ where: { id, tenantId }, include: { quotation: true } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!project.customerId) return res.status(400).json({ error: 'Project has no customer attached' });

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        projectId: id,
        customerId: project.customerId,
        invoiceNumber: `INV-${Date.now()}`,
        amount: project.quotation?.total || req.body.amount || 0,
        status: 'UNPAID'
      }
    });
    res.json({ invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// ----------------------------------------------------
// TENANT ADMIN - PHASE 4 & 5: FINAL OPERATIONS
// ----------------------------------------------------

// INVENTORY (Products)
app.get('/api/tenant/inventory', requireTenantAuth, async (req, res) => {
  try {
    const inventory = await prisma.product.findMany({ where: { tenantId: req.user.tenantId } });
    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});
app.post('/api/tenant/inventory', requireTenantAuth, async (req, res) => {
  try {
    const item = await prisma.product.create({
      data: { ...req.body, tenantId: req.user.tenantId }
    });
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PROCUREMENT
app.get('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    const procurement = await prisma.purchaseOrder.findMany({ where: { tenantId: req.user.tenantId } });
    res.json({ procurement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch POs' });
  }
});
app.post('/api/tenant/procurement', requireTenantAuth, async (req, res) => {
  try {
    // We map frontend simpler request to the schema
    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: req.user.tenantId,
        poNumber: `PO-${Date.now()}`,
        vendor: req.body.supplier || 'Vendor',
        status: req.body.status || 'ORDERED'
      }
    });
    res.json({ po });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create PO' });
  }
});

// FINANCE (Invoices)
app.get('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    const finance = await prisma.invoice.findMany({ 
      where: { tenantId: req.user.tenantId },
      include: { customer: true, project: true }
    });
    // Map to frontend expected shape temporarily while UI updates
    const mapped = finance.map(f => ({
      id: f.invoiceNumber,
      customer: f.customer?.name || 'Unknown',
      project: f.project?.name || 'General',
      date: f.date,
      amount: f.amount,
      status: f.status
    }));
    res.json({ finance: mapped });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});
app.post('/api/tenant/finance', requireTenantAuth, async (req, res) => {
  try {
    // If no customerId provided from the old frontend form, create a dummy or fail.
    // We'll return 400 for safety, as we expect the new frontend to pass it.
    if (!req.body.customerId) return res.status(400).json({ error: 'customerId required' });
    
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: req.body.customerId,
        projectId: req.body.projectId,
        invoiceNumber: `INV-${Date.now()}`,
        amount: req.body.amount || 0,
        status: req.body.status || 'UNPAID'
      }
    });
    res.json({ invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// SERVICE / TICKETS
app.get('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const service = await prisma.supportTicket.findMany({ 
      where: { tenantId: req.user.tenantId },
      include: { customer: true }
    });
    // Map to frontend expected shape
    const mapped = service.map(s => ({
      id: s.id,
      customer: s.customer?.name || 'Unknown',
      issue: s.subject || s.description,
      status: s.status,
      priority: s.priority,
      date: s.createdAt
    }));
    res.json({ service: mapped });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});
app.post('/api/tenant/service', requireTenantAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: req.user.tenantId,
        customerId: req.body.customerId,
        subject: req.body.issue || 'Service Issue',
        priority: req.body.priority || 'MEDIUM',
        status: req.body.status || 'OPEN'
      }
    });
    res.json({ ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// DASHBOARD
app.get('/api/tenant/dashboard', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [totalLeads, totalCustomers, totalProjects, pendingInvoices, openTickets, revenueData, invoices] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.project.count({ where: { tenantId, status: { notIn: ['COMPLETED', 'HANDOVER'] } } }),
      prisma.invoice.count({ where: { tenantId, status: 'UNPAID' } }),
      prisma.supportTicket.count({ where: { tenantId, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: 'UNPAID' },
        _sum: { amount: true }
      })
    ]);
    
    res.json({
      totalLeads,
      totalCustomers,
      totalProjects,
      pendingInvoices,
      openTickets,
      totalRevenue: revenueData._sum.amount || 0,
      outstanding: invoices._sum.amount || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Solar ERP Backend running on port ${PORT}`);
  });
}

module.exports = app;
