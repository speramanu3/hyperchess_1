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
  const socket = useSocket();
  const { gameState, makeMove } = useGameState(socket);
  const [showGame, setShowGame] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateGame = () => {
    if (!socket) {
      setError('Unable to connect to server');
      return;
    }
    socket.emit('createGame');
    setShowGame(true);
  };

  const handleJoinGame = (gameId: string) => {
    if (!socket) {
      setError('Unable to connect to server');
      return;
    }
    socket.emit('joinGame', gameId);
    setShowGame(true);
  };

  const handleLeaveGame = () => {
    if (socket && gameState.gameId) {
      socket.emit('leaveGame', { gameId: gameState.gameId });
    }
    setShowGame(false);
  };

  const isWhitePlayer = socket?.id === gameState.players.white;
  const isBlackPlayer = socket?.id === gameState.players.black;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {error && (
        <div style={{ color: 'red', textAlign: 'center', padding: '1rem' }}>
          {error}
        </div>
      )}
      {showGame ? (
        <GameRoom 
          gameState={gameState}
          onMove={(from, to) => makeMove(from, to)}
          isWhitePlayer={isWhitePlayer}
          isBlackPlayer={isBlackPlayer}
          socket={socket}
          onLeaveGame={handleLeaveGame}
        />
      ) : (
        <HomePage onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />
      )}
    </ThemeProvider>
  );
}

export default App;
