import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { UserProfile, ADMIN_EMAIL } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        let role: 'admin' | 'reporter' | 'reader' = 'reader';
        
        try {
          // Check Firestore for user data to get persisted role
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
             const userData = userSnap.data();
             role = userData.role || 'reader';
          } else {
             // Create user doc if not exists (First login)
             // Default role is 'reader'
             await setDoc(userRef, {
               uid: user.uid,
               email: user.email,
               displayName: user.displayName,
               photoURL: user.photoURL,
               role: 'reader',
               createdAt: Date.now()
             });
          }
        } catch (error) {
          console.error("Error fetching/creating user profile in Firestore:", error);
          // If Firestore fails (e.g., permissions), we rely on default 'reader'
          // unless it's the admin email.
        }

        // Hardcode Admin override for safety
        if (user.email === ADMIN_EMAIL) {
          role = 'admin';
        }

        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: role
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};