import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchDosageForms,
  createDosageForm,
  fetchPackagingTypes,
  createPackagingType,
} from './taxonomies.api';

// ----------------------------------------------------------------------

const dosageFormKeys = { all: ['dosage-forms'] as const };
const packagingTypeKeys = { all: ['packaging-types'] as const };

export function useDosageFormsQuery() {
  return useQuery({
    queryKey: dosageFormKeys.all,
    queryFn: fetchDosageForms,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDosageFormMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createDosageForm(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: dosageFormKeys.all }),
  });
}

export function usePackagingTypesQuery() {
  return useQuery({
    queryKey: packagingTypeKeys.all,
    queryFn: fetchPackagingTypes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePackagingTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createPackagingType(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: packagingTypeKeys.all }),
  });
}
