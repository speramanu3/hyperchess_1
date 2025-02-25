import { GameState } from '../hooks/useGameState';

export type { GameState };

export interface GameMove {
  from: string;
  to: string;
}

export interface Player {
  id: string;
  name: string;
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
