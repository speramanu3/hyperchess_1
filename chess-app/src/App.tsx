import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { GameRoom } from './components/GameRoom';
import { HomePage } from './components/HomePage';
import { darkTheme } from './theme';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';

function App() {
  const wsState = useSocket();
  const { gameState, makeMove, error: gameError } = useGameState(wsState);
  const [gameId, setGameId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateGame = () => {
    if (!wsState.isConnected) {
      setError('Unable to connect to server');
      return;
    }
    wsState.makeMove('', 'create');
  };

  const handleJoinGame = (id: string) => {
    if (!wsState.isConnected) {
      setError('Unable to connect to server');
      return;
    }
    setGameId(id);
    wsState.joinGame(id);
  };

  const handleLeaveGame = () => {
    if (gameState?.gameId) {
      wsState.leaveGame(gameState.gameId);
    }
  };

  const isWhitePlayer = wsState?.id === gameState?.players?.white;
  const isBlackPlayer = wsState?.id === gameState?.players?.black;

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="App">
        {(error || wsState.error || gameError) && (
          <div style={{ color: 'red', textAlign: 'center', padding: '1rem' }}>
            {error || wsState.error || gameError}
          </div>
        )}
        
        {gameState ? (
          <GameRoom
            gameState={gameState}
            onMove={makeMove}
            gameId={gameId}
            isConnected={wsState.isConnected}
            error={error || wsState.error || gameError}
            isWhitePlayer={isWhitePlayer}
            isBlackPlayer={isBlackPlayer}
            onLeaveGame={handleLeaveGame}
          />
        ) : (
          <HomePage
            onCreateGame={handleCreateGame}
            onJoinGame={handleJoinGame}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
