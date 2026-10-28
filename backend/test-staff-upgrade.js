const jwt = require('jsonwebtoken');
const prisma = require('./db');
const app = require('./server');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-solar-erp-jwt-key';

let server;
let baseUrl;
let authToken;
let tenantId;
let adminUserId;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('   WHEREREADY SOLAR OS — STAFF MANAGEMENT INTEGRATION TESTS     ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} — ${details}`);
      failed++;
    }
  }

  try {
    // 1. Setup Tenant and Admin User
    const tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
    if (!tenant) throw new Error('No active tenant found');
    tenantId = tenant.id;

    const user = await prisma.user.findFirst({ where: { tenantId, role: 'TENANT_ADMIN' } });
    if (!user) throw new Error('No tenant admin user found');
    adminUserId = user.id;

    authToken = jwt.sign(
      { userId: user.id, id: user.id, email: user.email, role: 'TENANT_ADMIN', tenantId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Start temporary HTTP server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on port ${port} for Tenant: ${tenant.name}\n`);

    // TEST 1: GET /api/tenant/staff/overview
    console.log('--- TEST GROUP 1: WORKFORCE OVERVIEW METRICS ---');
    const overviewRes = await request('GET', '/api/tenant/staff/overview');
    assert('Overview endpoint returns 200', overviewRes.status === 200);
    assert('Overview contains totalStaff metric', typeof overviewRes.body?.metrics?.totalStaff === 'number');
    assert('Overview contains activeStaff metric', typeof overviewRes.body?.metrics?.activeStaff === 'number');
    assert('Overview contains departmentDistribution array', Array.isArray(overviewRes.body?.metrics?.departmentDistribution));
    assert('Overview contains employmentTypes breakdown', typeof overviewRes.body?.metrics?.employmentTypes === 'object');

    // TEST 2: GET /api/tenant/staff (Directory with search & filters)
    console.log('\n--- TEST GROUP 2: DIRECTORY LISTING & FILTERING ---');
    const dirRes = await request('GET', '/api/tenant/staff?page=1&limit=10');
    assert('Directory endpoint returns 200', dirRes.status === 200);
    assert('Directory returns paginated staff array', Array.isArray(dirRes.body?.staff));
    assert('Directory returns pagination metadata', typeof dirRes.body?.pagination?.totalPages === 'number');

    // Search by designation or name
    const searchRes = await request('GET', '/api/tenant/staff?search=Engineer');
    assert('Search query returns 200', searchRes.status === 200);
    assert('Search filters staff list', Array.isArray(searchRes.body?.staff));

    // TEST 3: POST /api/tenant/staff (Create Staff Member)
    console.log('\n--- TEST GROUP 3: ADD STAFF GUIDED WORKFLOW ---');
    const testEmpId = `TEST-EMP-${Date.now().toString().slice(-4)}`;
    const testEmail = `tech_${Date.now()}@testsolar.in`;

    const createRes = await request('POST', '/api/tenant/staff', {
      name: 'Aditya Kothari',
      employeeId: testEmpId,
      department: 'Project Execution & Installation',
      designation: 'Senior Commissioning Engineer',
      email: testEmail,
      phone: '+91 98990 12345',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      workLocation: 'Pune City Base',
      skills: ['Inverter Commissioning', 'HT/LT Electrical License', 'Safety at Heights'],
      createSystemAccount: true,
      systemRole: 'TENANT_SUB_ADMIN',
      permissions: ['projects', 'surveys']
    });

    assert('Staff creation returns 201 Created', createRes.status === 201);
    assert('Created staff has assigned employeeId', createRes.body?.staff?.employeeId === testEmpId);
    assert('Created staff generated temp password', typeof createRes.body?.tempPassword === 'string');
    const createdStaffId = createRes.body?.staff?.id;

    // TEST 4: Duplicate Employee ID Rejection
    const dupRes = await request('POST', '/api/tenant/staff', {
      name: 'Duplicate Worker',
      employeeId: testEmpId,
      department: 'Warehouse & Logistics',
      designation: 'Helper'
    });
    assert('Duplicate Employee ID is rejected with 409', dupRes.status === 409);

    // TEST 5: GET /api/tenant/staff/:id (Profile Detail)
    console.log('\n--- TEST GROUP 4: STAFF PROFILE & RELATIONSHIPS ---');
    const profileRes = await request('GET', `/api/tenant/staff/${createdStaffId}`);
    assert('Profile detail returns 200', profileRes.status === 200);
    assert('Profile includes correct employee details', profileRes.body?.member?.name === 'Aditya Kothari');
    assert('Profile includes linked user account', profileRes.body?.member?.user?.email === testEmail);
    assert('Profile includes audit logs', Array.isArray(profileRes.body?.auditLogs));

    // TEST 6: PATCH /api/tenant/staff/:id (Edit Details)
    console.log('\n--- TEST GROUP 5: EDITING & MANAGER CYCLE PREVENTION ---');
    const editRes = await request('PATCH', `/api/tenant/staff/${createdStaffId}`, {
      designation: 'Lead Inverter Specialist',
      phone: '+91 98990 99999'
    });
    assert('Staff update returns 200', editRes.status === 200);
    assert('Designation updated in database', editRes.body?.staff?.designation === 'Lead Inverter Specialist');

    // Self-reporting prevention
    const cycleRes = await request('PATCH', `/api/tenant/staff/${createdStaffId}`, {
      managerId: createdStaffId
    });
    assert('Self-reporting manager assignment is rejected with 400', cycleRes.status === 400);

    // TEST 7: Project Assignment
    console.log('\n--- TEST GROUP 6: PROJECT ASSIGNMENTS ---');
    const existingProject = await prisma.project.findFirst({ where: { tenantId } });
    if (existingProject) {
      const assignRes = await request('POST', `/api/tenant/staff/${createdStaffId}/assign-project`, {
        projectId: existingProject.id,
        role: 'SITE_ENGINEER',
        notes: 'Lead engineer for rooftop installation'
      });
      assert('Assigning staff to project returns 200', assignRes.status === 200);
      assert('Assignment recorded with correct role', assignRes.body?.assignment?.role === 'SITE_ENGINEER');

      // Unassign project
      const unassignRes = await request('DELETE', `/api/tenant/staff/${createdStaffId}/assign-project/${existingProject.id}`);
      assert('Unassigning staff from project returns 200', unassignRes.status === 200);
    } else {
      console.log('  [SKIP] No project available in tenant to test project assignment');
    }

    // TEST 8: Status Lifecycle & Deactivation
    console.log('\n--- TEST GROUP 7: LIFECYCLE & DEACTIVATION ---');
    const statusRes = await request('PATCH', `/api/tenant/staff/${createdStaffId}/status`, {
      status: 'ON_LEAVE'
    });
    assert('Status update to ON_LEAVE returns 200', statusRes.status === 200);
    assert('Status persisted as ON_LEAVE', statusRes.body?.staff?.status === 'ON_LEAVE');

    // Revoke system login
    const revokeRes = await request('DELETE', `/api/tenant/staff/${createdStaffId}/account`);
    assert('Revoking login access returns 200', revokeRes.status === 200);

    // Verify staff profile still exists after login access revocation
    const checkStaffRes = await request('GET', `/api/tenant/staff/${createdStaffId}`);
    assert('Staff profile is preserved after login revocation', checkStaffRes.status === 200);
    assert('Staff userId is now null', checkStaffRes.body?.member?.userId === null);

    // Clean deletion of test staff
    const deleteRes = await request('DELETE', `/api/tenant/staff/${createdStaffId}`);
    assert('Safe deletion returns 200', deleteRes.status === 200);

    // TEST 9: Department APIs
    console.log('\n--- TEST GROUP 8: DEPARTMENTS & DESIGNATIONS ---');
    const deptsRes = await request('GET', '/api/tenant/departments');
    assert('GET departments returns 200', deptsRes.status === 200);
    assert('Departments list is populated', Array.isArray(deptsRes.body?.departments) && deptsRes.body?.departments.length > 0);

  } catch (err) {
    console.error('Fatal error during test suite:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
