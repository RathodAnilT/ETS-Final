const mongoose = require("mongoose");

const historyEntrySchema = new mongoose.Schema({
  field: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["incomplete", "on_hold", "completed", "completion_requested"],
      default: "incomplete",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completionRequest: {
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      requestedAt: Date,
      notes: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      reviewedAt: Date,
      reviewNotes: String
    },
    completionRequestDate: Date,
    completionReviewNotes: String,
    completionReviewDate: Date,
    completionReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    history: [historyEntrySchema],
    comments: [{
      text: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

// Method to add history entry
taskSchema.methods.addHistory = function(field, oldValue, newValue, userId) {
  this.history.push({
    field,
    oldValue,
    newValue,
    changedBy: userId,
    changedAt: new Date()
  });
};

const Task = mongoose.model("Task", taskSchema);

module.exports = Task; 