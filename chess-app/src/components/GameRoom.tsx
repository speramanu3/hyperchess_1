<<<<<<< Updated upstream
import { styled } from '@mui/material/styles';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  IconButton,
  Paper, 
  Tooltip,
  Typography,
  BoxProps
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './Board/ChessBoard';
import { useSocket } from '../hooks/useSocket';
import { GameState } from '../types/game';
=======
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChessBoard } from './Board/ChessBoard';
import { GameState, GameMove } from '../types/game';
import { Chess, PieceSymbol } from 'chess.js';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import InfoIcon from '@mui/icons-material/Info';
>>>>>>> Stashed changes

interface GameRoomProps {
  gameState: GameState;
  onMove: (move: GameMove) => void;
  isWhitePlayer: boolean;
  isBlackPlayer: boolean;
  socket: any;
  onLeaveGame: () => void; 
}

interface ClockUpdate {
  white: number;
  black: number;
  lastMoveTime?: number;
  started: boolean;
  paused?: boolean;
}

interface GameUpdateData {
  type: string;
  gameStatus?: {
    isOver: boolean;
    type: 'checkmate' | 'draw' | 'timeout';
    winner?: 'white' | 'black';
  };
  player?: 'white' | 'black';
}

interface MoveMadeData {
  position: string;
  moveHistory?: string[];
  captures?: { white: string[]; black: string[] };
  clocks?: ClockUpdate;
}

const GameRoomContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px'
}));

const ClockContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  maxWidth: '600px',
  margin: '20px 0',

  '& .clock': {
    padding: '10px 20px',
    borderRadius: '5px',
    backgroundColor: theme.palette.grey[100],
    fontSize: '24px',
    fontWeight: 'bold',
    minWidth: '120px',
    textAlign: 'center',
    
    '&.active': {
      backgroundColor: theme.palette.success.main,
      color: theme.palette.success.contrastText
    }
  }
}));

const GameContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '2rem',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '2rem',
}));

const GameTitle = styled(Box)({
  color: '#8BA1B5',
  padding: '10px',
  marginBottom: '20px',
  background: '#2A2A2A',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
});

const GameId = styled('span')({
  fontSize: '14px',
});

const GameStatus = styled('span')({
  marginLeft: 'auto',
});

const GameLayout = styled('div')({
  display: 'flex',
  gap: '2rem',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: '1rem',
  '& > div:first-of-type': {  // Target SidePanel
    marginTop: '64px'  // Match the height of the turn indicator
  },
  '& > div:last-of-type': {  // Target right-side buttons container
    marginTop: '72px',  // Increased from 64px
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  }
});

const SidePanel = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  width: '300px',
  padding: 0,
  margin: 0
});

const MoveHistory = styled(Box)({
  marginTop: '20px',
  padding: '12px',
  background: '#2A2A2A',
  borderRadius: '8px',
  maxHeight: '200px',
  overflowY: 'auto',
  border: '1px solid #3A3A3A'
});

const MoveList = styled(Box)({
  fontFamily: '"Courier New", monospace',
  lineHeight: '1.8',
  color: '#B4B4B4',
});

const MovePair = styled('div')({
  marginBottom: '4px',
  '&:last-child': {
    marginBottom: 0
  }
});

const MoveItem = styled('span')({
  display: 'inline-block',
  marginRight: '5px',
  fontFamily: '"Courier New", monospace',
  '& .move-number': {
    color: '#6B8DA5',
    minWidth: '30px',
    display: 'inline-block'
  },
});

const LeaveGameButton = styled(Button)({
  color: '#4ECCA3',
  borderColor: '#4ECCA3',
  '&:hover': {
    borderColor: '#45B393',
    backgroundColor: 'rgba(78, 204, 163, 0.1)'
  }
});

const ResignButton = styled(Button)({
  color: '#FF6B6B',
  borderColor: '#FF6B6B',
  marginTop: '10px',
  '&:hover': {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 107, 107, 0.1)'
  }
});

const CapturedPiecesContainer = styled(Paper)(({ theme }) => ({
  padding: '1rem',
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}));

const PiecesSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
<<<<<<< Updated upstream
  gap: '0.5rem',
  justifyContent: 'center'
}));

const CapturedPiece = styled('img')(({ theme }) => ({
  width: '30px',
  height: '30px',
  objectFit: 'contain',
}));
=======
  gap: '8px',
  marginBottom: '1rem',
});

const CapturedPiece = styled('img')({
  width: '32px',
  height: '32px'
});
>>>>>>> Stashed changes

const MoveHistoryContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  height: '300px', 
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

<<<<<<< Updated upstream
const MoveEntry = styled(Box)(({ theme }) => ({
=======
const MoveHistoryList = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#1e1e1e',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#4a4a4a',
    borderRadius: '4px',
    '&:hover': {
      background: '#555555',
    },
  },
});

const MoveEntry = styled(Box)({
>>>>>>> Stashed changes
  display: 'grid',
  gridTemplateColumns: '30px 85px 85px',
  padding: '4px 8px',
  fontSize: '14px',
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

const GameHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  backgroundColor: '#2c2c2c',
  borderRadius: '4px',
  marginBottom: '0.5rem',
  width: '300px',
  height: '52px', 
  boxSizing: 'border-box'
});

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: '#2c2c2c',
    minWidth: '400px',
    padding: '2rem'
  }
}));

<<<<<<< Updated upstream
const MoveNumber = styled('span')(({ theme }) => ({
  textAlign: 'right',
  paddingRight: '8px',
  fontWeight: 'bold'
}));

const MoveText = styled('span')(({ theme }) => ({
  textAlign: 'left',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}));

interface ClockDisplayProps extends BoxProps {
  active?: boolean;
}

const ClockDisplay = styled(Box, {
  shouldForwardProp: prop => prop !== 'active'
})<ClockDisplayProps>(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  borderRadius: '4px',
  backgroundColor: active ? theme.palette.success.main : theme.palette.grey[800],
  color: active ? theme.palette.success.contrastText : theme.palette.grey[100],
  transition: 'background-color 0.3s ease'
}));

const GameHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px',
  backgroundColor: '#2c2c2c',
  borderRadius: '4px',
  marginBottom: '20px',
}));

const GameId = styled('span')(({ theme }) => ({
  color: '#86c1b9',
  fontFamily: 'monospace',
  fontSize: '14px',
}));
=======
const StyledDialogTitle = styled(DialogTitle)({
  color: '#86c1b9',
  fontSize: '2rem',
  textAlign: 'center',
  marginBottom: '2rem'
});

const StyledDialogContent = styled(DialogContent)({
  color: 'white',
  fontSize: '1.5rem',
  textAlign: 'center',
  marginBottom: '2rem'
});

const StyledDialogActions = styled(DialogActions)({
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem'
});
>>>>>>> Stashed changes

const GameStatus = styled('span')(({ theme }) => ({
  color: '#86c1b9',
  marginLeft: 'auto',
}));

const getPieceValue = (piece: string): number => {
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

<<<<<<< Updated upstream
const formatTime = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
=======
const getGameStatusMessage = (position: string) => {
  const chess = new Chess(position);
  
  if (chess.isCheckmate()) {
    return `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
  }
  
  if (chess.isDraw()) {
    if (chess.isStalemate()) {
      return "Game Over - Stalemate!";
    }
    if (chess.isThreefoldRepetition()) {
      return "Game Over - Draw by threefold repetition!";
    }
    if (chess.isInsufficientMaterial()) {
      return "Game Over - Draw by insufficient material!";
    }
    return "Game Over - Draw!";
  }
  
  return null;
>>>>>>> Stashed changes
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
  const [clockState, setClockState] = React.useState<ClockUpdate>({
    white: 5 * 60 * 1000, // 5 minutes in milliseconds
    black: 5 * 60 * 1000,
    started: false
  });

  const handleCopyClick = () => {
    navigator.clipboard.writeText(localGameId).then(() => {
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Update local state when props change
  useEffect(() => {
    console.log('Game state update - Turn:', localGameState.turn, 'Position:', localGameState.position);
    setLocalGameState(gameState);
    setLocalGameId(gameState.gameId);
    setLocalIsWhitePlayer(isWhitePlayer);
    setLocalIsBlackPlayer(isBlackPlayer);
  }, [gameState, isWhitePlayer, isBlackPlayer]);

<<<<<<< Updated upstream
  // Add socket event listener for game state updates
  React.useEffect(() => {
    if (socket) {
      socket.on('gameState', (updatedGame: GameState) => {
        setLocalGameState(updatedGame);
      });

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
              } else if (data.gameStatus.type === 'timeout') {
                setGameOverMessage('Game Over - Time\'s up!');
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

      socket.on('clockUpdate', (updatedClock: ClockUpdate) => {
        setClockState(updatedClock);
      });

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
=======
  // Add socket event listener for move updates
  useEffect(() => {
    if (!socket) return;

    const handleGameUpdate = (data: any) => {
      switch (data.type) {
        case 'resign':
          setIsGameOver(true);
          setShowGameOverDialog(true);
          setGameOverMessage(`${data.player === 'white' ? 'White' : 'Black'} resigned. ${data.player === 'white' ? 'Black' : 'White'} wins!`);
          setLocalGameState(prev => ({
            ...prev,
            status: 'completed'
          }));
          break;
      }
    };

    const handleMoveMade = (data: { 
      from: string; 
      to: string; 
      position: string;
      turn: 'w' | 'b';
      moveHistory?: string[];
      gameStatus?: {
        type: 'checkmate' | 'draw';
        winner?: 'white' | 'black';
        reason?: 'threefold' | 'stalemate' | 'insufficient';
      };
    }) => {
      setLocalGameState(prev => ({
        ...prev,
        position: data.position,
        turn: data.turn,
        moveHistory: data.moveHistory || prev.moveHistory,
        status: data.gameStatus ? 'completed' : prev.status
      }));

      if (data.gameStatus) {
        setIsGameOver(true);
        setShowGameOverDialog(true);
        
        if (data.gameStatus.type === 'checkmate') {
          setGameOverMessage(`Checkmate! ${data.gameStatus.winner === 'white' ? 'White' : 'Black'} wins!`);
        } else if (data.gameStatus.type === 'draw') {
          let message = 'Game Over - ';
          switch (data.gameStatus.reason) {
            case 'threefold':
              message += 'Draw by threefold repetition!';
              break;
            case 'stalemate':
              message += 'Draw by stalemate! No legal moves available.';
              break;
            case 'insufficient':
              message += 'Draw by insufficient material! Neither player can checkmate.';
              break;
            default:
              message += 'Draw!';
          }
          setGameOverMessage(message);
>>>>>>> Stashed changes
        }
      }
    };

<<<<<<< Updated upstream
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
        socket.off('clockUpdate');
      };
    }
  }, [socket, localIsWhitePlayer, localIsBlackPlayer]);
=======
    socket.on('moveMade', handleMoveMade);
    socket.on('game_update', handleGameUpdate);

    return () => {
      socket.off('moveMade', handleMoveMade);
      socket.off('game_update', handleGameUpdate);
    };
  }, [socket]);

  // Add socket event listener for game updates
  useEffect(() => {
    if (!socket) return;

    const handleGameUpdate = (data: any) => {
      switch (data.type) {
        case 'resign':
          setIsGameOver(true);
          setShowGameOverDialog(true);
          setGameOverMessage(`${data.player === 'white' ? 'White' : 'Black'} resigned. ${data.player === 'white' ? 'Black' : 'White'} wins!`);
          setLocalGameState(prev => ({
            ...prev,
            status: 'completed'
          }));
          break;
      }
    };

    socket.on('game_update', handleGameUpdate);

    return () => {
      socket.off('game_update', handleGameUpdate);
    };
  }, [socket]);
>>>>>>> Stashed changes

  // Add socket event listener for game state updates
  useEffect(() => {
    // Removed socket dependency
  }, []);

  // Initialize move history from game state
  useEffect(() => {
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

  const handleMove = (from: string, to: string) => {
    try {
      const result = chess.move({ from, to });
      if (result) {
        const updatedPosition = chess.fen();
        const updatedMoveHistory = [...(localGameState.moveHistory || []), `${from}${to}`];
        
        // Check game ending conditions
        const gameStatus = getGameStatusMessage(updatedPosition);
        if (gameStatus) {
          setGameOverMessage(gameStatus);
          setShowGameOverDialog(true);
          // Update game state with status
          const updatedGameState: GameState = {
            ...localGameState,
            position: updatedPosition,
            moveHistory: updatedMoveHistory,
            status: 'completed',
            result: gameStatus
          };
          setLocalGameState(updatedGameState);
          onMove?.({ from, to });
        } else {
          // Game continues
          const updatedGameState: GameState = {
            ...localGameState,
            position: updatedPosition,
            moveHistory: updatedMoveHistory,
            turn: chess.turn()
          };
          setLocalGameState(updatedGameState);
          onMove?.({ from, to });
        }
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const handleRematchRequest = () => {
    // Removed socket dependency
  };

  const handleRematchResponse = (accept: boolean) => {
    // Removed socket dependency
  };

  const handleReturnHome = () => {
    if (socket) {
      socket.emit('game_action', { 
        type: 'leave_game',
        gameId: gameState.gameId,
        player: isWhitePlayer ? 'white' : 'black'
      });
    }
    onLeaveGame();
  };

  const handleResign = () => {
    if (socket && (isWhitePlayer || isBlackPlayer)) {
      const resigningPlayer = isWhitePlayer ? 'white' : 'black';
      
      socket.emit('game_action', { 
        type: 'resign',
        gameId: gameState.gameId,
        player: resigningPlayer
      });

      // Update local state immediately to show game over
      setIsGameOver(true);
      setShowGameOverDialog(true);
      setGameOverMessage(`${resigningPlayer === 'white' ? 'White' : 'Black'} resigned. ${resigningPlayer === 'white' ? 'Black' : 'White'} wins!`);
      
      // Update game state
      setLocalGameState(prev => ({
        ...prev,
        status: 'completed'
      }));
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
    capturedPieces.white.sort((a, b) => getPieceValue(b.split('_')[0] as string) - getPieceValue(a.split('_')[0] as string));
    capturedPieces.black.sort((a, b) => getPieceValue(b.split('_')[0] as string) - getPieceValue(a.split('_')[0] as string));

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

<<<<<<< Updated upstream
  // Format time for display
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render clocks
  const renderClocks = () => {
    const currentPlayer = localGameState?.position ? new Chess(localGameState.position).turn() : 'w';
    const isWhiteTurn = currentPlayer === 'w';
    
    return (
      <ClockContainer>
        <div className={`clock ${isWhiteTurn ? 'active' : ''}`}>
          White: {formatTime(clockState.white)}
        </div>
        <div className={`clock ${!isWhiteTurn ? 'active' : ''}`}>
          Black: {formatTime(clockState.black)}
        </div>
      </ClockContainer>
    );
  };
=======
  // Add socket listeners with proper types
  React.useEffect(() => {
    // Removed socket dependency
  }, []);

  // Update checkmate detection in useEffect
  useEffect(() => {
    const statusMessage = getGameStatusMessage(localGameState.position);
    if (statusMessage) {
      setIsGameOver(true);
      setShowGameOverDialog(true);
      setGameOverMessage(statusMessage);
    }
  }, [localGameState.position]);
>>>>>>> Stashed changes

  // Render move history
  const renderMoveHistory = () => {
    return (
      <MoveHistory>
        <MoveList>
          {localGameState.moveHistory && Array.from({ length: Math.ceil(localGameState.moveHistory.length / 2) }, (_, i) => {
            const whiteMove = localGameState.moveHistory?.[i * 2];
            const blackMove = localGameState.moveHistory?.[i * 2 + 1];
            return (
              <MovePair key={i}>
                <MoveItem>
                  <span className="move-number">{i + 1}.</span>
                  {whiteMove}
                  {blackMove && <span style={{ marginLeft: '8px' }}>{blackMove}</span>}
                </MoveItem>
              </MovePair>
            );
          })}
        </MoveList>
      </MoveHistory>
    );
  };

  const handleCloseGameOver = () => {
    setShowGameOverDialog(false);
  };

  const renderCapturedPieces = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
    );
  };

  return (
<<<<<<< Updated upstream
    <GameRoomContainer>
      {/* Title */}
      <Typography
        variant="h1"
        sx={{
          fontSize: '2rem',
          marginBottom: '2rem',
          color: 'text.primary'
        }}
      >
        Chess Game
      </Typography>

      {/* Game Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        width: '100%',
        maxWidth: '800px',
        marginBottom: '20px'
      }}>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          Game ID:
        </Typography>
        <Typography
          sx={{
            color: '#86c1b9',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        >
          {localGameId}
        </Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy game ID'}>
          <IconButton
            size="small"
            onClick={handleCopyClick}
            sx={{ ml: 1 }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography sx={{ 
          marginLeft: 'auto',
          color: '#86c1b9' 
        }}>
          Status: {localGameState.status}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Game Area */}
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Top Clock */}
            {renderClocks()}

            <ChessBoard
              fen={localGameState.position}
              onMove={handleMove}
              orientation={localIsWhitePlayer ? 'white' : 'black'}
            />

            {/* Bottom Clock */}
            {renderClocks()}

            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                marginTop: 1
              }}
            >
              {localIsWhitePlayer ? 'You are playing as White' : localIsBlackPlayer ? 'You are playing as Black' : 'You are a spectator'}
            </Typography>
          </Box>
        </Box>

        {/* Side Panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '200px' }}>
          {/* Captured Pieces */}
          <Paper sx={{ 
            padding: '1rem',
            width: '180px',
            backgroundColor: 'background.paper'
          }}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              Captured Pieces
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {renderCapturedPieces()}
=======
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 4 }}>
      <GameLayout>
        {/* Left Side */}
        <SidePanel>
          {/* Game ID at top */}
          <GameHeader>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#86c1b9', 
                fontSize: '1rem',
                lineHeight: 1.5  
              }}
            >
              Game ID: {localGameId?.substring(0, 8)}
            </Typography>
            <Tooltip title={copied ? "Copied!" : "Copy Game ID"}>
              <IconButton size="small" onClick={handleCopyClick}>
                <FileCopyIcon sx={{ color: '#86c1b9', fontSize: '1.2rem' }} />
              </IconButton>
            </Tooltip>
          </GameHeader>

          {/* Captured Pieces */}
          <Paper elevation={3} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5, color: '#86c1b9' }}>White captured:</Typography>
              <PiecesSection>
                {capturedPieces.white.map((piece, index) => (
                  <Tooltip key={index} title={getPieceName(piece)}>
                    <CapturedPiece
                      src={getPieceImage(piece)}
                      alt={getPieceName(piece)}
                    />
                  </Tooltip>
                ))}
              </PiecesSection>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, color: '#86c1b9' }}>Black captured:</Typography>
              <PiecesSection>
                {capturedPieces.black.map((piece, index) => (
                  <Tooltip key={index} title={getPieceName(piece)}>
                    <CapturedPiece
                      src={getPieceImage(piece)}
                      alt={getPieceName(piece)}
                    />
                  </Tooltip>
                ))}
              </PiecesSection>
>>>>>>> Stashed changes
            </Box>
          </Paper>

          {/* Move History */}
<<<<<<< Updated upstream
          <Paper sx={{ 
            padding: '1rem',
            minWidth: '200px',
            minHeight: '100px',
            backgroundColor: 'background.paper',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              Move History
            </Typography>
            {moveHistory.length > 0 ? (
              renderMoveHistory()
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', p: 1 }}>
                No moves yet
              </Typography>
            )}
          </Paper>
=======
          {renderMoveHistory()}
        </SidePanel>

        {/* Center - Chess Board */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Game Status */}
          <Paper 
            sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#2c2c2c',
              padding: '14px 16px',
              marginBottom: '1rem',
              height: '52px',
              boxSizing: 'border-box'
            }}
          >
            <Typography variant="body1" sx={{ color: '#86c1b9' }}>
              {localGameState.turn === 'w' ? "White's turn" : "Black's turn"}
            </Typography>
          </Paper>

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
              fontStyle: 'italic',
            }}
          >
            Playing as: {localIsWhitePlayer ? 'White' : localIsBlackPlayer ? 'Black' : 'Spectator'}
          </Typography>
        </Box>

        {/* Right Side - Game Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Button
            variant="outlined"
            onClick={onLeaveGame}
            sx={{
              color: '#86c1b9',
              borderColor: '#86c1b9',
              '&:hover': {
                borderColor: '#86c1b9',
                backgroundColor: 'rgba(134, 193, 185, 0.1)'
              }
            }}
          >
            leave game
          </Button>
          {(localIsWhitePlayer || localIsBlackPlayer) && localGameState.status === 'active' && (
            <Button
              variant="outlined"
              onClick={handleResign}
              sx={{
                color: '#e57373',
                borderColor: '#e57373',
                '&:hover': {
                  borderColor: '#e57373',
                  backgroundColor: 'rgba(229, 115, 115, 0.1)'
                }
              }}
            >
              resign
            </Button>
          )}
>>>>>>> Stashed changes
        </Box>
      </GameLayout>

      {/* Game Over Dialog */}
<<<<<<< Updated upstream
      <Dialog
        open={showGameOverDialog}
        onClose={() => setShowGameOverDialog(false)}
      >
        <DialogTitle>Game Over</DialogTitle>
        <DialogContent>
          <Typography>{gameOverMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGameOverDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </GameRoomContainer>
=======
      <StyledDialog 
        open={showGameOverDialog} 
        onClose={handleCloseGameOver}
      >
        <StyledDialogTitle>
          Game Over
        </StyledDialogTitle>
        <StyledDialogContent>
          {gameOverMessage}
        </StyledDialogContent>
        <StyledDialogActions>
          <Button
            variant="contained"
            onClick={handleReturnHome}
            sx={{
              backgroundColor: '#86c1b9',
              color: '#1a1a1a',
              '&:hover': {
                backgroundColor: '#69958f'
              }
            }}
          >
            RETURN TO HOME
          </Button>
          <Button
            variant="outlined"
            onClick={handleCloseGameOver}
            sx={{
              color: '#86c1b9',
              borderColor: '#86c1b9',
              '&:hover': {
                borderColor: '#86c1b9',
                backgroundColor: 'rgba(134, 193, 185, 0.1)'
              },
            }}
          >
            STAY IN GAME ROOM
          </Button>
        </StyledDialogActions>
      </StyledDialog>

      {/* Rematch Dialog */}
      <StyledDialog
        open={showRematchDialog}
        onClose={() => setShowRematchDialog(false)}
      >
        <StyledDialogTitle>
          Rematch Request
        </StyledDialogTitle>
        <StyledDialogContent>
          {gameOverMessage}
        </StyledDialogContent>
        <StyledDialogActions>
          <Button
            variant="contained"
            onClick={() => handleRematchResponse(true)}
            color="primary"
          >
            accept
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleRematchResponse(false)}
            color="error"
          >
            decline
          </Button>
        </StyledDialogActions>
      </StyledDialog>
    </Box>
>>>>>>> Stashed changes
  );
};
