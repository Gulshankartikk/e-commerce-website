import crypto from 'crypto';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendToken } from '../utils/sendToken.js';
import { sendEmail, emailTemplate } from '../utils/sendEmail.js';

/** POST /auth/register — create account + send verification email. */
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('An account with this email already exists', 409));

  const user = await User.create({ name, email, password });
  const rawToken = user.createToken('emailVerify');
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your LUXORA account',
    html: emailTemplate('Welcome to LUXORA 🎉', `Hi ${user.name},<br/>Confirm your email address to activate your account.`, 'Verify Email', verifyUrl),
  }).catch((e) => console.warn('Verification email failed:', e.message));

  sendToken(user, 201, res);
});

/** POST /auth/login */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Please provide email and password', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }
  if (user.isBlocked) return next(new AppError('Your account has been blocked. Contact support', 403));
  sendToken(user, 200, res);
});

/** POST /auth/logout — clear the auth cookie. */
export const logout = (req, res) => {
  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  res.json({ success: true, message: 'Logged out' });
};

/** GET /auth/me */
export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate('recentlyViewed', 'name slug price mrp images ratingsAverage');
  res.json({ success: true, user });
});

/** GET /auth/verify-email/:token */
export const verifyEmail = catchAsync(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ emailVerifyToken: hashed, emailVerifyExpires: { $gt: Date.now() } });
  if (!user) return next(new AppError('Verification link is invalid or has expired', 400));

  user.isVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Email verified successfully' });
});

/** POST /auth/resend-verification */
export const resendVerification = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (user.isVerified) return next(new AppError('Email is already verified', 400));
  const rawToken = user.createToken('emailVerify');
  await user.save({ validateBeforeSave: false });
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your LUXORA account',
    html: emailTemplate('Verify your email', `Hi ${user.name},<br/>Here is a fresh verification link.`, 'Verify Email', verifyUrl),
  });
  res.json({ success: true, message: 'Verification email sent' });
});

/** POST /auth/forgot-password */
export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  // Always respond success to avoid leaking which emails exist
  if (user) {
    const rawToken = user.createToken('resetPassword');
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your LUXORA password',
      html: emailTemplate('Password reset', `Hi ${user.name},<br/>Click below to set a new password. This link expires in 1 hour.`, 'Reset Password', resetUrl),
    }).catch((e) => console.warn('Reset email failed:', e.message));
  }
  res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
});

/** POST /auth/reset-password/:token */
export const resetPassword = catchAsync(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) return next(new AppError('Reset link is invalid or has expired', 400));
  if (!req.body.password || req.body.password.length < 8) {
    return next(new AppError('Password must be at least 8 characters', 400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  sendToken(user, 200, res);
});

/** PUT /auth/change-password */
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }
  if (!newPassword || newPassword.length < 8) return next(new AppError('New password must be at least 8 characters', 400));
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});

/** PUT /auth/profile — update name/avatar. */
export const updateProfile = catchAsync(async (req, res) => {
  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user });
});
