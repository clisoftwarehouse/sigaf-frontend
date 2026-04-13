import type { Role } from '../model/types';

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
