import type {
  SigafUser,
  UserFilters,
  CreateUserPayload,
  UpdateUserPayload,
  InfinityPaginationResponse,
} from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export type FetchUsersArgs = {
  page?: number;
  limit?: number;
  filters?: UserFilters;
};

export async function fetchUsers(
  args: FetchUsersArgs = {}
): Promise<InfinityPaginationResponse<SigafUser>> {
  const params: Record<string, string> = {};
  params.page = String(args.page ?? 1);
  params.limit = String(args.limit ?? 20);
  const filterPayload: Record<string, unknown> = {};
  if (args.filters?.roleId) filterPayload.roles = [{ id: args.filters.roleId }];
  if (args.filters?.isActive !== undefined) filterPayload.isActive = args.filters.isActive;
  if (Object.keys(filterPayload).length > 0) {
    params.filters = JSON.stringify(filterPayload);
  }
  const res = await axios.get<InfinityPaginationResponse<SigafUser>>(endpoints.users.root, {
    params,
  });
  return res.data;
}

export async function fetchUser(id: string): Promise<SigafUser> {
  const res = await axios.get<SigafUser>(endpoints.users.byId(id));
  return res.data;
}

export async function createUser(payload: CreateUserPayload): Promise<SigafUser> {
  const res = await axios.post<SigafUser>(endpoints.users.root, payload);
  return res.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<SigafUser> {
  // Backend uses PATCH for updates (not PUT).
  const res = await axios.patch<SigafUser>(endpoints.users.byId(id), payload);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await axios.delete(endpoints.users.byId(id));
}

export async function restoreUser(id: string): Promise<SigafUser> {
  const res = await axios.patch<SigafUser>(`${endpoints.users.byId(id)}/restore`);
  return res.data;
}
