import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { GameRoom } from './components/GameRoom';
import { HomePage as Home } from './components/HomePage';
import { darkTheme } from './theme';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';

function App() {
  const wsState = useSocket();
  const { gameState, makeMove, error: gameError } = useGameState(wsState);
  const [gameId, setGameId] = useState<string>('');

  const handleCreateGame = () => {
    if (!wsState) {
      wsState?.setError('Unable to connect to server');
      return;
    }
    wsState.emit('createGame');
  };

  const handleJoinGame = (id: string) => {
    if (!wsState) {
      wsState?.setError('Unable to connect to server');
      return;
    }
    setGameId(id);
    wsState.emit('joinGame', id);
  };

  const handleLeaveGame = () => {
    if (wsState && gameState?.gameId) {
      wsState.emit('leaveGame', { gameId: gameState.gameId });
    }
  };

  const isWhitePlayer = wsState?.id === gameState?.players.white;
  const isBlackPlayer = wsState?.id === gameState?.players.black;

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="App">
        {wsState?.error || gameError ? (
          <div style={{ color: 'red', textAlign: 'center', padding: '1rem' }}>
            {wsState?.error || gameError}
          </div>
        ) : null}
        
        {gameState ? (
          <GameRoom
            gameState={gameState}
            onMove={(from, to) => makeMove(from, to)}
            gameId={gameId}
            isConnected={wsState?.isConnected}
            error={wsState?.error || gameError}
            isWhitePlayer={isWhitePlayer}
            isBlackPlayer={isBlackPlayer}
            onLeaveGame={handleLeaveGame}
          />
        ) : (
          <Home
            onCreateGame={handleCreateGame}
            onJoinGame={handleJoinGame}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
