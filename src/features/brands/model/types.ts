export const BRAND_TYPES = [
  'mass_consumption',
  'pharma',
  'otc',
  'cosmetic',
  'personal_care',
  'supplements',
  'food',
  'medical_device',
  'other',
] as const;

export type BrandType = (typeof BRAND_TYPES)[number];

export const BRAND_TYPE_LABEL: Record<BrandType, string> = {
  mass_consumption: 'Consumo masivo',
  pharma: 'Farmacéutico',
  otc: 'OTC',
  cosmetic: 'Cosmético',
  personal_care: 'Cuidado personal',
  supplements: 'Suplementos',
  food: 'Alimentos',
  medical_device: 'Dispositivo médico',
  other: 'Otro',
};

export const BRAND_TYPE_OPTIONS: { value: BrandType; label: string }[] = (
  Object.keys(BRAND_TYPE_LABEL) as BrandType[]
).map((value) => ({ value, label: BRAND_TYPE_LABEL[value] }));

export type Brand = {
  id: string;
  name: string;
  isLaboratory: boolean;
  rif: string | null;
  businessName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  countryOfOrigin: string | null;
  brandType: BrandType;
  isImporter: boolean;
  isManufacturer: boolean;
  taxRegime: string | null;
  supplierId: string | null;
  parentBrandId: string | null;
  website: string | null;
  logoUrl: string | null;
  regulatoryCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBrandPayload = {
  name: string;
  isLaboratory?: boolean;
  rif?: string;
  businessName?: string;
  address?: string;
  phone?: string;
  email?: string;
  countryOfOrigin?: string;
  brandType?: BrandType;
  isImporter?: boolean;
  isManufacturer?: boolean;
  taxRegime?: string;
  supplierId?: string;
  parentBrandId?: string;
  website?: string;
  logoUrl?: string;
  regulatoryCode?: string;
  isActive?: boolean;
};

export type UpdateBrandPayload = Partial<CreateBrandPayload>;

export type BrandFilters = {
  search?: string;
  isLaboratory?: boolean;
  brandType?: BrandType;
  isActive?: boolean;
};
