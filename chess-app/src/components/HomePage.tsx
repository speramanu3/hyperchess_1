import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper, Divider, Stack } from '@mui/material';

interface HomePageProps {
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onCreateGame, onJoinGame }) => {
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');

  const handleJoinGame = () => {
    if (!gameId.trim()) {
      setError('Please enter a game ID');
      return;
    }
    setError('');
    onJoinGame(gameId.trim());
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          pb: 4,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              mb: 4,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #60efff 30%, #7dff90 90%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 8px rgba(96, 239, 255, 0.3))',
            }}
          >
            HyperChess
          </Typography>
        </Box>

        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={onCreateGame}
            sx={{
              height: 56,
              fontSize: '1.2rem',
              fontWeight: 'bold',
            }}
          >
            New Game
          </Button>

          <Box sx={{ position: 'relative', py: 2 }}>
            <Divider>
              <Typography 
                variant="body1" 
                sx={{ 
                  px: 2, 
                  color: 'text.secondary',
                  fontWeight: 'medium',
                }}
              >
                OR
              </Typography>
            </Divider>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Game ID"
              variant="outlined"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              error={!!error}
              helperText={error}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 56,
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                },
              }}
            />
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              onClick={handleJoinGame}
              sx={{
                height: 56,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                backgroundColor: '#66bb6a',
                '&:hover': {
                  backgroundColor: '#4caf50',
                },
              }}
            >
              Join Game
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
