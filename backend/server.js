import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { Server as SocketServer } from 'socket.io';

import { connectDB } from './src/config/db.js';
import { configureCloudinary } from './src/config/cloudinary.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import { sanitizeInput } from './src/middleware/validate.js';

import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import brandRoutes from './src/routes/brandRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import wishlistRoutes from './src/routes/wishlistRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import couponRoutes from './src/routes/couponRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import addressRoutes from './src/routes/addressRoutes.js';
import bannerRoutes from './src/routes/bannerRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';

const app = express();
const server = http.createServer(app);

/* ---------- CORS Configuration for Production (Vercel + Localhost) ---------- */
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''));

const corsOriginDelegate = (origin, callback) => {
  if (!origin) return callback(null, true);
  const normalized = origin.replace(/\/+$/, '');
  if (
    allowedOrigins.includes(normalized) ||
    normalized.endsWith('.vercel.app') ||
    normalized.endsWith('.onrender.com') ||
    process.env.NODE_ENV !== 'production'
  ) {
    return callback(null, true);
  }
  return callback(new Error(`CORS policy blocked origin: ${origin}`));
};

/* ---------- Socket.io: real-time notifications ---------- */
const io = new SocketServer(server, {
  cors: { origin: corsOriginDelegate, credentials: true },
});
io.on('connection', (socket) => {
  // Clients join a private room keyed by their user id after login
  socket.on('join', (userId) => {
    if (typeof userId === 'string' && userId.length < 40) socket.join(`user:${userId}`);
  });
});
// Make io available to controllers via req.app.get('io')
app.set('io', io);

/* ---------- Security & parsing middleware ---------- */
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: corsOriginDelegate, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
// NoSQL injection protection (strips $ and . operators from user input)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});
// Basic XSS input hardening
app.use(sanitizeInput);
// Global API rate limit
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down' },
}));

/* ---------- Static: locally stored uploads (Cloudinary fallback) ---------- */
app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '7d', immutable: true }));

/* ---------- Routes ---------- */
const API = '/api/v1';
const healthHandler = (req, res) => res.json({ success: true, status: 'ok', service: 'FlashShop AI Shopping API', uptime: process.uptime() });
app.get('/api/health', healthHandler);
app.get(`${API}/health`, healthHandler);
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/categories`, categoryRoutes);
app.use(`${API}/brands`, brandRoutes);
app.use(`${API}/cart`, cartRoutes);
app.use(`${API}/wishlist`, wishlistRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/reviews`, reviewRoutes);
app.use(`${API}/coupons`, couponRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/addresses`, addressRoutes);
app.use(`${API}/banners`, bannerRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/ai`, aiRoutes);

app.use(notFound);
app.use(errorHandler);

/* ---------- Boot ---------- */
const PORT = process.env.PORT || 5000;
const start = async () => {
  configureCloudinary();
  await connectDB();
  server.listen(PORT, () => console.log(`🚀 FlashShop API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`));
};
start();

// Crash safety
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION 💥', err);
});

export default app;
