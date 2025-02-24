import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { StockfishEvaluation } from '../hooks/useStockfish';

interface EvaluationDisplayProps {
  evaluation: StockfishEvaluation;
}

const EvaluationDisplay: React.FC<EvaluationDisplayProps> = ({ evaluation }) => {
  const displayEvaluation = () => {
    if (!evaluation) return '0.0';
    if (evaluation.isMate) {
      return evaluation.score === Infinity ? 'Mate' : '-Mate';
    }
    return evaluation.score.toFixed(1);
  };

  return (
    <Box sx={{ textAlign: 'center', color: 'white' }}>
      <Typography variant="h4" component="div">
        {displayEvaluation()}
      </Typography>
      <Typography variant="body1" component="div">
        Depth: {evaluation?.depth || 0}
      </Typography>
      {evaluation?.thinking && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <CircularProgress size={20} color="info" />
        </Box>
      )}
      {evaluation?.bestLine && (
        <Typography variant="body2" component="div" sx={{ mt: 1 }}>
          Best line: {evaluation.bestLine}
        </Typography>
      )}
    </Box>
  );
};

export default EvaluationDisplay;
