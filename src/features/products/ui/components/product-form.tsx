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
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';
import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { useBrandsQuery } from '@/features/brands/api/brands.queries';
import { useCategoriesQuery } from '@/features/categories/api/categories.queries';
import { useActiveIngredientsQuery } from '@/features/active-ingredients/api/active-ingredients.queries';

import { QuickCreateBrandDialog } from './quick-create-brand-dialog';
import { QuickCreateCategoryDialog } from './quick-create-category-dialog';
import { QuickCreateIngredientDialog } from './quick-create-ingredient-dialog';
import {
  TAX_TYPE_OPTIONS,
  DOSAGE_FORM_OPTIONS,
  BARCODE_TYPE_OPTIONS,
  PACKAGING_TYPE_OPTIONS,
  PACKAGING_UNIT_OPTIONS,
  PRODUCT_NATURE_OPTIONS,
} from '../../model/constants';

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

const CONCENTRATION_UNITS = ['mg', 'g', 'mcg', 'kg', 'mL', 'L', 'UI', '%', 'mEq'] as const;

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
  productNature: z.enum(['generic', 'commercial', 'consumer']),
  taxType: z.enum(['exempt', 'general', 'reduced']),
  isControlled: z.boolean(),
  isAntibiotic: z.boolean(),
  isImported: z.boolean(),
  requiresRecipe: z.boolean(),
  isWeighable: z.boolean(),
  unitOfMeasure: z.enum(['UND', 'KG', 'G', 'L', 'ML']),
  decimalPlaces: optionalNumber,
  pmvp: optionalNumber,
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
  commercialLine: z.string().max(100).optional().or(z.literal('')),
  commercialVariant: z.string().max(100).optional().or(z.literal('')),
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

/**
 * Infiere la "naturaleza" del producto a partir de los campos guardados:
 * - Si tiene commercialLine/Variant → 'consumer'
 * - Si tiene shortName/brandId pero NO commercialLine → 'commercial'
 * - El resto (solo principio activo, sin marca comercial fuerte) → 'generic'
 *
 * Se usa solo para inicializar el form en modo edit; el operador puede
 * cambiarla manualmente con el radio selector.
 */
function inferProductNature(p?: Product): 'generic' | 'commercial' | 'consumer' {
  if (!p) return 'commercial';
  if (p.commercialLine || p.commercialVariant) return 'consumer';
  if (p.productType === 'grocery' || p.productType === 'miscellaneous') return 'consumer';
  if (p.shortName || p.brandId) return 'commercial';
  return 'generic';
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
    isWeighable: p?.isWeighable ?? false,
    unitOfMeasure: (p?.unitOfMeasure as UnitOfMeasure) ?? 'UND',
    decimalPlaces: p?.decimalPlaces != null ? String(p.decimalPlaces) : '0',
    pmvp: p?.pmvp != null ? String(p.pmvp) : '',
    conservationType: (p?.conservationType as ConservationType | null) ?? 'ambient',
    minTemperature: p?.minTemperature != null ? String(p.minTemperature) : '',
    maxTemperature: p?.maxTemperature != null ? String(p.maxTemperature) : '',
    stockMin: p?.stockMin != null ? String(p.stockMin) : '0',
    stockMax: p?.stockMax != null ? String(p.stockMax) : '',
    reorderPoint: p?.reorderPoint != null ? String(p.reorderPoint) : '',
    leadTimeDays: p?.leadTimeDays != null ? String(p.leadTimeDays) : '',
    dosageForm: p?.dosageForm ?? '',
    commercialLine: p?.commercialLine ?? '',
    commercialVariant: p?.commercialVariant ?? '',
    packagingType: pkg.type,
    packagingQuantity: pkg.quantity,
    packagingUnit: pkg.unit,
    barcodes: [],
    activeIngredients: [],
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
 *   - **Genérico**: <Activos> <Forma> <Laboratorio> <Empaque>
 *     Ej: ACETAMINOFEN 500MG TAB GENVEN CJA X30
 *
 *   - **Comercial**: <Marca/NombreCom> <Activos> <Forma> <Empaque>
 *     Ej: ATAMEL ACETAMINOFEN 500MG TAB CJA X30
 *
 *   - **Masivo**: <Marca> <Línea> <Variante> <Empaque>
 *     Ej: COLGATE TOTAL 12 CLEAN MINT CREMA DENTAL TUB X75ML
 *
 * Cuando `commercialName` está vacío en comercial, se omite y queda solo
 * activos+forma+empaque (similar a genérico sin laboratorio).
 */
function composeProductName(input: {
  nature: 'generic' | 'commercial' | 'consumer';
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
  const commercial = (input.commercialName || '').toUpperCase();
  const brand = (input.brandName || '').toUpperCase();

  const parts: string[] = [];
  if (input.nature === 'consumer') {
    if (brand) parts.push(brand);
    const line = (input.commercialLine || '').toUpperCase();
    const variant = (input.commercialVariant || '').toUpperCase();
    if (line) parts.push(line);
    if (variant) parts.push(variant);
    if (pkg) parts.push(pkg);
  } else if (input.nature === 'commercial') {
    if (commercial) parts.push(commercial);
    if (activos) parts.push(activos);
    if (dosage) parts.push(dosage);
    if (pkg) parts.push(pkg);
  } else {
    // generic: activos primero, laboratorio al final
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
  const { data: ingredientsCatalog = [], isLoading: loadingIngredients } =
    useActiveIngredientsQuery();

  const [quickOpen, setQuickOpen] = useState<'category' | 'brand' | 'ingredient' | null>(null);
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
  const watchedCommercialLine = useWatch({ control, name: 'commercialLine' });
  const watchedCommercialVariant = useWatch({ control, name: 'commercialVariant' });

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
      nature: watchedNature ?? 'commercial',
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
    if (current) reset(toFormValues(current));
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
     * Derivamos la unidad de venta (`unitOfMeasure`) automáticamente desde la
     * unidad del empaque, eliminando la duplicación que tenía el form viejo.
     * Mapeo: KG/G → KG ó G (peso), L/ML → L ó ML (volumen), resto → UND.
     * Para productos sin empaque definido, default UND.
     */
    const derivedUnitOfMeasure: UnitOfMeasure = (() => {
      const pkgUnit = (values.packagingUnit || '').toUpperCase();
      if (pkgUnit === 'KG' || pkgUnit === 'G') return pkgUnit as UnitOfMeasure;
      if (pkgUnit === 'L' || pkgUnit === 'ML') return pkgUnit as UnitOfMeasure;
      return 'UND';
    })();

    await onSubmit({
      description: values.description.trim(),
      shortName: values.shortName?.trim() || undefined,
      internalCode: values.internalCode?.trim() || undefined,
      presentation: presentation || undefined,
      categoryId: values.categoryId,
      brandId: values.brandId || undefined,
      productType: values.productType,
      taxType: values.taxType,
      isControlled: values.isControlled,
      isAntibiotic: values.isAntibiotic,
      isImported: values.isImported,
      requiresRecipe: values.requiresRecipe,
      isWeighable: values.isWeighable,
      unitOfMeasure: derivedUnitOfMeasure,
      decimalPlaces: values.decimalPlaces ? Number(values.decimalPlaces) : undefined,
      pmvp: values.pmvp ? Number(values.pmvp) : undefined,
      conservationType: values.conservationType ? values.conservationType : undefined,
      minTemperature: values.minTemperature ? Number(values.minTemperature) : undefined,
      maxTemperature: values.maxTemperature ? Number(values.maxTemperature) : undefined,
      stockMin: values.stockMin ? Number(values.stockMin) : undefined,
      stockMax: values.stockMax ? Number(values.stockMax) : undefined,
      reorderPoint: values.reorderPoint ? Number(values.reorderPoint) : undefined,
      leadTimeDays: values.leadTimeDays ? Number(values.leadTimeDays) : undefined,
      dosageForm: isConsumer ? undefined : values.dosageForm?.trim() || undefined,
      commercialLine: isConsumer ? values.commercialLine?.trim() || undefined : undefined,
      commercialVariant: isConsumer ? values.commercialVariant?.trim() || undefined : undefined,
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
                          field.onChange(opt.value);
                          // Mapeo automático a productType para mantener compat con backend.
                          if (opt.value === 'consumer') {
                            setValue('productType', 'miscellaneous');
                          } else if (opt.value === 'commercial') {
                            setValue('productType', 'otc');
                          } else {
                            setValue('productType', 'pharmaceutical');
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
                          cursor: 'pointer',
                          fontSize: 13,
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
                    watchedNature === 'generic'
                      ? 'Laboratorio Fabricante (opcional)'
                      : watchedNature === 'consumer'
                        ? 'Marca Principal (opcional)'
                        : 'Marca / Laboratorio (opcional)'
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

              {watchedNature !== 'consumer' && (
                <Field.Text
                  name="shortName"
                  label="Nombre comercial (opcional)"
                  placeholder="Ej. Atamel"
                  helperText="Nombre con el que se conoce comercialmente el producto. Entra en la construcción del nombre completo."
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}

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
                  <Controller
                    name="requiresRecipe"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        select
                        size="medium"
                        label="Condición de venta"
                        value={field.value ? 'rx' : 'otc'}
                        onChange={(e) => field.onChange(e.target.value === 'rx')}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ flex: 1 }}
                      >
                        <MenuItem value="otc">OTC (Venta Libre)</MenuItem>
                        <MenuItem value="rx" sx={{ color: 'error.main' }}>
                          Rx (Con Récipe)
                        </MenuItem>
                      </TextField>
                    )}
                  />
                </Stack>

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
          {watchedNature === 'consumer' && (
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.neutral',
                borderLeft: (theme) => `3px solid ${theme.vars.palette.success.main}`,
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
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Field.Text
                    name="commercialLine"
                    label="Línea o Sub-marca"
                    placeholder="Ej. Total 12 Clean Mint"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  />
                  <Field.Text
                    name="commercialVariant"
                    label="Tipo / Variante"
                    placeholder="Ej. CREMA DENTAL"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  />
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
                  <Field.Select
                    name="dosageForm"
                    label="Selecciona la forma"
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  >
                    <MenuItem value="">— Selecciona —</MenuItem>
                    {DOSAGE_FORM_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
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
                  <Field.Select
                    name="packagingType"
                    label="Tipo"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1, minWidth: 160 }}
                  >
                    <MenuItem value="">— Selecciona tipo —</MenuItem>
                    {PACKAGING_TYPE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
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

          {/* Toggle compacto: vista preview vs edición manual.
             El nombre se muestra en el sticky preview del FormFooter abajo. */}
          {!autoName && (
            <Field.Text
              name="description"
              label="Descripción (edición manual)"
              helperText="Click en el candado del preview inferior para volver a auto-generar."
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}

          {/* ──────────────── Configuración avanzada (colapsable) ──────────────── */}
          <Accordion
            disableGutters
            sx={{
              bgcolor: 'background.neutral',
              '&::before': { display: 'none' },
              boxShadow: 'none',
              border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
              borderRadius: 1,
              // El theme global pone padding lateral 0 en summary/details cuando
              // disableGutters está activo. Lo restauramos para esta sección.
              '& .MuiAccordionSummary-root': { px: 2.5, py: 1, minHeight: 56 },
              '& .MuiAccordionDetails-root': { px: 2.5, pt: 1, pb: 2.5 },
            }}
          >
            <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
              <Typography variant="subtitle2">Configuración avanzada</Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', ml: 1.5, alignSelf: 'center' }}
              >
                PMVP, regulación, stock
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                <Field.Text
                  name="pmvp"
                  label="PMVP — Precio Máximo de Venta al Público (opcional)"
                  placeholder="Ej. 5.50"
                  helperText="Regulado por SUNDDE para medicamentos."
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Regulación
                </Typography>
                <Stack spacing={1}>
                  <Field.Switch
                    name="isControlled"
                    label="Sustancia controlada"
                    helperText="Medicamento psicotrópico o estupefaciente."
                  />
                  <Field.Switch
                    name="isAntibiotic"
                    label="Antibiótico"
                    helperText="Sujeto a control de resistencia antimicrobiana."
                  />
                  <Field.Switch
                    name="isImported"
                    label="Producto importado"
                    helperText="Puede activar aprobación especial en OCs."
                  />
                </Stack>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Inventario
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Field.Text
                    name="stockMin"
                    label="Stock mínimo"
                    placeholder="Ej. 10"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  />
                  <Field.Text
                    name="stockMax"
                    label="Stock máximo (opcional)"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Field.Text
                    name="reorderPoint"
                    label="Punto de reorden"
                    placeholder="Ej. 20"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  />
                  <Field.Text
                    name="leadTimeDays"
                    label="Lead time (días)"
                    placeholder="Ej. 3"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  />
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>

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
                      placeholder="7501234567890"
                      slotProps={{ inputLabel: { shrink: true } }}
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
              borderLeft: (theme) =>
                `4px solid ${
                  watchedNature === 'consumer'
                    ? theme.vars.palette.success.main
                    : theme.vars.palette.primary.main
                }`,
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
    </Form>
  );
}
