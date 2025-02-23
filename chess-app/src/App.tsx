import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GameRoom } from './components/GameRoom';
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

interface HomePageProps {
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onCreateGame, onJoinGame }) => {
  const [joinGameId, setJoinGameId] = useState('');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
      }}
    >
      <Typography 
        variant="h2" 
        component="h1"
        sx={{
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #60efff 30%, #7dff90 90%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 4,
        }}
      >
        Chess Game
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={onCreateGame}
        sx={{ 
          minWidth: '200px',
          fontSize: '1.2rem',
          py: 1.5,
        }}
      >
        Create New Game
      </Button>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          mt: 2,
        }}
      >
        <Typography variant="h6">
          Or Join Existing Game
        </Typography>
        
        <TextField
          variant="outlined"
          placeholder="Enter Game ID"
          value={joinGameId}
          onChange={(e) => setJoinGameId(e.target.value)}
          sx={{ minWidth: '300px' }}
        />
        
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => joinGameId && onJoinGame(joinGameId)}
          disabled={!joinGameId}
          sx={{ 
            minWidth: '200px',
            fontSize: '1.1rem',
            py: 1,
          }}
        >
          Join Game
        </Button>
      </Box>
    </Box>
  );
};

const initialGameState: GameState = {
  gameId: '',
  position: '',
  status: 'waiting',
  players: {
    white: null,
    black: null
  }
};

function App() {
  const socket = useSocket();
  const { gameState, makeMove } = useGameState(socket);
  const isWhitePlayer = gameState.players?.white === socket?.id;
  const isBlackPlayer = gameState.players?.black === socket?.id;
  const isInGame = gameState.status === 'active' || (gameState.status === 'waiting' && gameState.gameId);

  const handleCreateGame = () => {
    if (socket) {
      socket.emit('createGame');
    }
  };

  const handleJoinGame = (gameId: string) => {
    if (socket) {
      socket.emit('joinGame', gameId);
    }
  };

  const handleLeaveGame = () => {
    if (socket && gameState.gameId) {
      socket.emit('leaveGame', { gameId: gameState.gameId });
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {!isInGame ? (
        <HomePage onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />
      ) : (
        <GameRoom 
          gameState={gameState}
          onMove={makeMove}
          isWhitePlayer={isWhitePlayer}
          isBlackPlayer={isBlackPlayer}
          socket={socket}
          onLeaveGame={handleLeaveGame}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
