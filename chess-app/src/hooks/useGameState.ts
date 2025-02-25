import { useState, useEffect } from 'react';
import { GameState, WebSocketState } from '../types/game';

const initialState: GameState = {
  gameId: '',
  position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  status: 'waiting',
  turn: 'w',
  players: {
    white: null,
    black: null
  },
  moveHistory: [],
  captures: {
    white: [],
    black: []
  }
};

export const useGameState = (wsState: WebSocketState) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wsState.gameState) {
      setGameState(wsState.gameState);
    }
  }, [wsState.gameState]);

  const makeMove = (from: string, to: string) => {
    if (!gameState) {
      setError('No active game');
      return;
    }
    wsState.makeMove(gameState.gameId, `${from}:${to}`);
  };

  return {
    gameState: wsState.gameState,
    makeMove,
    error: error || wsState.error
  };
};
