import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithRedirect, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Player',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
        };
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            userData.balance = 1.00000000;
            userData.createdAt = new Date().toISOString();
            await setDoc(userRef, userData);
          } else {
            userData = { ...userData, ...userSnap.data() };
          }
        } catch (dbError) {
          console.error("Firestore Error (Is your Firestore Database enabled?):", dbError);
          // Provide fallback balance so the app doesn't crash on .toFixed()
          userData.balance = userData.balance || 0.00000000;
        }
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Use redirect (not popup) to completely avoid COOP browser restrictions
    await signInWithRedirect(auth, provider);
    // Page will navigate away to Google. When it comes back,
    // onAuthStateChanged fires automatically and sets the user.
  };

  const logout = async () => {
    try {
      await signOut(auth);
      if (typeof window !== 'undefined') {
        window.location.hash = 'login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
