const Notification = require('../models/notificationModel');
const Task = require('../models/taskModel');
const User = require('../models/user');
const notificationService = require('../services/notificationService');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

// Get notifications for the current user
exports.getNotifications = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    // Base query
    const query = { recipient: userId };
    
    // Filter by read status if specified
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get notifications
    const notifications = await Notification.find(query)
      .populate('sender', 'name email position department')
      .populate('task', 'title status priority dueDate')
      .populate('assigneeId', 'name email position department')
      .populate('completedAssigneeIds', 'name email position department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    // Get total count
    const total = await Notification.countDocuments(query);
    
    // Response
    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: notifications
    });
    
  } catch (error) {
    logger.error(`Error getting notifications: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
});

// Get unread notification count
exports.getNotificationCount = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Count unread notifications
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });
    
    res.status(200).json({
      success: true,
      count
    });
    
  } catch (error) {
    logger.error(`Error getting notification count: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notification count',
      error: error.message
    });
  }
});

// Mark notifications as read
exports.markNotificationsAsRead = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds, markAll = false } = req.body;
    
    let modifiedCount = 0;
    
    if (markAll) {
      // Mark all notifications as read
      const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true } }
      );
      
      modifiedCount = result.modifiedCount;
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      modifiedCount = await notificationService.markAsRead(notificationIds, userId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide notification IDs or set markAll to true'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Marked ${modifiedCount} notifications as read`,
      modifiedCount
    });
    
  } catch (error) {
    logger.error(`Error marking notifications as read: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
});

// Batch review task completions
exports.batchReviewCompletions = asyncHandler(async (req, res) => {
  try {
    const { taskId, approved, reviewNotes, assigneeIds } = req.body;
    const userId = req.user.id;
    
    // Validate request
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }
    
    if (approved === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Approval status is required'
      });
    }
    
    // Find the task
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if user is authorized to review (task creator or manager)
    const user = await User.findById(userId);
    const isTaskCreator = task.createdBy.toString() === userId;
    const isManager = user && user.role === 'manager';
    
    if (!isTaskCreator && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Only the task creator or managers can review task completions'
      });
    }
    
    // Record old status
    const oldStatus = task.status;
    
    // If assigneeIds provided, review only those assignees
    // Otherwise, review all assignees with 'completion_requested' status
    const assigneesToReview = assigneeIds && assigneeIds.length > 0
      ? task.assigneeCompletions.filter(c => 
          assigneeIds.includes(c.assigneeId.toString()) && 
          c.status === 'completion_requested'
        )
      : task.assigneeCompletions.filter(c => c.status === 'completion_requested');
    
    if (assigneesToReview.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No completion requests to review for the specified assignees'
      });
    }
    
    // Update completion status for selected assignees
    const updatedAssignees = [];
    
    assigneesToReview.forEach(completion => {
      // Store old status for history
      const oldAssigneeStatus = completion.status;
      
      // Update the status based on approval
      completion.status = approved ? 'completed' : 'pending';
      completion.reviewedBy = userId;
      completion.reviewedAt = new Date();
      completion.reviewNotes = reviewNotes || '';
      
      // Add to updatedAssignees for response
      updatedAssignees.push({
        assigneeId: completion.assigneeId,
        oldStatus: oldAssigneeStatus,
        newStatus: completion.status
      });
      
      // Add history entry for this assignee's completion
      task.addHistory(
        `assigneeCompletion.${completion.assigneeId}`, 
        oldAssigneeStatus, 
        completion.status, 
        userId
      );
    });
    
    // Check if all assignees are now complete
    const allCompleted = approved && task.assignedTo.every(assigneeId => {
      const completion = task.assigneeCompletions.find(
        c => c.assigneeId.toString() === assigneeId.toString()
      );
      return completion && completion.status === 'completed';
    });
    
    // Update overall task status if all assignees are now complete
    if (allCompleted) {
      task.status = 'completed';
      task.completedAt = new Date();
      
      // Add history for status change
      if (oldStatus !== 'completed') {
        task.addHistory('status', oldStatus, 'completed', userId);
      }
    } else if (!approved && task.status === 'completion_requested' && 
              task.assigneeCompletions.every(c => c.status !== 'completion_requested')) {
      // If all completion requests are now rejected, update task status
      task.status = 'incomplete';
      
      // Add history for status change
      task.addHistory('status', oldStatus, 'incomplete', userId);
    }
    
    await task.save();
    
    // Create notifications for all reviewed assignees
    const notifications = await Promise.all(
      updatedAssignees.map(async update => {
        return await notificationService.createTaskReviewNotification(
          task,
          userId,
          approved,
          reviewNotes,
          update.assigneeId
        );
      })
    );
    
    // Response
    res.status(200).json({
      success: true,
      message: `Batch reviewed ${updatedAssignees.length} completion requests`,
      task,
      updatedAssignees,
      notificationsCreated: notifications.filter(n => n !== null).length,
      allAssigneesCompleted: allCompleted
    });
    
  } catch (error) {
    logger.error(`Error in batch review completions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error reviewing task completions',
      error: error.message
    });
  }
}); 