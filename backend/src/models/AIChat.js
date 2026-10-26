import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    metadata: {
      intent: { type: String, default: 'chat' }, // 'chat', 'recommendation', 'compare', 'review_summary'
      budget: { type: Number },
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
