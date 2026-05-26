import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createCommercialLine,
  fetchCommercialLines,
  createCommercialVariant,
  fetchCommercialVariants,
} from './commercial-taxonomies.api';

// ----------------------------------------------------------------------

export const commercialTaxonomyKeys = {
  lines: ['commercial-lines'] as const,
  variants: ['commercial-variants'] as const,
};

// ─── Líneas ──────────────────────────────────────────────────────────────

export function useCommercialLinesQuery() {
  return useQuery({
    queryKey: commercialTaxonomyKeys.lines,
    queryFn: fetchCommercialLines,
  });
}

export function useCreateCommercialLineMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCommercialLine,
    onSuccess: () => qc.invalidateQueries({ queryKey: commercialTaxonomyKeys.lines }),
  });
}

// ─── Variantes ───────────────────────────────────────────────────────────

export function useCommercialVariantsQuery() {
  return useQuery({
    queryKey: commercialTaxonomyKeys.variants,
    queryFn: fetchCommercialVariants,
  });
}

export function useCreateCommercialVariantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCommercialVariant,
    onSuccess: () => qc.invalidateQueries({ queryKey: commercialTaxonomyKeys.variants }),
  });
}
