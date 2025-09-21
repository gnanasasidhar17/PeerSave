import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Target, 
  DollarSign, 
  BarChart3, 
  Trophy, 
  User, 
  Menu, 
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/groups', label: 'Groups', icon: Users },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/contributions', label: 'Contributions', icon: DollarSign },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-dark-900/50 backdrop-blur-md border-b border-dark-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">PeerSave</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive(item.path)
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-dark-300 hover:text-white hover:bg-dark-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/profile"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive('/profile')
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-dark-300 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-dark-300 hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-dark-700/50"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 ${
                  isActive('/profile')
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium text-dark-300 hover:text-white hover:bg-dark-800/50 w-full text-left transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

