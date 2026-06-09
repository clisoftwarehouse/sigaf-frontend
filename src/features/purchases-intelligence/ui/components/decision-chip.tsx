import type { SuggestionDecision } from '../../model/types';

import Chip from '@mui/material/Chip';

const labelByDecision: Record<SuggestionDecision, string> = {
  buy_urgent: 'Comprar urgente',
  buy: 'Comprar',
  buy_moderate: 'Comprar moderado',
  no_buy: 'No comprar',
  review: 'Revisar',
  dynamize_candidate: 'Dinamizar',
  decode_candidate: 'Descodificar',
  blocked_expiry: 'Bloqueado por vencimiento',
};

const colorByDecision: Record<SuggestionDecision, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  buy_urgent: 'error',
  buy: 'success',
  buy_moderate: 'info',
  no_buy: 'default',
  review: 'warning',
  dynamize_candidate: 'warning',
  decode_candidate: 'error',
  blocked_expiry: 'error',
};

export function DecisionChip({ decision }: { decision: SuggestionDecision }) {
  return (
    <Chip
      size="small"
      color={colorByDecision[decision]}
      variant="outlined"
      label={labelByDecision[decision]}
      sx={{ fontWeight: 600 }}
    />
  );
}
