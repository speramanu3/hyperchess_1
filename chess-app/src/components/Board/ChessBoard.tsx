import React from 'react';
import { Box, styled } from '@mui/material';
import { Chess, Square, Piece } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  onMove: (move: { from: string; to: string }) => void;
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

const ChessSquare = styled(Box)<ChessSquareProps>(({ theme, isLight, isSelected, isValidMove }) => ({
  aspectRatio: '1/1',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: isSelected
    ? '#f7d794'
    : isValidMove
    ? '#fadb5f'
    : isLight
    ? '#f0e9d8'
    : '#4a9f45',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: isSelected ? '#f7d794' : isValidMove ? '#fadb5f' : '#6ab04c',
  },
  position: 'relative',
}));

const PieceImage = styled('img')({
  width: '90%',
  height: '90%',
  objectFit: 'contain',
  userSelect: 'none',
  cursor: 'grab',
  '&:active': {
    cursor: 'grabbing',
  },
});

const DraggedPiece = styled('div')({
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 1000,
  width: '80px',
  height: '80px',
  transform: 'translate(-50%, -50%)',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
});

export const ChessBoard: React.FC<ChessBoardProps> = ({ fen, onMove, isWhitePlayer, isBlackPlayer }) => {
  const [selectedSquare, setSelectedSquare] = React.useState<Square | null>(null);
  const [validMoves, setValidMoves] = React.useState<Square[]>([]);
  const [draggedPiece, setDraggedPiece] = React.useState<{ square: Square; image: string } | null>(null);
  const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
  const chess = new Chess(fen);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedPiece) {
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [draggedPiece]);

  const calculateValidMoves = (square: Square): Square[] => {
    try {
      return chess.moves({ square, verbose: true }).map(move => move.to as Square);
    } catch {
      return [];
    }
  };

  const handleSquareClick = (square: Square) => {
    if (selectedSquare) {
      if (validMoves.includes(square)) {
        onMove({ from: selectedSquare, to: square });
      }
      setSelectedSquare(null);
      setValidMoves([]);
    } else {
      const piece = chess.get(square);
      if (piece) {
        const isWhitePiece = piece.color === 'w';
        if ((isWhitePlayer && isWhitePiece) || (isBlackPlayer && !isWhitePiece)) {
          setSelectedSquare(square);
          setValidMoves(calculateValidMoves(square));
        }
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    const piece = chess.get(square);
    if (!piece) return;

    const isWhitePiece = piece.color === 'w';
    if ((isWhitePlayer && isWhitePiece) || (isBlackPlayer && !isWhitePiece)) {
      const image = getPieceImage(piece);
      setDraggedPiece({ square, image });
      setDragPosition({ x: e.clientX, y: e.clientY });
      setSelectedSquare(square);
      setValidMoves(calculateValidMoves(square));
      
      // Set drag data and hide default ghost image
      e.dataTransfer.setData('text/plain', square);
      e.dataTransfer.effectAllowed = 'move';
      const emptyImage = document.createElement('img');
      emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(emptyImage, 0, 0);

      // Make the original piece semi-transparent
      const target = e.target as HTMLElement;
      target.style.opacity = '0.5';
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const sourceSquare = e.dataTransfer.getData('text/plain') as Square;
    
    if (validMoves.includes(targetSquare)) {
      onMove({ from: sourceSquare, to: targetSquare });
    }
    
    setSelectedSquare(null);
    setValidMoves([]);
    setDraggedPiece(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Restore opacity of the original piece
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    
    setSelectedSquare(null);
    setValidMoves([]);
    setDraggedPiece(null);
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
        squares.push(`${file}${rank}` as Square);
      }
    }

    return squares;
  };

  return (
    <BoardContainer>
      {generateSquares().map((square, index) => {
        const piece = chess.get(square);
        const isLight = (Math.floor(index / 8) + (index % 8)) % 2 === 0;
        const isSelected = square === selectedSquare;
        const isValidMove = validMoves.includes(square);

        return (
          <ChessSquare
            key={square}
            isLight={isLight}
            isSelected={isSelected}
            isValidMove={isValidMove}
            onClick={() => handleSquareClick(square)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, square)}
          >
            {piece && (
              <PieceImage
                src={getPieceImage(piece)}
                alt={`${piece.color}${piece.type}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, square)}
                onDragEnd={handleDragEnd}
              />
            )}
          </ChessSquare>
        );
      })}
      {draggedPiece && (
        <DraggedPiece
          style={{
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
          }}
        >
          <img src={draggedPiece.image} alt="Dragged piece" />
        </DraggedPiece>
      )}
    </BoardContainer>
  );
};
