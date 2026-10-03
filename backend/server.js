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

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);


const superAdminRoutes = require('./routes/admin/superAdmin');
app.use('/api/super-admin', superAdminRoutes);
const dashboardRoutes = require('./routes/tenant/dashboard');
app.use('/api/tenant', dashboardRoutes);
// ----------------------------------------------------
const crmRoutes = require('./routes/tenant/crm');
app.use('/api/tenant', crmRoutes);
const operationsRoutes = require('./routes/tenant/operations');
app.use('/api/tenant', operationsRoutes);
const workflowRoutes = require('./routes/tenant/workflow');
app.use('/api/tenant', workflowRoutes);
const financeRoutes = require('./routes/tenant/finance');
app.use('/api/tenant', financeRoutes);
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Solar ERP Backend running on port ${PORT}`);
  });
}

module.exports = app;
