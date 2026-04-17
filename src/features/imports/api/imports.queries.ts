import { useMutation } from '@tanstack/react-query';

import { runImport, downloadTemplate } from './imports.api';

// ----------------------------------------------------------------------

/**
 * Mutation para ejecutar una importación (dry-run o commit).
 * No invalida ningún query directamente: el consumidor decide qué
 * invalidar tras el commit (products, lots, prices, etc).
 */
export function useRunImportMutation() {
  return useMutation({ mutationFn: runImport });
}

/**
 * Mutation para descargar el template XLSX. Se modela como mutation
 * porque dispara un side-effect (descarga al navegador) y no es cacheable.
 */
export function useDownloadTemplateMutation() {
  return useMutation({
    mutationFn: ({ type, filename }: { type: 'products' | 'stock-initial' | 'prices'; filename: string }) =>
      downloadTemplate(type, filename),
  });
}
