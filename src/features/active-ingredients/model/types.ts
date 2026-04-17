export type ActiveIngredient = {
  id: string;
  name: string;
  therapeuticGroup: string | null;
  atcCode: string | null;
  innName: string | null;
  createdAt: string;
};

export type CreateActiveIngredientPayload = {
  name: string;
  therapeuticGroup?: string;
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

/** Detalles enriquecidos de un candidato: jerarquía completa + grupo derivado. */
export type VademecumDetails = {
  candidate: VademecumCandidate;
  atcHierarchy: VademecumAtcLevel[];
  therapeuticGroup: string | null;
};
