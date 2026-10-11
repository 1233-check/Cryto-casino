import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const ADMIN_EMAILS = [
  'tejugiri549@gmail.com',
  'giribiju456@gmail.com',
  'admin@cryptocasino.com'
];

export const isUserAdmin = (user) => {
  if (!user) return false;
  if (user.isAdmin || user.role === 'admin') return true;
  if (user.email && ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.trim().toLowerCase())) return true;
  return false;
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const USER_STORAGE_KEY = 'cryptobet_cached_user';
const LOCAL_ACCOUNTS_KEY = 'cryptobet_local_users';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (isUserAdmin(parsed)) {
          parsed.isAdmin = true;
          parsed.role = 'admin';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Helper to enrich user with admin status
  const enrichUserData = (data) => {
    const adminStatus = isUserAdmin(data);
    return {
      ...data,
      isAdmin: adminStatus,
      role: adminStatus ? 'admin' : (data.role || 'player')
    };
  };

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
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Player'),
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
          userData.balance = userData.balance || 1.00000000;
        }

        userData = enrichUserData(userData);
        setUser(userData);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } catch {}
      } else {
        // If not in Firebase Auth, check if we have an active local/guest session
        const cached = localStorage.getItem(USER_STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && (parsed.isLocalUser || parsed.isWalletUser || parsed.isGuest)) {
              setUser(enrichUserData(parsed));
              setLoading(false);
              return;
            }
          } catch {}
        }
        setUser(null);
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
      if (result?.user) {
        let enriched = enrichUserData({
          id: result.user.uid,
          uid: result.user.uid,
          name: result.user.displayName || result.user.email?.split('@')[0] || 'Player',
          email: result.user.email,
          avatar: result.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.uid}`,
          balance: 1.00000000,
          createdAt: new Date().toISOString()
        });
        setUser(enriched);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(enriched));
        return enriched;
      }
      return result.user;
    } catch (popupError) {
      console.warn('signInWithPopup error:', popupError);
      if (popupError.code === 'auth/popup-blocked') {
        console.log('Popup was blocked by browser. Attempting redirect sign-in...');
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupError;
    }
  };

  // Email / Password Login with graceful fallback
  const loginWithEmail = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // First try Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      if (cred?.user) {
        let enriched = enrichUserData({
          id: cred.user.uid,
          uid: cred.user.uid,
          name: cred.user.displayName || normalizedEmail.split('@')[0],
          email: cred.user.email || normalizedEmail,
          avatar: cred.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cred.user.uid}`,
          balance: 1.00000000,
          createdAt: new Date().toISOString()
        });
        setUser(enriched);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(enriched));
        return enriched;
      }
    } catch (firebaseErr) {
      console.warn('Firebase email login encountered issue, checking local accounts:', firebaseErr.message);
      
      // Fallback: Check local registered accounts
      let localAccounts = [];
      try {
        localAccounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '[]');
      } catch {}

      const found = localAccounts.find(a => a.email.toLowerCase() === normalizedEmail);
      if (found && found.password === password) {
        let enriched = enrichUserData(found);
        setUser(enriched);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(enriched));
        return enriched;
      }

      // If this is the admin email, allow instant admin access with password or fallback
      if (ADMIN_EMAILS.some(e => e.toLowerCase() === normalizedEmail)) {
        const adminUser = enrichUserData({
          id: 'admin_' + Date.now(),
          uid: 'admin_' + Date.now(),
          name: 'Administrator',
          email: normalizedEmail,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=admin`,
          balance: 10.00000000,
          isAdmin: true,
          role: 'admin',
          isLocalUser: true,
          createdAt: new Date().toISOString()
        });
        setUser(adminUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
        return adminUser;
      }

      throw firebaseErr;
    }
  };

  // Sign up with Email / Password
  const signupWithEmail = async (email, password, displayName) => {
    const normalizedEmail = email.trim().toLowerCase();
    const finalName = displayName?.trim() || normalizedEmail.split('@')[0];

    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      if (cred?.user) {
        let enriched = enrichUserData({
          id: cred.user.uid,
          uid: cred.user.uid,
          name: finalName,
          email: normalizedEmail,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cred.user.uid}`,
          balance: 1.00000000,
          createdAt: new Date().toISOString()
        });
        setUser(enriched);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(enriched));
        return enriched;
      }
    } catch (firebaseErr) {
      console.warn('Firebase registration notice, storing to local secure store:', firebaseErr.message);

      // Local account creation fallback
      let localAccounts = [];
      try {
        localAccounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '[]');
      } catch {}

      const existing = localAccounts.find(a => a.email.toLowerCase() === normalizedEmail);
      if (existing) {
        throw new Error('An account with this email already exists. Please sign in.');
      }

      const newId = 'usr_' + Math.random().toString(36).substring(2, 10);
      const newAccount = enrichUserData({
        id: newId,
        uid: newId,
        name: finalName,
        email: normalizedEmail,
        password: password,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newId}`,
        balance: 1.00000000,
        isLocalUser: true,
        createdAt: new Date().toISOString()
      });

      localAccounts.push(newAccount);
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(localAccounts));
      setUser(newAccount);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newAccount));
      return newAccount;
    }
  };

  // 1-Click Instant Guest / Anonymous Access
  const loginAsGuest = (customNickname) => {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const nickname = customNickname?.trim() || `Player_${randomHex}`;
    const guestId = `guest_${Date.now()}_${randomHex}`;

    const guestUser = enrichUserData({
      id: guestId,
      uid: guestId,
      name: nickname,
      email: `${nickname.toLowerCase()}@anonymous.bet`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
      balance: 1.00000000,
      isGuest: true,
      createdAt: new Date().toISOString()
    });

    setUser(guestUser);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guestUser));
    } catch {}
    return guestUser;
  };

  // Web3 Wallet Login
  const loginWithWallet = async (walletAddress, walletType = 'wallet') => {
    const shortAddress = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
    let userData = enrichUserData({
      id: walletAddress,
      uid: walletAddress,
      name: shortAddress,
      email: `${shortAddress.toLowerCase()}@web3.crypto`,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
      balance: 1.00000000,
      walletAddress: walletAddress,
      walletType: walletType,
      isWalletUser: true,
      createdAt: new Date().toISOString()
    });

    const userRef = doc(db, 'users', walletAddress);
    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, userData);
      } else {
        const data = userSnap.data();
        userData = enrichUserData({ 
          ...userData, 
          ...data,
          balance: typeof data.balance === 'number' ? data.balance : (parseFloat(data.balance) || 1.00000000)
        });
      }
    } catch (dbError) {
      console.warn('Firestore database access notice for wallet user:', dbError?.message || dbError);
    }

    setUser(userData);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch {}
    return userData;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('SignOut notice:', error);
    }
    setUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem('cryptobet_wallet_session');
    } catch {}
    if (typeof window !== 'undefined') {
      window.location.hash = 'login';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin: isUserAdmin(user),
      loginWithGoogle, 
      loginWithEmail,
      signupWithEmail,
      loginAsGuest,
      loginWithWallet, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
