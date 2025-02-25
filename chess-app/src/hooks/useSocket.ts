import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, WebSocketState } from '../types/game';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'ws://localhost:3002';
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

interface ServerEvent {
  type: 'gameState' | 'error' | 'ping' | 'connected';
  gameId?: string;
  state?: GameState;
  message?: string;
  clientId?: string;
}

interface GameEvent {
  type: 'join' | 'move' | 'leave' | 'pong';
  gameId?: string;
  move?: string;
}

export const useSocket = (): WebSocketState => {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${SOCKET_SERVER_URL}/socket.io/?EIO=4&transport=websocket`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0;
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setId(null);

        // Retry connection if not at max retries
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          setTimeout(connect, RETRY_DELAY * retryCountRef.current);
        } else {
          setError('Failed to connect after multiple attempts');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };

      ws.onmessage = (event) => {
        try {
          // Handle socket.io ping/pong
          if (event.data === '2') {
            ws.send('3');
            return;
          }

          const data: ServerEvent = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              if (data.clientId) {
                setId(data.clientId);
              }
              break;
            case 'gameState':
              if (data.state) {
                setGameState(data.state);
              }
              break;
            case 'error':
              if (data.message) {
                setError(data.message);
              }
              break;
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError('Failed to create WebSocket connection');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendEvent = useCallback((event: GameEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    } else {
      setError('Not connected to server');
    }
  }, []);

  const joinGame = useCallback((gameId: string) => {
    sendEvent({ type: 'join', gameId });
  }, [sendEvent]);

  const makeMove = useCallback((gameId: string, move: string) => {
    sendEvent({ type: 'move', gameId, move });
  }, [sendEvent]);

  const leaveGame = useCallback((gameId: string) => {
    sendEvent({ type: 'leave', gameId });
  }, [sendEvent]);

  return {
    isConnected,
    gameState,
    error,
    id,
    joinGame,
    makeMove,
    leaveGame
  };
};
