import type {
  TaxType,
  StockStatus,
  BarcodeType,
  ProductType,
  UnitOfMeasure,
  ConservationType,
} from './types';

// ----------------------------------------------------------------------

export const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'pharmaceutical', label: 'Farmacéutico' },
  { value: 'controlled', label: 'Controlado (psicotrópico)' },
  { value: 'otc', label: 'OTC (venta libre)' },
  { value: 'grocery', label: 'Víveres' },
  { value: 'miscellaneous', label: 'Misceláneos' },
  { value: 'weighable', label: 'Pesable' },
];

export const TAX_TYPE_OPTIONS: { value: TaxType; label: string }[] = [
  { value: 'exempt', label: 'Exento (0%)' },
  { value: 'general', label: 'General (IVA 16%)' },
  { value: 'reduced', label: 'Reducido (8%)' },
];

export const UNIT_OF_MEASURE_OPTIONS: { value: UnitOfMeasure; label: string }[] = [
  { value: 'UND', label: 'UND (unidades)' },
  { value: 'KG', label: 'KG (kilogramos)' },
  { value: 'G', label: 'G (gramos)' },
  { value: 'L', label: 'L (litros)' },
  { value: 'ML', label: 'ML (mililitros)' },
];

export const CONSERVATION_OPTIONS: { value: ConservationType; label: string }[] = [
  { value: 'ambient', label: 'Ambiente' },
  { value: 'cold_chain', label: 'Cadena de frío' },
  { value: 'frozen', label: 'Congelado' },
];

export const BARCODE_TYPE_OPTIONS: { value: BarcodeType; label: string }[] = [
  { value: 'ean13', label: 'EAN-13' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'upc', label: 'UPC' },
  { value: 'internal', label: 'Interno' },
  { value: 'national', label: 'Nacional' },
  { value: 'international', label: 'Internacional' },
];

export const STOCK_STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Bajo (≤ mínimo)' },
  { value: 'out', label: 'Agotado' },
];

// ----------------------------------------------------------------------

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = PRODUCT_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<ProductType, string>
);

export const TAX_TYPE_LABEL: Record<TaxType, string> = TAX_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<TaxType, string>
);

export const CONSERVATION_LABEL: Record<ConservationType, string> = CONSERVATION_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<ConservationType, string>
);

// ─── Layout unificado (QA 2026-05) ───────────────────────────────────────

/**
 * "Naturaleza del producto" del layout: agrupación visual en 3 categorías
 * que se mapea a productType y al orden de construcción del nombre.
 * No es columna nueva en BD — se deriva de productType + presencia de
 * commercialLine/commercialVariant.
 */
/**
 * QA #94: tabs unificados. Antes había 3 naturalezas (generic / commercial /
 * consumer); ahora son 2:
 *  - `medical`: medicamento (genérico o comercial — la presencia de
 *    `shortName` lo distingue visualmente sin necesidad de tab separado)
 *  - `consumer`: consumo masivo / misceláneo
 * El antiguo 'generic' y 'commercial' siguen siendo valores válidos para
 * compat con productos existentes pero la UI los trata como 'medical'.
 */
export const PRODUCT_NATURE_OPTIONS = [
  { value: 'medical', label: 'Medicamento', accent: 'primary' as const },
  { value: 'consumer', label: 'Consumo Masivo / Misceláneos', accent: 'success' as const },
] as const;

export type ProductNature = (typeof PRODUCT_NATURE_OPTIONS)[number]['value'];

/** Naturaleza incluyendo valores legacy (generic, commercial) por compat. */
export type ProductNatureLegacy = ProductNature | 'generic' | 'commercial';

// Catálogos amplios (formas farmacéuticas y presentaciones) viven en
// archivos separados — se sincronizan desde el Excel del cliente
// (`src/database/seeds/assets/Estandarización de Datos.xlsx`).
export { DOSAGE_FORM_OPTIONS } from './dosage-forms';
export { PACKAGING_TYPE_OPTIONS } from './packaging-types';

/**
 * Unidad del contenido del empaque (catálogo UMB del Excel del cliente,
 * QA #99a). Ej: "TUB X75ml" = tubo con 75 mililitros, "AMP X500mg" =
 * ampolla con 500 miligramos. La opción vacía representa "unidades sueltas".
 */
export const PACKAGING_UNIT_OPTIONS = [
  { value: '', label: 'Unds' },
  { value: 'Und', label: 'Unidad' },
  { value: 'Dosis', label: 'Dosis' },
  { value: 'Sobre', label: 'Sobre' },
  { value: 'Kit', label: 'Kit / Estuche' },
  { value: 'Aplic.', label: 'Aplicación' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'L', label: 'Litro' },
  { value: 'oz', label: 'Onza' },
  { value: 'g', label: 'Gramo' },
  { value: 'mg', label: 'Miligramo' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'mcg', label: 'Microgramo' },
  { value: 'UI', label: 'Unidad Internacional' },
  { value: 'mEq', label: 'Miliequivalente' },
  { value: 'UFC', label: 'Unidad Formadora de Colonias' },
] as const;

/**
 * Departamento (macro-categoría). Aplica para indexar productos por área
 * comercial. Se deriva de la raíz de la jerarquía de categorías o se
 * setea fijo cuando la naturaleza es médica (siempre FARMACIA).
 */
export const DEPARTMENT_OPTIONS = [
  { value: 'FARMACIA', label: 'Farmacia' },
  { value: 'CUIDADO_PERSONAL', label: 'Cuidado Personal' },
  { value: 'ALIMENTOS', label: 'Alimentos y Bebidas' },
  { value: 'HOGAR', label: 'Limpieza y Hogar' },
  { value: 'MISCELANEOS', label: 'Misceláneos' },
] as const;

export type Department = (typeof DEPARTMENT_OPTIONS)[number]['value'];
