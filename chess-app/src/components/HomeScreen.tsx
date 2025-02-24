import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper, Divider, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';

interface HomePageProps {
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
}

interface HomeScreenProps {
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
  error: string | null;
}

const HomeContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  gap: '2rem',
  padding: '2rem'
});

const ActionCard = styled(Paper)({
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  backgroundColor: '#2c2c2c',
  width: '100%',
  maxWidth: '400px'
});

export const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateGame, onJoinGame, error }) => {
  const [gameId, setGameId] = useState('');

  const handleJoinGame = () => {
    if (gameId.trim()) {
      onJoinGame(gameId.trim());
    }
  };

  return (
    <HomeContainer>
      <Typography variant="h4" sx={{ color: '#86c1b9' }}>
        Chess Game
      </Typography>

      <ActionCard>
        <Button
          variant="contained"
          onClick={onCreateGame}
          sx={{
            backgroundColor: '#86c1b9',
            color: '#1a1a1a',
            '&:hover': {
              backgroundColor: '#69958f'
            }
          }}
        >
          Create New Game
        </Button>

        <Typography variant="h6" align="center" sx={{ color: '#86c1b9' }}>
          - OR -
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TextField
            label="Game ID"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            variant="outlined"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#86c1b9',
                },
                '&:hover fieldset': {
                  borderColor: '#86c1b9',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#86c1b9',
              }
            }}
          />
          <Button
            variant="outlined"
            onClick={handleJoinGame}
            disabled={!gameId.trim()}
            sx={{
              color: '#86c1b9',
              borderColor: '#86c1b9',
              '&:hover': {
                borderColor: '#86c1b9',
                backgroundColor: 'rgba(134, 193, 185, 0.1)'
              }
            }}
          >
            Join Game
          </Button>
        </Box>
      </ActionCard>

      {error && (
        <Typography color="error" align="center">
          {error}
        </Typography>
      )}
    </HomeContainer>
  );
};

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
