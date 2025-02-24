import React from 'react';
import { Box, styled } from '@mui/material';
import { Chess, Square, Piece } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  onMove: (sourceSquare: Square, targetSquare: Square) => void;
  isWhitePlayer: boolean;
  isBlackPlayer: boolean;
}

const BoardContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  width: '640px',
  height: '640px',
  margin: '0 auto',
  border: '2px solid #2b2b2b',
  borderRadius: '4px',
  overflow: 'hidden',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  position: 'relative', // Added for dragged piece positioning
}));

interface ChessSquareProps {
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
}

const ChessSquare = styled('div')<{ isLight: boolean; isSelected: boolean; isValidMove: boolean }>(({ isLight, isSelected, isValidMove }) => ({
  width: '80px',
  height: '80px',
  backgroundColor: isSelected 
    ? '#fff3cd'
    : isValidMove
      ? isLight ? '#90EE90' : '#32CD32'  // Light and dark green for valid moves
      : isLight ? '#F0D9B5' : '#B58863',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  '&::after': isValidMove ? {
    content: '""',
    position: 'absolute',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 1,
    pointerEvents: 'none'
  } : {},
}));

const PieceImage = styled('img')({
  width: '65px',  // Increased from 50px
  height: '65px', // Increased from 50px
  cursor: 'grab',
  userSelect: 'none',
  transition: 'transform 0.1s',
  '&:active': {
    cursor: 'grabbing',
  },
});

export const ChessBoard: React.FC<ChessBoardProps> = ({ fen, onMove, isWhitePlayer, isBlackPlayer }) => {
  const [selectedSquare, setSelectedSquare] = React.useState<Square | null>(null);
  const [validMoves, setValidMoves] = React.useState<Square[]>([]);
  const [draggedPiece, setDraggedPiece] = React.useState<{ square: Square; element: HTMLElement | null } | null>(null);
  const chess = new Chess(fen);

  const calculateValidMoves = (square: Square): Square[] => {
    try {
      // Get all moves from this position
      const moves = chess.moves({ square, verbose: true });
      
      // Extract just the destination squares
      return moves.map(move => move.to as Square);
    } catch (error) {
      console.error('Error calculating moves:', error);
      return [];
    }
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedPiece) {
        // Update piece position during drag
        if (draggedPiece.element) {
          draggedPiece.element.style.left = `${e.clientX - draggedPiece.element.offsetWidth / 2}px`;
          draggedPiece.element.style.top = `${e.clientY - draggedPiece.element.offsetHeight / 2}px`;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [draggedPiece]);

  const handleSquareClick = (square: Square) => {
    const piece = chess.get(square);
    
    // If a square was already selected
    if (selectedSquare) {
      // Try to make a move
      try {
        const moveResult = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q'
        });

        if (moveResult) {
          onMove(selectedSquare, square);
        }
      } catch (error) {
        console.error('Move error:', error);
      }
      
      setSelectedSquare(null);
      setValidMoves([]);
    } 
    // If no square was selected and the clicked square has a piece
    else if (piece) {
      // Only allow selecting own pieces
      const isWhitePiece = piece.color === 'w';
      if ((isWhitePlayer && isWhitePiece) || (isBlackPlayer && !isWhitePiece)) {
        setSelectedSquare(square);
        setValidMoves(calculateValidMoves(square));
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    const piece = chess.get(square);
    if (!piece) return;

    const isWhitePiece = piece.color === 'w';
    if ((isWhitePlayer && isWhitePiece) || (isBlackPlayer && !isWhitePiece)) {
      const pieceElement = e.target as HTMLImageElement;
      
      // Create a custom drag image that matches the piece size
      const dragImage = new Image();
      dragImage.src = pieceElement.src;
      dragImage.width = 65;
      dragImage.height = 65;
      e.dataTransfer.setDragImage(dragImage, 32, 32);
      
      // Calculate and show valid moves
      const moves = calculateValidMoves(square);
      setValidMoves(moves);
      setSelectedSquare(square);
      setDraggedPiece({ square, element: pieceElement });
      
      e.dataTransfer.setData('text/plain', square);
      e.dataTransfer.effectAllowed = 'move';

      pieceElement.style.transform = 'scale(1.05)';
    } else {
      e.preventDefault();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    if (draggedPiece?.element && !e.defaultPrevented && e.clientX && e.clientY) {
      const element = draggedPiece.element;
      element.style.position = 'fixed';
      element.style.zIndex = '1000';
      element.style.pointerEvents = 'none';
      element.style.width = '65px';   // Match the new size
      element.style.height = '65px';  // Match the new size
      element.style.left = `${e.clientX - 32}px`; // Adjust center point
      element.style.top = `${e.clientY - 32}px`;  // Adjust center point
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (draggedPiece?.element) {
      const element = draggedPiece.element;
      // Reset all styles
      element.style.position = '';
      element.style.zIndex = '';
      element.style.pointerEvents = '';
      element.style.left = '';
      element.style.top = '';
      element.style.width = '';
      element.style.height = '';
      element.style.transform = '';
    }
    
    // Clear valid moves when piece is dropped
    setSelectedSquare(null);
    setValidMoves([]);
    setDraggedPiece(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const sourceSquare = e.dataTransfer.getData('text/plain') as Square;
    
    // Get the piece at the source square
    const piece = chess.get(sourceSquare);
    if (!piece) {
      handleInvalidDrop();
      return;
    }

    // Verify it's the player's piece
    const isWhitePiece = piece.color === 'w';
    if ((isWhitePlayer && !isWhitePiece) || (isBlackPlayer && isWhitePiece)) {
      handleInvalidDrop();
      return;
    }

    try {
      // Attempt the move
      const moveResult = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (moveResult) {
        onMove(sourceSquare, targetSquare);
      } else {
        handleInvalidDrop();
      }
    } catch (error) {
      console.error('Move error:', error);
      handleInvalidDrop();
    }
    
    setSelectedSquare(null);
    setValidMoves([]);
    setDraggedPiece(null);
  };

  const handleInvalidDrop = () => {
    // Reset the piece to its original position
    if (draggedPiece?.element) {
      const element = draggedPiece.element;
      element.style.position = '';
      element.style.zIndex = '';
      element.style.pointerEvents = '';
      element.style.left = '';
      element.style.top = '';
      element.style.width = '';
      element.style.height = '';
      element.style.transform = '';
    }
  };

  const getPieceImage = (piece: Piece | null): string => {
    if (!piece) return '';
    const color = piece.color === 'w' ? 'white' : 'black';
    const pieceType = piece.type;
    let imagePieceType: string;
    
    switch (pieceType) {
      case 'p': imagePieceType = 'pawn'; break;
      case 'n': imagePieceType = 'knight'; break;
      case 'b': imagePieceType = 'bishop'; break;
      case 'r': imagePieceType = 'rook'; break;
      case 'q': imagePieceType = 'queen'; break;
      case 'k': imagePieceType = 'king'; break;
      default: imagePieceType = 'pawn';
    }
    return `/assets/pieces/${imagePieceType}_${color}.png`;
  };

  const generateSquares = () => {
    const squares: Square[] = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    // Reverse the arrays if playing as black
    const orderedFiles = isBlackPlayer ? [...files].reverse() : files;
    const orderedRanks = isBlackPlayer ? ranks : [...ranks].reverse();

    for (const rank of orderedRanks) {
      for (const file of orderedFiles) {
        const square = `${file}${rank}` as Square;
        squares.push(square);
      }
    }
    return squares;
  };

  const handleMove = (sourceSquare: Square, targetSquare: Square) => {
    if (onMove) {
      onMove(sourceSquare, targetSquare);
    }
    return true;
  };

  return (
    <BoardContainer>
      {generateSquares().map((square) => {
        const file = square[0];
        const rank = parseInt(square[1]);
        const isLight = (file.charCodeAt(0) - 'a'.charCodeAt(0) + rank) % 2 === 0;
        const piece = chess.get(square);
        const isSelected = selectedSquare === square;
        const isValidMove = validMoves.includes(square);

        return (
          <ChessSquare
            key={square}
            isLight={isLight}
            isSelected={isSelected}
            isValidMove={isValidMove}
            onClick={() => handleSquareClick(square)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => handleDrop(e, square)}
          >
            {piece && (
              <PieceImage
                src={getPieceImage(piece)}
                alt={`${piece.color}${piece.type}`}
                draggable
                onDragStart={(e) => handleDragStart(e, square)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
              />
            )}
          </ChessSquare>
        );
      })}
    </BoardContainer>
  );
};
