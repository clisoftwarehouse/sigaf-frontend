import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export type TerminalApiKey = {
  id: string;
  terminalId: string;
  keyPrefix: string;
  label: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  revokedByUserId: string | null;
  createdByUserId: string;
  createdAt: string;
};

export type IssuedPairingCode = {
  code: string;
  expiresAt: string;
};

export async function fetchTerminalApiKeys(terminalId: string): Promise<TerminalApiKey[]> {
  const res = await axios.get<TerminalApiKey[]>(endpoints.terminalsPairing.apiKeys(terminalId));
  return res.data;
}

export async function issuePairingCode(terminalId: string): Promise<IssuedPairingCode> {
  const res = await axios.post<IssuedPairingCode>(
    endpoints.terminalsPairing.issueCode(terminalId)
  );
  return res.data;
}

export async function revokeApiKey(terminalId: string, keyId: string): Promise<void> {
  await axios.post(endpoints.terminalsPairing.revokeKey(terminalId, keyId));
}
