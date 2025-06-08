const mongoose = require('mongoose');

const laborSharingSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['IT', 'HR', 'Finance', 'Operations']
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Calculate end date based on duration
laborSharingSchema.pre('save', function(next) {
  if (this.isModified('duration') || this.isNew) {
    const endDate = new Date(this.startDate);
    endDate.setDate(endDate.getDate() + (this.duration * 7)); // Convert weeks to days
    this.endDate = endDate;
  }
  next();
});

const LaborSharing = mongoose.model('LaborSharing', laborSharingSchema);

module.exports = LaborSharing; 