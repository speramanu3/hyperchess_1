"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const chess_js_1 = require("chess.js");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});
// Server configuration
const MAX_CONCURRENT_GAMES = 1000;
const MAX_SPECTATORS_PER_GAME = 50;
const GAME_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
const COMPLETED_GAME_EXPIRY_TIME = 1 * 60 * 60 * 1000; // 1 hour
const INACTIVE_GAME_EXPIRY_TIME = 6 * 60 * 60 * 1000; // 6 hours
const games = new Map();
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
const logGameState = (message) => {
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
            const gameId = (0, uuid_1.v4)();
            const now = Date.now();
            const newGame = {
                gameId,
                position: new chess_js_1.Chess().fen(),
                status: 'waiting',
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
                lastActivityTime: now,
                createdAt: now
            };
            games.set(gameId, newGame);
            socket.join(gameId);
            console.log('Game created:', gameId);
            io.to(gameId).emit('gameCreated', newGame);
            logGameState('Game Created');
        }
        catch (error) {
            console.error('Error creating game:', error);
            socket.emit('error', 'Failed to create game');
        }
    });
    socket.on('joinGame', (gameId) => {
        try {
            const game = games.get(gameId);
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }
            // Update activity time
            game.lastActivityTime = Date.now();
            // If player is already in the game (reconnecting)
            if (game.players.white === socket.id || game.players.black === socket.id) {
                socket.join(gameId);
                socket.emit('gameJoined', {
                    ...game,
                    role: game.players.white === socket.id ? 'white' : 'black'
                });
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
                socket.emit('gameJoined', {
                    ...game,
                    role: 'black'
                });
                io.to(gameId).emit('gameState', game);
                logGameState('Player Joined');
                return;
            }
            socket.emit('error', 'Unable to join game');
        }
        catch (error) {
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
            // Update activity time
            game.lastActivityTime = Date.now();
            const chess = new chess_js_1.Chess(game.position);
            // Check if it's the player's turn
            const isWhite = chess.turn() === 'w';
            if ((isWhite && game.players.white !== socket.id) ||
                (!isWhite && game.players.black !== socket.id)) {
                socket.emit('error', 'Not your turn');
                return;
            }
            // Get the piece at the target square before the move
            const targetSquare = chess.get(to);
            const move = chess.move({ from, to });
            if (!move) {
                socket.emit('error', 'Invalid move');
                return;
            }
            // Initialize captures if they don't exist
            if (!game.captures) {
                game.captures = {
                    white: [],
                    black: []
                };
            }
            // If there was a capture, add it to the appropriate list
            if (targetSquare) {
                const capturedPiece = `${targetSquare.type}_${targetSquare.color}`;
                if (isWhite) {
                    game.captures.white.push(capturedPiece);
                }
                else {
                    game.captures.black.push(capturedPiece);
                }
            }
            // Add the move to history
            if (!game.moveHistory) {
                game.moveHistory = [];
            }
            game.moveHistory.push(move.san);
            game.position = chess.fen();
            // Save updated game state
            games.set(gameId, game);
            // Emit move with updated state
            io.to(gameId).emit('moveMade', {
                from,
                to,
                position: game.position,
                moveHistory: game.moveHistory,
                captures: game.captures,
                status: game.status
            });
            // Check for game over conditions
            if (chess.isCheckmate()) {
                const winner = chess.turn() === 'w' ? 'black' : 'white';
                game.status = 'completed';
                games.set(gameId, game);
                io.to(gameId).emit('gameOver', winner);
            }
            else if (chess.isDraw()) {
                game.status = 'completed';
                games.set(gameId, game);
                io.to(gameId).emit('gameOver', 'draw');
            }
            logGameState('After Move');
        }
        catch (error) {
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
            const newGame = {
                gameId: (0, uuid_1.v4)(),
                position: new chess_js_1.Chess().fen(),
                status: 'active',
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
                lastActivityTime: Date.now(),
                createdAt: Date.now()
            };
            games.set(newGame.gameId, newGame);
            io.to(gameId).emit('rematchAccepted', newGame);
            // Move both players to the new game room
            if (game.players.white)
                io.sockets.sockets.get(game.players.white)?.join(newGame.gameId);
            if (game.players.black)
                io.sockets.sockets.get(game.players.black)?.join(newGame.gameId);
            // Delete the old game
            games.delete(gameId);
            logGameState('After Rematch Accept');
        }
        catch (error) {
            console.error('Error requesting rematch:', error);
            socket.emit('error', 'Failed to request rematch');
        }
    });
    socket.on('game_action', ({ type, gameId, move, player }) => {
        try {
            const game = games.get(gameId);
            if (!game) {
                console.log(`Game not found: ${gameId}`);
                return;
            }
            switch (type) {
                case 'move':
                    console.log(`Move in game ${gameId} by ${player}:`, move);
                    const chess = new chess_js_1.Chess(game.position);
                    // Get the piece at the target square before the move
                    const targetSquare = chess.get(move.to);
                    const result = chess.move({ from: move.from, to: move.to });
                    if (result) {
                        game.position = chess.fen();
                        // Initialize captures if they don't exist
                        if (!game.captures) {
                            game.captures = {
                                white: [],
                                black: []
                            };
                        }
                        // If there was a capture, add it to the appropriate list
                        if (targetSquare) {
                            const capturedPiece = `${targetSquare.type}_${targetSquare.color}`;
                            if (player === 'white') {
                                game.captures.white.push(capturedPiece);
                            }
                            else {
                                game.captures.black.push(capturedPiece);
                            }
                        }
                        // Check for checkmate or draw
                        let gameStatus = null;
                        if (chess.isCheckmate()) {
                            gameStatus = {
                                type: 'checkmate',
                                winner: player
                            };
                            game.status = 'completed';
                        }
                        else if (chess.isDraw()) {
                            gameStatus = {
                                type: 'draw'
                            };
                            game.status = 'completed';
                        }
                        // Send move update and game status if game is over
                        io.to(gameId).emit('game_update', {
                            type: 'move',
                            move,
                            position: game.position,
                            gameStatus,
                            captures: game.captures
                        });
                    }
                    logGameState('After Move');
                    break;
                case 'resign':
                    game.status = 'completed';
                    io.to(gameId).emit('game_update', {
                        type: 'resign',
                        player,
                        game
                    });
                    logGameState('After Resign');
                    break;
                case 'request_rematch':
                    io.to(gameId).emit('game_update', {
                        type: 'rematch_requested',
                        player,
                        game
                    });
                    logGameState('Rematch Requested');
                    break;
                case 'accept_rematch':
                    // Create a new game with players swapped
                    const newGameId = (0, uuid_1.v4)();
                    const newGame = {
                        gameId: newGameId,
                        position: new chess_js_1.Chess().fen(),
                        status: 'active',
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
                        lastActivityTime: Date.now(),
                        createdAt: Date.now()
                    };
                    games.set(newGameId, newGame);
                    // Move both players to the new game room
                    if (game.players.white) {
                        const whiteSocket = io.sockets.sockets.get(game.players.white);
                        if (whiteSocket) {
                            whiteSocket.leave(gameId);
                            whiteSocket.join(newGameId);
                        }
                    }
                    if (game.players.black) {
                        const blackSocket = io.sockets.sockets.get(game.players.black);
                        if (blackSocket) {
                            blackSocket.leave(gameId);
                            blackSocket.join(newGameId);
                        }
                    }
                    // Notify players about the accepted rematch with the new game state
                    io.to(gameId).emit('game_update', {
                        type: 'rematch_accepted',
                        gameId: newGameId,
                        game: newGame
                    });
                    // Delete the old game
                    games.delete(gameId);
                    logGameState('After Rematch Accept');
                    break;
                case 'decline_rematch':
                    // Notify both players about the declined rematch
                    io.to(gameId).emit('game_update', {
                        type: 'rematch_declined',
                        player,
                        gameId: gameId
                    });
                    break;
                case 'leave_game':
                    // Remove the player from the game
                    if (game.players.white === socket.id) {
                        game.players.white = null;
                    }
                    else if (game.players.black === socket.id) {
                        game.players.black = null;
                    }
                    socket.leave(gameId);
                    // If both players are gone, remove the game
                    if (!game.players.white && !game.players.black) {
                        games.delete(gameId);
                    }
                    else {
                        game.status = 'waiting';
                        games.set(gameId, game);
                        io.to(gameId).emit('game_update', {
                            type: 'player_left',
                            gameId: gameId
                        });
                    }
                    break;
            }
        }
        catch (error) {
            console.error('Error handling game action:', error);
            socket.emit('error', 'Failed to handle game action');
        }
    });
    socket.on('leaveGame', ({ gameId }) => {
        try {
            const game = games.get(gameId);
            if (!game)
                return;
            // Remove the player from the game
            if (game.players.white === socket.id) {
                game.players.white = null;
            }
            else if (game.players.black === socket.id) {
                game.players.black = null;
            }
            socket.leave(gameId);
            // If both players are gone, remove the game
            if (!game.players.white && !game.players.black) {
                games.delete(gameId);
            }
            else {
                game.status = 'waiting';
                games.set(gameId, game);
                io.to(gameId).emit('playerDisconnected', game);
            }
        }
        catch (error) {
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
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
