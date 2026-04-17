export type Brand = {
  id: string;
  name: string;
  isLaboratory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBrandPayload = {
  name: string;
  isLaboratory?: boolean;
  isActive?: boolean;
};

export type UpdateBrandPayload = Partial<CreateBrandPayload>;

export type BrandFilters = {
  search?: string;
  isLaboratory?: boolean;
  isActive?: boolean;
};
