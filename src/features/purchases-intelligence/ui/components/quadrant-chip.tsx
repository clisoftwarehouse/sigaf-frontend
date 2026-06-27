import type { ProfitabilityQuadrant } from '../../model/types';

import Chip from '@mui/material/Chip';

// ----------------------------------------------------------------------

const QUADRANT: Record<
  ProfitabilityQuadrant,
  { label: string; color: 'success' | 'info' | 'warning' | 'error' | 'default'; emoji: string }
> = {
  star: { label: 'Estrella', color: 'success', emoji: '⭐' },
  niche: { label: 'Nicho', color: 'info', emoji: '💎' },
  traffic: { label: 'Tráfico', color: 'warning', emoji: '🚚' },
  dog: { label: 'Perro', color: 'error', emoji: '🐕' },
  no_sales: { label: 'Sin ventas', color: 'default', emoji: '—' },
};

export const QUADRANT_META = QUADRANT;

export function QuadrantChip({ quadrant }: { quadrant: ProfitabilityQuadrant }) {
  const q = QUADRANT[quadrant];
  return (
    <Chip
      size="small"
      color={q.color}
      variant={quadrant === 'no_sales' ? 'outlined' : 'filled'}
      label={`${q.emoji} ${q.label}`}
      sx={{ fontWeight: 600 }}
    />
  );
}
