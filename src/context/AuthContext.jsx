import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for mock user
    const storedUser = localStorage.getItem('crypto_casino_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = async () => {
    // Simulate OAuth popup delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser = {
          id: 'google-uid-12345',
          name: 'Player One',
          email: 'player@example.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player',
        };
        setUser(mockUser);
        localStorage.setItem('crypto_casino_user', JSON.stringify(mockUser));
        resolve(mockUser);
      }, 1500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crypto_casino_user');
    if (typeof window !== 'undefined') {
      window.location.hash = 'login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
