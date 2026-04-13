export type WarehouseLocation = {
  id: string;
  branchId: string;
  aisle: string | null;
  shelf: string | null;
  section: string | null;
  capacity: number | null;
  locationCode: string;
  isQuarantine: boolean;
  isActive: boolean;
  createdAt: string;
};

export type CreateLocationPayload = {
  branchId: string;
  locationCode: string;
  aisle?: string;
  shelf?: string;
  section?: string;
  capacity?: number;
  isQuarantine?: boolean;
};

export type UpdateLocationPayload = Partial<CreateLocationPayload>;

export type LocationFilters = {
  branchId?: string;
  isQuarantine?: boolean;
};
