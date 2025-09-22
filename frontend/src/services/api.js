import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            { refreshToken }
          );

          const token = response.data?.data?.token;
          const newRefreshToken = response.data?.data?.refreshToken;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/me', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  checkUsername: (username) => api.get(`/auth/check-username/${username}`),
  checkEmail: (email) => api.get(`/auth/check-email/${email}`),
  getUserStats: () => api.get('/auth/stats'),
};

// Groups API
export const groupsAPI = {
  getGroups: (params) => api.get('/groups', { params }),
  getPublicGroups: (params) => api.get('/groups/public', { params }),
  getGroup: (id) => api.get(`/groups/${id}`),
  createGroup: (groupData) => api.post('/groups', groupData),
  updateGroup: (id, groupData) => api.put(`/groups/${id}`, groupData),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  joinGroup: (id) => api.post(`/groups/${id}/join`),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`),
  inviteUser: (id, email) => api.post(`/groups/${id}/invite`, { email }),
  acceptInvitation: (id, invitationId) => api.post(`/groups/${id}/accept-invitation`, { invitationId }),
  declineInvitation: (id, invitationId) => api.post(`/groups/${id}/decline-invitation`, { invitationId }),
  promoteAdmin: (id, userId) => api.post(`/groups/${id}/promote-admin`, { userId }),
  getGroupStats: (id) => api.get(`/groups/${id}/stats`),
};

// Goals API
export const goalsAPI = {
  getGoals: (params) => api.get('/goals', { params }),
  getPublicGoals: (params) => api.get('/goals/public', { params }),
  getGroupGoals: (groupId, params) => api.get(`/goals/group/${groupId}`, { params }),
  getGoal: (id) => api.get(`/goals/${id}`),
  createGoal: (goalData) => api.post('/goals', goalData),
  updateGoal: (id, goalData) => api.put(`/goals/${id}`, goalData),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  contributeToGoal: (id, amount, description) => api.post(`/goals/${id}/contribute`, { amount, description }),
  pauseGoal: (id) => api.post(`/goals/${id}/pause`),
  resumeGoal: (id) => api.post(`/goals/${id}/resume`),
  completeGoal: (id) => api.post(`/goals/${id}/complete`),
  addMilestone: (id, milestoneData) => api.post(`/goals/${id}/milestones`, milestoneData),
  getMilestones: (id) => api.get(`/goals/${id}/milestones`),
  getGoalStats: () => api.get('/goals/stats/overview'),
};

// Contributions API
export const contributionsAPI = {
  getContributions: (params) => api.get('/contributions', { params }),
  getGroupContributions: (groupId, params) => api.get(`/contributions/group/${groupId}`, { params }),
  getContribution: (id) => api.get(`/contributions/${id}`),
  createContribution: (contributionData) => api.post('/contributions', contributionData),
  updateContribution: (id, contributionData) => api.put(`/contributions/${id}`, contributionData),
  deleteContribution: (id) => api.delete(`/contributions/${id}`),
  verifyContribution: (id) => api.post(`/contributions/${id}/verify`),
  getContributionStats: () => api.get('/contributions/stats/overview'),
  getGroupContributionStats: (groupId) => api.get(`/contributions/stats/group/${groupId}`),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getAnalytics: (params) => api.get('/dashboard/analytics', { params }),
  getLeaderboard: (params) => api.get('/dashboard/leaderboard', { params }),
  getAchievements: () => api.get('/dashboard/achievements'),
  getInsights: () => api.get('/dashboard/insights'),
};

// Leaderboard API
export const leaderboardAPI = {
  getIndividual: (params) => api.get('/leaderboard/individual', { params }),
  getGroups: (params) => api.get('/leaderboard/groups', { params }),
  getStreaks: (params) => api.get('/leaderboard/streaks', { params }),
  getAchievements: (params) => api.get('/leaderboard/achievements', { params }),
  getStats: () => api.get('/leaderboard/stats'),
};

export default api;
