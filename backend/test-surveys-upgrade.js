const jwt = require('jsonwebtoken');
const prisma = require('./db');
const app = require('./server');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-solar-erp-jwt-key';

async function runSurveyTests() {
  console.log('====================================================');
  console.log('   SOLAR ERP: SITE SURVEY MODULE UPGRADE TEST SUITE ');
  console.log('====================================================\n');

  // 1. Locate test tenant & admin user
  let tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
  if (!tenant) tenant = await prisma.tenant.findFirst();
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

  const token = jwt.sign(
    { id: user.id, email: user.email, role: 'TENANT_ADMIN', tenantId: tenant.id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

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
    // ----------------------------------------------------
    // TEST 1: GET /api/tenant/surveys/engineers
    // ----------------------------------------------------
    console.log('--- TEST 1: SURVEY ENGINEERS DIRECTORY ---');
    const engRes = await fetch(`${baseUrl}/api/tenant/surveys/engineers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const engData = await engRes.json();
    assert(engRes.status === 200 && Array.isArray(engData.engineers), 'GET /api/tenant/surveys/engineers: Lists eligible field engineers');

    // ----------------------------------------------------
    // TEST 2: POST /api/tenant/surveys (Schedule Survey)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: SCHEDULE SURVEY & AUTO-SIZING ---');
    const createRes = await fetch(`${baseUrl}/api/tenant/surveys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        customerName: 'Vikramaditya Singhania',
        phone: '+91 98234 56789',
        address: 'Bungalow 7, Koregaon Park',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        proposedCap: 6.0,
        roofType: 'RCC Flat Roof',
        totalRoofArea: 900,
        usableShadowFreeArea: 650,
        discomName: 'MSEDCL',
        discomConsumerNo: '028540918231',
        sanctionedLoad: 7.5,
        electricalPhase: 'Three Phase',
        avgMonthlyBill: 7200,
        avgMonthlyUnits: 750,
        notes: 'Client requests 7.5ft elevated structure for rooftop terrace.'
      })
    });
    const createData = await createRes.json();
    const survey = createData.survey;
    assert(createRes.status === 201 && survey?.id, 'POST /api/tenant/surveys: Creates survey with auto-generated ID');
    assert(survey?.surveyNumber?.startsWith('SRV-'), `Survey Number formatted properly (${survey?.surveyNumber})`);
    assert(survey?.recommendedCapacity > 0, `Auto-sizing computed: ${survey?.recommendedCapacity} kWp`);
    assert(survey?.estimatedAnnualUnits > 0 && survey?.estimatedAnnualSavings > 0, `Annual yield & savings calculated (${survey?.estimatedAnnualUnits} kWh, ₹${survey?.estimatedAnnualSavings})`);

    // ----------------------------------------------------
    // TEST 3: GET /api/tenant/surveys (List & Metrics)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: SURVEYS LISTING & METRICS ---');
    const listRes = await fetch(`${baseUrl}/api/tenant/surveys`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    assert(listRes.status === 200 && Array.isArray(listData.surveys), 'GET /api/tenant/surveys: Returns surveys list');
    assert(listData.metrics?.totalSurveys >= 1 && listData.metrics?.totalFeasibleKw >= 0, 'GET /api/tenant/surveys: Computes executive feasibility metrics');

    // ----------------------------------------------------
    // TEST 4: GET /api/tenant/surveys/:id (Detail View)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: SURVEY DETAIL DOSSIER ---');
    const detailRes = await fetch(`${baseUrl}/api/tenant/surveys/${survey.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const detailData = await detailRes.json();
    assert(detailRes.status === 200 && detailData.survey?.id === survey.id, 'GET /api/tenant/surveys/:id: Returns full technical dossier');

    // ----------------------------------------------------
    // TEST 5: PATCH /api/tenant/surveys/:id (Update Technicals)
    // ----------------------------------------------------
    console.log('\n--- TEST 5: UPDATE TECHNICAL ASSESSMENT ---');
    const updateRes = await fetch(`${baseUrl}/api/tenant/surveys/${survey.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tiltAngle: 18.5,
        azimuthAngle: 180,
        parapetHeight: 3.5,
        structurePreference: 'Elevated 7ft Superstructure',
        roofObstacles: ['Water Storage Tank', 'Staircase Mumty'],
        cableRunRoofToMeter: 28,
        inverterLocation: 'Rooftop Covered Canopy',
        earthPitFeasibility: 'Space Available for 3 Pits',
        feasibilityVerdict: 'FEASIBLE',
        feasibilityNotes: 'Excellent south facing orientation. Zero shade on main array.'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200 && updateData.survey?.tiltAngle === 18.5, 'PATCH /api/tenant/surveys/:id: Updates tilt angle and obstacles');
    assert(updateData.survey?.structurePreference === 'Elevated 7ft Superstructure', 'PATCH /api/tenant/surveys/:id: Updates structure preference');

    // ----------------------------------------------------
    // TEST 6: PATCH /api/tenant/surveys/:id/status (Lifecycle)
    // ----------------------------------------------------
    console.log('\n--- TEST 6: STATUS LIFECYCLE TRANSITION ---');
    const statusRes = await fetch(`${baseUrl}/api/tenant/surveys/${survey.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'APPROVED',
        feasibilityVerdict: 'FEASIBLE'
      })
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200 && statusData.survey?.status === 'APPROVED', 'PATCH /api/tenant/surveys/:id/status: Successfully transitions status to APPROVED');

    // ----------------------------------------------------
    // TEST 7: POST /api/tenant/surveys/:id/convert-to-quote (One-Click Quote)
    // ----------------------------------------------------
    console.log('\n--- TEST 7: ONE-CLICK CONVERT TO QUOTATION ---');
    const quoteRes = await fetch(`${baseUrl}/api/tenant/surveys/${survey.id}/convert-to-quote`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const quoteData = await quoteRes.json();
    assert(quoteRes.status === 201 && quoteData.quotation?.qNumber, `POST /api/tenant/surveys/:id/convert-to-quote: Generated Quotation ${quoteData.quotation?.qNumber}`);
    assert(quoteData.quotation?.surveyId === survey.id, 'Quotation is bi-directionally linked to Site Survey via surveyId');
    assert(quoteData.quotation?.panelQuantity > 0, `Itemized panels calculated: ${quoteData.quotation?.panelQuantity} x ${quoteData.quotation?.panelWattage}Wp`);

    // ----------------------------------------------------
    // TEST 8: CLEANUP
    // ----------------------------------------------------
    console.log('\n--- TEST 8: SURVEY RECORD CLEANUP ---');
    const delRes = await fetch(`${baseUrl}/api/tenant/surveys/${survey.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const delData = await delRes.json();
    assert(delRes.status === 200 && delData.message?.includes('deleted'), 'DELETE /api/tenant/surveys/:id: Deletes survey cleanly');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}% SUCCESS)`);
    console.log('====================================================');

    server.close();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    process.exit(1);
  }
}

runSurveyTests();
