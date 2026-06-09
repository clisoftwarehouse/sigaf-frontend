/**
 * Tipos del comparador de precios. Reflejan 1:1 el contrato del servicio
 * externo product-api-ic — el backend SIGAF actúa como proxy y no transforma
 * el payload. Moneda siempre VES.
 */

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type Paginated<T> = {
  data: T[];
  pagination: Pagination;
};

// ─── Comparador por principio activo ──────────────────────────────────

export type ComparisonProduct = {
  externalId: string;
  name: string;
  brand: string;
  provider: string;
  price: number;
};

export type ComparisonStats = {
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
};

export type ComparisonGroup = {
  activeIngredient: string;
  currency: 'VES';
  productsCount: number;
  stats: ComparisonStats;
  products: ComparisonProduct[];
};

export type ComparisonFilters = {
  page?: number;
  limit?: number;
  search?: string;
  onlyMultiple?: boolean;
  productsPerIngredient?: number;
  priceType?: 'con_iva' | 'sin_iva';
};

// ─── Productos (vista por SKU) ────────────────────────────────────────

export type ProductOffer = {
  provider: string;
  price: number;
  isBest?: boolean;
  lastSeen?: string;
};

export type ProductListItem = {
  externalId: string;
  name: string;
  brand: string;
  category: string | null;
  activeIngredient: string | null;
  bestPrice: number | null;
  bestProvider: string | null;
  offersCount: number;
  lastSeen: string | null;
};

export type ProductDetail = ProductListItem & {
  offers: ProductOffer[];
  activeIngredients?: Array<{ name: string; concentration: string | null }>;
  savings?: { absolute: number; pct: number } | null;
};

export type ProductFilters = {
  page?: number;
  limit?: number;
  search?: string;
  brand?: string;
  category?: string;
  activeIngredient?: string;
  provider?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'name' | '-name' | 'bestPrice' | '-bestPrice' | 'lastSeen' | '-lastSeen';
};

// ─── Historial de precios ─────────────────────────────────────────────

export type PriceHistoryEntry = {
  provider: string;
  price: number;
  date: string;
};

export type HistoryFilters = {
  page?: number;
  limit?: number;
  provider?: string;
  from?: string;
  to?: string;
};

// ─── Lookups (catálogos para filtros) ─────────────────────────────────

export type LookupItem = {
  id?: number;
  name: string;
  code?: string | null;
  offersCount?: number;
};

export type LookupFilters = {
  page?: number;
  limit?: number;
  search?: string;
};
