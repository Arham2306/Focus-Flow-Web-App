import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, googleProvider, db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { WorkspaceRole } from './types';
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

const createDefaultWorkspace = async (user: User, displayName: string | null) => {
  try {
    const newWorkspaceRef = doc(collection(db, 'workspaces'));
    const ownerMember = {
      uid: user.uid,
      role: WorkspaceRole.OWNER,
      email: user.email || '',
      displayName: displayName || 'Unknown User',
      photoURL: user.photoURL || null
    };

    const newWorkspaceName = displayName ? `${displayName.split(' ')[0]}'s Workspace` : 'My Workspace';

    const newWorkspace = {
      name: newWorkspaceName,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      members: {
        [user.uid]: ownerMember
      },
      memberIds: [user.uid]
    };
    await setDoc(newWorkspaceRef, newWorkspace);
  } catch (e) {
    console.error("Failed to create default workspace", e);
  }
};

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
      const result = await signInWithPopup(auth, googleProvider);

      // Save or update user in Firestore
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          });

          await createDefaultWorkspace(result.user, result.user.displayName);
        } else {
          await setDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            displayName: result.user.displayName,
            photoURL: result.user.photoURL
          }, { merge: true });
        }
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });

      // Create user record in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName,
        photoURL: null,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      await createDefaultWorkspace(userCredential.user, displayName);

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
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Update last login
      if (result.user) {
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLoginAt: serverTimestamp()
        }, { merge: true });
      }
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

      // Update in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName,
        photoURL
      }, { merge: true });

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
