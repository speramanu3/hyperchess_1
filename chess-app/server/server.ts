import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Chess } from 'chess.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

interface GameState {
  gameId: string;
  position: string;
  status: 'waiting' | 'active' | 'completed';
  players: {
    white: string | null;
    black: string | null;
  };
}

const games = new Map<string, GameState>();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('createGame', () => {
    try {
      const gameId = uuidv4();
      const newGame: GameState = {
        gameId,
        position: new Chess().fen(),
        status: 'waiting',
        players: {
          white: socket.id,
          black: null
        }
      };
      
      games.set(gameId, newGame);
      socket.join(gameId);
      console.log('Game created:', gameId);
      io.to(gameId).emit('gameCreated', newGame);
    } catch (error) {
      console.error('Error creating game:', error);
      socket.emit('error', 'Failed to create game');
    }
  });

  socket.on('joinGame', (gameId: string) => {
    try {
      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      if (game.players.black) {
        socket.emit('error', 'Game is full');
        return;
      }

      game.players.black = socket.id;
      game.status = 'active';
      games.set(gameId, game);
      socket.join(gameId);
      
      io.to(gameId).emit('gameJoined', game);
      console.log('Player joined game:', gameId);
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
      
      // Check if it's the player's turn
      const isWhite = chess.turn() === 'w';
      if ((isWhite && game.players.white !== socket.id) || 
          (!isWhite && game.players.black !== socket.id)) {
        socket.emit('error', 'Not your turn');
        return;
      }

      const move = chess.move({ from, to });
      if (!move) {
        socket.emit('error', 'Invalid move');
        return;
      }

      game.position = chess.fen();
      games.set(gameId, game);

      io.to(gameId).emit('moveMade', { from, to, position: game.position });

      // Check for game over conditions
      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'w' ? 'black' : 'white';
        io.to(gameId).emit('gameOver', winner);
      } else if (chess.isDraw()) {
        io.to(gameId).emit('gameOver', 'draw');
      }
    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('error', 'Failed to make move');
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
        players: {
          white: game.players.black,
          black: game.players.white
        }
      };

      games.set(newGame.gameId, newGame);
      io.to(gameId).emit('rematchAccepted', newGame);
      
      // Move both players to the new game room
      if (game.players.white) io.sockets.sockets.get(game.players.white)?.join(newGame.gameId);
      if (game.players.black) io.sockets.sockets.get(game.players.black)?.join(newGame.gameId);
      
      // Delete the old game
      games.delete(gameId);
    } catch (error) {
      console.error('Error requesting rematch:', error);
      socket.emit('error', 'Failed to request rematch');
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
    // Find and handle any games this player was in
    games.forEach((game, gameId) => {
      if (game.players.white === socket.id || game.players.black === socket.id) {
        if (game.players.white === socket.id) {
          game.players.white = null;
        } else {
          game.players.black = null;
        }

        if (!game.players.white && !game.players.black) {
          games.delete(gameId);
        } else {
          game.status = 'waiting';
          games.set(gameId, game);
          io.to(gameId).emit('playerDisconnected', game);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
