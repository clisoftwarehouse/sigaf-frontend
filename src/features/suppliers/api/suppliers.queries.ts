import type {
  SupplierFilters,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  CreateSupplierContactPayload,
  UpdateSupplierContactPayload,
  CreateSupplierProductPayload,
  UpdateSupplierProductPayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchSupplier,
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
  updateSupplier,
  fetchSupplierContacts,
  createSupplierContact,
  updateSupplierContact,
  deleteSupplierContact,
  fetchSupplierProducts,
  createSupplierProduct,
  updateSupplierProduct,
} from './suppliers.api';

// ----------------------------------------------------------------------

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: (filters: SupplierFilters) => [...supplierKeys.all, 'list', filters] as const,
  detail: (id: string) => [...supplierKeys.all, 'detail', id] as const,
  contacts: (supplierId: string) =>
    [...supplierKeys.all, 'contacts', supplierId] as const,
  products: (supplierId: string) =>
    [...supplierKeys.all, 'products', supplierId] as const,
};

export function useSuppliersQuery(filters: SupplierFilters = {}) {
  return useQuery({
    queryKey: supplierKeys.list(filters),
    queryFn: () => fetchSuppliers(filters),
  });
}

export function useSupplierQuery(id: string | undefined) {
  return useQuery({
    queryKey: supplierKeys.detail(id ?? ''),
    queryFn: () => fetchSupplier(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) => createSupplier(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useUpdateSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSupplierPayload }) =>
      updateSupplier(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      qc.invalidateQueries({ queryKey: supplierKeys.detail(id) });
    },
  });
}

export function useDeleteSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

// ----------------------------------------------------------------------
// Contacts

export function useSupplierContactsQuery(supplierId: string | undefined) {
  return useQuery({
    queryKey: supplierKeys.contacts(supplierId ?? ''),
    queryFn: () => fetchSupplierContacts(supplierId as string),
    enabled: Boolean(supplierId),
  });
}

export function useCreateSupplierContactMutation(supplierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupplierContactPayload) =>
      createSupplierContact(supplierId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.contacts(supplierId) });
    },
  });
}

export function useUpdateSupplierContactMutation(supplierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, payload }: { contactId: string; payload: UpdateSupplierContactPayload }) =>
      updateSupplierContact(supplierId, contactId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.contacts(supplierId) });
    },
  });
}

export function useDeleteSupplierContactMutation(supplierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => deleteSupplierContact(supplierId, contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.contacts(supplierId) });
    },
  });
}

// ----------------------------------------------------------------------
// Products

export function useSupplierProductsQuery(supplierId: string | undefined) {
  return useQuery({
    queryKey: supplierKeys.products(supplierId ?? ''),
    queryFn: () => fetchSupplierProducts(supplierId as string),
    enabled: Boolean(supplierId),
  });
}

export function useCreateSupplierProductMutation(supplierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupplierProductPayload) =>
      createSupplierProduct(supplierId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.products(supplierId) });
    },
  });
}

export function useUpdateSupplierProductMutation(supplierId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      supplierProductId,
      payload,
    }: {
      supplierProductId: string;
      payload: UpdateSupplierProductPayload;
    }) => updateSupplierProduct(supplierId, supplierProductId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.products(supplierId) });
    },
  });
}
