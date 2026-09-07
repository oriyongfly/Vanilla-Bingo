import React from 'react';
import { useAuth } from './context/AuthContext';
import LoadingScreen from './components/ui/LoadingScreen';
import HomePage from './components/HomePage'; // Import HomePage
import './App.css';

function App() {
  const { user, loading, error, isAuthenticated } = useAuth();

  // Loading state
  if (loading) {
    return <LoadingScreen />;
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

  // Authenticated state - show HomePage with user data
  if (isAuthenticated && user) {
    return <HomePage user={user} />;
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