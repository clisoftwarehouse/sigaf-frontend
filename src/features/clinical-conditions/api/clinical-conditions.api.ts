import axios, { endpoints } from '@/shared/lib/axios';

export type ClinicalConditionType = 'allergy' | 'chronic';

export type ClinicalCondition = {
  id: string;
  type: ClinicalConditionType;
  name: string;
  isSeed: boolean;
  isActive: boolean;
};

export async function fetchClinicalConditions(
  type?: ClinicalConditionType,
): Promise<ClinicalCondition[]> {
  const res = await axios.get<ClinicalCondition[]>(endpoints.clinicalConditions.root, {
    params: type ? { type } : {},
  });
  return res.data;
}

export async function createClinicalCondition(
  type: ClinicalConditionType,
  name: string,
): Promise<ClinicalCondition> {
  const res = await axios.post<ClinicalCondition>(endpoints.clinicalConditions.root, { type, name });
  return res.data;
}
