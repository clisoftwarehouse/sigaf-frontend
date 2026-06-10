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
  allergies: string | null;
  chronicConditions: string | null;
  birthDate: string | null;
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
  allergies?: string | null;
  chronicConditions?: string | null;
  birthDate?: string | null;
  isActive?: boolean;
};

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export type ClinicalProfile = {
  customer: {
    id: string;
    fullName: string;
    documentType: string;
    documentNumber: string;
    phone: string | null;
    customerType: string;
    allergies: string | null;
    chronicConditions: string | null;
    birthDate: string | null;
    isBirthdayToday: boolean;
    notes: string | null;
  };
  commercial: {
    purchaseCount: number;
    isRecurrent: boolean;
    lastPurchase: {
      date: string;
      daysAgo: number;
      totalUsd: number;
      topProducts: string[];
    } | null;
  };
  pendingPrescriptions: Array<{
    id: string;
    doctorName: string;
    issuedAt: string;
    expiresAt: string | null;
    status: string;
    expiringSoon: boolean;
    items: Array<{ productName: string; remaining: number }>;
  }>;
  alerts: string[];
};
