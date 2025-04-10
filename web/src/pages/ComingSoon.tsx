import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';
import { Link } from 'react-router-dom';

const ComingSoon = () => {
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
              <h1 className="text-4xl font-bold mb-4">Site Launch Coming Soon!</h1>
              <p className="text-xl opacity-90">
                We're preparing to launch our exciting new platform!
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
                <div className="inline-block p-6 bg-blue-50 rounded-full shadow-md mb-6">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="1.5" />
                    <path d="M12 8V12L15 15" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Get Ready for Something Amazing!</h2>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Our team is working hard to bring you an incredible experience. We're putting the finishing touches on our platform and will be launching very soon. Stay tuned for updates!
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
                    About Us
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

export default ComingSoon;
