import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    image: { url: { type: String, required: true }, publicId: String },
    link: { type: String, default: '/products' },
    ctaText: { type: String, default: 'Shop Now' },
    position: { type: String, enum: ['hero', 'strip', 'sidebar'], default: 'hero' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
