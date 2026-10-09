import { getNotifications, saveNotifications } from '../repositories/notifications.repository.js';

export const listNotifications = (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = getNotifications();
    const userNotifs = notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userNotifs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve notifications.' });
  }
};

export const readNotification = (req, res) => {
  try {
    const notifications = getNotifications();
    const idx = notifications.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ message: 'Notification not found.' });
    notifications[idx].isRead = true;
    saveNotifications(notifications);
    res.json({ message: 'Marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification.' });
  }
};

export const readAllNotifications = (req, res) => {
  try {
    const notifications = getNotifications();
    notifications.forEach(n => { if (n.userId === req.user.id) n.isRead = true; });
    saveNotifications(notifications);
    res.json({ message: 'All marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications.' });
  }
};

export const deleteNotification = (req, res) => {
  try {
    let notifications = getNotifications();
    notifications = notifications.filter(n => !(n.id === req.params.id && n.userId === req.user.id));
    saveNotifications(notifications);
    res.json({ message: 'Notification dismissed.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to dismiss notification.' });
  }
};

