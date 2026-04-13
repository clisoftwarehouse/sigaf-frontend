import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export type ConfigMap = Record<string, string>;

export async function fetchConfig(): Promise<ConfigMap> {
  const res = await axios.get<ConfigMap>(endpoints.config.root);
  return res.data;
}

export async function updateConfig(data: ConfigMap): Promise<ConfigMap> {
  const res = await axios.put<ConfigMap>(endpoints.config.root, data);
  return res.data;
}
