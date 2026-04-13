import type { ConsignmentStatus, LiquidationStatus } from './types';

// ----------------------------------------------------------------------

export const CONSIGNMENT_STATUS_OPTIONS: { value: ConsignmentStatus; label: string }[] = [
  { value: 'active', label: 'Activa' },
  { value: 'liquidated', label: 'Liquidada' },
  { value: 'returned', label: 'Devuelta' },
  { value: 'closed', label: 'Cerrada' },
];

export const CONSIGNMENT_STATUS_COLOR: Record<
  ConsignmentStatus,
  'default' | 'info' | 'success' | 'warning'
> = {
  active: 'info',
  liquidated: 'success',
  returned: 'warning',
  closed: 'default',
};

export const LIQUIDATION_STATUS_OPTIONS: { value: LiquidationStatus; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'paid', label: 'Pagada' },
];

export const LIQUIDATION_STATUS_COLOR: Record<
  LiquidationStatus,
  'default' | 'info' | 'success'
> = {
  draft: 'default',
  approved: 'info',
  paid: 'success',
};

export const CONSIGNMENT_RETURN_REASONS = [
  { value: 'expired', label: 'Vencimiento' },
  { value: 'damaged', label: 'Dañado' },
  { value: 'no_sale', label: 'No se vendió' },
  { value: 'other', label: 'Otro' },
];
