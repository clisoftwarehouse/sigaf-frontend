import type { Role, CreateRolePayload, UpdateRolePayload } from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchRoles(): Promise<Role[]> {
  const res = await axios.get<Role[]>(endpoints.roles.root);
  return res.data;
}

export async function fetchRole(id: string): Promise<Role> {
  const res = await axios.get<Role>(endpoints.roles.byId(id));
  return res.data;
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const res = await axios.post<Role>(endpoints.roles.root, payload);
  return res.data;
}

export async function updateRole(id: string, payload: UpdateRolePayload): Promise<Role> {
  const res = await axios.put<Role>(endpoints.roles.byId(id), payload);
  return res.data;
}
