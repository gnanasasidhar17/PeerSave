const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [50, 'Group name cannot exceed 50 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Group Settings
  type: {
    type: String,
    enum: ['friends', 'family', 'colleagues', 'classmates', 'community', 'other'],
    default: 'friends'
  },
  
  privacy: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'invite-only'
  },
  
  maxMembers: {
    type: Number,
    default: 10,
    min: 2,
    max: 50
  },
  
  // Group Goals
  totalGoal: {
    type: Number,
    required: [true, 'Total goal amount is required'],
    min: [1, 'Goal amount must be at least 1']
  },
  
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY']
  },
  
  goalDeadline: {
    type: Date,
    required: [true, 'Goal deadline is required']
  },
  
  // Progress Tracking
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Group Members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    totalContributed: {
      type: Number,
      default: 0,
      min: 0
    },
    lastContribution: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Invitations
  invitations: [{
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    }
  }],
  
  // Group Rules & Settings
  contributionRules: {
    minimumAmount: {
      type: Number,
      default: 1,
      min: 0
    },
    maximumAmount: {
      type: Number,
      default: null
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'flexible'],
      default: 'flexible'
    },
    reminderDays: [{
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    }]
  },
  
  // Gamification
  achievements: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    },
    icon: String
  }],
  
  // Group Status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // Analytics
  totalContributions: {
    type: Number,
    default: 0
  },
  
  averageContribution: {
    type: Number,
    default: 0
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

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.isActive).length;
});

// Virtual for days remaining
groupSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.goalDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for is completed
groupSchema.virtual('isCompleted').get(function() {
  return this.currentAmount >= this.totalGoal || this.status === 'completed';
});

// Virtual for is overdue
groupSchema.virtual('isOverdue').get(function() {
  return new Date() > new Date(this.goalDeadline) && !this.isCompleted;
});

// Pre-save middleware to update progress
groupSchema.pre('save', function(next) {
  if (this.currentAmount && this.totalGoal) {
    this.progressPercentage = Math.min(100, (this.currentAmount / this.totalGoal) * 100);
  }
  
  // Update status based on progress
  if (this.progressPercentage >= 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  next();
});

// Instance method to add member
groupSchema.methods.addMember = async function(userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    if (!existingMember.isActive) {
      existingMember.isActive = true;
      existingMember.joinedAt = new Date();
      return this.save();
    }
    throw new Error('User is already a member of this group');
  }
  
  // Check if group is full
  if (this.memberCount >= this.maxMembers) {
    throw new Error('Group is full');
  }
  
  this.members.push({
    user: userId,
    role,
    joinedAt: new Date(),
    totalContributed: 0,
    isActive: true
  });
  
  return this.save();
};

// Instance method to remove member
groupSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.user.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this group');
  }
  
  // Don't allow removing the last admin
  if (this.members[memberIndex].role === 'admin') {
    const adminCount = this.members.filter(m => m.role === 'admin' && m.isActive).length;
    if (adminCount <= 1) {
      throw new Error('Cannot remove the last admin from the group');
    }
  }
  
  this.members[memberIndex].isActive = false;
  return this.save();
};

// Instance method to update member contribution
groupSchema.methods.updateMemberContribution = async function(userId, amount) {
  const member = this.members.find(m => 
    m.user.toString() === userId.toString() && m.isActive
  );
  
  if (!member) {
    throw new Error('User is not an active member of this group');
  }
  
  member.totalContributed += amount;
  member.lastContribution = new Date();
  
  // Update group totals
  this.currentAmount += amount;
  this.totalContributions += 1;
  this.averageContribution = this.currentAmount / this.totalContributions;
  
  return this.save();
};

// Instance method to send invitation
groupSchema.methods.sendInvitation = async function(email, invitedBy) {
  // Check if email is already invited
  const existingInvitation = this.invitations.find(inv => 
    inv.email === email && inv.status === 'pending'
  );
  
  if (existingInvitation) {
    throw new Error('Invitation already sent to this email');
  }
  
  // Check if user is already a member
  const existingMember = this.members.find(member => 
    member.user.email === email && member.isActive
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this group');
  }
  
  this.invitations.push({
    email,
    invitedBy,
    invitedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'pending'
  });
  
  return this.save();
};

// Static method to find groups by user
groupSchema.statics.findByUser = function(userId) {
  return this.find({
    'members.user': userId,
    'members.isActive': true
  }).populate('members.user', 'username firstName lastName avatar');
};

// Indexes for better query performance
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ status: 1 });
groupSchema.index({ createdAt: -1 });
groupSchema.index({ 'invitations.email': 1 });

module.exports = mongoose.model('Group', groupSchema);
