import type { AbcdClass } from '../../model/types';

import Chip from '@mui/material/Chip';

const colorByClass: Record<AbcdClass, 'success' | 'info' | 'warning' | 'error'> = {
  A: 'success',
  B: 'info',
  C: 'warning',
  D: 'error',
};

export function AbcdChip({ abcd, isPareto = false }: { abcd: AbcdClass; isPareto?: boolean }) {
  return (
    <Chip
      size="small"
      color={colorByClass[abcd]}
      variant="filled"
      label={isPareto ? `${abcd} · Pareto` : abcd}
      sx={{ fontWeight: 700, minWidth: 36 }}
    />
  );
}
