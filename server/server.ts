import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';

interface GameState {
  chess: Chess;
  players: {
    white: string | null;
    black: string | null;
  };
}

interface ServerToClientEvents {
  gameState: (state: { fen: string; turn: string; gameOver: boolean }) => void;
  error: (message: string) => void;
  playerLeft: () => void;
}

interface ClientToServerEvents {
  joinGame: (gameId: string) => void;
  move: (data: { gameId: string; move: any }) => void;
  createGame: () => void;
}

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;

// Get allowed origins from environment variable or use default
const allowedOrigins = [
  'https://hyperchess-1-emri86aql-sujay-peramanus-projects.vercel.app',
  'http://localhost:3000'
];

console.log('Starting server with configuration:', {
  port: PORT,
  allowedOrigins,
  nodeEnv: process.env.NODE_ENV
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowUpgrades: true,
  upgradeTimeout: 10000
});

const games = new Map<string, GameState>();

// Apply CORS middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Health check endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    transport: 'polling/websocket'
  });
});

// Socket.IO connection handling
io.engine.on('connection_error', (err) => {
  console.error('Connection error:', {
    code: err.code,
    message: err.message,
    context: err.context
  });
});

io.engine.on('initial_headers', (headers: any) => {
  console.log('Initial headers:', headers);
});

io.on('connection', (socket: Socket) => {
  const transport = socket.conn.transport?.name || 'unknown';
  
  console.log('Client connected:', {
    id: socket.id,
    transport,
    query: socket.handshake.query
  });

  socket.conn.on('upgrade', (transport) => {
    console.log('Transport upgraded for client:', {
      clientId: socket.id,
      transport: transport.name
    });
  });

  socket.on('error', (error) => {
    console.error('Socket error:', {
      clientId: socket.id,
      error
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', {
      id: socket.id,
      reason,
      transport: socket.conn.transport?.name
    });
    
    // Clean up any games this player was in
    games.forEach((game, gameId) => {
      if (game.players.white === socket.id || game.players.black === socket.id) {
        io.to(gameId).emit('playerLeft');
        games.delete(gameId);
      }
    });
  });

  socket.on('createGame', () => {
    const gameId = Math.random().toString(36).substring(7);
    const game = {
      chess: new Chess(),
      players: {
        white: socket.id,
        black: null
      }
    };
    games.set(gameId, game);
    socket.join(gameId);
    socket.emit('gameCreated', game);
  });

  socket.on('joinGame', (gameId: string) => {
    console.log('Player joining game:', {
      clientId: socket.id,
      gameId
    });
    
    socket.join(gameId);
    
    if (!games.has(gameId)) {
      games.set(gameId, {
        chess: new Chess(),
        players: {
          white: socket.id,
          black: null
        }
      });
      console.log('New game created:', gameId);
    } else {
      const game = games.get(gameId);
      if (game && !game.players.black) {
        game.players.black = socket.id;
      }
    }
    
    const game = games.get(gameId);
    if (game) {
      io.to(gameId).emit('gameState', {
        fen: game.chess.fen(),
        turn: game.chess.turn(),
        gameOver: game.chess.isGameOver()
      });
    }
  });

  socket.on('move', ({ gameId, move }) => {
    console.log('Move received:', {
      clientId: socket.id,
      gameId,
      move
    });
    
    const game = games.get(gameId);
    if (game) {
      try {
        game.chess.move(move);
        io.to(gameId).emit('gameState', {
          fen: game.chess.fen(),
          turn: game.chess.turn(),
          gameOver: game.chess.isGameOver()
        });
      } catch (e) {
        console.error('Invalid move:', {
          clientId: socket.id,
          gameId,
          move,
          error: e
        });
        socket.emit('error', 'Invalid move');
      }
    }
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

httpServer.listen(PORT, () => {
  const transports = ['polling', 'websocket'];
  console.log(`Server running on port ${PORT}`);
  console.log('Server configuration:', {
    allowedOrigins,
    socketTransports: transports,
    clientCount: io.engine.clientsCount,
    pingInterval: 25000,
    pingTimeout: 60000
  });
});
