export type ReservationStatus = 'active' | 'consumed' | 'cancelled' | 'expired';

export type Reservation = {
  id: string;
  productId: string;
  branchId: string;
  sourceBranchId: string | null;
  sourceTerminalId: string | null;
  quantity: number | string;
  customerName: string | null;
  customerDoc: string | null;
  note: string | null;
  status: ReservationStatus;
  consumedSaleTicketId: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type ReservationFilters = {
  branchId?: string;
  status?: ReservationStatus;
};

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  active: 'Activa',
  consumed: 'Consumida',
  cancelled: 'Cancelada',
  expired: 'Vencida',
};
