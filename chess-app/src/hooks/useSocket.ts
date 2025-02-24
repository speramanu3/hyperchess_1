import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:3001';

export const useSocket = (): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log('Initializing socket connection to:', SOCKET_SERVER_URL);
    
    // Create socket instance with optimized config
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['polling', 'websocket'], // Allow both transports from start
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
      query: {
        timestamp: Date.now().toString()
      }
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected successfully:', {
        id: newSocket.id,
        transport: newSocket.io.engine.transport.name,
        timestamp: new Date().toISOString()
      });
    });

    newSocket.io.engine.on('upgrade', (transport) => {
      console.log('Transport upgraded:', {
        from: newSocket.io.engine.transport.name,
        to: transport.name,
        timestamp: new Date().toISOString()
      });
    });

    newSocket.io.engine.on('packet', (packet) => {
      if (packet.type === 'ping') {
        console.debug('Heartbeat received:', {
          transport: newSocket.io.engine.transport.name,
          timestamp: new Date().toISOString()
        });
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', {
        message: error.message,
        transport: newSocket.io.engine.transport?.name,
        timestamp: new Date().toISOString()
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', {
        reason,
        wasConnected: newSocket.connected,
        transport: newSocket.io.engine.transport?.name,
        timestamp: new Date().toISOString()
      });
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', {
        error,
        transport: newSocket.io.engine.transport?.name,
        timestamp: new Date().toISOString()
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  return socket;
};
