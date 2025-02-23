import React from 'react';
import { Box, Typography, Paper, styled, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { ChessBoard } from './Board/ChessBoard';
import { GameState } from '../types/game';
import { Chess, PieceSymbol } from 'chess.js';

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

  const handleRematch = () => {
    if (socket) {
      socket.emit('request_rematch', { gameId: gameState.gameId });
    }
  };

  const handleHome = () => {
    if (socket) {
      socket.emit('leave_game', { gameId: gameState.gameId });
      if (onLeaveGame) {
        onLeaveGame();
      }
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

  const capturedPieces = getCapturedPieces();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ pt: 3 }}>
        Chess Game
      </Typography>
      
      <GameContainer>
        <CapturedPiecesContainer>
          <Box>
            <Typography variant="subtitle2" gutterBottom align="center">
              Black's Captures
            </Typography>
            <PiecesSection>
              {capturedPieces.black.map((piece, index) => (
                <CapturedPiece
                  key={`${piece}_${index}`}
                  src={getPieceImage(piece)}
                  alt={getPieceName(piece)}
                  title={getPieceName(piece)}
                />
              ))}
            </PiecesSection>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom align="center">
              White's Captures
            </Typography>
            <PiecesSection>
              {capturedPieces.white.map((piece, index) => (
                <CapturedPiece
                  key={`${piece}_${index}`}
                  src={getPieceImage(piece)}
                  alt={getPieceName(piece)}
                  title={getPieceName(piece)}
                />
              ))}
            </PiecesSection>
          </Box>
        </CapturedPiecesContainer>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper 
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Game ID: {gameState.gameId}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Status: {gameState.status}
              </Typography>
            </Box>

            <ChessBoard 
              fen={gameState.position}
              onMove={onMove}
              isWhitePlayer={isWhitePlayer}
              isBlackPlayer={isBlackPlayer}
            />

            <Typography 
              variant="h6" 
              align="center"
              sx={{ 
                mt: 2,
                color: 'text.secondary'
              }}
            >
              Playing as: {isWhitePlayer ? 'White' : isBlackPlayer ? 'Black' : 'Spectator'}
            </Typography>
          </Paper>
        </Box>
      </GameContainer>

      <Dialog
        open={isGameOver}
        aria-labelledby="game-over-dialog-title"
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
            minWidth: '300px'
          }
        }}
      >
        <DialogTitle id="game-over-dialog-title" sx={{ textAlign: 'center' }}>
          Game Over!
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" align="center" gutterBottom>
            {winner === 'Draw' ? "It's a Draw!" : `${winner} wins!`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRematch}
            sx={{ mr: 1 }}
          >
            Rematch
          </Button>
          <Button
            variant="outlined"
            onClick={handleHome}
          >
            Back to Home
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
