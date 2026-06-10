import type { CxpStatus } from '../../model/types';

import Chip from '@mui/material/Chip';

const labelByStatus: Record<CxpStatus, string> = {
  open: 'Abierta',
  partial: 'Pagada parcial',
  paid: 'Pagada',
  cancelled: 'Cancelada',
};

const colorByStatus: Record<CxpStatus, 'default' | 'info' | 'success' | 'error'> = {
  open: 'default',
  partial: 'info',
  paid: 'success',
  cancelled: 'error',
};

export function StatusChip({ status }: { status: CxpStatus }) {
  return (
    <Chip
      size="small"
      color={colorByStatus[status]}
      variant="outlined"
      label={labelByStatus[status]}
      sx={{ fontWeight: 600 }}
    />
  );
}
