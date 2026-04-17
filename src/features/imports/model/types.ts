// ----------------------------------------------------------------------
// Tipos del módulo de importación masiva CSV/XLSX.
// Deben coincidir con los DTO del backend en src/modules/imports/dto.
// ----------------------------------------------------------------------

export type ImportType = 'products' | 'stock-initial' | 'prices';

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}

export interface ImportResult {
  type: ImportType;
  dryRun: boolean;
  total: number;
  success: number;
  failed: number;
  created: number;
  updated: number;
  errors: ImportError[];
}

export interface RunImportPayload {
  type: ImportType;
  file: File;
  dryRun: boolean;
}

// Metadatos para mostrar en la UI de cada tipo.
export interface ImportTypeMeta {
  key: ImportType;
  label: string;
  description: string;
  templateFilename: string;
}

export const IMPORT_TYPES: ImportTypeMeta[] = [
  {
    key: 'products',
    label: 'Productos',
    description:
      'Upsert de productos por EAN o código interno. Auto-genera código si no se provee. Categoría y sucursal deben existir previamente.',
    templateFilename: 'template-products.xlsx',
  },
  {
    key: 'stock-initial',
    label: 'Stock inicial',
    description:
      'Carga inicial de lotes de inventario. No es upsert: si el lote ya existe para ese producto+sucursal, la fila falla.',
    templateFilename: 'template-stock-initial.xlsx',
  },
  {
    key: 'prices',
    label: 'Precios',
    description:
      'Precios USD (global o por sucursal). Cierra la vigencia abierta anterior del mismo scope automáticamente.',
    templateFilename: 'template-prices.xlsx',
  },
];
