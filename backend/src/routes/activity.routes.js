import { Router } from 'express';
import * as controller from '../controllers/activity.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/api/user/activity', authMiddleware, controller.getActivity);

export default router;
