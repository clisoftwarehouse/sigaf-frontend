import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchClinicalConditions,
  createClinicalCondition,
  type ClinicalConditionType,
} from './clinical-conditions.api';

const keys = {
  all: ['clinical-conditions'] as const,
  list: (type?: ClinicalConditionType) => ['clinical-conditions', type ?? 'all'] as const,
};

export function useClinicalConditionsQuery(type?: ClinicalConditionType) {
  return useQuery({
    queryKey: keys.list(type),
    queryFn: () => fetchClinicalConditions(type),
    staleTime: 5 * 60_000,
  });
}

export function useCreateClinicalConditionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: ClinicalConditionType; name: string }) =>
      createClinicalCondition(input.type, input.name),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
