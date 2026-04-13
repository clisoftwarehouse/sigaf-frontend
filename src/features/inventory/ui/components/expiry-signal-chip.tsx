import type { ExpirySignal } from '../../model/types';

import Chip from '@mui/material/Chip';

import { EXPIRY_SIGNAL_COLOR, EXPIRY_SIGNAL_LABEL } from '../../model/constants';

// ----------------------------------------------------------------------

type Props = {
  signal: ExpirySignal;
  size?: 'small' | 'medium';
};

export function ExpirySignalChip({ signal, size = 'small' }: Props) {
  return (
    <Chip
      size={size}
      color={EXPIRY_SIGNAL_COLOR[signal]}
      label={EXPIRY_SIGNAL_LABEL[signal]}
      variant={signal === 'GREEN' ? 'outlined' : 'filled'}
    />
  );
}
