import { Router } from 'express';
import * as wl from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', wl.getWishlist);
router.post('/:productId', wl.toggleWishlist);

export default router;
