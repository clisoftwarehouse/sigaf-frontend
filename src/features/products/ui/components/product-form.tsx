import type {
  Product,
  UnitOfMeasure,
  ConservationType,
  CreateProductPayload,
} from '../../model/types';

import * as z from 'zod';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/app/components/iconify';
import { Form, Field } from '@/app/components/hook-form';
import { useBrandsQuery } from '@/features/brands/api/brands.queries';
import { useCategoriesQuery } from '@/features/categories/api/categories.queries';
import { useActiveIngredientsQuery } from '@/features/active-ingredients/api/active-ingredients.queries';

import { QuickCreateBrandDialog } from './quick-create-brand-dialog';
import { QuickCreateCategoryDialog } from './quick-create-category-dialog';
import { QuickCreateIngredientDialog } from './quick-create-ingredient-dialog';
import {
  TAX_TYPE_OPTIONS,
  BARCODE_TYPE_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  CONSERVATION_OPTIONS,
  UNIT_OF_MEASURE_OPTIONS,
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

const IngredientItemSchema = z.object({
  activeIngredientId: z.string().uuid({ message: 'Selecciona un principio activo' }),
  concentration: z.string().max(50).optional().or(z.literal('')),
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
  taxType: z.enum(['exempt', 'general', 'reduced']),
  isControlled: z.boolean(),
  isAntibiotic: z.boolean(),
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
  barcodes: z.array(BarcodeItemSchema),
  activeIngredients: z.array(IngredientItemSchema),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

// ----------------------------------------------------------------------

function toFormValues(p?: Product): ProductFormValues {
  return {
    description: p?.description ?? '',
    shortName: p?.shortName ?? '',
    internalCode: p?.internalCode ?? '',
    presentation: p?.presentation ?? '',
    categoryId: p?.categoryId ?? '',
    brandId: p?.brandId ?? '',
    productType: p?.productType ?? 'otc',
    taxType: p?.taxType ?? 'exempt',
    isControlled: p?.isControlled ?? false,
    isAntibiotic: p?.isAntibiotic ?? false,
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
    barcodes: [],
    activeIngredients: [],
  };
}

type Props = {
  current?: Product;
  submitting?: boolean;
  onSubmit: (values: CreateProductPayload) => Promise<void> | void;
  onCancel?: () => void;
};

export function ProductForm({ current, submitting, onSubmit, onCancel }: Props) {
  const isEdit = Boolean(current);

  const { flat: categories, isLoading: loadingCategories } = useCategoriesQuery();
  const { data: brands = [], isLoading: loadingBrands } = useBrandsQuery();
  const { data: ingredientsCatalog = [], isLoading: loadingIngredients } =
    useActiveIngredientsQuery();

  const [quickOpen, setQuickOpen] = useState<'category' | 'brand' | 'ingredient' | null>(null);
  const [pendingIngredientIdx, setPendingIngredientIdx] = useState<number | null>(null);

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: toFormValues(current),
  });

  const { control, handleSubmit, reset, setValue } = methods;
  const barcodesArray = useFieldArray({ control, name: 'barcodes' });
  const ingredientsArray = useFieldArray({ control, name: 'activeIngredients' });

  useEffect(() => {
    if (current) reset(toFormValues(current));
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      description: values.description.trim(),
      shortName: values.shortName?.trim() || undefined,
      internalCode: values.internalCode?.trim() || undefined,
      presentation: values.presentation?.trim() || undefined,
      categoryId: values.categoryId,
      brandId: values.brandId || undefined,
      productType: values.productType,
      taxType: values.taxType,
      isControlled: values.isControlled,
      isAntibiotic: values.isAntibiotic,
      requiresRecipe: values.requiresRecipe,
      isWeighable: values.isWeighable,
      unitOfMeasure: values.unitOfMeasure,
      decimalPlaces: values.decimalPlaces ? Number(values.decimalPlaces) : undefined,
      pmvp: values.pmvp ? Number(values.pmvp) : undefined,
      conservationType: values.conservationType ? values.conservationType : undefined,
      minTemperature: values.minTemperature ? Number(values.minTemperature) : undefined,
      maxTemperature: values.maxTemperature ? Number(values.maxTemperature) : undefined,
      stockMin: values.stockMin ? Number(values.stockMin) : undefined,
      stockMax: values.stockMax ? Number(values.stockMax) : undefined,
      reorderPoint: values.reorderPoint ? Number(values.reorderPoint) : undefined,
      leadTimeDays: values.leadTimeDays ? Number(values.leadTimeDays) : undefined,
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
        !isEdit && values.activeIngredients.length > 0
          ? values.activeIngredients.map((i) => ({
              activeIngredientId: i.activeIngredientId,
              concentration: i.concentration?.trim() || undefined,
              isPrimary: i.isPrimary,
            }))
          : undefined,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* -------- Identificación -------- */}
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Identificación
          </Typography>

          <Field.Text
            name="description"
            label="Descripción"
            placeholder="Ej. Acetaminofén 500mg x 20 tabletas"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            name="shortName"
            label="Nombre corto (opcional)"
            placeholder="Ej. Acetaminofén 500mg"
            helperText="Usado en tickets y resultados de búsqueda."
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="internalCode"
              label="Código interno"
              placeholder={isEdit ? '' : 'Se autogenera si lo dejas vacío'}
              helperText={
                isEdit
                  ? 'Código asignado por el sistema (no editable).'
                  : 'Opcional. Si lo dejas vacío se autogenera como PROD-000001, PROD-000002, …'
              }
              disabled={isEdit}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="presentation"
              label="Presentación (opcional)"
              placeholder="Ej. Caja x 20 tabletas"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* -------- Clasificación -------- */}
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Clasificación
          </Typography>

          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Field.Select
              name="categoryId"
              label="Categoría"
              disabled={loadingCategories}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">— Selecciona una categoría —</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Field.Select>
            <Tooltip title="Crear nueva categoría">
              <IconButton color="primary" sx={{ mt: 0.5 }} onClick={() => setQuickOpen('category')}>
                <Iconify icon="solar:add-circle-bold" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Field.Select
              name="brandId"
              label="Marca (opcional)"
              disabled={loadingBrands}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">— Sin marca —</MenuItem>
              {brands.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Field.Select>
            <Tooltip title="Crear nueva marca">
              <IconButton color="primary" sx={{ mt: 0.5 }} onClick={() => setQuickOpen('brand')}>
                <Iconify icon="solar:add-circle-bold" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Select
              name="productType"
              label="Tipo de producto"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            >
              {PRODUCT_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Field.Select>

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
          </Stack>

          <Field.Text
            name="pmvp"
            label="PMVP — Precio Máximo de Venta al Público (opcional)"
            placeholder="Ej. 5.50"
            helperText="Regulado por SUNDDE para medicamentos."
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* -------- Regulación -------- */}
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Regulación
          </Typography>

          <Stack spacing={1}>
            <Field.Switch
              name="isControlled"
              label="Sustancia controlada"
              helperText="Medicamento psicotrópico o estupefaciente. Requiere seguimiento especial."
            />
            <Field.Switch
              name="requiresRecipe"
              label="Requiere récipe médico"
              helperText="No puede venderse sin prescripción."
            />
            <Field.Switch
              name="isAntibiotic"
              label="Antibiótico"
              helperText="Sujeto a control de resistencia antimicrobiana."
            />
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* -------- Conservación -------- */}
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Conservación
          </Typography>

          <Field.Select
            name="conservationType"
            label="Tipo de conservación"
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {CONSERVATION_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="minTemperature"
              label="Temperatura mínima (°C)"
              placeholder="Ej. 2"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="maxTemperature"
              label="Temperatura máxima (°C)"
              placeholder="Ej. 8"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* -------- Inventario -------- */}
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Inventario
          </Typography>

          <Field.Switch
            name="isWeighable"
            label="Producto pesable (fraccionable)"
            helperText="Si se activa, el backend fuerza la unidad a KG y 3 decimales."
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Select
              name="unitOfMeasure"
              label="Unidad de medida"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            >
              {UNIT_OF_MEASURE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Field.Select>
            <Field.Text
              name="decimalPlaces"
              label="Decimales"
              placeholder="Ej. 0"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

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
                      <Field.Switch
                        name={`barcodes.${idx}.isPrimary`}
                        label="Principal"
                        sx={{ mx: 0 }}
                      />
                      <Box sx={{ flex: 1 }} />
                      <IconButton color="error" onClick={() => barcodesArray.remove(idx)}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              ))}

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* -------- Principios activos (solo create) -------- */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Principios activos
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Indica cuál(es) contiene el producto. Necesario para encontrar sustitutos
                    genéricos.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={() =>
                    ingredientsArray.append({
                      activeIngredientId: '',
                      concentration: '',
                      isPrimary: ingredientsArray.fields.length === 0,
                    })
                  }
                >
                  Agregar principio activo
                </Button>
              </Stack>

              {ingredientsArray.fields.map((field, idx) => (
                <Box
                  key={field.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Field.Select
                        name={`activeIngredients.${idx}.activeIngredientId`}
                        label="Principio activo"
                        disabled={loadingIngredients}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ flex: 1 }}
                      >
                        <MenuItem value="">— Selecciona —</MenuItem>
                        {ingredientsCatalog.map((ing) => (
                          <MenuItem key={ing.id} value={ing.id}>
                            {ing.name}
                          </MenuItem>
                        ))}
                      </Field.Select>
                      <Tooltip title="Crear nuevo principio activo">
                        <IconButton
                          color="primary"
                          sx={{ mt: 0.5 }}
                          onClick={() => {
                            setPendingIngredientIdx(idx);
                            setQuickOpen('ingredient');
                          }}
                        >
                          <Iconify icon="solar:add-circle-bold" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Field.Text
                        name={`activeIngredients.${idx}.concentration`}
                        label="Concentración"
                        placeholder="Ej. 500mg"
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ flex: 1, maxWidth: 260 }}
                      />
                      <Field.Switch
                        name={`activeIngredients.${idx}.isPrimary`}
                        label="Principal"
                        sx={{ mx: 0 }}
                      />
                      <Box sx={{ flex: 1 }} />
                      <IconButton color="error" onClick={() => ingredientsArray.remove(idx)}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              {current ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </Box>
        </Stack>
      </Card>

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
