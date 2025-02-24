import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';

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

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Match client configuration
  pingTimeout: 60000,
  pingInterval: 25000,
  allowUpgrades: true, // Allow transport upgrades
  upgradeTimeout: 10000 // Give more time for upgrades
});

const games = new Map();

// Apply CORS middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    transport: io.engine.opts.transports.join(',')
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

io.engine.on('initial_headers', (headers, req) => {
  console.log('Initial headers:', headers);
});

io.on('connection', (socket) => {
  console.log('Client connected:', {
    id: socket.id,
    transport: socket.conn.transport.name,
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
      id: gameId,
      position: new Chess().fen(),
      status: 'waiting',
      turn: 'w',
      players: {
        white: socket.id,
        black: null
      },
      moveHistory: [],
      captures: {
        white: [],
        black: []
      }
    };
    games.set(gameId, game);
    socket.join(gameId);
    socket.emit('gameCreated', game);
  });

  socket.on('joinGame', (gameId) => {
    console.log('Player joining game:', {
      clientId: socket.id,
      gameId
    });
    
    socket.join(gameId);
    
    if (!games.has(gameId)) {
      games.set(gameId, new Chess());
      console.log('New game created:', gameId);
    }
    
    const game = games.get(gameId);
    io.to(gameId).emit('gameState', {
      fen: game.fen(),
      turn: game.turn(),
      gameOver: game.isGameOver()
    });
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
        game.move(move);
        io.to(gameId).emit('gameState', {
          fen: game.fen(),
          turn: game.turn(),
          gameOver: game.isGameOver()
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

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server configuration:', {
    allowedOrigins,
    socketTransports: io.engine.opts.transports,
    clientCount: io.engine.clientsCount,
    pingInterval: io.engine.opts.pingInterval,
    pingTimeout: io.engine.opts.pingTimeout
  });
});
