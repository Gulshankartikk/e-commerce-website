import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    citations: [
      {
        citationId: String,
        marker: String,
        chunkId: String,
        sourceId: String,
        title: String,
        url: String,
        documentType: String,
        snippet: String,
        relevanceScore: Number,
        verified: Boolean,
      },
    ],
    abstention: {
      abstained: { type: Boolean, default: false },
      reason: { type: String, default: null },
    },
    metadata: {
      intent: { type: String, default: 'chat' }, // 'chat', 'recommendation', 'compare', 'review_summary', 'policy_qa', 'unsupported'
      budget: { type: Number },
      retrievalLatencyMs: { type: Number },
      generationLatencyMs: { type: Number },
      retrievalStrategy: { type: String },
      modelUsed: { type: String },
    },
  },
  { timestamps: true }
);

const aiChatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    title: { type: String, default: 'Shopping Conversation', maxlength: 100 },
    messages: [chatMessageSchema],
  },
  { timestamps: true }
);

aiChatSessionSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('AIChatSession', aiChatSessionSchema);
