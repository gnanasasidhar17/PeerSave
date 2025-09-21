const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');
const Contribution = require('../models/Contribution');
const Goal = require('../models/Goal');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse, paginate, addResponseMetadata } = require('../middleware/errorHandler');

// @route   GET /api/dashboard/overview
// @desc    Get user dashboard overview
// @access  Private
router.get('/overview', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get user with populated groups
  const user = await User.findById(userId)
    .populate('groups', 'name totalGoal currentAmount progressPercentage status memberCount')
    .select('-password');

  // Get recent contributions
  const recentContributions = await Contribution.find({ user: userId, status: 'confirmed' })
    .populate('group', 'name')
    .sort({ contributionDate: -1 })
    .limit(5);

  // Get recent goals
  const recentGoals = await Goal.find({ owner: userId })
    .populate('group', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get active groups
  const activeGroups = user.groups.filter(group => group.status === 'active');
  const completedGroups = user.groups.filter(group => group.status === 'completed');

  // Calculate total group value and progress
  const totalGroupValue = user.groups.reduce((sum, group) => sum + group.totalGoal, 0);
  const totalGroupProgress = user.groups.reduce((sum, group) => sum + group.currentAmount, 0);
  const overallProgress = totalGroupValue > 0 ? (totalGroupProgress / totalGroupValue) * 100 : 0;

  // Get contribution stats for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentStats = await Contribution.aggregate([
    {
      $match: {
        user: userId,
        status: 'confirmed',
        contributionDate: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalContributions: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);

  const recentStatsData = recentStats[0] || {
    totalAmount: 0,
    totalContributions: 0,
    averageAmount: 0
  };

  // Get streak information
  const streakInfo = {
    current: user.currentStreak,
    longest: user.longestStreak,
    level: user.level,
    experience: user.experience,
    nextLevelExp: (user.level + 1) * 1000 - user.experience
  };

  // Get badges
  const badges = user.badges.slice(-5); // Last 5 badges

  const overview = {
    user: {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      totalSaved: user.totalSaved,
      currency: user.currency
    },
    groups: {
      total: user.groups.length,
      active: activeGroups.length,
      completed: completedGroups.length,
      totalValue: totalGroupValue,
      totalProgress: totalGroupProgress,
      overallProgress: Math.round(overallProgress * 100) / 100
    },
    recentActivity: {
      contributions: recentContributions,
      goals: recentGoals
    },
    stats: {
      recent: recentStatsData,
      streak: streakInfo,
      badges
    }
  };

  sendSuccessResponse(res, overview, 'Dashboard overview retrieved successfully');
}));

// @route   GET /api/dashboard/analytics
// @desc    Get detailed analytics
// @access  Private
router.get('/analytics', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { period = '30d' } = req.query;

  // Calculate date range based on period
  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  // Get contribution analytics
  const contributionAnalytics = await Contribution.aggregate([
    {
      $match: {
        user: userId,
        status: 'confirmed',
        contributionDate: { $gte: startDate }
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
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Get contribution by type
  const contributionByType = await Contribution.aggregate([
    {
      $match: {
        user: userId,
        status: 'confirmed',
        contributionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Get contribution by category
  const contributionByCategory = await Contribution.aggregate([
    {
      $match: {
        user: userId,
        status: 'confirmed',
        contributionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Get group performance
  const groupPerformance = await Group.aggregate([
    {
      $match: {
        'members.user': userId,
        'members.isActive': true
      }
    },
    {
      $lookup: {
        from: 'contributions',
        localField: '_id',
        foreignField: 'group',
        as: 'contributions'
      }
    },
    {
      $addFields: {
        userContributions: {
          $filter: {
            input: '$contributions',
            cond: {
              $and: [
                { $eq: ['$$this.user', userId] },
                { $eq: ['$$this.status', 'confirmed'] }
              ]
            }
          }
        }
      }
    },
    {
      $addFields: {
        userTotalContributed: { $sum: '$userContributions.amount' },
        groupProgress: {
          $multiply: [
            { $divide: ['$currentAmount', '$totalGoal'] },
            100
          ]
        }
      }
    },
    {
      $project: {
        name: 1,
        totalGoal: 1,
        currentAmount: 1,
        groupProgress: 1,
        userTotalContributed: 1,
        memberCount: 1,
        status: 1
      }
    }
  ]);

  // Get goal analytics
  const goalAnalytics = await Goal.aggregate([
    {
      $match: {
        owner: userId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalTargetAmount: { $sum: '$targetAmount' },
        totalCurrentAmount: { $sum: '$currentAmount' }
      }
    }
  ]);

  // Get monthly trends
  const monthlyTrends = await Contribution.aggregate([
    {
      $match: {
        user: userId,
        status: 'confirmed',
        contributionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$contributionDate' },
          month: { $month: '$contributionDate' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const analytics = {
    period,
    contributionAnalytics,
    contributionByType,
    contributionByCategory,
    groupPerformance,
    goalAnalytics,
    monthlyTrends
  };

  sendSuccessResponse(res, analytics, 'Analytics retrieved successfully');
}));

// @route   GET /api/dashboard/leaderboard
// @desc    Get leaderboard data
// @access  Private
router.get('/leaderboard', authenticateToken, asyncHandler(async (req, res) => {
  const { type = 'global', groupId, period = '30d' } = req.query;

  // Calculate date range
  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  let leaderboard = [];

  if (type === 'global') {
    // Global leaderboard based on total saved
    leaderboard = await User.aggregate([
      {
        $match: {
          isActive: true,
          totalSaved: { $gt: 0 }
        }
      },
      {
        $project: {
          username: 1,
          firstName: 1,
          lastName: 1,
          avatar: 1,
          totalSaved: 1,
          currentStreak: 1,
          level: 1,
          experience: 1
        }
      },
      { $sort: { totalSaved: -1 } },
      { $limit: 50 }
    ]);
  } else if (type === 'group' && groupId) {
    // Group leaderboard
    const group = await Group.findById(groupId);
    if (!group) {
      return sendErrorResponse(res, 'Group not found', 404, 'GROUP_NOT_FOUND');
    }

    // Check if user is a member
    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.isActive
    );

    if (!isMember) {
      return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
    }

    leaderboard = await Contribution.aggregate([
      {
        $match: {
          group: groupId,
          status: 'confirmed',
          contributionDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          totalAmount: { $sum: '$amount' },
          totalContributions: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
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
          username: '$user.username',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          avatar: '$user.avatar',
          totalAmount: 1,
          totalContributions: 1,
          averageAmount: 1
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
  } else if (type === 'streak') {
    // Streak leaderboard
    leaderboard = await User.aggregate([
      {
        $match: {
          isActive: true,
          currentStreak: { $gt: 0 }
        }
      },
      {
        $project: {
          username: 1,
          firstName: 1,
          lastName: 1,
          avatar: 1,
          currentStreak: 1,
          longestStreak: 1,
          level: 1
        }
      },
      { $sort: { currentStreak: -1 } },
      { $limit: 50 }
    ]);
  }

  // Add rank to each entry
  leaderboard = leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));

  sendSuccessResponse(res, { leaderboard, type, period }, 'Leaderboard retrieved successfully');
}));

// @route   GET /api/dashboard/achievements
// @desc    Get user achievements and badges
// @access  Private
router.get('/achievements', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const user = await User.findById(userId).select('badges level experience totalSaved currentStreak longestStreak');
  
  // Get all possible achievements (this would typically come from a database)
  const allAchievements = [
    {
      id: 'first_contribution',
      name: 'First Steps',
      description: 'Make your first contribution',
      icon: '🎯',
      category: 'milestone',
      requirement: 1,
      current: user.totalSaved > 0 ? 1 : 0,
      achieved: user.totalSaved > 0
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day contribution streak',
      icon: '🔥',
      category: 'streak',
      requirement: 7,
      current: user.currentStreak,
      achieved: user.currentStreak >= 7
    },
    {
      id: 'streak_30',
      name: 'Monthly Master',
      description: 'Maintain a 30-day contribution streak',
      icon: '💪',
      category: 'streak',
      requirement: 30,
      current: user.currentStreak,
      achieved: user.currentStreak >= 30
    },
    {
      id: 'level_5',
      name: 'Rising Star',
      description: 'Reach level 5',
      icon: '⭐',
      category: 'level',
      requirement: 5,
      current: user.level,
      achieved: user.level >= 5
    },
    {
      id: 'level_10',
      name: 'Super Saver',
      description: 'Reach level 10',
      icon: '🌟',
      category: 'level',
      requirement: 10,
      current: user.level,
      achieved: user.level >= 10
    },
    {
      id: 'total_1000',
      name: 'Thousandaire',
      description: 'Save a total of $1,000',
      icon: '💰',
      category: 'total',
      requirement: 1000,
      current: user.totalSaved,
      achieved: user.totalSaved >= 1000
    }
  ];

  // Get user's earned badges
  const earnedBadges = user.badges;
  
  // Calculate progress for unearned achievements
  const achievements = allAchievements.map(achievement => ({
    ...achievement,
    progress: Math.min(100, (achievement.current / achievement.requirement) * 100)
  }));

  // Separate achieved and unachieved
  const achieved = achievements.filter(a => a.achieved);
  const unachieved = achievements.filter(a => !a.achieved);

  const response = {
    earnedBadges,
    achievements: {
      total: achievements.length,
      achieved: achieved.length,
      unachieved: unachieved.length,
      list: achievements
    },
    stats: {
      level: user.level,
      experience: user.experience,
      totalSaved: user.totalSaved,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak
    }
  };

  sendSuccessResponse(res, response, 'Achievements retrieved successfully');
}));

// @route   GET /api/dashboard/insights
// @desc    Get personalized insights and recommendations
// @access  Private
router.get('/insights', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get user's recent activity
  const recentContributions = await Contribution.find({ user: userId, status: 'confirmed' })
    .sort({ contributionDate: -1 })
    .limit(10);

  const recentGoals = await Goal.find({ owner: userId })
    .sort({ createdAt: -1 })
    .limit(5);

  // Get user's groups
  const user = await User.findById(userId).populate('groups', 'name status totalGoal currentAmount progressPercentage');
  
  // Generate insights based on data
  const insights = [];

  // Streak insights
  if (user.currentStreak > 0) {
    insights.push({
      type: 'positive',
      title: 'Great Streak!',
      message: `You've maintained a ${user.currentStreak}-day contribution streak. Keep it up!`,
      icon: '🔥',
      action: 'Continue contributing to maintain your streak'
    });
  } else {
    insights.push({
      type: 'motivational',
      title: 'Start Your Streak',
      message: 'Begin contributing regularly to build a saving streak and earn rewards!',
      icon: '🎯',
      action: 'Make your first contribution today'
    });
  }

  // Goal insights
  const activeGoals = recentGoals.filter(goal => goal.status === 'active');
  if (activeGoals.length > 0) {
    const goal = activeGoals[0];
    const daysRemaining = goal.daysRemaining;
    
    if (daysRemaining < 7 && goal.progressPercentage < 80) {
      insights.push({
        type: 'urgent',
        title: 'Goal Deadline Approaching',
        message: `Your goal "${goal.title}" is due in ${daysRemaining} days and is ${goal.progressPercentage.toFixed(1)}% complete.`,
        icon: '⏰',
        action: 'Increase your contributions to meet your goal'
      });
    } else if (goal.progressPercentage > 50) {
      insights.push({
        type: 'positive',
        title: 'Great Progress!',
        message: `You're ${goal.progressPercentage.toFixed(1)}% towards your goal "${goal.title}".`,
        icon: '📈',
        action: 'Keep up the momentum!'
      });
    }
  }

  // Group insights
  const activeGroups = user.groups.filter(group => group.status === 'active');
  if (activeGroups.length > 0) {
    const group = activeGroups[0];
    if (group.progressPercentage > 75) {
      insights.push({
        type: 'positive',
        title: 'Group Goal Almost Complete!',
        message: `Your group "${group.name}" is ${group.progressPercentage.toFixed(1)}% towards its goal.`,
        icon: '🎉',
        action: 'Help push the group to completion!'
      });
    }
  }

  // Contribution pattern insights
  if (recentContributions.length >= 3) {
    const avgAmount = recentContributions.reduce((sum, c) => sum + c.amount, 0) / recentContributions.length;
    const totalAmount = recentContributions.reduce((sum, c) => sum + c.amount, 0);
    
    insights.push({
      type: 'informational',
      title: 'Recent Activity',
      message: `You've contributed $${totalAmount.toFixed(2)} in your last ${recentContributions.length} contributions (avg: $${avgAmount.toFixed(2)}).`,
      icon: '📊',
      action: 'Keep up the consistent saving!'
    });
  }

  // Level up insights
  const nextLevelExp = (user.level + 1) * 1000 - user.experience;
  if (nextLevelExp < 500) {
    insights.push({
      type: 'motivational',
      title: 'Level Up Soon!',
      message: `You're only ${nextLevelExp} experience points away from level ${user.level + 1}!`,
      icon: '⬆️',
      action: 'Make a few more contributions to level up'
    });
  }

  // Recommendations
  const recommendations = [
    {
      title: 'Set a Daily Goal',
      description: 'Try setting a small daily contribution goal to build consistency.',
      type: 'goal_setting'
    },
    {
      title: 'Join More Groups',
      description: 'Join additional saving groups to increase your accountability.',
      type: 'social'
    },
    {
      title: 'Review Your Progress',
      description: 'Check your analytics regularly to track your saving patterns.',
      type: 'analytics'
    }
  ];

  const response = {
    insights,
    recommendations,
    stats: {
      totalContributions: recentContributions.length,
      activeGoals: activeGoals.length,
      activeGroups: activeGroups.length,
      currentStreak: user.currentStreak,
      level: user.level
    }
  };

  sendSuccessResponse(res, response, 'Insights retrieved successfully');
}));

module.exports = router;
