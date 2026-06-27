import type {
  LabCondition,
  SuggestionRun,
  LostSalesResult,
  ComparatorResult,
  LostSalesFilters,
  RecalculateResult,
  LabConditionInput,
  SuggestionDecision,
  DrugstoreCondition,
  ProfitabilityResult,
  ProfitabilityFilters,
  ProductClassification,
  DrugstoreConditionInput,
} from '../model/types';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

// ─── Conditions: drugstore ───────────────────────────────────────────

export async function listDrugstoreConditions(filters?: {
  supplierId?: string;
  productId?: string;
  brandId?: string;
  isActive?: boolean;
}): Promise<DrugstoreCondition[]> {
  const { data } = await axiosInstance.get<DrugstoreCondition[]>(
    endpoints.purchasesIntelligence.conditionsDrugstore,
    { params: filters },
  );
  return data;
}

export async function createDrugstoreCondition(
  input: Partial<DrugstoreConditionInput>,
): Promise<DrugstoreCondition> {
  const { data } = await axiosInstance.post<DrugstoreCondition>(
    endpoints.purchasesIntelligence.conditionsDrugstore,
    input,
  );
  return data;
}

export async function updateDrugstoreCondition(
  id: string,
  input: Partial<DrugstoreConditionInput>,
): Promise<DrugstoreCondition> {
  const { data } = await axiosInstance.put<DrugstoreCondition>(
    endpoints.purchasesIntelligence.conditionsDrugstoreById(id),
    input,
  );
  return data;
}

export async function deleteDrugstoreCondition(id: string): Promise<{ success: boolean }> {
  const { data } = await axiosInstance.delete<{ success: boolean }>(
    endpoints.purchasesIntelligence.conditionsDrugstoreById(id),
  );
  return data;
}

// ─── Conditions: lab ─────────────────────────────────────────────────

export async function listLabConditions(filters?: {
  brandId?: string;
  supplierId?: string;
  productId?: string;
  isActive?: boolean;
}): Promise<LabCondition[]> {
  const { data } = await axiosInstance.get<LabCondition[]>(
    endpoints.purchasesIntelligence.conditionsLab,
    { params: filters },
  );
  return data;
}

export async function createLabCondition(
  input: Partial<LabConditionInput>,
): Promise<LabCondition> {
  const { data } = await axiosInstance.post<LabCondition>(
    endpoints.purchasesIntelligence.conditionsLab,
    input,
  );
  return data;
}

export async function updateLabCondition(
  id: string,
  input: Partial<LabConditionInput>,
): Promise<LabCondition> {
  const { data } = await axiosInstance.put<LabCondition>(
    endpoints.purchasesIntelligence.conditionsLabById(id),
    input,
  );
  return data;
}

export async function deleteLabCondition(id: string): Promise<{ success: boolean }> {
  const { data } = await axiosInstance.delete<{ success: boolean }>(
    endpoints.purchasesIntelligence.conditionsLabById(id),
  );
  return data;
}

// ─── Classifications ────────────────────────────────────────────────

export async function recalculatePortfolio(branchId: string): Promise<RecalculateResult> {
  const { data } = await axiosInstance.post<RecalculateResult>(
    endpoints.purchasesIntelligence.recalculate,
    { branchId },
  );
  return data;
}

export async function listClassifications(filters: {
  branchId: string;
  abcd?: 'A' | 'B' | 'C' | 'D';
  isPareto?: boolean;
}): Promise<ProductClassification[]> {
  const { data } = await axiosInstance.get<ProductClassification[]>(
    endpoints.purchasesIntelligence.classifications,
    { params: filters },
  );
  return data;
}

// ─── Suggestions ────────────────────────────────────────────────────

export async function generateSuggestions(payload: {
  branchId: string;
  abcd?: Array<'A' | 'B' | 'C' | 'D'>;
  budgetUsd?: number;
}): Promise<SuggestionRun> {
  const { data } = await axiosInstance.post<SuggestionRun>(
    endpoints.purchasesIntelligence.suggestionsGenerate,
    payload,
  );
  return data;
}

export async function createOrdersFromSuggestions(payload: {
  branchId: string;
  suggestions: Array<{
    productId: string;
    quantity: number;
    supplierId: string;
    netCostUsd: number;
    decision: SuggestionDecision;
    reason: string;
  }>;
  notes?: string;
}): Promise<Array<{ orderId: string; orderNumber: string; supplierId: string; itemsCount: number }>> {
  const { data } = await axiosInstance.post(
    endpoints.purchasesIntelligence.suggestionsCreateOrders,
    payload,
  );
  return data;
}

// ─── Profitability (rentabilidad por rotación) ──────────────────────

export async function fetchProfitability(
  filters: ProfitabilityFilters = {},
): Promise<ProfitabilityResult> {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') params[k] = String(v);
  }
  const { data } = await axiosInstance.get<ProfitabilityResult>(
    endpoints.purchasesIntelligence.profitability,
    { params },
  );
  return data;
}

// ─── Ventas perdidas (demanda no atendida) ──────────────────────────

export async function fetchLostSalesReport(
  filters: LostSalesFilters = {},
): Promise<LostSalesResult> {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') params[k] = String(v);
  }
  const { data } = await axiosInstance.get<LostSalesResult>(endpoints.lostSales.report, { params });
  return data;
}

// ─── Comparator ─────────────────────────────────────────────────────

export async function comparatorForProduct(
  productId: string,
  quantity: number,
): Promise<ComparatorResult> {
  const { data } = await axiosInstance.get<ComparatorResult>(
    endpoints.purchasesIntelligence.comparator(productId),
    { params: { quantity } },
  );
  return data;
}
