import { Router } from 'express';
import * as controller from '../controllers/health.controller.js';

const router = Router();
router.get('/api/health', controller.getHealth);

export default router;
