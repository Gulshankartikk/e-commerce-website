import mongoose from 'mongoose';

/**
 * KnowledgeDocument Schema
 * Represents canonical source documents: store policies, FAQs, product documentation, warranty guidelines.
 */
const knowledgeDocumentSchema = new mongoose.Schema(
  {
    sourceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    documentType: {
      type: String,
      required: true,
      enum: ['policy', 'faq', 'product_doc', 'store_guide', 'warranty', 'shipping'],
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      default: '1.0.0',
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      category: { type: String, trim: true },
      effectiveDate: { type: Date, default: Date.now },
      supersedesSourceId: { type: String, default: null },
      tags: [{ type: String, trim: true }],
      author: { type: String, default: 'FlashShop Operations' },
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

knowledgeDocumentSchema.index({ documentType: 1, isActive: 1 });
knowledgeDocumentSchema.index({ 'metadata.effectiveDate': -1 });

export default mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
