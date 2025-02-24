declare module 'stockfish' {
  interface StockfishInstance {
    postMessage(message: string): void;
    onmessage: (event: { data: string }) => void;
  }

  export default function(): StockfishInstance;
}
