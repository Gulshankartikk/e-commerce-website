import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    variant: { color: { type: String, default: '' }, size: { type: String, default: '' } },
    savedForLater: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    coupon: { code: { type: String, default: null }, discount: { type: Number, default: 0 } },
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);
