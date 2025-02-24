import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Chess } from 'chess.js';
import { GameState, GameMove } from '../types/game';

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

export const useGameState = (socket: Socket | null) => {
  const [gameState, setGameState] = useState<GameState>(initialState);

  useEffect(() => {
    if (!socket) return;

    const handleGameCreated = (game: GameState) => {
      setGameState(game);
    };

    const handleGameJoined = (game: GameState) => {
      setGameState(game);
    };

    const handleGameState = (game: GameState) => {
      setGameState(game);
    };

    const handleMoveMade = (data: { 
      from: string; 
      to: string; 
      position: string;
      turn: 'w' | 'b';
      moveHistory?: string[];
      captures?: {
        white: string[];
        black: string[];
      };
    }) => {
      setGameState(prev => ({
        ...prev,
        position: data.position,
        turn: data.turn,
        moveHistory: data.moveHistory || prev.moveHistory,
        captures: data.captures || prev.captures
      }));
    };

    socket.on('gameCreated', handleGameCreated);
    socket.on('gameJoined', handleGameJoined);
    socket.on('gameState', handleGameState);
    socket.on('moveMade', handleMoveMade);

    return () => {
      socket.off('gameCreated', handleGameCreated);
      socket.off('gameJoined', handleGameJoined);
      socket.off('gameState', handleGameState);
      socket.off('moveMade', handleMoveMade);
    };
  }, [socket]);

  const makeMove = (move: GameMove) => {
    if (!socket || !gameState.gameId) return;
    socket.emit('makeMove', { 
      gameId: gameState.gameId, 
      ...move
    });
  };

  return { gameState, makeMove };
};
