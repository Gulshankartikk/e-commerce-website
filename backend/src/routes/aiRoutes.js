import express from 'express';
import {
  chatWithAssistant,
  compareProducts,
  getReviewSummary,
  getChatHistory,
  clearChatHistory,
} from '../controllers/aiController.js';
import { optionalAuth, protect } from '../middleware/auth.js';

const router = express.Router();

// Conversational shopping assistant (accessible to both guests and signed-in users)
router.post('/chat', optionalAuth, chatWithAssistant);

// Side-by-side product comparisons
router.post('/compare', compareProducts);

// Product review summaries with stored review evidence
router.post('/review-summary', getReviewSummary);
router.get('/review-summary/:productId', getReviewSummary);

// Persistent chat history for signed-in users
router.get('/history', optionalAuth, getChatHistory);
router.delete('/history', protect, clearChatHistory);

export default router;
