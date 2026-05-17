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
  { value: 'exempt', label: 'Exento (medicamentos)' },
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
export const PRODUCT_NATURE_OPTIONS = [
  { value: 'generic', label: 'Medicamento Genérico', accent: 'primary' as const },
  { value: 'commercial', label: 'Medicina Comercial', accent: 'primary' as const },
  { value: 'consumer', label: 'Consumo Masivo / Misceláneos', accent: 'success' as const },
] as const;

export type ProductNature = (typeof PRODUCT_NATURE_OPTIONS)[number]['value'];

/**
 * Forma farmacéutica (solo para naturaleza genérico/comercial). Códigos
 * cortos del estándar farmacéutico que se concatenan al nombre.
 */
export const DOSAGE_FORM_OPTIONS = [
  { value: 'TAB', label: 'Tabletas / Comprimidos' },
  { value: 'CAP', label: 'Cápsulas' },
  { value: 'SUSP', label: 'Suspensión' },
  { value: 'JBE', label: 'Jarabe' },
  { value: 'CRM', label: 'Crema' },
  { value: 'POM', label: 'Pomada' },
  { value: 'GEL', label: 'Gel' },
  { value: 'GTAS', label: 'Gotas' },
  { value: 'INY', label: 'Inyectable' },
  { value: 'AER', label: 'Aerosol / Spray' },
  { value: 'INH', label: 'Inhalador' },
  { value: 'SUP', label: 'Supositorio' },
  { value: 'PRC', label: 'Parche' },
  { value: 'POL', label: 'Polvo' },
] as const;

/**
 * Tipo de empaque (estructura física). Códigos cortos para el string
 * compuesto de presentación: "CJA X30", "TUB X75ML", "FCO X120ML".
 */
export const PACKAGING_TYPE_OPTIONS = [
  { value: 'CJA', label: 'Caja' },
  { value: 'FCO', label: 'Frasco' },
  { value: 'BLS', label: 'Blíster' },
  { value: 'TUB', label: 'Tubo' },
  { value: 'BOT', label: 'Botella' },
  { value: 'PQT', label: 'Paquete' },
  { value: 'AMP', label: 'Ampolla' },
  { value: 'VIL', label: 'Vial' },
  { value: 'SBR', label: 'Sobre' },
  { value: 'BSA', label: 'Bolsa' },
] as const;

/**
 * Unidad del contenido del empaque. Vacío = unidades. Otros = volumen/peso
 * por unidad (ej. "TUB X75ML" para tubo de 75 mililitros, "AMP X500MG"
 * para ampolla de 500 miligramos).
 */
export const PACKAGING_UNIT_OPTIONS = [
  { value: '', label: 'Unds' },
  { value: 'MG', label: 'mg' },
  { value: 'G', label: 'g' },
  { value: 'KG', label: 'kg' },
  { value: 'ML', label: 'ml' },
  { value: 'L', label: 'L' },
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
