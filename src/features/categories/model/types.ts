export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  code: string | null;
  isPharmaceutical: boolean;
  /** Margen por defecto (% sobre venta) para precargar al fijar precio. */
  defaultMarginPct: number | null;
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
  defaultMarginPct?: number;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
