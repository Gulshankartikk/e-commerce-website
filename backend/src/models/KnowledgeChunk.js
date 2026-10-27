import mongoose from 'mongoose';

/**
 * KnowledgeChunk Schema
 * Represents indexed semantic passages derived from canonical KnowledgeDocuments.
 * Supports dual-mode semantic search: MongoDB Atlas Vector Search ($vectorSearch)
 * and in-database/in-memory cosine similarity fallback.
 */
const knowledgeChunkSchema = new mongoose.Schema(
  {
    chunkId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
      required: true,
      index: true,
    },
    sourceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      required: true,
      select: true, // Needed for vector search
    },
    embeddingModel: {
      type: String,
      default: 'gemini-embedding-001',
    },
    embeddingDimension: {
      type: Number,
      default: 768,
    },
    metadata: {
      version: { type: String, default: '1.0.0' },
      effectiveDate: { type: Date },
      sectionHeading: { type: String, default: '' },
      tags: [{ type: String }],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for fast filtering and retrieval
knowledgeChunkSchema.index({ sourceId: 1, chunkIndex: 1 });
knowledgeChunkSchema.index({ documentType: 1, isActive: 1 });
knowledgeChunkSchema.index({ content: 'text', title: 'text' });

export default mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
