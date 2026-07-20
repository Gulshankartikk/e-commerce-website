import { Router } from 'express';
import * as order from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', order.createCodOrder); // COD checkout
router.get('/my', order.getMyOrders);
router.get('/', authorize('admin'), order.getAllOrders);
router.get('/:id', order.getOrder);
router.get('/:id/invoice', order.downloadInvoice);
router.put('/:id/cancel', order.cancelMyOrder);
router.put('/:id/status', authorize('admin'), order.updateOrderStatus);

export default router;
