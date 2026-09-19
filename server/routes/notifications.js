import express from 'express';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const toNotifJson = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
    isRead: !!obj.read,
  };
};

// GET /api/notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifs = await Notification.find({
      $or: [{ recipient: req.user.username }, { recipient: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(notifs.map(toNotifJson));
  } catch (err) {
    console.error('[NOTIFICATIONS] Error fetching notifications:', err);
    return res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findById(id);
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notif.recipient !== req.user.username && notif.recipient !== req.user._id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    notif.read = true;
    await notif.save();
    return res.json(toNotifJson(notif));
  } catch (err) {
    console.error('[NOTIFICATIONS] Error marking read:', err);
    return res.status(500).json({ message: 'Error updating notification' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ recipient: req.user.username }, { recipient: req.user._id }],
        read: false,
      },
      { $set: { read: true } }
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[NOTIFICATIONS] Error marking all read:', err);
    return res.status(500).json({ message: 'Error marking notifications as read' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findById(id);
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notif.recipient !== req.user.username && notif.recipient !== req.user._id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Notification.findByIdAndDelete(id);
    return res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('[NOTIFICATIONS] Error deleting notification:', err);
    return res.status(500).json({ message: 'Error deleting notification' });
  }
});

export default router;
