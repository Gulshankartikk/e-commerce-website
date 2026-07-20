import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, trim: true, default: '' },
    size: { type: String, trim: true, default: '' },
    stock: { type: Number, default: 0, min: 0 },
    priceDelta: { type: Number, default: 0 }, // added to base price for this variant
    sku: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: [true, 'Description is required'] },
    highlights: [{ type: String, trim: true }],
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    mrp: { type: Number, min: 0 }, // strike-through price; discount % derived on the client
    images: [{ url: { type: String, required: true }, publicId: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    variants: [variantSchema],
    colors: [{ type: String, trim: true }], // denormalized for fast filtering
    sizes: [{ type: String, trim: true }],
    stock: { type: Number, default: 0, min: 0 }, // total stock across variants (or simple stock)
    sold: { type: Number, default: 0 },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5, set: (v) => Math.round(v * 10) / 10 },
    ratingsCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isFlashSale: { type: Boolean, default: false },
    flashSaleEndsAt: { type: Date },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Text index powers live search; compound indexes power filter+sort queries
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ category: 1, brand: 1, isActive: 1 });
productSchema.index({ sold: -1 });
productSchema.index({ createdAt: -1 });

/** Discount percentage derived from mrp vs price. */
productSchema.virtual('discountPercent').get(function () {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

export default mongoose.model('Product', productSchema);
