const Notification = require('../models/notificationModel');
const Task = require('../models/taskModel');
const User = require('../models/user');
const logger = require('../utils/logger');

// Create a notification
const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${error.message}`);
    throw error;
  }
};

// Create notification for individual task completion request
const createTaskCompletionNotification = async (task, userId, completionNotes) => {
  try {
    // Get user info for the message
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found for notification: ${userId}`);
      return null;
    }

    // Create notification for the task creator
    const notification = await createNotification({
      recipient: task.createdBy,
      type: 'task_completion',
      task: task._id,
      sender: userId,
      message: `${user.name} has requested approval for task completion: "${task.title}"`,
      assigneeId: userId,
      additionalData: {
        taskTitle: task.title,
        completionNotes: completionNotes || '',
        taskStatus: task.status,
        requestDate: new Date()
      }
    });

    logger.info(`Created task completion notification: ${notification._id}`);
    return notification;
  } catch (error) {
    logger.error(`Error creating task completion notification: ${error.message}`);
    return null;
  }
};

// Create notification when all assignees have completed their parts
const createAllAssigneesCompletedNotification = async (task) => {
  try {
    // Get completed assignees
    const completedAssigneeIds = task.assigneeCompletions
      .filter(completion => 
        completion.status === 'completion_requested' || completion.status === 'completed'
      )
      .map(completion => completion.assigneeId);

    // Get assignee user info for the message
    const assignees = await User.find({
      _id: { $in: completedAssigneeIds }
    });

    const assigneeNames = assignees.map(a => a.name).join(', ');
    
    // Create notification for the task creator
    const notification = await createNotification({
      recipient: task.createdBy,
      type: 'all_assignees_completed',
      task: task._id,
      message: `All assignees (${assigneeNames}) have completed their parts for task: "${task.title}"`,
      completedAssigneeIds: completedAssigneeIds,
      isAllAssigneesCompleted: true,
      additionalData: {
        taskTitle: task.title,
        taskStatus: task.status,
        completionDate: new Date(),
        assigneeCount: completedAssigneeIds.length
      }
    });

    logger.info(`Created all assignees completed notification: ${notification._id}`);
    return notification;
  } catch (error) {
    logger.error(`Error creating all assignees completed notification: ${error.message}`);
    return null;
  }
};

// Create notification for task completion review
const createTaskReviewNotification = async (task, reviewerId, isApproved, reviewNotes, assigneeId) => {
  try {
    // Get reviewer info
    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      logger.error(`Reviewer not found for notification: ${reviewerId}`);
      return null;
    }

    // Get assignee info
    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      logger.error(`Assignee not found for notification: ${assigneeId}`);
      return null;
    }

    // Create notification for the assignee
    const notification = await createNotification({
      recipient: assigneeId,
      type: 'task_completion_review',
      task: task._id,
      sender: reviewerId,
      message: `${reviewer.name} has ${isApproved ? 'approved' : 'rejected'} your completion request for task: "${task.title}"`,
      assigneeId: assigneeId,
      additionalData: {
        taskTitle: task.title,
        isApproved: isApproved,
        reviewNotes: reviewNotes || '',
        reviewDate: new Date()
      }
    });

    logger.info(`Created task review notification: ${notification._id}`);
    return notification;
  } catch (error) {
    logger.error(`Error creating task review notification: ${error.message}`);
    return null;
  }
};

// Get unread notifications for a user
const getUnreadNotifications = async (userId) => {
  try {
    const notifications = await Notification.find({
      recipient: userId,
      isRead: false
    })
    .populate('sender', 'name email')
    .populate('task', 'title status')
    .populate('assigneeId', 'name email')
    .populate('completedAssigneeIds', 'name email')
    .sort({ createdAt: -1 });

    return notifications;
  } catch (error) {
    logger.error(`Error fetching unread notifications: ${error.message}`);
    throw error;
  }
};

// Mark notifications as read
const markAsRead = async (notificationIds, userId) => {
  try {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId
      },
      {
        $set: { isRead: true }
      }
    );
    
    return result.modifiedCount;
  } catch (error) {
    logger.error(`Error marking notifications as read: ${error.message}`);
    throw error;
  }
};

// Batch process notifications for one task
const batchProcessNotifications = async (taskId, reviewerId, isApproved, reviewNotes) => {
  try {
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email');
    
    if (!task) {
      logger.error(`Task not found for batch notifications: ${taskId}`);
      return [];
    }
    
    const notifications = [];
    
    // Create a review notification for each assignee who had requested completion
    for (const completion of task.assigneeCompletions) {
      if (completion.status === 'completion_requested') {
        const notification = await createTaskReviewNotification(
          task, 
          reviewerId, 
          isApproved, 
          reviewNotes, 
          completion.assigneeId
        );
        
        if (notification) {
          notifications.push(notification);
        }
      }
    }
    
    logger.info(`Created ${notifications.length} batch notifications for task: ${taskId}`);
    return notifications;
  } catch (error) {
    logger.error(`Error in batch processing notifications: ${error.message}`);
    return [];
  }
};

// Create notification for task rejection
const createTaskRejectedNotification = async (task, reviewerId, reviewNotes, assigneeId) => {
  try {
    const reviewer = await User.findById(reviewerId);
    const assignee = await User.findById(assigneeId);
    
    if (!reviewer || !assignee) {
      logger.error('Could not find reviewer or assignee for notification');
      return null;
    }

    const notification = new Notification({
      recipient: assigneeId,
      type: 'task_rejected',
      title: 'Task Rejected - Needs Revision',
      message: `Your completion request for task "${task.title}" has been rejected by ${reviewer.name}. The task has been set back to incomplete status and needs to be completed again. ${reviewNotes ? `Reason: ${reviewNotes}` : ''}`,
      relatedTask: task._id,
      priority: 'high',
      data: {
        taskId: task._id,
        taskTitle: task.title,
        reviewerName: reviewer.name,
        reviewNotes: reviewNotes,
        rejectionTime: new Date(),
        status: 'incomplete'
      }
    });

    await notification.save();
    
    // Emit real-time notification if socket is available
    if (global.io) {
      global.io.to(assigneeId.toString()).emit('notification', {
        type: 'task_rejected',
        message: notification.message,
        data: notification.data
      });
    }

    return notification;
  } catch (error) {
    logger.error('Error creating task rejection notification:', error);
    return null;
  }
};

module.exports = {
  createNotification,
  createTaskCompletionNotification,
  createAllAssigneesCompletedNotification,
  createTaskReviewNotification,
  getUnreadNotifications,
  markAsRead,
  batchProcessNotifications,
  createTaskRejectedNotification
}; 