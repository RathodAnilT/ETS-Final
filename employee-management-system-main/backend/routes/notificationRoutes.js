const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const {
  getNotifications,
  markNotificationsAsRead,
  getNotificationCount,
  batchReviewCompletions
} = require('../controllers/notificationController');

// Apply auth middleware to all routes
router.use(checkAuth);

// Get notifications for the current user
router.get('/', getNotifications);

// Get unread notification count
router.get('/count', getNotificationCount);

// Mark notifications as read
router.patch('/read', markNotificationsAsRead);

// Batch review task completions
router.post('/batch-review', batchReviewCompletions);

module.exports = router; 