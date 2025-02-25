import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Chess } from 'chess.js';

const app = express();
app.use(cors());

// Serve static files
app.use(express.static('public'));

// Add health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://hyperchess-1.vercel.app",
      "https://hyperchess-1-git-main-speramanu3.vercel.app",
      "https://hyperchess-1-speramanu3.vercel.app",
      "https://hyperchess1-production.up.railway.app"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Add error handling for the server
httpServer.on('error', (error) => {
  console.error('Server error:', error);
});

// Add error handling for socket.io
io.on('error', (error) => {
  console.error('Socket.io error:', error);
});

// Server configuration
const MAX_CONCURRENT_GAMES = 1000;
const MAX_SPECTATORS_PER_GAME = 50;
const GAME_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
const COMPLETED_GAME_EXPIRY_TIME = 1 * 60 * 60 * 1000; // 1 hour
const INACTIVE_GAME_EXPIRY_TIME = 6 * 60 * 60 * 1000; // 6 hours

interface GameState {
  gameId: string;
  position: string;
  status: 'waiting' | 'active' | 'completed';
  turn: 'w' | 'b';
  players: {
    white: string | null;
    black: string | null;
  };
  spectators: string[];
  captures?: {
    white: string[];
    black: string[];
  };
  moveHistory?: string[];
  positionHistory?: string[];
  lastActivityTime: number;
  createdAt: number;
  clock?: {
    white: number;  // milliseconds remaining
    black: number;
    lastMoveTime?: number;  // timestamp of last move
    started: boolean;
  };
}

const games = new Map<string, GameState>();

// Cleanup inactive and completed games
const cleanupGames = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  games.forEach((game, gameId) => {
    // Clean up completed games after 1 hour
    if (game.status === 'completed' && 
        now - game.lastActivityTime > COMPLETED_GAME_EXPIRY_TIME) {
      games.delete(gameId);
      cleanedCount++;
      return;
    }
    
    // Clean up inactive games after 6 hours
    if (now - game.lastActivityTime > INACTIVE_GAME_EXPIRY_TIME) {
      games.delete(gameId);
      cleanedCount++;
      return;
    }
    
    // Clean up old games after 24 hours regardless of status
    if (now - game.createdAt > GAME_EXPIRY_TIME) {
      games.delete(gameId);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} inactive/completed games`);
  }
};

// Run cleanup every hour
setInterval(cleanupGames, 60 * 60 * 1000);

const logGameState = (message: string) => {
  console.log(`\n=== ${message} ===`);
  console.log('Active Games:');
  games.forEach((game, id) => {
    console.log(`Game ${id}:`, {
      status: game.status,
      white: game.players.white,
      black: game.players.black
    });
  });
  console.log('================\n');
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('createGame', () => {
    try {
      if (games.size >= MAX_CONCURRENT_GAMES) {
        socket.emit('error', 'Server at maximum capacity. Please try again later.');
        return;
      }

      const gameId = uuidv4();
      const now = Date.now();
      const INITIAL_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      const newGame: GameState = {
        gameId,
        position: new Chess().fen(),
        status: 'waiting',
        turn: 'w',
        players: {
          white: socket.id,
          black: null
        },
        spectators: [],
        moveHistory: [],
        captures: {
          white: [],
          black: []
        },
        positionHistory: [new Chess().fen()],
        lastActivityTime: now,
        createdAt: now,
        clock: {
          white: INITIAL_TIME,
          black: INITIAL_TIME,
          started: false
        }
      };
      
      games.set(gameId, newGame);
      socket.join(gameId);
      io.to(gameId).emit('gameCreated', newGame);
      logGameState('Game Created');
    } catch (error) {
      console.error('Error creating game:', error);
      socket.emit('error', 'Failed to create game');
    }
  });

  socket.on('joinGame', (gameId: string) => {
    try {
      console.log('Attempting to join game:', gameId);
      const game = games.get(gameId);
      
      if (!game) {
        console.log('Game not found:', gameId);
        console.log('Available games:', Array.from(games.keys()));
        socket.emit('error', 'Game not found');
        return;
      }

      // Update activity time
      game.lastActivityTime = Date.now();

      // If player is already in the game (reconnecting)
      if (game.players.white === socket.id || game.players.black === socket.id) {
        socket.join(gameId);
        socket.emit('gameJoined', game);
        return;
      }

      // If game is full, try to add as spectator
      if (game.players.black && game.players.white) {
        if (game.spectators.length >= MAX_SPECTATORS_PER_GAME) {
          socket.emit('error', 'Game has reached maximum spectator capacity');
          return;
        }
        
        game.spectators.push(socket.id);
        socket.join(gameId);
        socket.emit('gameJoined', {
          ...game,
          role: 'spectator'
        });
        io.to(gameId).emit('spectatorsUpdate', game.spectators.length);
        return;
      }

      // Join as black player if available
      if (!game.players.black) {
        game.players.black = socket.id;
        game.status = 'active';
        socket.join(gameId);
        
        games.set(gameId, game);
        socket.emit('gameJoined', game);
        io.to(gameId).emit('gameState', game);
        logGameState('Player Joined');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', 'Failed to join game');
    }
  });

  socket.on('makeMove', ({ gameId, from, to }) => {
    try {
      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      const chess = new Chess(game.position);
      
      // Verify it's the player's turn
      const isWhiteMove = chess.turn() === 'w';
      const isPlayersTurn = (isWhiteMove && game.players.white === socket.id) || 
                          (!isWhiteMove && game.players.black === socket.id);
      
      if (!isPlayersTurn) {
        socket.emit('error', 'Not your turn');
        return;
      }

      // Make the move
      const move = chess.move({ from, to });
      if (!move) {
        socket.emit('error', 'Invalid move');
        return;
      }

      // Update game state
      game.position = chess.fen();
      game.moveHistory = chess.history();
      game.lastActivityTime = Date.now();

      // Check for game end conditions
      const gameStatus = {
        isOver: false,
        type: '',
        winner: ''
      };

      if (chess.isCheckmate()) {
        gameStatus.isOver = true;
        gameStatus.type = 'checkmate';
        gameStatus.winner = chess.turn() === 'w' ? 'black' : 'white';
        game.status = 'completed';
      } else if (chess.isDraw()) {
        gameStatus.isOver = true;
        gameStatus.type = 'draw';
        game.status = 'completed';
      }

      // Update clocks if they exist
      if (game.clock) {
        const now = Date.now();
        if (game.clock.lastMoveTime) {
          const elapsed = now - game.clock.lastMoveTime;
          if (chess.turn() === 'b') { // White just moved
            game.clock.white -= elapsed;
          } else { // Black just moved
            game.clock.black -= elapsed;
          }
        }
        game.clock.lastMoveTime = now;
        game.clock.started = true;
      }

      // Calculate captured pieces
      const calculateCaptures = () => {
        const pieces: { [key: string]: number } = {};

        chess.board().forEach(row => {
          if (!row) return;
          row.forEach(piece => {
            if (piece) {
              const key = `${piece.type}_${piece.color}`;
              pieces[key] = (pieces[key] || 0) + 1;
            }
          });
        });

        const initialPieces = {
          p_w: 8, p_b: 8,
          n_w: 2, n_b: 2,
          b_w: 2, b_b: 2,
          r_w: 2, r_b: 2,
          q_w: 1, q_b: 1
        } as const;

        const captures = {
          white: [] as string[],
          black: [] as string[]
        };

        Object.entries(initialPieces).forEach(([piece, count]) => {
          const currentCount = pieces[piece] || 0;
          const captured = count - currentCount;
          const [type, color] = piece.split('_');
          
          for (let i = 0; i < captured; i++) {
            if (color === 'w') {
              captures.black.push(piece);
            } else {
              captures.white.push(piece);
            }
          }
        });

        return captures;
      };

      game.captures = calculateCaptures();
      games.set(gameId, game);

      // Emit move to all players in the game
      io.to(gameId).emit('moveMade', {
        position: game.position,
        moveHistory: game.moveHistory,
        captures: game.captures,
        clocks: game.clock
      });

      // If game is over, emit game over event
      if (gameStatus.isOver) {
        io.to(gameId).emit('game_update', {
          type: 'game_over',
          gameStatus
        });
      }

    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('error', 'Invalid move');
    }
  });

  socket.on('request_rematch', ({ gameId }) => {
    try {
      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      // Create a new game with players swapped
      const newGame: GameState = {
        gameId: uuidv4(),
        position: new Chess().fen(),
        status: 'active',
        turn: 'w',
        players: {
          white: game.players.black,
          black: game.players.white
        },
        spectators: [],
        moveHistory: [],
        captures: {
          white: [],
          black: []
        },
        positionHistory: [new Chess().fen()],
        lastActivityTime: Date.now(),
        createdAt: Date.now()
      };

      games.set(newGame.gameId, newGame);
      io.to(gameId).emit('rematchAccepted', newGame);
      
      // Move both players to the new game room
      if (game.players.white) io.sockets.sockets.get(game.players.white)?.join(newGame.gameId);
      if (game.players.black) io.sockets.sockets.get(game.players.black)?.join(newGame.gameId);
      
      // Delete the old game
      games.delete(gameId);
      logGameState('After Rematch Accept');
    } catch (error) {
      console.error('Error requesting rematch:', error);
      socket.emit('error', 'Failed to request rematch');
    }
  });

  socket.on('game_action', (data: { 
    type: string;
    gameId: string;
    player: 'white' | 'black';
  }) => {
    try {
      const game = games.get(data.gameId);
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      // Update activity time
      game.lastActivityTime = Date.now();

      switch (data.type) {
        case 'resign':
          game.status = 'completed';
          const winner = data.player === 'white' ? 'Black' : 'White';
          io.to(data.gameId).emit('game_update', {
            type: 'resign',
            player: data.player,
            winner
          });
          games.set(data.gameId, game);
          logGameState('Player Resigned');
          break;

        case 'leave_game':
          // Remove player from the game
          if (game.players.white === socket.id) {
            game.players.white = null;
          } else if (game.players.black === socket.id) {
            game.players.black = null;
          }
          socket.leave(data.gameId);
          
          // If both players are gone, mark game as completed
          if (!game.players.white && !game.players.black) {
            game.status = 'completed';
          }
          
          games.set(data.gameId, game);
          io.to(data.gameId).emit('opponent_left');
          logGameState('Player Left Game');
          break;
      }
    } catch (error) {
      console.error('Error handling game action:', error);
      socket.emit('error', 'Failed to process game action');
    }
  });

  socket.on('leaveGame', ({ gameId }) => {
    try {
      const game = games.get(gameId);
      if (!game) return;

      // Remove the player from the game
      if (game.players.white === socket.id) {
        game.players.white = null;
      } else if (game.players.black === socket.id) {
        game.players.black = null;
      }

      socket.leave(gameId);

      // If both players are gone, remove the game
      if (!game.players.white && !game.players.black) {
        games.delete(gameId);
      } else {
        game.status = 'waiting';
        games.set(gameId, game);
        io.to(gameId).emit('playerDisconnected', game);
      }
    } catch (error) {
      console.error('Error leaving game:', error);
      socket.emit('error', 'Failed to leave game');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    games.forEach((game, gameId) => {
      // Remove from spectators if they were a spectator
      const spectatorIndex = game.spectators.indexOf(socket.id);
      if (spectatorIndex !== -1) {
        game.spectators.splice(spectatorIndex, 1);
        io.to(gameId).emit('spectatorsUpdate', game.spectators.length);
        return;
      }

      // Handle player disconnect
      if (game.players.white === socket.id || game.players.black === socket.id) {
        if (game.status === 'active') {
          game.status = 'completed';
          const winner = game.players.white === socket.id ? 'black' : 'white';
          io.to(gameId).emit('gameOver', `${winner} wins by disconnect`);
        }
      }
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
