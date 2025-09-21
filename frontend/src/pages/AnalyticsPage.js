import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PieChart, Award } from 'lucide-react';
import Card from '../components/Card';

const AnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-dark-950 p-6">
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
            <h3 className="text-2xl font-bold text-white mb-2">$2,450</h3>
            <p className="text-dark-400">Total Saved</p>
          </Card>
          <Card className="p-6 text-center">
            <BarChart3 className="w-8 h-8 text-accent-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">15</h3>
            <p className="text-dark-400">Active Goals</p>
          </Card>
          <Card className="p-6 text-center">
            <PieChart className="w-8 h-8 text-success-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">67%</h3>
            <p className="text-dark-400">Success Rate</p>
          </Card>
          <Card className="p-6 text-center">
            <Award className="w-8 h-8 text-warning-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">12</h3>
            <p className="text-dark-400">Badges Earned</p>
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
  );
};

export default AnalyticsPage;
