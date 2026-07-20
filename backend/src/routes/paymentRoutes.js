import { Router } from 'express';
import * as payment from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/config', payment.getPaymentConfig);
router.use(protect);
router.post('/stripe/create-intent', payment.createStripeIntent);
router.post('/stripe/confirm', payment.confirmStripePayment);
router.post('/razorpay/create-order', payment.createRazorpayOrder);
router.post('/razorpay/verify', payment.verifyRazorpayPayment);

export default router;
