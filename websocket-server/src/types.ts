import { Chess } from 'chess.js';
import { WebSocket } from 'ws';

export interface GameState {
  id: string;
  chess: Chess;
  players: {
    white: string | null;
    black: string | null;
  };
  spectators: Set<string>;
  lastActivity: number;
}

export interface Client {
  id: string;
  ws: WebSocket;
  gameId?: string;
  lastPing?: number;
}

export type GameEvent = 
  | { type: 'join'; gameId: string }
  | { type: 'move'; gameId: string; move: string }
  | { type: 'leave'; gameId: string }
  | { type: 'pong' };

export type ServerEvent =
  | { type: 'gameState'; gameId: string; state: { fen: string; turn: string; gameOver: boolean } }
  | { type: 'error'; message: string }
  | { type: 'ping' };
