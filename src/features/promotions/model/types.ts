// ----------------------------------------------------------------------
// Tipos del módulo de Promociones.
// Alineados con PromotionEntity, PromotionScopeEntity y los DTO del backend.
// ----------------------------------------------------------------------

export type PromotionType = 'percentage' | 'fixed_amount' | 'buy_x_get_y';

export type PromotionScopeType = 'product' | 'category' | 'branch';

export interface PromotionScope {
  id: string;
  promotionId: string;
  scopeType: PromotionScopeType;
  scopeId: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: PromotionType;
  value: number | string;
  buyQuantity: number | null;
  getQuantity: number | null;
  minQuantity: number | string;
  maxUses: number | null;
  usesCount: number;
  priority: number;
  stackable: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  /** Eager-loaded por findAll/findOne. */
  scopes?: PromotionScope[];
}

export interface CreatePromotionScopePayload {
  scopeType: PromotionScopeType;
  scopeId: string;
}

export interface CreatePromotionPayload {
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  buyQuantity?: number;
  getQuantity?: number;
  minQuantity?: number;
  maxUses?: number;
  priority?: number;
  stackable?: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  scopes?: CreatePromotionScopePayload[];
}

export type UpdatePromotionPayload = Partial<Omit<CreatePromotionPayload, 'type' | 'scopes'>>;

export interface PromotionFilters {
  type?: PromotionType;
  isActive?: boolean;
  activeAt?: string;
  includeExpired?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ----------------------------------------------------------------------
// Labels/constants usados en la UI.
// ----------------------------------------------------------------------

export const PROMOTION_TYPE_LABEL: Record<PromotionType, string> = {
  percentage: 'Porcentaje',
  fixed_amount: 'Monto fijo',
  buy_x_get_y: 'Compra X lleva Y',
};

export const PROMOTION_TYPE_OPTIONS: { value: PromotionType; label: string }[] = [
  { value: 'percentage', label: 'Porcentaje (%)' },
  { value: 'fixed_amount', label: 'Monto fijo (USD)' },
  { value: 'buy_x_get_y', label: 'Compra X lleva Y' },
];

export const SCOPE_TYPE_LABEL: Record<PromotionScopeType, string> = {
  product: 'Producto',
  category: 'Categoría',
  branch: 'Sucursal',
};

export const SCOPE_TYPE_OPTIONS: { value: PromotionScopeType; label: string }[] = [
  { value: 'product', label: 'Producto' },
  { value: 'category', label: 'Categoría' },
  { value: 'branch', label: 'Sucursal' },
];
