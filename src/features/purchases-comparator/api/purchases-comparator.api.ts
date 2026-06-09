import type {
  Paginated,
  LookupItem,
  ProductDetail,
  LookupFilters,
  HistoryFilters,
  ProductFilters,
  ProductListItem,
  ComparisonGroup,
  ComparisonFilters,
  PriceHistoryEntry,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

function paramsFromFilters(filters: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = String(v);
  }
  return out;
}

export async function fetchComparison(filters: ComparisonFilters = {}): Promise<Paginated<ComparisonGroup>> {
  const res = await axios.get<Paginated<ComparisonGroup>>(endpoints.purchasesComparator.comparison, {
    params: paramsFromFilters(filters),
  });
  return res.data;
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Paginated<ProductListItem>> {
  const res = await axios.get<Paginated<ProductListItem>>(endpoints.purchasesComparator.products, {
    params: paramsFromFilters(filters),
  });
  return res.data;
}

export async function fetchProductDetail(externalId: string): Promise<{ data: ProductDetail }> {
  const res = await axios.get<{ data: ProductDetail }>(
    endpoints.purchasesComparator.productById(externalId)
  );
  return res.data;
}

export async function fetchProductHistory(
  externalId: string,
  filters: HistoryFilters = {}
): Promise<Paginated<PriceHistoryEntry>> {
  const res = await axios.get<Paginated<PriceHistoryEntry>>(
    endpoints.purchasesComparator.productHistory(externalId),
    { params: paramsFromFilters(filters) }
  );
  return res.data;
}

export async function fetchIngredientProducts(
  name: string,
  filters: ComparisonFilters = {}
): Promise<{ data: ComparisonGroup }> {
  const res = await axios.get<{ data: ComparisonGroup }>(
    endpoints.purchasesComparator.ingredientProducts(name),
    { params: paramsFromFilters(filters) }
  );
  return res.data;
}

export async function fetchProviders(filters: LookupFilters = {}): Promise<{ data: LookupItem[] }> {
  const res = await axios.get<{ data: LookupItem[] }>(endpoints.purchasesComparator.providers, {
    params: paramsFromFilters(filters),
  });
  return res.data;
}

export async function fetchActiveIngredients(
  filters: LookupFilters = {}
): Promise<Paginated<LookupItem>> {
  const res = await axios.get<Paginated<LookupItem>>(
    endpoints.purchasesComparator.activeIngredients,
    { params: paramsFromFilters(filters) }
  );
  return res.data;
}

export async function fetchComparatorCategories(
  filters: LookupFilters = {}
): Promise<{ data: LookupItem[] }> {
  const res = await axios.get<{ data: LookupItem[] }>(
    endpoints.purchasesComparator.categories,
    { params: paramsFromFilters(filters) }
  );
  return res.data;
}

export async function fetchComparatorBrands(
  filters: LookupFilters = {}
): Promise<{ data: LookupItem[] }> {
  const res = await axios.get<{ data: LookupItem[] }>(endpoints.purchasesComparator.brands, {
    params: paramsFromFilters(filters),
  });
  return res.data;
}
