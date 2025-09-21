const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Security middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/contributions', require('./routes/contributions'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Basic route for testing
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to PeerSave API! 🎯',
    description: 'A Collaborative Goal-Based Saving Platform',
    version: '1.0.0',
    status: 'Server is running successfully',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      groups: '/api/groups',
      contributions: '/api/contributions',
      goals: '/api/goals',
      dashboard: '/api/dashboard',
      leaderboard: '/api/leaderboard'
    },
    documentation: 'https://github.com/gnanasasidhar17/PeerSave',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check route
app.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: process.memoryUsage(),
    pid: process.pid
  };
  
  res.status(200).json(healthCheck);
});

// API documentation route
app.get('/api', (req, res) => {
  res.json({
    message: 'PeerSave API Documentation',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user profile',
        'PUT /api/auth/me': 'Update user profile',
        'POST /api/auth/change-password': 'Change user password',
        'POST /api/auth/logout': 'Logout user'
      },
      groups: {
        'POST /api/groups': 'Create a new group',
        'GET /api/groups': 'Get user groups',
        'GET /api/groups/public': 'Get public groups',
        'GET /api/groups/:id': 'Get group by ID',
        'PUT /api/groups/:id': 'Update group',
        'DELETE /api/groups/:id': 'Delete group',
        'POST /api/groups/:id/join': 'Join group',
        'POST /api/groups/:id/leave': 'Leave group',
        'POST /api/groups/:id/invite': 'Invite user to group'
      },
      contributions: {
        'POST /api/contributions': 'Add contribution',
        'GET /api/contributions': 'Get user contributions',
        'GET /api/contributions/group/:groupId': 'Get group contributions',
        'GET /api/contributions/:id': 'Get contribution by ID',
        'PUT /api/contributions/:id': 'Update contribution',
        'DELETE /api/contributions/:id': 'Cancel contribution'
      },
      goals: {
        'POST /api/goals': 'Create goal',
        'GET /api/goals': 'Get user goals',
        'GET /api/goals/public': 'Get public goals',
        'GET /api/goals/:id': 'Get goal by ID',
        'PUT /api/goals/:id': 'Update goal',
        'DELETE /api/goals/:id': 'Delete goal',
        'POST /api/goals/:id/contribute': 'Add contribution to goal'
      },
      dashboard: {
        'GET /api/dashboard/overview': 'Get dashboard overview',
        'GET /api/dashboard/analytics': 'Get detailed analytics',
        'GET /api/dashboard/leaderboard': 'Get leaderboard data',
        'GET /api/dashboard/achievements': 'Get achievements and badges',
        'GET /api/dashboard/insights': 'Get personalized insights'
      }
    }
  });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 PeerSave Backend Server Started Successfully!

📱 Server running on: http://localhost:${PORT}
🔍 Health check: http://localhost:${PORT}/health
📚 API Documentation: http://localhost:${PORT}/api
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🕒 Started at: ${new Date().toISOString()}

🎯 Features Available:
   ✅ User Authentication & Registration
   ✅ Group Management & Invitations
   ✅ Contribution Tracking
   ✅ Goal Setting & Milestones
   ✅ Dashboard & Analytics
   ✅ Leaderboards & Achievements
   ✅ Real-time Progress Tracking

💡 Ready to save together! 💰
  `);
});

// Export server for testing
module.exports = server;
