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
