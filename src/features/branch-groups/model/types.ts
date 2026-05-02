export type CategoryFlag = 'controlled' | 'antibiotic' | 'cold_chain' | 'imported';

export const CATEGORY_FLAG_LABEL: Record<CategoryFlag, string> = {
  controlled: 'Controlados (psicotrópicos)',
  antibiotic: 'Antibióticos',
  cold_chain: 'Cadena de frío',
  imported: 'Importados',
};

export const CATEGORY_FLAGS: CategoryFlag[] = ['controlled', 'antibiotic', 'cold_chain', 'imported'];

export type BranchGroup = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Calculado por el backend en `findAll` */
  branchCount?: number;
  /** Cargados solo en `findOne` */
  amountRules?: BranchGroupAmountRule[];
  categoryRules?: BranchGroupCategoryRule[];
  branches?: Array<{ id: string; name: string }>;
};

export type BranchGroupAmountRule = {
  id: string;
  branchGroupId: string;
  roleId: string;
  role?: { id: string; name: string };
  minUsd: number | string;
  maxUsd: number | string | null;
};

export type BranchGroupCategoryRule = {
  id: string;
  branchGroupId: string;
  categoryFlag: CategoryFlag;
  roleId: string;
  role?: { id: string; name: string };
};

export type CreateBranchGroupPayload = {
  name: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateBranchGroupPayload = Partial<CreateBranchGroupPayload>;

export type AmountRuleInput = {
  roleId: string;
  minUsd: number;
  maxUsd: number | null;
};

export type CategoryRuleInput = {
  categoryFlag: CategoryFlag;
  roleId: string;
};
