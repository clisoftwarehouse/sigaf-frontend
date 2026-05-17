export const CUSTOMER_DOCUMENT_TYPES = ['V', 'E', 'J', 'G', 'P'] as const;
export type CustomerDocumentType = (typeof CUSTOMER_DOCUMENT_TYPES)[number];

export const CUSTOMER_TYPES = ['retail', 'frecuente', 'corporativo'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export type Customer = {
  id: string;
  documentType: CustomerDocumentType;
  documentNumber: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerType: CustomerType;
  defaultDiscountPercent: number | string;
  creditLimitUsd: number | string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomersListResponse = {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
};

export type CustomerFilters = {
  search?: string;
  customerType?: CustomerType;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export type CreateCustomerPayload = {
  documentType: CustomerDocumentType;
  documentNumber: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  customerType?: CustomerType;
  defaultDiscountPercent?: number;
  creditLimitUsd?: number;
  notes?: string | null;
  isActive?: boolean;
};

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;
