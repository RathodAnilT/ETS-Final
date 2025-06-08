const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task_completion', 'task_completion_review', 'task_assignment', 'task_update', 'all_assignees_completed'],
    required: true
  },
  task: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // For tracking individual assignee completions
  assigneeId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // For batch notifications when multiple assignees complete their parts
  completedAssigneeIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // To identify if this notification is for all assignees completion
  isAllAssigneesCompleted: {
    type: Boolean,
    default: false
  },
  additionalData: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ task: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 