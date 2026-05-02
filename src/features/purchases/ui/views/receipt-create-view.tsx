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
import { useConfigQuery } from '@/features/config-global/api/config.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';
import { useLocationsQuery } from '@/features/locations/api/locations.queries';
import { useLatestExchangeRateQuery } from '@/features/exchange-rates/api/exchange-rates.queries';

import { fetchOrder } from '../../api/purchases.api';
import { RECEIPT_TYPE_OPTIONS } from '../../model/constants';
import { ReceiptPricingHelper } from '../components/receipt-pricing-helper';
import { purchaseKeys, useOrdersQuery, useCreateReceiptMutation } from '../../api/purchases.queries';

// ----------------------------------------------------------------------

const pctString = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 100), {
    message: 'Entre 0 y 100',
  });

const DiscrepancySchema = z.object({
  reason: z.enum([
    'expired',
    'defective',
    'damaged_packaging',
    'damaged_in_transit',
    'incorrect_product',
    'missing',
    'excess',
    'quality_failure',
    'other',
  ]),
  quantity: z
    .string()
    .min(1, { message: 'Obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { message: '> 0' }),
  notes: z.string().max(500).optional().or(z.literal('')),
});

const ItemSchema = z
  .object({
    purchaseOrderId: z.string().optional().or(z.literal('')),
    productId: z.string().uuid({ message: 'Selecciona un producto' }),
    lotNumber: z.string().max(50).optional().or(z.literal('')),
    expirationDate: z.string().optional().or(z.literal('')),
    quantity: z
      .string()
      .min(1, { message: 'Obligatoria' })
      .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '≥ 0' }),
    invoicedQuantity: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0), { message: '≥ 0' }),
    unitCostUsd: z
      .string()
      .min(1, { message: 'Obligatorio' })
      .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '≥ 0' }),
    discountPct: pctString,
    salePrice: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0), { message: '≥ 0' }),
    locationId: z.string().optional().or(z.literal('')),
    discrepancies: z.array(DiscrepancySchema).optional(),
  })
  // Lote y vencimiento son obligatorios cuando efectivamente se está recibiendo
  // el producto (quantity > 0). Si la cantidad es 0, es un ítem "no recibido" —
  // se ignora al guardar y no necesita esos datos.
  // Fase E: salePrice ya NO es obligatorio. Si se omite el lote queda sin precio
  // publicado y la fijación queda al módulo de Precios.
  .superRefine((data, ctx) => {
    if (Number(data.quantity) > 0) {
      if (!data.lotNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Obligatorio',
          path: ['lotNumber'],
        });
      }
      if (!data.expirationDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Obligatoria',
          path: ['expirationDate'],
        });
      }
    }
  });

const ReceiptSchema = z
  .object({
    branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
    supplierId: z.string().uuid({ message: 'Selecciona un proveedor' }),
    purchaseOrderIds: z.array(z.string().uuid()),
    supplierInvoiceNumber: z.string().max(50).optional().or(z.literal('')),
    receiptType: z.enum(['purchase', 'consignment']),
    taxPct: pctString,
    igtfPct: pctString,
    notes: z.string().max(500).optional().or(z.literal('')),
    items: z.array(ItemSchema).min(1, { message: 'Agrega al menos un ítem' }),
    nativeCurrency: z.enum(['USD', 'VES']),
    // Strings (los inputs trabajan con texto) — convertimos a number en submit.
    nativeTotal: z.string().optional().or(z.literal('')),
    exchangeRateUsed: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.nativeCurrency === 'VES') {
      if (!data.nativeTotal || !/^\d+(\.\d+)?$/.test(data.nativeTotal) || Number(data.nativeTotal) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nativeTotal'],
          message: 'Total de la factura en Bs. obligatorio (> 0)',
        });
      }
      if (
        !data.exchangeRateUsed ||
        !/^\d+(\.\d+)?$/.test(data.exchangeRateUsed) ||
        Number(data.exchangeRateUsed) <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['exchangeRateUsed'],
          message: 'Tasa BCV obligatoria (> 0)',
        });
      }
    }
  });

type FormValues = z.infer<typeof ReceiptSchema>;

const emptyItem: FormValues['items'][number] = {
  purchaseOrderId: '',
  productId: '',
  lotNumber: '',
  expirationDate: '',
  quantity: '',
  invoicedQuantity: '',
  unitCostUsd: '',
  discountPct: '',
  salePrice: '',
  locationId: '',
  discrepancies: [],
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

  // IVA/IGTF vienen de la configuración global (SUNDDE/SENIAT). El operador
  // no debe ingresarlos a mano; los aplicamos automáticamente y los mostramos
  // en read-only para que el usuario sepa con qué tasa se está calculando.
  const { data: globalConfig } = useConfigQuery();
  const ivaDefault = globalConfig?.iva_general_pct ?? '';
  const igtfDefault = globalConfig?.igtf_pct ?? '';

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
      // Vacío por default: el usuario debe explícitamente "Agregar ítem" o
      // seleccionar una OC. Evita la fricción de tener que eliminar una fila
      // vacía que nadie pidió.
      items: [],
      nativeCurrency: 'USD',
      nativeTotal: '',
      exchangeRateUsed: '',
    },
  });

  const { control, watch, setValue } = methods;
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const selectedBranchId = watch('branchId');
  const selectedSupplierId = watch('supplierId');
  const selectedOrderIds = watch('purchaseOrderIds');

  // Cuando llega la config global, llenamos IVA e IGTF (si aún están vacíos —
  // respetamos cualquier override que el usuario haya hecho a mano).
  useEffect(() => {
    if (ivaDefault && !methods.getValues('taxPct')) {
      setValue('taxPct', ivaDefault);
    }
    if (igtfDefault && !methods.getValues('igtfPct')) {
      setValue('igtfPct', igtfDefault);
    }
  }, [ivaDefault, igtfDefault, methods, setValue]);

  // Pre-selecciona la moneda según el proveedor (Fase D). Solo cuando el
  // operador no ha tocado aún el switch — no pisamos elecciones manuales.
  const supplierTouchedCurrencyRef = useRef(false);
  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );
  useEffect(() => {
    if (!selectedSupplier || supplierTouchedCurrencyRef.current) return;
    setValue('nativeCurrency', selectedSupplier.invoicesInCurrency, { shouldValidate: true });
  }, [selectedSupplier, setValue]);

  // Tasa BCV USD→VES más reciente — autofill cuando la moneda nativa es VES.
  const nativeCurrency = watch('nativeCurrency');
  const { data: latestBcvRate } = useLatestExchangeRateQuery('USD', 'VES');
  useEffect(() => {
    if (nativeCurrency !== 'VES') return;
    if (methods.getValues('exchangeRateUsed')) return;
    if (latestBcvRate?.rate) {
      setValue('exchangeRateUsed', String(Number(latestBcvRate.rate)), { shouldValidate: true });
    }
  }, [nativeCurrency, latestBcvRate, methods, setValue]);

  // Si el usuario seleccionó OCs, branch y supplier se heredan: no editables.
  const branchSupplierLockedByOrder = (selectedOrderIds ?? []).length > 0;

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
  // OCs cargadas (conservando el origen `purchaseOrderId` por línea para que
  // el backend pueda actualizar el estado de cada OC afectada) y preservamos
  // los ítems "adicionales" que el usuario haya agregado a mano.
  const lastAppliedKeyRef = useRef<string>('');
  useEffect(() => {
    const ids = (selectedOrderIds ?? []).slice().sort().join(',');

    // Caso: usuario deseleccionó todas las OCs. Limpiamos los ítems que vinieron
    // de OC (ya no son alcanzables) y conservamos los adicionales que el usuario
    // haya agregado a mano.
    if (!ids) {
      if (lastAppliedKeyRef.current) {
        const current = methods.getValues('items');
        const additionalsOnly = current.filter((i) => !i.purchaseOrderId);
        replace(additionalsOnly);
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
        const suggestedQty = remaining > 0 ? String(remaining) : String(Number(it.quantity));
        return {
          purchaseOrderId: order.id,
          productId: it.productId,
          lotNumber: '',
          expirationDate: '',
          quantity: suggestedQty,
          // Cantidad facturada: por default igual a la recibida — el operador
          // ajusta si la factura difiere y se generan discrepancias.
          invoicedQuantity: suggestedQty,
          unitCostUsd: String(Number(it.unitCostUsd)),
          discountPct: it.discountPct ? String(Number(it.discountPct)) : '',
          salePrice: '',
          locationId: '',
          discrepancies: [],
        };
      })
    );

    if (aggregated.length > 0) {
      // Preservamos los ítems adicionales que el usuario haya agregado a mano.
      const current = methods.getValues('items');
      const additionalsOnly = current.filter((i) => !i.purchaseOrderId);
      replace([...aggregated, ...additionalsOnly]);
      lastAppliedKeyRef.current = ids;
      const names = loadedOrders.map((o) => o.orderNumber).join(', ');
      toast.success(`Ítems cargados desde: ${names}`);
    }
  }, [selectedOrderIds, loadedOrders, replace, setValue, methods]);

  const submit = methods.handleSubmit(async (values) => {
    // Items con quantity=0 representan productos solicitados que NO llegaron en
    // esta entrega (parcialmente recibidos vs faltantes). Los excluimos del
    // payload: el backend no creará lote ni movimiento de inventario para ellos.
    // La OC asociada quedará en estado `partial` en vez de `complete`, lo cual
    // refleja correctamente la realidad para futuras entregas.
    const receivedItems = values.items.filter((i) => Number(i.quantity) > 0);

    if (receivedItems.length === 0) {
      toast.error('Debes recibir al menos un producto con cantidad mayor a cero.');
      return;
    }

    const payload: CreateGoodsReceiptPayload = {
      branchId: values.branchId,
      supplierId: values.supplierId,
      supplierInvoiceNumber: values.supplierInvoiceNumber?.trim() || undefined,
      receiptType: values.receiptType,
      taxPct: values.taxPct ? Number(values.taxPct) : undefined,
      igtfPct: values.igtfPct ? Number(values.igtfPct) : undefined,
      notes: values.notes?.trim() || undefined,
      nativeCurrency: values.nativeCurrency,
      // Solo enviamos los campos de moneda nativa cuando es VES — para USD el
      // backend exige que vengan NULL (constraint en BD).
      nativeTotal:
        values.nativeCurrency === 'VES' && values.nativeTotal
          ? Number(values.nativeTotal)
          : undefined,
      exchangeRateUsed:
        values.nativeCurrency === 'VES' && values.exchangeRateUsed
          ? Number(values.exchangeRateUsed)
          : undefined,
      items: receivedItems.map((i) => ({
        purchaseOrderId: i.purchaseOrderId || undefined,
        productId: i.productId,
        lotNumber: (i.lotNumber ?? '').trim(),
        expirationDate: i.expirationDate ?? '',
        quantity: Number(i.quantity),
        invoicedQuantity:
          i.invoicedQuantity && i.invoicedQuantity.trim() !== ''
            ? Number(i.invoicedQuantity)
            : undefined,
        unitCostUsd: Number(i.unitCostUsd),
        discountPct: i.discountPct ? Number(i.discountPct) : undefined,
        // Fase E: salePrice opcional. Si el operador no llenó nada, no enviamos
        // el campo — el lote queda sin precio publicado.
        salePrice: i.salePrice && i.salePrice.trim() !== '' ? Number(i.salePrice) : undefined,
        locationId: i.locationId || undefined,
        discrepancies: (i.discrepancies ?? []).map((d) => ({
          reason: d.reason,
          quantity: Number(d.quantity),
          notes: d.notes?.trim() || undefined,
        })),
      })),
    };
    try {
      const result = await mutation.mutateAsync(payload);
      const summary = (result.affectedOrders ?? [])
        .map((o) => {
          const labelByStatus: Record<string, string> = {
            partial: 'parcial',
            complete: 'completa',
            sent: 'enviada',
            draft: 'borrador',
            cancelled: 'cancelada',
          };
          const label = labelByStatus[o.newStatus] ?? o.newStatus;
          return `${o.orderNumber} → ${label}`;
        })
        .join(', ');

      if (result.toleranceExceeded) {
        toast.warning(
          `Recepción ${result.receiptNumber} guardada en estado “Pendiente reaprobación”. ` +
            `Excedió tolerancia: ${(result.toleranceDetails ?? []).join(' · ')}. ` +
            `Los lotes se crearán al reaprobar desde el detalle.`,
          { duration: 12000 },
        );
      } else {
        toast.success(
          summary
            ? `Recepción ${result.receiptNumber} registrada. ${summary}.`
            : `Recepción ${result.receiptNumber} registrada (sin OC asociada). Se crearon los lotes correspondientes.`,
        );
      }
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

  // Separamos los ítems en dos grupos PRESERVANDO el índice original (los
  // inputs `name="items.${idx}.X"` necesitan apuntar al array completo).
  const indexedFields = fields.map((field, idx) => ({ field, idx }));
  const orderFieldEntries = indexedFields.filter(
    ({ idx }) => !!watchedItems?.[idx]?.purchaseOrderId,
  );
  const additionalFieldEntries = indexedFields.filter(
    ({ idx }) => !watchedItems?.[idx]?.purchaseOrderId,
  );

  /**
   * Sub-panel de discrepancias por línea. Visible siempre que haya diferencia
   * entre cantidad facturada y recibida (PDF Política OC §5: "la suma de causas
   * debe cuadrar a cero con el total de las discrepancias").
   *
   * Si los valores cuadran (factura == recibido) no se muestra; cuando difiere
   * el operador agrega filas con razón + cantidad. La validación de la suma
   * la hace el backend al guardar (nos ahorramos lógica duplicada).
   */
  function renderDiscrepancyPanel(idx: number) {
    const item = watchedItems?.[idx];
    const invoiced = Number(item?.invoicedQuantity ?? item?.quantity ?? 0);
    const received = Number(item?.quantity ?? 0);
    const diff = Math.abs(invoiced - received);
    const epsilon = 0.001;

    const discrepancies = item?.discrepancies ?? [];
    const sumDiscrepancies = discrepancies.reduce((s, d) => s + (Number(d.quantity) || 0), 0);
    const remaining = diff - sumDiscrepancies;

    if (diff <= epsilon && discrepancies.length === 0) return null;

    const tone =
      Math.abs(remaining) <= epsilon ? 'success' : remaining > 0 ? 'warning' : 'error';
    const message =
      Math.abs(remaining) <= epsilon
        ? `Discrepancias cuadran (${diff.toFixed(3)}).`
        : remaining > 0
          ? `Faltan ${remaining.toFixed(3)} unidades por explicar.`
          : `Sobran ${Math.abs(remaining).toFixed(3)} unidades en discrepancias.`;

    return (
      <Box
        sx={{
          p: 2,
          mt: 1,
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:danger-triangle-bold" width={18} />
            <Typography variant="subtitle2">
              Diferencia: facturada {invoiced} vs recibida {received} ({diff.toFixed(3)})
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => {
              const next = [
                ...(watchedItems?.[idx]?.discrepancies ?? []),
                { reason: 'expired' as const, quantity: '', notes: '' },
              ];
              setValue(`items.${idx}.discrepancies`, next, { shouldValidate: true });
            }}
          >
            Agregar razón
          </Button>
        </Stack>

        <Alert severity={tone} sx={{ mb: 1.5 }}>
          {message}
        </Alert>

        <Stack spacing={1}>
          {discrepancies.map((_, dIdx) => (
            <Stack
              key={dIdx}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Field.Select
                name={`items.${idx}.discrepancies.${dIdx}.reason`}
                label="Razón"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1.5, minWidth: 200 }}
              >
                <MenuItem value="expired">Vencido / próximo a vencer</MenuItem>
                <MenuItem value="defective">Defectuoso de fábrica</MenuItem>
                <MenuItem value="damaged_packaging">Empaque dañado</MenuItem>
                <MenuItem value="damaged_in_transit">Daño en transporte</MenuItem>
                <MenuItem value="incorrect_product">Producto incorrecto</MenuItem>
                <MenuItem value="missing">Faltante</MenuItem>
                <MenuItem value="excess">Sobrante</MenuItem>
                <MenuItem value="quality_failure">Falla de calidad</MenuItem>
                <MenuItem value="other">Otro</MenuItem>
              </Field.Select>
              <Field.Text
                name={`items.${idx}.discrepancies.${dIdx}.quantity`}
                label="Cantidad"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 110 }, flexShrink: 0 }}
              />
              <Field.Text
                name={`items.${idx}.discrepancies.${dIdx}.notes`}
                label="Nota (obligatorio si es 'Otro')"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 2 }}
              />
              <IconButton
                color="error"
                onClick={() => {
                  const next = (watchedItems?.[idx]?.discrepancies ?? []).filter(
                    (_d, i) => i !== dIdx,
                  );
                  setValue(`items.${idx}.discrepancies`, next, { shouldValidate: true });
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </Box>
    );
  }

  /**
   * Renderiza una fila de ítem. Cuando `fromOrder=true`:
   *   - Producto y costo unitario se bloquean (vienen de la OC)
   *   - El botón eliminar se oculta (la única forma de "no recibir" es quantity=0)
   *   - Si quantity=0 mostramos un chip "No recibido" y atenuamos la fila
   *
   * Cuando `fromOrder=false` todo es editable y el botón eliminar está activo.
   */
  function renderItemRow(args: {
    field: { id: string };
    idx: number;
    fromOrder: boolean;
    itemOrderNumber?: string;
  }) {
    const { field, idx, fromOrder, itemOrderNumber } = args;
    const productId = watchedItems?.[idx]?.productId;
    const product = productId ? productById.get(productId) : undefined;
    const qty = Number(watchedItems?.[idx]?.quantity ?? 0);
    const isNotReceived = fromOrder && qty === 0;

    return (
      <Box sx={{ opacity: isNotReceived ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {fromOrder && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            {itemOrderNumber && (
              <Chip size="small" variant="soft" color="info" label={`OC ${itemOrderNumber}`} />
            )}
            {isNotReceived && (
              <Chip size="small" color="warning" variant="outlined" label="No recibido" />
            )}
          </Stack>
        )}
        <Stack direction="row" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={2}>
              <Field.Select
                name={`items.${idx}.productId`}
                label="Producto"
                disabled={fromOrder}
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
                  disabled={isNotReceived}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <Field.Text
                  name={`items.${idx}.expirationDate`}
                  label="Vencimiento"
                  type="date"
                  disabled={isNotReceived}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0 }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Field.Text
                  name={`items.${idx}.invoicedQuantity`}
                  label="Facturada"
                  disabled={isNotReceived}
                  helperText="La que dice la factura del proveedor"
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <Field.Text
                  name={`items.${idx}.quantity`}
                  label={fromOrder ? 'Recibida' : 'Cantidad'}
                  helperText={fromOrder ? '0 = no llegó en esta entrega' : 'Físico'}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <Field.Text
                  name={`items.${idx}.unitCostUsd`}
                  label="Costo USD"
                  disabled={isNotReceived}
                  helperText={fromOrder ? 'De la OC (ajustable)' : undefined}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <Field.Text
                  name={`items.${idx}.discountPct`}
                  label="Desc. %"
                  disabled={isNotReceived}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: { xs: '100%', sm: 110 }, flexShrink: 0 }}
                />
                <Field.Text
                  name={`items.${idx}.salePrice`}
                  label="Precio venta (opcional)"
                  disabled={isNotReceived}
                  helperText="Vacío = lo fija el módulo de Precios"
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
              </Stack>

              {!isNotReceived && watchedItems?.[idx]?.productId && (
                <ReceiptPricingHelper
                  itemIndex={idx}
                  productId={watchedItems[idx].productId}
                  branchId={selectedBranchId}
                  costUsd={Number(watchedItems[idx].unitCostUsd) || 0}
                  currentSalePrice={
                    watchedItems[idx].salePrice && watchedItems[idx].salePrice.trim() !== ''
                      ? Number(watchedItems[idx].salePrice)
                      : null
                  }
                />
              )}

              {!isNotReceived && renderDiscrepancyPanel(idx)}
              <Field.Select
                name={`items.${idx}.locationId`}
                label="Ubicación (opcional)"
                disabled={isNotReceived}
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
          {!fromOrder && (
            <IconButton color="error" onClick={() => remove(idx)}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          )}
        </Stack>
        {/* Spacer para que las filas con/sin botón eliminar se alineen */}
        {fromOrder && <Box sx={{ height: 0 }} key={field.id} />}
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pb: 6 }}>
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
                // Buscamos primero en eligibleOrders (lista de selección);
                // si no, en loadedOrders (detalle ya cargado de OCs ya
                // seleccionadas). Esto evita mostrar el UUID raw cuando una
                // OC ya consolidada queda fuera del filtro por proveedor.
                const o =
                  orderById.get(id as string) ??
                  loadedOrders.find((lo) => lo.id === id);
                if (!o) return id as string;
                const statusTag = o.status === 'partial' ? ' · Parcial' : '';
                return `${o.orderNumber} · ${new Date(o.createdAt).toLocaleDateString('es-VE')} · $${(Number(o.totalUsd) || 0).toFixed(2)}${statusTag}`;
              }}
              isOptionEqualToValue={(option, value) => option === value}
              helperText={
                (selectedOrderIds ?? []).length > 0
                  ? 'Sucursal y proveedor se heredan automáticamente.'
                  : eligibleOrders.length === 0
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
                disabled={branchSupplierLockedByOrder}
                helperText={
                  branchSupplierLockedByOrder
                    ? 'Heredada de la orden de compra seleccionada.'
                    : undefined
                }
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
                disabled={branchSupplierLockedByOrder}
                helperText={
                  branchSupplierLockedByOrder
                    ? 'Heredado de la orden de compra seleccionada.'
                    : undefined
                }
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
                disabled
                helperText="Tasa SUNDDE — configurada globalmente. Aplicado sobre el subtotal."
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
              <Field.Text
                name="igtfPct"
                label="IGTF %"
                disabled
                helperText="Tasa SENIAT — configurada globalmente. Aplicado sobre (subtotal + IVA)."
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
            </Stack>

            {/* Fase D — Moneda original de la factura. Si VES, capturamos el
                total en Bs. y la tasa BCV (auto-llena con la última registrada). */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
              <Field.Select
                name="nativeCurrency"
                label="Moneda factura"
                helperText="Pre-seleccionada según el proveedor. Editable."
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', md: 200 }, flexShrink: 0 }}
                onChange={(e) => {
                  supplierTouchedCurrencyRef.current = true;
                  setValue('nativeCurrency', e.target.value as 'USD' | 'VES', {
                    shouldValidate: true,
                  });
                  // Al cambiar a USD limpiamos los campos de VES.
                  if (e.target.value === 'USD') {
                    setValue('nativeTotal', '');
                    setValue('exchangeRateUsed', '');
                  }
                }}
              >
                <MenuItem value="USD">USD — Dólares</MenuItem>
                <MenuItem value="VES">VES — Bolívares</MenuItem>
              </Field.Select>
              {nativeCurrency === 'VES' && (
                <>
                  <Field.Text
                    name="nativeTotal"
                    label="Total factura (Bs.)"
                    helperText="El total exacto que dice la factura física"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  />
                  <Field.Text
                    name="exchangeRateUsed"
                    label="Tasa BCV (Bs./USD)"
                    helperText={
                      latestBcvRate?.rate
                        ? `Última BCV: ${Number(latestBcvRate.rate).toFixed(4)} (${new Date(
                            latestBcvRate.effectiveDate,
                          ).toLocaleDateString('es-VE')})`
                        : 'No hay tasa BCV registrada — ingresa manualmente'
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  />
                </>
              )}
            </Stack>

            {nativeCurrency === 'VES' &&
              Number(watch('nativeTotal')) > 0 &&
              Number(watch('exchangeRateUsed')) > 0 && (
                <Alert severity="info" icon={<Iconify icon="solar:wad-of-money-bold" />}>
                  Equivalente USD calculado:{' '}
                  <strong>
                    $
                    {(
                      Number(watch('nativeTotal')) / Number(watch('exchangeRateUsed'))
                    ).toFixed(2)}
                  </strong>
                  . Compáralo contra el total computado abajo (debería estar cerca; pequeñas
                  diferencias por redondeo son normales).
                </Alert>
              )}

            <Field.Text
              name="notes"
              label="Notas"
              multiline
              minRows={2}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </Card>

        {orderFieldEntries.length > 0 && (
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  Productos solicitados en la(s) orden(es) ({orderFieldEntries.length})
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                  Producto y costo vienen de la OC. Solo ajusta cantidad, lote, vencimiento y
                  precio de venta. Si un producto no llegó, marca cantidad 0.
                </Typography>
              </Box>
              {orderFieldEntries.map(({ field, idx }, i) => {
                const itemOrderId = watchedItems?.[idx]?.purchaseOrderId;
                const itemOrder = itemOrderId
                  ? (orderById.get(itemOrderId) ?? loadedOrders.find((o) => o.id === itemOrderId))
                  : undefined;
                return (
                  <Box key={field.id}>
                    {renderItemRow({ field, idx, fromOrder: true, itemOrderNumber: itemOrder?.orderNumber })}
                    {i < orderFieldEntries.length - 1 && (
                      <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Card>
        )}

        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  {orderFieldEntries.length > 0
                    ? `Productos adicionales (${additionalFieldEntries.length})`
                    : `Ítems recibidos (${additionalFieldEntries.length})`}
                </Typography>
                {orderFieldEntries.length > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                    Productos que llegaron pero no estaban en ninguna orden de compra (muestras,
                    sustitutos, regalos comerciales, etc.).
                  </Typography>
                )}
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => append(emptyItem)}
              >
                Agregar ítem
              </Button>
            </Stack>

            {additionalFieldEntries.length === 0 && (
              <Box
                sx={{
                  py: 3,
                  textAlign: 'center',
                  border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  {orderFieldEntries.length > 0
                    ? 'Sin productos adicionales. Usa “Agregar ítem” si el proveedor envió algo extra que no estaba en la OC.'
                    : 'Aún no hay ítems. Selecciona una orden de compra arriba o usa “Agregar ítem” para registrar productos sin OC asociada.'}
                </Typography>
              </Box>
            )}

            {additionalFieldEntries.map(({ field, idx }, i) => (
              <Box key={field.id}>
                {renderItemRow({ field, idx, fromOrder: false })}
                {i < additionalFieldEntries.length - 1 && (
                  <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
                )}
              </Box>
            ))}
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
