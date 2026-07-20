import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percent', 'flat'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // cap for percent coupons
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // total redemptions allowed
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** Compute discount for a given cart subtotal. Returns 0 if not applicable. */
couponSchema.methods.computeDiscount = function (subtotal) {
  if (!this.isActive || this.expiresAt < new Date()) return 0;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return 0;
  if (subtotal < this.minOrderAmount) return 0;
  let discount = this.discountType === 'percent' ? (subtotal * this.discountValue) / 100 : this.discountValue;
  if (this.discountType === 'percent' && this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  return Math.min(Math.round(discount), subtotal);
};

export default mongoose.model('Coupon', couponSchema);
