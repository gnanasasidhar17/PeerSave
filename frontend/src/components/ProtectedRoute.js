import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const location = useLocation();
  
  // Debug logging
  console.log('🛡️ ProtectedRoute - Auth State:', {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    hasToken: !!token,
    tokenFromStorage: !!localStorage.getItem('token'),
    currentPath: location.pathname
  });

  if (isLoading) {
    console.log('⏳ ProtectedRoute - Still loading auth state');
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mb-4" />
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute - User not authenticated, redirecting to login');
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ ProtectedRoute - User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;
