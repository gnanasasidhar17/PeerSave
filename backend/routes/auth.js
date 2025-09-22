const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, generateToken, generateRefreshToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin, validateUserUpdate } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName, currency = 'USD' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return sendErrorResponse(res, 'User with this email or username already exists', 409, 'USER_EXISTS');
  }

  // Create new user
  const user = new User({
    username,
    email,
    password,
    firstName,
    lastName,
    currency
  });

  await user.save();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  sendSuccessResponse(res, {
    user: userResponse,
    token,
    refreshToken
  }, 'User registered successfully', 201);
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Find user by email or username
    const user = await User.findByCredentials(identifier, password);
    
    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    sendSuccessResponse(res, {
      user: userResponse,
      token,
      refreshToken
    }, 'Login successful');
  } catch (error) {
    sendErrorResponse(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
}));

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendErrorResponse(res, 'Refresh token required', 400, 'NO_REFRESH_TOKEN');
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
    
    if (decoded.type !== 'refresh') {
      return sendErrorResponse(res, 'Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return sendErrorResponse(res, 'User not found or inactive', 401, 'USER_NOT_FOUND');
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    sendSuccessResponse(res, {
      token: newToken,
      refreshToken: newRefreshToken
    }, 'Token refreshed successfully');
  } catch (error) {
    sendErrorResponse(res, 'Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
}));

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('groups', 'name description totalGoal currentAmount progressPercentage')
    .select('-password');

  sendSuccessResponse(res, { user }, 'User profile retrieved successfully');
}));

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Private
router.put('/me', authenticateToken, validateUserUpdate, asyncHandler(async (req, res) => {
  const updates = req.body;
  const userId = req.user._id;

  // Remove fields that shouldn't be updated directly
  delete updates.password;
  delete updates.email;
  delete updates.username;
  delete updates.createdAt;
  delete updates.updatedAt;

  const user = await User.findByIdAndUpdate(
    userId,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return sendErrorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
  }

  sendSuccessResponse(res, { user }, 'Profile updated successfully');
}));

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendErrorResponse(res, 'Current password and new password are required', 400, 'MISSING_PASSWORDS');
  }

  if (newPassword.length < 6) {
    return sendErrorResponse(res, 'New password must be at least 6 characters long', 400, 'WEAK_PASSWORD');
  }

  const user = await User.findById(req.user._id).select('+password');
  
  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return sendErrorResponse(res, 'Current password is incorrect', 400, 'INCORRECT_PASSWORD');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccessResponse(res, null, 'Password changed successfully');
}));

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  // For now, we'll just return success as the client will remove the token
  sendSuccessResponse(res, null, 'Logged out successfully');
}));

// @route   DELETE /api/auth/me
// @desc    Delete user account
// @access  Private
router.delete('/me', authenticateToken, asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return sendErrorResponse(res, 'Password confirmation required', 400, 'PASSWORD_REQUIRED');
  }

  const user = await User.findById(req.user._id).select('+password');
  
  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendErrorResponse(res, 'Password is incorrect', 400, 'INCORRECT_PASSWORD');
  }

  // Soft delete - deactivate account
  user.isActive = false;
  await user.save();

  sendSuccessResponse(res, null, 'Account deactivated successfully');
}));

// @route   GET /api/auth/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get user with populated groups
  const user = await User.findById(userId)
    .populate('groups', 'name totalGoal currentAmount progressPercentage status')
    .select('-password');

  // Calculate additional stats
  const activeGroups = user.groups.filter(group => group.status === 'active');
  const completedGroups = user.groups.filter(group => group.status === 'completed');
  
  const stats = {
    totalSaved: user.totalSaved,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    level: user.level,
    experience: user.experience,
    badges: user.badges,
    groups: {
      total: user.groups.length,
      active: activeGroups.length,
      completed: completedGroups.length
    },
    totalGroupsValue: user.groups.reduce((sum, group) => sum + group.totalGoal, 0),
    totalGroupsProgress: user.groups.reduce((sum, group) => sum + group.currentAmount, 0)
  };

  sendSuccessResponse(res, { stats }, 'User statistics retrieved successfully');
}));

// @route   POST /api/auth/verify-email
// @desc    Verify user email (placeholder for future implementation)
// @access  Private
router.post('/verify-email', authenticateToken, asyncHandler(async (req, res) => {
  // This would typically send a verification email
  // For now, we'll just mark the user as verified
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { isVerified: true },
    { new: true }
  ).select('-password');

  sendSuccessResponse(res, { user }, 'Email verification sent');
}));

// @route   GET /api/auth/check-username/:username
// @desc    Check if username is available
// @access  Public
router.get('/check-username/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  const user = await User.findOne({ username });
  const isAvailable = !user;

  sendSuccessResponse(res, { 
    username, 
    isAvailable 
  }, 'Username availability checked');
}));

// @route   GET /api/auth/check-email/:email
// @desc    Check if email is available
// @access  Public
router.get('/check-email/:email', asyncHandler(async (req, res) => {
  const { email } = req.params;
  
  const user = await User.findOne({ email });
  const isAvailable = !user;

  sendSuccessResponse(res, { 
    email, 
    isAvailable 
  }, 'Email availability checked');
}));

module.exports = router;
