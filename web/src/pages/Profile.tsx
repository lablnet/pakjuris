import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, changeUserPassword } from '../utils/firebase';
import MainLayout from '../layouts/MainLayout';

const Profile = () => {
  const { currentUser } = useAuth();
  
  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Check if user is signed in with Google
  const isGoogleUser = currentUser?.providerData?.some(
    provider => provider.providerId === 'google.com'
  );

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [currentUser]);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);
    
    try {
      const result = await updateUserProfile(displayName);
      
      if (result.error) {
        setProfileError(result.error);
      } else {
        setProfileSuccess(true);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    
    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const result = await changeUserPassword(currentPassword, newPassword);
      
      if (result.error) {
        setPasswordError(result.error);
      } else {
        setPasswordSuccess(true);
        // Clear form fields on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-grow overflow-y-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <h1 className="text-2xl font-bold">Your Profile</h1>
              <p className="opacity-90">Manage your account information</p>
            </div>

            <div className="p-6">
              {/* Profile Information Section */}
              <section className="mb-10">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
                
                {profileError && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
                    {profileError}
                  </div>
                )}
                
                {profileSuccess && (
                  <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4">
                    Profile updated successfully!
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-gray-700 font-medium mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={currentUser?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Email address cannot be changed
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                  >
                    {profileLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </section>

              {/* Change Password Section - Only show for email/password users */}
              {!isGoogleUser ? (
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
                  
                  {passwordError && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
                      {passwordError}
                    </div>
                  )}
                  
                  {passwordSuccess && (
                    <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4">
                      Password updated successfully!
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-gray-700 font-medium mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmNewPassword" className="block text-gray-700 font-medium mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                    >
                      {passwordLoading ? 'Updating...' : 'Change Password'}
                    </button>
                  </form>
                </section>
              ) : (
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Password Management</h2>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-blue-800 font-medium">Google Account</p>
                        <p className="text-blue-600 mt-1">
                          You signed in with Google. Password management is handled through your Google account.
                        </p>
                        <a 
                          href="https://myaccount.google.com/security" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-3 text-blue-700 hover:text-blue-900 font-medium"
                        >
                          Manage Google Account
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile; 