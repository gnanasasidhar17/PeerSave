# PeerSave - Collaborative Savings Platform

A full-stack web application built with the MERN stack that enables users to collaborate on savings goals through groups and track their financial progress.

## 🚀 Features

### User Management
- **Authentication**: Secure user registration and login with JWT tokens
- **Profile Management**: Update personal information and track savings statistics
- **Dashboard**: Comprehensive overview of goals, groups, and contributions

### Goals & Savings
- **Personal Goals**: Create and manage individual savings goals
- **Group Goals**: Collaborate with others on shared savings objectives
- **Progress Tracking**: Real-time progress visualization with charts and metrics
- **Goal Categories**: Organize goals by type (emergency, vacation, education, etc.)

### Groups & Collaboration
- **Create Groups**: Set up savings groups with customizable goals and deadlines
- **Join Groups**: Discover and join public savings groups
- **Group Management**: Admin controls for group settings and member management
- **Member Progress**: View all members' contributions and progress

### Contributions & Payments
- **Add Contributions**: Record savings contributions with descriptions
- **Payment Methods**: Support for various payment methods (bank transfer, card, etc.)
- **Contribution History**: Complete history of all contributions with filtering
- **Verification System**: Admin verification for group contributions

### Analytics & Insights
- **Progress Analytics**: Detailed charts and graphs showing savings trends
- **Leaderboards**: Gamified experience with user and group rankings
- **Statistics**: Comprehensive stats on savings rate, streaks, and achievements
- **Insights**: AI-powered insights on saving patterns and recommendations

## 🛠️ Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Query** - Data fetching and state management
- **React Router** - Client-side routing
- **React Hot Toast** - Notification system
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/peersave
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   NODE_ENV=development
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## 🏗️ Project Structure

```
PeerSave/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── middleware/
│   │   ├── auth.js            # Authentication middleware
│   │   ├── errorHandler.js    # Error handling middleware
│   │   └── validation.js      # Request validation middleware
│   ├── models/
│   │   ├── User.js           # User schema
│   │   ├── Group.js          # Group schema
│   │   ├── Goal.js           # Goal schema
│   │   └── Contribution.js   # Contribution schema
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── groups.js         # Group management routes
│   │   ├── goals.js          # Goal management routes
│   │   ├── contributions.js  # Contribution routes
│   │   ├── dashboard.js      # Dashboard data routes
│   │   └── leaderboard.js    # Leaderboard routes
│   └── server.js             # Express server setup
├── frontend/
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (Auth, Theme)
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service functions
│   │   └── utils/            # Utility functions
│   └── package.json          # Frontend dependencies
└── README.md                 # Project documentation
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create new group
- `GET /api/groups/public` - Get public groups
- `POST /api/groups/:id/join` - Join a group

### Goals
- `GET /api/goals` - Get user's goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `POST /api/goals/:id/contribute` - Add contribution to goal

### Contributions
- `GET /api/contributions` - Get user's contributions
- `POST /api/contributions` - Create new contribution
- `GET /api/contributions/stats/overview` - Get contribution statistics

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview data
- `GET /api/leaderboard/individual` - Get individual leaderboard

## 🚀 Deployment

### Environment Variables
Make sure to set the following environment variables for production:

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
NODE_ENV=production
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### Build Commands
```bash
# Build frontend for production
cd frontend && npm run build

# Start backend in production
cd backend && npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Development

### Available Scripts (Frontend)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Available Scripts (Backend)
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 📧 Contact

**Developer:** Gnana Sasidhar  
**GitHub:** [@gnanasasidhar17](https://github.com/gnanasasidhar17)

---

⭐ Star this repository if you found it helpful!