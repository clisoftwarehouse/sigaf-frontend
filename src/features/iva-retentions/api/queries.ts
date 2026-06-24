import type { IvaRetention } from '../model/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { endpoints } from '@/shared/lib/axios';

export const ivaRetentionKeys = {
  all: ['iva-retentions'] as const,
  list: (period?: string, branchId?: string) =>
    [...ivaRetentionKeys.all, 'list', period ?? '', branchId ?? ''] as const,
};

export function useIvaRetentions(period?: string, branchId?: string) {
  return useQuery({
    queryKey: ivaRetentionKeys.list(period, branchId),
    queryFn: async () => {
      const res = await axios.get<IvaRetention[]>(endpoints.ivaRetentions.root, {
        params: { period: period || undefined, branchId: branchId || undefined },
      });
      return res.data;
    },
    enabled: !!period && /^\d{6}$/.test(period),
  });
}

export function useVoidIvaRetention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.post(endpoints.ivaRetentions.voidOne(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ivaRetentionKeys.all }),
  });
}

/** Descarga el TXT del SENIAT para el período (archivo delimitado por TAB). */
export async function downloadRetentionTxt(period: string, branchId?: string): Promise<void> {
  const res = await axios.get<Blob>(endpoints.ivaRetentions.exportTxt, {
    params: { period, branchId: branchId || undefined },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `retencion_iva_${period}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Guarda el RIF / expediente del agente de retención en config-global. */
export async function saveAgentConfig(data: { agentRif?: string; expediente?: string }): Promise<void> {
  const payload: Record<string, string> = {};
  if (data.agentRif !== undefined) payload['fiscal.agent_rif'] = data.agentRif;
  if (data.expediente !== undefined) payload['fiscal.agent_expediente'] = data.expediente;
  await axios.put(endpoints.config.root, payload);
}

export function useAgentConfig() {
  return useQuery({
    queryKey: ['config-global', 'fiscal-agent'],
    queryFn: async () => {
      const res = await axios.get<Record<string, string>>(endpoints.config.root);
      return {
        agentRif: res.data['fiscal.agent_rif'] ?? '',
        expediente: res.data['fiscal.agent_expediente'] ?? '',
      };
    },
  });
}
