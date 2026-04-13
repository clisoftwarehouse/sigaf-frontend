export type Supplier = {
  id: string;
  rif: string;
  businessName: string;
  tradeName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isDrugstore: boolean;
  apiEndpoint: string | null;
  paymentTermsDays: number | null;
  consignmentCommissionPct: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupplierPayload = {
  rif: string;
  businessName: string;
  tradeName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  isDrugstore?: boolean;
  paymentTermsDays?: number;
  consignmentCommissionPct?: number;
};

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

export type SupplierFilters = {
  search?: string;
  isDrugstore?: boolean;
  isActive?: boolean;
};
