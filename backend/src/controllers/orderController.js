import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { computeTotals } from './cartController.js';
import { generateInvoicePDF } from '../utils/invoice.js';
import { sendEmail, emailTemplate } from '../utils/sendEmail.js';

const CART_POPULATE = { path: 'items.product', select: 'name slug price mrp images stock isActive' };

/** Generate a human-friendly unique order number, e.g. LX-M3K9F2-8341. */
const makeOrderNumber = () =>
  `LX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

/**
 * Build an order document from the user's cart (shared by COD + payment flows).
 * Validates stock, prices from DB, and coupon — never trusts client totals.
 */
export const buildOrderFromCart = async (user, { addressId, deliveryOption = 'standard', paymentMethod }) => {
  const cart = await Cart.findOne({ user: user._id }).populate(CART_POPULATE);
  const active = cart?.items.filter((i) => !i.savedForLater && i.product && i.product.isActive) || [];
  if (!active.length) throw new AppError('Your cart is empty', 400);

  const address = user.addresses.id(addressId);
  if (!address) throw new AppError('Please select a valid delivery address', 400);

  // Stock validation
  for (const item of active) {
    if (item.quantity > item.product.stock) {
      throw new AppError(`"${item.product.name}" has only ${item.product.stock} left in stock`, 400);
    }
  }

  const totals = computeTotals(cart, deliveryOption);
  const items = active.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    image: i.product.images?.[0]?.url || '',
    price: i.product.price,
    quantity: i.quantity,
    variant: i.variant,
  }));

  return {
    orderData: {
      orderNumber: makeOrderNumber(),
      user: user._id,
      items,
      shippingAddress: address.toObject(),
      deliveryOption,
      paymentMethod,
      couponCode: cart.coupon?.code || null,
      ...totals,
      statusHistory: [{ status: 'pending', note: 'Order placed' }],
    },
    cart,
  };
};

/** Post-payment bookkeeping: decrement stock, bump sold, clear cart, count coupon use, notify. */
export const finalizeOrder = async (order, cart) => {
  await Promise.all(
    order.items.map((i) =>
      Product.findByIdAndUpdate(i.product, { $inc: { stock: -i.quantity, sold: i.quantity } })
    )
  );
  if (order.couponCode) await Coupon.findOneAndUpdate({ code: order.couponCode }, { $inc: { usedCount: 1 } });
  if (cart) {
    cart.items = cart.items.filter((i) => i.savedForLater);
    cart.coupon = { code: null, discount: 0 };
    await cart.save();
  }
  await Notification.create({
    user: order.user,
    title: 'Order placed 🎉',
    message: `Order ${order.orderNumber} has been placed successfully.`,
    type: 'order',
    link: `/dashboard/orders/${order._id}`,
  });
};

/** Email the order confirmation (best-effort). */
export const sendOrderEmail = (order, email, name) => {
  const rows = order.items.map((i) => `<tr><td style="padding:6px 0">${i.name} × ${i.quantity}</td><td style="text-align:right">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td></tr>`).join('');
  sendEmail({
    to: email,
    subject: `Order confirmed — ${order.orderNumber}`,
    html: emailTemplate(
      'Order confirmed ✅',
      `Hi ${name}, your order is confirmed.<table style="width:100%;margin-top:12px">${rows}<tr><td style="padding-top:10px;font-weight:700">Total</td><td style="text-align:right;font-weight:700;padding-top:10px">₹${order.totalPrice.toLocaleString('en-IN')}</td></tr></table>`,
      'Track Order',
      `${process.env.CLIENT_URL}/dashboard/orders/${order._id}`
    ),
  }).catch((e) => console.warn('Order email failed:', e.message));
};

/** POST /orders — Cash on Delivery checkout. */
export const createCodOrder = catchAsync(async (req, res) => {
  const { orderData, cart } = await buildOrderFromCart(req.user, { ...req.body, paymentMethod: 'cod' });
  orderData.status = 'confirmed';
  orderData.statusHistory.push({ status: 'confirmed', note: 'Confirmed — payment on delivery' });
  const order = await Order.create(orderData);
  await finalizeOrder(order, cart);
  sendOrderEmail(order, req.user.email, req.user.name);
  res.status(201).json({ success: true, order });
});

/** GET /orders/my */
export const getMyOrders = catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 8;
  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);
  res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
});

/** GET /orders/:id — owner or admin. */
export const getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return next(new AppError('Order not found', 404));
  if (String(order.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
    return next(new AppError('You do not have access to this order', 403));
  }
  res.json({ success: true, order });
});

/** GET /orders/:id/invoice — streams a PDF. */
export const downloadInvoice = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return next(new AppError('You do not have access to this order', 403));
  }
  generateInvoicePDF(order, res);
});

/** PUT /orders/:id/cancel — user cancels own pending order. */
export const cancelMyOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));
  if (String(order.user) !== String(req.user._id)) return next(new AppError('You do not have access to this order', 403));
  if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
    return next(new AppError('This order can no longer be cancelled', 400));
  }
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by customer' });
  // Restock
  await Promise.all(order.items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: i.quantity, sold: -i.quantity } })));
  await order.save();
  await Notification.create({
    user: order.user, title: 'Order cancelled', type: 'order',
    message: `Order ${order.orderNumber} was cancelled. Any payment will be refunded in 5–7 business days.`,
    link: `/dashboard/orders/${order._id}`,
  });
  res.json({ success: true, order });
});

/* ---------------- ADMIN ---------------- */

/** GET /orders (admin) */
export const getAllOrders = catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 12;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
});

/** PUT /orders/:id/status (admin) */
export const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));
  if (['cancelled', 'refunded'].includes(order.status)) return next(new AppError(`Order is already ${order.status}`, 400));

  order.status = status;
  order.statusHistory.push({ status, note: note || `Status updated to ${status}` });
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'cod') order.paymentStatus = 'paid';
  }
  if (status === 'cancelled') {
    order.cancelledAt = new Date();
    await Promise.all(order.items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: i.quantity, sold: -i.quantity } })));
  }
  if (status === 'refunded') order.paymentStatus = 'refunded';
  await order.save();

  const titles = {
    confirmed: 'Order confirmed', processing: 'Order is being packed', shipped: 'Order shipped 🚚',
    'out-for-delivery': 'Out for delivery 📦', delivered: 'Order delivered ✅', cancelled: 'Order cancelled', refunded: 'Refund processed 💸',
  };
  await Notification.create({
    user: order.user, title: titles[status] || 'Order update', type: 'order',
    message: `Order ${order.orderNumber}: ${note || titles[status] || status}`,
    link: `/dashboard/orders/${order._id}`,
  });
  res.json({ success: true, order });
});
