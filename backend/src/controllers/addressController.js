import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/** GET /addresses */
export const getAddresses = catchAsync(async (req, res) => {
  res.json({ success: true, addresses: req.user.addresses });
});

/** POST /addresses */
export const addAddress = catchAsync(async (req, res, next) => {
  const { fullName, phone, line1, city, state, pincode } = req.body;
  if (!fullName || !phone || !line1 || !city || !state || !pincode) {
    return next(new AppError('All address fields are required', 400));
  }
  if (!/^\d{6}$/.test(String(pincode))) return next(new AppError('Pincode must be 6 digits', 400));
  if (!/^[6-9]\d{9}$/.test(String(phone).replace(/\D/g, '').slice(-10))) {
    return next(new AppError('Please enter a valid 10-digit mobile number', 400));
  }
  const user = await User.findById(req.user._id);
  if (req.body.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((a) => (a.isDefault = false));
    req.body.isDefault = true;
  }
  user.addresses.push(req.body);
  await user.save({ validateBeforeSave: false });
  res.status(201).json({ success: true, addresses: user.addresses });
});

/** PUT /addresses/:addressId */
export const updateAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return next(new AppError('Address not found', 404));
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(address, req.body);
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, addresses: user.addresses });
});

/** DELETE /addresses/:addressId */
export const deleteAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return next(new AppError('Address not found', 404));
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, addresses: user.addresses });
});
