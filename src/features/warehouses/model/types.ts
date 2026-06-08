export type Warehouse = {
  id: string;
  branchId: string;
  name: string | null;
  locationCode: string;
  isQuarantine: boolean;
  isForSale: boolean;
  isForPurchase: boolean;
  isActive: boolean;
  createdAt: string;
};

export type CreateWarehousePayload = {
  branchId: string;
  locationCode: string;
  name?: string;
  isQuarantine?: boolean;
  isForSale?: boolean;
  isForPurchase?: boolean;
};

export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;

export type WarehouseFilters = {
  branchId?: string;
  isQuarantine?: boolean;
  isForSale?: boolean;
  isForPurchase?: boolean;
};
