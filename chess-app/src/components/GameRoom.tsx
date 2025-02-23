import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  BoxProps, 
  Typography, 
  Paper, 
  styled, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { ChessBoard } from './Board/ChessBoard';
import { GameState } from '../types/game';
import { Chess, PieceSymbol } from 'chess.js';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import InfoIcon from '@mui/icons-material/Info';
import TimerIcon from '@mui/icons-material/Timer';

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

const MoveHistoryContainer = styled(Paper)(({ theme }) => ({
  padding: '1rem',
  minWidth: '200px',
  minHeight: '100px',
  backgroundColor: theme.palette.background.paper,
  marginTop: '1rem',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px'
}));

const MoveEntry = styled(Box)({
  display: 'grid',
  gridTemplateColumns: '30px 85px 85px',
  padding: '4px 8px',
  fontSize: '14px',
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  }
});

const MoveNumber = styled('span')({
  textAlign: 'right',
  paddingRight: '8px',
  fontWeight: 'bold'
});

const MoveText = styled('span')({
  textAlign: 'left',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
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

interface ClockDisplayProps extends Omit<BoxProps, 'active'> {
  active?: boolean;
}

const StyledClockBox = styled(Box, {
  shouldForwardProp: prop => prop !== 'active'
})<{ active?: boolean }>(({ theme, active }) => ({
  padding: '0.5rem 1rem',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[800],
  color: active ? theme.palette.primary.contrastText : theme.palette.grey[100],
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease-in-out',
  '& .MuiSvgIcon-root': {
    color: 'inherit'
  },
  '& .MuiTypography-root': {
    color: 'inherit'
  }
}));

const ClockDisplay = React.forwardRef<HTMLDivElement, ClockDisplayProps>(
  ({ active, children, ...props }, ref) => {
    return (
      <StyledClockBox ref={ref} active={active} {...props}>
        {children}
      </StyledClockBox>
    );
  }
);

ClockDisplay.displayName = 'ClockDisplay';

const ClockContainer = styled(Paper)(({ theme }) => ({
  padding: '1rem',
  backgroundColor: theme.palette.grey[900],
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  width: '100%',
  '& > *:not(:last-child)': {
    marginBottom: '0.5rem'
  }
}));

const formatTime = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

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

  const [moveHistory, setMoveHistory] = React.useState<string[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [clocks, setClocks] = React.useState<{ white: number; black: number }>({ 
    white: 5 * 60 * 1000, 
    black: 5 * 60 * 1000 
  });
  const clockInterval = useRef<NodeJS.Timeout | null>(null);

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

  // Add socket event listener for game state updates
  React.useEffect(() => {
    if (socket) {
      socket.on('gameState', (updatedGame: GameState) => {
        setLocalGameState(updatedGame);
      });

      type GameUpdateData = {
        type: string;
        gameStatus?: {
          isOver: boolean;
          type: 'checkmate' | 'draw';
          winner?: 'white' | 'black';
        };
        player?: 'white' | 'black';
      };

      socket.on('game_update', (data: GameUpdateData) => {
        console.log('Received game update:', data);
        
        switch (data.type) {
          case 'game_over':
            if (data.gameStatus) {
              setIsGameOver(true);
              setShowGameOverDialog(true);
              
              if (data.gameStatus.type === 'checkmate' && data.gameStatus.winner) {
                const winner = data.gameStatus.winner === 'white' ? 'White' : 'Black';
                setGameOverMessage(`Checkmate! ${winner} wins!`);
              } else if (data.gameStatus.type === 'draw') {
                setGameOverMessage('Game Over - Draw!');
              }
            }
            break;

          case 'resign':
            if (data.player) {
              setIsGameOver(true);
              setShowGameOverDialog(true);
              if ((data.player === 'white' && localIsWhitePlayer) || 
                  (data.player === 'black' && localIsBlackPlayer)) {
                setGameOverMessage(`You resigned. ${data.player === 'white' ? 'Black' : 'White'} wins!`);
              } else {
                setGameOverMessage(`${data.player === 'white' ? 'White' : 'Black'} resigned. You win!`);
              }
            }
            break;
        }
      });

      type MoveMadeData = {
        position: string;
        moveHistory?: string[];
        captures?: { white: string[]; black: string[] };
        clocks?: { white: number; black: number; started: boolean };
      };

      socket.on('moveMade', (data: MoveMadeData) => {
        console.log('Move made with data:', data);
        
        // Update game state
        setLocalGameState(prev => ({
          ...prev,
          position: data.position,
          moveHistory: data.moveHistory || prev.moveHistory,
          captures: data.captures || prev.captures,
          clock: data.clocks || prev.clock
        }));

        // Update move history if provided
        if (data.moveHistory) {
          setMoveHistory(data.moveHistory);
        }

        // Update captures if provided
        if (data.captures) {
          setCapturedPieces(data.captures);
        }

        // Check for checkmate or draw
        const chess = new Chess(data.position);
        if (chess.isCheckmate() || chess.isDraw()) {
          setIsGameOver(true);
          setShowGameOverDialog(true);
          if (chess.isCheckmate()) {
            const winner = chess.turn() === 'w' ? 'Black' : 'White';
            setGameOverMessage(`Checkmate! ${winner} wins!`);
          } else {
            setGameOverMessage('Game Over - Draw!');
          }
        }
      });

      return () => {
        socket.off('gameState');
        socket.off('game_update');
        socket.off('moveMade');
      };
    }
  }, [socket, localIsWhitePlayer, localIsBlackPlayer]);

  // Initialize move history from game state
  React.useEffect(() => {
    console.log('Game state updated:', localGameState);
    if (localGameState.moveHistory && localGameState.moveHistory.length > 0) {
      console.log('Setting move history from game state:', localGameState.moveHistory);
      setMoveHistory(localGameState.moveHistory);
    } else {
      try {
        // Fallback to calculating moves if server doesn't provide them
        const newChess = new Chess(localGameState.position);
        const moves = newChess.history();
        console.log('Calculated move history:', moves);
        setMoveHistory(moves);
      } catch (error) {
        console.error('Error updating move history:', error);
      }
    }
  }, [localGameState]);

  const handleMove = React.useCallback((move: { from: string; to: string }) => {
    if (socket) {
      socket.emit('makeMove', {
        gameId: localGameId,
        from: move.from,
        to: move.to
      });
    }
  }, [socket, localGameId]);

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

  // Initialize captured pieces when game starts and when position changes
  React.useEffect(() => {
    const chess = new Chess(localGameState.position);
    const newCapturedPieces = getCapturedPieces(chess);
    setCapturedPieces(newCapturedPieces);
  }, [localGameState.position]);

  const getCapturedPieces = (chess: Chess) => {
    const currentPieces: { [key: string]: number } = {
      p_w: 0, p_b: 0,  // pawns
      n_w: 0, n_b: 0,  // knights
      b_w: 0, b_b: 0,  // bishops
      r_w: 0, r_b: 0,  // rooks
      q_w: 0, q_b: 0,  // queens
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

    // Initial piece counts
    const initialPieces = {
      p_w: 8, p_b: 8,  // pawns
      n_w: 2, n_b: 2,  // knights
      b_w: 2, b_b: 2,  // bishops
      r_w: 2, r_b: 2,  // rooks
      q_w: 1, q_b: 1,  // queens
    };

    // Calculate captured pieces
    const capturedPieces = {
      white: [] as string[],
      black: [] as string[]
    };

    Object.entries(initialPieces).forEach(([piece, count]) => {
      const currentCount = currentPieces[piece] || 0;
      const captured = count - currentCount;
      const [type, color] = piece.split('_');
      
      for (let i = 0; i < captured; i++) {
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

  // Update clocks from game state
  React.useEffect(() => {
    if (localGameState.clock) {
      setClocks({
        white: localGameState.clock.white,
        black: localGameState.clock.black
      });
    }
  }, [localGameState.clock]);

  // Handle clock ticking
  React.useEffect(() => {
    if (localGameState.clock?.started) {
      const chess = new Chess(localGameState.position);
      const currentPlayer = chess.turn() === 'w' ? 'white' : 'black';
      
      // Clear any existing interval
      if (clockInterval.current) {
        clearInterval(clockInterval.current);
      }

      // Start new interval for current player
      clockInterval.current = setInterval(() => {
        setClocks(prev => {
          const newTime = prev[currentPlayer] - 100; // Decrease by 100ms
          if (newTime <= 0) {
            clearInterval(clockInterval.current!);
            const winner = currentPlayer === 'white' ? 'black' : 'white';
            setGameOverMessage(`${winner} wins on time`);
            setShowGameOverDialog(true);
            return { ...prev, [currentPlayer]: 0 };
          }
          return { ...prev, [currentPlayer]: newTime };
        });
      }, 100);

      return () => {
        if (clockInterval.current) {
          clearInterval(clockInterval.current);
        }
      };
    }
  }, [localGameState.clock?.started, localGameState.position]);

  // Render move history
  const renderMoveHistory = () => {
    // Group moves by turn number
    const turns: { white: string; black?: string }[] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      turns.push({
        white: moveHistory[i],
        black: moveHistory[i + 1]
      });
    }

    return turns.map((turn, index) => (
      <MoveEntry key={index}>
        <MoveNumber>{index + 1}.</MoveNumber>
        <MoveText>{turn.white}</MoveText>
        <MoveText>{turn.black || ''}</MoveText>
      </MoveEntry>
    ));
  };

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
      <GameContainer>
        {/* Left Side - Captured Pieces & Move History */}
        <Box sx={{ minWidth: '200px' }}>
          {/* Captured Pieces */}
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Captured Pieces</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>White captured:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '32px' }}>
                  {capturedPieces.white.map((piece, index) => (
                    <Typography key={index} variant="body1" sx={{ fontSize: '24px', color: '#000' }}>
                      {piece.includes('_b') ? (
                        piece === 'p_b' ? '♟' :
                        piece === 'n_b' ? '♞' :
                        piece === 'b_b' ? '♝' :
                        piece === 'r_b' ? '♜' :
                        piece === 'q_b' ? '♛' : ''
                      ) : ''}
                    </Typography>
                  ))}
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Black captured:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '32px' }}>
                  {capturedPieces.black.map((piece, index) => (
                    <Typography key={index} variant="body1" sx={{ fontSize: '24px', color: '#fff' }}>
                      {piece.includes('_w') ? (
                        piece === 'p_w' ? '♙' :
                        piece === 'n_w' ? '♘' :
                        piece === 'b_w' ? '♗' :
                        piece === 'r_w' ? '♖' :
                        piece === 'q_w' ? '♕' : ''
                      ) : ''}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Move History */}
          <MoveHistoryContainer elevation={3}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Move History</Typography>
            <Box sx={{ 
              maxHeight: '200px', 
              overflowY: 'auto'
            }}>
              {moveHistory.length > 0 ? (
                renderMoveHistory()
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', p: 1 }}>
                  No moves yet
                </Typography>
              )}
            </Box>
          </MoveHistoryContainer>
        </Box>

        {/* Center - Chess Board */}
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Top Clock */}
            <ClockContainer>
              <ClockDisplay active={localIsWhitePlayer ? !isWhitePlayer && localGameState.clock?.started : isWhitePlayer && localGameState.clock?.started}>
                <TimerIcon />
                <Typography variant="h6">
                  {localIsWhitePlayer ? 'Black' : 'White'}: {formatTime(localIsWhitePlayer ? clocks.black : clocks.white)}
                </Typography>
              </ClockDisplay>
            </ClockContainer>

            <ChessBoard
              fen={localGameState.position}
              onMove={handleMove}
              isWhitePlayer={localIsWhitePlayer}
              isBlackPlayer={localIsBlackPlayer}
            />

            {/* Bottom Clock */}
            <ClockContainer>
              <ClockDisplay active={localIsWhitePlayer ? isWhitePlayer && localGameState.clock?.started : !isWhitePlayer && localGameState.clock?.started}>
                <TimerIcon />
                <Typography variant="h6">
                  {localIsWhitePlayer ? 'White' : 'Black'}: {formatTime(localIsWhitePlayer ? clocks.white : clocks.black)}
                </Typography>
              </ClockDisplay>
            </ClockContainer>

            <Typography 
              variant="body2" 
              sx={{
                textAlign: 'center',
                fontStyle: 'italic'
              }}
            >
              Playing as: {localIsWhitePlayer ? 'White' : localIsBlackPlayer ? 'Black' : 'Spectator'}
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Game Controls */}
        <Box sx={{ 
          minWidth: '180px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {/* Game Controls */}
          {(localIsWhitePlayer || localIsBlackPlayer) && (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Game Controls</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => onLeaveGame?.()}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      borderColor: 'error.main',
                      color: 'error.main'
                    }
                  }}
                >
                  Leave Game
                </Button>
                {localGameState.status === 'active' && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleResign}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 0, 0, 0.1)'
                      }
                    }}
                  >
                    Resign
                  </Button>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      </GameContainer>

      {/* Dialogs */}
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
