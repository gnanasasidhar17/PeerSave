import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Users, Calendar, UserPlus } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';

const JoinGroupModal = ({ onClose, groups, onJoin, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Ensure groups is always an array to prevent filter errors
  const safeGroups = Array.isArray(groups) ? groups : [];
  
  const filteredGroups = safeGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDaysRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        <Card className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Join a Group</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-dark-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="mb-6">
            <Input
              placeholder="Search groups..."
              leftIcon={<Search className="w-5 h-5" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No groups found</h3>
                <p className="text-dark-400">
                  {searchQuery ? 'Try adjusting your search terms' : 'No public groups available at the moment'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <div
                    key={group._id}
                    className="p-4 bg-dark-800/50 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                          <p className="text-dark-400 text-sm">{group.members.length} members</p>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onJoin(group._id)}
                        disabled={isLoading}
                        className="flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{isLoading ? 'Joining...' : 'Join'}</span>
                      </Button>
                    </div>

                    {group.description && (
                      <p className="text-dark-300 text-sm mb-3">{group.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">Progress</span>
                        <span className="text-white">{Math.round(group.progressPercentage || 0)}%</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-accent" 
                          style={{ width: `${group.progressPercentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-dark-400">
                        <span>{formatCurrency(group.currentAmount || 0)} / {formatCurrency(group.totalGoal || 0)}</span>
                        <span>{calculateDaysRemaining(group.goalDeadline)} days left</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-dark-400 mt-3">
                      <span>Created {formatDate(group.createdAt)}</span>
                      <span className="px-2 py-1 rounded-full bg-primary-400/20 text-primary-400">
                        Public
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-dark-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
              disabled={isLoading}
            >
              Close
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default JoinGroupModal;

