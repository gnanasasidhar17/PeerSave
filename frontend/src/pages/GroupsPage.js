import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Crown
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';
import Navigation from '../components/Navigation';
import { groupsAPI } from '../services/api';

const GroupsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const queryClient = useQueryClient();

  // Fetch user's groups
  const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useQuery({
    queryKey: ['groups', searchQuery],
    queryFn: () => {
      const params = searchQuery.trim() ? { q: searchQuery } : {};
      return groupsAPI.getGroups(params);
    },
    refetchOnWindowFocus: false,
  });

  // Fetch public groups
  const { data: publicGroupsData, isLoading: publicGroupsLoading } = useQuery({
    queryKey: ['public-groups', searchQuery],
    queryFn: () => {
      const params = searchQuery.trim() ? { q: searchQuery } : {};
      return groupsAPI.getPublicGroups(params);
    },
    refetchOnWindowFocus: false,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: groupsAPI.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['public-groups'] });
      setShowCreateModal(false);
      toast.success('Group created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create group');
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: groupsAPI.joinGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['public-groups'] });
      setShowJoinModal(false);
      toast.success('Successfully joined group!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to join group');
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: groupsAPI.leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Successfully left group!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: groupsAPI.deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    },
  });

  const groups = groupsData?.data?.data?.data || [];
  const publicGroups = publicGroupsData?.data?.data?.data || [];

  const handleCreateGroup = (data) => {
    const payload = {
      name: data.name,
      description: data.description,
      totalGoal: typeof data.totalGoal === 'string' ? parseFloat(data.totalGoal) : data.totalGoal,
      goalDeadline: data.goalDeadline,
      privacy: data.privacy || 'public',
      currency: 'INR',
    };
    createGroupMutation.mutate(payload);
  };

  const handleJoinGroup = (groupId) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleLeaveGroup = (groupId) => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      leaveGroupMutation.mutate(groupId);
    }
  };

  const handleDeleteGroup = (groupId) => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      deleteGroupMutation.mutate(groupId);
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
    });
  };

  const calculateDaysRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (groupsLoading) {
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
              <h1 className="text-4xl font-bold text-white mb-2">Groups</h1>
              <p className="text-dark-300 text-lg">Manage your saving groups and collaborations</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex items-center space-x-2"
                onClick={() => setShowJoinModal(true)}
              >
                <UserPlus className="w-5 h-5" />
                <span>Join Group</span>
              </Button>
              <Button 
                variant="primary" 
                className="flex items-center space-x-2"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-5 h-5" />
                <span>Create Group</span>
              </Button>
            </div>
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search groups..."
                  leftIcon={<Search className="w-5 h-5" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* My Groups Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">My Groups ({groups.length})</h2>
          {groups.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-dark-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No groups yet</h3>
              <p className="text-dark-400 mb-6">Create your first group or join an existing one to start saving together!</p>
              <div className="flex justify-center space-x-4">
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  Create Group
                </Button>
                <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                  Join Group
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <Card key={group._id} className="p-6 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                        <p className="text-dark-400 text-sm">{group.members.length} members</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGroup(group)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLeaveGroup(group._id)}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Progress</span>
                      <span className="text-white">{Math.round(group.progressPercentage || 0)}%</span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-primary" 
                        style={{ width: `${group.progressPercentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-dark-400">
                      <span>{formatCurrency(group.currentAmount || 0)} / {formatCurrency(group.totalGoal || 0)}</span>
                      <span>{calculateDaysRemaining(group.goalDeadline)} days left</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-dark-400 mb-4">
                    <span>Created {formatDate(group.createdAt)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      group.status === 'active' ? 'bg-success-400/20 text-success-400' :
                      group.status === 'completed' ? 'bg-primary-400/20 text-primary-400' :
                      'bg-warning-400/20 text-warning-400'
                    }`}>
                      {group.status}
                    </span>
                  </div>

                  <Button variant="ghost" className="w-full">
                    View Details
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Public Groups Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Public Groups ({publicGroups.length})</h2>
          {publicGroupsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : publicGroups.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-dark-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No public groups available</h3>
              <p className="text-dark-400">Check back later for new public groups to join!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicGroups.map((group) => (
                <Card key={group._id} className="p-6 hover:scale-105 transition-transform">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                      <p className="text-dark-400 text-sm">{group.members.length} members</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
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

                  <div className="flex items-center justify-between text-sm text-dark-400 mb-4">
                    <span>Created {formatDate(group.createdAt)}</span>
                    <span className="px-2 py-1 rounded-full text-xs bg-primary-400/20 text-primary-400">
                      Public
                    </span>
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => handleJoinGroup(group._id)}
                    disabled={joinGroupMutation.isLoading}
                  >
                    {joinGroupMutation.isLoading ? 'Joining...' : 'Join Group'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGroup}
          isLoading={createGroupMutation.isLoading}
        />
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <JoinGroupModal 
          onClose={() => setShowJoinModal(false)}
          groups={publicGroups}
          onJoin={handleJoinGroup}
          isLoading={joinGroupMutation.isLoading}
        />
      )}
    </div>
  );
};

export default GroupsPage;
