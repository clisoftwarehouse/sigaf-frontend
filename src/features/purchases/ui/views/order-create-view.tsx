import type { CreatePurchaseOrderPayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
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

import { ORDER_TYPE_OPTIONS } from '../../model/constants';
import { useCreateOrderMutation } from '../../api/purchases.queries';

// ----------------------------------------------------------------------

const ItemSchema = z.object({
  productId: z.string().uuid({ message: 'Selecciona un producto' }),
  quantity: z
    .string()
    .min(1, { message: 'Obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { message: '> 0' }),
  unitCostUsd: z
    .string()
    .min(1, { message: 'Obligatorio' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '≥ 0' }),
  discountPct: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 100), {
      message: '0-100',
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
type ItemValues = FormValues['items'][number];

// ----------------------------------------------------------------------

const calcItemSubtotal = (item: ItemValues): number => {
  const qty = Number(item.quantity) || 0;
  const cost = Number(item.unitCostUsd) || 0;
  const disc = Number(item.discountPct) || 0;
  return qty * cost * (1 - disc / 100);
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

// ----------------------------------------------------------------------

export function OrderCreateView() {
  const router = useRouter();
  const mutation = useCreateOrderMutation();

  const { data: branches = [] } = useBranchesQuery();
  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true });
  const { data: productsData } = useProductsQuery({ limit: 1000, isActive: true });
  const products = useMemo(() => productsData?.data ?? [], [productsData]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p] as const)), [products]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      branchId: '',
      supplierId: '',
      orderType: 'purchase',
      expectedDate: '',
      notes: '',
      items: [{ productId: '', quantity: '', unitCostUsd: '', discountPct: '' }],
    },
  });

  const { control } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = useWatch({ control, name: 'items' }) ?? [];
  const documentTotal = watchedItems.reduce((sum, it) => sum + calcItemSubtotal(it), 0);

  const submit = methods.handleSubmit(async (values) => {
    const payload: CreatePurchaseOrderPayload = {
      branchId: values.branchId,
      supplierId: values.supplierId,
      orderType: values.orderType,
      expectedDate: values.expectedDate || undefined,
      notes: values.notes?.trim() || undefined,
      items: values.items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitCostUsd: Number(i.unitCostUsd),
        discountPct: i.discountPct ? Number(i.discountPct) : undefined,
      })),
    };
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Orden ${created.orderNumber} creada`);
      router.push(paths.dashboard.purchases.orders.detail(created.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <Container maxWidth="lg" sx={{ pb: 6 }}>
      <PageHeader
        title="Nueva orden de compra"
        subtitle="Crea una orden en estado borrador. Puedes aprobarla desde su detalle."
        crumbs={[{ label: 'Compras' }, { label: 'Órdenes' }, { label: 'Nueva' }]}
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
              <Field.Select
                name="supplierId"
                label="Proveedor"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              >
                <MenuItem value="">— Selecciona —</MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.businessName}
                  </MenuItem>
                ))}
              </Field.Select>
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
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Ítems ({fields.length})
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() =>
                  append({ productId: '', quantity: '', unitCostUsd: '', discountPct: '' })
                }
              >
                Agregar ítem
              </Button>
            </Stack>

            {fields.map((field, idx) => {
              const current = watchedItems[idx];
              const product = current?.productId ? productById.get(current.productId) : undefined;
              const stock = product?.totalStock != null ? Number(product.totalStock) : null;
              const unit = product?.unitOfMeasure ?? '';
              const subtotal = current ? calcItemSubtotal(current) : 0;
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
                                onChange={(_e, next) => f.onChange(next?.id ?? '')}
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
                                          ` · stock: ${Number(option.totalStock)} ${option.unitOfMeasure ?? ''}`}
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
                                {stock == null ? '—' : `${stock} ${unit}`}
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

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <Field.Text
                            name={`items.${idx}.quantity`}
                            label="Cantidad"
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1 }}
                          />
                          <Field.Text
                            name={`items.${idx}.unitCostUsd`}
                            label="Costo USD"
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1 }}
                          />
                          <Field.Text
                            name={`items.${idx}.discountPct`}
                            label="Descuento %"
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1 }}
                          />
                          <Box
                            sx={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'flex-end',
                              pr: 0.5,
                            }}
                          >
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Subtotal
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {fmt(subtotal)}
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

            <Stack direction="row" justifyContent="flex-end" spacing={4} sx={{ pr: 6 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total del documento
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {fmt(documentTotal)}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => router.push(paths.dashboard.purchases.orders.root)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            Crear orden
          </Button>
        </Box>
      </Form>
    </Container>
  );
}
