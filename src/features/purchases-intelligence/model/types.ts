export type AbcdClass = 'A' | 'B' | 'C' | 'D';

export type SuggestionDecision =
  | 'buy_urgent'
  | 'buy'
  | 'buy_moderate'
  | 'no_buy'
  | 'review'
  | 'dynamize_candidate'
  | 'decode_candidate'
  | 'blocked_expiry';

// ─── Condiciones ────────────────────────────────────────────────────

export type DrugstoreCondition = {
  id: string;
  supplierId: string;
  productId: string | null;
  brandId: string | null;
  cabeceraPct: number;
  volumenPct: number;
  prontoPagoPct: number;
  volumenMinUsd: number | null;
  volumenMinUnits: number | null;
  creditDays: number | null;
  deliveryDays: number | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LabCondition = {
  id: string;
  brandId: string;
  supplierId: string | null;
  productId: string | null;
  linealPct: number;
  escalaPct: number;
  escalaMinUnits: number | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DrugstoreConditionInput = Omit<
  DrugstoreCondition,
  'id' | 'createdAt' | 'updatedAt'
>;
export type LabConditionInput = Omit<LabCondition, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Clasificaciones ────────────────────────────────────────────────

export type ProductClassification = {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  branchId: string;
  abcdClass: AbcdClass;
  score: number;
  isPareto: boolean;
  forcedPromotionToB: boolean;
  dailyVelocity: number | null;
  daysOfInventory: number | null;
  daysSinceLastSale: number | null;
  marginPct: number | null;
  expirySignal: 'GREEN' | 'YELLOW' | 'RED' | 'EXPIRED' | null;
  componentRotation: number | null;
  componentPareto: number | null;
  componentMargin: number | null;
  componentInventoryDays: number | null;
  componentExpiry: number | null;
  calculatedAt: string;
};

export type RecalculateResult = {
  branchId: string;
  totalProducts: number;
  distribution: { A: number; B: number; C: number; D: number };
  paretoCount: number;
  forcedPromotions: number;
  calculatedAt: string;
};

// ─── Sugerido ───────────────────────────────────────────────────────

export type SuggestionItem = {
  productId: string;
  productName: string;
  abcdClass: AbcdClass;
  isPareto: boolean;
  score: number;
  currentStock: number;
  dailyVelocity: number;
  daysOfInventory: number | null;
  coverageDays: number;
  idealQuantity: number;
  suggestedQuantity: number;
  decision: SuggestionDecision;
  reason: string;
  expirySignal: string | null;
  bestSupplier?: {
    supplierId: string;
    supplierName: string;
    netCostUsd: number;
    score: number;
  } | null;
  estimatedCostUsd?: number;
};

export type SuggestionRun = {
  branchId: string;
  generatedAt: string;
  itemsCount: number;
  totalEstimatedUsd: number;
  items: SuggestionItem[];
};

// ─── Comparador interno ─────────────────────────────────────────────

export type ComparatorCandidate = {
  supplierId: string;
  supplierName: string;
  rank: number;
  score: number;
  netCostUsd: number;
  availableQty: number | null;
  lotExpiryDate: string | null;
  creditDays: number | null;
  deliveryDays: number | null;
  components: {
    cost: number;
    availability: number;
    expiry: number;
    credit: number;
    delivery: number;
  };
  netCostBreakdown: {
    basePriceUsd: number;
    appliedDiscounts: {
      supplierProductPct: number;
      cabeceraPct: number;
      linealPct: number;
      volumenPct: number;
      escalaPct: number;
      prontoPagoPct: number;
    };
    conservative: number;
    commercial: number;
    financial: number;
  };
  reasonsApplied: string[];
};

export type ComparatorResult = {
  productId: string;
  productName: string;
  quantity: number;
  candidates: ComparatorCandidate[];
};

// ─── Rentabilidad por rotación ──────────────────────────────────────

export type ProfitabilityPeriod = 'month' | 'quarter' | 'semester' | 'year' | 'custom';
export type ProfitabilityQuadrant = 'star' | 'niche' | 'traffic' | 'dog' | 'no_sales';

export type ProfitabilityItem = {
  productId: string;
  name: string | null;
  unitsSold: number;
  marginPerUnit: number;
  marginPct: number;
  totalMarginUsd: number;
  turnover: number | null;
  turnoverAnnual: number | null;
  quadrant: ProfitabilityQuadrant;
};

export type ProfitabilityResult = {
  period: { preset: ProfitabilityPeriod; from: string; to: string; days: number };
  summary: {
    star: number;
    niche: number;
    traffic: number;
    dog: number;
    no_sales: number;
    totalMarginUsd: number;
  };
  count: number;
  items: ProfitabilityItem[];
};

export type ProfitabilityFilters = {
  period?: ProfitabilityPeriod;
  from?: string;
  to?: string;
  branchId?: string;
  quadrant?: ProfitabilityQuadrant;
  limit?: number;
};
