import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setToken, clearToken } from '../utils/TokenStorage';
import apiClient from '../utils/ApiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isTelegramWebApp = () => {
    return typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  };

  const getTelegramInitData = useCallback(() => {
    if (!isTelegramWebApp()) return null;
    return window.Telegram.WebApp.initData;
  }, []);

  const authenticate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isTelegramWebApp()) {
        setError('Not running inside Telegram or initData not available');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Wait a tick for Telegram to populate initData
      await new Promise((resolve) => setTimeout(resolve, 300));

      const webApp = window.Telegram.WebApp;
      const initData = webApp.initData;

      if (!initData) {
        setError('Could not retrieve initData from Telegram');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const response = await apiClient.post('/api/auth/login', { initData });

      if (response.data.success) {
        const { access_token, user: userData } = response.data;
        setToken(access_token);
        setUser(userData);
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError(response.data.message || 'Authentication failed');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.response?.data?.message || 'Failed to authenticate. Please try again.');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    clearToken();
    if (isTelegramWebApp()) {
      window.Telegram.WebApp.close();
    }
  }, []);

  useEffect(() => {
    if (isTelegramWebApp()) {
      authenticate();
    } else {
      setLoading(false);
    }
  }, [authenticate]);

  useEffect(() => {
    if (isAuthenticated && isTelegramWebApp()) {
      window.Telegram.WebApp.expand();
    }
  }, [isAuthenticated]);

  // Listen for token expiry from ApiClient interceptor
  useEffect(() => {
    const handleAuthExpired = () => logout();
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [logout]);

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
