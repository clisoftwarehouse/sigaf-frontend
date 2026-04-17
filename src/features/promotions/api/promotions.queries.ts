import type {
  PromotionFilters,
  CreatePromotionPayload,
  UpdatePromotionPayload,
  CreatePromotionScopePayload,
} from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchPromotion,
  createPromotion,
  deletePromotion,
  updatePromotion,
  fetchPromotions,
  addPromotionScope,
  activatePromotion,
  deactivatePromotion,
  removePromotionScope,
} from './promotions.api';

// ----------------------------------------------------------------------

export const promotionKeys = {
  all: ['promotions'] as const,
  list: (filters: PromotionFilters) => [...promotionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...promotionKeys.all, 'detail', id] as const,
};

export function usePromotionsQuery(filters: PromotionFilters = {}) {
  return useQuery({
    queryKey: promotionKeys.list(filters),
    queryFn: () => fetchPromotions(filters),
  });
}

export function usePromotionQuery(id: string | undefined) {
  return useQuery({
    queryKey: promotionKeys.detail(id ?? ''),
    queryFn: () => fetchPromotion(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePromotionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromotionPayload) => createPromotion(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: promotionKeys.all }),
  });
}

export function useUpdatePromotionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePromotionPayload }) =>
      updatePromotion(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: promotionKeys.all });
      qc.invalidateQueries({ queryKey: promotionKeys.detail(id) });
    },
  });
}

export function useActivatePromotionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activatePromotion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: promotionKeys.all }),
  });
}

export function useDeactivatePromotionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivatePromotion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: promotionKeys.all }),
  });
}

export function useDeletePromotionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePromotion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: promotionKeys.all }),
  });
}

export function useAddScopeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreatePromotionScopePayload }) =>
      addPromotionScope(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: promotionKeys.all });
      qc.invalidateQueries({ queryKey: promotionKeys.detail(id) });
    },
  });
}

export function useRemoveScopeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scopeId }: { id: string; scopeId: string }) =>
      removePromotionScope(id, scopeId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: promotionKeys.all });
      qc.invalidateQueries({ queryKey: promotionKeys.detail(id) });
    },
  });
}
