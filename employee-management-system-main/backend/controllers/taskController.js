const Task = require("../models/taskModel");
const User = require("../models/user");
const mongoose = require('mongoose');
const { validationResult } = require("express-validator");
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');

// Helper function to build filters
const buildTaskFilters = (queryParams) => {
  const filters = { isDeleted: false };
  
  // Status filter
  if (queryParams.status) {
    filters.status = queryParams.status;
  }
  
  // Priority filter
  if (queryParams.priority) {
    filters.priority = queryParams.priority;
  }
  
  // Due date filter
  if (queryParams.dueDateFrom || queryParams.dueDateTo) {
    filters.dueDate = {};
    if (queryParams.dueDateFrom) {
      filters.dueDate.$gte = new Date(queryParams.dueDateFrom);
    }
    if (queryParams.dueDateTo) {
      filters.dueDate.$lte = new Date(queryParams.dueDateTo);
    }
  }
  
  // Overdue tasks
  if (queryParams.overdue === 'true') {
    filters.dueDate = { $lt: new Date() };
    filters.status = { $ne: 'completed' };
  }
  
  // Due today
  if (queryParams.dueToday === 'true') {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    
    filters.dueDate = { 
      $gte: today,
      $lt: tomorrow
    };
  }
  
  // Created by filter
  if (queryParams.createdBy) {
    filters.createdBy = queryParams.createdBy;
  }
  
  // Assigned to filter
  if (queryParams.assignedTo) {
    filters.assignedTo = queryParams.assignedTo;
  }
  
  // Department filter
  if (queryParams.department) {
    filters.department = queryParams.department;
  }
  
  // Search by text
  if (queryParams.search) {
    filters.$text = { $search: queryParams.search };
  }
  
  return filters;
};

// Get all tasks with filtering and pagination
exports.getTasks = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filters from query parameters
    const filters = buildTaskFilters(req.query);
    
    // Sort options
    let sortBy = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sortBy[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      // Default sort by creation date
      sortBy = { createdAt: -1 };
    }
    
    // Count total matching documents for pagination
    const totalTasks = await Task.countDocuments(filters);
    
    // Get tasks with populated user references
    const tasks = await Task.find(filters)
      .populate('createdBy', 'name email position department')
      .populate('assignedTo', 'name email position department')
      .populate('completionReviewedBy', 'name email position department')
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalTasks / limit);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: {
        total: totalTasks,
        page,
        pages: totalPages,
        limit
      },
      data: tasks
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving tasks',
      error: error.message
    });
  }
};

// Get single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    })
      .populate('createdBy', 'name email position department')
      .populate('assignedTo', 'name email position department')
      .populate('completionReviewedBy', 'name email position department')
      .populate('history.updatedBy', 'name email')
      .populate('comments.author', 'name email');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving task',
      error: error.message
    });
  }
};

// Create new task
exports.createTask = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      department,
      tags
    } = req.body;
    
    // Check if assignedTo users exist
    if (assignedTo && assignedTo.length > 0) {
      const userCount = await User.countDocuments({
        _id: { $in: assignedTo }
      });
      
      if (userCount !== assignedTo.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more assigned users do not exist'
        });
      }
    }
    
    // Initialize assigneeCompletions array if there are assigned users
    const assigneeCompletions = [];
    if (assignedTo && assignedTo.length > 0) {
      assignedTo.forEach(userId => {
        assigneeCompletions.push({
          assigneeId: userId,
          status: 'pending'
        });
      });
    }
    
    // Create new task
    const task = new Task({
      title,
      description,
      status: status || 'incomplete',
      priority: priority || 'medium',
      createdBy: req.user.id,
      assignedTo: assignedTo || [],
      assigneeCompletions,
      dueDate: dueDate || null,
      department: department || '',
      tags: tags || []
    });
    
    await task.save();
    
    // Return newly created task with populated fields
    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email position department')
      .populate('assignedTo', 'name email position department');
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Find task to update
    const task = await Task.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check permissions - only creator or assigned users can update
    const isCreator = task.createdBy.toString() === req.user.id;
    const isAssigned = task.assignedTo.some(user => user.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin' || req.user.isSuperUser;
    
    if (!isCreator && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }
    
    // Store original task for history tracking
    const originalTask = task.toObject();
    
    // Special handling for assignedTo changes
    if (req.body.assignedTo !== undefined) {
      const currentAssignees = task.assignedTo.map(id => id.toString());
      const newAssignees = req.body.assignedTo;
      
      // Record history before updating
      if (JSON.stringify(currentAssignees) !== JSON.stringify(newAssignees)) {
        task.addHistory('assignedTo', currentAssignees, newAssignees, req.user.id);
      }
      
      // Update assignedTo
      task.assignedTo = newAssignees;
      
      // Update assigneeCompletions to match the new assignedTo list
      // Keep existing entries for assignees that are still assigned
      const updatedCompletions = task.assigneeCompletions.filter(completion => 
        newAssignees.includes(completion.assigneeId.toString())
      );
      
      // Add new entries for newly assigned users
      newAssignees.forEach(assigneeId => {
        const exists = updatedCompletions.some(
          completion => completion.assigneeId.toString() === assigneeId.toString()
        );
        
        if (!exists) {
          updatedCompletions.push({
            assigneeId,
            status: 'pending',
          });
        }
      });
      
      task.assigneeCompletions = updatedCompletions;
    }
    
    // Update other allowed fields
    const fieldsToUpdate = [
      'title', 'description', 'status', 'priority',
      'dueDate', 'department', 'tags'
    ];
    
    for (const field of fieldsToUpdate) {
      if (req.body[field] !== undefined) {
        // Add to history before updating if the value has changed
        if (JSON.stringify(task[field]) !== JSON.stringify(req.body[field])) {
          task.addHistory(field, task[field], req.body[field], req.user.id);
        }
        
        // Update the field
        task[field] = req.body[field];
      }
    }
    
    // If the task is updated and the status was completion_requested,
    // check if we need to reset it based on assignee completion status
    if (task.status === 'completion_requested') {
      const allAssigneesRequested = task.areAllAssigneesComplete();
      
      if (!allAssigneesRequested) {
        // Not all assignees have requested completion, so reset the task status
        task.status = 'incomplete';
        task.addHistory('status', 'completion_requested', 'incomplete', req.user.id);
      }
    }
    
    // Save updated task
    await task.save();
    
    // Return updated task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email position department')
      .populate('assignedTo', 'name email position department')
      .populate('history.updatedBy', 'name email')
      .populate('assigneeCompletions.assigneeId', 'name email position department');
    
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// Delete task (soft delete)
exports.deleteTask = async (req, res) => {
  try {
    // Find task to delete
    const task = await Task.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check permissions - only creator or admin can delete
    const isCreator = task.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isSuperUser;
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }
    
    // Soft delete by marking as deleted
    task.isDeleted = true;
    await task.save();
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { content } = req.body;
    
    // Find task
    const task = await Task.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Add comment
    task.comments.push({
      content,
      author: req.user.id,
      createdAt: new Date()
    });
    
    await task.save();
    
    // Return task with populated comments
    const updatedTask = await Task.findById(task._id)
      .populate('comments.author', 'name email');
    
    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: updatedTask.comments[updatedTask.comments.length - 1]
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// Request task completion
exports.requestTaskCompletion = asyncHandler(async (req, res) => {
  try {
    const taskId = req.params.taskId; // This is the _id of the task from the route parameter
    const userId = req.user.id; // Use the authenticated user's ID
    const { completionNotes } = req.body;

    logger.info(`Attempting to request task completion for task: ${taskId} by user: ${userId}`);

    // Find the task by _id, not taskId field
    const task = await Task.findOne({ _id: taskId, isDeleted: false });

    if (!task) {
      logger.error(`Task not found: ${taskId}`);
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is assigned to the task
    let isAssigned = false;
    
    // Handle different formats of assignedTo (array, object with _id, or string ID)
    if (Array.isArray(task.assignedTo)) {
      isAssigned = task.assignedTo.some(user => 
        user._id ? user._id.toString() === userId : user.toString() === userId
      );
    } else if (task.assignedTo) {
      const assignedId = task.assignedTo._id 
        ? task.assignedTo._id.toString() 
        : task.assignedTo.toString();
      isAssigned = assignedId === userId;
    }

    if (!isAssigned) {
      logger.error(`User ${userId} not assigned to task ${taskId}`);
      return res.status(403).json({
        success: false,
        message: "You must be assigned to this task to request completion",
      });
    }

    // Check if task is already completed
    if (task.status === 'completed') {
      logger.error(`Task ${taskId} is already completed`);
      return res.status(400).json({
        success: false,
        message: "Task is already marked as completed",
      });
    }

    // Check if this specific user has already requested completion
    const existingCompletion = task.assigneeCompletions.find(
      completion => completion.assigneeId.toString() === userId && 
      (completion.status === 'completion_requested' || completion.status === 'completed')
    );

    if (existingCompletion) {
      logger.error(`User ${userId} has already requested completion for task ${taskId}`);
      return res.status(400).json({
        success: false,
        message: "You have already submitted your part of this task",
      });
    }

    // Record the old status for history
    const oldStatus = task.status;
    
    // Find or create the assignee completion entry
    let assigneeCompletion = task.assigneeCompletions.find(
      completion => completion.assigneeId.toString() === userId
    );

    if (!assigneeCompletion) {
      // Create a new completion entry if one doesn't exist
      assigneeCompletion = {
        assigneeId: userId,
        status: 'completion_requested',
        completionRequestedAt: new Date(),
        completionNotes: completionNotes || ''
      };
      task.assigneeCompletions.push(assigneeCompletion);
    } else {
      // Update existing completion entry
      assigneeCompletion.status = 'completion_requested';
      assigneeCompletion.completionRequestedAt = new Date();
      assigneeCompletion.completionNotes = completionNotes || '';
    }
    
    // Check if all assignees have completed their parts
    let allCompleted = false;
    
    // Use the model method if it exists, otherwise implement the check here
    if (typeof task.areAllAssigneesComplete === 'function') {
      allCompleted = task.areAllAssigneesComplete();
    } else {
      // Fallback implementation
      allCompleted = task.assignedTo.every(assigneeId => {
        const assigneeIdStr = assigneeId._id ? assigneeId._id.toString() : assigneeId.toString();
        const completion = task.assigneeCompletions.find(c => c.assigneeId.toString() === assigneeIdStr);
        return completion && (completion.status === 'completion_requested' || completion.status === 'completed');
      });
    }
    
    // Update overall task status only if all assignees have requested completion
    if (allCompleted && task.status !== 'completion_requested') {
      task.status = 'completion_requested';
      task.completionRequestDate = new Date();
      
      // Add to task history if the method exists
      if (typeof task.addHistory === 'function') {
        task.addHistory('status', oldStatus, 'completion_requested', userId);
      }
      
      // Send a special notification to the task creator about all assignees completing their parts
      await notificationService.createAllAssigneesCompletedNotification(task);
      
      logger.info(`All assignees have completed their parts for task: ${taskId}`);
    }
    
    // Add to history for this user's completion if the method exists
    if (typeof task.addHistory === 'function') {
      task.addHistory('assigneeCompletion', 
        { assigneeId: userId, status: 'pending' }, 
        { assigneeId: userId, status: 'completion_requested' }, 
        userId
      );
    }

    await task.save();

    // Create notification for this individual completion
    const completionNotification = await notificationService.createTaskCompletionNotification(
      task,
      userId,
      completionNotes
    );

    // If all assignees have completed, create a special notification
    let allCompletedNotification = null;
    if (allCompleted) {
      allCompletedNotification = await notificationService.createAllAssigneesCompletedNotification(task);
    }

    // Get task creator
    const taskCreator = await User.findById(task.createdBy);
    
    // Response notification details
    const notificationDetails = {
      taskId: task.taskId,
      taskTitle: task.title,
      requestedBy: userId,
      creatorId: task.createdBy,
      creatorName: taskCreator ? taskCreator.name : 'Unknown',
      completionNotes: completionNotes || '',
      isPartialCompletion: !allCompleted
    };

    logger.info(`Task completion requested for task: ${taskId} by user: ${userId}`);
    logger.info(`All users completed: ${allCompleted}`);
    logger.info(`Notification details: ${JSON.stringify(notificationDetails)}`);

    return res.status(200).json({
      success: true,
      message: "Your part of the task has been marked as completed",
      task,
      notificationDetails,
      allUsersCompleted: allCompleted,
      notificationsCreated: {
        individual: completionNotification ? true : false,
        allCompleted: allCompletedNotification ? true : false
      }
    });
    
  } catch (error) {
    logger.error(`Error in requestTaskCompletion: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error requesting task completion",
      error: error.message,
    });
  }
});

// Review task completion
exports.reviewTaskCompletion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { approved, reviewNotes } = req.body;
    const userId = req.user.id;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is authorized to review this task
    if (task.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this task'
      });
    }

    // Store old status for history
    const oldStatus = task.status;
    
    // Update completion status for all assignees who have requested completion
    const updatedAssignees = [];
    
    task.assigneeCompletions.forEach(completion => {
      if (completion.status === 'completion_requested') {
        // Store old status for history
        const oldAssigneeStatus = completion.status;
        
        // Update the status based on approval
        if (approved) {
          completion.status = 'completed';
        } else {
          // If rejected, set status to rejected
          completion.status = 'rejected';
          completion.completionRequestedAt = null;
          completion.completionNotes = '';
        }
        
        completion.reviewedBy = userId;
        completion.reviewedAt = new Date();
        completion.reviewNotes = reviewNotes || '';
        
        // Add to updatedAssignees for response and notification
        updatedAssignees.push({
          assigneeId: completion.assigneeId,
          oldStatus: oldAssigneeStatus,
          newStatus: completion.status
        });
        
        // Add history entry for this assignee's completion if the method exists
        if (typeof task.addHistory === 'function') {
          task.addHistory(
            `assigneeCompletion.${completion.assigneeId}`, 
            oldAssigneeStatus, 
            completion.status, 
            userId
          );
        }
      }
    });
    
    // Check if all assignees have completed their parts after this update
    let allCompleted = false;
    if (approved) {
      // Use the model method if it exists, otherwise implement the check here
      if (typeof task.areAllAssigneesComplete === 'function') {
        allCompleted = task.areAllAssigneesComplete();
      } else {
        // Fallback implementation
        allCompleted = task.assignedTo.every(assignee => {
          const assigneeIdStr = assignee._id ? assignee._id.toString() : assignee.toString();
          const completion = task.assigneeCompletions.find(c => 
            c.assigneeId.toString() === assigneeIdStr
          );
          return completion && completion.status === 'completed';
        });
      }
    }
    
    // Update overall task status
    if (allCompleted) {
      task.status = 'completed';
      task.completedAt = new Date();
    } else if (!approved) {
      // If rejecting, set status to rejected
      task.status = 'rejected';
      task.completionReviewDate = new Date();
      task.completionReviewedBy = userId;
      task.completionReviewNotes = reviewNotes || '';
      
      // Reset completion request details
      task.completionRequest = {
        requestedBy: null,
        requestedAt: null,
        notes: '',
        status: 'rejected'
      };

      // Reset completedAt if it exists
      task.completedAt = null;
      
      // Reset any completion-related fields
      task.completionDate = null;
      task.completedBy = null;
    }
    
    // Add history entries for overall task status if it changed and the method exists
    if (task.status !== oldStatus && typeof task.addHistory === 'function') {
      task.addHistory('status', oldStatus, task.status, userId);
    }
    
    await task.save();

    // Create notifications for each assignee whose completion was reviewed
    const reviewNotifications = await Promise.all(
      updatedAssignees.map(async (assignee) => {
        const notification = await notificationService.createTaskReviewNotification(
          task,
          userId,
          approved,
          reviewNotes,
          assignee.assigneeId
        );

        // If task was rejected, create an additional notification for the assignee
        if (!approved) {
          await notificationService.createTaskRejectedNotification(
            task,
            userId,
            reviewNotes,
            assignee.assigneeId
          );
        }

        return notification;
      })
    );

    res.status(200).json({
      success: true,
      message: approved ? 'Task approved successfully' : 'Task rejected and returned to assignee',
      task: task
    });
  } catch (error) {
    console.error('Error reviewing task completion:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing task completion',
      error: error.message
    });
  }
};

// Get tasks statistics
exports.getTaskStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Tasks created by user
    const createdByUser = await Task.countDocuments({ 
      createdBy: userId,
      isDeleted: false 
    });
    
    // Tasks assigned to user
    const assignedToUser = await Task.countDocuments({ 
      assignedTo: userId,
      isDeleted: false 
    });
    
    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Format status counts
    const statusCounts = {
      incomplete: 0,
      on_hold: 0,
      completion_requested: 0,
      completed: 0
    };
    
    tasksByStatus.forEach(item => {
      statusCounts[item._id] = item.count;
    });
    
    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    // Format priority counts
    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    tasksByPriority.forEach(item => {
      priorityCounts[item._id] = item.count;
    });
    
    // Overdue tasks
    const overdueCount = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
      isDeleted: false
    });
    
    // Tasks due today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dueTodayCount = await Task.countDocuments({
      dueDate: { $gte: today, $lt: tomorrow },
      isDeleted: false
    });
    
    // Response
    res.status(200).json({
      success: true,
      data: {
        totalTasks: await Task.countDocuments({ isDeleted: false }),
        createdByUser,
        assignedToUser,
        status: statusCounts,
        priority: priorityCounts,
        overdue: overdueCount,
        dueToday: dueTodayCount
      }
    });
  } catch (error) {
    console.error('Error getting task statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving task statistics',
      error: error.message
    });
  }
};

// Get pending completion requests (for task creators)
exports.getPendingCompletionRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find tasks created by user that have completion requests (either overall status or individual assignees)
    const tasks = await Task.find({
      createdBy: userId,
      isDeleted: false,
      $or: [
        { status: 'completion_requested' },
        { 'assigneeCompletions.status': 'completion_requested' }
      ]
    })
    .populate('assignedTo', 'name email position department')
    .populate('assigneeCompletions.assigneeId', 'name email position department')
    .sort({ updatedAt: -1 });
    
    // Format the results to show completion status for each task
    const formattedTasks = tasks.map(task => {
      const taskObj = task.toObject();
      
      // Calculate completion statistics
      const totalAssignees = task.assignedTo.length;
      const completionRequested = task.assigneeCompletions.filter(c => 
        c.status === 'completion_requested' || c.status === 'completed'
      ).length;
      
      // Add completion progress information
      taskObj.completionProgress = {
        total: totalAssignees,
        completed: completionRequested,
        percentage: totalAssignees > 0 ? (completionRequested / totalAssignees * 100) : 0,
        isPartial: completionRequested > 0 && completionRequested < totalAssignees,
        isComplete: completionRequested === totalAssignees
      };
      
      return taskObj;
    });
    
    res.status(200).json({
      success: true,
      count: formattedTasks.length,
      data: formattedTasks
    });
  } catch (error) {
    console.error('Error getting pending completion requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pending completion requests',
      error: error.message
    });
  }
};

// Get tasks created by a specific user
exports.getTasksByUserCreated = async (req, res) => {
  console.log('getTasksByUserCreated: Received request');
  try {
    const { userId } = req.params;

    console.log(`getTasksByUserCreated: Fetching tasks for userId: ${userId}`);

    // Validate if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`getTasksByUserCreated: Invalid userId format: ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const tasks = await Task.find({ createdBy: userId, isDeleted: false })
      .populate('createdBy', 'name email position department')
      .populate('assignedTo', 'name email position department');

    console.log(`getTasksByUserCreated: Found ${tasks.length} tasks for userId: ${userId}`);
    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('getTasksByUserCreated: Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: "Failed to load tasks. Please try again later.",
      error: error.message,
    });
  }
};

// Get tasks assigned to a specific user
exports.getTasksByUserAssigned = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get tasks assigned to this user
    const tasks = await Task.find({ 
      assignedTo: userId,
      isDeleted: false 
    })
      .populate('createdBy', 'name email position department')
      .populate('assignedTo', 'name email position department')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    logger.error(`Error getting tasks by assignee: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving tasks',
      error: error.message
    });
  }
};

// Get task statistics (alias for backward compatibility)
exports.getTaskStats = exports.getTaskStatistics;

// Update a task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.taskId;
    const userId = req.user.id;
    
    // Validate status
    const validStatuses = ['incomplete', 'on_hold', 'completion_requested', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    // Find the task
    const task = await Task.findOne({ 
      _id: taskId, 
      isDeleted: false 
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if user is authorized to update status
    const isCreator = task.createdBy.toString() === userId;
    const isAssignee = task.assignedTo.some(assignee => 
      assignee.toString() === userId || assignee._id?.toString() === userId
    );
    
    if (!isCreator && !isAssignee) {
      return res.status(403).json({
        success: false,
        message: 'Only the task creator or assignees can update task status'
      });
    }
    
    // Record old status for history
    const oldStatus = task.status;
    
    // Update status
    task.status = status;
    
    // If marking as completed, set completedAt
    if (status === 'completed' && oldStatus !== 'completed') {
      task.completedAt = new Date();
    }
    
    // Add history entry
    task.addHistory('status', oldStatus, status, userId);
    
    await task.save();
    
    logger.info(`Task status updated: ${taskId} from ${oldStatus} to ${status} by ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    logger.error(`Error updating task status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error updating task status',
      error: error.message
    });
  }
};