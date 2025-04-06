import { create } from 'zustand';
import { auth } from '../utils/firebase';

interface AuthState {
  token: string | null;
  clientId: string;
  
  // Actions
  getToken: () => Promise<string | null>;
  clearToken: () => void;
}

// Generate a unique client ID
const generateClientId = () => `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useAuthStore = create<AuthState>((set: any, get: any) => ({
  token: null,
  clientId: generateClientId(),
  
  getToken: async () => {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      set({ token: null });
      return null;
    }
    
    try {
      // Get fresh token from Firebase - store only raw token
      const rawToken = await user.getIdToken(true);
      
      // Update store state
      set({ token: rawToken });
      return rawToken;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      set({ token: null });
      return null;
    }
  },
  
  clearToken: () => {
    set({ token: null });
  }
}));
