export type Prescriber = {
  id: string;
  fullName: string;
  specialty: string | null;
  mppsNumber: string | null;
  nationalId: string | null;
  rif: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PrescriberInput = Partial<
  Pick<
    Prescriber,
    | 'fullName'
    | 'specialty'
    | 'mppsNumber'
    | 'nationalId'
    | 'rif'
    | 'phone'
    | 'email'
    | 'address'
    | 'notes'
    | 'isActive'
  >
>;

export type PrescriberFilters = {
  search?: string;
  specialty?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export type Paginated<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
