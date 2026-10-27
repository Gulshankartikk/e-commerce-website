import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { storeImage, removeImage } from '../middleware/upload.js';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* -------- Categories -------- */

export const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name');
  res.json({ success: true, categories });
});

export const createCategory = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  if (!name) return next(new AppError('Category name is required', 400));
  const data = { name, description, slug: slugify(name) };
  if (req.file) data.image = await storeImage(req.file, 'flashshop/categories');
  const category = await Category.create(data);
  res.status(201).json({ success: true, category });
});

export const updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));
  if (req.body.name) {
    category.name = req.body.name;
    category.slug = slugify(req.body.name);
  }
  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.isActive !== undefined) category.isActive = req.body.isActive === 'true' || req.body.isActive === true;
  if (req.file) {
    await removeImage(category.image?.publicId);
    category.image = await storeImage(req.file, 'flashshop/categories');
  }
  await category.save();
  res.json({ success: true, category });
});

export const deleteCategory = catchAsync(async (req, res, next) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse > 0) return next(new AppError(`Cannot delete: ${inUse} products use this category`, 400));
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));
  await removeImage(category.image?.publicId);
  res.json({ success: true, message: 'Category deleted' });
});

/* -------- Brands -------- */

export const getBrands = catchAsync(async (req, res) => {
  const brands = await Brand.find({ isActive: true }).sort('name');
  res.json({ success: true, brands });
});

export const createBrand = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new AppError('Brand name is required', 400));
  const data = { name, slug: slugify(name) };
  if (req.file) data.logo = await storeImage(req.file, 'flashshop/brands');
  const brand = await Brand.create(data);
  res.status(201).json({ success: true, brand });
});

export const updateBrand = catchAsync(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) return next(new AppError('Brand not found', 404));
  if (req.body.name) {
    brand.name = req.body.name;
    brand.slug = slugify(req.body.name);
  }
  if (req.body.isActive !== undefined) brand.isActive = req.body.isActive === 'true' || req.body.isActive === true;
  if (req.file) {
    await removeImage(brand.logo?.publicId);
    brand.logo = await storeImage(req.file, 'flashshop/brands');
  }
  await brand.save();
  res.json({ success: true, brand });
});

export const deleteBrand = catchAsync(async (req, res, next) => {
  const inUse = await Product.countDocuments({ brand: req.params.id });
  if (inUse > 0) return next(new AppError(`Cannot delete: ${inUse} products use this brand`, 400));
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) return next(new AppError('Brand not found', 404));
  await removeImage(brand.logo?.publicId);
  res.json({ success: true, message: 'Brand deleted' });
});
