import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Bell, Shield, LogOut } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Navigation from '../components/Navigation';

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      <Navigation />
      <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-dark-300 text-lg">Manage your account settings and preferences</p>
        </motion.div>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">John Doe</h2>
                <p className="text-dark-400 mb-4">john.doe@example.com</p>
                <div className="flex space-x-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">$2,450</p>
                    <p className="text-dark-400 text-sm">Total Saved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">15</p>
                    <p className="text-dark-400 text-sm">Day Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">Level 5</p>
                    <p className="text-dark-400 text-sm">Current Level</p>
                  </div>
                </div>
              </div>
              <Button variant="outline">Edit Profile</Button>
            </div>
          </Card>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-6 h-6 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Account Settings</h3>
            </div>
            <p className="text-dark-400 mb-4">Manage your account information and preferences</p>
            <Button variant="ghost" className="w-full justify-start">
              Update Profile
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-6 h-6 text-accent-400" />
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
            </div>
            <p className="text-dark-400 mb-4">Configure your notification preferences</p>
            <Button variant="ghost" className="w-full justify-start">
              Notification Settings
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-success-400" />
              <h3 className="text-lg font-semibold text-white">Security</h3>
            </div>
            <p className="text-dark-400 mb-4">Manage your password and security settings</p>
            <Button variant="ghost" className="w-full justify-start">
              Security Settings
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <LogOut className="w-6 h-6 text-danger-400" />
              <h3 className="text-lg font-semibold text-white">Sign Out</h3>
            </div>
            <p className="text-dark-400 mb-4">Sign out of your account</p>
            <Button variant="danger" className="w-full justify-start">
              Sign Out
            </Button>
          </Card>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default ProfilePage;
