const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Task History Schema - for tracking changes to the task
const taskHistorySchema = new Schema({
  field: {
    type: String,
    required: true
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Comment Schema - for task discussions
const commentSchema = new Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Main Task Schema
const taskSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  taskId: {
    type: String,
    unique: true,
    sparse: true,  // Allows multiple null values, important to handle existing null taskIds
    index: true,
    required: false, // This ensures the default function runs
    default: function() {
      // Create a format like TASK-YY-MM-NNNNNN for better uniqueness
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `TASK-${year}${month}-${random}`;
    }
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['incomplete', 'completed', 'on_hold', 'completion_requested', 'rejected'],
    default: 'incomplete'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // New field to track individual assignee completions
  assigneeCompletions: [{
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'completion_requested', 'rejected'],
      default: 'pending'
    },
    completionRequestedAt: Date,
    completionNotes: String,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String
  }],
  dueDate: {
    type: Date
  },
  completionRequestDate: {
    type: Date
  },
  completionReviewDate: {
    type: Date
  },
  completionReviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  completionReviewNotes: {
    type: String
  },
  department: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [commentSchema],
  history: [taskHistorySchema],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Text indexes for search functionality
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Additional indexes for common queries
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ 'history.updatedAt': 1 });

// Virtual field for time remaining (not stored in DB)
taskSchema.virtual('timeRemaining').get(function() {
  if (!this.dueDate) return null;
  return this.dueDate - new Date();
});

// Method to check if task is overdue
taskSchema.methods.isOverdue = function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.status !== 'completed';
};

// Method to check if task is due today
taskSchema.methods.isDueToday = function() {
  if (!this.dueDate) return false;
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  return today.getDate() === dueDate.getDate() && 
         today.getMonth() === dueDate.getMonth() && 
         today.getFullYear() === dueDate.getFullYear();
};

// Method to log history when task is updated
taskSchema.methods.addHistory = function(field, oldValue, newValue, userId) {
  this.history.push({
    field,
    oldValue,
    newValue,
    updatedBy: userId,
    updatedAt: new Date()
  });
};

// Pre-save middleware to handle taskId generation for new tasks
taskSchema.pre('save', function(next) {
  // Only run this for new documents that don't have a taskId
  if (this.isNew && !this.taskId) {
    // Create a format like TASK-YYMM-NNNNNN for better uniqueness
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    this.taskId = `TASK-${year}${month}-${random}`;
  }
  next();
});

// Define pre-save middleware to handle task status changes
taskSchema.pre('save', function(next) {
  // If this is a new task, initialize assigneeCompletions for each assignee
  if (this.isNew && this.assignedTo && this.assignedTo.length > 0) {
    this.assigneeCompletions = this.assignedTo.map(assigneeId => ({
      assigneeId,
      status: 'pending',
    }));
    return next();
  }

  // Get original task from DB before saving changes
  mongoose.model('Task').findById(this._id)
    .then(originalTask => {
      if (!originalTask) return next();
      
      // If assignedTo has changed, update assigneeCompletions accordingly
      if (this.assignedTo && !this.isNew) {
        // For any new assignees, add them to assigneeCompletions if they're not already there
        for (const assigneeId of this.assignedTo) {
          if (!this.assigneeCompletions.some(c => c.assigneeId.toString() === assigneeId.toString())) {
            this.assigneeCompletions.push({
              assigneeId,
              status: 'pending'
            });
          }
        }
      }
      
      // Check if all assignees have completed their parts
      if (this.areAllAssigneesComplete() && this.status !== 'completed') {
        this.status = 'completion_requested';
        
        // If the status just changed to completion_requested, record the time
        if (originalTask.status !== 'completion_requested') {
          this.completionRequestDate = new Date();
        }
      }
      
      // Check if status changed to 'completion_requested'
      if (this.status === 'completion_requested' && originalTask.status !== 'completion_requested') {
        this.completionRequestDate = new Date();
      }
      
      // Check if status changed to 'completed'
      if (this.status === 'completed' && originalTask.status !== 'completed') {
        this.completionReviewDate = new Date();
      }
      
      next();
    })
    .catch(err => next(err));
});

// Method to check if all assignees have completed their parts
taskSchema.methods.areAllAssigneesComplete = function() {
  if (!this.assignedTo || this.assignedTo.length === 0) {
    return false;
  }
  
  // Check if all assignees have requested completion or are already marked as completed
  return this.assignedTo.every(assigneeId => {
    const completion = this.assigneeCompletions.find(
      c => c.assigneeId.toString() === assigneeId.toString() ||
           (assigneeId._id && c.assigneeId.toString() === assigneeId._id.toString())
    );
    
    return completion && 
           (completion.status === 'completion_requested' || completion.status === 'completed');
  });
};

// Ensure virtual fields are included when converting to JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 