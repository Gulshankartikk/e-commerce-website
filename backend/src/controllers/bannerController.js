import Banner from '../models/Banner.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { storeImage, removeImage } from '../middleware/upload.js';

/** GET /banners — public, active only. */
export const getBanners = catchAsync(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.position) filter.position = req.query.position;
  const banners = await Banner.find(filter).sort('order');
  res.json({ success: true, banners });
});

/** GET /banners/admin (admin) */
export const getAdminBanners = catchAsync(async (req, res) => {
  const banners = await Banner.find().sort('order');
  res.json({ success: true, banners });
});

/** POST /banners (admin) */
export const createBanner = catchAsync(async (req, res, next) => {
  if (!req.body.title) return next(new AppError('Banner title is required', 400));
  if (!req.file) return next(new AppError('Banner image is required', 400));
  const image = await storeImage(req.file, 'luxora/banners');
  const banner = await Banner.create({ ...req.body, image });
  res.status(201).json({ success: true, banner });
});

/** PUT /banners/:id (admin) */
export const updateBanner = catchAsync(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return next(new AppError('Banner not found', 404));
  if (req.file) {
    await removeImage(banner.image?.publicId);
    banner.image = await storeImage(req.file, 'luxora/banners');
  }
  const { title, subtitle, link, ctaText, position, order, isActive } = req.body;
  if (title !== undefined) banner.title = title;
  if (subtitle !== undefined) banner.subtitle = subtitle;
  if (link !== undefined) banner.link = link;
  if (ctaText !== undefined) banner.ctaText = ctaText;
  if (position !== undefined) banner.position = position;
  if (order !== undefined) banner.order = Number(order);
  if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;
  await banner.save();
  res.json({ success: true, banner });
});

/** DELETE /banners/:id (admin) */
export const deleteBanner = catchAsync(async (req, res, next) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return next(new AppError('Banner not found', 404));
  await removeImage(banner.image?.publicId);
  res.json({ success: true, message: 'Banner deleted' });
});
