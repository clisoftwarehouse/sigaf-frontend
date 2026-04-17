// ----------------------------------------------------------------------
// Tipos del módulo de Precios.
// Coinciden con PriceEntity, CreatePriceDto, UpdatePriceDto, QueryPricesDto
// y QueryCurrentPriceDto del backend (src/modules/prices/).
// ----------------------------------------------------------------------

/**
 * Modo de cálculo del precio al crearlo desde la UI. NO se persiste
 * en el backend (que solo guarda el `priceUsd` final); se usa solo para
 * que el usuario elija entre ingresar un monto fijo o derivarlo de un
 * costo + margen de ganancia.
 */
export type PriceMode = 'fixed' | 'margin';

export interface Price {
  id: string;
  productId: string;
  branchId: string | null;
  priceUsd: number | string;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePricePayload {
  productId: string;
  branchId?: string;
  priceUsd: number;
  effectiveFrom?: string;
  notes?: string;
}

export interface UpdatePricePayload {
  priceUsd?: number;
  notes?: string;
}

export interface PriceFilters {
  productId?: string;
  branchId?: string;
  activeAt?: string;
  includeHistory?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Respuesta del endpoint `GET /v1/prices/current`.
 * `source` indica de dónde viene el precio resuelto por la prelación:
 *   - `branch_override`: precio específico de sucursal
 *   - `global`: precio global del producto
 *   - `lot_fallback`: sale_price del lote más reciente (fallback)
 */
export interface ResolvedPrice {
  productId: string;
  branchId: string | null;
  priceUsd: number;
  source: 'branch_override' | 'global' | 'lot_fallback';
  effectiveFrom: string | null;
  effectiveTo: string | null;
}
