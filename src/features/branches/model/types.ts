export type Branch = {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string | null;
  email: string | null;
  branchGroupId: string | null;
  isWithholdingAgent: boolean;
  retentionExpediente: string | null;
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
  branchGroupId?: string;
  isWithholdingAgent?: boolean;
  retentionExpediente?: string | null;
};

export type UpdateBranchPayload = Partial<CreateBranchPayload>;
