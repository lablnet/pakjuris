import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <MainLayout>
      <div className="py-8 px-4 min-h-[80vh] flex items-center">
        <div className="max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-8">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="text-xl opacity-90">
                Page Not Found
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12 p-6"
              >
                <div className="inline-block p-6 bg-red-50 rounded-full shadow-md mb-6">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="1.5" />
                    <path d="M8 8L16 16" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 8L8 16" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! This page doesn't exist</h2>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  The page you're looking for may have been moved, deleted, or might never have existed.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link 
                    to="/"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Go Home
                  </Link>
                  <Link 
                    to="/about"
                    className="bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    About PakJuris
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
