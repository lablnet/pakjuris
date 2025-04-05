import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwzjPuOq9dDdocee_PWFSHgeA2zAETlyk",
  authDomain: "pakjuris-fa475.firebaseapp.com",
  projectId: "pakjuris-fa475",
  storageBucket: "pakjuris-fa475.firebasestorage.app",
  messagingSenderId: "659104723802",
  appId: "1:659104723802:web:865dce745afc8a0935b963",
  measurementId: "G-L04VGV52N3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Register a new user with email and password
export const registerWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

// Sign in with email and password
export const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Sign out
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (displayName: string) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user logged in');
    }
    
    await updateProfile(auth.currentUser, { displayName });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Reauthenticate user (required before sensitive operations like password change)
export const reauthenticateUser = async (currentPassword: string) => {
  try {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user logged in or no email provided');
    }
    
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    
    await reauthenticateWithCredential(auth.currentUser, credential);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Change user password
export const changeUserPassword = async (currentPassword: string, newPassword: string) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user logged in');
    }
    
    // First reauthenticate
    const reauth = await reauthenticateUser(currentPassword);
    if (!reauth.success) {
      throw new Error(reauth.error || 'Failed to authenticate. Check your current password.');
    }
    
    // Then update password
    await updatePassword(auth.currentUser, newPassword);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Auth state observer
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth }; 