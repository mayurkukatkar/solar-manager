const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'asc' } });
  for (let i = 0; i < invoices.length; i++) {
    const newNumber = `INV-${(i + 1).toString().padStart(4, '0')}`;
    await prisma.invoice.update({
      where: { id: invoices[i].id },
      data: { invoiceNumber: newNumber }
    });
  }
  console.log('Fixed existing invoice numbers!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
