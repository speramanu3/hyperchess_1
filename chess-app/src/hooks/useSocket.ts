import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:3001';

export const useSocket = (): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log('Initializing socket connection to:', SOCKET_SERVER_URL);
    
    // Create socket instance with optimized config
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['polling'], // Start with polling only
      upgrade: false, // Don't try to upgrade to WebSocket yet
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
      query: {
        timestamp: Date.now().toString() // Prevent caching issues
      }
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected successfully:', {
        id: newSocket.id,
        transport: newSocket.io.engine.transport.name
      });

      // After stable polling connection, try upgrading to WebSocket
      setTimeout(() => {
        console.log('Attempting transport upgrade...');
        newSocket.io.engine.opts.upgrade = true;
        newSocket.io.engine.opts.transports = ['polling', 'websocket'];
      }, 5000);
    });

    newSocket.io.engine.on('upgrade', (transport) => {
      console.log('Transport upgraded to:', transport);
    });

    newSocket.io.engine.on('packet', (packet) => {
      if (packet.type === 'ping') {
        console.log('Heartbeat: Connection alive');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', {
        message: error.message,
        type: error.type,
        description: error.description
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', {
        reason,
        wasConnected: newSocket.connected,
        attempts: newSocket.io.engine.reconnectionAttempts
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection...');
      newSocket.close();
    };
  }, []);

  return socket;
};
