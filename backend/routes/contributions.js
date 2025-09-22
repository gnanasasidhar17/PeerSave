const express = require('express');
const router = express.Router();
const Contribution = require('../models/Contribution');
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticateToken, checkGroupMember } = require('../middleware/auth');
const { validateContribution, validateObjectId, validatePagination, validateSearch } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse, paginate, addResponseMetadata } = require('../middleware/errorHandler');

// @route   POST /api/contributions
// @desc    Add a new contribution
// @access  Private
router.post('/', authenticateToken, validateContribution, asyncHandler(async (req, res) => {
  const { groupId, amount, currency, type, category, description, notes, paymentMethod, paymentReference } = req.body;
  
  // Verify group exists and user is a member
  const group = await Group.findById(groupId);
  if (!group) {
    return sendErrorResponse(res, 'Group not found', 404, 'GROUP_NOT_FOUND');
  }

  const isMember = group.members.some(member => 
    member.user.toString() === req.user._id.toString() && member.isActive
  );

  if (!isMember) {
    return sendErrorResponse(res, 'You are not a member of this group', 403, 'NOT_MEMBER');
  }

  if (group.status !== 'active') {
    return sendErrorResponse(res, 'Group is not active', 400, 'GROUP_INACTIVE');
  }

  // Create contribution
  const contribution = new Contribution({
    user: req.user._id,
    group: groupId,
    amount,
    currency: currency || group.currency,
    type: type || 'regular',
    category: category || 'savings',
    description,
    notes,
    paymentMethod: paymentMethod || 'bank_transfer',
    paymentReference,
    contributionDate: new Date(),
    groupProgressBefore: group.progressPercentage,
    status: 'confirmed'
  });

  await contribution.save();

  // Update group progress
  await group.updateMemberContribution(req.user._id, amount);

  // Populate contribution with user and group details
  await contribution.populate([
    { path: 'user', select: 'username firstName lastName avatar' },
    { path: 'group', select: 'name totalGoal currentAmount progressPercentage' }
  ]);

  sendSuccessResponse(res, { contribution }, 'Contribution added successfully', 201);
}));

// @route   GET /api/contributions
// @desc    Get user's contributions with pagination and filters
// @access  Private
router.get('/', authenticateToken, validatePagination, validateSearch, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, groupId, type, category, status, sort = 'contributionDate', order = 'desc' } = req.query;
  const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
  
  // Build query
  const query = { user: req.user._id };
  
  if (groupId) query.group = groupId;
  if (type) query.type = type;
  if (category) query.category = category;
  if (status) query.status = status;

  // Build sort object
  const sortObj = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  const contributions = await Contribution.find(query)
    .populate('group', 'name totalGoal currentAmount progressPercentage')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  const total = await Contribution.countDocuments(query);

  const responseData = addResponseMetadata(contributions, parseInt(page), parseInt(limit), total);

  sendSuccessResponse(res, responseData, 'Contributions retrieved successfully');
}));

// @route   GET /api/contributions/group/:groupId
// @desc    Get group contributions
// @access  Private (Member only)
router.get('/group/:groupId', authenticateToken, validateObjectId('groupId'), checkGroupMember, validatePagination, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'contributionDate', order = 'desc' } = req.query;
  const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
  
  const groupId = req.params.groupId;
  
  // Build sort object
  const sortObj = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  const contributions = await Contribution.find({ group: groupId, status: 'confirmed' })
    .populate('user', 'username firstName lastName avatar')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  const total = await Contribution.countDocuments({ group: groupId, status: 'confirmed' });

  const responseData = addResponseMetadata(contributions, parseInt(page), parseInt(limit), total);

  sendSuccessResponse(res, responseData, 'Group contributions retrieved successfully');
}));

// @route   GET /api/contributions/:id
// @desc    Get contribution by ID
// @access  Private
router.get('/:id', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const contribution = await Contribution.findById(req.params.id)
    .populate('user', 'username firstName lastName avatar')
    .populate('group', 'name totalGoal currentAmount progressPercentage');

  if (!contribution) {
    return sendErrorResponse(res, 'Contribution not found', 404, 'CONTRIBUTION_NOT_FOUND');
  }

  // Check if user has access to this contribution
  if (contribution.user._id.toString() !== req.user._id.toString()) {
    // Check if user is a member of the group
    const group = await Group.findById(contribution.group._id);
    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.isActive
    );

    if (!isMember) {
      return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
    }
  }

  sendSuccessResponse(res, { contribution }, 'Contribution retrieved successfully');
}));

// @route   PUT /api/contributions/:id
// @desc    Update contribution
// @access  Private (Owner only)
router.put('/:id', authenticateToken, validateObjectId('id'), validateContribution, asyncHandler(async (req, res) => {
  const contribution = await Contribution.findById(req.params.id);

  if (!contribution) {
    return sendErrorResponse(res, 'Contribution not found', 404, 'CONTRIBUTION_NOT_FOUND');
  }

  // Check if user owns this contribution
  if (contribution.user.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  if (contribution.status === 'cancelled') {
    return sendErrorResponse(res, 'Cannot update cancelled contribution', 400, 'CONTRIBUTION_CANCELLED');
  }

  const oldAmount = contribution.amount;
  const updates = req.body;
  
  // Remove fields that shouldn't be updated
  delete updates.user;
  delete updates.group;
  delete updates.createdAt;
  delete updates.updatedAt;

  const updatedContribution = await Contribution.findByIdAndUpdate(
    req.params.id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate([
    { path: 'user', select: 'username firstName lastName avatar' },
    { path: 'group', select: 'name totalGoal currentAmount progressPercentage' }
  ]);

  // Update group progress if amount changed
  if (updates.amount && updates.amount !== oldAmount) {
    const group = await Group.findById(contribution.group);
    const amountDifference = updates.amount - oldAmount;
    await group.updateMemberContribution(req.user._id, amountDifference);
  }

  sendSuccessResponse(res, { contribution: updatedContribution }, 'Contribution updated successfully');
}));

// @route   DELETE /api/contributions/:id
// @desc    Cancel contribution
// @access  Private (Owner only)
router.delete('/:id', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const contribution = await Contribution.findById(req.params.id);

  if (!contribution) {
    return sendErrorResponse(res, 'Contribution not found', 404, 'CONTRIBUTION_NOT_FOUND');
  }

  // Check if user owns this contribution
  if (contribution.user.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  if (contribution.status === 'cancelled') {
    return sendErrorResponse(res, 'Contribution is already cancelled', 400, 'CONTRIBUTION_ALREADY_CANCELLED');
  }

  await contribution.cancel();

  sendSuccessResponse(res, null, 'Contribution cancelled successfully');
}));

// @route   GET /api/contributions/stats/overview
// @desc    Get user's contribution statistics
// @access  Private
router.get('/stats/overview', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const stats = await Contribution.getStats(null, userId);
  const userStats = stats[0] || {
    totalAmount: 0,
    totalContributions: 0,
    averageAmount: 0,
    maxAmount: 0,
    minAmount: 0
  };

  // Get additional stats
  const user = await User.findById(userId).select('totalSaved currentStreak longestStreak level experience');
  
  // Get recent contributions
  const recentContributions = await Contribution.find({ user: userId, status: 'confirmed' })
    .populate('group', 'name')
    .sort({ contributionDate: -1 })
    .limit(5);

  // Get contribution by type
  const typeStats = await Contribution.aggregate([
    { $match: { user: userId, status: 'confirmed' } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  // Get contribution by category
  const categoryStats = await Contribution.aggregate([
    { $match: { user: userId, status: 'confirmed' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const response = {
    overview: {
      totalAmount: userStats.totalAmount,
      totalContributions: userStats.totalContributions,
      averageAmount: userStats.averageAmount,
      maxAmount: userStats.maxAmount,
      minAmount: userStats.minAmount
    },
    user: {
      totalSaved: user.totalSaved,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      level: user.level,
      experience: user.experience
    },
    recentContributions,
    typeStats,
    categoryStats
  };

  sendSuccessResponse(res, response, 'Contribution statistics retrieved successfully');
}));

// @route   GET /api/contributions/stats/group/:groupId
// @desc    Get group contribution statistics
// @access  Private (Member only)
router.get('/stats/group/:groupId', authenticateToken, validateObjectId('groupId'), checkGroupMember, asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  
  const stats = await Contribution.getStats(groupId);
  const groupStats = stats[0] || {
    totalAmount: 0,
    totalContributions: 0,
    averageAmount: 0,
    maxAmount: 0,
    minAmount: 0
  };

  // Get group info
  const group = await Group.findById(groupId).select('name totalGoal currentAmount progressPercentage memberCount');

  // Get top contributors
  const topContributors = await Contribution.aggregate([
    { $match: { group: groupId, status: 'confirmed' } },
    {
      $group: {
        _id: '$user',
        totalAmount: { $sum: '$amount' },
        totalContributions: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        user: { username: 1, firstName: 1, lastName: 1, avatar: 1 },
        totalAmount: 1,
        totalContributions: 1
      }
    }
  ]);

  // Get contribution timeline (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const timelineStats = await Contribution.aggregate([
    { 
      $match: { 
        group: groupId, 
        status: 'confirmed',
        contributionDate: { $gte: thirtyDaysAgo }
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: '$contributionDate' },
          month: { $month: '$contributionDate' },
          day: { $dayOfMonth: '$contributionDate' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  const response = {
    group: group,
    overview: groupStats,
    topContributors,
    timelineStats
  };

  sendSuccessResponse(res, response, 'Group contribution statistics retrieved successfully');
}));

// @route   POST /api/contributions/:id/verify
// @desc    Verify a contribution (Admin only)
// @access  Private (Group Admin only)
router.post('/:id/verify', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const contribution = await Contribution.findById(req.params.id)
    .populate('group');

  if (!contribution) {
    return sendErrorResponse(res, 'Contribution not found', 404, 'CONTRIBUTION_NOT_FOUND');
  }

  // Check if user is admin of the group
  const group = contribution.group;
  const isAdmin = group.members.some(member => 
    member.user.toString() === req.user._id.toString() && 
    member.role === 'admin' && 
    member.isActive
  );

  if (!isAdmin) {
    return sendErrorResponse(res, 'Admin access required', 403, 'ADMIN_REQUIRED');
  }

  if (contribution.status !== 'pending') {
    return sendErrorResponse(res, 'Contribution is not pending verification', 400, 'NOT_PENDING');
  }

  await contribution.verify(req.user._id);

  const updatedContribution = await Contribution.findById(contribution._id)
    .populate('user', 'username firstName lastName avatar')
    .populate('group', 'name totalGoal currentAmount progressPercentage');

  sendSuccessResponse(res, { contribution: updatedContribution }, 'Contribution verified successfully');
}));

module.exports = router;
