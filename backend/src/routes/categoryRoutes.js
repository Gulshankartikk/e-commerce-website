import { Router } from 'express';
import * as cat from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', cat.getCategories);
router.post('/', protect, authorize('admin'), upload.single('image'), cat.createCategory);
router.put('/:id', protect, authorize('admin'), upload.single('image'), cat.updateCategory);
router.delete('/:id', protect, authorize('admin'), cat.deleteCategory);

export default router;
