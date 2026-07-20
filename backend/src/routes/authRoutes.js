import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// Tighter limit on credential endpoints to slow brute-force attempts
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many attempts. Try again in 15 minutes' } });

router.post('/register', authLimiter, validateBody({
  name: { required: true, minLen: 2, maxLen: 60, label: 'Name' },
  email: { required: true, email: true, label: 'Email' },
  password: { required: true, minLen: 8, label: 'Password' },
}), auth.register);

router.post('/login', authLimiter, auth.login);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.getMe);
router.get('/verify-email/:token', auth.verifyEmail);
router.post('/resend-verification', protect, auth.resendVerification);
router.post('/forgot-password', authLimiter, auth.forgotPassword);
router.post('/reset-password/:token', authLimiter, auth.resetPassword);
router.put('/change-password', protect, auth.changePassword);
router.put('/profile', protect, auth.updateProfile);

export default router;
