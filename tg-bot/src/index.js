import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import LoadingScreen from './components/ui/LoadingScreen';

// Initialize app wrapper component
const AppInitializer = () => {
  const [initialized, setInitialized] = useState(false);
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { connectSocket } = useSocket();

  useEffect(() => {
    const initializeApp = async () => {
      // Step 1: Auth (login/resume) - handled by AuthProvider
      if (authLoading) {
        return; // Wait for auth to complete
      }

      if (!isAuthenticated || !user) {
        setInitialized(true); // Show app with login state
        return;
      }

      // Step 2: connectSocket() - explicit connection after login
      try {
        await connectSocket();
      } catch (error) {
        console.error('Failed to connect socket:', error);
        // Continue anyway - app can work without socket
      }

      // Step 3: registerSocketListeners() - will be handled by components
      // after socket is connected

      // Step 4: Render app
      setInitialized(true);
    };

    initializeApp();
  }, [authLoading, isAuthenticated, user, connectSocket]);

  // Show loading screen until all 4 steps complete
  if (authLoading || !initialized) {
    return <LoadingScreen />;
  }

  return <App />;
};

// Main render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppInitializer />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);