export interface GameState {
  gameId: string;
  position: string;
  status: 'waiting' | 'active' | 'completed';
  players: {
    white: string | null;
    black: string | null;
  };
}

export interface GameMove {
  from: string;
  to: string;
  position: string;
  status: GameState['status'];
}
