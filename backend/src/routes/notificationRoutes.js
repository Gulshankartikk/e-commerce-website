import { Router } from 'express';
import * as notif from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', notif.getNotifications);
router.put('/read-all', notif.markAllRead);
router.put('/:id/read', notif.markRead);
router.delete('/:id', notif.deleteNotification);

export default router;
