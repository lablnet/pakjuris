import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, User, Lock, KeyRound } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import useRegister from '../../hooks/auth/useRegister';
import { Button, Input } from '../../components/ui';

const Register = () => {
  const [error, setError] = useState<string | null>(null);
  
  const {
    email,
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    loading,
    register,
    step,
    setAgreeToTerms,
    agreeToTerms,
    code,
    setCode,
    handleResendCode,
    resendCountdown,
    validateOTP
  } = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords match
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      await register();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    try {
      await validateOTP(code);
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    }
  };

  // Render different steps based on the registration process
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderSignupForm();
      case 2:
        return renderOTPVerification();
      default:
        return renderSignupForm();
    }
  };

  const renderSignupForm = () => (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h1 className="text-2xl font-bold">Create an Account</h1>
        <p className="opacity-90">Join and get started</p>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="firstName"
              type="text"
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              leftIcon={<User size={18} />}
              required
            />
            <Input
              id="lastName"
              type="text"
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              leftIcon={<User size={18} />}
              required
            />
          </div>

          <Input
            id="email"
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
            required
          />

          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            isPasswordToggleable
            required
          />

          <Input
            id="passwordConfirm"
            type="password"
            label="Confirm Password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            leftIcon={<Lock size={18} />}
            isPasswordToggleable
            required
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </label>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );

  const renderOTPVerification = () => (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h1 className="text-2xl font-bold">Verify Your Email</h1>
        <p className="opacity-90">We've sent a code to {email}</p>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <Input
            id="otp"
            type="text"
            label="Enter Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            leftIcon={<KeyRound size={18} />}
            placeholder="6-digit code"
            maxLength={6}
            required
          />

          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <div className="text-center mt-4">
            <Button
              type="button"
              onClick={handleResendCode}
              disabled={resendCountdown > 0 || loading}
              variant="ghost"
              size="sm"
            >
              {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );

  return (
    <MainLayout>
      <div className="flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-md"
        >
          {renderStepContent()}
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Register; 