import { Router } from 'express';
import * as controller from '../controllers/chats.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/api/chats', authMiddleware, controller.listChats);
router.get('/api/chats/:chatId', authMiddleware, controller.getChat);
router.post('/api/chats/:chatId/message', authMiddleware, controller.sendMessage);

export default router;
