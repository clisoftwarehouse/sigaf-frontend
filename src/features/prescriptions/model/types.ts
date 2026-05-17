export const PRESCRIPTION_STATUSES = [
  'active',
  'partially_dispensed',
  'fully_dispensed',
  'expired',
  'cancelled',
] as const;
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

export type PrescriptionItem = {
  id: string;
  prescriptionId: string;
  productId: string;
  product?: {
    id: string;
    description: string;
    shortName: string | null;
    ean: string | null;
    internalCode: string | null;
  } | null;
  quantityPrescribed: number | string;
  quantityDispensed: number | string;
  posology: string | null;
  notes: string | null;
};

export type PrescriptionCustomer = {
  id: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
};

export type Prescription = {
  id: string;
  customerId: string;
  customer?: PrescriptionCustomer | null;
  doctorName: string;
  doctorIdNumber: string | null;
  prescriptionNumber: string | null;
  issuedAt: string;
  expiresAt: string | null;
  status: PrescriptionStatus;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  items: PrescriptionItem[];
};

export type PrescriptionsListResponse = {
  data: Prescription[];
  total: number;
  page: number;
  limit: number;
};

export type PrescriptionFilters = {
  customerId?: string;
  status?: PrescriptionStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreatePrescriptionItemPayload = {
  productId: string;
  quantityPrescribed: number;
  posology?: string;
  notes?: string;
};

export type CreatePrescriptionPayload = {
  customerId: string;
  doctorName: string;
  doctorIdNumber?: string;
  prescriptionNumber?: string;
  issuedAt: string;
  expiresAt?: string;
  notes?: string;
  imageUrl?: string;
  items: CreatePrescriptionItemPayload[];
};
