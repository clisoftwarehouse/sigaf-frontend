import type { TherapeuticUse } from '@/features/therapeutic-uses/model/types';

export type ActiveIngredient = {
  id: string;
  name: string;
  therapeuticUseId: string | null;
  /** Eager-loaded relation when listing/finding (backend joins therapeuticUse). */
  therapeuticUse?: TherapeuticUse | null;
  atcCode: string | null;
  innName: string | null;
  createdAt: string;
};

export type CreateActiveIngredientPayload = {
  name: string;
  therapeuticUseId?: string;
  atcCode?: string;
  innName?: string;
};

export type UpdateActiveIngredientPayload = Partial<CreateActiveIngredientPayload>;

export type ActiveIngredientFilters = {
  search?: string;
  atcCode?: string;
};

/** Candidato devuelto por `GET /v1/active-ingredients/vademecum-lookup`. */
export type VademecumCandidate = {
  name: string;
  atcCode: string | null;
  slug: string;
  url: string;
};

/** Un nivel de la jerarquía ATC (1=sistema, 4=subgrupo químico). */
export type VademecumAtcLevel = {
  atcCode: string;
  name: string;
  level: 1 | 2 | 3 | 4;
  url: string;
};

/**
 * Detalles enriquecidos de un candidato: jerarquía completa + acción terapéutica
 * sugerida (auto-mapeada por prefijo ATC contra el catálogo `therapeutic_uses`).
 */
export type VademecumDetails = {
  candidate: VademecumCandidate;
  atcHierarchy: VademecumAtcLevel[];
  therapeuticUse: TherapeuticUse | null;
};
