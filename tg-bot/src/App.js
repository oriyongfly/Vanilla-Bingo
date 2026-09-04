import React from 'react';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user, loading, error, isAuthenticated } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--tg-theme-bg-color)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--tg-theme-button-color)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[var(--tg-theme-text-color)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--tg-theme-bg-color)] p-4">
        <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-4xl mb-3">❌</div>
            <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-2">
              Authentication Error
            </h2>
            <p className="text-[var(--tg-theme-hint-color)]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated state - show main app content
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-lg p-6">
            <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)]">
              Welcome, {user.first_name}!
            </h1>
            <p className="text-[var(--tg-theme-hint-color)] mt-2">
              You are successfully authenticated.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--tg-theme-bg-color)] p-4">
      <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-lg p-6 max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-[var(--tg-theme-text-color)] mb-3">
          Not Authenticated
        </h2>
        <p className="text-[var(--tg-theme-hint-color)]">
          Please open this app in Telegram.
        </p>
      </div>
    </div>
  );
}

export default App;