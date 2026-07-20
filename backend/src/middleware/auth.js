import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/** Require a valid JWT (cookie or Bearer header). Attaches req.user. */
export const protect = catchAsync(async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(new AppError('Please log in to continue', 401));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new AppError('Session expired. Please log in again', 401));
  }
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('Account no longer exists', 401));
  if (user.isBlocked) return next(new AppError('Your account has been blocked. Contact support', 403));
  req.user = user;
  next();
});

/** Role-based guard, e.g. authorize('admin'). */
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};

/** Attach req.user when logged in, but never fail — used for personalization. */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch {
    /* anonymous is fine */
  }
  next();
};
