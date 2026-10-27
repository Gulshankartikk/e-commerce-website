import crypto from 'crypto';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import AIChatSession from '../models/AIChat.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import {
  generateShoppingReply,
  generateProductComparison,
  generateReviewSummary,
  extractBudgetFromText,
} from '../services/geminiService.js';

/**
 * Helper to fetch a relevant subset of catalog products for AI context.
 */
async function getRelevantCatalog(userMessage = '') {
  const budget = extractBudgetFromText(userMessage);
  const filter = { isActive: true };

  if (budget !== null) {
    filter.price = { $lte: budget };
  }

  // Retrieve up to 25 relevant products with category & brand info
  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .select('name slug description highlights price mrp stock sold ratingsAverage ratingsCount isFeatured isFlashSale tags category brand images')
    .sort('-sold -ratingsAverage')
    .limit(25)
    .lean();

  return products;
}

/**
 * POST /api/v1/ai/chat
 * Natural-language shopping concierge grounded in real catalog data.
 */
export const chatWithAssistant = catchAsync(async (req, res, next) => {
  const { message, sessionId: providedSessionId, history = [] } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return next(new AppError('A user message is required', 400));
  }

  const sessionId = providedSessionId || `session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Retrieve grounded catalog items
  const catalogProducts = await getRelevantCatalog(message);

  // Generate grounded AI response
  const aiResult = await generateShoppingReply({
    userMessage: message.trim(),
    chatHistory: history,
    catalogProducts,
  });

  // Hydrate recommended products from MongoDB
  let recommendedProducts = [];
  if (aiResult.recommendedProductIds && aiResult.recommendedProductIds.length > 0) {
    recommendedProducts = await Product.find({
      _id: { $in: aiResult.recommendedProductIds },
      isActive: true,
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .select('name slug price mrp images ratingsAverage ratingsCount stock isFeatured isFlashSale flashSaleEndsAt')
      .lean();
  }

  // Persist conversation if user is logged in
  if (req.user) {
    try {
      let session = await AIChatSession.findOne({ user: req.user._id, sessionId });
      if (!session) {
        session = new AIChatSession({
          user: req.user._id,
          sessionId,
          title: message.trim().slice(0, 40) + '...',
          messages: [],
        });
      }

      session.messages.push({
        role: 'user',
        content: message.trim(),
        metadata: { budget: aiResult.budgetDetected },
      });

      session.messages.push({
        role: 'assistant',
        content: aiResult.reply,
        products: recommendedProducts.map((p) => p._id),
        citations: aiResult.citations || [],
        abstention: aiResult.abstention || { abstained: false, reason: null },
        metadata: {
          intent: aiResult.intent,
          budget: aiResult.budgetDetected,
          retrievalLatencyMs: aiResult.retrievalLatencyMs,
          generationLatencyMs: aiResult.generationLatencyMs,
          retrievalStrategy: aiResult.retrievalStrategy,
          modelUsed: aiResult.modelUsed,
        },
      });

      // Keep recent 40 messages to prevent unbounded growth
      if (session.messages.length > 40) {
        session.messages = session.messages.slice(-40);
      }

      await session.save();
    } catch (saveErr) {
      console.warn('⚠️ Could not persist chat session:', saveErr.message);
    }
  }

  res.json({
    success: true,
    reply: aiResult.reply,
    products: recommendedProducts,
    sessionId,
    intent: aiResult.intent,
    budgetDetected: aiResult.budgetDetected,
    citations: aiResult.citations || [],
    abstention: aiResult.abstention || { abstained: false, reason: null },
    retrievalLatencyMs: aiResult.retrievalLatencyMs || 0,
    generationLatencyMs: aiResult.generationLatencyMs || 0,
    retrievalStrategy: aiResult.retrievalStrategy,
    modelUsed: aiResult.modelUsed,
  });
});

/**
 * POST /api/v1/ai/compare
 * Side-by-side product comparison grounded in exact catalog specifications.
 */
export const compareProducts = catchAsync(async (req, res, next) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds) || productIds.length < 2) {
    return next(new AppError('Please provide an array of at least 2 product IDs to compare', 400));
  }

  const products = await Product.find({
    _id: { $in: productIds.slice(0, 4) },
    isActive: true,
  })
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .lean();

  if (products.length < 2) {
    return next(new AppError('Could not find enough matching active products for comparison', 404));
  }

  const comparison = await generateProductComparison({ products });

  res.json({
    success: true,
    comparison,
    products: products.map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      mrp: p.mrp,
      images: p.images,
      ratingsAverage: p.ratingsAverage,
      ratingsCount: p.ratingsCount,
      stock: p.stock,
      highlights: p.highlights,
    })),
  });
});

/**
 * POST /api/v1/ai/review-summary
 * Synthesizes genuine customer reviews for a given product.
 */
export const getReviewSummary = catchAsync(async (req, res, next) => {
  const productId = req.body.productId || req.params.productId;
  if (!productId) {
    return next(new AppError('Product ID is required for review summary', 400));
  }

  const product = await Product.findById(productId).select('name price ratingsAverage ratingsCount').lean();
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const reviews = await Review.find({ product: productId, isApproved: true })
    .select('rating title comment createdAt')
    .sort('-createdAt')
    .limit(20)
    .lean();

  const summary = await generateReviewSummary({ product, reviews });

  res.json({
    success: true,
    product: {
      _id: product._id,
      name: product.name,
      price: product.price,
      ratingsAverage: product.ratingsAverage,
      ratingsCount: product.ratingsCount,
    },
    totalReviews: reviews.length,
    summary,
  });
});

/**
 * GET /api/v1/ai/history
 * Returns the authenticated user's recent chat history.
 */
export const getChatHistory = catchAsync(async (req, res) => {
  if (!req.user) {
    return res.json({ success: true, sessions: [], activeSession: null });
  }

  const sessions = await AIChatSession.find({ user: req.user._id })
    .populate('messages.products', 'name slug price images ratingsAverage stock')
    .sort('-updatedAt')
    .limit(5)
    .lean();

  res.json({
    success: true,
    sessions,
    activeSession: sessions.length ? sessions[0] : null,
  });
});

/**
 * DELETE /api/v1/ai/history
 * Clears chat history for the authenticated user.
 */
export const clearChatHistory = catchAsync(async (req, res) => {
  if (req.user) {
    await AIChatSession.deleteMany({ user: req.user._id });
  }
  res.json({ success: true, message: 'Chat history cleared' });
});
