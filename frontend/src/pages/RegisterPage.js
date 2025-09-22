import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
  const [isEmailAvailable, setIsEmailAvailable] = useState(null);
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check username availability
  const checkUsername = async (username) => {
    if (username && username.length >= 3) {
      try {
        const response = await fetch(`http://localhost:5000/api/auth/check-username/${username}`);
        const data = await response.json();
        setIsUsernameAvailable(data.isAvailable);
      } catch (error) {
        console.error('Error checking username:', error);
      }
    }
  };

  // Check email availability
  const checkEmail = async (email) => {
    if (email && email.includes('@')) {
      try {
        const response = await fetch(`http://localhost:5000/api/auth/check-email/${email}`);
        const data = await response.json();
        setIsEmailAvailable(data.isAvailable);
      } catch (error) {
        console.error('Error checking email:', error);
      }
    }
  };

  const onSubmit = async (data) => {
    console.log('📝 Form submission data:', data);
    console.log('✅ Username available:', isUsernameAvailable);
    console.log('✅ Email available:', isEmailAvailable);
    
    // Clean up the data - remove confirmPassword and terms before sending to API
    const { confirmPassword, terms, ...cleanData } = data;
    console.log('🧹 Cleaned data for API:', cleanData);
    
    const result = await registerUser(cleanData);
    console.log('📋 Registration result:', result);
    
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      console.error('💥 Registration failed:', result.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dark-600 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6 py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-3xl font-bold gradient-text">PeerSave</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-dark-300">Join the community and start saving together</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  type="text"
                  placeholder="John"
                  leftIcon={<User className="w-5 h-5" />}
                  error={errors.firstName?.message}
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 1,
                      message: 'First name is required',
                    },
                  })}
                />
                <Input
                  label="Last Name"
                  type="text"
                  placeholder="Doe"
                  leftIcon={<User className="w-5 h-5" />}
                  error={errors.lastName?.message}
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 1,
                      message: 'Last name is required',
                    },
                  })}
                />
              </div>

              <Input
                label="Username"
                type="text"
                placeholder="johndoe"
                leftIcon={<User className="w-5 h-5" />}
                rightIcon={
                  isUsernameAvailable === true && (
                    <CheckCircle className="w-5 h-5 text-success-400" />
                  )
                }
                error={errors.username?.message}
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters',
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Username can only contain letters, numbers, and underscores',
                  },
                  onChange: (e) => {
                    const username = e.target.value;
                    if (username.length >= 3) {
                      checkUsername(username);
                    }
                  },
                })}
              />

              <Input
                label="Email"
                type="email"
                placeholder="john@example.com"
                leftIcon={<Mail className="w-5 h-5" />}
                rightIcon={
                  isEmailAvailable === true && (
                    <CheckCircle className="w-5 h-5 text-success-400" />
                  )
                }
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                  onChange: (e) => {
                    const email = e.target.value;
                    if (email.includes('@')) {
                      checkEmail(email);
                    }
                  },
                })}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />

              <div className="flex items-start">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-500 bg-dark-800 border-dark-600 rounded focus:ring-primary-500 focus:ring-2 mt-1"
                  {...register('terms', {
                    required: 'You must accept the terms and conditions',
                  })}
                />
                <label className="ml-2 text-sm text-dark-300">
                  I agree to the{' '}
                  <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-sm text-danger-400">{errors.terms.message}</p>
              )}

              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full group"
                size="lg"
              >
                Create Account
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-dark-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-dark-500">
            By creating an account, you agree to our terms and privacy policy
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
