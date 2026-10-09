import { Router } from 'express';
import * as controller from '../controllers/rents.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/api/rents', controller.listRents);
router.post('/api/rents', authMiddleware, controller.createRent);
router.post('/api/rents/:id/rent', authMiddleware, controller.rentItem);
router.post('/api/rents/:id/rent-request', authMiddleware, controller.requestRental);
router.post('/api/rents/:id/approve-rent', authMiddleware, controller.approveRent);
router.post('/api/rents/:id/reject-rent', authMiddleware, controller.rejectRent);
router.delete('/api/rents/:id', authMiddleware, controller.deleteRent);

export default router;
