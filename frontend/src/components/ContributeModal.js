import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, IndianRupee, Target } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';

const ContributeModal = ({ goal, onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleFormSubmit = (data) => {
    onSubmit(goal._id, data.amount, data.description);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  };

  const remainingAmount = (goal.targetAmount || 0) - (goal.currentAmount || 0);

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

          {/* Goal Info */}
          <div className="mb-6 p-4 bg-dark-800/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{goal.name}</h3>
                <p className="text-dark-400 text-sm capitalize">{goal.type}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Progress</span>
                <span className="text-white">{Math.round(goal.progressPercentage || 0)}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-accent" 
                  style={{ width: `${goal.progressPercentage || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-dark-400">
                <span>{formatCurrency(goal.currentAmount || 0)} / {formatCurrency(goal.targetAmount || 0)}</span>
                <span className="text-success-400">{formatCurrency(remainingAmount)} remaining</span>
              </div>
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
                  min: { value: 0.01, message: 'Amount must be at least ₹0.01' },
                  max: { 
                    value: remainingAmount, 
                    message: `Amount cannot exceed remaining goal amount of ${formatCurrency(remainingAmount)}` 
                  }
                })}
                type="number"
                step="0.01"
                placeholder="0.00"
                leftIcon={<IndianRupee className="w-5 h-5" />}
                error={errors.amount?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                placeholder="Add a note about this contribution..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Quick Amounts
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[100, 250, 500, 1000, 2500, 5000].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const amountInput = document.querySelector('input[name="amount"]');
                      if (amountInput) {
                        amountInput.value = amount;
                        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }}
                    className="text-xs"
                  >
                    ₹{amount}
                  </Button>
                ))}
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
                {isLoading ? 'Adding...' : 'Add Contribution'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default ContributeModal;

