import type { AgingBucket } from '../../model/types';

import Chip from '@mui/material/Chip';

const labelByBucket: Record<AgingBucket, string> = {
  current: 'Al día',
  overdue_1_30: '1–30 d',
  overdue_31_60: '31–60 d',
  overdue_61_90: '61–90 d',
  overdue_90_plus: '90+ d',
};

const colorByBucket: Record<AgingBucket, 'success' | 'info' | 'warning' | 'error'> = {
  current: 'success',
  overdue_1_30: 'info',
  overdue_31_60: 'warning',
  overdue_61_90: 'error',
  overdue_90_plus: 'error',
};

export function AgingChip({ bucket, days }: { bucket: AgingBucket; days?: number }) {
  const label =
    days && days > 0 && bucket !== 'current'
      ? `${labelByBucket[bucket]} (${days})`
      : labelByBucket[bucket];
  return (
    <Chip
      size="small"
      color={colorByBucket[bucket]}
      variant={bucket === 'current' ? 'outlined' : 'filled'}
      label={label}
      sx={{ fontWeight: 600 }}
    />
  );
}
