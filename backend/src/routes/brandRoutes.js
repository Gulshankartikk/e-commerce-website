import { Router } from 'express';
import * as cat from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', cat.getBrands);
router.post('/', protect, authorize('admin'), upload.single('logo'), cat.createBrand);
router.put('/:id', protect, authorize('admin'), upload.single('logo'), cat.updateBrand);
router.delete('/:id', protect, authorize('admin'), cat.deleteBrand);

export default router;
