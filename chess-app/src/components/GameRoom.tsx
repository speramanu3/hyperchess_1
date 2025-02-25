import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  DialogContentText,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChessBoard } from './Board/ChessBoard';
import { GameState, GameMove } from '../types/game';
import { Chess } from 'chess.js';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import InfoIcon from '@mui/icons-material/Info';
import { useSocket } from '../hooks/useSocket';

interface GameRoomProps {
  gameState: GameState;
  onMove: (from: string, to: string) => void;
  gameId: string;
  isConnected: boolean;
  error: string | null;
  isWhitePlayer: boolean;
  isBlackPlayer: boolean;
  onLeaveGame: () => void;
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
}

const GameRoomContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  height: '100vh',
}));

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

const MoveRow = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 8px',
  fontSize: '14px',
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

const MoveNumber = styled('span')({
  minWidth: '30px',
  display: 'inline-block',
  color: '#6B8DA5',
});

const MoveItem = styled('span')({
  display: 'inline-block',
  marginRight: '5px',
  fontFamily: '"Courier New", monospace',
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
  gap: '8px',
  marginBottom: '1rem',
}));

const CapturedPiece = styled('img')({
  width: '32px',
  height: '32px'
});

const MoveHistoryContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  height: '300px', 
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

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
});

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

const getGameStatusMessage = (position: string) => {
  const chess = new Chess(position);
  
  if (chess.isCheckmate()) {
    return { isGameOver: true, message: `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!` };
  }
  
  if (chess.isDraw()) {
    if (chess.isStalemate()) {
      return { isGameOver: true, message: "Game Over - Stalemate!" };
    }
    if (chess.isThreefoldRepetition()) {
      return { isGameOver: true, message: "Game Over - Draw by threefold repetition!" };
    }
    if (chess.isInsufficientMaterial()) {
      return { isGameOver: true, message: "Game Over - Draw by insufficient material!" };
    }
    return { isGameOver: true, message: "Game Over - Draw!" };
  }
  
  return { isGameOver: false, message: null };
};

export const GameRoom: React.FC<GameRoomProps> = ({
  gameState,
  onMove,
  gameId,
  isConnected,
  error,
  isWhitePlayer,
  isBlackPlayer,
  onLeaveGame
}) => {
  const [showGameOverDialog, setShowGameOverDialog] = React.useState(false);
  const [gameOverMessage, setGameOverMessage] = React.useState<string | null>(null);
  const [localGameState, setLocalGameState] = React.useState<GameState | null>(gameState);
  const [capturedPieces, setCapturedPieces] = React.useState<{
    white: string[];
    black: string[];
  }>({
    white: [],
    black: []
  });
  const [showCopiedTooltip, setShowCopiedTooltip] = React.useState(false);
  const [isGameOverState, setIsGameOver] = React.useState(false);

  useEffect(() => {
    setLocalGameState(gameState);
  }, [gameState]);

  const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const chess = new Chess(localGameState?.position || defaultFen);
  const isGameOver = chess.isCheckmate() || chess.isDraw();
  const winner = chess.isCheckmate() 
    ? (chess.turn() === 'w' ? 'Black' : 'White') 
    : chess.isDraw() 
    ? 'Draw' 
    : null;

  const handleGameCompletion = () => {
    if (!localGameState) {
      console.error('Cannot complete game: no game state');
      return;
    }

    const updatedState: GameState = {
      gameId: localGameState.gameId,
      position: localGameState.position,
      status: 'completed',
      turn: localGameState.turn,
      players: {
        white: localGameState.players.white || '',
        black: localGameState.players.black || ''
      },
      moveHistory: localGameState.moveHistory,
      captures: localGameState.captures,
      result: gameOverMessage || 'Game Over'
    };
    setLocalGameState(updatedState);

    setShowGameOverDialog(true);
  };

  const handleMove = (from: string, to: string) => {
    if (!localGameState) {
      console.error('Cannot make move: no game state');
      return;
    }

    try {
      const result = chess.move({ from, to });
      if (result) {
        const updatedPosition = chess.fen();
        const updatedMoveHistory = [...localGameState.moveHistory, `${from}${to}`];
        
        const gameStatus = getGameStatusMessage(updatedPosition);
        
        if (gameStatus.isGameOver && gameStatus.message) {
          setGameOverMessage(gameStatus.message);
          handleGameCompletion();
        } else {
          const updatedState: GameState = {
            gameId: localGameState.gameId,
            position: updatedPosition,
            status: 'active',
            turn: chess.turn() as 'w' | 'b',
            players: localGameState.players,
            moveHistory: updatedMoveHistory,
            captures: localGameState.captures,
            result: localGameState.result
          };
          setLocalGameState(updatedState);
        }

        onMove(from, to);
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const handleResign = () => {
    if (!localGameState) {
      console.error('Cannot resign: no game state');
      return;
    }

    const resigningPlayer = isWhitePlayer ? 'white' : 'black';
    const winner = resigningPlayer === 'white' ? 'Black' : 'White';
    
    const updatedState: GameState = {
      gameId: localGameState.gameId,
      position: localGameState.position,
      status: 'completed',
      turn: localGameState.turn,
      players: localGameState.players,
      moveHistory: localGameState.moveHistory,
      captures: localGameState.captures,
      result: `${winner} wins by resignation`
    };
    
    setLocalGameState(updatedState);
    setGameOverMessage(`${resigningPlayer === 'white' ? 'White' : 'Black'} resigned. ${winner} wins!`);
    setShowGameOverDialog(true);
  };

  const handleJoinGame = (color: 'white' | 'black') => {
    if (!localGameState) {
      console.error('Cannot join game: missing game state');
      return;
    }

    const updatedState: GameState = {
      gameId: localGameState.gameId,
      position: localGameState.position,
      status: 'active',
      turn: localGameState.turn,
      players: {
        ...localGameState.players,
        [color]: ''
      },
      moveHistory: localGameState.moveHistory,
      captures: localGameState.captures,
      result: localGameState.result
    };
    setLocalGameState(updatedState);
  };

  useEffect(() => {
    if (!localGameState) return;

    const chess = new Chess(localGameState.position);
    const newCapturedPieces = getCapturedPieces(chess);
    setCapturedPieces(newCapturedPieces);
  }, [localGameState?.position]);

  const getCapturedPieces = (chess: Chess) => {
    const currentPieces = {
      p_w: 0, p_b: 0,  // pawns
      n_w: 0, n_b: 0,  // knights
      b_w: 0, b_b: 0,  // bishops
      r_w: 0, r_b: 0,  // rooks
      q_w: 0, q_b: 0,  // queens
    };

    chess.board().forEach(row => {
      if (!row) return;
      row.forEach(piece => {
        if (piece) {
          currentPieces[`${piece.type}_${piece.color}` as keyof typeof currentPieces]++;
        }
      });
    });

    const initialPieces = {
      p_w: 8, p_b: 8,  // pawns
      n_w: 2, n_b: 2,  // knights
      b_w: 2, b_b: 2,  // bishops
      r_w: 2, r_b: 2,  // rooks
      q_w: 1, q_b: 1,  // queens
    };

    const capturedPieces = {
      white: [] as string[],
      black: [] as string[]
    };

    Object.entries(initialPieces).forEach(([key, count]) => {
      const [type, color] = key.split('_');
      const diff = count - currentPieces[key as keyof typeof currentPieces];
      
      for (let i = 0; i < diff; i++) {
        if (color === 'w') {
          capturedPieces.black.push(`${type}_${color}`);
        } else {
          capturedPieces.white.push(`${type}_${color}`);
        }
      }
    });

    capturedPieces.white.sort((a, b) => getPieceValue(b.split('_')[0]) - getPieceValue(a.split('_')[0]));
    capturedPieces.black.sort((a, b) => getPieceValue(b.split('_')[0]) - getPieceValue(a.split('_')[0]));

    return capturedPieces;
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

  const renderMoveHistory = () => {
    return (
      <MoveHistory>
        <MoveList>
          {localGameState?.moveHistory ? Array.from(
            { length: Math.ceil(localGameState.moveHistory.length / 2) },
            (_, i) => {
              const whiteMove = localGameState.moveHistory[i * 2];
              const blackMove = localGameState.moveHistory[i * 2 + 1];
              return (
                <MoveRow key={i}>
                  <MoveNumber>{i + 1}.</MoveNumber>
                  <Move>{whiteMove}</Move>
                  {blackMove && <Move>{blackMove}</Move>}
                </MoveRow>
              );
            }
          ) : null}
        </MoveList>
      </MoveHistory>
    );
  };

  const handleCloseGameOver = () => {
    setShowGameOverDialog(false);
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!isConnected) {
    return <div>Connecting to game...</div>;
  }

  if (!localGameState) {
    return <div>Loading game state...</div>;
  }

  return (
    <GameRoomContainer>
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
              Game ID: {localGameState?.gameId?.substring(0, 8)}
            </Typography>
            <Tooltip title={showCopiedTooltip ? "Copied!" : "Copy Game ID"}>
              <IconButton size="small" onClick={() => {
                if (!localGameState?.gameId) return;
                navigator.clipboard.writeText(localGameState.gameId);
                setShowCopiedTooltip(true);
                setTimeout(() => setShowCopiedTooltip(false), 2000);
              }}>
                <FileCopyIcon sx={{ color: '#86c1b9', fontSize: '1.2rem' }} />
              </IconButton>
            </Tooltip>
          </GameHeader>

          {/* Captured Pieces */}
          <Paper elevation={3} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
            {renderCapturedPieces()}
          </Paper>

          {/* Move History */}
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
              {localGameState?.turn === 'w' ? "White's turn" : "Black's turn"}
            </Typography>
          </Paper>

          {localGameState && (
            <ChessBoard
              fen={localGameState.position}
              onMove={handleMove}
              isWhitePlayer={isWhitePlayer}
              isBlackPlayer={isBlackPlayer}
            />
          )}

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            Playing as: {isWhitePlayer ? 'White' : isBlackPlayer ? 'Black' : 'Spectator'}
          </Typography>
        </Box>

        {/* Right Side - Game Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Button
            variant="outlined"
            onClick={handleReturnHome}
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
          {(isWhitePlayer || isBlackPlayer) && localGameState?.status === 'active' && (
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
        </Box>
      </GameLayout>

      {/* Game Over Dialog */}
      <Dialog open={showGameOverDialog} onClose={() => setShowGameOverDialog(false)}>
        <DialogTitle>Game Over</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {gameOverMessage || 'The game has ended.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGameOverDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rematch Dialog */}
      <StyledDialog
        open={false}
        onClose={() => {}}
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
            onClick={() => {}}
            color="primary"
          >
            accept
          </Button>
          <Button
            variant="outlined"
            onClick={() => {}}
            color="error"
          >
            decline
          </Button>
        </StyledDialogActions>
      </StyledDialog>
    </GameRoomContainer>
  );
};
