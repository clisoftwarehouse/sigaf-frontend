import type { Branch, CreateBranchPayload, UpdateBranchPayload } from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchBranches(): Promise<Branch[]> {
  const res = await axios.get<Branch[]>(endpoints.branches.root);
  return res.data;
}

export async function fetchBranch(id: string): Promise<Branch> {
  const res = await axios.get<Branch>(endpoints.branches.byId(id));
  return res.data;
}

export async function createBranch(payload: CreateBranchPayload): Promise<Branch> {
  const res = await axios.post<Branch>(endpoints.branches.root, payload);
  return res.data;
}

export async function updateBranch(id: string, payload: UpdateBranchPayload): Promise<Branch> {
  const res = await axios.put<Branch>(endpoints.branches.byId(id), payload);
  return res.data;
}

export async function deleteBranch(id: string): Promise<void> {
  await axios.delete(endpoints.branches.byId(id));
}
