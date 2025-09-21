import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  Star,
  Calendar,
  DollarSign,
  Award,
  Filter,
  RefreshCw
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Navigation from '../components/Navigation';
import { format } from 'date-fns';

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('individual');
  const [timeFilter, setTimeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  // State for loading and data
  const [isLoading, setIsLoading] = useState(false);
  const [individualData, setIndividualData] = useState(null);
  const [groupsData, setGroupsData] = useState(null);
  const [streaksData, setStreaksData] = useState(null);
  const [achievementsData, setAchievementsData] = useState(null);
  const [statsData, setStatsData] = useState(null);

  // Mock data for fallback - will be replaced with API calls
  const mockLeaderboardData = {
    individual: [
      {
        rank: 1,
        name: "Alex Johnson",
        avatar: "AJ",
        totalSaved: 2450,
        goalsCompleted: 7,
        streak: 15,
        groups: 3,
        badge: "Savings Master",
        badgeColor: "text-yellow-400"
      },
      {
        rank: 2,
        name: "Sarah Chen",
        avatar: "SC",
        totalSaved: 2100,
        goalsCompleted: 5,
        streak: 12,
        groups: 2,
        badge: "Consistent Saver",
        badgeColor: "text-blue-400"
      },
      {
        rank: 3,
        name: "Mike Rodriguez",
        avatar: "MR",
        totalSaved: 1850,
        goalsCompleted: 4,
        streak: 8,
        groups: 4,
        badge: "Group Leader",
        badgeColor: "text-green-400"
      },
      {
        rank: 4,
        name: "Emma Wilson",
        avatar: "EW",
        totalSaved: 1650,
        goalsCompleted: 6,
        streak: 10,
        groups: 2,
        badge: "Goal Crusher",
        badgeColor: "text-purple-400"
      },
      {
        rank: 5,
        name: "David Kim",
        avatar: "DK",
        totalSaved: 1400,
        goalsCompleted: 3,
        streak: 6,
        groups: 3,
        badge: "Rising Star",
        badgeColor: "text-orange-400"
      }
    ],
    groups: [
      {
        rank: 1,
        name: "Vacation Squad",
        members: 5,
        totalSaved: 8500,
        goalAmount: 10000,
        progress: 85,
        daysLeft: 30,
        leader: "Alex Johnson",
        badge: "Top Group",
        badgeColor: "text-yellow-400"
      },
      {
        rank: 2,
        name: "Emergency Fund Team",
        members: 4,
        totalSaved: 6800,
        goalAmount: 8000,
        progress: 85,
        daysLeft: 45,
        leader: "Sarah Chen",
        badge: "Consistent Performers",
        badgeColor: "text-blue-400"
      },
      {
        rank: 3,
        name: "Gadget Hunters",
        members: 6,
        totalSaved: 4200,
        goalAmount: 6000,
        progress: 70,
        daysLeft: 60,
        leader: "Mike Rodriguez",
        badge: "Active Contributors",
        badgeColor: "text-green-400"
      }
    ],
    streaks: [
      {
        rank: 1,
        name: "Alex Johnson",
        avatar: "AJ",
        streak: 15,
        totalDays: 45,
        badge: "Streak Master",
        badgeColor: "text-yellow-400"
      },
      {
        rank: 2,
        name: "Sarah Chen",
        avatar: "SC",
        streak: 12,
        totalDays: 38,
        badge: "Consistent",
        badgeColor: "text-blue-400"
      },
      {
        rank: 3,
        name: "Emma Wilson",
        avatar: "EW",
        streak: 10,
        totalDays: 32,
        badge: "Dedicated",
        badgeColor: "text-purple-400"
      }
    ],
    achievements: [
      {
        rank: 1,
        name: "Emma Wilson",
        avatar: "EW",
        achievements: 8,
        recentBadge: "Goal Crusher",
        badgeColor: "text-purple-400"
      },
      {
        rank: 2,
        name: "Alex Johnson",
        avatar: "AJ",
        achievements: 7,
        recentBadge: "Savings Master",
        badgeColor: "text-yellow-400"
      },
      {
        rank: 3,
        name: "Sarah Chen",
        avatar: "SC",
        achievements: 6,
        recentBadge: "Consistent Saver",
        badgeColor: "text-blue-400"
      }
    ]
  };

  const tabs = [
    { id: 'individual', label: 'Top Savers', icon: Trophy },
    { id: 'groups', label: 'Group Champions', icon: Users },
    { id: 'streaks', label: 'Streak Masters', icon: Zap },
    { id: 'achievements', label: 'Achievement Leaders', icon: Award }
  ];

  const timeFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'month', label: 'This Month' },
    { value: 'week', label: 'This Week' }
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-dark-400 font-bold">#{rank}</span>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderIndividualLeaderboard = () => {
    if (isLoading) return <LoadingSpinner />;
    const data = individualData || mockLeaderboardData.individual;
    
    return (
      <div className="space-y-4">
        {data.map((user, index) => (
          <motion.div
            key={user.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card p-6 ${index < 3 ? 'ring-2 ring-primary-500/20' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary text-white font-bold text-lg">
                  {user.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                    {index < 3 && (
                      <span className={`badge ${user.badgeColor}`}>
                        {user.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-dark-300">
                    <span className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatCurrency(user.totalSaved)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{user.goalsCompleted} goals</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>{user.streak} day streak</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getRankIcon(user.rank)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderGroupLeaderboard = () => {
    if (isLoading) return <LoadingSpinner />;
    const data = groupsData || mockLeaderboardData.groups;
    
    return (
      <div className="space-y-4">
        {data.map((group, index) => (
          <motion.div
            key={group.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card p-6 ${index < 3 ? 'ring-2 ring-primary-500/20' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-accent text-white font-bold text-lg">
                    {group.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                      {index < 3 && (
                        <span className={`badge ${group.badgeColor}`}>
                          {group.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-300">Led by {group.leader}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-300">Progress</span>
                    <span className="text-white font-medium">{group.progress}%</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${group.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-dark-300">
                    <span>{formatCurrency(group.totalSaved)} / {formatCurrency(group.goalAmount)}</span>
                    <span>{group.daysLeft} days left</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {getRankIcon(group.rank)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderStreakLeaderboard = () => {
    if (isLoading) return <LoadingSpinner />;
    const data = streaksData || mockLeaderboardData.streaks;
    
    return (
      <div className="space-y-4">
        {data.map((user, index) => (
          <motion.div
            key={user.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card p-6 ${index < 3 ? 'ring-2 ring-primary-500/20' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary text-white font-bold text-lg">
                  {user.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                    {index < 3 && (
                      <span className={`badge ${user.badgeColor}`}>
                        {user.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-dark-300">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>{user.streak} day streak</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{user.totalDays} total days</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getRankIcon(user.rank)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderAchievementLeaderboard = () => {
    if (isLoading) return <LoadingSpinner />;
    const data = achievementsData || mockLeaderboardData.achievements;
    
    return (
      <div className="space-y-4">
        {data.map((user, index) => (
          <motion.div
            key={user.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card p-6 ${index < 3 ? 'ring-2 ring-primary-500/20' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary text-white font-bold text-lg">
                  {user.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                    {index < 3 && (
                      <span className={`badge ${user.badgeColor}`}>
                        {user.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-dark-300">
                    <span className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>{user.achievements} achievements</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Latest: {user.recentBadge}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getRankIcon(user.rank)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderLeaderboard = () => {
    switch (activeTab) {
      case 'individual': return renderIndividualLeaderboard();
      case 'groups': return renderGroupLeaderboard();
      case 'streaks': return renderStreakLeaderboard();
      case 'achievements': return renderAchievementLeaderboard();
      default: return renderIndividualLeaderboard();
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navigation />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                🏆 Leaderboard
              </h1>
              <p className="text-dark-300 text-lg">
                See who's leading the savings game and get inspired!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-dark-300 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-dark-400" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-dark-800 border border-dark-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {timeFilters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-dark-800 p-1 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-dark-300 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Leaderboard Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderLeaderboard()}
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary-400 mb-2">
              {isLoading ? '...' : (statsData?.totalUsers || '1,247')}
            </div>
            <div className="text-dark-300">Total Users</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-accent-400 mb-2">
              {isLoading ? '...' : formatCurrency(statsData?.totalSaved || 89450)}
            </div>
            <div className="text-dark-300">Total Saved</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-success-400 mb-2">
              {isLoading ? '...' : (statsData?.goalsCompleted || '342')}
            </div>
            <div className="text-dark-300">Goals Completed</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-warning-400 mb-2">
              {isLoading ? '...' : (statsData?.totalGroups || '89')}
            </div>
            <div className="text-dark-300">Active Groups</div>
          </Card>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
