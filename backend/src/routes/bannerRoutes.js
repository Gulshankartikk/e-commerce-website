import { Router } from 'express';
import * as banner from '../controllers/bannerController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', banner.getBanners);
router.get('/admin', protect, authorize('admin', 'manager'), banner.getAdminBanners);
router.post('/', protect, authorize('admin', 'manager'), upload.single('image'), banner.createBanner);
router.put('/:id', protect, authorize('admin', 'manager'), upload.single('image'), banner.updateBanner);
router.delete('/:id', protect, authorize('admin', 'manager'), banner.deleteBanner);

export default router;
