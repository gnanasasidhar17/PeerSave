import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const baseClasses = 'w-full transition-all duration-300 focus:outline-none';
  
  const variants = {
    default: 'input',
    error: 'input-error',
    success: 'input border-success-500 focus:border-success-500 focus:ring-success-500/20',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
  };

  const inputClasses = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    className
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {label && (
        <label className="block text-sm font-medium text-dark-200 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-danger-400"
        >
          {error}
        </motion.p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-dark-400">
          {helperText}
        </p>
      )}
    </motion.div>
  );
});

Input.displayName = 'Input';

export default Input;
