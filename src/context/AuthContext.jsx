import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
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
            // Initialize new user with default balance
            await setDoc(userRef, {
              ...userData,
              balance: 1.00000000,
              createdAt: new Date().toISOString()
            });
          }
        } catch (dbError) {
          console.error("Firestore Error (Is your Firestore Database enabled?):", dbError);
        }
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Check for redirect result when the page loads after Google Auth
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        // Successful login via redirect!
        console.log("Logged in via redirect successfully!");
      }
    }).catch((error) => {
      console.error("Redirect login error:", error);
      alert("Login Error: " + error.message);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Use redirect instead of popup to completely bypass COOP and mobile popup blockers
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
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
