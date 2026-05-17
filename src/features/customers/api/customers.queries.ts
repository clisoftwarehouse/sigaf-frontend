import type {
  CustomerFilters,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchCustomer,
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
  restoreCustomer,
  fetchCustomerByDocument,
} from './customers.api';

// ----------------------------------------------------------------------

export const customerKeys = {
  all: ['customers'] as const,
  list: (filters: CustomerFilters) => [...customerKeys.all, 'list', filters] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
  byDocument: (type: string, number: string) =>
    [...customerKeys.all, 'by-document', type, number] as const,
};

export function useCustomersQuery(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => fetchCustomers(filters),
  });
}

export function useCustomerQuery(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ''),
    queryFn: () => fetchCustomer(id as string),
    enabled: Boolean(id),
  });
}

export function useCustomerByDocumentQuery(
  type: string | undefined,
  number: string | undefined
) {
  return useQuery({
    queryKey: customerKeys.byDocument(type ?? '', number ?? ''),
    queryFn: () => fetchCustomerByDocument(type as string, number as string),
    enabled: Boolean(type) && Boolean(number),
    retry: false,
  });
}

export function useCreateCustomerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useUpdateCustomerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) =>
      updateCustomer(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}

export function useDeleteCustomerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useRestoreCustomerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
