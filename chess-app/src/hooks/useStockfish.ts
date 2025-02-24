import { useEffect, useRef, useState } from 'react';

export interface StockfishEvaluation {
  score: number;
  depth: number;
  bestMove: string | null;
  thinking: boolean;
  isMate: boolean;
  bestLine: string | null;
}

export const useStockfish = () => {
  const engineRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<StockfishEvaluation>({
    score: 0,
    depth: 0,
    bestMove: null,
    thinking: false,
    isMate: false,
    bestLine: null
  });

  // Handle messages from the engine
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;
    console.log('Stockfish message:', message);

    if (message.startsWith('info')) {
      // Parse depth
      const depthMatch = message.match(/depth (\d+)/);
      const scoreMatch = message.match(/score cp (-?\d+)/);
      const mateMatch = message.match(/score mate (-?\d+)/);
      const pv = message.match(/pv (.+?)(?=\s+(?:bmc|hashfull|nps)|$)/);

      if (depthMatch) {
        const depth = parseInt(depthMatch[1]);
        let score: number | null = null;
        let isMate = false;

        if (scoreMatch) {
          score = parseInt(scoreMatch[1]) / 100;
        } else if (mateMatch) {
          score = mateMatch[1].startsWith('-') ? -Infinity : Infinity;
          isMate = true;
        }

        if (score !== null) {
          setCurrentEvaluation(prev => ({
            ...prev,
            depth,
            score: score as number,
            isMate,
            thinking: depth < 20,
            bestLine: pv ? pv[1] : prev.bestLine
          }));

          // Stop evaluation when we reach depth 20
          if (depth >= 20 && engineRef.current) {
            console.log('Reached target depth 20, stopping evaluation');
            engineRef.current.postMessage('stop');
          }
        }
      }
    } else if (message.startsWith('bestmove')) {
      const bestMove = message.split(' ')[1];
      setCurrentEvaluation(prev => ({
        ...prev,
        thinking: false,
        bestMove
      }));
    } else if (message === 'uciok') {
      setIsReady(true);
      engineRef.current?.postMessage('setoption name MultiPV value 1');
      engineRef.current?.postMessage('setoption name Threads value 1');
      engineRef.current?.postMessage('setoption name Hash value 16');
    } else if (message === 'readyok') {
      console.log('Stockfish engine ready');
    }
  };

  // Initialize engine
  useEffect(() => {
    const worker = new Worker('/stockfish/stockfish.js');
    engineRef.current = worker;
    worker.onmessage = handleMessage;
    worker.postMessage('uci');
    worker.postMessage('isready');
    
    return () => {
      worker.terminate();
      engineRef.current = null;
    };
  }, []);

  const evaluatePosition = (fen: string) => {
    if (!isReady || !engineRef.current) {
      console.log('[Stockfish] Engine not ready for evaluation');
      return;
    }

    console.log('[Stockfish] Starting evaluation:', {
      position: fen,
      engineReady: isReady,
      currentState: currentEvaluation
    });
    
    // Reset evaluation state
    setCurrentEvaluation(prev => {
      console.log('[Stockfish] Resetting evaluation state');
      return {
        ...prev,
        thinking: true,
        depth: 0,
        bestMove: null,
        bestLine: null
      };
    });
    
    // Clear any previous position and set the new one
    try {
      console.log('[Stockfish] Stopping previous analysis');
      engineRef.current.postMessage('stop');
      
      console.log('[Stockfish] Setting new position:', fen);
      engineRef.current.postMessage('position fen ' + fen);
      
      // Start the analysis with max depth 20
      console.log('[Stockfish] Starting analysis with depth 20');
      engineRef.current.postMessage('go depth 20');
    } catch (error) {
      console.error('[Stockfish] Error during evaluation:', error);
    }
  };

  const stopEvaluation = () => {
    if (!engineRef.current) {
      console.log('[Stockfish] No engine instance to stop');
      return;
    }
    
    console.log('[Stockfish] Stopping current evaluation');
    try {
      engineRef.current.postMessage('stop');
      setCurrentEvaluation(prev => {
        console.log('[Stockfish] Marking evaluation as stopped');
        return {
          ...prev,
          thinking: false
        };
      });
    } catch (error) {
      console.error('[Stockfish] Error stopping evaluation:', error);
    }
  };

  return {
    currentEvaluation,
    evaluatePosition,
    stopEvaluation,
    isReady
  };
};
