const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// TENANT - LOAN APPLICATIONS
// ----------------------------------------------------

// List all loans
router.get('/api/tenant/loans', requireTenantAuth, async (req, res) => {
  try {
    const { status, customerId } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const loans = await prisma.loanApplication.findMany({
      where,
      include: { customer: true, project: true },
      orderBy: { createdAt: 'desc' }
    });

    const metrics = {
      total: loans.length,
      applied: loans.filter(l => l.status === 'APPLIED').length,
      review: loans.filter(l => l.status === 'REVIEW').length,
      approved: loans.filter(l => l.status === 'APPROVED').length,
      disbursed: loans.filter(l => l.status === 'DISBURSED').length,
      rejected: loans.filter(l => l.status === 'REJECTED').length,
      totalDisbursed: loans.filter(l => l.status === 'DISBURSED').reduce((sum, l) => sum + (l.amount || 0), 0)
    };

    res.json({ loans, metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// Get loan detail
router.get('/api/tenant/loans/:id', requireTenantAuth, async (req, res) => {
  try {
    const loan = await prisma.loanApplication.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { customer: true, project: true }
    });
    if (!loan) return res.status(404).json({ error: 'Loan application not found' });
    res.json({ loan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loan details' });
  }
});

// Create loan application
router.post('/api/tenant/loans', requireTenantAuth, async (req, res) => {
  try {
    const { customerId, projectId, lender, applicationNo, amount } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });

    const loan = await prisma.loanApplication.create({
      data: {
        tenantId: req.user.tenantId,
        customerId,
        projectId: projectId || null,
        lender: lender || null,
        applicationNo: applicationNo || `LOAN-${Date.now()}`,
        amount: parseFloat(amount) || 0,
        status: 'APPLIED'
      },
      include: { customer: true, project: true }
    });
    res.status(201).json({ loan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create loan application' });
  }
});

// Update loan
router.patch('/api/tenant/loans/:id', requireTenantAuth, async (req, res) => {
  try {
    const { status, lender, applicationNo, amount } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (lender) updateData.lender = lender;
    if (applicationNo) updateData.applicationNo = applicationNo;
    if (amount !== undefined) updateData.amount = parseFloat(amount);

    const loan = await prisma.loanApplication.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData,
      include: { customer: true, project: true }
    });
    res.json({ loan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update loan application' });
  }
});

// Delete loan
router.delete('/api/tenant/loans/:id', requireTenantAuth, async (req, res) => {
  try {
    await prisma.loanApplication.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Loan application deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete loan application' });
  }
});

module.exports = router;
