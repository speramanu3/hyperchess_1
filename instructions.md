# Multiplayer Chess Application Development Guide

This guide provides step-by-step instructions for building a modern multiplayer chess application with features similar to chess.com, including real-time gameplay, Stockfish integration, and move history.

## Assets
- chessboard: chessboard.png
- pieces: piece_color.png (e.g., pawn_white.png, queen_black.png)

### Asset Setup
1. Create an assets directory in the public folder:
   ```bash
   mkdir -p public/assets/{board,pieces}
   ```

2. Place the assets in their respective directories:
   - Place `chessboard.png` in `public/assets/board/`
   - Place piece images in `public/assets/pieces/` using the naming convention:
     ```
     pawn_white.png
     knight_white.png
     bishop_white.png
     rook_white.png
     queen_white.png
     king_white.png
     pawn_black.png
     knight_black.png
     bishop_black.png
     rook_black.png
     queen_black.png
     king_black.png
     ```

3. Access the assets in your components:
   ```typescript
   // For the chessboard
   const boardImage = process.env.PUBLIC_URL + '/assets/board/chessboard.png';
   
   // For chess pieces
   const getPieceImage = (piece: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king', color: 'white' | 'black') => {
     return `${process.env.PUBLIC_URL}/assets/pieces/${piece}_${color}.png`;
   };
   ```

## Tech Stack
- Frontend: React + TypeScript
- UI Framework: Material UI
- Chess Logic: chess.js (https://github.com/jhlywa/chess.js)
- Engine Analysis: stockfish.js (https://github.com/official-stockfish/Stockfish)
- Backend: Node.js + Express
- Real-time Communication: Socket.io
- Hosting: Railway

## Step 1: Project Setup
1. Create a new project using Create React App with TypeScript template:
```bash
npx create-react-app chess-app --template typescript
cd chess-app
```

2. Install required dependencies:
```bash
npm install @mui/material @emotion/react @emotion/styled
npm install chess.js stockfish.js socket.io-client axios
```

3. Install Railway CLI:
```bash
npm i -g @railway/cli
railway login
```

**QA Checkpoints:**
- Verify all dependencies install without errors
- Ensure TypeScript compilation works
- Confirm development server starts successfully
- Verify Railway CLI installation and login

## Step 2: Home Page Implementation
1. Create the home page component with two main buttons:
   - "New Game" button: Generates a unique game ID when clicked
   - "Join Game" button: Opens input field for game ID

2. Implement game creation flow:
   ```typescript
   // components/HomePage.tsx
   interface HomePageProps {
     onCreateGame: () => void;
     onJoinGame: (gameId: string) => void;
   }
   ```

3. Game flow implementation:
   - When user clicks "New Game":
     1. Generate unique game ID
     2. Display game ID to user for sharing
     3. Wait for opponent to join
   - When user wants to join:
     1. Enter game ID in input field
     2. Click "Join Game"
     3. Connect to existing game room

4. Add loading states and error handling:
   - Show loading while creating/joining game
   - Display error if game ID is invalid
   - Show appropriate messages while waiting for opponent

## Step 3: Project Structure
Create the following directory structure:
```
src/
├── components/
│   ├── Board/
│   ├── MoveHistory/
│   └── GameControls/
├── hooks/
├── services/
├── types/
└── utils/
```

## Step 4: Backend Setup (In-Memory Version)
1. Create Express server with Socket.io and in-memory game storage:

```typescript
// types.ts
interface GameState {
  gameId: string;
  position: string;
  moves: string[];
  players: {
    white: string | null;
    black: string | null;
  };
  lastMove: Date;
  status: 'waiting' | 'active' | 'completed';
}

// server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// In-memory game storage
const activeGames = new Map<string, GameState>();

// Generate unique game ID
const generateGameId = () => Math.random().toString(36).substring(2, 15);

io.on('connection', (socket) => {
  // Create new game
  socket.on('create-game', () => {
    const gameId = generateGameId();
    const game: GameState = {
      gameId,
      position: new Chess().fen(),
      moves: [],
      players: { white: socket.id, black: null },
      lastMove: new Date(),
      status: 'waiting'
    };
    
    activeGames.set(gameId, game);
    socket.join(gameId);
    socket.emit('game-created', gameId);
  });

  // Join existing game
  socket.on('join-game', (gameId: string) => {
    const game = activeGames.get(gameId);
    if (game && !game.players.black) {
      game.players.black = socket.id;
      game.status = 'active';
      socket.join(gameId);
      io.to(gameId).emit('game-started', game);
    }
  });

  // Handle moves
  socket.on('make-move', (gameId: string, move: string) => {
    const game = activeGames.get(gameId);
    if (game) {
      const chess = new Chess(game.position);
      const moveResult = chess.move(move);
      
      if (moveResult) {
        game.position = chess.fen();
        game.moves.push(move);
        game.lastMove = new Date();
        
        if (chess.isGameOver()) {
          game.status = 'completed';
        }
        
        io.to(gameId).emit('move-made', {
          move,
          position: game.position,
          status: game.status
        });
      }
    }
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    activeGames.forEach((game, gameId) => {
      if (game.players.white === socket.id || game.players.black === socket.id) {
        io.to(gameId).emit('player-disconnected');
        activeGames.delete(gameId);
      }
    });
  });
});

httpServer.listen(process.env.PORT || 3001);
```

## Step 5: Frontend Game State Management
```typescript
// hooks/useGameState.ts
interface UseGameState {
  gameState: GameState;
  makeMove: (move: string) => void;
  createGame: () => Promise<string>;
  joinGame: (gameId: string) => void;
}

const useGameState = (): UseGameState => {
  // ... existing code ...

  return { gameState, makeMove, createGame, joinGame };
};
```

## Step 6: Move History Implementation
1. Create move history component
2. Implement PGN parsing
3. Add move navigation
4. Style move list similar to chess.com

**QA Checkpoints:**
- Verify moves are recorded correctly
- Test move navigation
- Confirm PGN notation is accurate

## Step 7: UI Polish
1. Implement Material UI theme
2. Add responsive design
3. Create loading states
4. Implement error handling

**QA Checkpoints:**
- Test responsive layout
- Verify theme consistency
- Check loading states
- Test error scenarios

## Step 8: Game Features
1. Add timer functionality
2. Implement resignation and draw offers
3. Add game chat
4. Create game result display

**QA Checkpoints:**
- Test timer accuracy
- Verify game end conditions
- Test chat functionality
- Confirm result display

## Step 9: Performance Optimization
1. Implement lazy loading
2. Add memoization where needed
3. Optimize Stockfish analysis
4. Add service worker for offline support

**QA Checkpoints:**
- Measure load times
- Test memory usage
- Verify analysis performance
- Check offline functionality

## Debugging Guide

### Frontend Debugging

1. Socket Connection Issues:
   ```typescript
   // Check socket connection status
   socket.on('connect', () => {
     console.log('Connected to server');
   });
   
   socket.on('connect_error', (error) => {
     console.error('Connection error:', error);
   });
   ```

2. Game State Issues:
   ```typescript
   // Add state logging in useGameState hook
   useEffect(() => {
     console.log('Game state updated:', gameState);
     console.log('Current player color:', playerColor);
     console.log('Is player turn:', isPlayerTurn);
   }, [gameState, playerColor, isPlayerTurn]);
   ```

3. Move Validation:
   ```typescript
   // Debug move attempts
   const handleMove = ({ from, to }) => {
     console.log('Attempting move:', { from, to });
     console.log('Current position:', game.fen());
     console.log('Is valid move:', game.move({ from, to }));
   };
   ```

### Backend Debugging

1. Game Creation:
   ```typescript
   socket.on('create-game', () => {
     console.log('Creating new game...');
     // Log game creation details
     console.log('Active games:', activeGames.size);
   });
   ```

2. Player Connections:
   ```typescript
   // Track player connections and disconnections
   socket.on('disconnect', () => {
     console.log('Player disconnected:', socket.id);
     // Log affected games
   });
   ```

3. Move Processing:
   ```typescript
   socket.on('make-move', (gameId, move) => {
     console.log('Processing move:', {
       gameId,
       move,
       player: socket.id
     });
   });
   ```

## Memory Management

1. Game Cleanup:
   - Inactive games cleaned up after 10 minutes
   - Completed games removed after reconnection window
   - Abandoned games automatically cleared

2. Resource Management:
   - Socket connections properly closed
   - Event listeners cleaned up
   - Timers and intervals cleared

## Common Issues and Solutions

1. Board Orientation:
   - Issue: Board appears flipped for one player
   - Solution: Check playerColor prop and square generation logic

2. Move Validation:
   - Issue: Invalid moves being accepted
   - Solution: Verify chess.js validation and turn checking

3. Disconnection Handling:
   - Issue: Players not properly reconnecting
   - Solution: Check reconnection window timing and socket events

4. State Synchronization:
   - Issue: Game state out of sync between players
   - Solution: Verify socket event propagation and state updates

## User Experience Guidelines

1. Game Creation:
   - Clear "Create Game" button
   - Visible game ID for sharing
   - Simple game joining process

2. Move Feedback:
   - Visual highlighting of selected pieces
   - Clear indication of valid/invalid moves
   - Turn status display

3. Game Status:
   - Current player indication
   - Game state messages
   - Opponent connection status

4. Error Handling:
   - Clear error messages
   - Reconnection prompts
   - Game state recovery

## Development Workflow

1. Local Development:
   ```bash
   # Start backend server
   cd server && npm run dev
   
   # Start frontend
   cd .. && npm start
   ```

2. Testing:
   - Use multiple browsers for multiplayer testing
   - Test disconnection scenarios
   - Verify move validation
   - Check board orientation for both players

3. Deployment:
   - Ensure proper WebSocket configuration
   - Set appropriate timeouts
   - Configure CORS settings

## Deployment Checklist
1. Environment variables setup
2. Build optimization
3. Server configuration
4. SSL certificate setup
5. Database backup strategy

## Testing Strategy
1. Unit tests for chess logic
2. Integration tests for multiplayer functionality
3. End-to-end tests for game flows
4. Performance testing

## Security Considerations
1. Input validation
2. Rate limiting
3. WebSocket authentication
4. Move validation on server-side

## Final Step: Stockfish Integration

### Setting up Stockfish
1. Initialize Stockfish engine in a web worker to prevent UI blocking
2. Configure Stockfish to analyze positions at an appropriate depth (recommended: depth 18-20)
3. Set up position evaluation to calculate score if best move is played next turn

### Building the Evaluation Bar
1. Create a horizontal evaluation bar component to be placed under the chess board:
   ```
   src/
   └── components/
       └── EvaluationBar/
           └── EvaluationBar.tsx
   ```

2. Implement the evaluation bar with these specifications:
   - Bar should stretch full width under the chess board
   - White advantage shown as white portion from left
   - Black advantage shown as black portion from right
   - Current evaluation number displayed in the center
   - Evaluation shows centipawn value (e.g. +1.3 means white is better by 1.3 pawns)
   - Bar fills proportionally based on advantage (max display at ±10.0)
   - Updates in real-time as moves are made

### Performance Considerations
1. Web worker implementation for non-blocking analysis
2. Debounce position updates to prevent excessive calculations
3. Clean up Stockfish instance on component unmount
4. Handle analysis termination when new moves are made
