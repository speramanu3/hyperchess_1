import React from 'react';
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, styled, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Tooltip } from '@mui/material';
import { ChessBoard } from './Board/ChessBoard';
import { GameState } from '../types/game';
import { Chess, PieceSymbol } from 'chess.js';
import FileCopyIcon from '@mui/icons-material/FileCopy';

interface GameRoomProps {
  gameState: GameState;
  onMove: (move: { from: string; to: string }) => void;
  isWhitePlayer: boolean;
  isBlackPlayer: boolean;
  socket: any; // We'll get the socket from props instead of hook
  onLeaveGame?: () => void; // Optional callback for leaving the game
}

const GameContainer = styled(Box)({
  display: 'flex',
  gap: '2rem',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '2rem',
});

const CapturedPiecesContainer = styled(Paper)(({ theme }) => ({
  padding: '1rem',
  width: '180px',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}));

const PiecesSection = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  justifyContent: 'center'
});

const CapturedPiece = styled('img')({
  width: '30px',
  height: '30px',
  objectFit: 'contain',
});

const getPieceValue = (piece: PieceSymbol): number => {
  switch (piece) {
    case 'q': return 9;
    case 'r': return 5;
    case 'b':
    case 'n': return 3;
    case 'p': return 1;
    default: return 0;
  }
};

const getPieceImage = (piece: string): string => {
  const [type, color] = piece.split('_');
  let pieceType: string;
  switch (type) {
    case 'p': pieceType = 'pawn'; break;
    case 'n': pieceType = 'knight'; break;
    case 'b': pieceType = 'bishop'; break;
    case 'r': pieceType = 'rook'; break;
    case 'q': pieceType = 'queen'; break;
    case 'k': pieceType = 'king'; break;
    default: pieceType = 'pawn';
  }
  return `/assets/pieces/${pieceType}_${color === 'w' ? 'white' : 'black'}.png`;
};

const getPieceName = (piece: string): string => {
  const [type, color] = piece.split('_');
  const colorName = color === 'w' ? 'White' : 'Black';
  let pieceName: string;
  switch (type) {
    case 'p': pieceName = 'Pawn'; break;
    case 'n': pieceName = 'Knight'; break;
    case 'b': pieceName = 'Bishop'; break;
    case 'r': pieceName = 'Rook'; break;
    case 'q': pieceName = 'Queen'; break;
    case 'k': pieceName = 'King'; break;
    default: pieceName = 'Piece';
  }
  return `${colorName} ${pieceName}`;
};

const GameHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px',
  backgroundColor: '#2c2c2c',
  borderRadius: '4px',
  marginBottom: '20px',
});

const GameId = styled('span')({
  color: '#86c1b9',
  fontFamily: 'monospace',
  fontSize: '14px',
});

const GameStatus = styled('span')({
  color: '#86c1b9',
  marginLeft: 'auto',
});

export const GameRoom: React.FC<GameRoomProps> = ({ 
  gameState, 
  onMove,
  isWhitePlayer,
  isBlackPlayer,
  socket,
  onLeaveGame
}) => {
  const chess = new Chess(gameState.position);
  const isGameOver = chess.isCheckmate() || chess.isDraw();
  const winner = chess.isCheckmate() 
    ? (chess.turn() === 'w' ? 'Black' : 'White') 
    : chess.isDraw() 
    ? 'Draw' 
    : null;

  const [isGameOverState, setIsGameOver] = React.useState(isGameOver);
  const [gameOverMessage, setGameOverMessage] = React.useState(winner ? `${winner} wins!` : '');
  const [rematchRequested, setRematchRequested] = React.useState(false);
  const [rematchOffered, setRematchOffered] = React.useState(false);
  const [showRematchDialog, setShowRematchDialog] = React.useState(false);
  const [showGameOverDialog, setShowGameOverDialog] = React.useState(false);
  const [localGameState, setLocalGameState] = React.useState(gameState);
  const [localGameId, setLocalGameId] = React.useState(gameState.gameId);
  const [localIsWhitePlayer, setLocalIsWhitePlayer] = React.useState(isWhitePlayer);
  const [localIsBlackPlayer, setLocalIsBlackPlayer] = React.useState(isBlackPlayer);
  const [capturedPieces, setCapturedPieces] = React.useState<{
    white: string[];
    black: string[];
  }>({
    white: [],
    black: []
  });

  const [copied, setCopied] = React.useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(localGameId).then(() => {
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Update local state when props change
  React.useEffect(() => {
    setLocalGameState(gameState);
    setLocalGameId(gameState.gameId);
    setLocalIsWhitePlayer(isWhitePlayer);
    setLocalIsBlackPlayer(isBlackPlayer);
  }, [gameState, isWhitePlayer, isBlackPlayer]);

  const handleRematchRequest = () => {
    if (socket) {
      socket.emit('game_action', { 
        type: 'request_rematch',
        gameId: gameState.gameId,
        player: isWhitePlayer ? 'white' : 'black'
      });
      setRematchRequested(true);
    }
  };

  const handleRematchResponse = (accept: boolean) => {
    if (socket) {
      socket.emit('game_action', {
        type: accept ? 'accept_rematch' : 'decline_rematch',
        gameId: gameState.gameId,
        player: isWhitePlayer ? 'white' : 'black'
      });
      setShowRematchDialog(false);
      if (!accept) {
        handleReturnHome();
      }
    }
  };

  const handleReturnHome = () => {
    if (socket) {
      socket.emit('game_action', { 
        type: 'leave_game',
        gameId: gameState.gameId,
        player: isWhitePlayer ? 'white' : 'black'
      });
      onLeaveGame?.();
    }
  };

  const handleResign = () => {
    if (socket && (isWhitePlayer || isBlackPlayer)) {
      const resigningPlayer = isWhitePlayer ? 'white' : 'black';
      
      // Emit resign event
      socket.emit('game_action', { 
        type: 'resign',
        gameId: gameState.gameId, 
        player: resigningPlayer
      });
    }
  };

  const getCapturedPieces = () => {
    const currentPieces: { [key: string]: number } = {};
    const initialPieces = {
      p_w: 8, p_b: 8,  // pawns
      n_w: 2, n_b: 2,  // knights
      b_w: 2, b_b: 2,  // bishops
      r_w: 2, r_b: 2,  // rooks
      q_w: 1, q_b: 1,  // queens
    };

    // Count current pieces
    chess.board().forEach(row => {
      if (!row) return;
      row.forEach(piece => {
        if (piece) {
          const key = `${piece.type}_${piece.color}`;
          currentPieces[key] = (currentPieces[key] || 0) + 1;
        }
      });
    });

    // Calculate captured pieces
    const capturedPieces = {
      white: [] as string[],
      black: [] as string[]
    };

    Object.entries(initialPieces).forEach(([piece, count]) => {
      const currentCount = currentPieces[piece] || 0;
      const captured = count - currentCount;
      const [type, color] = piece.split('_');
      
      for (let i = 0; i <captured; i++) {
        if (color === 'w') {
          capturedPieces.black.push(piece);
        } else {
          capturedPieces.white.push(piece);
        }
      }
    });

    // Sort by piece value
    capturedPieces.white.sort((a, b) => getPieceValue(b.split('_')[0] as PieceSymbol) - getPieceValue(a.split('_')[0] as PieceSymbol));
    capturedPieces.black.sort((a, b) => getPieceValue(b.split('_')[0] as PieceSymbol) - getPieceValue(a.split('_')[0] as PieceSymbol));

    return capturedPieces;
  };

  const handleMove = (move: { from: string; to: string }) => {
    console.log('Attempting move:', move, 'in game:', localGameId);
    if (socket) {
      socket.emit('game_action', {
        type: 'move',
        gameId: localGameId,
        move,
        player: localIsWhitePlayer ? 'white' : 'black'
      });
    }
  };

  // Add socket event types
  type GameOverEvent = {
    winner: 'White' | 'Black' | 'Draw';
  };

  type ResignEvent = {
    player: 'white' | 'black';
  };

  type RematchRequestEvent = {
    player: 'white' | 'black';
  };

  // Add socket listeners with proper types
  React.useEffect(() => {
    if (socket) {
      socket.on('game_update', (data: any) => {
        console.log('Received game update:', data);
        
        switch (data.type) {
          case 'move':
            setLocalGameState(prev => ({
              ...prev,
              position: data.position
            }));
            
            // Update captured pieces
            if (data.captures) {
              setCapturedPieces(data.captures);
            }
            
            // Handle game over conditions
            if (data.gameStatus) {
              setIsGameOver(true);
              setShowGameOverDialog(true);
              
              if (data.gameStatus.type === 'checkmate') {
                const winner = data.gameStatus.winner === 'white' ? 'White' : 'Black';
                setGameOverMessage(`Checkmate! ${winner} wins!`);
              } else if (data.gameStatus.type === 'draw') {
                setGameOverMessage('Game Over - Draw!');
              }
            }
            break;

          case 'resign':
            setIsGameOver(true);
            setShowGameOverDialog(true);
            const resignedPlayer = data.player;
            if ((resignedPlayer === 'white' && localIsWhitePlayer) || (resignedPlayer === 'black' && localIsBlackPlayer)) {
              setGameOverMessage(`You resigned. ${resignedPlayer === 'white' ? 'Black' : 'White'} wins!`);
            } else {
              setGameOverMessage(`${resignedPlayer === 'white' ? 'White' : 'Black'} resigned. You win!`);
            }
            break;
          
          case 'rematch_requested':
            if ((data.player === 'white' && !localIsWhitePlayer) || (data.player === 'black' && !localIsBlackPlayer)) {
              setShowRematchDialog(true);
              setGameOverMessage(`${data.player === 'white' ? 'White' : 'Black'} wants a rematch!`);
            }
            break;

          case 'rematch_accepted':
            if (data.game) {
              const newGame = data.game;
              console.log('Handling rematch accept. New game:', newGame);
              
              // Update the game state and ID
              setLocalGameState(newGame);
              setLocalGameId(newGame.gameId);
              
              // Update player colors based on the new game
              const isWhite = newGame.players.white === socket.id;
              const isBlack = newGame.players.black === socket.id;
              setLocalIsWhitePlayer(isWhite);
              setLocalIsBlackPlayer(isBlack);
              
              // Reset all game state and dialogs
              setIsGameOver(false);
              setShowGameOverDialog(false);
              setRematchRequested(false);
              setRematchOffered(false);
              setShowRematchDialog(false);
              setGameOverMessage('');
              
              console.log('Updated local state:', {
                gameId: newGame.gameId,
                isWhite,
                isBlack,
                position: newGame.position
              });
            }
            break;

          case 'rematch_declined':
            setGameOverMessage('Rematch declined. Returning to home...');
            setTimeout(() => {
              handleReturnHome();
            }, 2000);
            break;
        }
      });

      socket.on('opponent_left', () => {
        setIsGameOver(true);
        setShowGameOverDialog(true);
        setGameOverMessage('Opponent has left the game');
        onLeaveGame?.();
      });

      return () => {
        socket.off('game_update');
        socket.off('opponent_left');
      };
    }
  }, [socket, onLeaveGame, localIsWhitePlayer, localIsBlackPlayer]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 4 }}>
      {/* Title */}
      <Typography
        variant="h1"
        component="h1"
        align="center"
        gutterBottom
        sx={{
          mb: 4,
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #60EFFF 30%, #00FF87 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 8px rgba(96, 239, 255, 0.3)',
          filter: 'drop-shadow(0 2px 8px rgba(96, 239, 255, 0.3))',
          fontSize: '2.5rem',
          letterSpacing: '0.05em',
          textTransform: 'lowercase'
        }}
      >
        hyperchess
      </Typography>

      {/* Game Info */}
      <GameHeader>
        <span style={{ color: '#fff' }}>Game ID:</span>
        <GameId>{localGameId}</GameId>
        <Tooltip title={copied ? "Copied!" : "Copy game ID"}>
          <IconButton 
            onClick={handleCopyClick}
            size="small"
            sx={{ 
              color: copied ? '#4CAF50' : '#86c1b9',
              '&:hover': { 
                color: copied ? '#4CAF50' : '#aaf0e6' 
              }
            }}
          >
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <GameStatus>Status: {localGameState.status}</GameStatus>
      </GameHeader>

      {/* Game Content */}
      <Box sx={{ 
        display: 'flex', 
        gap: '2rem', 
        justifyContent: 'center',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {/* Left Side - Captured Pieces */}
        <Paper 
          elevation={3}
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            minWidth: 200,
            minHeight: 100
          }}
        >
          <Box>
            <Typography variant="subtitle1">Black's Captures:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {capturedPieces.black.map((piece, index) => (
                <Typography key={index} variant="body1" sx={{ fontSize: '2rem' }}>
                  {piece === 'P' ? '♟' :
                   piece === 'N' ? '♞' :
                   piece === 'B' ? '♝' :
                   piece === 'R' ? '♜' :
                   piece === 'Q' ? '♛' : ''}
                </Typography>
              ))}
            </Box>
            <Typography variant="subtitle1">White's Captures:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {capturedPieces.white.map((piece, index) => (
                <Typography key={index} variant="body1" sx={{ fontSize: '2rem' }}>
                  {piece === 'P' ? '♙' :
                   piece === 'N' ? '♘' :
                   piece === 'B' ? '♗' :
                   piece === 'R' ? '♖' :
                   piece === 'Q' ? '♕' : ''}
                </Typography>
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Center - Chess Board */}
        <Box>
          <ChessBoard
            fen={localGameState.position}
            onMove={handleMove}
            isWhitePlayer={localIsWhitePlayer}
            isBlackPlayer={localIsBlackPlayer}
          />
          <Typography 
            variant="body2" 
            sx={{
              mt: 2,
              textAlign: 'center',
              fontStyle: 'italic'
            }}
          >
            Playing as: {localIsWhitePlayer ? 'White' : localIsBlackPlayer ? 'Black' : 'Spectator'}
          </Typography>
        </Box>

        {/* Right Side - Game Controls */}
        <Box sx={{ minWidth: '180px' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => onLeaveGame?.()}
            fullWidth
            sx={{
              textTransform: 'none',
              mb: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: 'error.main',
                color: 'error.main'
              }
            }}
          >
            leave game
          </Button>
          {(localIsWhitePlayer || localIsBlackPlayer) && localGameState.status === 'active' && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleResign}
              fullWidth
              sx={{
                textTransform: 'none',
                mb: 2,
                borderColor: 'error.main',
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: 'white'
                }
              }}
            >
              resign
            </Button>
          )}
        </Box>
      </Box>

      {/* Game Over Dialog */}
      <Dialog 
        open={showGameOverDialog} 
        onClose={() => setShowGameOverDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(44, 44, 44, 0.95)',
            color: '#fff',
            minWidth: '300px',
            textAlign: 'center',
            padding: '20px'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontSize: '24px',
          pb: 1
        }}>
          Game Over
        </DialogTitle>
        <DialogContent sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pb: 3
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {gameOverMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          display: 'flex',
          justifyContent: 'center',
          pb: 2
        }}>
          <Button
            onClick={() => {
              setShowGameOverDialog(false);
              if(onLeaveGame) onLeaveGame();
            }}
            variant="contained"
            sx={{
              backgroundColor: '#86c1b9',
              '&:hover': {
                backgroundColor: '#aaf0e6'
              }
            }}
          >
            RETURN HOME
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rematch Dialog */}
      <Dialog
        open={showRematchDialog}
        onClose={() => setShowRematchDialog(false)}
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            minWidth: 300,
          },
        }}
      >
        <DialogTitle>Rematch Request</DialogTitle>
        <DialogContent>
          <Typography>{gameOverMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleRematchResponse(true)}
            variant="contained"
            color="primary"
          >
            accept
          </Button>
          <Button
            onClick={() => handleRematchResponse(false)}
            variant="outlined"
            color="error"
          >
            decline
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
