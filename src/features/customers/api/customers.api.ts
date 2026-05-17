import type {
  Customer,
  CustomerFilters,
  CustomersListResponse,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchCustomers(filters: CustomerFilters = {}): Promise<CustomersListResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (filters.search) params.search = filters.search;
  if (filters.customerType) params.customerType = filters.customerType;
  if (filters.isActive !== undefined) params.isActive = filters.isActive;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const res = await axios.get<CustomersListResponse>(endpoints.customers.root, { params });
  return res.data;
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const res = await axios.get<Customer>(endpoints.customers.byId(id));
  return res.data;
}

export async function fetchCustomerByDocument(
  type: string,
  number: string
): Promise<Customer> {
  const res = await axios.get<Customer>(endpoints.customers.byDocument(type, number));
  return res.data;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  const res = await axios.post<Customer>(endpoints.customers.root, payload);
  return res.data;
}

export async function updateCustomer(
  id: string,
  payload: UpdateCustomerPayload
): Promise<Customer> {
  const res = await axios.put<Customer>(endpoints.customers.byId(id), payload);
  return res.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await axios.delete(endpoints.customers.byId(id));
}

export async function restoreCustomer(id: string): Promise<Customer> {
  const res = await axios.patch<Customer>(endpoints.customers.restore(id));
  return res.data;
}
