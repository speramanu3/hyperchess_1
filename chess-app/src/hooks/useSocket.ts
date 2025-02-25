import { useEffect, useRef, useState, useCallback } from 'react';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'ws://localhost:3002';

interface GameState {
  fen: string;
  turn: string;
  gameOver: boolean;
}

interface ServerEvent {
  type: 'gameState' | 'error' | 'ping';
  gameId?: string;
  state?: GameState;
  message?: string;
}

interface GameEvent {
  type: 'join' | 'move' | 'leave' | 'pong';
  gameId?: string;
  move?: string;
}

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(SOCKET_SERVER_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Attempt to reconnect after 1 second
      setTimeout(connect, 1000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    ws.onmessage = (event) => {
      try {
        const serverEvent: ServerEvent = JSON.parse(event.data);
        
        switch (serverEvent.type) {
          case 'gameState':
            if (serverEvent.state) {
              setGameState(serverEvent.state);
            }
            break;
          
          case 'error':
            if (serverEvent.message) {
              setError(serverEvent.message);
            }
            break;
          
          case 'ping':
            const pong: GameEvent = { type: 'pong' };
            ws.send(JSON.stringify(pong));
            break;
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    };
  }, []);

  const sendEvent = useCallback((event: GameEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    } else {
      setError('Not connected');
    }
  }, []);

  const joinGame = useCallback((gameId: string) => {
    sendEvent({ type: 'join', gameId });
  }, [sendEvent]);

  const makeMove = useCallback((gameId: string, move: string) => {
    sendEvent({ type: 'move', gameId, move });
  }, [sendEvent]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    isConnected,
    gameState,
    error,
    joinGame,
    makeMove
  };
};
