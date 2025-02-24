export type GameStatus = 'waiting' | 'active' | 'completed' | 'resigned';

export interface GameState {
  gameId: string;
  position: string;
  turn: 'w' | 'b';
  status: GameStatus;
  result?: string;
  players: {
    white: string | null;
    black: string | null;
  };
  moveHistory?: string[];
  captures?: {
    white: string[];
    black: string[];
  };
}

export interface GameMove {
  from: string;
  to: string;
}

export type GameResult = 
  | 'Checkmate! White wins!'
  | 'Checkmate! Black wins!'
  | 'Draw by stalemate!'
  | 'Draw by threefold repetition!'
  | 'Draw by insufficient material!'
  | 'Draw!'
  | 'White resigned'
  | 'Black resigned';
