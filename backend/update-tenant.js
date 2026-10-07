const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return console.log("No tenant found");

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      name: "Solar Energy Solutions India",
      legalName: "Solar Energy Solutions Pvt Ltd",
      email: "contact@solarenergy.in",
      phone: "+91-9876543210",
      address: "402, Business Park, Phase 1",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      gstin: "27AADCS1234F1Z9",
      pan: "AADCS1234F",
      logoUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      signatureUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
    }
  });

  console.log("Tenant details updated successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
