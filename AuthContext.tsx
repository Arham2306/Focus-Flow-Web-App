import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, googleProvider } from './firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User
} from 'firebase/auth';

export interface UserMetadata {
  bio?: string;
  role?: string;
  dailyGoal?: number;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL: string) => Promise<void>;
  userMetadata: UserMetadata;
  updateUserMetadata: (metadata: UserMetadata) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMetadata, setUserMetadata] = useState<UserMetadata>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`focusflow-metadata-${currentUser.uid}`);
      if (saved) {
        try {
          setUserMetadata(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse user metadata", e);
        }
      } else {
        setUserMetadata({});
      }
    }
  }, [currentUser]);

  const updateUserMetadata = (metadata: UserMetadata) => {
    if (!currentUser) return;
    const newMetadata = { ...userMetadata, ...metadata };
    setUserMetadata(newMetadata);
    localStorage.setItem(`focusflow-metadata-${currentUser.uid}`, JSON.stringify(newMetadata));
  };

  const signInWithGoogleFn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const signInWithEmailFn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const updateUserProfile = async (displayName: string, photoURL: string) => {
    if (!currentUser) throw new Error("No user logged in");
    try {
      await updateProfile(currentUser, { displayName, photoURL });
      // Force refresh user state
      const updatedUser = { ...currentUser, displayName, photoURL };
      setCurrentUser(updatedUser as User);
    } catch (error) {
      console.error("Error updating profile", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle: signInWithGoogleFn, signUpWithEmail, signInWithEmail: signInWithEmailFn, updateUserProfile, userMetadata, updateUserMetadata, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
