import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const CART_POPULATE = { path: 'items.product', select: 'name slug price mrp images stock isActive variants' };

// Pricing rules (INR): free shipping over ₹999, express adds ₹99, GST 18% included in listed price presentation
export const SHIPPING_FREE_ABOVE = 999;
export const SHIPPING_FLAT = 79;
export const EXPRESS_EXTRA = 99;
export const TAX_RATE = 0.18;

/** Compute cart totals server-side (single source of truth for pricing). */
export const computeTotals = (cart, deliveryOption = 'standard') => {
  const active = cart.items.filter((i) => !i.savedForLater && i.product && i.product.isActive);
  const itemsPrice = active.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  let shippingPrice = itemsPrice === 0 || itemsPrice >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_FLAT;
  if (deliveryOption === 'express' && itemsPrice > 0) shippingPrice += EXPRESS_EXTRA;
  const discount = Math.min(cart.coupon?.discount || 0, itemsPrice);
  // GST computed on the discounted goods value
  const taxPrice = Math.round((itemsPrice - discount) * TAX_RATE);
  const totalPrice = itemsPrice - discount + shippingPrice + taxPrice;
  return { itemsPrice, shippingPrice, taxPrice, discount, totalPrice };
};

/** Find or create the user's cart. */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate(CART_POPULATE);
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const respond = (res, cart, deliveryOption) =>
  res.json({ success: true, cart, totals: computeTotals(cart, deliveryOption) });

/** GET /cart */
export const getCart = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  respond(res, cart, req.query.delivery);
});

/** POST /cart — add item (or bump quantity if same product+variant). */
export const addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1, variant = {} } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) return next(new AppError('Product is unavailable', 404));
  if (product.stock < 1) return next(new AppError('Product is out of stock', 400));

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find(
    (i) =>
      String(i.product._id || i.product) === String(productId) &&
      (i.variant?.color || '') === (variant.color || '') &&
      (i.variant?.size || '') === (variant.size || '') &&
      !i.savedForLater
  );
  const newQty = (existing?.quantity || 0) + Number(quantity);
  if (newQty > product.stock) return next(new AppError(`Only ${product.stock} left in stock`, 400));
  if (newQty > 10) return next(new AppError('Maximum 10 units per product', 400));

  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: productId, quantity: Number(quantity), variant });
  await cart.save();
  await cart.populate(CART_POPULATE);
  respond(res, cart);
});

/** PUT /cart/:itemId — update quantity. */
export const updateCartItem = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) return next(new AppError('Cart item not found', 404));
  const qty = Number(quantity);
  if (!qty || qty < 1) return next(new AppError('Quantity must be at least 1', 400));
  if (qty > 10) return next(new AppError('Maximum 10 units per product', 400));
  if (item.product?.stock !== undefined && qty > item.product.stock) {
    return next(new AppError(`Only ${item.product.stock} left in stock`, 400));
  }
  item.quantity = qty;
  await cart.save();
  respond(res, cart);
});

/** PUT /cart/:itemId/save-for-later — toggle. */
export const toggleSaveForLater = catchAsync(async (req, res, next) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) return next(new AppError('Cart item not found', 404));
  item.savedForLater = !item.savedForLater;
  await cart.save();
  respond(res, cart);
});

/** DELETE /cart/:itemId */
export const removeCartItem = catchAsync(async (req, res, next) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) return next(new AppError('Cart item not found', 404));
  item.deleteOne();
  // Re-validate coupon against the smaller subtotal
  if (cart.coupon?.code) {
    const coupon = await Coupon.findOne({ code: cart.coupon.code });
    const subtotal = cart.items.filter((i) => !i.savedForLater && i.product).reduce((s, i) => s + (i.product.price || 0) * i.quantity, 0);
    cart.coupon.discount = coupon ? coupon.computeDiscount(subtotal) : 0;
    if (!cart.coupon.discount) cart.coupon = { code: null, discount: 0 };
  }
  await cart.save();
  respond(res, cart);
});

/** DELETE /cart — clear all items. */
export const clearCart = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.coupon = { code: null, discount: 0 };
  await cart.save();
  respond(res, cart);
});

/** POST /cart/coupon — apply a coupon code. */
export const applyCoupon = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  if (!code) return next(new AppError('Coupon code is required', 400));
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon) return next(new AppError('Invalid coupon code', 404));

  const cart = await getOrCreateCart(req.user._id);
  const subtotal = cart.items.filter((i) => !i.savedForLater && i.product).reduce((s, i) => s + i.product.price * i.quantity, 0);
  const discount = coupon.computeDiscount(subtotal);
  if (!discount) {
    const reason = coupon.expiresAt < new Date() ? 'Coupon has expired'
      : subtotal < coupon.minOrderAmount ? `Minimum order of ₹${coupon.minOrderAmount} required`
      : 'Coupon is no longer valid';
    return next(new AppError(reason, 400));
  }
  cart.coupon = { code: coupon.code, discount };
  await cart.save();
  respond(res, cart);
});

/** DELETE /cart/coupon */
export const removeCoupon = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.coupon = { code: null, discount: 0 };
  await cart.save();
  respond(res, cart);
});
