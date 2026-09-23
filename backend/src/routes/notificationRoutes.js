const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/authMiddleware');
const { sendSuccess, sendPaginated, buildPagination } = require('../utils/apiResponse');

router.use(authenticate);

// Get notifications for current user
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    return sendPaginated(
      res,
      notifications,
      { ...buildPagination(pageNum, limitNum, total), unreadCount },
      'Notifications fetched'
    );
  } catch (error) { next(error); }
});

// Mark single as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, null, 'Notification marked as read');
  } catch (error) { next(error); }
});

// Mark all as read
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) { next(error); }
});

// Unread count
router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    return sendSuccess(res, { count }, 'Unread count fetched');
  } catch (error) { next(error); }
});

module.exports = router;
