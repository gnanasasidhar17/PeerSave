import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  IndianRupee, 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import AddContributionModal from '../components/AddContributionModal';
import EditContributionModal from '../components/EditContributionModal';
import Navigation from '../components/Navigation';
import { contributionsAPI, groupsAPI } from '../services/api';

const ContributionsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const queryClient = useQueryClient();

  // Fetch user's contributions
  const { data: contributionsData, isLoading: contributionsLoading } = useQuery({
    queryKey: ['contributions', searchQuery, groupFilter, typeFilter, statusFilter],
    queryFn: () => contributionsAPI.getContributions({ 
      q: searchQuery,
      groupId: groupFilter !== 'all' ? groupFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    refetchOnWindowFocus: false,
  });

  // Fetch user's groups for filtering and adding contributions
  const { data: groupsData } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => groupsAPI.getGroups(),
    refetchOnWindowFocus: false,
  });

  // Fetch contribution statistics
  const { data: statsData } = useQuery({
    queryKey: ['contribution-stats'],
    queryFn: () => contributionsAPI.getContributionStats(),
    refetchOnWindowFocus: false,
  });

  // Create contribution mutation
  const createContributionMutation = useMutation({
    mutationFn: contributionsAPI.createContribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['contribution-stats'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowAddModal(false);
      toast.success('Contribution added successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add contribution');
    },
  });

  // Update contribution mutation
  const updateContributionMutation = useMutation({
    mutationFn: ({ id, data }) => contributionsAPI.updateContribution(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['contribution-stats'] });
      setShowEditModal(false);
      toast.success('Contribution updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update contribution');
    },
  });

  // Delete contribution mutation
  const deleteContributionMutation = useMutation({
    mutationFn: contributionsAPI.deleteContribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['contribution-stats'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Contribution cancelled successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel contribution');
    },
  });

  const contributions = contributionsData?.data?.data?.data || [];
  const groups = groupsData?.data?.data?.data || groupsData?.data?.data || [];
  const stats = statsData?.data || {};

  const handleCreateContribution = (data) => {
    createContributionMutation.mutate(data);
  };

  const handleUpdateContribution = (id, data) => {
    updateContributionMutation.mutate({ id, data });
  };

  const handleDeleteContribution = (id) => {
    if (window.confirm('Are you sure you want to cancel this contribution? This action cannot be undone.')) {
      deleteContributionMutation.mutate(id);
    }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffTime = now - new Date(date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-success-400/20 text-success-400';
      case 'pending': return 'bg-warning-400/20 text-warning-400';
      case 'cancelled': return 'bg-red-400/20 text-red-400';
      case 'rejected': return 'bg-red-400/20 text-red-400';
      default: return 'bg-dark-400/20 text-dark-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'regular': return 'bg-primary-400/20 text-primary-400';
      case 'bonus': return 'bg-accent-400/20 text-accent-400';
      case 'milestone': return 'bg-success-400/20 text-success-400';
      case 'emergency': return 'bg-red-400/20 text-red-400';
      default: return 'bg-dark-400/20 text-dark-400';
    }
  };

  if (contributionsLoading) {
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
              <h1 className="text-4xl font-bold text-white mb-2">Contributions</h1>
              <p className="text-dark-300 text-lg">Track your saving contributions and history</p>
            </div>
            <Button 
              variant="primary" 
              className="flex items-center space-x-2"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-5 h-5" />
              <span>Add Contribution</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        {stats.overview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-success-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {formatCurrency(stats.overview.totalAmount || 0)}
              </h3>
              <p className="text-dark-400">Total Contributed</p>
            </Card>
            <Card className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-primary-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {stats.overview.totalContributions || 0}
              </h3>
              <p className="text-dark-400">Total Contributions</p>
            </Card>
            <Card className="p-6 text-center">
              <Award className="w-8 h-8 text-accent-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {formatCurrency(stats.overview.averageAmount || 0)}
              </h3>
              <p className="text-dark-400">Average Amount</p>
            </Card>
            <Card className="p-6 text-center">
              <Users className="w-8 h-8 text-warning-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {stats.user?.currentStreak || 0}
              </h3>
              <p className="text-dark-400">Current Streak</p>
            </Card>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search contributions..."
                  leftIcon={<Search className="w-5 h-5" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Groups</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="regular">Regular</option>
                  <option value="bonus">Bonus</option>
                  <option value="milestone">Milestone</option>
                  <option value="emergency">Emergency</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contributions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {contributions.length === 0 ? (
            <Card className="p-12 text-center">
              <IndianRupee className="w-16 h-16 text-dark-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No contributions yet</h3>
              <p className="text-dark-400 mb-6">Start contributing to your groups to track your savings progress!</p>
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                Add Your First Contribution
              </Button>
            </Card>
          ) : (
            contributions.map((contribution) => (
              <Card key={contribution._id} className="p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center">
                      <IndianRupee className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {formatCurrency(contribution.amount)}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${getStatusColor(contribution.status)}`}>
                          {getStatusIcon(contribution.status)}
                          <span>{contribution.status}</span>
                        </span>
                        {contribution.type && (
                          <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(contribution.type)}`}>
                            {contribution.type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-dark-400">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{contribution.group?.name || 'Unknown Group'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(contribution.contributionDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-4 h-4" />
                          <span className="capitalize">{contribution.paymentMethod?.replace('_', ' ')}</span>
                        </div>
                      </div>
                      {contribution.description && (
                        <p className="text-dark-300 text-sm mt-2">{contribution.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-success-400 font-semibold">
                        {formatCurrency(contribution.amount)}
                      </p>
                      <p className="text-dark-400 text-sm">
                        {getRelativeTime(contribution.contributionDate)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContribution(contribution)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {contribution.status === 'confirmed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEditModal(contribution)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {contribution.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContribution(contribution._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </motion.div>
      </div>
      </div>

      {/* Add Contribution Modal */}
      {showAddModal && (
        <AddContributionModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateContribution}
          groups={groups}
          isLoading={createContributionMutation.isLoading}
        />
      )}

      {/* Edit Contribution Modal */}
      {showEditModal && (
        <EditContributionModal 
          contribution={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateContribution}
          isLoading={updateContributionMutation.isLoading}
        />
      )}
    </div>
  );
};

export default ContributionsPage;
