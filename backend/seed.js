const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');
  
  // Clear existing users
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.create({
    data: {
      email: 'platform@whereready.com',
      password: hashedPassword,
      name: 'Narayana Platform Owner',
      role: 'SUPER_ADMIN'
    }
  });

  console.log('Seeding completed. Super Admin: platform@whereready.com / password123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
