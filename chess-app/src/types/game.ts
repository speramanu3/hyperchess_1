export interface GameState {
  gameId: string;
  position: string;
  status: 'waiting' | 'active' | 'completed';
  turn: 'w' | 'b';
  players: {
    white: string;
    black: string;
  };
  moveHistory: string[];
  captures: {
    white: string[];
    black: string[];
  };
  result: string;
}

export interface Player {
  id: string;
  color: 'white' | 'black';
}

export interface GameMove {
  from: string;
  to: string;
  piece: string;
  color: 'w' | 'b';
  flags?: string;
  san?: string;
  captured?: string;
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

export interface GameStatus {
  isGameOver: boolean;
  message: string | null;
}

export interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  gameState: GameState | null;
  id: string | null;
  joinGame: (gameId: string) => void;
  makeMove: (gameId: string, move: string) => void;
  leaveGame: (gameId: string) => void;
}
