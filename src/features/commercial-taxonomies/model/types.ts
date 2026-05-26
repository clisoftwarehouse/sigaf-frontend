export type CommercialTaxonomy = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommercialTaxonomyPayload = {
  name: string;
};
