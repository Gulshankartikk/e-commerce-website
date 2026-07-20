import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/** GET /admin/dashboard — headline stats + sales graph + top sellers + recent orders. */
export const getDashboardStats = catchAsync(async (req, res) => {
  const days = Math.min(90, Number(req.query.days) || 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const paidMatch = { paymentStatus: 'paid', status: { $nin: ['cancelled', 'refunded'] } };

  const [revenueAgg, totalUsers, totalOrders, totalProducts, salesByDay, recentOrders, topProducts, statusBreakdown, lowStock] =
    await Promise.all([
      Order.aggregate([{ $match: paidMatch }, { $group: { _id: null, revenue: { $sum: '$totalPrice' } } }]),
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $nin: ['cancelled', 'refunded'] } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.find().populate('user', 'name email').sort('-createdAt').limit(8),
      Product.find().sort('-sold').select('name slug images price sold stock').limit(6),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Product.find({ stock: { $lte: 5 } }).select('name slug stock images').limit(8),
    ]);

  res.json({
    success: true,
    stats: {
      totalRevenue: revenueAgg[0]?.revenue || 0,
      totalUsers,
      totalOrders,
      totalProducts,
    },
    salesByDay,
    recentOrders,
    topProducts,
    statusBreakdown,
    lowStock,
  });
});

/** GET /admin/users */
export const getUsers = catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 12;
  const filter = {};
  if (req.query.keyword) {
    filter.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { email: { $regex: req.query.keyword, $options: 'i' } },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
});

/** PUT /admin/users/:id/block — toggle. */
export const toggleBlockUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (String(user._id) === String(req.user._id)) return next(new AppError('You cannot block yourself', 400));
  user.isBlocked = !user.isBlocked;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, user });
});

/** PUT /admin/users/:id/role — promote/demote admin. */
export const changeUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return next(new AppError('Role must be user or admin', 400));
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (String(user._id) === String(req.user._id)) return next(new AppError('You cannot change your own role', 400));
  user.role = role;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, user });
});

/** DELETE /admin/users/:id */
export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (String(user._id) === String(req.user._id)) return next(new AppError('You cannot delete yourself', 400));
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});
