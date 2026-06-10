import type {
  Paginated,
  CxpFilters,
  AgingSummary,
  AccountsPayable,
  RegisterPaymentInput,
  AccountsPayablePayment,
} from '../model/types';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

export async function listCxp(filters: CxpFilters): Promise<Paginated<AccountsPayable>> {
  const { data } = await axiosInstance.get<Paginated<AccountsPayable>>(
    endpoints.accountsPayable.root,
    { params: filters },
  );
  return data;
}

export async function getCxp(id: string): Promise<AccountsPayable> {
  const { data } = await axiosInstance.get<AccountsPayable>(endpoints.accountsPayable.byId(id));
  return data;
}

export async function getAgingSummary(branchId?: string): Promise<AgingSummary> {
  const { data } = await axiosInstance.get<AgingSummary>(endpoints.accountsPayable.agingSummary, {
    params: { branchId },
  });
  return data;
}

export async function cancelCxp(id: string, reason: string): Promise<AccountsPayable> {
  const { data } = await axiosInstance.post<AccountsPayable>(endpoints.accountsPayable.cancel(id), {
    reason,
  });
  return data;
}

export async function registerPayment(
  cxpId: string,
  payload: RegisterPaymentInput,
): Promise<{ payment: AccountsPayablePayment; cxp: AccountsPayable }> {
  const { data } = await axiosInstance.post(
    endpoints.accountsPayable.payments(cxpId),
    payload,
  );
  return data;
}

export async function listPayments(cxpId: string): Promise<AccountsPayablePayment[]> {
  const { data } = await axiosInstance.get<AccountsPayablePayment[]>(
    endpoints.accountsPayable.payments(cxpId),
  );
  return data;
}

export async function reversePayment(
  paymentId: string,
  reason: string,
): Promise<{ payment: AccountsPayablePayment; cxp: AccountsPayable }> {
  const { data } = await axiosInstance.post(
    endpoints.accountsPayable.reversePayment(paymentId),
    { reason },
  );
  return data;
}
