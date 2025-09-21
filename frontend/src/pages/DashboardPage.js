import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Award,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Navigation from '../components/Navigation';

const DashboardPage = () => {
  const { user } = useAuth();

  // Mock data - in real app, this would come from API
  const stats = [
    {
      title: 'Total Saved',
      value: '$2,450',
      change: '+12.5%',
      changeType: 'positive',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'success'
    },
    {
      title: 'Active Groups',
      value: '3',
      change: '+1',
      changeType: 'positive',
      icon: <Users className="w-6 h-6" />,
      color: 'primary'
    },
    {
      title: 'Goals Completed',
      value: '7',
      change: '+2',
      changeType: 'positive',
      icon: <Target className="w-6 h-6" />,
      color: 'accent'
    },
    {
      title: 'Current Streak',
      value: '15 days',
      change: '+3',
      changeType: 'positive',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'warning'
    }
  ];

  const recentActivity = [
    {
      type: 'contribution',
      title: 'Added $50 to "Vacation Fund"',
      time: '2 hours ago',
      amount: '+$50',
      positive: true
    },
    {
      type: 'goal',
      title: 'Completed "Emergency Fund" goal',
      time: '1 day ago',
      amount: '$1,000',
      positive: true
    },
    {
      type: 'group',
      title: 'Joined "Family Savings" group',
      time: '2 days ago',
      amount: '',
      positive: true
    },
    {
      type: 'achievement',
      title: 'Earned "Saver" badge',
      time: '3 days ago',
      amount: '',
      positive: true
    }
  ];

  const upcomingGoals = [
    {
      title: 'New Laptop',
      target: '$1,200',
      current: '$800',
      progress: 67,
      deadline: '2 months',
      priority: 'high'
    },
    {
      title: 'Emergency Fund',
      target: '$5,000',
      current: '$3,200',
      progress: 64,
      deadline: '6 months',
      priority: 'medium'
    },
    {
      title: 'Vacation',
      target: '$2,000',
      current: '$1,100',
      progress: 55,
      deadline: '4 months',
      priority: 'low'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'primary';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navigation />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-dark-300 text-lg">
            Here's what's happening with your savings today
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-500/20 text-${stat.color}-400`}>
                    {stat.icon}
                  </div>
                  <div className={`flex items-center text-sm ${
                    stat.changeType === 'positive' ? 'text-success-400' : 'text-danger-400'
                  }`}>
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-dark-400 text-sm">{stat.title}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <Card.Header>
                <Card.Title>Recent Activity</Card.Title>
                <Card.Description>Your latest saving activities and achievements</Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl hover:bg-dark-800/70 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.positive ? 'bg-success-400' : 'bg-danger-400'
                        }`}></div>
                        <div>
                          <p className="text-white font-medium">{activity.title}</p>
                          <p className="text-dark-400 text-sm">{activity.time}</p>
                        </div>
                      </div>
                      {activity.amount && (
                        <span className={`font-semibold ${
                          activity.positive ? 'text-success-400' : 'text-danger-400'
                        }`}>
                          {activity.amount}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Upcoming Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <Card.Header>
                <Card.Title>Upcoming Goals</Card.Title>
                <Card.Description>Your active saving goals</Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {upcomingGoals.map((goal, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 bg-dark-800/50 rounded-xl hover:bg-dark-800/70 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{goal.title}</h4>
                        <span className={`badge badge-${getPriorityColor(goal.priority)}`}>
                          {goal.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-dark-400 mb-2">
                        <span>{goal.current} / {goal.target}</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-${getPriorityColor(goal.priority)}`}
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-dark-500">Due in {goal.deadline}</p>
                    </motion.div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Goal
                </Button>
              </Card.Content>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <Card.Header>
              <Card.Title>Quick Actions</Card.Title>
              <Card.Description>Common tasks to manage your savings</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="primary" className="h-16 flex-col space-y-2">
                  <Target className="w-6 h-6" />
                  <span>Create Goal</span>
                </Button>
                <Button variant="accent" className="h-16 flex-col space-y-2">
                  <Users className="w-6 h-6" />
                  <span>Join Group</span>
                </Button>
                <Button variant="secondary" className="h-16 flex-col space-y-2">
                  <DollarSign className="w-6 h-6" />
                  <span>Add Contribution</span>
                </Button>
              </div>
            </Card.Content>
          </Card>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
