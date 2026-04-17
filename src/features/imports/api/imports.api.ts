import type { ImportType, ImportResult, RunImportPayload } from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

/**
 * Sube un archivo CSV/XLSX al endpoint `/v1/imports/:type`.
 * Si `dryRun=true`, el backend procesa cada fila en su propia transacción
 * pero revierte al final — útil para preview antes de persistir.
 */
export async function runImport({ type, file, dryRun }: RunImportPayload): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await axios.post<ImportResult>(endpoints.imports.run(type), form, {
    params: dryRun ? { dryRun: 'true' } : undefined,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * Descarga el template XLSX para un tipo dado y dispara el save-as en el
 * navegador. El backend responde con `Content-Disposition: attachment`
 * pero lo manejamos vía Blob para garantizar compatibilidad cross-browser.
 */
export async function downloadTemplate(type: ImportType, filename: string): Promise<void> {
  const res = await axios.get(endpoints.imports.template(type), { responseType: 'blob' });
  const blob = new Blob([res.data as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
