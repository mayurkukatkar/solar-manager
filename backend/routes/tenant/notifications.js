const express = require('express');
const router = express.Router();
const prisma = require('../../db');
const { requireTenantAuth } = require('../../middleware/auth');

// ----------------------------------------------------
// NOTIFICATIONS & STATUTORY ALERTS (TENANT)
// ----------------------------------------------------

const DEFAULT_ALERTS = [
  {
    type: 'CRITICAL',
    title: 'Net-Metering Application SLA Due in 24 Hours',
    content: 'Project #PRJ-881 requires Discom meter synchronization inspection submission before the portal SLA deadline.',
    actionUrl: '/tenant/projects',
    actionLabel: 'View Project',
    isRead: false
  },
  {
    type: 'ANNOUNCEMENT',
    title: 'Central PM Surya Ghar Muft Bijli Subsidy Scheme Portal Update',
    content: 'MNRE has released updated guidelines for residential rooftop subsidies. Sizing above 3kW qualifies for the enhanced ₹78,000 DBT release.',
    actionUrl: '/tenant/subsidy',
    actionLabel: 'Subsidy Desk',
    isRead: false
  },
  {
    type: 'WARNING',
    title: 'Low Inventory Warning: 5kW Hybrid Inverters',
    content: 'Primary Warehouse stock for 5kW Dual MPPT Inverter dropped below minimum buffer (Remaining: 2 units). Replenish via Purchase Order.',
    actionUrl: '/tenant/inventory',
    actionLabel: 'Check Stock',
    isRead: false
  },
  {
    type: 'INFO',
    title: 'Payment Received: Invoice #INV-0042',
    content: 'Sunita Verma has paid ₹1,45,000 via NEFT. Milestone #2 "Structure & Inverter Mounting" now ready for material dispatch.',
    actionUrl: '/tenant/finance',
    actionLabel: 'View Receipt',
    isRead: true
  }
];

// GET /api/tenant/notifications
router.get('/api/tenant/notifications', requireTenantAuth, async (req, res) => {
  try {
    const { type, isRead } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (type && type !== 'ALL') where.type = type;
    if (isRead !== undefined && isRead !== '') where.isRead = isRead === 'true';

    let notifications = await prisma.tenantNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Auto-seed default solar notifications if none exist
    if (notifications.length === 0 && !type) {
      for (const a of DEFAULT_ALERTS) {
        await prisma.tenantNotification.create({
          data: {
            tenantId: req.user.tenantId,
            ...a
          }
        }).catch(() => null);
      }

      notifications = await prisma.tenantNotification.findMany({
        where: { tenantId: req.user.tenantId },
        orderBy: { createdAt: 'desc' }
      });
    }

    const unreadCount = await prisma.tenantNotification.count({
      where: { tenantId: req.user.tenantId, isRead: false }
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/tenant/notifications/:id/read
router.patch('/api/tenant/notifications/:id/read', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await prisma.tenantNotification.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    const updated = await prisma.tenantNotification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ message: 'Marked as read', notification: updated });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/tenant/notifications/read-all
router.post('/api/tenant/notifications/read-all', requireTenantAuth, async (req, res) => {
  try {
    await prisma.tenantNotification.updateMany({
      where: { tenantId: req.user.tenantId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// POST /api/tenant/notifications
// Create notification
router.post('/api/tenant/notifications', requireTenantAuth, async (req, res) => {
  try {
    const { type, title, content, actionUrl, actionLabel } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    const notif = await prisma.tenantNotification.create({
      data: {
        tenantId: req.user.tenantId,
        type: type || 'INFO',
        title: title.trim(),
        content: content.trim(),
        actionUrl: actionUrl || null,
        actionLabel: actionLabel || null,
        isRead: false
      }
    });

    res.status(201).json({ message: 'Notification created successfully', notification: notif });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// DELETE /api/tenant/notifications/:id
router.delete('/api/tenant/notifications/:id', requireTenantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await prisma.tenantNotification.findFirst({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    await prisma.tenantNotification.delete({ where: { id } });
    res.json({ message: 'Notification dismissed' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to dismiss notification' });
  }
});

module.exports = router;
