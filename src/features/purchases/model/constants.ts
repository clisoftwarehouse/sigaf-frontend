import type { OrderType, OrderStatus, ReceiptType } from './types';

// ----------------------------------------------------------------------

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'sent', label: 'Enviada' },
  { value: 'partial', label: 'Parcial' },
  { value: 'complete', label: 'Completa' },
  { value: 'cancelled', label: 'Cancelada' },
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = ORDER_STATUS_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<OrderStatus, string>
);

export const ORDER_STATUS_COLOR: Record<
  OrderStatus,
  'default' | 'info' | 'warning' | 'success' | 'error'
> = {
  draft: 'default',
  sent: 'info',
  partial: 'warning',
  complete: 'success',
  cancelled: 'error',
};

export const ORDER_TYPE_OPTIONS: { value: OrderType; label: string }[] = [
  { value: 'purchase', label: 'Compra' },
  { value: 'consignment', label: 'Consignación' },
];

export const RECEIPT_TYPE_OPTIONS: { value: ReceiptType; label: string }[] = [
  { value: 'purchase', label: 'Compra' },
  { value: 'consignment', label: 'Consignación' },
];
