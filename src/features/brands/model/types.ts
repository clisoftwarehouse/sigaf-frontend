export type Brand = {
  id: string;
  name: string;
  isLaboratory: boolean;
  createdAt: string;
};

export type CreateBrandPayload = {
  name: string;
  isLaboratory?: boolean;
};

export type UpdateBrandPayload = Partial<CreateBrandPayload>;

export type BrandFilters = {
  search?: string;
  isLaboratory?: boolean;
};
