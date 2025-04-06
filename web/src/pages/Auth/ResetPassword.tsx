import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, KeyRound } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import { Button, Input } from '../../components/ui';
import useReset from '../../hooks/auth/useReset';

const ResetPassword = () => {
  const {
    currentStep,
    loading,
    email,
    setEmail,
    code,
    setCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    resendCountdown,
    handleEmailSubmit,
    handleCodeSubmit,
    handleResendCode,
    handlePasswordSubmit,
  } = useReset();

  const renderEmailStep = () => (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h1 className="text-2xl font-bold">Reset Your Password</h1>
        <p className="opacity-90">We'll send you a verification code to reset your password</p>
      </div>

      <div className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }} className="space-y-4">
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
    </>
  );

  const renderOTPStep = () => (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h1 className="text-2xl font-bold">Verify Your Email</h1>
        <p className="opacity-90">We've sent a code to {email}</p>
      </div>

      <div className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); handleCodeSubmit(code); }} className="space-y-4">
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
            {loading ? 'Verifying...' : 'Verify Code'}
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

  const renderPasswordStep = () => (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h1 className="text-2xl font-bold">Set New Password</h1>
        <p className="opacity-90">Create a secure new password for your account</p>
      </div>

      <div className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }} className="space-y-4">
          <Input
            id="newPassword"
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            isPasswordToggleable
            required
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            isPasswordToggleable
            required
          />

          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderEmailStep();
      case 2:
        return renderOTPStep();
      case 3:
        return renderPasswordStep();
      default:
        return renderEmailStep();
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
          {renderCurrentStep()}
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default ResetPassword;
 