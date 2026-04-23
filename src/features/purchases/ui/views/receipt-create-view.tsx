import type { CreateGoodsReceiptPayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useRef, useMemo, useEffect } from 'react';
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

import { RECEIPT_TYPE_OPTIONS } from '../../model/constants';
import {
  useOrderQuery,
  useOrdersQuery,
  useCreateReceiptMutation,
} from '../../api/purchases.queries';

// ----------------------------------------------------------------------

const ItemSchema = z.object({
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
  salePrice: z
    .string()
    .min(1, { message: 'Obligatorio' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '≥ 0' }),
  locationId: z.string().optional().or(z.literal('')),
});

const ReceiptSchema = z.object({
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  supplierId: z.string().uuid({ message: 'Selecciona un proveedor' }),
  purchaseOrderId: z.string().optional().or(z.literal('')),
  supplierInvoiceNumber: z.string().max(50).optional().or(z.literal('')),
  receiptType: z.enum(['purchase', 'consignment']),
  notes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(ItemSchema).min(1, { message: 'Agrega al menos un ítem' }),
});

type FormValues = z.infer<typeof ReceiptSchema>;

const emptyItem: FormValues['items'][number] = {
  productId: '',
  lotNumber: '',
  expirationDate: '',
  quantity: '',
  unitCostUsd: '',
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
      purchaseOrderId: '',
      supplierInvoiceNumber: '',
      receiptType: 'purchase',
      notes: '',
      items: [emptyItem],
    },
  });

  const { control, watch, setValue } = methods;
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const selectedBranchId = watch('branchId');
  const selectedSupplierId = watch('supplierId');
  const selectedOrderId = watch('purchaseOrderId');

  const { data: locations = [] } = useLocationsQuery({
    branchId: selectedBranchId || undefined,
  });

  // Órdenes elegibles: del proveedor seleccionado (si hay) y en estado sent/partial.
  // Si no hay proveedor, muestra todas las elegibles para permitir detectar el proveedor via OC.
  const eligibleOrders = useMemo(() => {
    const byStatus = allOrders.filter((o) => o.status === 'sent' || o.status === 'partial');
    if (!selectedSupplierId) return byStatus;
    return byStatus.filter((o) => o.supplierId === selectedSupplierId);
  }, [allOrders, selectedSupplierId]);

  // Detalle completo de la OC seleccionada (con items)
  const { data: selectedOrder } = useOrderQuery(selectedOrderId || undefined);

  // Autofill al cambiar de OC seleccionada
  const lastAppliedOrderRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedOrderId) {
      lastAppliedOrderRef.current = null;
      return;
    }
    if (lastAppliedOrderRef.current === selectedOrderId) return;
    if (!selectedOrder || selectedOrder.id !== selectedOrderId) return;
    if (!selectedOrder.items || selectedOrder.items.length === 0) return;

    setValue('branchId', selectedOrder.branchId, { shouldValidate: true });
    setValue('supplierId', selectedOrder.supplierId, { shouldValidate: true });

    replace(
      selectedOrder.items.map((it) => {
        const remaining = Math.max(
          0,
          Number(it.quantity) - Number(it.quantityReceived ?? 0)
        );
        return {
          productId: it.productId,
          lotNumber: '',
          expirationDate: '',
          quantity: remaining > 0 ? String(remaining) : String(Number(it.quantity)),
          unitCostUsd: String(Number(it.unitCostUsd)),
          salePrice: '',
          locationId: '',
        };
      })
    );

    lastAppliedOrderRef.current = selectedOrderId;
    toast.success(`Ítems cargados desde la orden ${selectedOrder.orderNumber}`);
  }, [selectedOrderId, selectedOrder, replace, setValue]);

  const submit = methods.handleSubmit(async (values) => {
    const payload: CreateGoodsReceiptPayload = {
      branchId: values.branchId,
      supplierId: values.supplierId,
      purchaseOrderId: values.purchaseOrderId || undefined,
      supplierInvoiceNumber: values.supplierInvoiceNumber?.trim() || undefined,
      receiptType: values.receiptType,
      notes: values.notes?.trim() || undefined,
      items: values.items.map((i) => ({
        productId: i.productId,
        lotNumber: i.lotNumber.trim(),
        expirationDate: i.expirationDate,
        quantity: Number(i.quantity),
        unitCostUsd: Number(i.unitCostUsd),
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

  const linkedOrder = selectedOrder;

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

            <Field.Select
              name="purchaseOrderId"
              label="Orden de compra (opcional)"
              helperText={
                eligibleOrders.length === 0
                  ? 'No hay órdenes elegibles. Selecciona el proveedor o crea una orden.'
                  : 'Al seleccionar, se autocompleta proveedor, sucursal e ítems.'
              }
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">— Sin orden asociada —</MenuItem>
              {eligibleOrders.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.orderNumber} · {new Date(o.createdAt).toLocaleDateString('es-VE')} · $
                  {(Number(o.totalUsd) || 0).toFixed(2)}
                </MenuItem>
              ))}
            </Field.Select>

            {linkedOrder && linkedOrder.id === selectedOrderId && (
              <Alert severity="info" icon={<Iconify icon="solar:bill-list-bold" />}>
                Orden <strong>{linkedOrder.orderNumber}</strong> · {linkedOrder.items?.length ?? 0}{' '}
                ítems · Total ${(Number(linkedOrder.totalUsd) || 0).toFixed(2)}.{' '}
                <Chip size="small" variant="outlined" label={linkedOrder.status} />
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
              return (
                <Box key={field.id}>
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
