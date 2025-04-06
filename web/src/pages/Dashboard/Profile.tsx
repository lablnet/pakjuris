import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../../layouts/MainLayout';
import { useUserStore } from '../../stores/userStore';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/ToastComp';

const Profile = () => {
  const { user } = useUserStore();
  const toast = useToast();
  
  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    
    try {
      await api.auth.update({
        first_name: firstName,
        last_name: lastName
      });
      
      toast({
        type: 'success',
        message: "Profile updated successfully!"
      });
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || 'Failed to update profile'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      toast({
        type: 'error',
        message: 'New passwords do not match'
      });
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      toast({
        type: 'error',
        message: 'Password must be at least 6 characters'
      });
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      await api.profile.updatePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
      toast({
        type: 'success',
        message: "Password updated successfully!"
      });
      
      // Clear form fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || 'Failed to update password'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="px-4 py-8 text-center">
          <p>Please log in to view your profile.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 py-8">
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

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-gray-700 font-medium mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-gray-700 font-medium mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user?.email || ''}
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

              {/* Change Password Section */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>

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
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile; 