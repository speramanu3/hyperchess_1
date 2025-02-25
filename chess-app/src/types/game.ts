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
  status: 'active' | 'completed';
  result?: string;
  captures: {
    white: string[];
    black: string[];
  };
}

export type { GameState };

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
