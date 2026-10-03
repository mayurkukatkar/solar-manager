const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- STARTING RAJESH SHARMA WORKFLOW TEST ---');
  
  // 1. Get the first tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found. Please create one.');
    return;
  }
  
  console.log(`Using Tenant: ${tenant.name}`);

  // 1. LEAD
  const lead = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      name: 'Rajesh Sharma',
      mobile: '+919876543210',
      email: 'rajesh@example.com',
      source: 'Website',
      status: 'NEW',
      estimatedCap: 5 // 5kW
    }
  });
  console.log('✅ 1. Lead created: ', lead.id);

  // 2. QUALIFY & CONVERT (Lead -> Customer)
  await prisma.lead.update({ where: { id: lead.id }, data: { status: 'WON' } });
  
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      leadId: lead.id,
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email,
      customerType: 'RESIDENTIAL'
    }
  });
  console.log('✅ 2. Lead converted to Customer: ', customer.id);

  // 3. SITE SURVEY
  const survey = await prisma.siteSurvey.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      leadId: lead.id,
      status: 'APPROVED',
      proposedCap: 5,
      roofType: 'Concrete',
      notes: 'Good shadow free area.'
    }
  });
  console.log('✅ 3. Survey created and approved: ', survey.id);

  // 4. QUOTATION
  const quote = await prisma.quotation.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      leadId: lead.id,
      qNumber: 'QT-RAJESH-001',
      status: 'ACCEPTED',
      subtotal: 250000,
      tax: 12500,
      total: 262500
    }
  });
  console.log('✅ 4. Quotation accepted: ', quote.id);

  // 5. PROJECT
  const project = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      leadId: lead.id,
      surveyId: survey.id,
      quotationId: quote.id,
      name: 'Rajesh Sharma - 5kW Residential',
      capacity: 5,
      status: 'INSTALLATION'
    }
  });
  console.log('✅ 5. Project created: ', project.id);

  // 6. PROCUREMENT
  const product = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: '500W Panel',
      category: 'Panel',
      unit: 'pcs',
      purchaseCost: 5000,
      sellingPrice: 7000
    }
  });
  
  const po = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      vendor: 'Waaree',
      poNumber: 'PO-RAJ-001',
      status: 'RECEIVED',
      items: {
        create: [
          { productId: product.id, quantity: 10, receivedQty: 10, unitPrice: 5000, total: 50000 }
        ]
      }
    }
  });
  console.log('✅ 6. PO Received: ', po.id);

  // 7. INVENTORY UPDATE
  await prisma.stockMovement.create({
    data: {
      tenantId: tenant.id,
      productId: product.id,
      quantity: 10,
      type: 'IN',
      reference: po.poNumber
    }
  });
  await prisma.product.update({
    where: { id: product.id },
    data: { currentStock: 10 }
  });
  console.log('✅ 7. Inventory Updated');

  // 8. DISPATCH (Consume Inventory)
  await prisma.stockMovement.create({
    data: {
      tenantId: tenant.id,
      productId: product.id,
      quantity: 10,
      type: 'OUT',
      reference: project.id
    }
  });
  await prisma.product.update({
    where: { id: product.id },
    data: { currentStock: 0 }
  });
  console.log('✅ 8. Materials Dispatched to Project');

  // 9. BILLING / INVOICE
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      projectId: project.id,
      invoiceNumber: 'INV-RAJ-001',
      amount: quote.total,
      status: 'UNPAID'
    }
  });
  console.log('✅ 9. Invoice created: ', invoice.id);

  // 10. PAYMENT
  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: quote.total,
      mode: 'BANK_TRANSFER'
    }
  });
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: 'PAID' }
  });
  console.log('✅ 10. Payment Recorded. Invoice Paid: ', payment.id);

  // 11. COMPLETION / HANDOVER
  await prisma.project.update({
    where: { id: project.id },
    data: { status: 'COMPLETED' }
  });
  console.log('✅ 11. Project Completed');

  // 12. SERVICE
  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      projectId: project.id,
      subject: 'Inverter displaying warning light',
      priority: 'HIGH',
      status: 'RESOLVED'
    }
  });
  
  await prisma.serviceVisit.create({
    data: {
      ticketId: ticket.id,
      notes: 'Restarted inverter and updated firmware.'
    }
  });
  console.log('✅ 12. Service Ticket Created & Resolved: ', ticket.id);

  // 13. AMC
  const amc = await prisma.aMC.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      projectId: project.id,
      contractNumber: 'AMC-RAJ-001',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      value: 15000,
      status: 'ACTIVE'
    }
  });
  console.log('✅ 13. AMC Contract Created: ', amc.id);

  console.log('--- TEST COMPLETE. ALL DATA CONNECTED. ---');
}

run().catch(console.error).finally(() => prisma.$disconnect());
