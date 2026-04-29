export type ProductType =
  | 'pharmaceutical'
  | 'controlled'
  | 'otc'
  | 'grocery'
  | 'miscellaneous'
  | 'weighable';

export type TaxType = 'exempt' | 'general' | 'reduced';

export type UnitOfMeasure = 'UND' | 'KG' | 'G' | 'L' | 'ML';

export type ConservationType = 'ambient' | 'cold_chain' | 'frozen';

export type BarcodeType =
  | 'ean13'
  | 'ean8'
  | 'upc'
  | 'internal'
  | 'national'
  | 'international';

export type StockStatus = 'normal' | 'low' | 'out';

// ----------------------------------------------------------------------

export type ProductBarcode = {
  id: string;
  productId: string;
  barcode: string;
  barcodeType: BarcodeType;
  isPrimary: boolean;
  createdAt: string;
};

export type ProductIngredient = {
  productId: string;
  activeIngredientId: string;
  concentration: string | null;
  isPrimary: boolean;
  /** Populated by backend findOne eager load (`activeIngredients.activeIngredient`). */
  activeIngredient?: {
    id: string;
    name: string;
    therapeuticUseId: string | null;
    therapeuticUse?: { id: string; name: string; atcCode: string | null } | null;
  };
};

export type Product = {
  id: string;
  internalCode: string | null;
  description: string;
  shortName: string | null;
  categoryId: string;
  brandId: string | null;
  productType: ProductType;
  isControlled: boolean;
  isAntibiotic: boolean;
  requiresRecipe: boolean;
  isWeighable: boolean;
  unitOfMeasure: UnitOfMeasure;
  decimalPlaces: number;
  presentation: string | null;
  taxType: TaxType;
  pmvp: number | string | null;
  conservationType: ConservationType | null;
  minTemperature: number | string | null;
  maxTemperature: number | string | null;
  stockMin: number | string;
  stockMax: number | string | null;
  reorderPoint: number | string | null;
  leadTimeDays: number | null;
  isActive: boolean;
  inventoryBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  /** Eager-loaded on findOne (nested arrays). */
  barcodes?: ProductBarcode[];
  activeIngredients?: ProductIngredient[];
  /** Computed by backend on findOne / findAll (sum of available quantities across lots). */
  totalStock?: number;
};

export type CreateBarcodePayload = {
  barcode: string;
  barcodeType?: BarcodeType;
  isPrimary?: boolean;
};

export type CreateProductIngredientPayload = {
  activeIngredientId: string;
  concentration?: string;
  isPrimary?: boolean;
};

export type CreateProductPayload = {
  internalCode?: string;
  description: string;
  shortName?: string;
  categoryId: string;
  brandId?: string;
  productType?: ProductType;
  isControlled?: boolean;
  isAntibiotic?: boolean;
  requiresRecipe?: boolean;
  isWeighable?: boolean;
  unitOfMeasure?: UnitOfMeasure;
  decimalPlaces?: number;
  presentation?: string;
  taxType?: TaxType;
  pmvp?: number;
  conservationType?: ConservationType;
  minTemperature?: number;
  maxTemperature?: number;
  stockMin?: number;
  stockMax?: number;
  reorderPoint?: number;
  leadTimeDays?: number;
  barcodes?: CreateBarcodePayload[];
  activeIngredients?: CreateProductIngredientPayload[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type ProductFilters = {
  search?: string;
  categoryId?: string;
  brandId?: string;
  productType?: ProductType;
  taxType?: TaxType;
  therapeuticUseId?: string;
  isActive?: boolean;
  stockStatus?: StockStatus;
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
