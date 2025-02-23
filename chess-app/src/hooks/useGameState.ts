import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Chess } from 'chess.js';

interface GameState {
  gameId: string;
  position: string;
  status: 'waiting' | 'active' | 'completed';
  players: {
    white: string | null;
    black: string | null;
  };
}

const initialGameState: GameState = {
  gameId: '',
  position: new Chess().fen(),
  status: 'waiting',
  players: {
    white: null,
    black: null
  }
};

export const useGameState = (socket: Socket | null) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  useEffect(() => {
    if (!socket) return;

    const handleGameCreated = (game: GameState) => {
      console.log('Game created:', game);
      setGameState(game);
    };

    const handleGameJoined = (game: GameState) => {
      console.log('Game joined:', game);
      setGameState(game);
    };

    const handleMoveMade = ({ from, to, position }: { from: string; to: string; position: string }) => {
      console.log('Move made:', { from, to, position });
      setGameState(prev => ({
        ...prev,
        position
      }));
    };

    const handleError = (error: any) => {
      console.error('Socket error:', error);
    };

    const handlePlayerDisconnected = () => {
      console.log('Player disconnected');
      setGameState(prev => ({
        ...prev,
        status: 'waiting'
      }));
    };

    const handleGameOver = (winner: string) => {
      console.log('Game over, winner:', winner);
      setGameState(prev => ({
        ...prev,
        status: 'completed'
      }));
    };

    const handleRematchAccepted = (newGameState: GameState) => {
      console.log('Rematch accepted:', newGameState);
      setGameState(newGameState);
    };

    const handleGameReset = () => {
      console.log('Game reset');
      setGameState(initialGameState);
    };

    socket.on('gameCreated', handleGameCreated);
    socket.on('gameJoined', handleGameJoined);
    socket.on('moveMade', handleMoveMade);
    socket.on('error', handleError);
    socket.on('playerDisconnected', handlePlayerDisconnected);
    socket.on('gameOver', handleGameOver);
    socket.on('rematchAccepted', handleRematchAccepted);
    socket.on('gameReset', handleGameReset);

    return () => {
      socket.off('gameCreated', handleGameCreated);
      socket.off('gameJoined', handleGameJoined);
      socket.off('moveMade', handleMoveMade);
      socket.off('error', handleError);
      socket.off('playerDisconnected', handlePlayerDisconnected);
      socket.off('gameOver', handleGameOver);
      socket.off('rematchAccepted', handleRematchAccepted);
      socket.off('gameReset', handleGameReset);
    };
  }, [socket]);

  const makeMove = (move: { from: string; to: string }) => {
    if (!socket || !gameState.gameId) return;
    
    socket.emit('makeMove', {
      ...move,
      gameId: gameState.gameId
    });
  };

  return { gameState, makeMove };
};
