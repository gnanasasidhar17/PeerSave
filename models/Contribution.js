const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  // Basic Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group is required']
  },
  
  // Contribution Details
  amount: {
    type: Number,
    required: [true, 'Contribution amount is required'],
    min: [0.01, 'Contribution amount must be greater than 0']
  },
  
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY']
  },
  
  // Contribution Type & Category
  type: {
    type: String,
    enum: ['regular', 'bonus', 'catch-up', 'milestone', 'penalty'],
    default: 'regular'
  },
  
  category: {
    type: String,
    enum: ['savings', 'emergency', 'vacation', 'education', 'gift', 'investment', 'other'],
    default: 'savings'
  },
  
  // Description & Notes
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Contribution Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
    default: 'confirmed'
  },
  
  // Payment Information (if applicable)
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'card', 'digital_wallet', 'other'],
    default: 'bank_transfer'
  },
  
  paymentReference: {
    type: String,
    trim: true
  },
  
  // Contribution Timing
  contributionDate: {
    type: Date,
    default: Date.now
  },
  
  scheduledDate: {
    type: Date,
    default: null
  },
  
  // Milestone Information
  isMilestone: {
    type: Boolean,
    default: false
  },
  
  milestoneType: {
    type: String,
    enum: ['first_contribution', 'weekly_goal', 'monthly_goal', 'halfway_mark', 'final_push', 'streak_bonus'],
    default: null
  },
  
  // Gamification
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  
  badgesEarned: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Streak Information
  streakCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Group Impact
  groupProgressBefore: {
    type: Number,
    default: 0
  },
  
  groupProgressAfter: {
    type: Number,
    default: 0
  },
  
  // Verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  verifiedAt: {
    type: Date,
    default: null
  },
  
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

// Virtual for contribution age in days
contributionSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = now - created;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is recent (within last 7 days)
contributionSchema.virtual('isRecent').get(function() {
  return this.ageInDays <= 7;
});

// Virtual for contribution value in USD (for comparison)
contributionSchema.virtual('valueInUSD').get(function() {
  // This would typically use a currency conversion API
  // For now, we'll return the amount as-is
  return this.amount;
});

// Pre-save middleware to calculate points and update group
contributionSchema.pre('save', async function(next) {
  try {
    // Calculate points based on contribution amount and type
    let points = Math.floor(this.amount * 10); // Base points
    
    // Bonus points for different types
    switch (this.type) {
      case 'bonus':
        points *= 1.5;
        break;
      case 'milestone':
        points *= 2;
        break;
      case 'catch-up':
        points *= 1.2;
        break;
    }
    
    // Bonus points for milestones
    if (this.isMilestone) {
      points *= 1.3;
    }
    
    this.pointsEarned = Math.floor(points);
    
    // Update group progress if contribution is confirmed
    if (this.status === 'confirmed') {
      const Group = mongoose.model('Group');
      await Group.findByIdAndUpdate(this.group, {
        $inc: { currentAmount: this.amount }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update user stats
contributionSchema.post('save', async function() {
  if (this.status === 'confirmed') {
    const User = mongoose.model('User');
    
    // Update user's total saved
    await User.findByIdAndUpdate(this.user, {
      $inc: { 
        totalSaved: this.amount,
        experience: this.pointsEarned
      }
    });
    
    // Update user's current streak
    const user = await User.findById(this.user);
    if (user) {
      user.currentStreak += 1;
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
      await user.save();
    }
  }
});

// Instance method to cancel contribution
contributionSchema.methods.cancel = async function() {
  if (this.status === 'cancelled') {
    throw new Error('Contribution is already cancelled');
  }
  
  this.status = 'cancelled';
  
  // Update group progress
  if (this.status === 'confirmed') {
    const Group = mongoose.model('Group');
    await Group.findByIdAndUpdate(this.group, {
      $inc: { currentAmount: -this.amount }
    });
  }
  
  return this.save();
};

// Instance method to verify contribution
contributionSchema.methods.verify = async function(verifiedBy) {
  if (this.status !== 'pending') {
    throw new Error('Only pending contributions can be verified');
  }
  
  this.status = 'confirmed';
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  
  return this.save();
};

// Static method to get user contributions
contributionSchema.statics.getUserContributions = function(userId, groupId = null) {
  const query = { user: userId, status: 'confirmed' };
  if (groupId) {
    query.group = groupId;
  }
  
  return this.find(query)
    .populate('group', 'name totalGoal currentAmount')
    .sort({ contributionDate: -1 });
};

// Static method to get group contributions
contributionSchema.statics.getGroupContributions = function(groupId, limit = 50) {
  return this.find({ group: groupId, status: 'confirmed' })
    .populate('user', 'username firstName lastName avatar')
    .sort({ contributionDate: -1 })
    .limit(limit);
};

// Static method to get contribution statistics
contributionSchema.statics.getStats = function(groupId = null, userId = null) {
  const match = { status: 'confirmed' };
  if (groupId) match.group = groupId;
  if (userId) match.user = userId;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalContributions: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        maxAmount: { $max: '$amount' },
        minAmount: { $min: '$amount' }
      }
    }
  ]);
};

// Indexes for better query performance
contributionSchema.index({ user: 1, contributionDate: -1 });
contributionSchema.index({ group: 1, contributionDate: -1 });
contributionSchema.index({ status: 1 });
contributionSchema.index({ contributionDate: -1 });

module.exports = mongoose.model('Contribution', contributionSchema);
