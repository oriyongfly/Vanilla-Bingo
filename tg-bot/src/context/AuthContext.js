import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if running inside Telegram
  const isTelegramWebApp = () => {
    return typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  };

  // Get initData from Telegram
  const getTelegramInitData = useCallback(() => {
    if (!isTelegramWebApp()) {
      return null;
    }
    return window.Telegram.WebApp.initData;
  }, []);

  // Authenticate user
  const authenticate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const twa = isTelegramWebApp();

      if (!twa) {
        setError('Not running inside Telegram or initData not available');
        setLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Wait a tick for Telegram to populate initDataUnsafe
      await new Promise((resolve) => setTimeout(resolve, 100));

      const webApp = window.Telegram.WebApp;
      const initDataUnsafe = webApp.initDataUnsafe || {};
      const telegramUser = initDataUnsafe.user;

      if (!telegramUser) {
        setError('Could not retrieve user from Telegram');
        setLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL;

      if (apiUrl) {
        // Backend available — verify server-side
        const response = await axios.post(
          `${apiUrl}/api/auth/verify`,
          { initData: webApp.initData },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          setError(null);
          localStorage.setItem('telegramUser', JSON.stringify(response.data.user));
        } else {
          setError(response.data.message || 'Authentication failed');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        // No backend configured — trust Telegram's initDataUnsafe directly
        setUser(telegramUser);
        setIsAuthenticated(true);
        setError(null);
        localStorage.setItem('telegramUser', JSON.stringify(telegramUser));
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.response?.data?.message || 'Failed to authenticate. Please try again.');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [getTelegramInitData]);

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('telegramUser');
    
    // Close the Telegram WebApp if running in Telegram
    if (isTelegramWebApp()) {
      window.Telegram.WebApp.close();
    }
  };

  // Check for stored user on mount
  useEffect(() => {
    const checkStoredUser = async () => {
      const storedUser = localStorage.getItem('telegramUser');
      
      if (storedUser && isTelegramWebApp()) {
        // If we have a stored user, attempt to re-authenticate
        try {
          const initData = getTelegramInitData();
          if (initData) {
            await authenticate();
          } else {
            // No initData available, use stored user but mark as not authenticated
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(false);
            setLoading(false);
          }
        } catch (error) {
          console.error('Failed to re-authenticate:', error);
          setLoading(false);
        }
      } else {
        // No stored user, try to authenticate
        if (isTelegramWebApp()) {
          await authenticate();
        } else {
          setLoading(false);
        }
      }
    };

    checkStoredUser();
  }, [authenticate, getTelegramInitData]);

  // Update Telegram WebApp settings when authenticated
  useEffect(() => {
    if (isAuthenticated && isTelegramWebApp()) {
      // Expand the WebApp if needed
      window.Telegram.WebApp.expand();
      
      // You can set the main button text
      // window.Telegram.WebApp.MainButton.setText('Logout');
      // window.Telegram.WebApp.MainButton.show();
    }
  }, [isAuthenticated]);

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    authenticate,
    logout,
    isTelegramWebApp: isTelegramWebApp(),
    initData: getTelegramInitData(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};