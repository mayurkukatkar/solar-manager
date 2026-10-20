const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Quotation & Template Database Integration Tests', () => {
  test('Tenants have isolated proposal templates', async () => {
    const tenants = await prisma.tenant.findMany({
      include: { proposalTemplates: true }
    });

    assert.ok(tenants.length >= 1, 'Should have at least 1 tenant');
    for (const t of tenants) {
      assert.ok(t.proposalTemplates.length >= 1, `Tenant ${t.name} should have seeded templates`);
      // Ensure all templates belong strictly to this tenant
      for (const tpl of t.proposalTemplates) {
        assert.equal(tpl.tenantId, t.id, 'Template tenantId must match tenant');
      }
    }
  });

  test('Quotation duplicate creates independent draft with new qNumber', async () => {
    const original = await prisma.quotation.findFirst({
      include: { items: true }
    });

    if (!original) {
      console.log('Skipping duplicate test: No quotations in DB');
      return;
    }

    const newQNumber = `QT-TEST-${Date.now()}`;
    const duplicated = await prisma.quotation.create({
      data: {
        tenantId: original.tenantId,
        customerId: original.customerId,
        leadId: original.leadId,
        qNumber: newQNumber,
        subtotal: original.subtotal,
        tax: original.tax,
        discount: original.discount,
        total: original.total,
        status: 'DRAFT',
        systemCapacity: original.systemCapacity,
        systemType: original.systemType,
        connectionType: original.connectionType,
        items: {
          create: (original.items || []).map(it => ({
            productId: it.productId,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            total: it.total
          }))
        }
      },
      include: { items: true }
    });

    assert.notEqual(duplicated.id, original.id);
    assert.equal(duplicated.qNumber, newQNumber);
    assert.equal(duplicated.status, 'DRAFT');
    assert.equal(duplicated.total, original.total);

    // Clean up test quotation
    await prisma.quotationItem.deleteMany({ where: { quotationId: duplicated.id } });
    await prisma.quotation.delete({ where: { id: duplicated.id } });
  });
});
