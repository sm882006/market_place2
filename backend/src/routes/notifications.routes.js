import { Router } from 'express';
import * as controller from '../controllers/notifications.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/api/notifications', authMiddleware, controller.listNotifications);
router.patch('/api/notifications/:id/read', authMiddleware, controller.readNotification);
router.patch('/api/notifications/read-all', authMiddleware, controller.readAllNotifications);
router.delete('/api/notifications/:id', authMiddleware, controller.deleteNotification);

export default router;
