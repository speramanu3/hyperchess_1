import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GameRoom } from './components/GameRoom';
import { HomePage } from './components/HomePage';
import { useGameState } from './hooks/useGameState';
import { useSocket } from './hooks/useSocket';
import { Box, Button, Typography, TextField } from '@mui/material';
import { GameState } from './types/game';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60efff',
    },
    secondary: {
      main: '#7dff90',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const initialGameState: GameState = {
  gameId: '',
  position: '',
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

function App() {
  const wsState = useSocket();
  const { gameState, makeMove, error: gameError } = useGameState(wsState);
  const [gameId, setGameId] = useState<string>('');

  const handleCreateGame = () => {
    if (!wsState) {
      wsState.setError('Unable to connect to server');
      return;
    }
    wsState.emit('createGame');
  };

  const handleJoinGame = (gameId: string) => {
    if (!wsState) {
      wsState.setError('Unable to connect to server');
      return;
    }
    wsState.emit('joinGame', gameId);
  };

  const handleLeaveGame = () => {
    if (wsState && gameState.gameId) {
      wsState.emit('leaveGame', { gameId: gameState.gameId });
    }
  };

  const isWhitePlayer = wsState?.id === gameState.players.white;
  const isBlackPlayer = wsState?.id === gameState.players.black;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {wsState.error || gameError ? (
        <div style={{ color: 'red', textAlign: 'center', padding: '1rem' }}>
          {wsState.error || gameError}
        </div>
      ) : null}
      {gameState ? (
        <GameRoom 
          gameState={gameState}
          onMove={(from, to) => makeMove(from, to)}
          gameId={gameId}
          isConnected={wsState.isConnected}
          error={wsState.error || gameError}
          isWhitePlayer={isWhitePlayer}
          isBlackPlayer={isBlackPlayer}
          onLeaveGame={handleLeaveGame}
        />
      ) : (
        <HomePage onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />
      )}
    </ThemeProvider>
  );
}

export default App;
