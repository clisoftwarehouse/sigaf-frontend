import type {
  Product,
  UnitOfMeasure,
  ConservationType,
  CreateProductPayload,
} from '../../model/types';

import * as z from 'zod';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';
import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { useBrandsQuery } from '@/features/brands/api/brands.queries';
import { useCategoriesQuery } from '@/features/categories/api/categories.queries';
import { useActiveIngredientsQuery } from '@/features/active-ingredients/api/active-ingredients.queries';
import {
  useCommercialLinesQuery,
  useCommercialVariantsQuery,
} from '@/features/commercial-taxonomies/api/commercial-taxonomies.queries';

import { QuickCreateBrandDialog } from './quick-create-brand-dialog';
import { QuickCreateCategoryDialog } from './quick-create-category-dialog';
import { QuickCreateTaxonomyDialog } from './quick-create-taxonomy-dialog';
import { QuickCreateIngredientDialog } from './quick-create-ingredient-dialog';
import { QuickCreateCommercialTaxonomyDialog } from './quick-create-commercial-taxonomy-dialog';
import {
  TAX_TYPE_OPTIONS,
  BARCODE_TYPE_OPTIONS,
  PACKAGING_UNIT_OPTIONS,
  PRODUCT_NATURE_OPTIONS,
} from '../../model/constants';
import {
  useDosageFormsQuery,
  usePackagingTypesQuery,
  useCreateDosageFormMutation,
  useCreatePackagingTypeMutation,
} from '../../api/taxonomies.queries';

// ----------------------------------------------------------------------

const optionalNumber = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || /^-?\d+(\.\d+)?$/.test(v), { message: 'Debe ser un número' });

const BarcodeItemSchema = z.object({
  barcode: z.string().min(1, { message: 'Obligatorio' }).max(50),
  barcodeType: z.enum(['ean13', 'ean8', 'upc', 'internal', 'national', 'international']),
  isPrimary: z.boolean(),
});

// Unidades de concentración del catálogo estándar (Excel del cliente, QA #99a).
const CONCENTRATION_UNITS = [
  'mg',
  'g',
  'mcg',
  'kg',
  'ml',
  'L',
  'UI',
  'mEq',
  'UFC',
  '%',
  'mmol',
  'U',
] as const;

const IngredientItemSchema = z.object({
  activeIngredientId: z.string().uuid({ message: 'Selecciona un principio activo' }),
  concentrationValue: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^\d+([.,]\d+)?$/.test(v), { message: 'Solo números' }),
  concentrationUnit: z.enum(CONCENTRATION_UNITS),
  isPrimary: z.boolean(),
});

export const ProductSchema = z.object({
  description: z.string().min(3, { message: 'Mínimo 3 caracteres' }).max(300),
  shortName: z.string().max(100).optional().or(z.literal('')),
  internalCode: z.string().max(30).optional().or(z.literal('')),
  presentation: z.string().max(100).optional().or(z.literal('')),
  categoryId: z.string().uuid({ message: 'Selecciona una categoría' }),
  brandId: z.string().optional().or(z.literal('')),
  productType: z.enum([
    'pharmaceutical',
    'controlled',
    'otc',
    'grocery',
    'miscellaneous',
    'weighable',
  ]),
  // Naturaleza visual: deriva de productType + presencia de campos comerciales.
  // No se persiste en BD; se usa para controlar qué secciones del form mostrar.
  // QA #94: unificamos generic+commercial en `medical`. Los valores
  // legacy se siguen aceptando como entrada pero el form los normaliza
  // a 'medical' en inferProductNature.
  productNature: z.enum(['medical', 'consumer']),
  taxType: z.enum(['exempt', 'general', 'reduced']),
  isControlled: z.boolean(),
  isAntibiotic: z.boolean(),
  isImported: z.boolean(),
  requiresRecipe: z.boolean(),
  tracksExpiration: z.boolean(),
  isWeighable: z.boolean(),
  unitOfMeasure: z.enum(['UND', 'KG', 'G', 'L', 'ML']),
  decimalPlaces: optionalNumber,
  pmvp: optionalNumber,
  targetMarginPct: optionalNumber,
  conservationType: z
    .enum(['ambient', 'cold_chain', 'frozen'])
    .optional()
    .or(z.literal('' as const)),
  minTemperature: optionalNumber,
  maxTemperature: optionalNumber,
  stockMin: optionalNumber,
  stockMax: optionalNumber,
  reorderPoint: optionalNumber,
  leadTimeDays: optionalNumber,
  // Campos del layout unificado
  dosageForm: z.string().max(30).optional().or(z.literal('')),
  // QA #93: ahora son FKs a commercial_lines / commercial_variants.
  // Los strings legacy se siguen aceptando para compat con productos viejos
  // que aún no fueron re-vinculados.
  commercialLine: z.string().max(100).optional().or(z.literal('')),
  commercialLineId: z.string().uuid().optional().or(z.literal('')),
  commercialVariant: z.string().max(100).optional().or(z.literal('')),
  commercialVariantId: z.string().uuid().optional().or(z.literal('')),
  // Empaque descompuesto (se recompone en `presentation` al guardar).
  packagingType: z.string().optional().or(z.literal('')),
  packagingQuantity: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), { message: 'Solo números' }),
  packagingUnit: z.string().optional().or(z.literal('')),
  barcodes: z.array(BarcodeItemSchema),
  activeIngredients: z.array(IngredientItemSchema),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

// ----------------------------------------------------------------------

/**
 * Parsea el string `presentation` (ej. "CJA X30" o "TUB X75ML") a los 3
 * campos descompuestos (tipo, cantidad, unidad). Retorna defaults vacíos si
 * el string no matchea el formato esperado — productos creados antes del
 * rediseño pueden tener strings libres que no se parsean.
 */
function parsePresentation(raw?: string | null): {
  type: string;
  quantity: string;
  unit: string;
} {
  if (!raw) return { type: '', quantity: '', unit: '' };
  const m = raw.trim().match(/^([A-Z]+)\s*X\s*([\d.]+)\s*([A-Z]*)$/i);
  if (!m) return { type: '', quantity: '', unit: '' };
  return { type: m[1].toUpperCase(), quantity: m[2], unit: m[3].toUpperCase() };
}

function parseConcentration(raw?: string | null): {
  value: string;
  unit: (typeof CONCENTRATION_UNITS)[number];
} {
  if (!raw) return { value: '', unit: 'mg' };
  const trimmed = raw.trim();
  const match = trimmed.match(/^([\d.,]+)\s*([A-Za-z%]+)?$/);
  if (!match) return { value: trimmed, unit: 'mg' };
  const unit = match[2]
    ? CONCENTRATION_UNITS.find((candidate) => candidate.toLowerCase() === match[2]!.toLowerCase())
    : undefined;
  return {
    value: match[1],
    unit: unit ?? 'mg',
  };
}

/**
 * Infiere la "naturaleza" del producto a partir de los campos guardados:
 * - Si tiene commercialLine/Variant → 'consumer'
 * - Si tiene shortName/brandId pero NO commercialLine → 'commercial'
 * - El resto (solo principio activo, sin marca comercial fuerte) → 'generic'
 *
 * Se usa solo para inicializar el form en modo edit; el operador puede
 * cambiarla manualmente con el radio selector.
 */
/**
 * Infiere la naturaleza unificada (QA #94). Antes había 3: generic /
 * commercial / consumer. Ahora 2: medical / consumer. Lo que distingue
 * "medicamento genérico vs comercial" es solo la presencia de `shortName`
 * (nombre comercial), no un tab separado.
 */
function inferProductNature(p?: Product): 'medical' | 'consumer' {
  if (!p) return 'medical';
  if (p.commercialLine || p.commercialVariant) return 'consumer';
  if (p.productType === 'grocery' || p.productType === 'miscellaneous') return 'consumer';
  return 'medical';
}

function toFormValues(p?: Product): ProductFormValues {
  const pkg = parsePresentation(p?.presentation);
  return {
    description: p?.description ?? '',
    shortName: p?.shortName ?? '',
    internalCode: p?.internalCode ?? '',
    presentation: p?.presentation ?? '',
    categoryId: p?.categoryId ?? '',
    brandId: p?.brandId ?? '',
    productType: p?.productType ?? 'otc',
    productNature: inferProductNature(p),
    taxType: p?.taxType ?? 'exempt',
    isControlled: p?.isControlled ?? false,
    isAntibiotic: p?.isAntibiotic ?? false,
    isImported: p?.isImported ?? false,
    requiresRecipe: p?.requiresRecipe ?? false,
    tracksExpiration: p?.tracksExpiration ?? true,
    isWeighable: p?.isWeighable ?? false,
    unitOfMeasure: (p?.unitOfMeasure as UnitOfMeasure) ?? 'UND',
    decimalPlaces: p?.decimalPlaces != null ? String(p.decimalPlaces) : '0',
    pmvp: p?.pmvp != null ? String(p.pmvp) : '',
    targetMarginPct: p?.targetMarginPct != null ? String(p.targetMarginPct) : '',
    conservationType: (p?.conservationType as ConservationType | null) ?? 'ambient',
    minTemperature: p?.minTemperature != null ? String(p.minTemperature) : '',
    maxTemperature: p?.maxTemperature != null ? String(p.maxTemperature) : '',
    stockMin: p?.stockMin != null ? String(p.stockMin) : '0',
    stockMax: p?.stockMax != null ? String(p.stockMax) : '',
    reorderPoint: p?.reorderPoint != null ? String(p.reorderPoint) : '',
    leadTimeDays: p?.leadTimeDays != null ? String(p.leadTimeDays) : '',
    dosageForm: p?.dosageForm ?? '',
    commercialLine: p?.commercialLine ?? '',
    commercialLineId: p?.commercialLineId ?? '',
    commercialVariant: p?.commercialVariant ?? '',
    commercialVariantId: p?.commercialVariantId ?? '',
    packagingType: pkg.type,
    packagingQuantity: pkg.quantity,
    packagingUnit: pkg.unit,
    barcodes: [],
    activeIngredients:
      p?.activeIngredients?.map((ingredient) => {
        const concentration = parseConcentration(ingredient.concentration);
        return {
          activeIngredientId: ingredient.activeIngredientId,
          concentrationValue: concentration.value,
          concentrationUnit: concentration.unit,
          isPrimary: ingredient.isPrimary,
        };
      }) ?? [],
  } as ProductFormValues;
}

type Props = {
  current?: Product;
  submitting?: boolean;
  onSubmit: (values: CreateProductPayload) => Promise<void> | void;
  onCancel?: () => void;
  /**
   * Componente para gestionar códigos de barras en modo edit (CRUD inmediato
   * contra backend). Se renderiza como sección hermana al final del Card
   * principal. En create, los códigos van en el field array embebido y este
   * slot no se usa.
   */
  barcodesSlot?: React.ReactNode;
  /**
   * Componente para gestionar principios activos en modo edit (CRUD inmediato).
   * Se renderiza DENTRO del bloque médico, reemplazando el field array
   * embebido. Así el operador edita los principios en el mismo lugar donde
   * los ve, sin duplicación visual.
   */
  ingredientsSlot?: React.ReactNode;
};

/**
 * Compone el string de empaque para guardar como `presentation`:
 *   <TIPO> X<CANTIDAD><UNIDAD>   ej. "CJA X30", "TUB X75ML"
 *
 * Si la unidad está vacía (caso default = unidades), no se anexa.
 * Si no hay tipo o cantidad, retorna string vacío.
 */
function composePresentation(input: { type?: string; quantity?: string; unit?: string }): string {
  const type = (input.type || '').trim().toUpperCase();
  const quantity = (input.quantity || '').trim();
  const unit = (input.unit || '').trim().toUpperCase();
  if (!type || !quantity) return '';
  return `${type} X${quantity}${unit}`;
}

/**
 * Construye el nombre/descripción del producto según la naturaleza
 * seleccionada. Cada rama tiene un orden distinto definido por el layout
 * del QA:
 *
 *   - **Médico**: <NombreComercial> <Activos> <Forma> <Laboratorio> <Empaque>
 *     Ej: RIVOTRIL CLONAZEPAM 2MG TABLETA ROCHE CAJA X30
 *     (sin nombre comercial queda genérico: ACETAMINOFEN 500MG TAB GENVEN CJA X30)
 *
 *   - **Masivo/Misceláneo**: <Marca> <Subtítulo> <Línea> <Variante> <Empaque>
 *     Ej: COLGATE TOTAL 12 CLEAN MINT CREMA DENTAL TUB X75ML
 *
 * El nombre comercial / subtítulo (`commercialName`) es opcional: si está
 * vacío se omite y el nombre queda sin esa parte.
 */
function composeProductName(input: {
  nature: 'medical' | 'consumer';
  ingredients: Array<{ name?: string; concentrationValue?: string; concentrationUnit?: string }>;
  commercialName?: string;
  brandName?: string;
  dosageForm?: string;
  packaging?: string;
  commercialLine?: string;
  commercialVariant?: string;
}): string {
  const activos = input.ingredients
    .filter((i) => i.name)
    .map((i) => {
      const name = (i.name ?? '').toUpperCase();
      if (!i.concentrationValue) return name;
      const num = i.concentrationValue.trim().replace(',', '.');
      const unit = (i.concentrationUnit || '').toUpperCase();
      return `${name} ${num}${unit}`;
    })
    .join(' / ');

  const dosage = (input.dosageForm || '').toUpperCase();
  const pkg = (input.packaging || '').toUpperCase();
  const brand = (input.brandName || '').toUpperCase();
  // Nombre comercial (médico: "Rivotril") / subtítulo (misceláneo). QA 166: en
  // ambas naturalezas entra en el nombre auto-generado.
  const commercial = (input.commercialName || '').toUpperCase();

  const parts: string[] = [];
  if (input.nature === 'consumer') {
    const line = (input.commercialLine || '').toUpperCase();
    const variant = (input.commercialVariant || '').toUpperCase();
    if (brand) parts.push(brand);
    if (commercial) parts.push(commercial);
    if (line) parts.push(line);
    if (variant) parts.push(variant);
    if (pkg) parts.push(pkg);
  } else {
    // Médico: el nombre comercial encabeza (QA 166), seguido del formato
    // genérico — activo(s) + concentración + forma + laboratorio + empaque.
    // Ej: RIVOTRIL CLONAZEPAM 2MG TABLETA ROCHE CAJA X30.
    if (commercial) parts.push(commercial);
    if (activos) parts.push(activos);
    if (dosage) parts.push(dosage);
    if (brand) parts.push(brand);
    if (pkg) parts.push(pkg);
  }
  return parts.filter(Boolean).join(' ').trim();
}

export function ProductForm({
  current,
  submitting,
  onSubmit,
  onCancel,
  barcodesSlot,
  ingredientsSlot,
}: Props) {
  const isEdit = Boolean(current);

  const { flat: categories, isLoading: loadingCategories } = useCategoriesQuery();
  const { data: brands = [], isLoading: loadingBrands } = useBrandsQuery();
  const { data: commercialLines = [] } = useCommercialLinesQuery();
  const { data: commercialVariants = [] } = useCommercialVariantsQuery();
  const { data: ingredientsCatalog = [], isLoading: loadingIngredients } =
    useActiveIngredientsQuery();
  const { data: dosageForms = [], isLoading: loadingDosageForms } = useDosageFormsQuery();
  const { data: packagingTypes = [], isLoading: loadingPackagingTypes } = usePackagingTypesQuery();
  const createDosageForm = useCreateDosageFormMutation();
  const createPackagingType = useCreatePackagingTypeMutation();

  const [quickOpen, setQuickOpen] = useState<
    | 'category'
    | 'brand'
    | 'ingredient'
    | 'commercial-line'
    | 'commercial-variant'
    | 'dosage-form'
    | 'packaging-type'
    | null
  >(null);
  const [pendingIngredientIdx, setPendingIngredientIdx] = useState<number | null>(null);
  // Auto-generamos el nombre por defecto tanto en create como en edit: si el
  // operador cambia cualquier campo del nombre, el preview se actualiza en vivo.
  // El candado del preview inferior permite pasar a edición manual cuando se
  // necesita un nombre que no salga de la composición automática.
  const [autoName, setAutoName] = useState(true);

  const methods = useForm<ProductFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(ProductSchema),
    defaultValues: toFormValues(current),
  });

  const { control, handleSubmit, reset, setValue } = methods;
  const barcodesArray = useFieldArray({ control, name: 'barcodes' });
  const ingredientsArray = useFieldArray({ control, name: 'activeIngredients' });

  // Watch los campos que componen la descripción para regenerarla en vivo.
  const watchedIngredients = useWatch({ control, name: 'activeIngredients' });
  const watchedBrandId = useWatch({ control, name: 'brandId' });
  const watchedNature = useWatch({ control, name: 'productNature' });
  const watchedShortName = useWatch({ control, name: 'shortName' });
  const watchedDosageForm = useWatch({ control, name: 'dosageForm' });
  const watchedPackagingType = useWatch({ control, name: 'packagingType' });
  const watchedPackagingQty = useWatch({ control, name: 'packagingQuantity' });
  const watchedPackagingUnit = useWatch({ control, name: 'packagingUnit' });
  const watchedCommercialLineId = useWatch({ control, name: 'commercialLineId' });
  const watchedCommercialVariantId = useWatch({ control, name: 'commercialVariantId' });
  // Resolvemos el name desde el catálogo para que el composeProductName
  // pueda construir la descripción en vivo. Fallback al string legacy de
  // la entidad cuando el producto aún no fue re-vinculado al FK.
  const watchedCommercialLine =
    commercialLines.find((l) => l.id === watchedCommercialLineId)?.name ?? '';
  const watchedCommercialVariant =
    commercialVariants.find((v) => v.id === watchedCommercialVariantId)?.name ?? '';

  // Recomponemos `presentation` desde los 3 campos descompuestos y lo
  // mantenemos sincronizado en el form (también es lo que se envía a backend).
  const composedPresentation = useMemo(
    () =>
      composePresentation({
        type: watchedPackagingType,
        quantity: watchedPackagingQty,
        unit: watchedPackagingUnit,
      }),
    [watchedPackagingType, watchedPackagingQty, watchedPackagingUnit]
  );

  useEffect(() => {
    setValue('presentation', composedPresentation, { shouldDirty: true, shouldValidate: false });
  }, [composedPresentation, setValue]);

  const generatedName = useMemo(() => {
    const ingredients = (watchedIngredients ?? []).map((i) => ({
      name: i?.activeIngredientId
        ? ingredientsCatalog.find((c) => c.id === i.activeIngredientId)?.name
        : undefined,
      concentrationValue: i?.concentrationValue,
      concentrationUnit: i?.concentrationUnit,
    }));
    const brandName = watchedBrandId
      ? brands.find((b) => b.id === watchedBrandId)?.name
      : undefined;
    return composeProductName({
      nature: watchedNature ?? 'medical',
      ingredients,
      commercialName: watchedShortName,
      brandName,
      dosageForm: watchedDosageForm,
      packaging: composedPresentation,
      commercialLine: watchedCommercialLine,
      commercialVariant: watchedCommercialVariant,
    });
  }, [
    watchedNature,
    watchedIngredients,
    watchedBrandId,
    watchedShortName,
    watchedDosageForm,
    composedPresentation,
    watchedCommercialLine,
    watchedCommercialVariant,
    ingredientsCatalog,
    brands,
  ]);

  useEffect(() => {
    if (autoName && generatedName) {
      setValue('description', generatedName, { shouldValidate: true, shouldDirty: true });
    }
  }, [autoName, generatedName, setValue]);

  useEffect(() => {
    if (current) reset(toFormValues(current), { keepDirtyValues: true, keepDirty: true });
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    // Si la naturaleza es masivo, los campos médicos (dosageForm, ingredients)
    // no aplican y se envían vacíos. Lo opuesto para commercialLine/Variant.
    const isConsumer = values.productNature === 'consumer';
    const presentation = composePresentation({
      type: values.packagingType,
      quantity: values.packagingQuantity,
      unit: values.packagingUnit,
    });

    /**
     * Stock siempre se cuenta en UNIDADES. La unidad del empaque (50G, 100ML)
     * vive en `presentation` y es solo informativa (contenido por unidad).
     * Antes derivábamos unitOfMeasure desde el packagingUnit, lo que producía
     * stock confuso ("0 G" en Voltaren cuando realmente es "0 tubos").
     */
    const derivedUnitOfMeasure: UnitOfMeasure = 'UND';

    await onSubmit({
      description: values.description.trim(),
      shortName: values.shortName?.trim() || undefined,
      internalCode: values.internalCode?.trim() || undefined,
      presentation: presentation || undefined,
      categoryId: values.categoryId,
      brandId: values.brandId || undefined,
      // El tipo debe ser CONSISTENTE con la condición de venta (antes quedaba
      // siempre 'otc' para medicamentos aunque fueran controlados/con récipe).
      // Para consumo masivo se respeta el tipo elegido (miscelláneos/víveres…).
      productType: isConsumer
        ? values.productType
        : values.isControlled
          ? 'controlled'
          : values.requiresRecipe
            ? 'pharmaceutical'
            : 'otc',
      taxType: values.taxType,
      isControlled: values.isControlled,
      isAntibiotic: values.isAntibiotic,
      isImported: values.isImported,
      requiresRecipe: values.requiresRecipe,
      tracksExpiration: values.tracksExpiration,
      isWeighable: values.isWeighable,
      unitOfMeasure: derivedUnitOfMeasure,
      decimalPlaces: values.decimalPlaces ? Number(values.decimalPlaces) : undefined,
      pmvp: values.pmvp ? Number(values.pmvp) : undefined,
      targetMarginPct: values.targetMarginPct ? Number(values.targetMarginPct) : undefined,
      conservationType: values.conservationType ? values.conservationType : undefined,
      minTemperature: values.minTemperature ? Number(values.minTemperature) : undefined,
      maxTemperature: values.maxTemperature ? Number(values.maxTemperature) : undefined,
      stockMin: values.stockMin ? Number(values.stockMin) : undefined,
      stockMax: values.stockMax ? Number(values.stockMax) : undefined,
      reorderPoint: values.reorderPoint ? Number(values.reorderPoint) : undefined,
      leadTimeDays: values.leadTimeDays ? Number(values.leadTimeDays) : undefined,
      dosageForm: isConsumer ? undefined : values.dosageForm?.trim() || undefined,
      commercialLineId: isConsumer ? values.commercialLineId || undefined : undefined,
      commercialVariantId: isConsumer ? values.commercialVariantId || undefined : undefined,
      // String legacy: lo derivamos del catálogo seleccionado para compat con
      // queries que aún leen el string. Backend lo persiste pero ya no es
      // fuente de verdad.
      commercialLine: isConsumer
        ? commercialLines.find((l) => l.id === values.commercialLineId)?.name || undefined
        : undefined,
      commercialVariant: isConsumer
        ? commercialVariants.find((v) => v.id === values.commercialVariantId)?.name || undefined
        : undefined,
      // Arrays are only submitted in create mode (update endpoint ignores them).
      barcodes:
        !isEdit && values.barcodes.length > 0
          ? values.barcodes.map((b) => ({
              barcode: b.barcode.trim(),
              barcodeType: b.barcodeType,
              isPrimary: b.isPrimary,
            }))
          : undefined,
      activeIngredients:
        !isEdit && !isConsumer && values.activeIngredients.length > 0
          ? values.activeIngredients.map((i) => ({
              activeIngredientId: i.activeIngredientId,
              concentration: i.concentrationValue?.trim()
                ? `${i.concentrationValue.trim().replace(',', '.')} ${i.concentrationUnit || 'mg'}`
                : undefined,
              isPrimary: i.isPrimary,
            }))
          : undefined,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* ──────────────── 1. Naturaleza del Producto ──────────────── */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                fontWeight: 700,
                letterSpacing: '0.06em',
                mb: 1,
              }}
            >
              1. NATURALEZA DEL PRODUCTO
            </Typography>
            <Controller
              name="productNature"
              control={control}
              render={({ field }) => (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  {PRODUCT_NATURE_OPTIONS.map((opt) => {
                    const selected = field.value === opt.value;
                    return (
                      <Box
                        key={opt.value}
                        onClick={() => {
                          // QA: en edición NO se puede cambiar la naturaleza del
                          // producto (medicina ↔ miscelaneo). Permitirlo dejaría
                          // tickets/lotes/precios viejos huérfanos con un
                          // taxType incoherente. Si se necesita cambiar, hay que
                          // dar de baja el producto y crearlo de nuevo.
                          if (isEdit) return;
                          field.onChange(opt.value);
                          // Mapeo automático a productType (compat backend).
                          // medical → otc (default; el operador refina con
                          // los flags de "Condición de venta" y "Antibiótico").
                          if (opt.value === 'consumer') {
                            setValue('productType', 'miscellaneous');
                          } else {
                            setValue('productType', 'otc');
                          }
                        }}
                        sx={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          py: 1,
                          px: 1.5,
                          borderRadius: 1,
                          cursor: isEdit && !selected ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          opacity: isEdit && !selected ? 0.4 : 1,
                          border: (theme) =>
                            `1px solid ${
                              selected
                                ? theme.vars.palette[opt.accent].main
                                : theme.vars.palette.divider
                            }`,
                          bgcolor: (theme) =>
                            selected
                              ? `${theme.vars.palette[opt.accent].lighter}`
                              : theme.vars.palette.background.paper,
                          color: (theme) =>
                            selected
                              ? theme.vars.palette[opt.accent].darker
                              : theme.vars.palette.text.primary,
                          fontWeight: selected ? 700 : 500,
                          transition: 'all 0.15s',
                          '&:hover': {
                            bgcolor: (theme) =>
                              selected
                                ? theme.vars.palette[opt.accent].lighter
                                : isEdit
                                  ? theme.vars.palette.background.paper
                                  : theme.vars.palette.action.hover,
                          },
                        }}
                      >
                        {opt.label}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            />
          </Box>

          {/* ──────────────── 2. Identificación Principal ─────────────── */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                fontWeight: 700,
                letterSpacing: '0.06em',
                mb: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                pb: 1,
              }}
            >
              2. IDENTIFICACIÓN PRINCIPAL
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Field.IdAutocomplete
                  name="categoryId"
                  label="Categoría"
                  placeholder="Buscar categoría…"
                  disabled={loadingCategories}
                  loading={loadingCategories}
                  options={categories.map((c) => ({ id: c.id, label: c.name }))}
                />
                <Tooltip title="Crear nueva categoría">
                  <IconButton
                    color="primary"
                    sx={{ mt: 0.5 }}
                    onClick={() => setQuickOpen('category')}
                  >
                    <Iconify icon="solar:add-circle-bold" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Field.IdAutocomplete
                  name="brandId"
                  label={
                    watchedNature === 'consumer'
                      ? 'Marca Principal (opcional)'
                      : 'Laboratorio / Marca (opcional)'
                  }
                  placeholder="Buscar marca…"
                  disabled={loadingBrands}
                  loading={loadingBrands}
                  options={brands.map((b) => ({ id: b.id, label: b.name }))}
                />
                <Tooltip title="Crear nueva marca">
                  <IconButton
                    color="primary"
                    sx={{ mt: 0.5 }}
                    onClick={() => setQuickOpen('brand')}
                  >
                    <Iconify icon="solar:add-circle-bold" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Field.Text
                name="shortName"
                label={
                  watchedNature === 'consumer'
                    ? 'Subtítulo / Nombre corto (opcional)'
                    : 'Nombre comercial (opcional)'
                }
                placeholder={watchedNature === 'consumer' ? 'Ej. Línea o subtítulo' : 'Ej. Atamel'}
                helperText={
                  watchedNature === 'consumer'
                    ? 'Subtítulo o nombre corto que acompaña la marca (ej. línea o variante). Opcional.'
                    : 'Nombre con el que se conoce comercialmente el producto. Entra en la construcción del nombre completo.'
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Field.Text
                name="internalCode"
                label="Código interno"
                placeholder={isEdit ? '' : 'Se autogenera si lo dejas vacío'}
                helperText={
                  isEdit
                    ? 'Código asignado por el sistema (no editable).'
                    : 'Opcional. Se autogenera como PROD-000001 si lo dejas vacío.'
                }
                disabled={isEdit}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              {/* QA: el nombre del producto siempre visible — pero bloqueado
                 mientras está en modo auto-generado. Click en el candado pasa
                 a edición manual; click en el lápiz vuelve a auto-generar. */}
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Field.Text
                  name="description"
                  label={autoName ? 'Nombre (auto-generado)' : 'Nombre (edición manual)'}
                  disabled={autoName}
                  helperText={
                    autoName
                      ? 'Se construye automáticamente desde marca, principios activos y empaque. Click en el candado para editar manualmente.'
                      : 'Edición manual. Click en el lápiz para volver a auto-generar.'
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Tooltip title={autoName ? 'Editar manualmente' : 'Volver a auto-generar'}>
                  <IconButton
                    color={autoName ? 'default' : 'primary'}
                    sx={{ mt: 0.5 }}
                    onClick={() => setAutoName((v) => !v)}
                  >
                    <Iconify icon={autoName ? 'solar:lock-password-outline' : 'solar:pen-bold'} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>

          {/* ──────────────── Bloque condicional: Médico ──────────────── */}
          {watchedNature !== 'consumer' && (
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.neutral',
                borderLeft: (theme) => `3px solid ${theme.vars.palette.primary.main}`,
              }}
            >
              <Stack spacing={2}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  CARACTERÍSTICAS MÉDICAS
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Field.Select
                    name="taxType"
                    label="Tipo de IVA"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  >
                    {TAX_TYPE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                  {/* QA #95: 3 estados de condición de venta.
                      - OTC (Venta Libre): no récipe, no controlado.
                      - BTC (Detrás del mostrador): el farmacéutico decide
                        si vende. Sin récipe formal pero no acceso libre.
                      - Controlados: requieren récipe y trazabilidad
                        regulatoria (psicotrópicos, opiáceos, etc.).
                      Se mapea a las dos columnas existentes (requiresRecipe,
                      isControlled) para no romper el schema. */}
                  <Controller
                    name="requiresRecipe"
                    control={control}
                    render={({ field: requiresRecipeField }) => (
                      <Controller
                        name="isControlled"
                        control={control}
                        render={({ field: isControlledField }) => {
                          const saleCondition = isControlledField.value
                            ? 'controlled'
                            : requiresRecipeField.value
                              ? 'btc'
                              : 'otc';
                          return (
                            <TextField
                              select
                              size="medium"
                              label="Condición de venta"
                              value={saleCondition}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === 'otc') {
                                  requiresRecipeField.onChange(false);
                                  isControlledField.onChange(false);
                                } else if (v === 'btc') {
                                  requiresRecipeField.onChange(true);
                                  isControlledField.onChange(false);
                                } else {
                                  requiresRecipeField.onChange(true);
                                  isControlledField.onChange(true);
                                }
                              }}
                              slotProps={{ inputLabel: { shrink: true } }}
                              sx={{ flex: 1 }}
                            >
                              <MenuItem value="otc">OTC (Venta libre)</MenuItem>
                              <MenuItem value="btc" sx={{ color: 'warning.main' }}>
                                BTC (Detrás del mostrador)
                              </MenuItem>
                              <MenuItem value="controlled" sx={{ color: 'error.main' }}>
                                Controlado (con récipe)
                              </MenuItem>
                            </TextField>
                          );
                        }}
                      />
                    )}
                  />
                </Stack>

                {/* "Antibiótico" vive en la sección médica (sujeto a control de
                   resistencia antimicrobiana). El resto de la "configuración
                   avanzada" se quitó (QA 136). */}
                <Field.Switch
                  name="isAntibiotic"
                  label="Antibiótico"
                  helperText="Sujeto a control de resistencia antimicrobiana."
                />

                {/* Composición Farmacológica (principios activos):
                   - En CREATE: usamos field array embebido (los principios
                     viajan junto al POST del producto).
                   - En EDIT: el `ingredientsSlot` monta `IngredientsManager`
                     con CRUD inmediato contra backend. */}
                <Typography variant="subtitle2" sx={{ color: 'text.primary', mt: 1 }}>
                  Composición Farmacológica
                </Typography>
                {isEdit && ingredientsSlot ? (
                  ingredientsSlot
                ) : (
                  <>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Indica los principios activos que contiene el producto.
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Iconify icon="solar:add-circle-bold" />}
                        onClick={() =>
                          ingredientsArray.append({
                            activeIngredientId: '',
                            concentrationValue: '',
                            concentrationUnit: 'mg',
                            isPrimary: ingredientsArray.fields.length === 0,
                          })
                        }
                      >
                        Agregar principio
                      </Button>
                    </Stack>

                    {ingredientsArray.fields.map((field, idx) => (
                      <Stack
                        key={field.id}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                      >
                        <Field.IdAutocomplete
                          name={`activeIngredients.${idx}.activeIngredientId`}
                          label="Principio activo"
                          placeholder="Buscar principio activo…"
                          disabled={loadingIngredients}
                          loading={loadingIngredients}
                          options={ingredientsCatalog.map((ing) => ({
                            id: ing.id,
                            label: ing.name,
                            secondaryLabel: ing.therapeuticUse?.name ?? null,
                          }))}
                        />
                        <Field.Text
                          name={`activeIngredients.${idx}.concentrationValue`}
                          label="Concentración"
                          placeholder="500"
                          slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: {
                              inputMode: 'decimal',
                              pattern: '[0-9]*[.,]?[0-9]*',
                            },
                          }}
                          sx={{ width: { xs: '100%', sm: 130 } }}
                        />
                        <Field.Select
                          name={`activeIngredients.${idx}.concentrationUnit`}
                          label="Unidad"
                          slotProps={{ inputLabel: { shrink: true } }}
                          sx={{ width: { xs: '100%', sm: 110 } }}
                        >
                          {CONCENTRATION_UNITS.map((u) => (
                            <MenuItem key={u} value={u}>
                              {u}
                            </MenuItem>
                          ))}
                        </Field.Select>
                        <IconButton
                          color="error"
                          sx={{ mt: { sm: 1 } }}
                          onClick={() => ingredientsArray.remove(idx)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>
                    ))}
                  </>
                )}
              </Stack>
            </Box>
          )}

          {/* ──────────────── Bloque condicional: Masivo ──────────────── */}
          {/* Visual unificado con el bloque médico: mismo borde primary, mismo
             padding y misma tipografía del subtítulo. Solo cambia el texto
             del subtítulo según la naturaleza del producto. */}
          {watchedNature === 'consumer' && (
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.neutral',
                borderLeft: (theme) => `3px solid ${theme.vars.palette.primary.main}`,
              }}
            >
              <Stack spacing={2}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  CLASIFICACIÓN RETAIL
                </Typography>
                {/* QA #93: línea y variante son catálogos reusables con
                   quick-create. Antes eran strings libres y cada operador
                   inventaba ortografías. */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flex: 1 }}>
                    <Field.IdAutocomplete
                      name="commercialLineId"
                      label="Línea o Sub-marca"
                      placeholder="Buscar o crear línea…"
                      options={commercialLines.map((l) => ({ id: l.id, label: l.name }))}
                    />
                    <Tooltip title="Crear nueva línea">
                      <IconButton
                        color="primary"
                        sx={{ mt: 0.5 }}
                        onClick={() => setQuickOpen('commercial-line')}
                      >
                        <Iconify icon="solar:add-circle-bold" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flex: 1 }}>
                    <Field.IdAutocomplete
                      name="commercialVariantId"
                      label="Tipo / Variante"
                      placeholder="Buscar o crear variante…"
                      options={commercialVariants.map((v) => ({ id: v.id, label: v.name }))}
                    />
                    <Tooltip title="Crear nueva variante">
                      <IconButton
                        color="primary"
                        sx={{ mt: 0.5 }}
                        onClick={() => setQuickOpen('commercial-variant')}
                      >
                        <Iconify icon="solar:add-circle-bold" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
                <Field.Select
                  name="taxType"
                  label="Tipo de IVA"
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  {TAX_TYPE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Field.Select>

                {/* QA: productos de consumo masivo (jabón, papel, peines, etc.)
                   no tienen fecha de vencimiento. Marcando esta opción la
                   recepción no exige `expirationDate` y los lotes se crean
                   con vencimiento NULL. */}
                <Controller
                  name="tracksExpiration"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!field.value}
                          onChange={(e) => field.onChange(!e.target.checked)}
                        />
                      }
                      label="Sin fecha de vencimiento (consumo masivo)"
                    />
                  )}
                />
              </Stack>
            </Box>
          )}

          {/* ──────────────── 3. Presentación Física ──────────────── */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                fontWeight: 700,
                letterSpacing: '0.06em',
                mb: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                pb: 1,
              }}
            >
              3. PRESENTACIÓN FÍSICA
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="flex-start">
              {watchedNature !== 'consumer' && (
                <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      fontWeight: 700,
                      mb: 1,
                      letterSpacing: '0.04em',
                    }}
                  >
                    FORMA FARMACÉUTICA
                  </Typography>
                  {/* Catálogo maestro (dosage_forms): se selecciona de la lista;
                     las nuevas se crean con el botón "+" y quedan como dato
                     maestro reutilizable. El valor actual se incluye en las
                     opciones para no romper productos viejos con formas que aún
                     no estén en el catálogo. */}
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Controller
                      name="dosageForm"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          fullWidth
                          options={Array.from(
                            new Set(
                              [...dosageForms.map((d) => d.name), field.value].filter(Boolean)
                            )
                          )}
                          value={field.value || null}
                          onChange={(_e, next) => field.onChange(next ?? '')}
                          loading={loadingDosageForms}
                          loadingText="Cargando…"
                          noOptionsText="Sin opciones"
                          getOptionLabel={(opt) => opt ?? ''}
                          isOptionEqualToValue={(a, b) => a === b}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Selecciona la forma"
                              placeholder="Buscar forma farmacéutica…"
                              helperText='Si no está en la lista, créala con el botón "+".'
                              slotProps={{ inputLabel: { shrink: true } }}
                            />
                          )}
                        />
                      )}
                    />
                    <Tooltip title="Crear nueva forma farmacéutica">
                      <IconButton
                        color="primary"
                        sx={{ mt: 0.5 }}
                        onClick={() => setQuickOpen('dosage-form')}
                      >
                        <Iconify icon="solar:add-circle-bold" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              )}
              <Box sx={{ flex: 1, width: '100%' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    fontWeight: 700,
                    mb: 1,
                    letterSpacing: '0.04em',
                  }}
                >
                  ESTRUCTURA DE EMPAQUE
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                >
                  <Controller
                    name="packagingType"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={Array.from(
                          new Set(
                            [...packagingTypes.map((p) => p.name), field.value].filter(Boolean)
                          )
                        )}
                        value={field.value || null}
                        onChange={(_e, next) => field.onChange(next ?? '')}
                        loading={loadingPackagingTypes}
                        loadingText="Cargando…"
                        noOptionsText="Sin opciones"
                        getOptionLabel={(opt) => opt ?? ''}
                        isOptionEqualToValue={(a, b) => a === b}
                        sx={{ flex: 1, minWidth: 160 }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Tipo"
                            placeholder="Buscar tipo de empaque…"
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        )}
                      />
                    )}
                  />
                  <Tooltip title="Crear nuevo tipo de empaque">
                    <IconButton
                      color="primary"
                      sx={{ mt: 0.5 }}
                      onClick={() => setQuickOpen('packaging-type')}
                    >
                      <Iconify icon="solar:add-circle-bold" />
                    </IconButton>
                  </Tooltip>
                  <Field.Text
                    name="packagingQuantity"
                    label="Cantidad"
                    placeholder="Ej. 30"
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: { inputMode: 'decimal' },
                    }}
                    sx={{ width: { xs: '100%', sm: 110 } }}
                  />
                  <Field.Select
                    name="packagingUnit"
                    label="Unidad"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: { xs: '100%', sm: 110 } }}
                  >
                    {PACKAGING_UNIT_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* -------- Margen objetivo (precarga al fijar precio) -------- */}
          <Divider sx={{ borderStyle: 'dashed' }} />
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Margen objetivo
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Override por producto. Se precarga al fijar precio (margen sobre venta, editable). Si lo
              dejas vacío se usa el de la categoría y, en su defecto, el margen global.
            </Typography>
            <Box sx={{ mt: 2, maxWidth: 280 }}>
              <Field.Text
                name="targetMarginPct"
                label="Margen objetivo (% sobre venta)"
                placeholder="Ej. 35"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { inputMode: 'decimal', min: 0, max: 99.99, step: 0.5 },
                }}
              />
            </Box>
          </Box>

          {/* -------- Códigos de barras (solo create) -------- */}
          {!isEdit && (
            <>
              <Divider sx={{ borderStyle: 'dashed' }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Códigos de barras
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Un producto puede tener múltiples códigos (EAN-13, UPC, internos, etc.). Marca
                    uno como principal.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={() =>
                    barcodesArray.append({
                      barcode: '',
                      barcodeType: 'ean13',
                      isPrimary: barcodesArray.fields.length === 0,
                    })
                  }
                >
                  Agregar código
                </Button>
              </Stack>

              {barcodesArray.fields.map((field, idx) => (
                <Box
                  key={field.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                  }}
                >
                  <Stack spacing={2}>
                    <Field.Text
                      name={`barcodes.${idx}.barcode`}
                      label="Código"
                      placeholder="7501234567890 (o escanéalo)"
                      slotProps={{ inputLabel: { shrink: true } }}
                      onKeyDown={(e) => {
                        // El lector cierra con Enter; lo interceptamos para que
                        // no envíe el formulario y autodetectamos el tipo por
                        // longitud del código.
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        const code = String(
                          methods.getValues(`barcodes.${idx}.barcode`) ?? ''
                        ).trim();
                        const type =
                          code.length === 13
                            ? 'ean13'
                            : code.length === 8
                              ? 'ean8'
                              : code.length === 12
                                ? 'upc'
                                : 'internal';
                        setValue(`barcodes.${idx}.barcodeType`, type, { shouldDirty: true });
                      }}
                    />
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Field.Select
                        name={`barcodes.${idx}.barcodeType`}
                        label="Tipo"
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ width: 220 }}
                      >
                        {BARCODE_TYPE_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Field.Select>
                      <Controller
                        name={`barcodes.${idx}.isPrimary`}
                        control={control}
                        render={({ field: primaryField }) => (
                          <FormControlLabel
                            label="Principal"
                            sx={{ mx: 0 }}
                            control={
                              <Switch
                                checked={!!primaryField.value}
                                onChange={(_e, checked) => {
                                  if (checked) {
                                    const currentBarcodes = methods.getValues('barcodes') ?? [];
                                    currentBarcodes.forEach((_, i) => {
                                      if (i !== idx) {
                                        setValue(`barcodes.${i}.isPrimary`, false, {
                                          shouldDirty: true,
                                          shouldValidate: false,
                                        });
                                      }
                                    });
                                  }
                                  primaryField.onChange(checked);
                                }}
                              />
                            }
                          />
                        )}
                      />
                      <Box sx={{ flex: 1 }} />
                      <IconButton color="error" onClick={() => barcodesArray.remove(idx)}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </>
          )}
        </Stack>
      </Card>

      {barcodesSlot && (
        <Stack spacing={3} sx={{ mt: 3 }}>
          {barcodesSlot}
        </Stack>
      )}

      <FormFooter
        preview={
          <Box
            sx={{
              px: 3,
              py: 1.5,
              bgcolor: 'common.black',
              color: 'common.white',
              borderLeft: (theme) => `4px solid ${theme.vars.palette.primary.main}`,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 0.5 }}
            >
              <Typography
                variant="caption"
                sx={{ color: 'grey.400', fontWeight: 700, letterSpacing: '0.08em' }}
              >
                {autoName ? 'NOMBRE AUTO-GENERADO' : 'NOMBRE EDITADO MANUALMENTE'}
              </Typography>
              <Tooltip title={autoName ? 'Editar manualmente' : 'Volver a auto-generar'}>
                <IconButton
                  size="small"
                  sx={{ color: 'common.white', opacity: 0.7 }}
                  onClick={() => setAutoName((v) => !v)}
                >
                  <Iconify icon={autoName ? 'solar:lock-password-outline' : 'solar:pen-bold'} />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'monospace',
                letterSpacing: 0.5,
                fontWeight: 700,
                wordBreak: 'break-word',
              }}
            >
              {(autoName ? generatedName : methods.watch('description')) || (
                <Box component="span" sx={{ opacity: 0.5, fontWeight: 400 }}>
                  — Selecciona los campos para generar el nombre —
                </Box>
              )}
            </Typography>
          </Box>
        }
      >
        {onCancel && (
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="contained" loading={submitting}>
          {current ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </FormFooter>

      <QuickCreateCategoryDialog
        open={quickOpen === 'category'}
        onClose={() => setQuickOpen(null)}
        onCreated={(id) => {
          setValue('categoryId', id, { shouldValidate: true, shouldDirty: true });
          setQuickOpen(null);
        }}
      />

      <QuickCreateBrandDialog
        open={quickOpen === 'brand'}
        onClose={() => setQuickOpen(null)}
        onCreated={(id) => {
          setValue('brandId', id, { shouldValidate: true, shouldDirty: true });
          setQuickOpen(null);
        }}
      />

      <QuickCreateIngredientDialog
        open={quickOpen === 'ingredient'}
        onClose={() => {
          setQuickOpen(null);
          setPendingIngredientIdx(null);
        }}
        onCreated={(id) => {
          if (pendingIngredientIdx != null) {
            setValue(`activeIngredients.${pendingIngredientIdx}.activeIngredientId`, id, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
          setPendingIngredientIdx(null);
          setQuickOpen(null);
        }}
      />

      <QuickCreateCommercialTaxonomyDialog
        open={quickOpen === 'commercial-line'}
        kind="line"
        onClose={() => setQuickOpen(null)}
        onCreated={(id) => {
          setValue('commercialLineId', id, { shouldValidate: true, shouldDirty: true });
          setQuickOpen(null);
        }}
      />

      <QuickCreateCommercialTaxonomyDialog
        open={quickOpen === 'commercial-variant'}
        kind="variant"
        onClose={() => setQuickOpen(null)}
        onCreated={(id) => {
          setValue('commercialVariantId', id, { shouldValidate: true, shouldDirty: true });
          setQuickOpen(null);
        }}
      />

      <QuickCreateTaxonomyDialog
        open={quickOpen === 'dosage-form'}
        title="Nueva forma farmacéutica"
        label="Nombre"
        placeholder="Ej. TABLETA"
        pending={createDosageForm.isPending}
        onClose={() => setQuickOpen(null)}
        onCreate={(name) => createDosageForm.mutateAsync(name)}
        onCreated={(name) => {
          setValue('dosageForm', name, { shouldValidate: true, shouldDirty: true });
          setQuickOpen(null);
        }}
      />

      <QuickCreateTaxonomyDialog
        open={quickOpen === 'packaging-type'}
        title="Nuevo tipo de empaque"
        label="Nombre"
        placeholder="Ej. CAJA"
        pending={createPackagingType.isPending}
        onClose={() => setQuickOpen(null)}
        onCreate={(name) => createPackagingType.mutateAsync(name)}
        onCreated={(name) => {
          setValue('packagingType', name, { shouldValidate: true, shouldDirty: true });
          setQuickOpen(null);
        }}
      />
    </Form>
  );
}
