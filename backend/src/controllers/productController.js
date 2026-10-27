import Product from '../models/Product.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import ApiFeatures from '../utils/apiFeatures.js';
import { storeImage, removeImage } from '../middleware/upload.js';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** GET /products — list with search, filters, sorting, pagination. */
export const getProducts = catchAsync(async (req, res) => {
  const base = Product.find({ isActive: true });
  const features = new ApiFeatures(base, req.query).search().filter().sort().paginate();
  const [products, total] = await Promise.all([
    features.query.populate('category', 'name slug').populate('brand', 'name slug').lean({ virtuals: true }),
    Product.countDocuments({ isActive: true, ...features.filterConditions }),
  ]);
  res.json({
    success: true,
    count: products.length,
    total,
    page: features.page,
    pages: Math.ceil(total / features.limit),
    products,
  });
});

/** GET /products/suggestions?keyword= — lightweight live-search payload. */
export const getSuggestions = catchAsync(async (req, res) => {
  const kw = String(req.query.keyword || '').trim();
  if (kw.length < 2) return res.json({ success: true, suggestions: [] });
  const suggestions = await Product.find({
    isActive: true,
    $or: [{ name: { $regex: kw, $options: 'i' } }, { tags: { $regex: kw, $options: 'i' } }],
  })
    .select('name slug price images ratingsAverage')
    .limit(6)
    .lean();
  res.json({ success: true, suggestions });
});

/** GET /products/home — one round-trip payload for the landing page. */
export const getHomeData = catchAsync(async (req, res) => {
  const sel = 'name slug price mrp images ratingsAverage ratingsCount sold isFlashSale flashSaleEndsAt stock colors';
  const [featured, bestSellers, flashSale, newArrivals, trending] = await Promise.all([
    Product.find({ isActive: true, isFeatured: true }).select(sel).limit(8).lean({ virtuals: true }),
    Product.find({ isActive: true }).sort('-sold').select(sel).limit(8).lean({ virtuals: true }),
    Product.find({ isActive: true, isFlashSale: true }).select(sel).limit(8).lean({ virtuals: true }),
    Product.find({ isActive: true }).sort('-createdAt').select(sel).limit(8).lean({ virtuals: true }),
    Product.find({ isActive: true }).sort('-ratingsCount -sold').select(sel).limit(8).lean({ virtuals: true }),
  ]);
  res.json({ success: true, featured, bestSellers, flashSale, newArrivals, trending });
});

/** GET /products/:slug — details + related; records recently-viewed for logged-in users. */
export const getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('brand', 'name slug');
  if (!product) return next(new AppError('Product not found', 404));

  const [related, reviews] = await Promise.all([
    Product.find({ category: product.category._id, _id: { $ne: product._id }, isActive: true })
      .select('name slug price mrp images ratingsAverage ratingsCount stock')
      .limit(8)
      .lean({ virtuals: true }),
    Review.find({ product: product._id, isApproved: true }).populate('user', 'name avatar').sort('-createdAt').limit(20),
  ]);

  // Track recently viewed (fire and forget)
  if (req.user) {
    User.findByIdAndUpdate(req.user._id, {
      $pull: { recentlyViewed: product._id },
    })
      .then(() => User.findByIdAndUpdate(req.user._id, { $push: { recentlyViewed: { $each: [product._id], $position: 0, $slice: 12 } } }))
      .catch(() => {});
  }

  res.json({ success: true, product, related, reviews });
});

/* ------------------------- ADMIN ------------------------- */

/** POST /products (admin) — multipart with up to 6 images. */
export const createProduct = catchAsync(async (req, res, next) => {
  const body = { ...req.body };
  // Multipart sends JSON fields as strings
  for (const f of ['variants', 'highlights', 'colors', 'sizes', 'tags']) {
    if (typeof body[f] === 'string' && body[f]) {
      try { body[f] = JSON.parse(body[f]); } catch { return next(new AppError(`Invalid JSON in field: ${f}`, 400)); }
    }
  }
  if (!req.files?.length) return next(new AppError('At least one product image is required', 400));

  body.slug = slugify(body.name || '');
  const clash = await Product.findOne({ slug: body.slug });
  if (clash) body.slug = `${body.slug}-${Date.now().toString(36)}`;

  body.images = await Promise.all(req.files.map((f) => storeImage(f, 'flashshop/products')));
  if (Array.isArray(body.variants) && body.variants.length) {
    body.stock = body.variants.reduce((s, v) => s + Number(v.stock || 0), 0);
    body.colors = [...new Set(body.variants.map((v) => v.color).filter(Boolean))];
    body.sizes = [...new Set(body.variants.map((v) => v.size).filter(Boolean))];
  }
  const product = await Product.create(body);
  res.status(201).json({ success: true, product });
});

/** PUT /products/:id (admin) */
export const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  const body = { ...req.body };
  for (const f of ['variants', 'highlights', 'colors', 'sizes', 'tags', 'existingImages']) {
    if (typeof body[f] === 'string' && body[f]) {
      try { body[f] = JSON.parse(body[f]); } catch { return next(new AppError(`Invalid JSON in field: ${f}`, 400)); }
    }
  }
  // Handle image replacement: keep listed existing images, add new uploads, delete removed
  if (body.existingImages) {
    const keepIds = new Set(body.existingImages.map((i) => i.publicId).filter(Boolean));
    for (const img of product.images) {
      if (img.publicId && !keepIds.has(img.publicId)) await removeImage(img.publicId);
    }
    body.images = body.existingImages;
    delete body.existingImages;
  }
  if (req.files?.length) {
    const uploaded = await Promise.all(req.files.map((f) => storeImage(f, 'flashshop/products')));
    body.images = [...(body.images || product.images), ...uploaded];
  }
  if (body.name && body.name !== product.name) body.slug = slugify(body.name);
  if (Array.isArray(body.variants) && body.variants.length) {
    body.stock = body.variants.reduce((s, v) => s + Number(v.stock || 0), 0);
    body.colors = [...new Set(body.variants.map((v) => v.color).filter(Boolean))];
    body.sizes = [...new Set(body.variants.map((v) => v.size).filter(Boolean))];
  }

  Object.assign(product, body);
  await product.save();
  res.json({ success: true, product });
});

/** DELETE /products/:id (admin) — removes images + reviews too. */
export const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  await Promise.all(product.images.map((img) => removeImage(img.publicId)));
  await Review.deleteMany({ product: product._id });
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

/** GET /products/admin/all — includes inactive, for the admin table. */
export const getAdminProducts = catchAsync(async (req, res) => {
  const features = new ApiFeatures(Product.find(), req.query).search().filter().sort().paginate();
  const [products, total] = await Promise.all([
    features.query.populate('category', 'name').populate('brand', 'name').lean({ virtuals: true }),
    Product.countDocuments(features.filterConditions),
  ]);
  res.json({ success: true, products, total, page: features.page, pages: Math.ceil(total / features.limit) });
});

/** PUT /products/:id/stock (admin) — quick inventory adjustment. */
export const updateStock = catchAsync(async (req, res, next) => {
  const { stock } = req.body;
  if (stock === undefined || Number(stock) < 0) return next(new AppError('Stock must be a non-negative number', 400));
  const product = await Product.findByIdAndUpdate(req.params.id, { stock: Number(stock) }, { new: true });
  if (!product) return next(new AppError('Product not found', 404));
  res.json({ success: true, product });
});
