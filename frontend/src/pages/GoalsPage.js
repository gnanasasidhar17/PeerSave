import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Target, 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Calendar,
  Users,
  Eye,
  MoreVertical,
  TrendingUp,
  Clock,
  Award,
  IndianRupee
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateGoalModal from '../components/CreateGoalModal';
import ContributeModal from '../components/ContributeModal';
import Navigation from '../components/Navigation';
import { goalsAPI, groupsAPI } from '../services/api';

const GoalsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [localGoals, setLocalGoals] = useState([]);
  const queryClient = useQueryClient();

  // Fetch user's goals
  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals', searchQuery, statusFilter, typeFilter],
    queryFn: () => goalsAPI.getGoals({ 
      q: searchQuery, 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined
    }),
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    staleTime: 0,
    keepPreviousData: false,
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to load goals');
    }
  });

  // Fetch user's groups for goal creation
  const { data: groupsData } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => groupsAPI.getGroups(),
    refetchOnWindowFocus: false,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: goalsAPI.createGoal,
    onSuccess: async (response) => {
      // Optimistically add to any cached goals lists
      const newGoal = response?.data?.data?.goal;
      if (newGoal) {
        // Local immediate add so user sees it right away
        setLocalGoals((prev) => {
          const exists = prev.some(g => g._id === newGoal._id);
          return exists ? prev : [newGoal, ...prev];
        });
        queryClient.setQueriesData({ queryKey: ['goals'] }, (old) => {
          if (!old) return old;
          // old is axios response: { data: { success, message, data: { data: [...], pagination } } }
          try {
            const cloned = { ...old };
            const arr = cloned?.data?.data?.data;
            if (Array.isArray(arr)) {
              cloned.data.data.data = [newGoal, ...arr];
              return cloned;
            }
          } catch {}
          return old;
        });
      }
      await queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'goals' });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'], exact: false });
      // Force a refetch so the list updates immediately
      await queryClient.refetchQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'goals' });
      setShowCreateModal(false);
      toast.success('Goal created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create goal');
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => goalsAPI.updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update goal');
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: goalsAPI.deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete goal');
    },
  });

  // Contribute to goal mutation
  const contributeMutation = useMutation({
    mutationFn: ({ id, amount, description }) => goalsAPI.contributeToGoal(id, amount, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowContributeModal(false);
      toast.success('Contribution added successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add contribution');
    },
  });

  // Pause/Resume goal mutation
  const toggleGoalStatusMutation = useMutation({
    mutationFn: ({ id, action }) => {
      if (action === 'pause') return goalsAPI.pauseGoal(id);
      if (action === 'resume') return goalsAPI.resumeGoal(id);
      if (action === 'complete') return goalsAPI.completeGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal status updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update goal status');
    },
  });

  const extractGoals = (resp) => {
    if (!resp) return [];
    const a = resp.data;
    if (Array.isArray(a)) return a;
    const b = a?.data;
    if (Array.isArray(b)) return b;
    const c = b?.data;
    if (Array.isArray(c)) return c;
    return [];
  };
  const goals = extractGoals(goalsData);
  // Merge local goals and server goals uniquely by _id
  const goalMap = new Map();
  [...localGoals, ...goals].forEach(g => {
    if (g && (g._id || g.id)) goalMap.set(g._id || g.id, g);
  });
  const mergedGoals = Array.from(goalMap.values());
  const groups = groupsData?.data?.data?.data || groupsData?.data?.data || [];
  
  // Debug logging
  console.log('GoalsPage Debug:', { 
    localGoals: localGoals.length, 
    serverGoals: goals.length, 
    mergedGoals: mergedGoals.length,
    goalsData: !!goalsData 
  });

  const handleCreateGoal = (data) => {
    createGoalMutation.mutate(data);
  };

  const handleUpdateGoal = (id, data) => {
    updateGoalMutation.mutate({ id, data });
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      deleteGoalMutation.mutate(id);
    }
  };

  const handleContribute = (goalId, amount, description) => {
    contributeMutation.mutate({ id: goalId, amount, description });
  };

  const handleToggleStatus = (goalId, action) => {
    toggleGoalStatusMutation.mutate({ id: goalId, action });
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-success-400/20 text-success-400';
      case 'paused': return 'bg-warning-400/20 text-warning-400';
      case 'completed': return 'bg-primary-400/20 text-primary-400';
      case 'cancelled': return 'bg-red-400/20 text-red-400';
      default: return 'bg-dark-400/20 text-dark-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-400/20 text-red-400';
      case 'medium': return 'bg-yellow-400/20 text-yellow-400';
      case 'low': return 'bg-green-400/20 text-green-400';
      default: return 'bg-dark-400/20 text-dark-400';
    }
  };

  if (goalsLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Goals</h1>
              <p className="text-dark-300 text-lg">Track and manage your saving goals</p>
            </div>
            <Button 
              variant="primary" 
              className="flex items-center space-x-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-5 h-5" />
              <span>Create Goal</span>
            </Button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search goals..."
                  leftIcon={<Search className="w-5 h-5" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="personal">Personal</option>
                  <option value="group">Group</option>
                  <option value="emergency">Emergency</option>
                  <option value="vacation">Vacation</option>
                  <option value="education">Education</option>
                  <option value="home">Home</option>
                  <option value="vehicle">Vehicle</option>
                </select>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Goals Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {mergedGoals.length === 0 ? (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <Target className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No goals yet</h3>
                <p className="text-dark-400 mb-6">Create your first goal to start tracking your savings progress!</p>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  Create Your First Goal
                </Button>
              </Card>
            </div>
          ) : (
            mergedGoals.map((goal) => (
              <Card key={goal._id} className="p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      goal.type === 'group' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                    }`}>
                      {goal.type === 'group' ? (
                        <Users className="w-6 h-6 text-white" />
                      ) : (
                        <Target className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{goal.title || goal.name}</h3>
                      <p className="text-dark-400 text-sm capitalize">{goal.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedGoal(goal)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowContributeModal(goal)}
                    >
                      <IndianRupee className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-dark-300 text-sm mb-4 line-clamp-2">{goal.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Progress</span>
                    <span className="text-white">{Math.round(goal.progressPercentage || 0)}%</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        goal.type === 'group' ? 'bg-gradient-primary' : 'bg-gradient-accent'
                      }`}
                      style={{ width: `${goal.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-dark-400">
                    <span>{formatCurrency(goal.currentAmount || 0)} / {formatCurrency(goal.targetAmount || 0)}</span>
                    <span>{calculateDaysRemaining(goal.targetDate || goal.deadline)} days left</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(goal.status)}`}>
                      {goal.status}
                    </span>
                    {goal.priority && (
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                    )}
                  </div>
                  <span className="text-dark-400">{formatDate(goal.createdAt)}</span>
                </div>

                {goal.group && (
                  <div className="flex items-center space-x-2 text-sm text-dark-400 mb-4">
                    <Users className="w-4 h-4" />
                    <span>Group: {goal.group.name}</span>
                  </div>
                )}

                <div className="flex space-x-2">
                  {goal.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(goal._id, 'pause')}
                      disabled={toggleGoalStatusMutation.isLoading}
                      className="flex-1"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  {goal.status === 'paused' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(goal._id, 'resume')}
                      disabled={toggleGoalStatusMutation.isLoading}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  {goal.status === 'active' && goal.progressPercentage >= 100 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleToggleStatus(goal._id, 'complete')}
                      disabled={toggleGoalStatusMutation.isLoading}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGoal(goal._id)}
                    disabled={deleteGoalMutation.isLoading}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </motion.div>
      </div>
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <CreateGoalModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGoal}
          groups={groups}
          isLoading={createGoalMutation.isLoading}
        />
      )}

      {/* Contribute Modal */}
      {showContributeModal && (
        <ContributeModal 
          goal={showContributeModal}
          onClose={() => setShowContributeModal(false)}
          onSubmit={handleContribute}
          isLoading={contributeMutation.isLoading}
        />
      )}
    </div>
  );
};

export default GoalsPage;
