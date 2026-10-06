const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// AUTH
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// SUPER ADMIN
const superAdminRoutes = require('./routes/admin/superAdmin');
app.use('/api/super-admin', superAdminRoutes);

// TENANT - CRM & Inventory (Leads, Products, Customers, Inventory Management)
const crmRoutes = require('./routes/tenant/crm');
app.use('/', crmRoutes);

// TENANT - Operations (Surveys, Quotations, Installations)
const operationsRoutes = require('./routes/tenant/operations');
app.use('/', operationsRoutes);

// TENANT - Workflow Transitions (Lead→Customer→Survey→Quote→Project→Invoice)
const workflowRoutes = require('./routes/tenant/workflow');
app.use('/', workflowRoutes);

// TENANT - Finance, Payments, Procurement, Service, Dashboard, Warehouses, Tasks
const financeRoutes = require('./routes/tenant/finance');
app.use('/', financeRoutes);
const documentsRoutes = require('./routes/tenant/documents');
app.use('/', documentsRoutes);

// TENANT - Subsidy Applications
const subsidyRoutes = require('./routes/tenant/subsidy');
app.use('/', subsidyRoutes);

// TENANT - Loan Applications
const loanRoutes = require('./routes/tenant/loans');
app.use('/', loanRoutes);

// TENANT - AMC Contracts
const amcRoutes = require('./routes/tenant/amc');
app.use('/', amcRoutes);

// TENANT - Staff Management
const staffRoutes = require('./routes/tenant/staff');
app.use('/', staffRoutes);

// TENANT - Settings, Audit Logs, Notifications
const settingsRoutes = require('./routes/tenant/settings');
app.use('/', settingsRoutes);
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Solar ERP Backend running on port ${PORT}`);
  });
}

module.exports = app;
