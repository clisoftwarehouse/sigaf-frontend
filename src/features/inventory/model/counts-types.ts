export const COUNT_TYPES = ['full', 'partial', 'cycle'] as const;
export type CountType = (typeof COUNT_TYPES)[number];

export const COUNT_TYPE_LABEL: Record<CountType, string> = {
  full: 'Completa',
  partial: 'Parcial',
  cycle: 'Cíclica',
};

export const COUNT_TYPE_OPTIONS: { value: CountType; label: string }[] = COUNT_TYPES.map(
  (v) => ({ value: v, label: COUNT_TYPE_LABEL[v] })
);

export const COUNT_STATUSES = [
  'draft',
  'in_progress',
  'completed',
  'approved',
  'cancelled',
] as const;
export type CountStatus = (typeof COUNT_STATUSES)[number];

export const COUNT_STATUS_LABEL: Record<CountStatus, string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  completed: 'Completada',
  approved: 'Aprobada',
  cancelled: 'Cancelada',
};

export const COUNT_STATUS_OPTIONS: { value: CountStatus; label: string }[] = COUNT_STATUSES.map(
  (v) => ({ value: v, label: COUNT_STATUS_LABEL[v] })
);

export const COUNT_STATUS_COLOR: Record<
  CountStatus,
  'default' | 'info' | 'warning' | 'success' | 'error'
> = {
  draft: 'default',
  in_progress: 'warning',
  completed: 'info',
  approved: 'success',
  cancelled: 'error',
};

export const ABC_CLASSES = ['A', 'B', 'C'] as const;
export type AbcClass = (typeof ABC_CLASSES)[number];

export const RISK_LEVELS = ['critical', 'sensitive', 'standard'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  critical: 'Crítico',
  sensitive: 'Sensible',
  standard: 'Estándar',
};

// ----------------------------------------------------------------------

export type InventoryCountItem = {
  id: string;
  countId: string;
  productId: string;
  lotId: string | null;
  locationId: string | null;
  expectedQuantity: number | string;
  expectedLotNumber: string | null;
  expectedExpirationDate: string | null;
  systemQuantity: number | string;
  countedQuantity: number | string | null;
  countedLotNumber: string | null;
  countedExpirationDate: string | null;
  countedExpirySignal: string | null;
  difference: number | string | null;
  differenceType: string | null;
  adjustmentId: string | null;
  countedBy: string | null;
  countedAt: string | null;
  deviceType: string | null;
  isRecounted: boolean;
  recountReason: string | null;
  isSynced: boolean;
  localCountedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryCount = {
  id: string;
  branchId: string;
  countNumber: string;
  countType: CountType;
  status: CountStatus;
  countDate: string;
  scopeDescription: string | null;
  scopeCategoryId: string | null;
  scopeLocationIds: string[] | null;
  scopeAbcClasses: string[] | null;
  scopeRiskLevels: string[] | null;
  blocksSales: boolean;
  blockedAt: string | null;
  unblockedAt: string | null;
  totalSkusExpected: number | null;
  totalSkusCounted: number | null;
  totalSkusMatched: number | null;
  totalSkusOver: number | null;
  totalSkusShort: number | null;
  accuracyPct: number | string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InventoryCountItem[];
};

export type CreateInventoryCountPayload = {
  branchId: string;
  countType: CountType;
  categoryId?: string;
  locationId?: string;
  productIds?: string[];
  notes?: string;
};

export type InventoryCountFilters = {
  branchId?: string;
  countType?: CountType;
  status?: CountStatus;
  page?: number;
  limit?: number;
};

export type InventoryCountListResponse = {
  data: InventoryCount[];
  total: number;
  page: number;
  limit: number;
};

// ----------------------------------------------------------------------

export type CyclicSchedule = {
  id: string;
  branchId: string;
  name: string;
  isActive: boolean;
  abcClasses: string[];
  riskLevels: string[] | null;
  frequencyDays: number;
  maxSkusPerCount: number;
  autoGenerate: boolean;
  lastGeneratedAt: string | null;
  nextGenerationAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCyclicSchedulePayload = {
  branchId: string;
  name: string;
  abcClasses: AbcClass[];
  riskLevels?: RiskLevel[];
  frequencyDays?: number;
  maxSkusPerCount?: number;
  autoGenerate?: boolean;
  isActive?: boolean;
};

export type UpdateCyclicSchedulePayload = Partial<CreateCyclicSchedulePayload>;

export type CyclicScheduleFilters = {
  branchId?: string;
  isActive?: boolean;
};
