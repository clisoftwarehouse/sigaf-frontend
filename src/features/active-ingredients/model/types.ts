export type ActiveIngredient = {
  id: string;
  name: string;
  therapeuticGroup: string | null;
  createdAt: string;
};

export type CreateActiveIngredientPayload = {
  name: string;
  therapeuticGroup?: string;
};

export type UpdateActiveIngredientPayload = Partial<CreateActiveIngredientPayload>;

export type ActiveIngredientFilters = {
  search?: string;
};
