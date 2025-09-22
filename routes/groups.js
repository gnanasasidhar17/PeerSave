const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticateToken, checkGroupAdmin, checkGroupMember } = require('../middleware/auth');
const { validateGroupCreation, validateGroupUpdate, validateObjectId, validatePagination, validateSearch } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse, paginate, addResponseMetadata } = require('../middleware/errorHandler');

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', authenticateToken, validateGroupCreation, asyncHandler(async (req, res) => {
  const groupData = {
    ...req.body,
    members: [{
      user: req.user._id,
      role: 'admin',
      joinedAt: new Date(),
      totalContributed: 0,
      isActive: true
    }]
  };

  const group = new Group(groupData);
  await group.save();

  // Populate the group with member details
  await group.populate('members.user', 'username firstName lastName avatar');

  // Add group to user's groups
  await User.findByIdAndUpdate(req.user._id, {
    $push: { groups: group._id }
  });

  sendSuccessResponse(res, { group }, 'Group created successfully', 201);
}));

// @route   GET /api/groups
// @desc    Get user's groups with pagination and search
// @access  Private
router.get('/', authenticateToken, validatePagination, validateSearch, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, q, sort = 'createdAt', order = 'desc' } = req.query;
  const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
  
  const userId = req.user._id;
  
  // Build query
  const query = {
    'members.user': userId,
    'members.isActive': true
  };

  // Add search functionality
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  // Build sort object
  const sortObj = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  const groups = await Group.find(query)
    .populate('members.user', 'username firstName lastName avatar')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  const total = await Group.countDocuments(query);

  const responseData = addResponseMetadata(groups, parseInt(page), parseInt(limit), total);

  sendSuccessResponse(res, responseData, 'Groups retrieved successfully');
}));

// @route   GET /api/groups/public
// @desc    Get public groups
// @access  Private
router.get('/public', authenticateToken, validatePagination, validateSearch, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, q, sort = 'createdAt', order = 'desc' } = req.query;
  const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
  
  // Build query for public groups
  const query = {
    privacy: 'public',
    status: 'active'
  };

  // Add search functionality
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  // Build sort object
  const sortObj = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  const groups = await Group.find(query)
    .populate('members.user', 'username firstName lastName avatar')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  const total = await Group.countDocuments(query);

  const responseData = addResponseMetadata(groups, parseInt(page), parseInt(limit), total);

  sendSuccessResponse(res, responseData, 'Public groups retrieved successfully');
}));

// @route   GET /api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get('/:id', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('members.user', 'username firstName lastName avatar totalSaved currentStreak')
    .populate('invitations.invitedBy', 'username firstName lastName');

  if (!group) {
    return sendErrorResponse(res, 'Group not found', 404, 'GROUP_NOT_FOUND');
  }

  // Check if user is a member
  const isMember = group.members.some(member => 
    member.user._id.toString() === req.user._id.toString() && member.isActive
  );

  if (!isMember && group.privacy !== 'public') {
    return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
  }

  sendSuccessResponse(res, { group }, 'Group retrieved successfully');
}));

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private (Admin only)
router.put('/:id', authenticateToken, validateObjectId('id'), validateGroupUpdate, checkGroupAdmin, asyncHandler(async (req, res) => {
  const updates = req.body;
  delete updates.members;
  delete updates.invitations;
  delete updates.createdAt;

  const group = await Group.findByIdAndUpdate(
    req.params.id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('members.user', 'username firstName lastName avatar');

  sendSuccessResponse(res, { group }, 'Group updated successfully');
}));

// @route   DELETE /api/groups/:id
// @desc    Delete group
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, validateObjectId('id'), checkGroupAdmin, asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  
  if (!group) {
    return sendErrorResponse(res, 'Group not found', 404, 'GROUP_NOT_FOUND');
  }

  // Soft delete - change status to cancelled
  group.status = 'cancelled';
  await group.save();

  // Remove group from all members' groups
  await User.updateMany(
    { groups: group._id },
    { $pull: { groups: group._id } }
  );

  sendSuccessResponse(res, null, 'Group deleted successfully');
}));

// @route   POST /api/groups/:id/join
// @desc    Join a group
// @access  Private
router.post('/:id/join', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  
  if (!group) {
    return sendErrorResponse(res, 'Group not found', 404, 'GROUP_NOT_FOUND');
  }

  if (group.status !== 'active') {
    return sendErrorResponse(res, 'Group is not active', 400, 'GROUP_INACTIVE');
  }

  if (group.privacy === 'private') {
    return sendErrorResponse(res, 'This group is private', 403, 'GROUP_PRIVATE');
  }

  try {
    await group.addMember(req.user._id);
    
    // Add group to user's groups
    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id }
    });

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username firstName lastName avatar');

    sendSuccessResponse(res, { group: updatedGroup }, 'Successfully joined group');
  } catch (error) {
    if (error.message === 'User is already a member of this group') {
      return sendErrorResponse(res, 'You are already a member of this group', 400, 'ALREADY_MEMBER');
    }
    if (error.message === 'Group is full') {
      return sendErrorResponse(res, 'Group is full', 400, 'GROUP_FULL');
    }
    throw error;
  }
}));

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post('/:id/leave', authenticateToken, validateObjectId('id'), checkGroupMember, asyncHandler(async (req, res) => {
  const group = req.group;
  const userId = req.user._id;

  try {
    await group.removeMember(userId);
    
    // Remove group from user's groups
    await User.findByIdAndUpdate(userId, {
      $pull: { groups: group._id }
    });

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username firstName lastName avatar');

    sendSuccessResponse(res, { group: updatedGroup }, 'Successfully left group');
  } catch (error) {
    if (error.message === 'Cannot remove the last admin from the group') {
      return sendErrorResponse(res, 'Cannot leave group as the last admin. Transfer admin role first.', 400, 'LAST_ADMIN');
    }
    throw error;
  }
}));

// @route   POST /api/groups/:id/invite
// @desc    Invite user to group
// @access  Private (Admin only)
router.post('/:id/invite', authenticateToken, validateObjectId('id'), checkGroupAdmin, asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return sendErrorResponse(res, 'Email is required', 400, 'EMAIL_REQUIRED');
  }

  const group = req.group;

  try {
    await group.sendInvitation(email, req.user._id);
    
    const updatedGroup = await Group.findById(group._id)
      .populate('invitations.invitedBy', 'username firstName lastName');

    sendSuccessResponse(res, { group: updatedGroup }, 'Invitation sent successfully');
  } catch (error) {
    if (error.message === 'Invitation already sent to this email') {
      return sendErrorResponse(res, 'Invitation already sent to this email', 400, 'INVITATION_EXISTS');
    }
    if (error.message === 'User is already a member of this group') {
      return sendErrorResponse(res, 'User is already a member of this group', 400, 'ALREADY_MEMBER');
    }
    throw error;
  }
}));

// @route   POST /api/groups/:id/accept-invitation
// @desc    Accept group invitation
// @access  Private
router.post('/:id/accept-invitation', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const { invitationId } = req.body;
  
  if (!invitationId) {
    return sendErrorResponse(res, 'Invitation ID is required', 400, 'INVITATION_ID_REQUIRED');
  }

  const group = await Group.findById(req.params.id);
  
  if (!group) {
    return sendErrorResponse(res, 'Group not found', 404, 'GROUP_NOT_FOUND');
  }

  const invitation = group.invitations.id(invitationId);
  
  if (!invitation) {
    return sendErrorResponse(res, 'Invitation not found', 404, 'INVITATION_NOT_FOUND');
  }

  if (invitation.email !== req.user.email) {
    return sendErrorResponse(res, 'This invitation is not for you', 403, 'INVITATION_NOT_FOR_USER');
  }

  if (invitation.status !== 'pending') {
    return sendErrorResponse(res, 'Invitation is no longer valid', 400, 'INVITATION_INVALID');
  }

  if (new Date() > invitation.expiresAt) {
    invitation.status = 'expired';
    await group.save();
    return sendErrorResponse(res, 'Invitation has expired', 400, 'INVITATION_EXPIRED');
  }

  try {
    await group.addMember(req.user._id);
    
    // Mark invitation as accepted
    invitation.status = 'accepted';
    await group.save();
    
    // Add group to user's groups
    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id }
    });

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username firstName lastName avatar');

    sendSuccessResponse(res, { group: updatedGroup }, 'Successfully joined group');
  } catch (error) {
    if (error.message === 'User is already a member of this group') {
      return sendErrorResponse(res, 'You are already a member of this group', 400, 'ALREADY_MEMBER');
    }
    if (error.message === 'Group is full') {
      return sendErrorResponse(res, 'Group is full', 400, 'GROUP_FULL');
    }
    throw error;
  }
}));

// @route   POST /api/groups/:id/decline-invitation
// @desc    Decline group invitation
// @access  Private
router.post('/:id/decline-invitation', authenticateToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const { invitationId } = req.body;
  
  if (!invitationId) {
    return sendErrorResponse(res, 'Invitation ID is required', 400, 'INVITATION_ID_REQUIRED');
  }

  const group = await Group.findById(req.params.id);
  
  if (!group) {
    return sendErrorResponse(res, 'Group not found', 404, 'GROUP_NOT_FOUND');
  }

  const invitation = group.invitations.id(invitationId);
  
  if (!invitation) {
    return sendErrorResponse(res, 'Invitation not found', 404, 'INVITATION_NOT_FOUND');
  }

  if (invitation.email !== req.user.email) {
    return sendErrorResponse(res, 'This invitation is not for you', 403, 'INVITATION_NOT_FOR_USER');
  }

  if (invitation.status !== 'pending') {
    return sendErrorResponse(res, 'Invitation is no longer valid', 400, 'INVITATION_INVALID');
  }

  invitation.status = 'declined';
  await group.save();

  sendSuccessResponse(res, null, 'Invitation declined');
}));

// @route   POST /api/groups/:id/promote-admin
// @desc    Promote member to admin
// @access  Private (Admin only)
router.post('/:id/promote-admin', authenticateToken, validateObjectId('id'), checkGroupAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return sendErrorResponse(res, 'User ID is required', 400, 'USER_ID_REQUIRED');
  }

  const group = req.group;
  const member = group.members.find(m => 
    m.user.toString() === userId.toString() && m.isActive
  );

  if (!member) {
    return sendErrorResponse(res, 'User is not a member of this group', 404, 'USER_NOT_MEMBER');
  }

  if (member.role === 'admin') {
    return sendErrorResponse(res, 'User is already an admin', 400, 'ALREADY_ADMIN');
  }

  member.role = 'admin';
  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate('members.user', 'username firstName lastName avatar');

  sendSuccessResponse(res, { group: updatedGroup }, 'User promoted to admin');
}));

// @route   GET /api/groups/:id/stats
// @desc    Get group statistics
// @access  Private (Member only)
router.get('/:id/stats', authenticateToken, validateObjectId('id'), checkGroupMember, asyncHandler(async (req, res) => {
  const group = req.group;
  
  const stats = {
    totalGoal: group.totalGoal,
    currentAmount: group.currentAmount,
    progressPercentage: group.progressPercentage,
    memberCount: group.memberCount,
    daysRemaining: group.daysRemaining,
    isCompleted: group.isCompleted,
    isOverdue: group.isOverdue,
    totalContributions: group.totalContributions,
    averageContribution: group.averageContribution,
    status: group.status,
    createdAt: group.createdAt,
    goalDeadline: group.goalDeadline
  };

  sendSuccessResponse(res, { stats }, 'Group statistics retrieved successfully');
}));

module.exports = router;
