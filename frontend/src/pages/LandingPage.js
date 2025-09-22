import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Target, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap,
  Star,
  CheckCircle,
  Play
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Collaborative Saving",
      description: "Join groups with friends, family, or colleagues to save together towards common goals."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Goal Tracking",
      description: "Set personal and group goals with milestones, progress tracking, and deadlines."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Analytics & Insights",
      description: "Get detailed analytics, spending patterns, and personalized recommendations."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Bank-level security with end-to-end encryption to protect your financial data."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Gamification",
      description: "Earn badges, level up, and compete on leaderboards to stay motivated."
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Achievements",
      description: "Unlock achievements and celebrate milestones with your saving community."
    }
  ];

  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "$2M+", label: "Total Saved" },
    { number: "500+", label: "Groups Created" },
    { number: "95%", label: "Success Rate" }
  ];

  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-success-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">PeerSave</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link to="/login" className="btn-ghost">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="gradient-text-animated">Save Together,</span>
              <br />
              <span className="text-white">Achieve Together</span>
            </h1>
            <p className="text-xl md:text-2xl text-dark-300 max-w-3xl mx-auto leading-relaxed">
              Transform your saving habits with collaborative goal-setting, gamification, 
              and community support. Make saving fun, social, and rewarding.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12"
          >
            <Link to="/register" className="btn-primary text-lg px-8 py-4 group">
              Start Saving Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="btn-secondary text-lg px-8 py-4 group">
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Demo
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.number}
                </div>
                <div className="text-dark-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="gradient-text">PeerSave</span>?
            </h2>
            <p className="text-xl text-dark-300 max-w-3xl mx-auto">
              We've built the most comprehensive platform for collaborative saving with 
              features designed to keep you motivated and on track.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-hover group"
              >
                <div className="text-primary-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-dark-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="card p-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your <span className="gradient-text">Saving Journey</span>?
            </h2>
            <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already achieving their financial goals 
              through collaborative saving and gamification.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/register" className="btn-primary text-lg px-8 py-4 group">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="btn-ghost text-lg px-8 py-4">
                Already have an account? Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-dark-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">PeerSave</span>
          </div>
          <p className="text-dark-400 mb-4">
            © 2024 PeerSave. All rights reserved.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-dark-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
