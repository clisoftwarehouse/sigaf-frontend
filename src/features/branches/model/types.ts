export type Branch = {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBranchPayload = {
  name: string;
  rif: string;
  address: string;
  phone?: string;
  email?: string;
};

export type UpdateBranchPayload = Partial<CreateBranchPayload>;
