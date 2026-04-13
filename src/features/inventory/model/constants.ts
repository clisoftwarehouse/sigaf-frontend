import type {
  LotStatus,
  StockStatus,
  ExpirySignal,
  AdjustmentType,
  AcquisitionType,
} from './types';

// ----------------------------------------------------------------------

export const LOT_STATUS_OPTIONS: { value: LotStatus; label: string }[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'quarantine', label: 'Cuarentena' },
  { value: 'expired', label: 'Vencido' },
  { value: 'returned', label: 'Devuelto' },
  { value: 'depleted', label: 'Agotado' },
];

export const LOT_STATUS_LABEL: Record<LotStatus, string> = LOT_STATUS_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<LotStatus, string>
);

export const ACQUISITION_OPTIONS: { value: AcquisitionType; label: string }[] = [
  { value: 'purchase', label: 'Compra' },
  { value: 'consignment', label: 'Consignación' },
];

// ----------------------------------------------------------------------

export const EXPIRY_SIGNAL_OPTIONS: { value: ExpirySignal; label: string }[] = [
  { value: 'EXPIRED', label: 'Vencido (ya pasó)' },
  { value: 'RED', label: '≤ 30 días' },
  { value: 'YELLOW', label: '31-60 días' },
  { value: 'ORANGE', label: '61-90 días' },
  { value: 'GREEN', label: '> 90 días' },
];

export const EXPIRY_SIGNAL_LABEL: Record<ExpirySignal, string> = {
  EXPIRED: 'Vencido',
  RED: '≤ 30 días',
  YELLOW: '31-60 días',
  ORANGE: '61-90 días',
  GREEN: '> 90 días',
};

/** Maps to MUI Chip `color` prop. `default` is used for GREEN (no alarm). */
export const EXPIRY_SIGNAL_COLOR: Record<
  ExpirySignal,
  'default' | 'error' | 'warning' | 'info' | 'success'
> = {
  EXPIRED: 'error',
  RED: 'error',
  YELLOW: 'warning',
  ORANGE: 'info',
  GREEN: 'success',
};

// ----------------------------------------------------------------------

export const ADJUSTMENT_TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: 'damage', label: 'Daño / merma' },
  { value: 'correction', label: 'Corrección' },
  { value: 'count_difference', label: 'Diferencia de conteo' },
  { value: 'expiry_write_off', label: 'Baja por vencimiento' },
];

export const ADJUSTMENT_TYPE_LABEL: Record<AdjustmentType, string> = ADJUSTMENT_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<AdjustmentType, string>
);

// ----------------------------------------------------------------------

export const STOCK_STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Bajo (≤ 10)' },
  { value: 'out', label: 'Agotado' },
];

// ----------------------------------------------------------------------

export const KARDEX_MOVEMENT_LABEL: Record<string, string> = {
  purchase_entry: 'Entrada por compra',
  consignment_entry: 'Entrada por consignación',
  sale: 'Venta',
  return: 'Devolución',
  adjustment_in: 'Ajuste (entrada)',
  adjustment_out: 'Ajuste (salida)',
  transfer_in: 'Transferencia (entrada)',
  transfer_out: 'Transferencia (salida)',
  expiry_write_off: 'Baja por vencimiento',
  damage: 'Daño',
};

export function labelForMovement(type: string): string {
  return KARDEX_MOVEMENT_LABEL[type] ?? type;
}
