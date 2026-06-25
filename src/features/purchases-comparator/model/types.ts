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

export type BestOfferSummary = {
  providerName: string;
  providerCode: string | null;
  priceConIva: number;
  priceSinIva: number;
  quantity: number;
};

export type ProductOffer = {
  providerName: string;
  providerCode: string | null;
  providerProduct?: string;
  ranking?: string;
  isBest: boolean;
  lote?: string | null;
  vence?: string | null;
  sourceUpdatedAt?: string | null;
  priceBaseSinIva?: number;
  priceConIva: number;
  priceSinIva: number;
  quantity: number;
  diffBest?: number | null;
  currency: 'VES';
};

export type ProductListItem = {
  id: number;
  externalId: string;
  name: string;
  brand: string;
  category: string | null;
  activeIngredient: string | null;
  imageUrl?: string | null;
  bestOffer: BestOfferSummary | null;
  offersCount: number;
};

export type ProductDetailSummary = {
  offersCount: number;
  bestPrice: number | null;
  worstPrice: number | null;
  savings: number;
  currency: 'VES';
};

export type ProductDetail = {
  id: number;
  externalId: string;
  name: string;
  brand: string;
  category: string | null;
  activeIngredient: string | null;
  /** Lista plana de nombres de principios activos (puede estar vacía). */
  activeIngredients: string[];
  bulkUnit?: string | null;
  imageUrl?: string | null;
  url?: string | null;
  catalog?: string | null;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  summary: ProductDetailSummary;
  offers: ProductOffer[];
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
  providerName: string;
  providerCode: string | null;
  priceConIva: number;
  priceSinIva: number;
  quantity: number;
  isBest: boolean;
  currency: 'VES';
  scrapedAt: string;
};

export type HistoryFilters = {
  page?: number;
  limit?: number;
  provider?: string;
  from?: string;
  to?: string;
};

// ─── Última compra interna (cruce contra goods_receipts de SIGAF) ─────

export type LastPurchaseEntry = {
  receiptId: string;
  receiptNumber: string;
  receiptDate: string;
  supplierId: string;
  supplierName: string;
  supplierRif: string;
  unitCostUsd: number | null;
  unitCostNative: number | null;
  /** Costo unitario en Bs a la tasa de la fecha de compra. */
  unitCostBs: number | null;
  nativeCurrency: 'USD' | 'VES';
  exchangeRateUsed: number | null;
  /** Tasa USD→VES usada (congelada en la recepción o BCV del día). */
  rateUsed: number | null;
  quantity: number | null;
  lotNumber: string;
};

export type LastPurchaseResult = {
  found: boolean;
  barcode: string;
  product: { id: string; name: string } | null;
  lastPurchase: LastPurchaseEntry | null;
  /** Último precio que cobró cada proveedor (más reciente primero). */
  bySupplier: LastPurchaseEntry[];
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
