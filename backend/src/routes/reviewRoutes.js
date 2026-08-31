import { Router } from 'express';
import * as review from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/product/:productId', review.getProductReviews);
router.get('/admin', protect, authorize('admin', 'manager'), review.getAllReviews);
router.post('/', protect, upload.array('images', 4), review.createReview);
router.put('/:id/approve', protect, authorize('admin', 'manager'), review.toggleApproval);
router.put('/:id', protect, upload.array('images', 4), review.updateReview);
router.delete('/:id', protect, review.deleteReview);

export default router;
