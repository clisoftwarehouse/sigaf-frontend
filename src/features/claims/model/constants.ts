import type { ClaimType, ClaimStatus } from './types';

export const CLAIM_TYPE_LABEL: Record<ClaimType, string> = {
  quality: 'Calidad',
  quantity: 'Cantidad',
  price_mismatch: 'Precio',
  other: 'Otro',
};

export const CLAIM_TYPE_OPTIONS: { value: ClaimType; label: string }[] = [
  { value: 'quality', label: 'Calidad' },
  { value: 'quantity', label: 'Cantidad' },
  { value: 'price_mismatch', label: 'Precio' },
  { value: 'other', label: 'Otro' },
];

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  open: 'Abierto',
  in_progress: 'En proceso',
  resolved: 'Resuelto',
  rejected: 'Rechazado',
};

export const CLAIM_STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'rejected', label: 'Rechazado' },
];

export const CLAIM_STATUS_COLOR: Record<
  ClaimStatus,
  'default' | 'info' | 'success' | 'error' | 'warning'
> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  rejected: 'error',
};
