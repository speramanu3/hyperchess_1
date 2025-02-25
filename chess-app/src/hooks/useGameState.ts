import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

export interface GameState {
  gameId: string;
  position: string;
  status: 'waiting' | 'active' | 'completed';
  turn: 'w' | 'b';
  players: {
    white: string | null;
    black: string | null;
  };
  moveHistory: string[];
  captures: {
    white: string[];
    black: string[];
  };
}

export type MakeMove = (from: string, to: string) => void;

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  gameState: GameState | null;
  joinGame: (gameId: string) => void;
  makeMove: (gameId: string, move: string) => void;
}

const initialState: GameState = {
  gameId: '',
  position: new Chess().fen(),
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

  const makeMove: MakeMove = (from: string, to: string) => {
    if (!gameState) {
      setError('No active game');
      return;
    }
    wsState.makeMove(gameState.gameId, `${from}:${to}`);
  };

  return {
    gameState: gameState || initialState,
    makeMove,
    error: error || wsState.error
  };
};
