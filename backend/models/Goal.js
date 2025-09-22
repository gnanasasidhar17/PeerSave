const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Goal title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Goal Details
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0.01, 'Target amount must be greater than 0']
  },
  
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY']
  },
  
  // Goal Type & Category
  type: {
    type: String,
    enum: ['personal', 'group', 'emergency', 'vacation', 'education', 'investment', 'purchase', 'debt_payment'],
    default: 'personal'
  },
  
  category: {
    type: String,
    enum: ['savings', 'emergency', 'vacation', 'education', 'gift', 'investment', 'debt', 'other'],
    default: 'savings'
  },
  
  // Timeline
  startDate: {
    type: Date,
    default: Date.now
  },
  
  targetDate: {
    type: Date,
    required: [true, 'Target date is required']
  },
  
  // Goal Status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled', 'overdue'],
    default: 'active'
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // Progress Tracking
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Milestones
  milestones: [{
    name: {
      type: String,
      required: true
    },
    targetAmount: {
      type: Number,
      required: true
    },
    achievedAt: {
      type: Date,
      default: null
    },
    isAchieved: {
      type: Boolean,
      default: false
    },
    reward: {
      type: String,
      default: null
    }
  }],
  
  // Contribution Rules
  contributionRules: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'flexible'],
      default: 'flexible'
    },
    minimumAmount: {
      type: Number,
      default: 1,
      min: 0
    },
    maximumAmount: {
      type: Number,
      default: null
    },
    reminderDays: [{
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    }]
  },
  
  // Goal Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Goal owner is required']
  },
  
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  
  // Privacy Settings
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Gamification
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  
  badges: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Analytics
  totalContributions: {
    type: Number,
    default: 0
  },
  
  averageContribution: {
    type: Number,
    default: 0
  },
  
  lastContribution: {
    type: Date,
    default: null
  },
  
  // Goal Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for days elapsed
goalSchema.virtual('daysElapsed').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const diffTime = now - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for is completed
goalSchema.virtual('isCompleted').get(function() {
  return this.currentAmount >= this.targetAmount || this.status === 'completed';
});

// Virtual for is overdue
goalSchema.virtual('isOverdue').get(function() {
  return new Date() > new Date(this.targetDate) && !this.isCompleted;
});

// Virtual for completion rate
goalSchema.virtual('completionRate').get(function() {
  return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
});

// Virtual for estimated completion date
goalSchema.virtual('estimatedCompletionDate').get(function() {
  if (this.currentAmount >= this.targetAmount) {
    return this.completedAt || new Date();
  }
  
  const remainingAmount = this.targetAmount - this.currentAmount;
  const daysElapsed = this.daysElapsed;
  const averageDaily = daysElapsed > 0 ? this.currentAmount / daysElapsed : 0;
  
  if (averageDaily <= 0) {
    return null; // Cannot estimate
  }
  
  const daysNeeded = Math.ceil(remainingAmount / averageDaily);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);
  
  return estimatedDate;
});

// Pre-save middleware to update progress and status
goalSchema.pre('save', function(next) {
  // Update progress percentage
  if (this.targetAmount > 0) {
    this.progressPercentage = Math.min(100, (this.currentAmount / this.targetAmount) * 100);
  }
  
  // Update status based on progress and dates
  if (this.progressPercentage >= 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (new Date() > new Date(this.targetDate) && this.status === 'active') {
    this.status = 'overdue';
  }
  
  // Check milestones
  this.milestones.forEach(milestone => {
    if (!milestone.isAchieved && this.currentAmount >= milestone.targetAmount) {
      milestone.isAchieved = true;
      milestone.achievedAt = new Date();
    }
  });
  
  next();
});

// Instance method to add contribution
goalSchema.methods.addContribution = async function(amount, description = '') {
  if (this.status !== 'active') {
    throw new Error('Cannot add contribution to inactive goal');
  }
  
  this.currentAmount += amount;
  this.totalContributions += 1;
  this.lastContribution = new Date();
  this.averageContribution = this.currentAmount / this.totalContributions;
  
  // Add points based on contribution
  const points = Math.floor(amount * 10);
  this.points += points;
  
  return this.save();
};

// Instance method to pause goal
goalSchema.methods.pause = function() {
  if (this.status === 'completed') {
    throw new Error('Cannot pause completed goal');
  }
  
  this.status = 'paused';
  return this.save();
};

// Instance method to resume goal
goalSchema.methods.resume = function() {
  if (this.status === 'completed') {
    throw new Error('Cannot resume completed goal');
  }
  
  this.status = 'active';
  return this.save();
};

// Instance method to complete goal
goalSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progressPercentage = 100;
  return this.save();
};

// Instance method to add milestone
goalSchema.methods.addMilestone = function(name, targetAmount, reward = null) {
  this.milestones.push({
    name,
    targetAmount,
    reward,
    isAchieved: false
  });
  return this.save();
};

// Instance method to get achieved milestones
goalSchema.methods.getAchievedMilestones = function() {
  return this.milestones.filter(milestone => milestone.isAchieved);
};

// Instance method to get pending milestones
goalSchema.methods.getPendingMilestones = function() {
  return this.milestones.filter(milestone => !milestone.isAchieved);
};

// Static method to find goals by user
goalSchema.statics.findByUser = function(userId, status = null) {
  const query = { owner: userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('group', 'name')
    .sort({ createdAt: -1 });
};

// Static method to find public goals
goalSchema.statics.findPublic = function(limit = 20) {
  return this.find({ isPublic: true, status: 'active' })
    .populate('owner', 'username firstName lastName avatar')
    .populate('group', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get goal statistics
goalSchema.statics.getStats = function(userId = null) {
  const match = {};
  if (userId) {
    match.owner = userId;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalGoals: { $sum: 1 },
        activeGoals: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        completedGoals: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalTargetAmount: { $sum: '$targetAmount' },
        totalCurrentAmount: { $sum: '$currentAmount' },
        averageProgress: { $avg: '$progressPercentage' }
      }
    }
  ]);
};

// Indexes for better query performance
goalSchema.index({ owner: 1, status: 1 });
goalSchema.index({ group: 1 });
goalSchema.index({ isPublic: 1, status: 1 });
goalSchema.index({ targetDate: 1 });
goalSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Goal', goalSchema);
