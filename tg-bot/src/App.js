import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingScreen from './components/ui/LoadingScreen';
import Header from './components/ui/Header';
import BottomNav from './components/ui/BottomNav';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import Stake from './games/bingo/Stake';
import Pick from './games/bingo/Pick';
import Game from './games/bingo/Game';
import './App.css';

// Shared layout — Header at top, BottomNav fixed at bottom, Outlet in between.
// All authenticated routes use this layout.
function AppLayout() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0d1019] text-white">
      <Header />
      <div className="flex-1 pb-16">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

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

  // Authenticated state - show routes with user data via context
  if (isAuthenticated && user) {
    return (
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/bingo/stake" element={<Stake />} />
          <Route path="/bingo/pick" element={<Pick />} />
          <Route path="/bingo/game" element={<Game />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
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