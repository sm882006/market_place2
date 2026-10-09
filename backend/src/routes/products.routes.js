import { Router } from 'express';
import * as controller from '../controllers/products.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/api/products', controller.listProducts);
router.post('/api/products', authMiddleware, controller.createProduct);
router.post('/api/products/:id/buy', authMiddleware, controller.buyProduct);
router.post('/api/products/:id/buy-request', authMiddleware, controller.requestPurchase);
router.post('/api/products/:id/approve-sale', authMiddleware, controller.approveSale);
router.post('/api/products/:id/reject-sale', authMiddleware, controller.rejectSale);
router.delete('/api/products/:id', authMiddleware, controller.deleteProduct);

export default router;
