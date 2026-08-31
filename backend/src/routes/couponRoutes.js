import { Router } from 'express';
import * as coupon from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin', 'manager'));

router.get('/', coupon.getCoupons);
router.post('/', coupon.createCoupon);
router.put('/:id', coupon.updateCoupon);
router.delete('/:id', coupon.deleteCoupon);

export default router;
