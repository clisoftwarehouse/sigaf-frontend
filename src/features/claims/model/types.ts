export type ClaimType = 'quality' | 'quantity' | 'price_mismatch' | 'other';
export type ClaimStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

export type SupplierClaim = {
  id: string;
  claimNumber: string;
  supplierId: string;
  receiptId: string | null;
  branchId: string | null;
  claimType: ClaimType;
  status: ClaimStatus;
  title: string;
  description: string;
  amountUsd: number | string | null;
  resolutionNotes: string | null;
  createdBy: string;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type CreateClaimPayload = {
  supplierId: string;
  receiptId?: string;
  branchId?: string;
  claimType: ClaimType;
  title: string;
  description: string;
  amountUsd?: number;
};

export type UpdateClaimPayload = {
  status?: ClaimStatus;
  title?: string;
  description?: string;
  resolutionNotes?: string;
  amountUsd?: number;
};

export type ClaimFilters = {
  supplierId?: string;
  receiptId?: string;
  branchId?: string;
  claimType?: ClaimType;
  status?: ClaimStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
