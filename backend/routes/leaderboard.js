const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const User = require('../models/User');
const Group = require('../models/Group');
const Goal = require('../models/Goal');
const Contribution = require('../models/Contribution');

// @route   GET /api/leaderboard/individual
// @desc    Get individual leaderboard
// @access  Private
router.get('/individual', auth, async (req, res) => {
  try {
    const { timeFilter = 'all' } = req.query;
    
    // Calculate date range based on filter
    let startDate;
    const now = new Date();
    
    switch (timeFilter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get users with their contribution stats
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'contributions',
          localField: '_id',
          foreignField: 'userId',
          as: 'contributions'
        }
      },
      {
        $lookup: {
          from: 'goals',
          localField: '_id',
          foreignField: 'userId',
          as: 'goals'
        }
      },
      {
        $addFields: {
          totalSaved: {
            $sum: {
              $cond: [
                { $gte: ['$contributions.createdAt', startDate] },
                '$contributions.amount',
                0
              ]
            }
          },
          goalsCompleted: {
            $size: {
              $filter: {
                input: '$goals',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          currentStreak: {
            $let: {
              vars: {
                sortedContributions: {
                  $sortArray: {
                    input: '$contributions',
                    sortBy: { createdAt: -1 }
                  }
                }
              },
              in: {
                $reduce: {
                  input: '$$sortedContributions',
                  initialValue: 0,
                  in: {
                    $cond: [
                      {
                        $gte: [
                          '$$this.createdAt',
                          {
                            $dateSubtract: {
                              startDate: '$$value',
                              unit: 'day',
                              amount: 1
                            }
                          }
                        ]
                      },
                      { $add: ['$$value', 1] },
                      0
                    ]
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalSaved: 1,
          goalsCompleted: 1,
          currentStreak: 1,
          avatar: { $substr: ['$name', 0, 2] },
          badge: {
            $switch: {
              branches: [
                { case: { $gte: ['$totalSaved', 2000] }, then: 'Savings Master' },
                { case: { $gte: ['$totalSaved', 1000] }, then: 'Consistent Saver' },
                { case: { $gte: ['$totalSaved', 500] }, then: 'Rising Star' }
              ],
              default: 'New Saver'
            }
          }
        }
      },
      {
        $sort: { totalSaved: -1 }
      },
      {
        $limit: 50
      }
    ]);

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching individual leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/groups
// @desc    Get group leaderboard
// @access  Private
router.get('/groups', auth, async (req, res) => {
  try {
    const { timeFilter = 'all' } = req.query;
    
    // Calculate date range based on filter
    let startDate;
    const now = new Date();
    
    switch (timeFilter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    const groups = await Group.aggregate([
      {
        $lookup: {
          from: 'contributions',
          localField: '_id',
          foreignField: 'groupId',
          as: 'contributions'
        }
      },
      {
        $lookup: {
          from: 'goals',
          localField: '_id',
          foreignField: 'groupId',
          as: 'goals'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'leader'
        }
      },
      {
        $addFields: {
          totalSaved: {
            $sum: {
              $cond: [
                { $gte: ['$contributions.createdAt', startDate] },
                '$contributions.amount',
                0
              ]
            }
          },
          goalAmount: { $sum: '$goals.targetAmount' },
          progress: {
            $multiply: [
              {
                $divide: [
                  { $sum: '$contributions.amount' },
                  { $sum: '$goals.targetAmount' }
                ]
              },
              100
            ]
          },
          members: { $size: '$members' },
          leaderName: { $arrayElemAt: ['$leader.name', 0] },
          daysLeft: {
            $divide: [
              { $subtract: ['$deadline', new Date()] },
              24 * 60 * 60 * 1000
            ]
          }
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          totalSaved: 1,
          goalAmount: 1,
          progress: 1,
          members: 1,
          leaderName: 1,
          daysLeft: 1,
          badge: {
            $switch: {
              branches: [
                { case: { $gte: ['$progress', 90] }, then: 'Top Group' },
                { case: { $gte: ['$progress', 70] }, then: 'Consistent Performers' },
                { case: { $gte: ['$progress', 50] }, then: 'Active Contributors' }
              ],
              default: 'Getting Started'
            }
          }
        }
      },
      {
        $sort: { progress: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Add rank to each group
    const leaderboard = groups.map((group, index) => ({
      ...group,
      rank: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching group leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/streaks
// @desc    Get streak leaderboard
// @access  Private
router.get('/streaks', auth, async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'contributions',
          localField: '_id',
          foreignField: 'userId',
          as: 'contributions'
        }
      },
      {
        $addFields: {
          contributions: {
            $sortArray: {
              input: '$contributions',
              sortBy: { createdAt: -1 }
            }
          }
        }
      },
      {
        $addFields: {
          currentStreak: {
            $let: {
              vars: {
                contributions: '$contributions'
              },
              in: {
                $reduce: {
                  input: '$$contributions',
                  initialValue: { count: 0, lastDate: null },
                  in: {
                    $let: {
                      vars: {
                        contributionDate: { $dateTrunc: { date: '$$this.createdAt', unit: 'day' } },
                        prevDate: {
                          $cond: [
                            { $eq: ['$$value.lastDate', null] },
                            '$$this.createdAt',
                            '$$value.lastDate'
                          ]
                        }
                      },
                      in: {
                        $cond: [
                          {
                            $or: [
                              { $eq: ['$$value.lastDate', null] },
                              {
                                $eq: [
                                  '$$contributionDate',
                                  {
                                    $dateSubtract: {
                                      startDate: '$$prevDate',
                                      unit: 'day',
                                      amount: 1
                                    }
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            count: { $add: ['$$value.count', 1] },
                            lastDate: '$$contributionDate'
                          },
                          '$$value'
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          currentStreak: '$currentStreak.count',
          totalDays: { $size: '$contributions' },
          avatar: { $substr: ['$name', 0, 2] },
          badge: {
            $switch: {
              branches: [
                { case: { $gte: ['$currentStreak.count', 30] }, then: 'Streak Master' },
                { case: { $gte: ['$currentStreak.count', 14] }, then: 'Consistent' },
                { case: { $gte: ['$currentStreak.count', 7] }, then: 'Dedicated' }
              ],
              default: 'Getting Started'
            }
          }
        }
      },
      {
        $sort: { currentStreak: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching streak leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/achievements
// @desc    Get achievement leaderboard
// @access  Private
router.get('/achievements', auth, async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'goals',
          localField: '_id',
          foreignField: 'userId',
          as: 'goals'
        }
      },
      {
        $lookup: {
          from: 'contributions',
          localField: '_id',
          foreignField: 'userId',
          as: 'contributions'
        }
      },
      {
        $addFields: {
          achievements: {
            $add: [
              { $size: { $filter: { input: '$goals', cond: { $eq: ['$$this.status', 'completed'] } } } },
              { $size: { $filter: { input: '$contributions', cond: { $gte: ['$$this.amount', 100] } } } },
              { $cond: [{ $gte: [{ $sum: '$contributions.amount' }, 1000] }, 1, 0] },
              { $cond: [{ $gte: [{ $sum: '$contributions.amount' }, 5000] }, 1, 0] },
              { $cond: [{ $gte: [{ $sum: '$contributions.amount' }, 10000] }, 1, 0] }
            ]
          },
          recentBadge: {
            $switch: {
              branches: [
                { case: { $gte: [{ $sum: '$contributions.amount' }, 10000] }, then: 'Savings Master' },
                { case: { $gte: [{ $sum: '$contributions.amount' }, 5000] }, then: 'Big Saver' },
                { case: { $gte: [{ $sum: '$contributions.amount' }, 1000] }, then: 'Consistent Saver' },
                { case: { $gte: [{ $size: { $filter: { input: '$goals', cond: { $eq: ['$$this.status', 'completed'] } } } }, 5] }, then: 'Goal Crusher' }
              ],
              default: 'New Saver'
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          achievements: 1,
          recentBadge: 1,
          avatar: { $substr: ['$name', 0, 2] },
          badge: {
            $switch: {
              branches: [
                { case: { $gte: ['$achievements', 10] }, then: 'Achievement Master' },
                { case: { $gte: ['$achievements', 5] }, then: 'High Achiever' },
                { case: { $gte: ['$achievements', 3] }, then: 'Goal Getter' }
              ],
              default: 'Getting Started'
            }
          }
        }
      },
      {
        $sort: { achievements: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching achievement leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/stats
// @desc    Get overall leaderboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments(),
      Contribution.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Goal.countDocuments({ status: 'completed' }),
      Group.countDocuments()
    ]);

    res.json({
      totalUsers: stats[0],
      totalSaved: stats[1][0]?.total || 0,
      goalsCompleted: stats[2],
      totalGroups: stats[3]
    });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
