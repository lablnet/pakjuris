import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserStore } from '../stores/userStore';
import { api } from '../services/api';

interface AuthContextType {
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ loading: true });

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const { setUser } = useUserStore();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Fetch the current user from the API
        const response = await api.profile.me();
        if (response && response.user) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        // If request fails, user is not authenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [setUser]);

  const value = {
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 