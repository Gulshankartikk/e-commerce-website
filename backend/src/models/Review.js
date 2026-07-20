import mongoose from 'mongoose';
import Product from './Product.js';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    comment: { type: String, required: [true, 'Comment is required'], trim: true, maxlength: 2000 },
    images: [{ url: String, publicId: String }],
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

/** Recompute a product's average rating and count. Called after create/update/delete. */
reviewSchema.statics.recalcProductRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), isApproved: true } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    ratingsAverage: stats.length ? stats[0].avg : 0,
    ratingsCount: stats.length ? stats[0].count : 0,
  });
};

export default mongoose.model('Review', reviewSchema);
