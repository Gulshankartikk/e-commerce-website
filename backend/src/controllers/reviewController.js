import Review from '../models/Review.js';
import Order from '../models/Order.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { storeImage, removeImage } from '../middleware/upload.js';

/** GET /reviews/product/:productId */
export const getProductReviews = catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const [reviews, total] = await Promise.all([
    Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments({ product: req.params.productId, isApproved: true }),
  ]);
  res.json({ success: true, reviews, total, pages: Math.ceil(total / limit) });
});

/** POST /reviews — one per user per product; marks verified purchases. */
export const createReview = catchAsync(async (req, res, next) => {
  const { productId, rating, title, comment } = req.body;
  if (!productId || !rating || !comment) return next(new AppError('Product, rating and comment are required', 400));

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) return next(new AppError('You have already reviewed this product. Edit your review instead', 409));

  const images = req.files?.length ? await Promise.all(req.files.map((f) => storeImage(f, 'flashshop/reviews'))) : [];
  const review = await Review.create({ product: productId, user: req.user._id, rating: Number(rating), title, comment, images });
  await Review.recalcProductRating(productId);
  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, review });
});

/** PUT /reviews/:id — author only. */
export const updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));
  if (String(review.user) !== String(req.user._id)) return next(new AppError('You can only edit your own review', 403));

  if (req.body.rating) review.rating = Number(req.body.rating);
  if (req.body.title !== undefined) review.title = req.body.title;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  if (req.files?.length) {
    const uploaded = await Promise.all(req.files.map((f) => storeImage(f, 'flashshop/reviews')));
    review.images.push(...uploaded);
  }
  await review.save();
  await Review.recalcProductRating(review.product);
  await review.populate('user', 'name avatar');
  res.json({ success: true, review });
});

/** DELETE /reviews/:id — author or admin. */
export const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));
  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own review', 403));
  }
  await Promise.all(review.images.map((img) => removeImage(img.publicId)));
  const productId = review.product;
  await review.deleteOne();
  await Review.recalcProductRating(productId);
  res.json({ success: true, message: 'Review deleted' });
});

/** GET /reviews/admin (admin) — moderation list. */
export const getAllReviews = catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 15;
  const [reviews, total] = await Promise.all([
    Review.find().populate('user', 'name email').populate('product', 'name slug').sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Review.countDocuments(),
  ]);
  res.json({ success: true, reviews, total, pages: Math.ceil(total / limit) });
});

/** PUT /reviews/:id/approve (admin) — toggle approval. */
export const toggleApproval = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));
  review.isApproved = !review.isApproved;
  await review.save();
  await Review.recalcProductRating(review.product);
  res.json({ success: true, review });
});
