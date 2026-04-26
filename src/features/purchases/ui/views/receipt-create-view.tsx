import type { CreateGoodsReceiptPayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useRef, useMemo, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useProductsQuery } from '@/features/products/api/products.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';
import { useLocationsQuery } from '@/features/locations/api/locations.queries';

import { fetchOrder } from '../../api/purchases.api';
import { RECEIPT_TYPE_OPTIONS } from '../../model/constants';
import { purchaseKeys, useOrdersQuery, useCreateReceiptMutation } from '../../api/purchases.queries';

// ----------------------------------------------------------------------

const pctString = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 100), {
    message: 'Entre 0 y 100',
  });

const ItemSchema = z.object({
  purchaseOrderId: z.string().optional().or(z.literal('')),
  productId: z.string().uuid({ message: 'Selecciona un producto' }),
  lotNumber: z.string().min(1, { message: 'Obligatorio' }).max(50),
  expirationDate: z.string().min(1, { message: 'Obligatoria' }),
  quantity: z
    .string()
    .min(1, { message: 'Obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { message: '> 0' }),
  unitCostUsd: z
    .string()
    .min(1, { message: 'Obligatorio' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '≥ 0' }),
  discountPct: pctString,
  salePrice: z
    .string()
    .min(1, { message: 'Obligatorio' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '≥ 0' }),
  locationId: z.string().optional().or(z.literal('')),
});

const ReceiptSchema = z.object({
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  supplierId: z.string().uuid({ message: 'Selecciona un proveedor' }),
  purchaseOrderIds: z.array(z.string().uuid()),
  supplierInvoiceNumber: z.string().max(50).optional().or(z.literal('')),
  receiptType: z.enum(['purchase', 'consignment']),
  taxPct: pctString,
  igtfPct: pctString,
  notes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(ItemSchema).min(1, { message: 'Agrega al menos un ítem' }),
});

type FormValues = z.infer<typeof ReceiptSchema>;

const emptyItem: FormValues['items'][number] = {
  purchaseOrderId: '',
  productId: '',
  lotNumber: '',
  expirationDate: '',
  quantity: '',
  unitCostUsd: '',
  discountPct: '',
  salePrice: '',
  locationId: '',
};

// ----------------------------------------------------------------------

export function ReceiptCreateView() {
  const router = useRouter();
  const mutation = useCreateReceiptMutation();

  const { data: branches = [] } = useBranchesQuery();
  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true });
  const { data: productsData } = useProductsQuery({ limit: 1000, isActive: true });
  const products = useMemo(() => productsData?.data ?? [], [productsData]);
  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p] as const)),
    [products]
  );

  // Órdenes activas (sent/partial) para seleccionar como base de la recepción.
  const { data: ordersData } = useOrdersQuery({ page: 1, limit: 1000 });
  const allOrders = useMemo(() => ordersData?.data ?? [], [ordersData]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(ReceiptSchema),
    defaultValues: {
      branchId: '',
      supplierId: '',
      purchaseOrderIds: [],
      supplierInvoiceNumber: '',
      receiptType: 'purchase',
      taxPct: '',
      igtfPct: '',
      notes: '',
      items: [emptyItem],
    },
  });

  const { control, watch, setValue } = methods;
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const selectedBranchId = watch('branchId');
  const selectedSupplierId = watch('supplierId');
  const selectedOrderIds = watch('purchaseOrderIds');

  const { data: locations = [] } = useLocationsQuery({
    branchId: selectedBranchId || undefined,
  });

  // Órdenes elegibles: del proveedor seleccionado (si hay) y en estado sent/partial.
  const eligibleOrders = useMemo(() => {
    const byStatus = allOrders.filter((o) => o.status === 'sent' || o.status === 'partial');
    if (!selectedSupplierId) return byStatus;
    return byStatus.filter((o) => o.supplierId === selectedSupplierId);
  }, [allOrders, selectedSupplierId]);

  // Detalle completo de cada OC seleccionada (con items)
  const orderDetailQueries = useQueries({
    queries: (selectedOrderIds ?? []).map((id) => ({
      queryKey: purchaseKeys.order(id),
      queryFn: () => fetchOrder(id),
      enabled: Boolean(id),
    })),
  });
  const loadedOrders = useMemo(
    () => orderDetailQueries.map((q) => q.data).filter((o): o is NonNullable<typeof o> => !!o),
    [orderDetailQueries]
  );

  // Autofill al cambiar de OCs seleccionadas. Agregamos los ítems de todas las
  // OCs cargadas, conservando el origen (purchaseOrderId por línea) para que
  // el backend pueda actualizar el estado de cada orden afectada.
  const lastAppliedKeyRef = useRef<string>('');
  useEffect(() => {
    const ids = (selectedOrderIds ?? []).slice().sort().join(',');
    if (!ids) {
      if (lastAppliedKeyRef.current) {
        lastAppliedKeyRef.current = '';
      }
      return;
    }
    if (loadedOrders.length !== (selectedOrderIds ?? []).length) return;
    const loadedKey = loadedOrders.map((o) => o.id).sort().join(',');
    if (loadedKey !== ids) return;
    if (lastAppliedKeyRef.current === ids) return;

    const supplier = loadedOrders[0].supplierId;
    const branch = loadedOrders[0].branchId;
    const inconsistent = loadedOrders.some(
      (o) => o.supplierId !== supplier || o.branchId !== branch
    );
    if (inconsistent) {
      toast.error('Las OCs seleccionadas deben ser del mismo proveedor y sucursal.');
      return;
    }

    setValue('branchId', branch, { shouldValidate: true });
    setValue('supplierId', supplier, { shouldValidate: true });

    const aggregated = loadedOrders.flatMap((order) =>
      (order.items ?? []).map((it) => {
        const remaining = Math.max(
          0,
          Number(it.quantity) - Number(it.quantityReceived ?? 0)
        );
        return {
          purchaseOrderId: order.id,
          productId: it.productId,
          lotNumber: '',
          expirationDate: '',
          quantity: remaining > 0 ? String(remaining) : String(Number(it.quantity)),
          unitCostUsd: String(Number(it.unitCostUsd)),
          discountPct: it.discountPct ? String(Number(it.discountPct)) : '',
          salePrice: '',
          locationId: '',
        };
      })
    );

    if (aggregated.length > 0) {
      replace(aggregated);
      lastAppliedKeyRef.current = ids;
      const names = loadedOrders.map((o) => o.orderNumber).join(', ');
      toast.success(`Ítems cargados desde: ${names}`);
    }
  }, [selectedOrderIds, loadedOrders, replace, setValue]);

  const submit = methods.handleSubmit(async (values) => {
    const payload: CreateGoodsReceiptPayload = {
      branchId: values.branchId,
      supplierId: values.supplierId,
      supplierInvoiceNumber: values.supplierInvoiceNumber?.trim() || undefined,
      receiptType: values.receiptType,
      taxPct: values.taxPct ? Number(values.taxPct) : undefined,
      igtfPct: values.igtfPct ? Number(values.igtfPct) : undefined,
      notes: values.notes?.trim() || undefined,
      items: values.items.map((i) => ({
        purchaseOrderId: i.purchaseOrderId || undefined,
        productId: i.productId,
        lotNumber: i.lotNumber.trim(),
        expirationDate: i.expirationDate,
        quantity: Number(i.quantity),
        unitCostUsd: Number(i.unitCostUsd),
        discountPct: i.discountPct ? Number(i.discountPct) : undefined,
        salePrice: Number(i.salePrice),
        locationId: i.locationId || undefined,
      })),
    };
    try {
      await mutation.mutateAsync(payload);
      toast.success('Recepción registrada. Se crearon los lotes correspondientes.');
      router.push(paths.dashboard.purchases.receipts.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const watchedItems = watch('items');
  const watchedTaxPct = watch('taxPct');
  const watchedIgtfPct = watch('igtfPct');
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    for (const it of watchedItems ?? []) {
      const q = Number(it.quantity) || 0;
      const u = Number(it.unitCostUsd) || 0;
      const d = Number(it.discountPct) || 0;
      const gross = q * u;
      const discountAmount = gross * (d / 100);
      subtotal += gross - discountAmount;
      totalDiscount += discountAmount;
    }
    const taxPctNum = Number(watchedTaxPct) || 0;
    const igtfPctNum = Number(watchedIgtfPct) || 0;
    const tax = subtotal * (taxPctNum / 100);
    const igtf = (subtotal + tax) * (igtfPctNum / 100);
    const total = subtotal + tax + igtf;
    return { subtotal, totalDiscount, tax, igtf, total };
  }, [watchedItems, watchedTaxPct, watchedIgtfPct]);

  const orderById = useMemo(
    () => new Map(eligibleOrders.map((o) => [o.id, o] as const)),
    [eligibleOrders]
  );
  const selectedOrdersSummary = useMemo(
    () =>
      (selectedOrderIds ?? [])
        .map((id) => orderById.get(id) ?? loadedOrders.find((o) => o.id === id))
        .filter((o): o is NonNullable<typeof o> => !!o),
    [selectedOrderIds, orderById, loadedOrders]
  );

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Nueva recepción de mercancía"
        subtitle="Los ítems se convierten en lotes de inventario y entran al kardex."
        crumbs={[{ label: 'Compras' }, { label: 'Recepciones' }, { label: 'Nueva' }]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={
              <Iconify
                icon="solar:double-alt-arrow-right-bold-duotone"
                sx={{ transform: 'scaleX(-1)' }}
              />
            }
            onClick={() => router.push(paths.dashboard.purchases.receipts.root)}
          >
            Volver a recepciones
          </Button>
        }
      />

      <Form methods={methods} onSubmit={submit}>
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Encabezado
            </Typography>

            <Field.Autocomplete
              name="purchaseOrderIds"
              label="Órdenes de compra (opcional, multi)"
              multiple
              disableCloseOnSelect
              options={eligibleOrders.map((o) => o.id)}
              getOptionLabel={(id) => {
                const o = orderById.get(id as string);
                return o
                  ? `${o.orderNumber} · ${new Date(o.createdAt).toLocaleDateString('es-VE')} · $${(Number(o.totalUsd) || 0).toFixed(2)}`
                  : (id as string);
              }}
              isOptionEqualToValue={(option, value) => option === value}
              helperText={
                eligibleOrders.length === 0
                  ? 'No hay órdenes elegibles. Selecciona el proveedor o crea una orden.'
                  : 'Puedes seleccionar varias para consolidar productos en una sola factura.'
              }
              slotProps={{ textField: { slotProps: { inputLabel: { shrink: true } } } }}
            />

            {selectedOrdersSummary.length > 0 && (
              <Alert severity="info" icon={<Iconify icon="solar:bill-list-bold" />}>
                {selectedOrdersSummary.length === 1 ? 'Orden' : `${selectedOrdersSummary.length} órdenes`}{' '}
                consolidadas en esta factura:
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                  {selectedOrdersSummary.map((o) => (
                    <Chip
                      key={o.id}
                      size="small"
                      variant="outlined"
                      label={`${o.orderNumber} · ${o.status}`}
                    />
                  ))}
                </Stack>
              </Alert>
            )}

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
                name="receiptType"
                label="Tipo"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', md: 180 }, flexShrink: 0 }}
              >
                {RECEIPT_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text
                name="supplierInvoiceNumber"
                label="Nº factura del proveedor"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Text
                name="taxPct"
                label="IVA %"
                helperText="Aplicado sobre el subtotal."
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
              <Field.Text
                name="igtfPct"
                label="IGTF %"
                helperText="Aplicado sobre (subtotal + IVA)."
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Field.Text
              name="notes"
              label="Notas"
              multiline
              minRows={2}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Ítems recibidos ({fields.length})
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => append(emptyItem)}
              >
                Agregar ítem
              </Button>
            </Stack>

            {fields.map((field, idx) => {
              const productId = watch(`items.${idx}.productId`);
              const product = productId ? productById.get(productId) : undefined;
              const itemOrderId = watch(`items.${idx}.purchaseOrderId`);
              const itemOrder = itemOrderId
                ? (orderById.get(itemOrderId) ??
                    loadedOrders.find((o) => o.id === itemOrderId))
                : undefined;
              return (
                <Box key={field.id}>
                  {itemOrder && (
                    <Chip
                      size="small"
                      variant="soft"
                      color="info"
                      label={`OC ${itemOrder.orderNumber}`}
                      sx={{ mb: 1 }}
                    />
                  )}
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Box sx={{ flex: 1 }}>
                      <Stack spacing={2}>
                        <Field.Select
                          name={`items.${idx}.productId`}
                          label="Producto"
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          <MenuItem value="">— Selecciona —</MenuItem>
                          {products.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.shortName ?? p.description}
                            </MenuItem>
                          ))}
                        </Field.Select>

                        {product && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', pl: 0.5 }}>
                            {product.description}
                            {product.internalCode && ` · ${product.internalCode}`}
                          </Typography>
                        )}

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <Field.Text
                            name={`items.${idx}.lotNumber`}
                            label="Lote"
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1 }}
                          />
                          <Field.Text
                            name={`items.${idx}.expirationDate`}
                            label="Vencimiento"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0 }}
                          />
                        </Stack>
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
                            label="Desc. %"
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ width: { xs: '100%', sm: 120 }, flexShrink: 0 }}
                          />
                          <Field.Text
                            name={`items.${idx}.salePrice`}
                            label="Precio venta"
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1 }}
                          />
                        </Stack>
                        <Field.Select
                          name={`items.${idx}.locationId`}
                          label="Ubicación (opcional)"
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          <MenuItem value="">— Sin ubicación —</MenuItem>
                          {locations.map((l) => (
                            <MenuItem key={l.id} value={l.id}>
                              {l.locationCode}
                            </MenuItem>
                          ))}
                        </Field.Select>
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
          </Stack>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Resumen
            </Typography>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Subtotal (después de descuentos)
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                ${totals.subtotal.toFixed(2)}
              </Typography>
            </Stack>
            {totals.totalDiscount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Descuentos aplicados
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                  −${totals.totalDiscount.toFixed(2)}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                IVA ({Number(watchedTaxPct) || 0}%)
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                ${totals.tax.toFixed(2)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                IGTF ({Number(watchedIgtfPct) || 0}%)
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                ${totals.igtf.toFixed(2)}
              </Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1">Total a pagar</Typography>
              <Typography variant="subtitle1" sx={{ fontFamily: 'monospace' }}>
                ${totals.total.toFixed(2)}
              </Typography>
            </Stack>
          </Stack>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => router.push(paths.dashboard.purchases.receipts.root)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            Registrar recepción
          </Button>
        </Box>
      </Form>
    </Container>
  );
}
