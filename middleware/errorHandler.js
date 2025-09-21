// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Rate limiting error
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Rate limiting error
const rateLimitError = (req, res, next) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter: req.rateLimit?.resetTime || 60
  });
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
  } else {
    next(err);
  }
};

// Database connection error handler
const dbErrorHandler = (err, req, res, next) => {
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    res.status(503).json({
      success: false,
      message: 'Database connection error. Please try again later.',
      code: 'DB_CONNECTION_ERROR'
    });
  } else {
    next(err);
  }
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.map(error => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));
};

// Success response helper
const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Error response helper
const sendErrorResponse = (res, message, statusCode = 400, code = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    code
  });
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};

// Response metadata helper
const addResponseMetadata = (data, page, limit, total) => {
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  rateLimitError,
  corsErrorHandler,
  dbErrorHandler,
  formatValidationErrors,
  sendSuccessResponse,
  sendErrorResponse,
  paginate,
  addResponseMetadata
};
