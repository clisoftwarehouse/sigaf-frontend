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

// ----------------------------------------------------------------------

export type SupplierContact = {
  id: string;
  supplierId: string;
  fullName: string;
  role: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  isPrimary: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupplierContactPayload = {
  fullName: string;
  role?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  notes?: string;
};

export type UpdateSupplierContactPayload = Partial<CreateSupplierContactPayload>;

// ----------------------------------------------------------------------

export type SupplierProduct = {
  id: string;
  supplierId: string;
  productId: string;
  supplierSku: string | null;
  costUsd: number | string | null;
  lastCostUsd: number | string | null;
  discountPct: number | string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupplierProductPayload = {
  productId: string;
  supplierSku?: string;
  costUsd?: number;
  discountPct?: number;
  isAvailable?: boolean;
};

export type UpdateSupplierProductPayload = Partial<Omit<CreateSupplierProductPayload, 'productId'>>;
