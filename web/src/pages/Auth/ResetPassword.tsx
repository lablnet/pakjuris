import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import useAuth from '../../hooks/auth/useAuth';
import Button from '../../components/Button';
import Input from '../../components/Input';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    try {
      const result = await resetPassword(email);
      if (result) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
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
            <h1 className="text-2xl font-bold">Reset Your Password</h1>
            <p className="opacity-90">We'll send you a verification code to reset your password</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4">
                OTP sent! Check your inbox for the verification code.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={18} />}
                required
              />

              <Button
                type="submit"
                isLoading={loading}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default ResetPassword; 