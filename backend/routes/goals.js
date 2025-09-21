const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Group = require('../models/Group');
const { authenticateToken, checkGroupMember } = require('../middleware/auth');
const { validateGoalCreation, validateObjectId, validatePagination, validateSearch } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse, paginate, addResponseMetadata } = require('../middleware/errorHandler');

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', authenticateToken, validateGoalCreation, asyncHandler(async (req, res) => {
  const goalData = {
    ...req.body,
    owner: req.user._id
  };

  const goal = new Goal(goalData);
  await goal.save();

  // If it's a group goal, verify user is a member of the group
  if (goal.group) {
    const group = await Group.findById(goal.group);
    if (!group) {
      return sendErrorResponse(res, 'Group not found', 404, 'GROUP_NOT_FOUND');
    }

    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.isActive
    );

    if (!isMember) {
      return sendErrorResponse(res, 'You are not a member of this group', 403, 'NOT_MEMBER');
    }
  }

  await goal.populate('group', 'name description totalGoal currentAmount');

  sendSuccessResponse(res, { goal }, 'Goal created successfully', 201);
}));

// @route   GET /api/goals
// @desc    Get user's goals with pagination and filters
// @access  Private
router.get('/', authenticateToken, validatePagination, validateSearch, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, type, category, priority, sort = 'createdAt', order = 'desc' } = req.query;
  const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
  
  // Build query
  const query = { owner: req.user._id };
  
  if (status) query.status = status;
  if (type) query.type = type;
  if (category) query.category = category;
  if (priority) query.priority = priority;

  // Build sort object
  const sortObj = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  const goals = await Goal.find(query)
    .populate('group', 'name description totalGoal currentAmount progressPercentage')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  const total = await Goal.countDocuments(query);

  const responseData = addResponseMetadata(goals, parseInt(page), parseInt(limit), total);

  sendSuccessResponse(res, responseData, 'Goals retrieved successfully');
}));

// @route   GET /api/goals/public
// @desc    Get public goals
// @access  Private
router.get('/public', authenticateToken, validatePagination, validateSearch, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, category, sort = 'createdAt', order = 'desc' } = req.query;
  const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
  
  // Build query for public goals
  const query = {
    isPublic: true,
    status: 'active'
  };

  if (type) query.type = type;
  if (category) query.category = category;

  // Build sort object
  const sortObj = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  const goals = await Goal.find(query)
    .populate('owner', 'username firstName lastName avatar')
    .populate('group', 'name description totalGoal currentAmount progressPercentage')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  const total = await Goal.countDocuments(query);

  const responseData = addResponseMetadata(goals, parseInt(page), parseInt(limit), total);

  sendSuccessResponse(res, responseData, 'Public goals retrieved successfully');
}));

// @route   GET /api/goals/group/:groupId
// @desc    Get group goals
// @access  Private (Member only)
router.get('/group/:groupId', authenticateToken, validateObjectId('groupId'), checkGroupMember, validatePagination, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, sort = 'createdAt', order = 'desc' } = req.query;
  const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
  
  const groupId = req.params.groupId;
  
  // Build query
  const query = { group: groupId };
  if (status) query.status = status;

  // Build sort object
  const sortObj = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  const goals = await Goal.find(query)
    .populate('owner', 'username firstName lastName avatar')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  const total = await Goal.countDocuments(query);

  const responseData = addResponseMetadata(goals, parseInt(page), parseInt(limit), total);

  sendSuccessResponse(res, responseData, 'Group goals retrieved successfully');
}));

// @route   GET /api/goals/:id
// @desc    Get goal by ID
// @access  Private
router.get('/:id', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id)
    .populate('owner', 'username firstName lastName avatar')
    .populate('group', 'name description totalGoal currentAmount progressPercentage');

  if (!goal) {
    return sendErrorResponse(res, 'Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  // Check if user has access to this goal
  if (goal.owner._id.toString() !== req.user._id.toString()) {
    // Check if it's a group goal and user is a member
    if (goal.group) {
      const group = await Group.findById(goal.group);
      const isMember = group.members.some(member => 
        member.user.toString() === req.user._id.toString() && member.isActive
      );

      if (!isMember) {
        return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
      }
    } else if (!goal.isPublic) {
      return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
    }
  }

  sendSuccessResponse(res, { goal }, 'Goal retrieved successfully');
}));

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private (Owner only)
router.put('/:id', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    return sendErrorResponse(res, 'Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  // Check if user owns this goal
  if (goal.owner.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  if (goal.status === 'completed') {
    return sendErrorResponse(res, 'Cannot update completed goal', 400, 'GOAL_COMPLETED');
  }

  const updates = req.body;
  
  // Remove fields that shouldn't be updated
  delete updates.owner;
  delete updates.createdAt;
  delete updates.updatedAt;
  delete updates.currentAmount;
  delete updates.progressPercentage;

  const updatedGoal = await Goal.findByIdAndUpdate(
    req.params.id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate([
    { path: 'owner', select: 'username firstName lastName avatar' },
    { path: 'group', select: 'name description totalGoal currentAmount progressPercentage' }
  ]);

  sendSuccessResponse(res, { goal: updatedGoal }, 'Goal updated successfully');
}));

// @route   DELETE /api/goals/:id
// @desc    Delete goal
// @access  Private (Owner only)
router.delete('/:id', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    return sendErrorResponse(res, 'Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  // Check if user owns this goal
  if (goal.owner.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  await Goal.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, null, 'Goal deleted successfully');
}));

// @route   POST /api/goals/:id/contribute
// @desc    Add contribution to goal
// @access  Private (Owner or Group Member)
router.post('/:id/contribute', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const { amount, description } = req.body;
  
  if (!amount || amount <= 0) {
    return sendErrorResponse(res, 'Valid contribution amount is required', 400, 'INVALID_AMOUNT');
  }

  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    return sendErrorResponse(res, 'Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  // Check if user has access to contribute
  let hasAccess = false;
  
  if (goal.owner.toString() === req.user._id.toString()) {
    hasAccess = true;
  } else if (goal.group) {
    const group = await Group.findById(goal.group);
    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.isActive
    );
    hasAccess = isMember;
  }

  if (!hasAccess) {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  if (goal.status !== 'active') {
    return sendErrorResponse(res, 'Goal is not active', 400, 'GOAL_INACTIVE');
  }

  await goal.addContribution(amount, description);

  const updatedGoal = await Goal.findById(goal._id)
    .populate('owner', 'username firstName lastName avatar')
    .populate('group', 'name description totalGoal currentAmount progressPercentage');

  sendSuccessResponse(res, { goal: updatedGoal }, 'Contribution added successfully');
}));

// @route   POST /api/goals/:id/pause
// @desc    Pause goal
// @access  Private (Owner only)
router.post('/:id/pause', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    return sendErrorResponse(res, 'Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  if (goal.owner.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  if (goal.status === 'completed') {
    return sendErrorResponse(res, 'Cannot pause completed goal', 400, 'GOAL_COMPLETED');
  }

  await goal.pause();

  const updatedGoal = await Goal.findById(goal._id)
    .populate('owner', 'username firstName lastName avatar')
    .populate('group', 'name description totalGoal currentAmount progressPercentage');

  sendSuccessResponse(res, { goal: updatedGoal }, 'Goal paused successfully');
}));

// @route   POST /api/goals/:id/resume
// @desc    Resume goal
// @access  Private (Owner only)
router.post('/:id/resume', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    return sendErrorResponse(res, 'Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  if (goal.owner.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  if (goal.status === 'completed') {
    return sendErrorResponse(res, 'Cannot resume completed goal', 400, 'GOAL_COMPLETED');
  }

  await goal.resume();

  const updatedGoal = await Goal.findById(goal._id)
    .populate('owner', 'username firstName lastName avatar')
    .populate('group', 'name description totalGoal currentAmount progressPercentage');

  sendSuccessResponse(res, { goal: updatedGoal }, 'Goal resumed successfully');
}));

// @route   POST /api/goals/:id/complete
// @desc    Mark goal as completed
// @access  Private (Owner only)
router.post('/:id/complete', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    return sendErrorResponse(res, 'Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  if (goal.owner.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  if (goal.status === 'completed') {
    return sendErrorResponse(res, 'Goal is already completed', 400, 'GOAL_ALREADY_COMPLETED');
  }

  await goal.complete();

  const updatedGoal = await Goal.findById(goal._id)
    .populate('owner', 'username firstName lastName avatar')
    .populate('group', 'name description totalGoal currentAmount progressPercentage');

  sendSuccessResponse(res, { goal: updatedGoal }, 'Goal completed successfully');
}));

// @route   POST /api/goals/:id/milestones
// @desc    Add milestone to goal
// @access  Private (Owner only)
router.post('/:id/milestones', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const { name, targetAmount, reward } = req.body;
  
  if (!name || !targetAmount) {
    return sendErrorResponse(res, 'Milestone name and target amount are required', 400, 'MILESTONE_DATA_REQUIRED');
  }

  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    return sendErrorResponse(res, 'Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  if (goal.owner.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  await goal.addMilestone(name, targetAmount, reward);

  const updatedGoal = await Goal.findById(goal._id)
    .populate('owner', 'username firstName lastName avatar')
    .populate('group', 'name description totalGoal currentAmount progressPercentage');

  sendSuccessResponse(res, { goal: updatedGoal }, 'Milestone added successfully');
}));

// @route   GET /api/goals/:id/milestones
// @desc    Get goal milestones
// @access  Private
router.get('/:id/milestones', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id).select('milestones');

  if (!goal) {
    return sendErrorResponse(res, 'Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  // Check if user has access to this goal
  if (goal.owner.toString() !== req.user._id.toString()) {
    if (goal.group) {
      const group = await Group.findById(goal.group);
      const isMember = group.members.some(member => 
        member.user.toString() === req.user._id.toString() && member.isActive
      );

      if (!isMember) {
        return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
      }
    } else if (!goal.isPublic) {
      return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
    }
  }

  const milestones = {
    achieved: goal.getAchievedMilestones(),
    pending: goal.getPendingMilestones()
  };

  sendSuccessResponse(res, { milestones }, 'Milestones retrieved successfully');
}));

// @route   GET /api/goals/stats/overview
// @desc    Get user's goal statistics
// @access  Private
router.get('/stats/overview', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const stats = await Goal.getStats(userId);
  const goalStats = stats[0] || {
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalTargetAmount: 0,
    totalCurrentAmount: 0,
    averageProgress: 0
  };

  // Get goals by status
  const statusStats = await Goal.aggregate([
    { $match: { owner: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$targetAmount' },
        currentAmount: { $sum: '$currentAmount' }
      }
    }
  ]);

  // Get goals by type
  const typeStats = await Goal.aggregate([
    { $match: { owner: userId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$targetAmount' },
        currentAmount: { $sum: '$currentAmount' }
      }
    }
  ]);

  // Get recent goals
  const recentGoals = await Goal.find({ owner: userId })
    .populate('group', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  const response = {
    overview: goalStats,
    statusStats,
    typeStats,
    recentGoals
  };

  sendSuccessResponse(res, response, 'Goal statistics retrieved successfully');
}));

module.exports = router;
