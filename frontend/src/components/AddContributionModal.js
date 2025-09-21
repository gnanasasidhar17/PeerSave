import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, DollarSign, Users, FileText, CreditCard, Tag } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';

const AddContributionModal = ({ onClose, onSubmit, groups = [], isLoading }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const selectedGroupId = watch('groupId');
  const selectedGroup = groups.find(group => group._id === selectedGroupId);

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
            <h2 className="text-2xl font-bold text-white">Add Contribution</h2>
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
                Select Group
              </label>
              <select
                {...register('groupId', { required: 'Group is required' })}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Choose a group...</option>
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {errors.groupId && (
                <p className="text-red-400 text-sm mt-1">{errors.groupId.message}</p>
              )}
            </div>

            {selectedGroup && (
              <div className="p-4 bg-dark-800/50 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="w-5 h-5 text-primary-400" />
                  <h3 className="text-lg font-semibold text-white">{selectedGroup.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Progress</span>
                    <span className="text-white">{Math.round(selectedGroup.progressPercentage || 0)}%</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-primary" 
                      style={{ width: `${selectedGroup.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-dark-400">
                    <span>{formatCurrency(selectedGroup.currentAmount || 0)} / {formatCurrency(selectedGroup.totalGoal || 0)}</span>
                    <span className="text-success-400">
                      {formatCurrency((selectedGroup.totalGoal || 0) - (selectedGroup.currentAmount || 0))} remaining
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Contribution Amount
              </label>
              <Input
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be at least $0.01' }
                })}
                type="number"
                step="0.01"
                placeholder="0.00"
                leftIcon={<DollarSign className="w-5 h-5" />}
                error={errors.amount?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Contribution Type
              </label>
              <select
                {...register('type')}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="regular">Regular</option>
                <option value="bonus">Bonus</option>
                <option value="milestone">Milestone</option>
                <option value="emergency">Emergency</option>
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

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Payment Method
              </label>
              <select
                {...register('paymentMethod')}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                placeholder="Add a description for this contribution..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Payment Reference (Optional)
              </label>
              <Input
                {...register('paymentReference')}
                placeholder="Transaction ID, check number, etc."
                leftIcon={<CreditCard className="w-5 h-5" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                placeholder="Additional notes..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={2}
              />
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
                {isLoading ? 'Adding...' : 'Add Contribution'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default AddContributionModal;

