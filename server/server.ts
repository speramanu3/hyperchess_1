import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;

// Get allowed origins from environment variable or use default
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['https://hyperchess-1-emri86aql-sujay-peramanus-projects.vercel.app', 'http://localhost:3000'];

console.log('Allowed origins:', allowedOrigins);

const io = new Server(httpServer, {
  path: '/socket.io/',
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
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
  res.send('Chess server is running');
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
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
    console.log('Player joining game:', gameId);
    const game = games.get(gameId);
    if (game && !game.players.black) {
      game.players.black = socket.id;
      game.status = 'playing';
      socket.join(gameId);
      io.to(gameId).emit('gameJoined', game);
    }
  });

  socket.on('move', (data) => {
    console.log('Move received:', data.gameId, data.move);
    const game = games.get(data.gameId);
    if (game) {
      game.position = data.position;
      game.turn = data.turn;
      game.moveHistory = data.moveHistory;
      game.captures = data.captures;
      io.to(data.gameId).emit('moveMade', {
        position: data.position,
        turn: data.turn,
        moveHistory: data.moveHistory,
        captures: data.captures
      });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server configuration:', {
    allowedOrigins,
    socketPath: io.path(),
    transports: io.engine.opts.transports
  });
});
