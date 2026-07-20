import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const POPULATE = { path: 'products', select: 'name slug price mrp images ratingsAverage ratingsCount stock' };

const getOrCreate = async (userId) => {
  let wl = await Wishlist.findOne({ user: userId }).populate(POPULATE);
  if (!wl) wl = await Wishlist.create({ user: userId, products: [] });
  return wl;
};

/** GET /wishlist */
export const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await getOrCreate(req.user._id);
  res.json({ success: true, wishlist });
});

/** POST /wishlist/:productId — toggle add/remove. */
export const toggleWishlist = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return next(new AppError('Product not found', 404));

  const wishlist = await getOrCreate(req.user._id);
  const exists = wishlist.products.some((p) => String(p._id || p) === String(product._id));
  if (exists) {
    wishlist.products = wishlist.products.filter((p) => String(p._id || p) !== String(product._id));
  } else {
    wishlist.products.push(product._id);
  }
  await wishlist.save();
  await wishlist.populate(POPULATE);
  res.json({ success: true, wishlist, added: !exists });
});
