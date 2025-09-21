import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, Target, DollarSign, Calendar, Users, FileText, Star } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';

const CreateGoalModal = ({ onClose, onSubmit, groups = [], isLoading }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const goalType = watch('type', 'personal');
  const isGroupGoal = goalType === 'group';

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
            <h2 className="text-2xl font-bold text-white">Create New Goal</h2>
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
                Goal Name
              </label>
              <Input
                {...register('name', { 
                  required: 'Goal name is required',
                  minLength: { value: 3, message: 'Name must be at least 3 characters' }
                })}
                placeholder="Enter goal name"
                leftIcon={<Target className="w-5 h-5" />}
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
                placeholder="Describe your goal..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Goal Type
              </label>
              <select
                {...register('type', { required: 'Goal type is required' })}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="personal">Personal</option>
                <option value="group">Group</option>
                <option value="emergency">Emergency Fund</option>
                <option value="vacation">Vacation</option>
                <option value="education">Education</option>
                <option value="home">Home Purchase</option>
                <option value="vehicle">Vehicle</option>
                <option value="retirement">Retirement</option>
                <option value="other">Other</option>
              </select>
              {errors.type && (
                <p className="text-red-400 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>

            {isGroupGoal && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Group
                </label>
                <select
                  {...register('group', { 
                    required: isGroupGoal ? 'Group is required for group goals' : false 
                  })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a group...</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {errors.group && (
                  <p className="text-red-400 text-sm mt-1">{errors.group.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Target Amount
              </label>
              <Input
                {...register('targetAmount', { 
                  required: 'Target amount is required',
                  min: { value: 1, message: 'Amount must be at least $1' }
                })}
                type="number"
                step="0.01"
                placeholder="0.00"
                leftIcon={<DollarSign className="w-5 h-5" />}
                error={errors.targetAmount?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Deadline
              </label>
              <Input
                {...register('deadline', { 
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
                error={errors.deadline?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="savings">Savings</option>
                <option value="investment">Investment</option>
                <option value="debt">Debt Payment</option>
                <option value="purchase">Purchase</option>
                <option value="emergency">Emergency</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                {...register('isPublic')}
                type="checkbox"
                className="w-4 h-4 text-primary-500 bg-dark-800 border-dark-600 rounded focus:ring-primary-500"
              />
              <label className="text-white text-sm">
                Make this goal public (others can see and be inspired)
              </label>
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
                {isLoading ? 'Creating...' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateGoalModal;

