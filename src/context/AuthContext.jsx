import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const USER_STORAGE_KEY = 'cryptobet_cached_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Process redirect result if browser returned from a redirect flow
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Processed Google redirect sign-in for:', result.user.email);
        }
      })
      .catch((error) => {
        console.warn('getRedirectResult notice:', error?.message || error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userData = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Player',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
          balance: 1.00000000,
          createdAt: new Date().toISOString()
        };

        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, userData);
          } else {
            const data = userSnap.data();
            userData = { 
              ...userData, 
              ...data,
              balance: typeof data.balance === 'number' ? data.balance : (parseFloat(data.balance) || 1.00000000)
            };
          }
        } catch (dbError) {
          console.warn('Firestore database access notice (offline or rules fallback):', dbError?.message || dbError);
          // Keep default balance so app is fully operational
          userData.balance = userData.balance || 1.00000000;
        }

        setUser(userData);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } catch {}
      } else {
        setUser(null);
        try {
          localStorage.removeItem(USER_STORAGE_KEY);
        } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (popupError) {
      console.warn('signInWithPopup error:', popupError);
      // If popup was blocked by browser, try redirect fallback
      if (popupError.code === 'auth/popup-blocked') {
        console.log('Popup was blocked by browser. Attempting redirect sign-in...');
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupError;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch {}
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
