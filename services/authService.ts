import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "./firebase";
import { User } from "../types";

// Helper to format Firebase user to our App User type
const formatUser = (fbUser: any): User => ({
  id: fbUser.uid,
  name: fbUser.displayName || 'Friend',
  email: fbUser.email || '',
  joinedAt: fbUser.metadata?.creationTime || new Date().toISOString(),
  avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || 'User')}&background=0D9488&color=fff`
});

// MOCK CONSTANTS FOR FALLBACK
const MOCK_STORAGE_KEY = 'mindguard_mock_user';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    if (!auth) {
      // MOCK FALLBACK
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockUser: User = {
        id: 'mock-user-123',
        name: email.split('@')[0],
        email: email,
        joinedAt: new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=0D9488&color=fff`
      };
      
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
      // Trigger a manual reload of the page or just return (App.tsx handles state via onAuthStateChanged usually, but for mock we might need to rely on the return value or manual reload if subscription doesn't fire)
      return mockUser;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return formatUser(userCredential.user);
  },

  async register(name: string, email: string, password: string): Promise<User> {
    if (!auth) {
      // MOCK FALLBACK
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockUser: User = {
        id: 'mock-user-' + Date.now(),
        name: name,
        email: email,
        joinedAt: new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`
      };
      
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
      return mockUser;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    return {
      ...formatUser(userCredential.user),
      name: name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`
    };
  },

  async logout(): Promise<void> {
    if (!auth) {
      localStorage.removeItem(MOCK_STORAGE_KEY);
      return;
    }
    await firebaseSignOut(auth);
  },

  // Listen for auth state changes (keep user logged in on refresh)
  subscribeToAuth(callback: (user: User | null) => void) {
    if (!auth) {
      // MOCK FALLBACK: Check local storage once on mount
      const stored = localStorage.getItem(MOCK_STORAGE_KEY);
      if (stored) {
        callback(JSON.parse(stored));
      } else {
        callback(null);
      }
      // Return dummy unsubscribe
      return () => {};
    }

    return onAuthStateChanged(auth, (user) => {
      callback(user ? formatUser(user) : null);
    });
  }
};