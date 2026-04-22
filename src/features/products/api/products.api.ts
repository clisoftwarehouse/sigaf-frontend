import type {
  Product,
  ProductFilters,
  ProductBarcode,
  PaginatedResponse,
  CreateProductPayload,
  UpdateProductPayload,
  CreateBarcodePayload,
  CreateProductIngredientPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchProducts(
  filters: ProductFilters = {}
): Promise<PaginatedResponse<Product>> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.brandId) params.brandId = filters.brandId;
  if (filters.productType) params.productType = filters.productType;
  if (filters.taxType) params.taxType = filters.taxType;
  if (filters.isActive !== undefined) params.isActive = String(filters.isActive);
  if (filters.stockStatus) params.stockStatus = filters.stockStatus;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 20);
  const res = await axios.get<PaginatedResponse<Product>>(endpoints.products.root, { params });
  return res.data;
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await axios.get<Product>(endpoints.products.byId(id));
  return res.data;
}

export async function searchProducts(q: string, type?: string): Promise<Product[]> {
  const res = await axios.get<Product[]>(endpoints.products.search, { params: { q, type } });
  return res.data;
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const res = await axios.post<Product>(endpoints.products.root, payload);
  return res.data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload
): Promise<Product> {
  const res = await axios.put<Product>(endpoints.products.byId(id), payload);
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await axios.delete(endpoints.products.byId(id));
}

export async function restoreProduct(id: string): Promise<Product> {
  const res = await axios.patch<Product>(`${endpoints.products.byId(id)}/restore`);
  return res.data;
}

// ─── Barcodes ────────────────────────────────────────────────────────────

export async function fetchProductBarcodes(id: string): Promise<ProductBarcode[]> {
  const res = await axios.get<ProductBarcode[]>(endpoints.products.barcodes(id));
  return res.data;
}

export async function addProductBarcode(
  id: string,
  payload: CreateBarcodePayload
): Promise<ProductBarcode> {
  const res = await axios.post<ProductBarcode>(endpoints.products.barcodes(id), payload);
  return res.data;
}

export async function removeProductBarcode(id: string, barcodeId: string): Promise<void> {
  await axios.delete(endpoints.products.barcodeById(id, barcodeId));
}

export type UpdateBarcodePayload = {
  barcode?: string;
  barcodeType?: string;
  isPrimary?: boolean;
};

export async function updateProductBarcode(
  id: string,
  barcodeId: string,
  payload: UpdateBarcodePayload
): Promise<ProductBarcode> {
  const res = await axios.put<ProductBarcode>(endpoints.products.barcodeById(id, barcodeId), payload);
  return res.data;
}

// ─── Ingredients ─────────────────────────────────────────────────────────

export async function addProductIngredient(
  id: string,
  payload: CreateProductIngredientPayload
): Promise<unknown> {
  const res = await axios.post(endpoints.products.ingredients(id), payload);
  return res.data;
}

export async function removeProductIngredient(id: string, ingredientId: string): Promise<void> {
  await axios.delete(endpoints.products.ingredientById(id, ingredientId));
}

// ─── Substitutes ─────────────────────────────────────────────────────────

export async function fetchProductSubstitutes(id: string): Promise<Product[]> {
  const res = await axios.get<Product[]>(endpoints.products.substitutes(id));
  return res.data;
}
