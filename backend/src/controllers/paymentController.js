import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { buildOrderFromCart, finalizeOrder, sendOrderEmail } from './orderController.js';

const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_xxx') {
    throw new AppError('Stripe is not configured on this server', 503);
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const razorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_xxx') {
    throw new AppError('Razorpay is not configured on this server', 503);
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

/**
 * POST /payments/stripe/create-intent
 * Creates the order (pending payment) + a Stripe PaymentIntent for its total.
 */
export const createStripeIntent = catchAsync(async (req, res) => {
  const { orderData, cart } = await buildOrderFromCart(req.user, { ...req.body, paymentMethod: 'stripe' });
  const order = await Order.create(orderData);

  const intent = await stripe().paymentIntents.create({
    amount: order.totalPrice * 100, // paise
    currency: 'inr',
    metadata: { orderId: String(order._id), orderNumber: order.orderNumber, userId: String(req.user._id) },
    description: `FlashShop order ${order.orderNumber}`,
  });
  order.paymentInfo = { id: intent.id, provider: 'stripe' };
  await order.save();
  res.json({ success: true, clientSecret: intent.client_secret, orderId: order._id });
});

/** POST /payments/stripe/confirm — verify the intent server-side, then finalize. */
export const confirmStripePayment = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found', 404));
  if (String(order.user) !== String(req.user._id)) return next(new AppError('Not your order', 403));
  if (order.paymentStatus === 'paid') return res.json({ success: true, order });

  const intent = await stripe().paymentIntents.retrieve(order.paymentInfo.id);
  if (intent.status !== 'succeeded') return next(new AppError(`Payment not completed (status: ${intent.status})`, 400));

  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.statusHistory.push({ status: 'confirmed', note: 'Payment received via Stripe' });
  await order.save();
  const cart = await Cart.findOne({ user: order.user });
  await finalizeOrder(order, cart);
  sendOrderEmail(order, req.user.email, req.user.name);
  res.json({ success: true, order });
});

/** POST /payments/razorpay/create-order */
export const createRazorpayOrder = catchAsync(async (req, res) => {
  const { orderData } = await buildOrderFromCart(req.user, { ...req.body, paymentMethod: 'razorpay' });
  const order = await Order.create(orderData);

  const rzpOrder = await razorpay().orders.create({
    amount: order.totalPrice * 100, // paise
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: String(order._id) },
  });
  order.paymentInfo = { id: rzpOrder.id, provider: 'razorpay' };
  await order.save();
  res.json({
    success: true,
    orderId: order._id,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

/** POST /payments/razorpay/verify — HMAC signature check, then finalize. */
export const verifyRazorpayPayment = catchAsync(async (req, res, next) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new AppError('Order not found', 404));
  if (String(order.user) !== String(req.user._id)) return next(new AppError('Not your order', 403));
  if (order.paymentStatus === 'paid') return res.json({ success: true, order });

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  if (expected !== razorpay_signature) return next(new AppError('Payment verification failed', 400));

  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.paymentInfo = { id: razorpay_payment_id, provider: 'razorpay', signature: razorpay_signature };
  order.statusHistory.push({ status: 'confirmed', note: 'Payment received via Razorpay' });
  await order.save();
  const cart = await Cart.findOne({ user: order.user });
  await finalizeOrder(order, cart);
  sendOrderEmail(order, req.user.email, req.user.name);
  res.json({ success: true, order });
});

/** GET /payments/config — which gateways are live (frontend hides dead options). */
export const getPaymentConfig = (req, res) => {
  res.json({
    success: true,
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_xxx'),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_xxx'),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID !== 'rzp_test_xxx' ? process.env.RAZORPAY_KEY_ID : null,
    cod: true,
  });
};
