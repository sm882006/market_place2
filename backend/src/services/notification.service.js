import { getNotifications, saveNotifications } from '../repositories/notifications.repository.js';

export function createNotification({ userId, fromUserId, fromUsername, type, productId, rentId, productName, message, requestId, price, days }) {
  if (!userId) return null;
  const notifications = getNotifications();
  const notif = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    requestId: requestId || ('REQ-' + Math.floor(1000 + Math.random() * 9000)),
    userId,
    fromUserId,
    fromUsername,
    type,
    productId: productId || null,
    rentId: rentId || null,
    productName: productName || '',
    price: price || null,
    days: days || null,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(notif);
  saveNotifications(notifications);
  return notif;
}
