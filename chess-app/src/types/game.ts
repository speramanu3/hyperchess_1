import { GameState } from '../hooks/useGameState';

export interface GameState {
  gameId: string;
  position: string;
  turn: 'w' | 'b';
  players: {
    white: string | null;
    black: string | null;
  };
  moveHistory: string[];
  status: 'waiting' | 'active' | 'completed';
  result?: string;
  captures: {
    white: string[];
    black: string[];
  };
}

export interface GameMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface Player {
  id: string;
  name: string;
  color: 'white' | 'black';
}

export interface GameRoom {
  id: string;
  players: {
    white: Player | null;
    black: Player | null;
  };
  spectators: Player[];
  gameState: GameState;
}

export interface WebSocketState {
  isConnected: boolean;
  gameState: GameState | null;
  error: string | null;
  id: string | null;
  joinGame: (gameId: string) => void;
  makeMove: (gameId: string, move: string) => void;
  leaveGame: (gameId: string) => void;
}
