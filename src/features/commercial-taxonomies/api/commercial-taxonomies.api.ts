import type { CommercialTaxonomy, CreateCommercialTaxonomyPayload } from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ─── Líneas ──────────────────────────────────────────────────────────────

export async function fetchCommercialLines(): Promise<CommercialTaxonomy[]> {
  const res = await axios.get<CommercialTaxonomy[]>(endpoints.commercialLines.root);
  return res.data;
}

export async function createCommercialLine(
  payload: CreateCommercialTaxonomyPayload,
): Promise<CommercialTaxonomy> {
  const res = await axios.post<CommercialTaxonomy>(endpoints.commercialLines.root, payload);
  return res.data;
}

// ─── Variantes ───────────────────────────────────────────────────────────

export async function fetchCommercialVariants(): Promise<CommercialTaxonomy[]> {
  const res = await axios.get<CommercialTaxonomy[]>(endpoints.commercialVariants.root);
  return res.data;
}

export async function createCommercialVariant(
  payload: CreateCommercialTaxonomyPayload,
): Promise<CommercialTaxonomy> {
  const res = await axios.post<CommercialTaxonomy>(endpoints.commercialVariants.root, payload);
  return res.data;
}
