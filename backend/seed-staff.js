const prisma = require('./db');

const DEFAULT_DEPARTMENTS = [
  {
    name: 'Field Engineering & Surveys',
    code: 'ENG',
    description: 'Technical site feasibility, shadow analysis, and electrical design',
    color: 'emerald',
    designations: ['Senior Solar Engineer', 'Site Survey Specialist', 'Design & CAD Engineer', 'Technical Feasibility Officer']
  },
  {
    name: 'Project Execution & Installation',
    code: 'OPS',
    description: 'Rooftop mounting, module stringing, inverter commissioning, and grid tie-in',
    color: 'blue',
    designations: ['Project Manager', 'Site Installation Supervisor', 'Master Electrician', 'Solar Technician', 'Safety Inspector']
  },
  {
    name: 'Sales & Business Development',
    code: 'SALES',
    description: 'Residential & commercial solar consulting, lead qualification, and customer agreements',
    color: 'amber',
    designations: ['Solar Sales Consultant', 'Business Development Executive', 'Commercial Quote Specialist', 'Sales Manager']
  },
  {
    name: 'Warehouse & Logistics',
    code: 'LOG',
    description: 'PV module handling, inverter warehousing, BOS procurement, and site dispatch',
    color: 'indigo',
    designations: ['Inventory Manager', 'Logistics Coordinator', 'Procurement Officer', 'Warehouse Executive']
  },
  {
    name: 'DISCOM & Regulatory Compliance',
    code: 'REG',
    description: 'Net metering approvals, CEIG inspections, subsidy sanctions, and grid connectivity',
    color: 'purple',
    designations: ['DISCOM Liaison Officer', 'Net Metering Specialist', 'Subsidy Coordinator', 'Compliance Officer']
  },
  {
    name: 'Customer Support & AMC',
    code: 'AMC',
    description: 'Post-commissioning support, inverter monitoring, panel cleaning, and preventive AMC',
    color: 'rose',
    designations: ['AMC Service Engineer', 'Field Maintenance Technician', 'Customer Support Executive']
  },
  {
    name: 'Executive & Administration',
    code: 'EXEC',
    description: 'Workforce governance, organizational strategy, and financial controllership',
    color: 'slate',
    designations: ['Managing Director', 'Operations Director', 'General Manager', 'Finance Controller']
  }
];

async function seedStaff() {
  console.log('--- SEEDING WORKFORCE & STAFF MODULE ---');
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  console.log(`Found ${tenants.length} tenants`);

  for (const tenant of tenants) {
    console.log(`\nProcessing Tenant: ${tenant.name} (${tenant.id})`);

    // 1. Seed Departments
    for (const d of DEFAULT_DEPARTMENTS) {
      await prisma.department.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: d.name } },
        update: { code: d.code, description: d.description, color: d.color, designations: d.designations },
        create: {
          tenantId: tenant.id,
          name: d.name,
          code: d.code,
          description: d.description,
          color: d.color,
          designations: d.designations
        }
      });
    }

    // 2. Link existing Users to Staff records
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id }
    });

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const empId = `EMP-${(101 + i).toString().padStart(3, '0')}`;
      const designation = u.role === 'TENANT_ADMIN' ? 'Managing Director' : 'Senior Solar Engineer';
      const department = u.role === 'TENANT_ADMIN' ? 'Executive & Administration' : 'Field Engineering & Surveys';

      await prisma.staff.upsert({
        where: { tenantId_employeeId: { tenantId: tenant.id, employeeId: empId } },
        update: {
          name: u.name,
          email: u.email,
          userId: u.id,
          designation,
          department,
          status: 'ACTIVE'
        },
        create: {
          tenantId: tenant.id,
          employeeId: empId,
          name: u.name,
          email: u.email,
          phone: '+91 98230 44551',
          emergencyContact: 'Emergency Contact (+91 98230 44552)',
          department,
          designation,
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          joiningDate: new Date('2023-01-15'),
          workLocation: 'Pune HQ Office',
          skills: ['Solar PV System Design', 'Project Management', 'System Commissioning', 'Grid Synchronization'],
          team: 'Executive Leadership',
          userId: u.id,
          notes: 'Account Owner and Principal System Administrator'
        }
      });
    }

    // Find the primary admin staff to use as manager
    const adminStaff = await prisma.staff.findFirst({
      where: { tenantId: tenant.id, designation: 'Managing Director' }
    });

    // 3. Add representative solar workforce members across diverse categories
    const sampleStaff = [
      {
        employeeId: 'EMP-105',
        name: 'Rajesh Sharma',
        email: 'rajesh.sharma@example.com',
        phone: '+91 98210 11223',
        department: 'Project Execution & Installation',
        designation: 'Site Installation Supervisor',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        joiningDate: new Date('2023-04-10'),
        workLocation: 'Industrial Area Site Hub',
        skills: ['Rooftop Solar Mounting', 'HT/LT Electrical License', 'Safety at Heights', 'Inverter Commissioning'],
        team: 'Alpha Crew (Industrial)',
        managerId: adminStaff ? adminStaff.id : null,
        notes: 'Certified MNRE solar installer with 6+ years EPC experience'
      },
      {
        employeeId: 'EMP-106',
        name: 'Amit Deshmukh',
        email: 'amit.deshmukh@example.com',
        phone: '+91 98210 22334',
        department: 'Project Execution & Installation',
        designation: 'Master Electrician',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        joiningDate: new Date('2023-06-01'),
        workLocation: 'Western Field Region',
        skills: ['ACDB/DCDB Wiring', 'Earthing & Lightning Arrestors', 'Three Phase Grid Interconnection'],
        team: 'Alpha Crew (Industrial)',
        managerId: adminStaff ? adminStaff.id : null,
        notes: 'Lead electrician for 100kW+ commercial projects'
      },
      {
        employeeId: 'EMP-107',
        name: 'Pooja Kulkarni',
        email: 'pooja.kulkarni@example.com',
        phone: '+91 98210 33445',
        department: 'Field Engineering & Surveys',
        designation: 'Site Survey Specialist',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        joiningDate: new Date('2023-08-15'),
        workLocation: 'Pune HQ & Client Sites',
        skills: ['Drone Photogrammetry', 'Shadow Analysis (Helioscope)', 'Load Assessment', 'Structural Feasibility'],
        team: 'Feasibility & Engineering',
        managerId: adminStaff ? adminStaff.id : null,
        notes: 'Conducted over 120+ rooftop feasibility surveys'
      },
      {
        employeeId: 'EMP-108',
        name: 'Vikram Jadhav',
        email: 'vikram.jadhav@example.com',
        phone: '+91 98210 44556',
        department: 'Sales & Business Development',
        designation: 'Commercial Quote Specialist',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        joiningDate: new Date('2023-09-01'),
        workLocation: 'Pune HQ Office',
        skills: ['B2B Proposal Engineering', 'Payback ROI Calculations', 'PPA Contracts', 'CRM Automation'],
        team: 'Commercial Sales',
        managerId: adminStaff ? adminStaff.id : null,
        notes: 'Closes rooftop turnkey contracts for commercial manufacturing units'
      },
      {
        employeeId: 'EMP-109',
        name: 'Suresh Patil',
        email: 'suresh.patil@example.com',
        phone: '+91 98210 55667',
        department: 'Warehouse & Logistics',
        designation: 'Inventory Manager',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        joiningDate: new Date('2023-11-20'),
        workLocation: 'Central Warehouse B',
        skills: ['Barcode Dispatch', 'Batch/Serial Tracking', 'BOS BOM Reconciliation', 'Vendor Quality Check'],
        team: 'Supply Chain',
        managerId: adminStaff ? adminStaff.id : null,
        notes: 'Manages multi-tier module and string inverter stock'
      },
      {
        employeeId: 'EMP-110',
        name: 'Sunil Rao',
        email: 'sunil.rao@example.com',
        phone: '+91 98210 66778',
        department: 'Customer Support & AMC',
        designation: 'AMC Service Engineer',
        employmentType: 'FULL_TIME',
        status: 'ON_LEAVE',
        joiningDate: new Date('2024-01-10'),
        workLocation: 'Field Service Van 1',
        skills: ['Thermal Imaging (Hotspot detection)', 'String Testing', 'Inverter Firmware Update', 'IV Curve Tracing'],
        team: 'O&M Fleet',
        managerId: adminStaff ? adminStaff.id : null,
        notes: 'On medical leave until next Monday'
      },
      {
        employeeId: 'EMP-111',
        name: 'Sachin Gaikwad',
        phone: '+91 98210 77889',
        department: 'Project Execution & Installation',
        designation: 'Solar Technician',
        employmentType: 'CONTRACT',
        status: 'ACTIVE',
        joiningDate: new Date('2024-03-01'),
        workLocation: 'Field Deployment Sites',
        skills: ['Module Clamping', 'Walkway Installation', 'Cable Trays Routing'],
        team: 'Alpha Crew (Industrial)',
        managerId: adminStaff ? adminStaff.id : null,
        notes: 'Specialist field technician for elevated structures'
      }
    ];

    for (const item of sampleStaff) {
      const existing = await prisma.staff.findFirst({
        where: { tenantId: tenant.id, employeeId: item.employeeId }
      });
      if (!existing) {
        await prisma.staff.create({
          data: {
            tenantId: tenant.id,
            ...item
          }
        });
        console.log(`Created staff member: ${item.name} (${item.employeeId})`);
      }
    }

    // 4. Link some ProjectStaffAssignments if projects exist
    const projects = await prisma.project.findMany({
      where: { tenantId: tenant.id },
      take: 5
    });

    const activeStaff = await prisma.staff.findMany({
      where: { tenantId: tenant.id, status: 'ACTIVE' },
      take: 4
    });

    if (projects.length > 0 && activeStaff.length > 0) {
      for (let pIdx = 0; pIdx < projects.length; pIdx++) {
        const project = projects[pIdx];
        const staffMem = activeStaff[pIdx % activeStaff.length];
        await prisma.projectStaffAssignment.upsert({
          where: { staffId_projectId: { staffId: staffMem.id, projectId: project.id } },
          update: { role: 'SITE_ENGINEER', status: 'ACTIVE' },
          create: {
            tenantId: tenant.id,
            staffId: staffMem.id,
            projectId: project.id,
            role: pIdx === 0 ? 'PROJECT_LEAD' : 'SITE_ENGINEER',
            status: 'ACTIVE',
            notes: 'Assigned as lead operational engineer for solar installation'
          }
        });
      }
      console.log(`Created project assignments for ${projects.length} projects`);
    }
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

seedStaff().catch(console.error).finally(() => process.exit(0));
