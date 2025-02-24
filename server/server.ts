import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  allowEIO3: true
});

const games = new Map();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['*']
}));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

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
    const game = games.get(gameId);
    if (game && !game.players.black) {
      game.players.black = socket.id;
      game.status = 'playing';
      socket.join(gameId);
      io.to(gameId).emit('gameJoined', game);
    }
  });

  socket.on('move', (data) => {
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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    games.forEach((game, gameId) => {
      if (game.players.white === socket.id || game.players.black === socket.id) {
        io.to(gameId).emit('playerLeft');
        games.delete(gameId);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
