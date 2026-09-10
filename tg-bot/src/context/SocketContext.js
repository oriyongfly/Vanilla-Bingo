// src/context/SocketContext.js
import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { getToken } from '../utils/TokenStorage';

// Create context
const SocketContext = createContext(null);

// Custom hook to use the socket
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Socket Provider component
export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const disconnectToastShownRef = useRef(false);

  // Connect socket
  const connectSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const serverUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
        
        // If socket already exists and connected, resolve immediately
        if (socketRef.current && socketRef.current.connected) {
          resolve(socketRef.current);
          return;
        }

        // If socket exists but disconnected, reconnect
        if (socketRef.current) {
          socketRef.current.connect();
          resolve(socketRef.current);
          return;
        }

        // Create new socket connection
        const socket = io(serverUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          auth: (cb) => {
            const token = getToken();
            cb({ token });
          }
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
          console.log('Socket connected');
          setIsConnected(true);
          disconnectToastShownRef.current = false;
          resolve(socket);
        });

        // Global error event listener (deduped toasts)
        socket.on('error', (error) => {
          console.error('Socket error:', error);
          // Show toast notification (you can integrate with your toast library)
          // toast.error(error.message || 'Socket connection error');
        });

        // Disconnect handler - only surface server-forced disconnects
        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setIsConnected(false);
          
          // Only show toast for server-forced disconnects
          if (reason === 'io server disconnect' || reason === 'transport error') {
            if (!disconnectToastShownRef.current) {
              disconnectToastShownRef.current = true;
              // toast.warning('Disconnected from server. Reconnecting...');
            }
          }
        });

        // Reconnect event
        socket.on('reconnect', () => {
          console.log('Socket reconnected');
          setIsConnected(true);
          disconnectToastShownRef.current = false;
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
          reject(error);
        });

      } catch (error) {
        console.error('Failed to connect socket:', error);
        reject(error);
      }
    });
  }, []);

  // Get socket instance
  const getSocket = useCallback(() => {
    return socketRef.current;
  }, []);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      disconnectToastShownRef.current = false;
    }
  }, []);

  // Context value
  const value = {
    socket: socketRef.current,
    isConnected,
    connectSocket,
    getSocket,
    disconnectSocket,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext;