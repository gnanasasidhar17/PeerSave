import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Card = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  glow = false,
  ...props
}) => {
  const baseClasses = 'rounded-2xl p-6 shadow-xl transition-all duration-300';
  
  const variants = {
    default: 'card',
    glass: 'glass-dark',
    gradient: 'card bg-gradient-dark',
    stats: 'stats-card',
  };

  const classes = cn(
    baseClasses,
    variants[variant],
    hover && 'hover:scale-105 hover:shadow-glow',
    glow && 'shadow-glow',
    className
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={classes}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={cn('text-xl font-semibold text-white mb-2', className)} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={cn('text-dark-300 text-sm', className)} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={cn('mt-4 pt-4 border-t border-dark-700', className)} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
