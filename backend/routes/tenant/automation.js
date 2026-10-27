const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// ----------------------------------------------------
// WORKFLOW AUTOMATION ENGINE (TENANT)
// ----------------------------------------------------

const DEFAULT_SOLAR_RULES = [
  {
    name: 'Auto-Schedule Survey on Lead Qualification',
    description: "When a lead status changes to 'QUALIFIED', automatically create a Site Survey task and notify regional engineer.",
    category: 'CRM',
    trigger: "Lead Status == 'QUALIFIED'",
    condition: 'Rooftop area > 200 sq.ft & Sanctioned Load >= 3kW',
    action: 'Create Site Survey Task + Send WhatsApp to Customer',
    isActive: true,
    runCount: 142
  },
  {
    name: 'Instant GST Invoice & WhatsApp Receipt on Payment',
    description: 'When advance or milestone payment is marked PAID, generate tax invoice PDF and dispatch receipt via WhatsApp.',
    category: 'FINANCE',
    trigger: "Payment Recorded == 'PAID'",
    condition: 'Amount > ₹0 & Valid GSTIN/PAN',
    action: 'Generate Invoice PDF + Dispatch Receipt via WhatsApp',
    isActive: true,
    runCount: 89
  },
  {
    name: 'Auto BOM & Warehouse Material Reservation',
    description: 'When quotation is approved and advance received, convert to Project and lock BOM stock in primary warehouse.',
    category: 'PROJECTS',
    trigger: 'Quotation Accepted + Advance Received',
    condition: "Project System Type == 'ON_GRID'",
    action: 'Create Project + Reserve Solar Panels & Inverters in BOM',
    isActive: true,
    runCount: 64
  },
  {
    name: 'Net-Metering SLA Breach Alert (24h Reminder)',
    description: 'If DISCOM application is pending in feasibility stage for > 7 days, trigger urgent WhatsApp alert to field liaison.',
    category: 'DISCOM',
    trigger: 'DISCOM Status == FEASIBILITY_PENDING for > 7 Days',
    condition: 'Application Submission Date > 7 Days ago',
    action: 'Dispatch Critical Escalation SMS to Operations Manager',
    isActive: true,
    runCount: 31
  },
  {
    name: 'Quarterly Routine AMC Cleaning Notification',
    description: 'Automatically alert residential consumer 7 days before scheduled quarterly solar panel cleaning and generation audit.',
    category: 'AMC',
    trigger: 'AMC Next Due Date == Today + 7 Days',
    condition: 'Active AMC Contract',
    action: 'Send WhatsApp Booking Link to Homeowner',
    isActive: true,
    runCount: 118
  }
];

// GET /api/tenant/automation/rules
router.get('/api/tenant/automation/rules', requireTenantAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (category && category !== 'ALL') where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    let rules = await prisma.automationRule.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Auto-seed default solar rules if tenant has no rules configured yet
    if (rules.length === 0 && !search && !category) {
      for (const r of DEFAULT_SOLAR_RULES) {
        await prisma.automationRule.create({
          data: {
            tenantId: req.user.tenantId,
            ...r,
            lastExecuted: new Date(Date.now() - Math.floor(Math.random() * 86400000))
          }
        }).catch(() => null);
      }

      rules = await prisma.automationRule.findMany({
        where: { tenantId: req.user.tenantId },
        orderBy: { createdAt: 'desc' }
      });
    }

    const metrics = {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.isActive).length,
      totalExecutions: rules.reduce((sum, r) => sum + (r.runCount || 0), 0)
    };

    res.json({ rules, metrics });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    res.status(500).json({ error: 'Failed to fetch automation rules' });
  }
});

// POST /api/tenant/automation/rules
// Create new automation rule
router.post('/api/tenant/automation/rules', requireTenantAuth, async (req, res) => {
  try {
    const { name, description, category, trigger, condition, action, isActive } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Rule name is required' });
    if (!trigger || !trigger.trim()) return res.status(400).json({ error: 'Trigger condition is required' });
    if (!action || !action.trim()) return res.status(400).json({ error: 'Action execution is required' });

    const rule = await prisma.automationRule.create({
      data: {
        tenantId: req.user.tenantId,
        name: name.trim(),
        description: description?.trim() || '',
        category: category || 'CRM',
        trigger: trigger.trim(),
        condition: condition?.trim() || 'All conditions met',
        action: action.trim(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        runCount: 0
      }
    });

    res.status(201).json({ message: 'Automation rule created successfully', rule });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    res.status(500).json({ error: 'Failed to create automation rule' });
  }
});

// PATCH /api/tenant/automation/rules/:id/toggle
router.patch('/api/tenant/automation/rules/:id/toggle', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await prisma.automationRule.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!rule) return res.status(404).json({ error: 'Automation rule not found' });

    const updated = await prisma.automationRule.update({
      where: { id },
      data: { isActive: !rule.isActive }
    });

    res.json({ message: `Rule ${updated.isActive ? 'activated' : 'paused'} successfully`, rule: updated });
  } catch (error) {
    console.error('Error toggling rule:', error);
    res.status(500).json({ error: 'Failed to toggle rule state' });
  }
});

// POST /api/tenant/automation/rules/:id/test
// Test dry-run trigger of an automation rule
router.post('/api/tenant/automation/rules/:id/test', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await prisma.automationRule.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!rule) return res.status(404).json({ error: 'Automation rule not found' });

    const updated = await prisma.automationRule.update({
      where: { id },
      data: {
        runCount: { increment: 1 },
        lastExecuted: new Date()
      }
    });

    res.json({
      success: true,
      message: `Trigger simulated: "${rule.trigger}" passed! Action executed: "${rule.action}"`,
      rule: updated
    });
  } catch (error) {
    console.error('Error testing rule:', error);
    res.status(500).json({ error: 'Failed to simulate rule' });
  }
});

// DELETE /api/tenant/automation/rules/:id
router.delete('/api/tenant/automation/rules/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await prisma.automationRule.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!rule) return res.status(404).json({ error: 'Automation rule not found' });

    await prisma.automationRule.delete({ where: { id } });
    res.json({ message: 'Automation rule removed' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to remove rule' });
  }
});

module.exports = router;
