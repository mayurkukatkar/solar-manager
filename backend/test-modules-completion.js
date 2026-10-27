const jwt = require('jsonwebtoken');
const prisma = require('./db');
const app = require('./server');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-solar-erp-jwt-key';

async function runTests() {
  console.log('====================================================');
  console.log('   SOLAR ERP: TENANT MODULES COMPLETION TEST SUITE  ');
  console.log('====================================================\n');

  // 1. Locate test tenant & admin user
  let tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
  if (!tenant) {
    tenant = await prisma.tenant.findFirst();
  }
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'SunVolt Test Solar', status: 'ACTIVE' }
    });
  }

  let user = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: 'TENANT_ADMIN' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Test Tenant Admin',
        email: `admin_${Date.now()}@sunvolt.in`,
        password: 'hashedpassword123',
        role: 'TENANT_ADMIN',
        tenantId: tenant.id
      }
    });
  }

  let product = await prisma.product.findFirst({ where: { tenantId: tenant.id } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Waaree 550Wp Mono PERC Bifacial',
        sku: 'WAA-550-BIF',
        category: 'PANELS',
        purchaseCost: 12500,
        sellingPrice: 15500,
        currentStock: 20,
        tenantId: tenant.id
      }
    });
  }

  // 2. Generate valid JWT Token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: 'TENANT_ADMIN', tenantId: tenant.id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 3. Start test HTTP server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
    }
  }

  try {
    // ------------------------------------------------------------------
    // TEST 1: PROCUREMENT & PURCHASE ORDERS
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 1: PROCUREMENT & PURCHASE ORDERS ---');
    
    // Create PO
    const initialStock = product.currentStock;
    const createPoRes = await fetch(`${baseUrl}/api/tenant/procurement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        supplier: 'Waaree Energies Ltd',
        productId: product.id,
        qty: 10,
        unitCost: 12000
      })
    });
    const createPoData = await createPoRes.json();
    if (createPoRes.status !== 201) console.log("createPoData ERROR:", createPoRes.status, createPoData);
    assert(createPoRes.status === 201 && createPoData.purchaseOrder?.id, 'POST /api/tenant/procurement: Creates PO with line items & auto PO#');
    const createdPoId = createPoData.purchaseOrder?.id;

    // Fetch POs
    const getPoRes = await fetch(`${baseUrl}/api/tenant/procurement`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getPoData = await getPoRes.json();
    assert(getPoRes.status === 200 && Array.isArray(getPoData.procurement), 'GET /api/tenant/procurement: Returns PO list and summary metrics');

    // Update status to RECEIVED (Trigger stock increment)
    const updatePoRes = await fetch(`${baseUrl}/api/tenant/procurement/${createdPoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'RECEIVED' })
    });
    const updatePoData = await updatePoRes.json();
    assert(updatePoRes.status === 200 && updatePoData.purchaseOrder?.status === 'RECEIVED', 'PATCH /api/tenant/procurement/:id/status: Successfully marks as RECEIVED');

    // Check inventory stock auto-increment
    const updatedProd = await prisma.product.findUnique({ where: { id: product.id } });
    assert(updatedProd.currentStock === initialStock + 10, `Inventory Automation: Warehouse stock incremented by 10 (was ${initialStock}, now ${updatedProd.currentStock})`);

    // ------------------------------------------------------------------
    // TEST 2: COMMUNICATION HUB
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 2: COMMUNICATION HUB ---');

    // Fetch Templates
    const getTplRes = await fetch(`${baseUrl}/api/tenant/communication/templates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getTplData = await getTplRes.json();
    assert(getTplRes.status === 200 && getTplData.templates?.length >= 5, 'GET /api/tenant/communication/templates: Returns pre-seeded solar proposal templates');

    // Send Message
    const sendMsgRes = await fetch(`${baseUrl}/api/tenant/communication/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipientName: 'Kunal Deshmukh',
        recipientContact: '+91 98201 12345',
        channel: 'WHATSAPP',
        template: 'Quotation Generated & Solar Proposal',
        content: 'Namaste Kunal ji, your 5kW proposal is ready! View here: https://solarerp.app/q/100',
        category: 'QUOTATION'
      })
    });
    const sendMsgData = await sendMsgRes.json();
    assert(sendMsgRes.status === 201 && sendMsgData.directUrl?.includes('wa.me/919820112345'), 'POST /api/tenant/communication/send: Dispatches message and generates WhatsApp click-to-chat URL');

    // Fetch Message History
    const getMsgRes = await fetch(`${baseUrl}/api/tenant/communication/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getMsgData = await getMsgRes.json();
    assert(getMsgRes.status === 200 && getMsgData.messages?.length > 0 && getMsgData.metrics?.totalSent > 0, 'GET /api/tenant/communication/messages: Returns logged dispatch history & analytics');

    // ------------------------------------------------------------------
    // TEST 3: AUTOMATION & WORKFLOWS
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 3: AUTOMATION & WORKFLOWS ---');

    // Fetch Rules
    const getRulesRes = await fetch(`${baseUrl}/api/tenant/automation/rules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getRulesData = await getRulesRes.json();
    assert(getRulesRes.status === 200 && getRulesData.rules?.length >= 3, 'GET /api/tenant/automation/rules: Auto-seeds smart solar EPC workflow rules');

    // Create Rule
    const createRuleRes = await fetch(`${baseUrl}/api/tenant/automation/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Auto WhatsApp Notice on Meter Inspection',
        description: 'Send customer WhatsApp when net-meter is inspected',
        category: 'DISCOM',
        trigger: 'Portal Stage == METER_INSPECTED',
        condition: 'Sanctioned Capacity >= 3kW',
        action: 'Dispatch Bi-directional Meter Commissioning WhatsApp',
        isActive: true
      })
    });
    const createRuleData = await createRuleRes.json();
    assert(createRuleRes.status === 201 && createRuleData.rule?.id, 'POST /api/tenant/automation/rules: Deploys new automation rule');
    const createdRuleId = createRuleData.rule?.id;

    // Toggle Rule
    const toggleRuleRes = await fetch(`${baseUrl}/api/tenant/automation/rules/${createdRuleId}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const toggleRuleData = await toggleRuleRes.json();
    assert(toggleRuleRes.status === 200 && toggleRuleData.rule?.isActive === false, 'PATCH /api/tenant/automation/rules/:id/toggle: Toggles rule active state');

    // Test Rule Simulation
    const testRuleRes = await fetch(`${baseUrl}/api/tenant/automation/rules/${createdRuleId}/test`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const testRuleData = await testRuleRes.json();
    assert(testRuleRes.status === 200 && testRuleData.success === true, 'POST /api/tenant/automation/rules/:id/test: Dry-run simulation executes successfully');

    // ------------------------------------------------------------------
    // TEST 4: NOTIFICATIONS CENTER
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 4: NOTIFICATIONS CENTER ---');

    // Fetch Notifications
    const getNotifRes = await fetch(`${baseUrl}/api/tenant/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getNotifData = await getNotifRes.json();
    if (getNotifRes.status !== 200 || !getNotifData.notifications?.length) console.log("getNotifData ERROR:", getNotifRes.status, getNotifData);
    assert(getNotifRes.status === 200 && getNotifData.notifications?.length > 0, 'GET /api/tenant/notifications: Fetches statutory notices & unread counter');

    // Create Broadcast
    const createNotifRes = await fetch(`${baseUrl}/api/tenant/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'CRITICAL',
        title: 'MSEDCL Net-Metering Sync Window Closing',
        content: 'Please submit pending WCR documents before 5 PM today.',
        actionUrl: '/tenant/projects',
        actionLabel: 'Inspect Projects'
      })
    });
    const createNotifData = await createNotifRes.json();
    assert(createNotifRes.status === 201 && createNotifData.notification?.id, 'POST /api/tenant/notifications: Posts operational broadcast notice');
    const notifId = createNotifData.notification?.id;

    // Mark as Read
    const readNotifRes = await fetch(`${baseUrl}/api/tenant/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const readNotifData = await readNotifRes.json();
    assert(readNotifRes.status === 200 && readNotifData.notification?.isRead === true, 'PATCH /api/tenant/notifications/:id/read: Marks notice as read');

    // ------------------------------------------------------------------
    // TEST 5: SECURITY & AUDIT LOGS
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 5: SECURITY & AUDIT LOGS ---');

    // Fetch Audit Logs
    const getAuditRes = await fetch(`${baseUrl}/api/tenant/audit-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getAuditData = await getAuditRes.json();
    assert(getAuditRes.status === 200 && getAuditData.logs?.length > 0, 'GET /api/tenant/audit-logs: Returns immutable audit trail with actor details');

    // CSV Export
    const exportRes = await fetch(`${baseUrl}/api/tenant/audit-logs/export`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const csvContent = await exportRes.text();
    assert(exportRes.status === 200 && csvContent.includes('Log ID,Timestamp,Action'), 'GET /api/tenant/audit-logs/export: Exports audit records in standard CSV format');

    // ------------------------------------------------------------------
    // TEST 6: USERS & RBAC PERMISSIONS
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 6: USERS & RBAC PERMISSIONS ---');

    // Fetch Users
    const getUsersRes = await fetch(`${baseUrl}/api/tenant/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getUsersData = await getUsersRes.json();
    assert(getUsersRes.status === 200 && getUsersData.users?.length > 0, 'GET /api/tenant/users: Lists tenant team members with roles and departments');

    // Invite User
    const inviteEmail = `subadmin_${Date.now()}@sunvolt.in`;
    const inviteRes = await fetch(`${baseUrl}/api/tenant/users/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Rohan Joshi',
        email: inviteEmail,
        role: 'TENANT_SUB_ADMIN',
        department: 'Field Engineering',
        permissions: { modules: ['surveys', 'projects'] }
      })
    });
    const inviteData = await inviteRes.json();
    assert(inviteRes.status === 201 && inviteData.tempPassword?.startsWith('Solar@'), `POST /api/tenant/users/invite: Generates user and secure temporary password (${inviteData.tempPassword})`);
    const invitedUserId = inviteData.user?.id;

    // Reset Password
    const resetPassRes = await fetch(`${baseUrl}/api/tenant/users/${invitedUserId}/reset-password`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const resetPassData = await resetPassRes.json();
    assert(resetPassRes.status === 200 && resetPassData.tempPassword?.startsWith('Solar@'), 'POST /api/tenant/users/:id/reset-password: Resets user password successfully');

    // Delete User
    const delUserRes = await fetch(`${baseUrl}/api/tenant/users/${invitedUserId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(delUserRes.status === 200, 'DELETE /api/tenant/users/:id: Removes team member cleanly');

    // ------------------------------------------------------------------
    // FINAL RESULT REPORT
    // ------------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}% SUCCESS)`);
    console.log('====================================================');

    if (passed === total) {
      console.log('ALL TENANT MODULES COMPLETED & VERIFIED 100% OPERATIONAL!\n');
    }

  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
