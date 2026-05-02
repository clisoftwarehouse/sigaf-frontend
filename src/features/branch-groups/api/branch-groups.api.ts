import type {
  BranchGroup,
  AmountRuleInput,
  CategoryRuleInput,
  BranchGroupAmountRule,
  BranchGroupCategoryRule,
  CreateBranchGroupPayload,
  UpdateBranchGroupPayload,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchBranchGroups(
  filters: { search?: string; isActive?: boolean } = {},
): Promise<BranchGroup[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.isActive !== undefined) params.isActive = String(filters.isActive);
  const res = await axios.get<BranchGroup[]>(endpoints.branchGroups.root, { params });
  return res.data;
}

export async function fetchBranchGroup(id: string): Promise<BranchGroup> {
  const res = await axios.get<BranchGroup>(endpoints.branchGroups.byId(id));
  return res.data;
}

export async function createBranchGroup(payload: CreateBranchGroupPayload): Promise<BranchGroup> {
  const res = await axios.post<BranchGroup>(endpoints.branchGroups.root, payload);
  return res.data;
}

export async function updateBranchGroup(
  id: string,
  payload: UpdateBranchGroupPayload,
): Promise<BranchGroup> {
  const res = await axios.put<BranchGroup>(endpoints.branchGroups.byId(id), payload);
  return res.data;
}

export async function deleteBranchGroup(id: string): Promise<void> {
  await axios.delete(endpoints.branchGroups.byId(id));
}

export async function setAmountRules(
  branchGroupId: string,
  rules: AmountRuleInput[],
): Promise<BranchGroupAmountRule[]> {
  const res = await axios.put<BranchGroupAmountRule[]>(
    `${endpoints.branchGroups.byId(branchGroupId)}/amount-rules`,
    { rules },
  );
  return res.data;
}

export async function setCategoryRules(
  branchGroupId: string,
  rules: CategoryRuleInput[],
): Promise<BranchGroupCategoryRule[]> {
  const res = await axios.put<BranchGroupCategoryRule[]>(
    `${endpoints.branchGroups.byId(branchGroupId)}/category-rules`,
    { rules },
  );
  return res.data;
}

export async function assignBranchesToBranchGroup(
  branchGroupId: string,
  branchIds: string[],
): Promise<{ assigned: number }> {
  const res = await axios.post<{ assigned: number }>(
    `${endpoints.branchGroups.byId(branchGroupId)}/branches`,
    { branchIds },
  );
  return res.data;
}
