import { Router } from 'express';
import * as product from '../controllers/productController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', product.getProducts);
router.get('/suggestions', product.getSuggestions);
router.get('/home', product.getHomeData);
router.get('/admin/all', protect, authorize('admin', 'manager', 'seller'), product.getAdminProducts);
router.get('/:slug', optionalAuth, product.getProduct);

router.post('/', protect, authorize('admin', 'manager', 'seller'), upload.array('images', 6), product.createProduct);
router.put('/:id', protect, authorize('admin', 'manager', 'seller'), upload.array('images', 6), product.updateProduct);
router.put('/:id/stock', protect, authorize('admin', 'manager', 'seller'), product.updateStock);
router.delete('/:id', protect, authorize('admin', 'manager'), product.deleteProduct);

export default router;
