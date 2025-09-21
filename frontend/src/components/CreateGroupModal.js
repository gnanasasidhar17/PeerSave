import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, Users, DollarSign, Calendar, Lock, Globe } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';

const CreateGroupModal = ({ onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const privacy = watch('privacy', 'public');

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create New Group</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-dark-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Group Name
              </label>
              <Input
                {...register('name', { 
                  required: 'Group name is required',
                  minLength: { value: 3, message: 'Name must be at least 3 characters' }
                })}
                placeholder="Enter group name"
                leftIcon={<Users className="w-5 h-5" />}
                error={errors.name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                {...register('description', { 
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' }
                })}
                placeholder="Describe your group's purpose..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Goal Amount
              </label>
              <Input
                {...register('totalGoal', { 
                  required: 'Goal amount is required',
                  min: { value: 1, message: 'Goal must be at least $1' }
                })}
                type="number"
                placeholder="0.00"
                leftIcon={<DollarSign className="w-5 h-5" />}
                error={errors.totalGoal?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Goal Deadline
              </label>
              <Input
                {...register('goalDeadline', { 
                  required: 'Deadline is required',
                  validate: (value) => {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return selectedDate > today || 'Deadline must be in the future';
                  }
                })}
                type="date"
                leftIcon={<Calendar className="w-5 h-5" />}
                error={errors.goalDeadline?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Privacy
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    {...register('privacy')}
                    type="radio"
                    value="public"
                    className="w-4 h-4 text-primary-500 bg-dark-800 border-dark-600 focus:ring-primary-500"
                  />
                  <Globe className="w-4 h-4 text-dark-400" />
                  <span className="text-white">Public - Anyone can join</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    {...register('privacy')}
                    type="radio"
                    value="private"
                    className="w-4 h-4 text-primary-500 bg-dark-800 border-dark-600 focus:ring-primary-500"
                  />
                  <Lock className="w-4 h-4 text-dark-400" />
                  <span className="text-white">Private - Invite only</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateGroupModal;

