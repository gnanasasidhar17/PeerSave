import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      console.log('🔍 AuthContext - Checking auth on app start:', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
      });
      
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          console.log('📞 AuthContext - Fetching user profile...');
          const response = await authAPI.getProfile();
          console.log('✅ AuthContext - Profile fetched successfully:', response.data);
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data?.data?.user,
              token,
              refreshToken: localStorage.getItem('refreshToken'),
            },
          });
        } catch (error) {
          console.error('❌ AuthContext - Profile fetch failed:', error);
          // Token is invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
        }
      } else {
        console.log('❌ AuthContext - No token found, user not authenticated');
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.login(credentials);
      
      // Store tokens
      localStorage.setItem('token', response.data?.data?.token);
      localStorage.setItem('refreshToken', response.data?.data?.refreshToken);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data?.data?.user,
          token: response.data?.data?.token,
          refreshToken: response.data?.data?.refreshToken,
        },
      });
      
      toast.success('Welcome back! 🎉');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      console.log('🚀 Attempting registration with data:', userData);
      const response = await authAPI.register(userData);
      console.log('✅ Registration response:', response);
      
      // Store tokens
      console.log('💾 Storing token:', response.data?.data?.token ? 'Token received' : 'NO TOKEN!');
      console.log('💾 Storing refreshToken:', response.data?.data?.refreshToken ? 'RefreshToken received' : 'NO REFRESH TOKEN!');
      
      localStorage.setItem('token', response.data?.data?.token);
      localStorage.setItem('refreshToken', response.data?.data?.refreshToken);
      
      // Verify tokens were stored
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      console.log('✅ Token stored successfully:', !!storedToken);
      console.log('✅ RefreshToken stored successfully:', !!storedRefreshToken);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data?.data?.user,
          token: response.data?.data?.token,
          refreshToken: response.data?.data?.refreshToken,
        },
      });
      
      toast.success('Account created successfully! 🚀');
      return { success: true };
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data?.data?.user,
      });
      toast.success('Profile updated successfully! ✨');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully! 🔐');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshAuthToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await authAPI.refreshToken(refreshToken);
      
      // Update tokens
      localStorage.setItem('token', response.data?.data?.token);
      localStorage.setItem('refreshToken', response.data?.data?.refreshToken);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: state.user,
          token: response.data?.data?.token,
          refreshToken: response.data?.data?.refreshToken,
        },
      });
      
      return true;
    } catch (error) {
      // Refresh failed, logout user
      logout();
      return false;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshAuthToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
