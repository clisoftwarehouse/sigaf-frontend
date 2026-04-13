import type { ConfigMap } from './config.api';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchConfig, updateConfig } from './config.api';

// ----------------------------------------------------------------------

export const configKeys = {
  all: ['config-global'] as const,
};

export function useConfigQuery() {
  return useQuery({
    queryKey: configKeys.all,
    queryFn: fetchConfig,
  });
}

export function useUpdateConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfigMap) => updateConfig(data),
    onSuccess: (data) => {
      qc.setQueryData(configKeys.all, data);
    },
  });
}
