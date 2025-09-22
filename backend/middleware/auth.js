const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found',
        code: 'INVALID_TOKEN'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user is admin of a group
const checkGroupAdmin = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
        code: 'GROUP_NOT_FOUND'
      });
    }

    const member = group.members.find(m => 
      m.user.toString() === userId.toString() && m.isActive
    );

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
        code: 'NOT_MEMBER'
      });
    }

    if (member.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    req.group = group;
    next();
  } catch (error) {
    console.error('Group admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user is member of a group
const checkGroupMember = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
        code: 'GROUP_NOT_FOUND'
      });
    }

    const member = group.members.find(m => 
      m.user.toString() === userId.toString() && m.isActive
    );

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
        code: 'NOT_MEMBER'
      });
    }

    req.group = group;
    req.member = member;
    next();
  } catch (error) {
    console.error('Group member check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user owns a resource
const checkResourceOwner = (resourceField = 'user') => {
  return (req, res, next) => {
    try {
      const resourceUserId = req[resourceField] || req.body[resourceField] || req.params[resourceField];
      const currentUserId = req.user._id;

      if (resourceUserId.toString() !== currentUserId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - resource ownership required',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('Resource owner check error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error',
        code: 'AUTH_ERROR'
      });
    }
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

module.exports = {
  authenticateToken,
  checkGroupAdmin,
  checkGroupMember,
  checkResourceOwner,
  generateToken,
  generateRefreshToken
};
