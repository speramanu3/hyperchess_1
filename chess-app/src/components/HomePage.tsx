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
            variant="h1"
            component="h1"
            gutterBottom
            sx={{
              mb: 4,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #60EFFF 30%, #00FF87 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 8px rgba(96, 239, 255, 0.3)',
              filter: 'drop-shadow(0 2px 8px rgba(96, 239, 255, 0.3))',
              fontSize: '4.5rem',
              letterSpacing: '0.05em',
              textTransform: 'lowercase'
            }}
          >
            hyperchess
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
              textTransform: 'none'
            }}
          >
            create new game
          </Button>

          <Box sx={{ position: 'relative', py: 2 }}>
            <Divider>
              <Typography 
                variant="body1" 
                sx={{ 
                  px: 2, 
                  color: 'text.secondary',
                  fontWeight: 'medium',
                  textTransform: 'lowercase'
                }}
              >
                or
              </Typography>
            </Divider>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                textAlign: 'center',
                textTransform: 'lowercase',
                fontWeight: 'normal'
              }}
            >
              join existing game
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              placeholder="enter game id"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              error={!!error}
              helperText={error}
              sx={{ 
                '& input': { 
                  textTransform: 'lowercase'
                }
              }}
            />

            <Button
              variant="outlined"
              color="primary"
              size="large"
              fullWidth
              onClick={handleJoinGame}
              disabled={!gameId.trim()}
              sx={{
                height: 56,
                fontSize: '1.2rem',
                textTransform: 'none'
              }}
            >
              join game
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
