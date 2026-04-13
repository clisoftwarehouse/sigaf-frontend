import type { FetchUsersArgs } from './users.api';
import type { CreateUserPayload, UpdateUserPayload } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchUser, createUser, deleteUser, fetchUsers, updateUser } from './users.api';

// ----------------------------------------------------------------------

export const userKeys = {
  all: ['users'] as const,
  list: (args: FetchUsersArgs) => [...userKeys.all, 'list', args] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

export function useUsersQuery(args: FetchUsersArgs = {}) {
  return useQuery({
    queryKey: userKeys.list(args),
    queryFn: () => fetchUsers(args),
  });
}

export function useUserQuery(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => fetchUser(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
