import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin', 'manager'));

router.get('/dashboard', admin.getDashboardStats);
router.get('/users', admin.getUsers);
router.put('/users/:id/block', authorize('admin'), admin.toggleBlockUser);
router.put('/users/:id/role', authorize('admin'), admin.changeUserRole);
router.delete('/users/:id', authorize('admin'), admin.deleteUser);

export default router;
