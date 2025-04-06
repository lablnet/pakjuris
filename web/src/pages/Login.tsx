import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';
import useAuth from '../hooks/auth/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await login({ email, password });
      // Note: navigation is handled in the useAuth hook
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-md"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="opacity-90">Sign in to continue to PakJuris</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="password" className="block text-gray-700 font-medium">
                    Password
                  </label>
                  <Link to="/reset-password" className="text-sm text-blue-600 hover:text-blue-800">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Login; 