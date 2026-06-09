import type {
  LookupFilters,
  HistoryFilters,
  ProductFilters,
  ComparisonFilters,
} from '../model/types';

import { useQuery } from '@tanstack/react-query';

import {
  fetchProducts,
  fetchProviders,
  fetchComparison,
  fetchProductDetail,
  fetchProductHistory,
  fetchComparatorBrands,
  fetchActiveIngredients,
  fetchIngredientProducts,
  fetchComparatorCategories,
} from './purchases-comparator.api';

// ----------------------------------------------------------------------

export const comparatorKeys = {
  all: ['purchases-comparator'] as const,
  comparison: (filters: ComparisonFilters) =>
    [...comparatorKeys.all, 'comparison', filters] as const,
  products: (filters: ProductFilters) => [...comparatorKeys.all, 'products', filters] as const,
  productDetail: (id: string) => [...comparatorKeys.all, 'product', id] as const,
  productHistory: (id: string, filters: HistoryFilters) =>
    [...comparatorKeys.all, 'product', id, 'history', filters] as const,
  ingredient: (name: string, filters: ComparisonFilters) =>
    [...comparatorKeys.all, 'ingredient', name, filters] as const,
  providers: (filters: LookupFilters) => [...comparatorKeys.all, 'providers', filters] as const,
  activeIngredients: (filters: LookupFilters) =>
    [...comparatorKeys.all, 'active-ingredients', filters] as const,
  categories: (filters: LookupFilters) => [...comparatorKeys.all, 'categories', filters] as const,
  brands: (filters: LookupFilters) => [...comparatorKeys.all, 'brands', filters] as const,
};

// El backend cachea 5 min en server. Acá usamos 4 min de staleTime para que
// las invalidaciones manuales sigan funcionando sin pegarle al server cada
// tecleo. gcTime alto para no perder el cache al cambiar de pestaña.
const baseQueryOptions = {
  staleTime: 4 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const;

export function useComparisonQuery(filters: ComparisonFilters = {}) {
  return useQuery({
    queryKey: comparatorKeys.comparison(filters),
    queryFn: () => fetchComparison(filters),
    ...baseQueryOptions,
  });
}

export function useComparatorProductsQuery(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: comparatorKeys.products(filters),
    queryFn: () => fetchProducts(filters),
    ...baseQueryOptions,
  });
}

export function useComparatorProductDetailQuery(externalId: string | undefined) {
  return useQuery({
    queryKey: comparatorKeys.productDetail(externalId ?? ''),
    queryFn: () => fetchProductDetail(externalId as string),
    enabled: Boolean(externalId),
    ...baseQueryOptions,
  });
}

export function useComparatorProductHistoryQuery(
  externalId: string | undefined,
  filters: HistoryFilters = {}
) {
  return useQuery({
    queryKey: comparatorKeys.productHistory(externalId ?? '', filters),
    queryFn: () => fetchProductHistory(externalId as string, filters),
    enabled: Boolean(externalId),
    ...baseQueryOptions,
  });
}

export function useIngredientComparisonQuery(name: string | undefined, filters: ComparisonFilters = {}) {
  return useQuery({
    queryKey: comparatorKeys.ingredient(name ?? '', filters),
    queryFn: () => fetchIngredientProducts(name as string, filters),
    enabled: Boolean(name),
    ...baseQueryOptions,
  });
}

export function useComparatorProvidersQuery(filters: LookupFilters = {}) {
  return useQuery({
    queryKey: comparatorKeys.providers(filters),
    queryFn: () => fetchProviders(filters),
    ...baseQueryOptions,
  });
}

export function useComparatorActiveIngredientsQuery(filters: LookupFilters = {}) {
  return useQuery({
    queryKey: comparatorKeys.activeIngredients(filters),
    queryFn: () => fetchActiveIngredients(filters),
    ...baseQueryOptions,
  });
}

export function useComparatorCategoriesQuery(filters: LookupFilters = {}) {
  return useQuery({
    queryKey: comparatorKeys.categories(filters),
    queryFn: () => fetchComparatorCategories(filters),
    ...baseQueryOptions,
  });
}

export function useComparatorBrandsQuery(filters: LookupFilters = {}) {
  return useQuery({
    queryKey: comparatorKeys.brands(filters),
    queryFn: () => fetchComparatorBrands(filters),
    ...baseQueryOptions,
  });
}
