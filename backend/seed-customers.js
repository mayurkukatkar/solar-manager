const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the first tenant (assuming the user has created an account)
  let tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    console.log("No tenant found. Creating a dummy tenant first...");
    tenant = await prisma.tenant.create({
      data: {
        name: "Solar ERP Trial Tenant",
        email: "admin@solarerp.com",
        phone: "9999999999",
        city: "Mumbai"
      }
    });
  }

  console.log(`Using Tenant ID: ${tenant.id}`);

  // Create Dummy Customer 1 (Residential)
  const c1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Ramesh Kumar",
      email: "ramesh.kumar@example.com",
      mobile: "9876543210",
      address: "101, Sunshine Apartments, Andheri West",
      city: "Mumbai",
      customerType: "RESIDENTIAL"
    }
  });
  console.log(`Created Customer: ${c1.name}`);

  // Create Dummy Customer 2 (Commercial)
  const c2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Acme Solar Solutions Pvt Ltd",
      company: "Acme Solar Solutions Pvt Ltd",
      email: "contact@acmesolar.in",
      mobile: "9123456780",
      address: "Tech Park, Phase 2, Electronic City",
      city: "Bangalore",
      customerType: "COMMERCIAL"
    }
  });
  console.log(`Created Customer: ${c2.name}`);

  // Create Dummy Customer 3 (Industrial)
  const c3 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Global Manufacturing Corp",
      company: "Global Manufacturing Corp",
      email: "procurement@globalmfg.com",
      mobile: "9888877777",
      address: "Plot 45, MIDC Industrial Area",
      city: "Pune",
      customerType: "INDUSTRIAL"
    }
  });
  console.log(`Created Customer: ${c3.name}`);

  // Optionally create a dummy project for one of them so it shows up in dropdowns
  const p1 = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      customerId: c1.id,
      name: "Ramesh 5kW Rooftop",
      projectNumber: "PRJ-001",
      capacity: 5,
      capacityUnit: "kW",
      status: "In Progress",
      currentStage: "Installation",
      estimatedValue: 250000,
      city: "Mumbai"
    }
  });
  console.log(`Created Project: ${p1.name}`);

  const p2 = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      customerId: c2.id,
      name: "Acme 50kW Commercial",
      projectNumber: "PRJ-002",
      capacity: 50,
      capacityUnit: "kW",
      status: "Planning",
      currentStage: "Permits",
      estimatedValue: 2000000,
      city: "Bangalore"
    }
  });
  console.log(`Created Project: ${p2.name}`);

  console.log("Dummy data injection complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
