import axios, { endpoints } from '@/shared/lib/axios';

export type ProductTaxonomy = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function fetchDosageForms(): Promise<ProductTaxonomy[]> {
  const res = await axios.get<ProductTaxonomy[]>(endpoints.dosageForms.root);
  return res.data;
}

export async function createDosageForm(name: string): Promise<ProductTaxonomy> {
  const res = await axios.post<ProductTaxonomy>(endpoints.dosageForms.root, { name });
  return res.data;
}

export async function fetchPackagingTypes(): Promise<ProductTaxonomy[]> {
  const res = await axios.get<ProductTaxonomy[]>(endpoints.packagingTypes.root);
  return res.data;
}

export async function createPackagingType(name: string): Promise<ProductTaxonomy> {
  const res = await axios.post<ProductTaxonomy>(endpoints.packagingTypes.root, { name });
  return res.data;
}
