import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PieChart, Award } from 'lucide-react';
import Card from '../components/Card';
import Navigation from '../components/Navigation';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

const AnalyticsPage = () => {
  const { data } = useQuery({
    queryKey: ['analytics','30d'],
    queryFn: () => dashboardAPI.getAnalytics({ period: '30d' }),
    refetchOnWindowFocus: false,
  });
  const analytics = data?.data?.data || {};

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(amount || 0));

  const totalSaved = analytics.contributionAnalytics?.reduce?.((s, d) => s + (d.totalAmount || 0), 0) || 0;
  const activeGoals = analytics.goalAnalytics?.reduce?.((s, g) => s + (g.count || 0), 0) || 0;
  const successRate = analytics.groupPerformance?.length ? Math.round((analytics.groupPerformance.filter(g => (g.groupProgress||0) >= 100).length / analytics.groupPerformance.length) * 100) : 0;
  const badgesEarned = analytics.goalAnalytics?.filter?.(g => g._id === 'completed')[0]?.count || 0;

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
          <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-dark-300 text-lg">Detailed insights into your saving patterns and progress</p>
        </motion.div>

        {/* Analytics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-primary-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">{formatCurrency(totalSaved)}</h3>
            <p className="text-dark-400">Total Saved (last 30 days)</p>
          </Card>
          <Card className="p-6 text-center">
            <BarChart3 className="w-8 h-8 text-accent-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">{activeGoals}</h3>
            <p className="text-dark-400">Goals (by status)</p>
          </Card>
          <Card className="p-6 text-center">
            <PieChart className="w-8 h-8 text-success-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">{successRate}%</h3>
            <p className="text-dark-400">Group Success Rate</p>
          </Card>
          <Card className="p-6 text-center">
            <Award className="w-8 h-8 text-warning-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">{badgesEarned}</h3>
            <p className="text-dark-400">Completed Goals</p>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Savings Over Time</h3>
            <div className="h-64 bg-dark-800/50 rounded-lg flex items-center justify-center">
              <p className="text-dark-400">Chart placeholder</p>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Goal Progress</h3>
            <div className="h-64 bg-dark-800/50 rounded-lg flex items-center justify-center">
              <p className="text-dark-400">Chart placeholder</p>
            </div>
          </Card>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
