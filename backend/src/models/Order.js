import mongoose from 'mongoose';

/** Snapshot of a purchased product — immutable even if the product changes later. */
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variant: { color: { type: String, default: '' }, size: { type: String, default: '' } },
  },
  { _id: true }
);

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'refunded'];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String, phone: String, line1: String, line2: String,
      city: String, state: String, pincode: String, country: { type: String, default: 'India' },
    },
    deliveryOption: { type: String, enum: ['standard', 'express'], default: 'standard' },
    paymentMethod: { type: String, enum: ['stripe', 'razorpay', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentInfo: { id: String, provider: String, signature: String },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: [{ status: { type: String, enum: ORDER_STATUSES }, at: { type: Date, default: Date.now }, note: String }],
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export { ORDER_STATUSES };
export default mongoose.model('Order', orderSchema);
