import { Router } from 'express';
import * as controller from '../controllers/lostfound.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/api/lostfound', controller.listItems);
router.post('/api/lostfound', authMiddleware, controller.reportItem);
router.patch('/api/lostfound/:id/claim', authMiddleware, controller.claimItem);
router.delete('/api/lostfound/:id', authMiddleware, controller.deleteItem);

export default router;
