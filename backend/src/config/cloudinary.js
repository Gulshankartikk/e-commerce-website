import { v2 as cloudinary } from 'cloudinary';

/** Configure Cloudinary from env. Called once at server boot. */
export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

/** True when Cloudinary credentials are present; otherwise we fall back to local disk storage. */
export const cloudinaryEnabled = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export default cloudinary;
