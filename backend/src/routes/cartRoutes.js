import { Router } from 'express';
import * as cart from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', cart.getCart);
router.post('/', cart.addToCart);
router.post('/coupon', cart.applyCoupon);
router.delete('/coupon', cart.removeCoupon);
router.put('/:itemId/save-for-later', cart.toggleSaveForLater);
router.put('/:itemId', cart.updateCartItem);
router.delete('/:itemId', cart.removeCartItem);
router.delete('/', cart.clearCart);

export default router;
