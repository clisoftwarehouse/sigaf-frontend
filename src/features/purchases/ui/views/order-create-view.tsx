import type {
  PurchaseOrder,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
} from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useProductsQuery } from '@/features/products/api/products.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';
import { fetchSupplierProducts } from '@/features/suppliers/api/suppliers.api';

import { ORDER_TYPE_OPTIONS } from '../../model/constants';
import { useCreateOrderMutation, useUpdateOrderMutation } from '../../api/purchases.queries';

// ----------------------------------------------------------------------

// QA 143: la OC vuelve a solicitar el costo unitario negociado por artículo
// (el costo real se ajusta luego en la recepción contra la factura). El
// descuento comercial es opcional.
const ItemSchema = z.object({
  productId: z.string().uuid({ message: 'Selecciona un producto' }),
  quantity: z
    .string()
    .min(1, { message: 'Obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { message: '> 0' }),
  unitCost: z
    .string()
    .min(1, { message: 'Obligatorio' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '>= 0' }),
  discountPct: z
    .string()
    .optional()
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 100), {
      message: '0–100',
    }),
});

const OrderSchema = z.object({
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  supplierId: z.string().uuid({ message: 'Selecciona un proveedor' }),
  orderType: z.enum(['purchase', 'consignment']),
  expectedDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(ItemSchema).min(1, { message: 'Agrega al menos un ítem' }),
});

type FormValues = z.infer<typeof OrderSchema>;

const fmtUsd = (n: number) => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;

/** Subtotal de una línea: cantidad × costo × (1 − descuento%). */
function lineSubtotalUsd(item?: { quantity?: string; unitCost?: string; discountPct?: string }): number {
  const q = Number(item?.quantity) || 0;
  const c = Number(item?.unitCost) || 0;
  const d = Number(item?.discountPct) || 0;
  return q * c * (1 - d / 100);
}

// ----------------------------------------------------------------------

type Props = {
  /**
   * Si se pasa, la vista funciona en modo edición — pre-llena el form con
   * los datos de la OC, usa useUpdateOrderMutation y redirige al detalle al
   * guardar. Solo permitido cuando la OC está en draft (validado en backend).
   */
  editingOrder?: PurchaseOrder;
};

export function OrderCreateView({ editingOrder }: Props = {}) {
  const router = useRouter();
  const isEdit = !!editingOrder;
  const createMutation = useCreateOrderMutation();
  const updateMutation = useUpdateOrderMutation();
  const mutation = isEdit ? updateMutation : createMutation;

  const { data: branches = [] } = useBranchesQuery();
  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true });
  const { data: productsData } = useProductsQuery({ limit: 1000, isActive: true });
  const products = useMemo(() => productsData?.data ?? [], [productsData]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p] as const)), [products]);

  const methods = useForm<FormValues>({
    mode: 'onBlur',
    resolver: zodResolver(OrderSchema),
    defaultValues: editingOrder
      ? {
          branchId: editingOrder.branchId,
          supplierId: editingOrder.supplierId,
          orderType: editingOrder.orderType,
          expectedDate: editingOrder.expectedDate ?? '',
          notes: editingOrder.notes ?? '',
          items:
            editingOrder.items?.map((i) => ({
              productId: i.productId,
              quantity: String(Number(i.quantity)),
              unitCost: String(Number(i.unitCostUsd ?? 0)),
              discountPct: i.discountPct != null ? String(Number(i.discountPct)) : '',
            })) ?? [{ productId: '', quantity: '', unitCost: '', discountPct: '' }],
        }
      : {
          branchId: '',
          supplierId: '',
          orderType: 'purchase',
          expectedDate: '',
          notes: '',
          items: [{ productId: '', quantity: '', unitCost: '', discountPct: '' }],
        },
  });

  const { control, setValue } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = useWatch({ control, name: 'items' }) ?? [];
  const watchedSupplierId = useWatch({ control, name: 'supplierId' });

  // QA 145: costos negociados del proveedor seleccionado, para pre-cargar el
  // costo al elegir un producto (el usuario puede sobreescribirlo).
  const { data: supplierProducts = [] } = useQuery({
    queryKey: ['supplier-products', watchedSupplierId],
    queryFn: () => fetchSupplierProducts(watchedSupplierId),
    enabled: Boolean(watchedSupplierId),
  });
  const supplierCostByProduct = useMemo(
    () => new Map(supplierProducts.map((sp) => [sp.productId, sp] as const)),
    [supplierProducts]
  );

  // QA 146: si algún artículo pertenece a una categoría sensible, avisamos que
  // la orden requerirá aprobación especial (el backend lo exige al aprobar).
  const sensitiveFlags = new Set<string>();
  for (const it of watchedItems) {
    const p = it?.productId ? productById.get(it.productId) : undefined;
    if (!p) continue;
    if (p.isControlled) sensitiveFlags.add('Controlados/Psicotrópicos');
    if (p.isAntibiotic) sensitiveFlags.add('Antibióticos');
    if (p.conservationType === 'cold_chain') sensitiveFlags.add('Cadena de frío');
    if (p.isImported) sensitiveFlags.add('Importados');
  }
  const sensitiveCategories = [...sensitiveFlags];

  const submit = methods.handleSubmit(async (values) => {
    try {
      if (isEdit && editingOrder) {
        const updatePayload: UpdatePurchaseOrderPayload = {
          expectedDate: values.expectedDate || undefined,
          notes: values.notes?.trim() || undefined,
          items: values.items.map((i) => ({
            productId: i.productId,
            quantity: Number(i.quantity),
            unitCostUsd: Number(i.unitCost),
            discountPct: i.discountPct ? Number(i.discountPct) : 0,
          })),
        };
        await updateMutation.mutateAsync({ id: editingOrder.id, payload: updatePayload });
        toast.success(`Orden ${editingOrder.orderNumber} actualizada`);
        router.push(paths.dashboard.purchases.orders.detail(editingOrder.id));
      } else {
        const createPayload: CreatePurchaseOrderPayload = {
          branchId: values.branchId,
          supplierId: values.supplierId,
          orderType: values.orderType,
          expectedDate: values.expectedDate || undefined,
          notes: values.notes?.trim() || undefined,
          items: values.items.map((i) => ({
            productId: i.productId,
            quantity: Number(i.quantity),
            unitCostUsd: Number(i.unitCost),
            discountPct: i.discountPct ? Number(i.discountPct) : 0,
          })),
        };
        const created = await createMutation.mutateAsync(createPayload);
        toast.success(`Orden ${created.orderNumber} creada`);
        router.push(paths.dashboard.purchases.orders.detail(created.id));
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title={isEdit ? `Editar ${editingOrder?.orderNumber ?? 'orden'}` : 'Nueva orden de compra'}
        subtitle={
          isEdit
            ? 'Modifica los ítems de esta OC en borrador. Sucursal y proveedor no son editables — crea una OC nueva si necesitas cambiarlos.'
            : 'Crea una orden en estado borrador. Puedes aprobarla desde su detalle.'
        }
        crumbs={[
          { label: 'Compras' },
          { label: 'Órdenes' },
          { label: isEdit ? 'Editar' : 'Nueva' },
        ]}
      />

      <Form methods={methods} onSubmit={submit}>
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Encabezado
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Select
                name="branchId"
                label="Sucursal"
                disabled={isEdit}
                helperText={isEdit ? 'No editable. Crea una OC nueva si quieres cambiar la sucursal.' : undefined}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              >
                <MenuItem value="">— Selecciona —</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Field.Select>
              <Box sx={{ flex: 1 }}>
                <Field.IdAutocomplete
                  name="supplierId"
                  label="Proveedor"
                  placeholder="Buscar proveedor por nombre o RIF…"
                  disabled={isEdit}
                  helperText={
                    isEdit
                      ? 'No editable. Crea una OC nueva si quieres cambiar el proveedor.'
                      : undefined
                  }
                  options={suppliers.map((s) => ({
                    id: s.id,
                    label: s.businessName,
                    secondaryLabel: s.rif ?? null,
                  }))}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Select
                name="orderType"
                label="Tipo de orden"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', md: 200 }, flexShrink: 0 }}
              >
                {ORDER_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text
                name="expectedDate"
                label="Fecha esperada"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', md: 180 }, flexShrink: 0 }}
              />
              <Field.Text
                name="notes"
                label="Notas"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Ítems ({fields.length})
            </Typography>

            {fields.map((field, idx) => {
              const current = watchedItems[idx];
              const product = current?.productId ? productById.get(current.productId) : undefined;
              const stock = product?.totalStock != null ? Number(product.totalStock) : null;
              return (
                <Box key={field.id}>
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Box sx={{ flex: 1 }}>
                      <Stack spacing={2}>
                        <Controller
                          control={control}
                          name={`items.${idx}.productId`}
                          render={({ field: f, fieldState }) => {
                            const value = products.find((p) => p.id === f.value) ?? null;
                            return (
                              <Autocomplete
                                options={products}
                                value={value}
                                onChange={(_e, next) => {
                                  f.onChange(next?.id ?? '');
                                  // Pre-carga el costo negociado del proveedor
                                  // para este producto (editable). QA 145.
                                  if (next) {
                                    const sp = supplierCostByProduct.get(next.id);
                                    const cost = sp?.costUsd ?? sp?.lastCostUsd;
                                    if (cost != null && cost !== '') {
                                      setValue(`items.${idx}.unitCost`, String(Number(cost)), {
                                        shouldValidate: true,
                                      });
                                    }
                                  }
                                }}
                                getOptionLabel={(option) => option.shortName ?? option.description}
                                isOptionEqualToValue={(a, b) => a.id === b.id}
                                filterOptions={(opts, state) => {
                                  const q = state.inputValue.toLowerCase().trim();
                                  if (!q) return opts;
                                  return opts.filter((p) => {
                                    const bag = [
                                      p.shortName ?? '',
                                      p.description ?? '',
                                      p.internalCode ?? '',
                                      ...(p.barcodes?.map((b) => b.barcode) ?? []),
                                    ]
                                      .join(' ')
                                      .toLowerCase();
                                    return bag.includes(q);
                                  });
                                }}
                                renderOption={(props, option) => (
                                  <li {...props} key={option.id}>
                                    <Box>
                                      <Typography variant="body2">
                                        {option.shortName ?? option.description}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{ color: 'text.secondary' }}
                                      >
                                        {option.internalCode ?? '—'}
                                        {option.totalStock != null &&
                                          ` · stock: ${Number(option.totalStock)}`}
                                      </Typography>
                                    </Box>
                                  </li>
                                )}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Producto"
                                    placeholder="Buscar por nombre, código interno o EAN…"
                                    error={Boolean(fieldState.error)}
                                    helperText={fieldState.error?.message}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                  />
                                )}
                              />
                            );
                          }}
                        />

                        {product && (
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ pl: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Existencia actual:{' '}
                              <Box
                                component="span"
                                sx={{
                                  fontWeight: 600,
                                  color:
                                    stock == null
                                      ? 'text.disabled'
                                      : stock === 0
                                        ? 'error.main'
                                        : stock <= 10
                                          ? 'warning.main'
                                          : 'success.main',
                                }}
                              >
                                {stock == null ? '—' : stock}
                              </Box>
                            </Typography>
                            {product.internalCode && (
                              <Typography
                                variant="caption"
                                sx={{ color: 'text.disabled', fontFamily: 'monospace' }}
                              >
                                {product.internalCode}
                              </Typography>
                            )}
                          </Stack>
                        )}

                        {/* QA 143/144: cantidad + costo unitario negociado +
                            descuento; el subtotal por línea se calcula en vivo
                            y alimenta el total que dispara la matriz de
                            aprobación por monto. */}
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2}
                          alignItems="flex-start"
                        >
                          <Field.Text
                            name={`items.${idx}.quantity`}
                            label="Cantidad"
                            slotProps={{
                              inputLabel: { shrink: true },
                              htmlInput: { inputMode: 'decimal' },
                            }}
                            sx={{ flex: 1, minWidth: 110 }}
                          />
                          <Field.Text
                            name={`items.${idx}.unitCost`}
                            label="Costo unit. (USD)"
                            placeholder="0.00"
                            slotProps={{
                              inputLabel: { shrink: true },
                              htmlInput: { inputMode: 'decimal' },
                            }}
                            sx={{ flex: 1, minWidth: 140 }}
                          />
                          <Field.Text
                            name={`items.${idx}.discountPct`}
                            label="Desc. % (opc.)"
                            placeholder="0"
                            slotProps={{
                              inputLabel: { shrink: true },
                              htmlInput: { inputMode: 'decimal' },
                            }}
                            sx={{ flex: 1, minWidth: 110 }}
                          />
                          <Box sx={{ minWidth: 120, pt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Subtotal
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                              {fmtUsd(lineSubtotalUsd(current))}
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>
                    </Box>
                    <IconButton
                      color="error"
                      disabled={fields.length === 1}
                      onClick={() => remove(idx)}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Stack>
                  {idx < fields.length - 1 && <Divider sx={{ borderStyle: 'dashed', my: 2 }} />}
                </Box>
              );
            })}

            <Divider />

            {/* QA: botón Agregar al fondo, no arriba. Permite extender la lista
                sin tener que scrollear de vuelta al header. */}
            <Stack direction="row" justifyContent="flex-start">
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => append({ productId: '', quantity: '', unitCost: '', discountPct: '' })}
              >
                Agregar ítem
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 1.5 }}>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            Total de la orden:
          </Typography>
          <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
            {fmtUsd(watchedItems.reduce((sum, it) => sum + lineSubtotalUsd(it), 0))}
          </Typography>
        </Box>

        {sensitiveCategories.length > 0 && (
          <Alert severity="warning">
            Esta orden incluye artículos de categorías sensibles (
            <strong>{sensitiveCategories.join(', ')}</strong>) y requerirá{' '}
            <strong>aprobación especial</strong> de los roles designados antes de cambiar de
            estatus.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => router.push(paths.dashboard.purchases.orders.root)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear orden'}
          </Button>
        </Box>
      </Form>
    </Container>
  );
}
