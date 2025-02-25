import { WebSocketServer } from 'ws';
import { Chess } from 'chess.js';
import { randomUUID } from 'crypto';
import { GameState, Client, GameEvent, ServerEvent } from './types';

const PORT = process.env.PORT || 3002;
const PING_INTERVAL = 30000; // 30 seconds
const CLIENT_TIMEOUT = 60000; // 60 seconds

const wss = new WebSocketServer({ port: Number(PORT) });
const games = new Map<string, GameState>();
const clients = new Map<string, Client>();

// Clean up inactive games periodically
setInterval(() => {
  const now = Date.now();
  for (const [gameId, game] of games) {
    if (now - game.lastActivity > CLIENT_TIMEOUT) {
      games.delete(gameId);
      console.log(`Game ${gameId} cleaned up due to inactivity`);
    }
  }
}, CLIENT_TIMEOUT);

// Send ping to all clients periodically
setInterval(() => {
  const now = Date.now();
  for (const [clientId, client] of clients) {
    if (client.lastPing && now - client.lastPing > CLIENT_TIMEOUT) {
      client.ws.terminate();
      clients.delete(clientId);
      console.log(`Client ${clientId} terminated due to inactivity`);
      continue;
    }
    
    const message: ServerEvent = { type: 'ping' };
    client.ws.send(JSON.stringify(message));
  }
}, PING_INTERVAL);

function broadcastGameState(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  const message: ServerEvent = {
    type: 'gameState',
    gameId,
    state: {
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      gameOver: game.chess.isGameOver()
    }
  };

  const gameClients = Array.from(clients.values())
    .filter(client => client.gameId === gameId);

  for (const client of gameClients) {
    client.ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  const clientId = randomUUID();
  clients.set(clientId, { id: clientId, ws });
  console.log(`Client ${clientId} connected`);

  ws.on('message', (data) => {
    try {
      const event: GameEvent = JSON.parse(data.toString());
      const client = clients.get(clientId);
      if (!client) return;

      switch (event.type) {
        case 'join': {
          let game = games.get(event.gameId);
          if (!game) {
            game = {
              id: event.gameId,
              chess: new Chess(),
              players: { white: null, black: null },
              spectators: new Set(),
              lastActivity: Date.now()
            };
            games.set(event.gameId, game);
          }

          client.gameId = event.gameId;
          
          if (!game.players.white) {
            game.players.white = clientId;
          } else if (!game.players.black) {
            game.players.black = clientId;
          } else {
            game.spectators.add(clientId);
          }

          game.lastActivity = Date.now();
          broadcastGameState(event.gameId);
          break;
        }

        case 'move': {
          const game = games.get(event.gameId);
          if (!game) return;

          // Verify it's the player's turn
          const isWhite = game.players.white === clientId;
          const isBlack = game.players.black === clientId;
          if (!isWhite && !isBlack) return;
          if ((game.chess.turn() === 'w' && !isWhite) || 
              (game.chess.turn() === 'b' && !isBlack)) {
            const error: ServerEvent = { 
              type: 'error', 
              message: 'Not your turn' 
            };
            ws.send(JSON.stringify(error));
            return;
          }

          try {
            game.chess.move(event.move);
            game.lastActivity = Date.now();
            broadcastGameState(event.gameId);
          } catch (e) {
            const error: ServerEvent = { 
              type: 'error', 
              message: 'Invalid move' 
            };
            ws.send(JSON.stringify(error));
          }
          break;
        }

        case 'pong': {
          client.lastPing = Date.now();
          break;
        }
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    const client = clients.get(clientId);
    if (client?.gameId) {
      const game = games.get(client.gameId);
      if (game) {
        if (game.players.white === clientId) {
          game.players.white = null;
        } else if (game.players.black === clientId) {
          game.players.black = null;
        } else {
          game.spectators.delete(clientId);
        }
        broadcastGameState(client.gameId);
      }
    }
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  });
});

console.log(`WebSocket server running on port ${PORT}`);
