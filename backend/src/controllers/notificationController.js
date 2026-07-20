import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';

/** GET /notifications */
export const getNotifications = catchAsync(async (req, res) => {
  const [notifications, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(30),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, notifications, unread });
});

/** PUT /notifications/read-all */
export const markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

/** PUT /notifications/:id/read */
export const markRead = catchAsync(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
  res.json({ success: true });
});

/** DELETE /notifications/:id */
export const deleteNotification = catchAsync(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
});
