import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../utils/AppError.js';
import cloudinary, { cloudinaryEnabled } from '../config/cloudinary.js';

// Local uploads dir (fallback when Cloudinary is not configured)
const UPLOAD_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|avif|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new AppError('Only image files (png, jpg, webp, avif, gif) are allowed', 400));
};

/** Multer instance: images only, 5MB cap, up to 6 files. */
export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 6 } });

/**
 * Upload one buffer to Cloudinary (if configured) or local disk.
 * Returns { url, publicId }.
 */
export const storeImage = async (file, folder = 'flashshop') => {
  if (cloudinaryEnabled()) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
        (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }))
      );
      stream.end(file.buffer);
    });
  }
  // Local fallback — served from /uploads by Express
  const ext = path.extname(file.originalname) || '.jpg';
  const name = `${folder.replace(/\//g, '-')}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer);
  return { url: `/uploads/${name}`, publicId: name };
};

/** Delete a stored image by publicId (Cloudinary or local file). */
export const removeImage = async (publicId) => {
  if (!publicId) return;
  try {
    if (cloudinaryEnabled() && !publicId.includes('.')) await cloudinary.uploader.destroy(publicId);
    else {
      const p = path.join(UPLOAD_DIR, path.basename(publicId));
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  } catch (e) {
    console.warn('Image cleanup failed:', e.message);
  }
};
