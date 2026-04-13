export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  code: string | null;
  isPharmaceutical: boolean;
  isActive: boolean;
  createdAt: string;
};

export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
};

export type CreateCategoryPayload = {
  name: string;
  code?: string;
  parentId?: string;
  isPharmaceutical?: boolean;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
