import type {
  Supplier,
  SupplierFilters,
  SupplierContact,
  SupplierProduct,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  CreateSupplierContactPayload,
  UpdateSupplierContactPayload,
  CreateSupplierProductPayload,
  UpdateSupplierProductPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

const contactsUrl = (supplierId: string) => `${endpoints.suppliers.byId(supplierId)}/contacts`;
const contactUrl = (supplierId: string, contactId: string) =>
  `${contactsUrl(supplierId)}/${contactId}`;
const productsUrl = (supplierId: string) => `${endpoints.suppliers.byId(supplierId)}/products`;
const productUrl = (supplierId: string, supplierProductId: string) =>
  `${productsUrl(supplierId)}/${supplierProductId}`;

// ----------------------------------------------------------------------

export async function fetchSuppliers(filters: SupplierFilters = {}): Promise<Supplier[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.isDrugstore !== undefined) params.isDrugstore = String(filters.isDrugstore);
  if (filters.isActive !== undefined) params.isActive = String(filters.isActive);
  const res = await axios.get<Supplier[]>(endpoints.suppliers.root, { params });
  return res.data;
}

export async function fetchSupplier(id: string): Promise<Supplier> {
  const res = await axios.get<Supplier>(endpoints.suppliers.byId(id));
  return res.data;
}

export async function createSupplier(payload: CreateSupplierPayload): Promise<Supplier> {
  const res = await axios.post<Supplier>(endpoints.suppliers.root, payload);
  return res.data;
}

export async function updateSupplier(
  id: string,
  payload: UpdateSupplierPayload
): Promise<Supplier> {
  const res = await axios.put<Supplier>(endpoints.suppliers.byId(id), payload);
  return res.data;
}

export async function deleteSupplier(id: string): Promise<void> {
  await axios.delete(endpoints.suppliers.byId(id));
}

// ----------------------------------------------------------------------
// Contacts

export async function fetchSupplierContacts(supplierId: string): Promise<SupplierContact[]> {
  const res = await axios.get<SupplierContact[]>(contactsUrl(supplierId));
  return res.data;
}

export async function createSupplierContact(
  supplierId: string,
  payload: CreateSupplierContactPayload
): Promise<SupplierContact> {
  const res = await axios.post<SupplierContact>(contactsUrl(supplierId), payload);
  return res.data;
}

export async function updateSupplierContact(
  supplierId: string,
  contactId: string,
  payload: UpdateSupplierContactPayload
): Promise<SupplierContact> {
  const res = await axios.put<SupplierContact>(contactUrl(supplierId, contactId), payload);
  return res.data;
}

export async function deleteSupplierContact(
  supplierId: string,
  contactId: string
): Promise<void> {
  await axios.delete(contactUrl(supplierId, contactId));
}

// ----------------------------------------------------------------------
// Products

export async function fetchSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
  const res = await axios.get<SupplierProduct[]>(productsUrl(supplierId));
  return res.data;
}

export async function createSupplierProduct(
  supplierId: string,
  payload: CreateSupplierProductPayload
): Promise<SupplierProduct> {
  const res = await axios.post<SupplierProduct>(productsUrl(supplierId), payload);
  return res.data;
}

export async function updateSupplierProduct(
  supplierId: string,
  supplierProductId: string,
  payload: UpdateSupplierProductPayload
): Promise<SupplierProduct> {
  const res = await axios.put<SupplierProduct>(productUrl(supplierId, supplierProductId), payload);
  return res.data;
}
