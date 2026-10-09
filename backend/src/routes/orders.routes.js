import { Router } from 'express';
import * as controller from '../controllers/orders.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/api/orders', authMiddleware, controller.listOrders);

export default router;
