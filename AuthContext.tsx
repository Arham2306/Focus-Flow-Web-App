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
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL: string) => Promise<void>;
  userMetadata: UserMetadata;
  updateUserMetadata: (metadata: UserMetadata) => void;
  logout: () => Promise<void>;
  needsPassword: boolean;
  linkPassword: (password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
  const [needsPassword, setNeedsPassword] = useState(false);
  const computeNeedsPassword = (user: User | null) =>
    user !== null && !user.providerData.some(p => p.providerId === 'password');

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

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      // Reload the user object to get the latest data from Firebase
      await userCredential.user.reload();
      // Force refresh user state from the actual auth instance to keep methods intact
      setCurrentUser(auth.currentUser);
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
      // Reload the user object to get the latest data from Firebase
      await currentUser.reload();
      // Force refresh user state from the actual auth instance
      setCurrentUser(auth.currentUser);
    } catch (error) {
      console.error("Error updating profile", error);
      throw error;
    }
  };

  // For initial Google Auth password setup
  const linkPassword = async (password: string) => {
    if (!currentUser || !currentUser.email) throw new Error("No authenticated user");

    try {
      const { EmailAuthProvider, linkWithCredential } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await linkWithCredential(currentUser, credential);
      await currentUser.reload();
      setCurrentUser(auth.currentUser);
      setNeedsPassword(false);
    } catch (error) {
      if ((error as { code?: string })?.code === 'auth/provider-already-linked') {
        setNeedsPassword(false);
      }
      console.error("Error linking password", error);
      throw error;
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!currentUser) throw new Error("No user logged in");
    try {
      const { updatePassword } = await import('firebase/auth');
      await updatePassword(currentUser, newPassword);
    } catch (error) {
      console.error("Error changing password", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error resetting password", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setCurrentUser(user);
      setNeedsPassword(computeNeedsPassword(user));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      signInWithGoogle: signInWithGoogleFn,
      signUpWithEmail,
      signInWithEmail: signInWithEmailFn,
      updateUserProfile,
      userMetadata,
      updateUserMetadata,
      logout,
      needsPassword,
      linkPassword,
      changePassword,
      resetPassword
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
