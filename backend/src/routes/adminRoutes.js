import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));

router.get('/dashboard', admin.getDashboardStats);
router.get('/users', admin.getUsers);
router.put('/users/:id/block', admin.toggleBlockUser);
router.put('/users/:id/role', admin.changeUserRole);
router.delete('/users/:id', admin.deleteUser);

export default router;
