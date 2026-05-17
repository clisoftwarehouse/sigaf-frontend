import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  revokeApiKey,
  issuePairingCode,
  fetchTerminalApiKeys,
} from './terminal-pairing.api';

// ----------------------------------------------------------------------

export const terminalPairingKeys = {
  all: ['terminal-pairing'] as const,
  apiKeys: (terminalId: string) => [...terminalPairingKeys.all, 'api-keys', terminalId] as const,
};

export function useTerminalApiKeysQuery(terminalId: string | undefined) {
  return useQuery({
    queryKey: terminalPairingKeys.apiKeys(terminalId ?? ''),
    queryFn: () => fetchTerminalApiKeys(terminalId as string),
    enabled: Boolean(terminalId),
  });
}

export function useIssuePairingCodeMutation(terminalId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => issuePairingCode(terminalId as string),
    onSuccess: () => {
      if (terminalId) {
        qc.invalidateQueries({ queryKey: terminalPairingKeys.apiKeys(terminalId) });
      }
    },
  });
}

export function useRevokeApiKeyMutation(terminalId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => revokeApiKey(terminalId as string, keyId),
    onSuccess: () => {
      if (terminalId) {
        qc.invalidateQueries({ queryKey: terminalPairingKeys.apiKeys(terminalId) });
      }
    },
  });
}
