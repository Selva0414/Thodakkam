import express from 'express';
const router = express.Router();
import NotificationModel from '../models/notificationModel';

// GET /api/students/:studentId/notifications
router.get('/:studentId/notifications', async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!studentId || studentId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid student id' });
    }
    // Ensure the table exists
    await NotificationModel.createTable();
    const notifications = await NotificationModel.getStudentNotifications(studentId);
    const unreadCount = await NotificationModel.getUnreadCount(studentId);
    return res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// PATCH /api/students/notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await NotificationModel.createTable();
    const notification = await NotificationModel.markAsRead(id);
    return res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark read error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// PATCH /api/students/:studentId/notifications/read-all
router.patch('/:studentId/notifications/read-all', async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    await NotificationModel.createTable();
    await NotificationModel.markAllAsRead(studentId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
});

export default router;
