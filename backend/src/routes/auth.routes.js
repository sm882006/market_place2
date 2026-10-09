import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/api/signup', controller.signup);
router.post('/api/login', controller.login);
router.get('/api/profile', authMiddleware, controller.profile);

export default router;
