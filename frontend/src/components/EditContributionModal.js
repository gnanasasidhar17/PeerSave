import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, DollarSign, FileText, CreditCard, Tag } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';

const EditContributionModal = ({ contribution, onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      amount: contribution?.amount || 0,
      type: contribution?.type || 'regular',
      category: contribution?.category || 'savings',
      paymentMethod: contribution?.paymentMethod || 'bank_transfer',
      description: contribution?.description || '',
      paymentReference: contribution?.paymentReference || '',
      notes: contribution?.notes || ''
    }
  });

  const handleFormSubmit = (data) => {
    onSubmit(contribution._id, data);
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
            <h2 className="text-2xl font-bold text-white">Edit Contribution</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-dark-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Contribution Info */}
          <div className="mb-6 p-4 bg-dark-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                {formatCurrency(contribution?.amount || 0)}
              </h3>
              <span className="px-2 py-1 rounded-full text-xs bg-success-400/20 text-success-400">
                {contribution?.status}
              </span>
            </div>
            <div className="text-sm text-dark-400">
              <p>Group: {contribution?.group?.name || 'Unknown Group'}</p>
              <p>Date: {new Date(contribution?.contributionDate).toLocaleDateString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
                Payment Reference
              </label>
              <Input
                {...register('paymentReference')}
                placeholder="Transaction ID, check number, etc."
                leftIcon={<CreditCard className="w-5 h-5" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notes
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
                {isLoading ? 'Updating...' : 'Update Contribution'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default EditContributionModal;

