import Coupon from '../models/Coupon.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/** GET /coupons (admin) */
export const getCoupons = catchAsync(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, coupons });
});

/** POST /coupons (admin) */
export const createCoupon = catchAsync(async (req, res, next) => {
  const { code, discountType, discountValue, expiresAt } = req.body;
  if (!code || !discountType || discountValue === undefined || !expiresAt) {
    return next(new AppError('Code, type, value and expiry are required', 400));
  }
  if (discountType === 'percent' && (discountValue <= 0 || discountValue > 90)) {
    return next(new AppError('Percent discount must be between 1 and 90', 400));
  }
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

/** PUT /coupons/:id (admin) */
export const updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) return next(new AppError('Coupon not found', 404));
  res.json({ success: true, coupon });
});

/** DELETE /coupons/:id (admin) */
export const deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new AppError('Coupon not found', 404));
  res.json({ success: true, message: 'Coupon deleted' });
});
