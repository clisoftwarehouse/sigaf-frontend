import type { TransferType, TransferStatus } from '../../model/types';

import Chip from '@mui/material/Chip';

// ----------------------------------------------------------------------

const STATUS_MAP: Record<TransferStatus, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  draft: { label: 'Borrador', color: 'default' },
  in_transit: { label: 'En tránsito', color: 'info' },
  completed: { label: 'Completada', color: 'success' },
  cancelled: { label: 'Cancelada', color: 'error' },
};

const TYPE_MAP: Record<TransferType, { label: string; color: 'default' | 'info' | 'success' }> = {
  inter_branch: { label: 'Entre sucursales', color: 'info' },
  intra_branch: { label: 'Entre almacenes', color: 'success' },
};

export function StatusChip({ status }: { status: TransferStatus }) {
  const c = STATUS_MAP[status];
  return <Chip size="small" color={c.color} label={c.label} />;
}

export function TypeChip({ type }: { type: TransferType }) {
  const c = TYPE_MAP[type];
  return <Chip size="small" variant="outlined" color={c.color} label={c.label} />;
}
