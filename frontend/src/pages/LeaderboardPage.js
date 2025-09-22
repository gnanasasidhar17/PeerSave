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
  IndianRupee,
  Award,
  Filter,
  RefreshCw
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Navigation from '../components/Navigation';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('individual');
  const [timeFilter, setTimeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  // Fetch real leaderboard data
  const periodMap = { all: '1y', month: '30d', week: '7d' };
  const typeMap = { individual: 'global', groups: 'global', streaks: 'streak', achievements: 'global' };
  const { data: lbData, isLoading } = useQuery({
    queryKey: ['leaderboard', activeTab, timeFilter],
    queryFn: () => dashboardAPI.getLeaderboard({ params: { type: typeMap[activeTab], period: periodMap[timeFilter] } }),
    refetchOnWindowFocus: false,
  });
  const leaderboard = lbData?.data?.data?.leaderboard || [];

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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  };

  const renderIndividualLeaderboard = () => {
    if (isLoading) return <LoadingSpinner />;
    const data = leaderboard.map((u, idx) => ({
      rank: u.rank || idx + 1,
      name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.username || 'User'),
      avatar: (u.firstName?.[0] || u.username?.[0] || 'U').toUpperCase(),
      totalSaved: u.totalSaved || u.totalAmount || 0,
      goalsCompleted: u.totalContributions || 0,
      streak: u.currentStreak || 0,
      badge: '',
      badgeColor: '',
    }));
    if (!data.length) {
      return (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No leaderboard data yet</h3>
          <p className="text-dark-400">Make some contributions to appear here.</p>
        </Card>
      );
    }
    
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
                      <IndianRupee className="w-4 h-4" />
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
    const data = leaderboard.map((g, idx) => ({
      rank: g.rank || idx + 1,
      name: g.name || 'Group',
      members: g.memberCount || 0,
      totalSaved: g.currentAmount || 0,
      goalAmount: g.totalGoal || 0,
      progress: Math.round((g.currentAmount && g.totalGoal) ? (g.currentAmount / g.totalGoal) * 100 : 0),
      daysLeft: 0,
      leader: '',
      badge: '',
      badgeColor: ''
    }));
    if (!data.length) {
      return (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No group data yet</h3>
          <p className="text-dark-400">Once your groups start contributing, they will appear here.</p>
        </Card>
      );
    }
    
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
    const data = leaderboard.map((u, idx) => ({
      rank: u.rank || idx + 1,
      name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.username || 'User'),
      avatar: (u.firstName?.[0] || u.username?.[0] || 'U').toUpperCase(),
      streak: u.currentStreak || 0,
      totalDays: u.longestStreak || u.currentStreak || 0,
      badge: '',
      badgeColor: ''
    }));
    if (!data.length) {
      return (
        <Card className="p-12 text-center">
          <Zap className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No streaks yet</h3>
          <p className="text-dark-400">Contribute regularly to start a streak.</p>
        </Card>
      );
    }
    
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
    const data = leaderboard.map((u, idx) => ({
      rank: u.rank || idx + 1,
      name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.username || 'User'),
      avatar: (u.firstName?.[0] || u.username?.[0] || 'U').toUpperCase(),
      achievements: u.totalContributions || 0,
      recentBadge: '',
      badgeColor: ''
    }));
    if (!data.length) {
      return (
        <Card className="p-12 text-center">
          <Award className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No achievements yet</h3>
          <p className="text-dark-400">Earn badges by saving and reaching milestones.</p>
        </Card>
      );
    }
    
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

  // Summary metrics derived from the current leaderboard payload
  const totalSavedSum = leaderboard.reduce((sum, e) => sum + (e.totalSaved || e.totalAmount || e.currentAmount || 0), 0);
  const totalContribSum = leaderboard.reduce((sum, e) => sum + (e.totalContributions || 0), 0);
  const totalUsersOrGroups = leaderboard.length;

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
              {isLoading ? '...' : totalUsersOrGroups}
            </div>
            <div className="text-dark-300">{activeTab === 'groups' ? 'Total Groups' : 'Total Users'}</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-accent-400 mb-2">
              {isLoading ? '...' : formatCurrency(totalSavedSum)}
            </div>
            <div className="text-dark-300">Total Saved</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-success-400 mb-2">
              {isLoading ? '...' : totalContribSum}
            </div>
            <div className="text-dark-300">Total Contributions</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-warning-400 mb-2">
              {isLoading ? '...' : (activeTab === 'groups' ? totalUsersOrGroups : '--')}
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
