const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      })),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'])
    .withMessage('Invalid currency'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'])
    .withMessage('Invalid currency'),
  
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  
  body('notifications.reminders')
    .optional()
    .isBoolean()
    .withMessage('Reminders must be a boolean'),
  
  handleValidationErrors
];

// Group validation rules
const validateGroupCreation = [
  body('name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Group name must be between 1 and 50 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  
  body('type')
    .optional()
    .isIn(['friends', 'family', 'colleagues', 'classmates', 'community', 'other'])
    .withMessage('Invalid group type'),
  
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'invite-only'])
    .withMessage('Invalid privacy setting'),
  
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Max members must be between 2 and 50'),
  
  body('totalGoal')
    .isFloat({ min: 0.01 })
    .withMessage('Total goal must be greater than 0')
    .toFloat(),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'])
    .withMessage('Invalid currency'),
  
  body('goalDeadline')
    .isISO8601()
    .withMessage('Goal deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Goal deadline must be in the future');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateGroupUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Group name must be between 1 and 50 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Max members must be between 2 and 50'),
  
  body('totalGoal')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Total goal must be greater than 0')
    .toFloat(),
  
  body('goalDeadline')
    .optional()
    .isISO8601()
    .withMessage('Goal deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Goal deadline must be in the future');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Contribution validation rules
const validateContribution = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Contribution amount must be greater than 0')
    .toFloat(),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'])
    .withMessage('Invalid currency'),
  
  body('type')
    .optional()
    .isIn(['regular', 'bonus', 'catch-up', 'milestone', 'penalty'])
    .withMessage('Invalid contribution type'),
  
  body('category')
    .optional()
    .isIn(['savings', 'emergency', 'vacation', 'education', 'gift', 'investment', 'other'])
    .withMessage('Invalid contribution category'),
  
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
    .trim(),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .trim(),
  
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank_transfer', 'upi', 'card', 'digital_wallet', 'other'])
    .withMessage('Invalid payment method'),
  
  body('contributionDate')
    .optional()
    .isISO8601()
    .withMessage('Contribution date must be a valid date'),
  
  handleValidationErrors
];

// Goal validation rules
const validateGoalCreation = [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('Goal title must be between 1 and 100 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  
  body('targetAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be greater than 0')
    .toFloat(),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'])
    .withMessage('Invalid currency'),
  
  body('type')
    .optional()
    .isIn(['personal', 'group', 'emergency', 'vacation', 'education', 'investment', 'purchase', 'debt_payment'])
    .withMessage('Invalid goal type'),
  
  body('category')
    .optional()
    .isIn(['savings', 'emergency', 'vacation', 'education', 'gift', 'investment', 'debt', 'other'])
    .withMessage('Invalid goal category'),
  
  body('targetDate')
    .isISO8601()
    .withMessage('Target date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('Public setting must be a boolean'),
  
  handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),
  
  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'amount', 'progress'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateGroupCreation,
  validateGroupUpdate,
  validateContribution,
  validateGoalCreation,
  validateObjectId,
  validatePagination,
  validateSearch
};
