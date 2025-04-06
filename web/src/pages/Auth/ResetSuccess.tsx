import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import Button from '../../components/Button';

const ResetSuccess = () => {
  return (
    <MainLayout>
      <div className="flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-md text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <h1 className="text-2xl font-bold">Password Reset Complete</h1>
            <p className="opacity-90">Your password has been successfully updated</p>
          </div>

          <div className="p-8">
            <div className="flex justify-center mb-6">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            
            <h2 className="text-xl font-semibold mb-4">All Set!</h2>
            <p className="text-gray-600 mb-8">
              Your password has been successfully reset. You can now log in with your new password.
            </p>

            <Link to="/login">
              <Button fullWidth>
                Go to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default ResetSuccess;
