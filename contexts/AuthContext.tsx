import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { UserProfile, ADMIN_EMAIL } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
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
             // Create user doc if not exists (First login via Google usually)
             // For email signup, we handle this in signupWithEmail to ensure name is set immediately
             await setDoc(userRef, {
               uid: user.uid,
               email: user.email,
               displayName: user.displayName || 'Friend',
               photoURL: user.photoURL,
               role: 'reader',
               createdAt: Date.now()
             });
          }
        } catch (error) {
          console.error("Error fetching/creating user profile in Firestore:", error);
        }

        // Hardcode Admin override for safety
        if (user.email === ADMIN_EMAIL) {
          role = 'admin';
        }

        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Friend',
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

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email Login failed:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      // Update Auth Profile
      await updateProfile(res.user, {
        displayName: name,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      });

      // Create Firestore Document immediately to avoid race conditions with onAuthStateChanged
      await setDoc(doc(db, "users", res.user.uid), {
         uid: res.user.uid,
         email: email,
         displayName: name,
         photoURL: res.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
         role: 'reader',
         createdAt: Date.now()
      });

    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
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
    <AuthContext.Provider value={{ currentUser, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};