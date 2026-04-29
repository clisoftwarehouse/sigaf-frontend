export type TherapeuticUse = {
  id: string;
  name: string;
  description: string | null;
  atcCode: string | null;
  createdAt: string;
};

export type TherapeuticUseFilters = {
  search?: string;
  atcCode?: string;
};

export type CreateTherapeuticUsePayload = {
  name: string;
  description?: string;
  atcCode?: string;
};

export type UpdateTherapeuticUsePayload = Partial<CreateTherapeuticUsePayload>;
