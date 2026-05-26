import type { DiscrepancyReason, CreateGoodsReceiptPayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useQueries } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';

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
import { UnpricedProductsDialog } from '../components/unpriced-products-dialog';
import { ORDER_STATUS_LABEL, RECEIPT_TYPE_OPTIONS } from '../../model/constants';
import {
  purchaseKeys,
  useOrdersQuery,
  useCreateReceiptMutation,
} from '../../api/purchases.queries';

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
    'sample',
    'substitute',
    'commercial_gift',
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
    locationId: z.string().optional().or(z.literal('')),
    discrepancies: z.array(DiscrepancySchema).optional(),
  })
  // Lote es obligatorio cuando se recibe stock (quantity > 0). La validación
  // de fecha de vencimiento la hace el backend con conocimiento del producto
  // (`tracksExpiration`): consumo masivo sin caducidad no exige fecha. La UX
  // ya oculta el input para productos sin tracking; solo dejamos que el
  // backend rechace si por alguna razón llega vacío cuando debería venir.
  .superRefine((data, ctx) => {
    if (Number(data.quantity) > 0) {
      if (!data.lotNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Obligatorio',
          path: ['lotNumber'],
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
    // QA #104: descuentos comerciales a nivel de documento.
    // Pronto pago no se incluye aquí — ese se aplica al PAGAR (futuro
    // módulo de Cuentas por Pagar), no al recibir mercancía.
    headerDiscountPct: pctString,
    volumeDiscountPct: pctString,
    notes: z.string().max(500).optional().or(z.literal('')),
    items: z.array(ItemSchema).min(1, { message: 'Agrega al menos un ítem' }),
    nativeCurrency: z.enum(['USD', 'VES']),
    // Strings (los inputs trabajan con texto) — convertimos a number en submit.
    nativeTotal: z.string().optional().or(z.literal('')),
    exchangeRateUsed: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.nativeCurrency === 'VES') {
      if (
        !data.nativeTotal ||
        !/^\d+(\.\d+)?$/.test(data.nativeTotal) ||
        Number(data.nativeTotal) <= 0
      ) {
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
  locationId: '',
  discrepancies: [],
};

// ----------------------------------------------------------------------

export function ReceiptCreateView() {
  const router = useRouter();
  const mutation = useCreateReceiptMutation();

  // ID del último receipt creado, para abrir el modal de productos sin precio.
  // Cuando el modal cierra, redirigimos al listado.
  const [postReceiptId, setPostReceiptId] = useState<string | null>(null);

  const { data: branches = [] } = useBranchesQuery();
  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true });
  const { data: productsData } = useProductsQuery({ limit: 1000, isActive: true });
  const products = useMemo(() => productsData?.data ?? [], [productsData]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p] as const)), [products]);

  // Órdenes activas (sent/partial) para seleccionar como base de la recepción.
  const { data: ordersData } = useOrdersQuery({ page: 1, limit: 1000 });
  const allOrders = useMemo(() => ordersData?.data ?? [], [ordersData]);

  // IVA/IGTF vienen de la configuración global (SUNDDE/SENIAT). El operador
  // no debe ingresarlos a mano; los aplicamos automáticamente y los mostramos
  // en read-only para que el usuario sepa con qué tasa se está calculando.
  const { data: globalConfig } = useConfigQuery();
  const igtfDefault = globalConfig?.igtf_pct ?? '';

  const methods = useForm<FormValues>({
    mode: 'onBlur',
    resolver: zodResolver(ReceiptSchema),
    defaultValues: {
      branchId: '',
      supplierId: '',
      purchaseOrderIds: [],
      supplierInvoiceNumber: '',
      receiptType: 'purchase',
      taxPct: '',
      igtfPct: '',
      headerDiscountPct: '',
      volumeDiscountPct: '',
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

  // Cuando llega la config global, llenamos IGTF (si aún está vacío —
  // respetamos override manual). IVA NO se setea aquí: se calcula como
  // promedio ponderado de las alícuotas por línea (ver totals abajo) y se
  // sincroniza al campo taxPct para que el backend reciba el promedio que
  // el operador ve en pantalla.
  useEffect(() => {
    if (igtfDefault && !methods.getValues('igtfPct')) {
      setValue('igtfPct', igtfDefault);
    }
  }, [igtfDefault, methods, setValue]);

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

  // QA #104: cuando el operador elige proveedor, autopoblar los % sugeridos
  // del maestro. El operador puede sobreescribir cada uno para reflejar lo
  // que dice la factura específica (la queja del QA era justamente que
  // había que ir al maestro para cambiarlos). Pronto pago se excluye —
  // pertenece al módulo de pagos. Volumen no se pre-llena fijo: se
  // auto-calcula según threshold (ver useEffect siguiente).
  useEffect(() => {
    if (!selectedSupplier) return;
    if (
      selectedSupplier.hasHeaderDiscount &&
      !methods.getValues('headerDiscountPct') &&
      selectedSupplier.headerDiscountPct != null
    ) {
      setValue('headerDiscountPct', String(Number(selectedSupplier.headerDiscountPct)), {
        shouldValidate: false,
      });
    }
  }, [selectedSupplier, methods, setValue]);

  // (Los effects de auto-volumen y auto-lineal viven más abajo, después de
  //  que se declare `watchedItems`.)

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
    const loadedKey = loadedOrders
      .map((o) => o.id)
      .sort()
      .join(',');
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
        const remaining = Math.max(0, Number(it.quantity) - Number(it.quantityReceived ?? 0));
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
    // esta entrega. Los enviamos al backend SOLO si tienen al menos una
    // discrepancia reportada (p.ej. "todo lo que ordené llegó dañado") — en
    // ese caso el backend no crea lote pero sí genera el reclamo auto.
    // Items sin quantity y sin discrepancias se descartan: son ruido del form.
    const itemsToSend = values.items.filter((i) => {
      const qty = Number(i.quantity);
      const hasDiscrepancy = (i.discrepancies ?? []).some((d) => Number(d.quantity) > 0);
      return qty > 0 || hasDiscrepancy;
    });

    if (itemsToSend.length === 0) {
      toast.error(
        'Debes recibir al menos un producto con cantidad mayor a cero, o reportar una discrepancia.'
      );
      return;
    }

    const payload: CreateGoodsReceiptPayload = {
      branchId: values.branchId,
      supplierId: values.supplierId,
      supplierInvoiceNumber: values.supplierInvoiceNumber?.trim() || undefined,
      receiptType: values.receiptType,
      taxPct: values.taxPct ? Number(values.taxPct) : undefined,
      igtfPct: values.igtfPct ? Number(values.igtfPct) : undefined,
      headerDiscountPct: values.headerDiscountPct ? Number(values.headerDiscountPct) : undefined,
      volumeDiscountPct: values.volumeDiscountPct ? Number(values.volumeDiscountPct) : undefined,
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
      items: itemsToSend.map((i) => ({
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
        // El precio de venta NO se fija desde la recepción: lo gestiona el
        // módulo de Precios. El backend acepta el campo undefined.
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
          { duration: 12000 }
        );
        // En este caso los lotes aún no existen → no abrimos el dialog de
        // productos sin precio (no aplica todavía). Vamos directo al listado.
        router.push(paths.dashboard.purchases.receipts.root);
      } else {
        toast.success(
          summary
            ? `Recepción ${result.receiptNumber} registrada. ${summary}.`
            : `Recepción ${result.receiptNumber} registrada (sin OC asociada). Se crearon los lotes correspondientes.`
        );
        // Si hubo discrepancias, el backend ya generó un reclamo automático.
        // Lo mostramos al operador con link directo al detalle.
        if (result.autoClaim) {
          toast.warning(
            `Reclamo ${result.autoClaim.claimNumber} generado por discrepancias. Revísalo en el módulo de Reclamos.`,
            {
              duration: 10000,
              action: {
                label: 'Ver reclamo',
                onClick: () => router.push(paths.dashboard.claims.detail(result.autoClaim!.id)),
              },
            }
          );
        }
        // Solo abrimos el modal de "productos sin precio" si efectivamente
        // entró stock físico en esta recepción. Si todo quedó como discrepancia
        // (ej. 1 ampolla pedida, 1 dañada → 0 recibido), no hay productos a
        // los que fijar precio; vamos directo al listado.
        const hasPhysicallyReceived = itemsToSend.some((i) => Number(i.quantity) > 0);
        if (hasPhysicallyReceived) {
          setPostReceiptId(result.id);
        } else {
          router.push(paths.dashboard.purchases.receipts.root);
        }
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const handleClosePostReceipt = () => {
    setPostReceiptId(null);
    router.push(paths.dashboard.purchases.receipts.root);
  };

  // useWatch (vs watch) reacciona a cambios anidados dentro del fieldArray
  // en cada keystroke; con watch('items') el resumen no se recomputaba al
  // editar costo/descuento de una línea.
  const watchedItems = useWatch({ control, name: 'items' });

  // QA #104: auto-aplicar descuento por volumen según umbral del proveedor.
  // Si el supplier tiene threshold + tipo definidos, comparamos contra el
  // total de la factura (cantidad o monto) y aplicamos el % sugerido si se
  // supera; si no, queda en 0. Si no hay threshold, no se toca el campo.
  useEffect(() => {
    if (!selectedSupplier?.hasVolumeDiscount) return;
    if (!selectedSupplier.volumeDiscountThreshold || !selectedSupplier.volumeDiscountThresholdType)
      return;
    const threshold = Number(selectedSupplier.volumeDiscountThreshold);
    const sugPct =
      selectedSupplier.volumeDiscountPct != null ? Number(selectedSupplier.volumeDiscountPct) : 0;
    let metric = 0;
    if (selectedSupplier.volumeDiscountThresholdType === 'quantity') {
      metric = (watchedItems ?? []).reduce((s, it) => {
        const invoiced = Number(it.invoicedQuantity);
        const q = Number.isFinite(invoiced) && invoiced > 0 ? invoiced : Number(it.quantity) || 0;
        return s + q;
      }, 0);
    } else {
      metric = (watchedItems ?? []).reduce((s, it) => {
        const invoiced = Number(it.invoicedQuantity);
        const q = Number.isFinite(invoiced) && invoiced > 0 ? invoiced : Number(it.quantity) || 0;
        const u = Number(it.unitCostUsd) || 0;
        const d = Number(it.discountPct) || 0;
        return s + q * u * (1 - d / 100);
      }, 0);
    }
    const next = metric >= threshold ? sugPct.toFixed(2) : '0';
    if (methods.getValues('volumeDiscountPct') !== next) {
      setValue('volumeDiscountPct', next, { shouldValidate: false });
    }
  }, [selectedSupplier, watchedItems, methods, setValue]);

  // Auto-poblar el descuento lineal sugerido por el proveedor en cada
  // ítem nuevo que tenga el campo vacío. No pisa ediciones manuales.
  useEffect(() => {
    if (!selectedSupplier?.hasLinearDiscount) return;
    const linearPct = selectedSupplier.linearDiscountPct;
    if (linearPct == null) return;
    const value = String(Number(linearPct));
    (watchedItems ?? []).forEach((it, idx) => {
      if (!it?.productId) return;
      const current = methods.getValues(`items.${idx}.discountPct`);
      if (!current) {
        setValue(`items.${idx}.discountPct`, value, { shouldValidate: false });
      }
    });
  }, [selectedSupplier, watchedItems, methods, setValue]);
  const watchedIgtfPct = useWatch({ control, name: 'igtfPct' });
  const watchedNativeCurrency = useWatch({ control, name: 'nativeCurrency' });
  // QA #104: descuentos comerciales reactivos.
  const watchedHeaderDiscPct = useWatch({ control, name: 'headerDiscountPct' });
  const watchedVolumeDiscPct = useWatch({ control, name: 'volumeDiscountPct' });

  // IVA por línea según taxType del producto (exempt=0, reduced=alícuota
  // reducida configurada, general=alícuota general). El campo IVA del recibo
  // pasa a ser informativo (promedio ponderado), no editable.
  const ivaGeneralPct = Number(globalConfig?.iva_general_pct) || 0;
  const ivaReducedPct = Number(globalConfig?.iva_reduced_pct) || 0;

  const totals = useMemo(() => {
    const resolveLineTaxPct = (taxType?: string) => {
      if (!taxType || taxType === 'exempt') return 0;
      if (taxType === 'reduced') return ivaReducedPct;
      return ivaGeneralPct;
    };
    let subtotal = 0;
    let totalDiscount = 0;
    let taxGross = 0;
    // Desglose por taxType para mostrar en el Resumen (QA: el exento no
    // se muestra porque siempre es 0).
    let taxGrossGeneral = 0;
    let taxGrossReduced = 0;
    for (const it of watchedItems ?? []) {
      // Subtotal usa la cantidad FACTURADA (lo que cobra el proveedor),
      // no la recibida. La diferencia se documenta como discrepancia y se
      // reclama por nota de crédito; pero la factura original cobra lo
      // facturado.
      const invoiced = Number(it.invoicedQuantity);
      const q = Number.isFinite(invoiced) && invoiced > 0 ? invoiced : Number(it.quantity) || 0;
      const u = Number(it.unitCostUsd) || 0;
      const d = Number(it.discountPct) || 0;
      const gross = q * u;
      const discountAmount = gross * (d / 100);
      const lineSubtotal = gross - discountAmount;
      subtotal += lineSubtotal;
      totalDiscount += discountAmount;
      // IVA por producto: medicamentos exentos no pagan IVA; misceláneos
      // pagan general; algunos productos especiales pagan reducido.
      const product = productById.get(it.productId);
      const lineTaxPct = resolveLineTaxPct(product?.taxType);
      const lineTax = lineSubtotal * (lineTaxPct / 100);
      taxGross += lineTax;
      if (product?.taxType === 'reduced') taxGrossReduced += lineTax;
      else if (product?.taxType && product.taxType !== 'exempt') taxGrossGeneral += lineTax;
    }

    // QA #104: descuentos comerciales del documento. Orden:
    //  1. header + volume sobre subtotal → netSubtotal
    //  2. IVA escalado proporcionalmente sobre netSubtotal
    //  3. IGTF sobre (net + IVA), solo USD
    // Pronto pago se excluye de la recepción — pertenece al módulo de pagos.
    const headerDiscPct = Number(watchedHeaderDiscPct) || 0;
    const volumeDiscPct = Number(watchedVolumeDiscPct) || 0;
    const headerDiscount = subtotal * (headerDiscPct / 100);
    const volumeDiscount = subtotal * (volumeDiscPct / 100);
    const netSubtotal = subtotal - headerDiscount - volumeDiscount;
    const taxScale = subtotal > 0 ? netSubtotal / subtotal : 0;
    const tax = taxGross * taxScale;
    // Cada bucket de IVA también se escala con el descuento del documento
    // (el descuento se prorratea proporcionalmente a la base de cada IVA).
    const taxGeneral = taxGrossGeneral * taxScale;
    const taxReduced = taxGrossReduced * taxScale;

    // IGTF (3% Venezuela) sólo aplica a pagos en divisas. Si la factura es
    // en Bs., el IGTF es cero — sin importar lo configurado globalmente.
    const igtfPctNum = watchedNativeCurrency === 'VES' ? 0 : Number(watchedIgtfPct) || 0;
    const igtf = (netSubtotal + tax) * (igtfPctNum / 100);
    const total = netSubtotal + tax + igtf;
    // Promedio ponderado de IVA para mostrar en el campo "IVA %" del recibo.
    const avgTaxPct = netSubtotal > 0 ? (tax / netSubtotal) * 100 : 0;
    return {
      subtotal,
      totalDiscount,
      headerDiscount,
      volumeDiscount,
      netSubtotal,
      tax,
      taxGeneral,
      taxReduced,
      igtf,
      total,
      avgTaxPct,
    };
  }, [
    watchedItems,
    watchedIgtfPct,
    watchedNativeCurrency,
    watchedHeaderDiscPct,
    watchedVolumeDiscPct,
    productById,
    ivaGeneralPct,
    ivaReducedPct,
  ]);

  // Sincronizamos el promedio calculado al campo taxPct del recibo para que
  // el operador vea el % efectivo y para que el backend reciba el mismo valor
  // que el resumen. El backend, además, recalcula por línea (autoridad), pero
  // mantenemos taxPct como registro del promedio.
  useEffect(() => {
    const next = totals.avgTaxPct ? totals.avgTaxPct.toFixed(2) : '';
    if (methods.getValues('taxPct') !== next) {
      setValue('taxPct', next);
    }
  }, [totals.avgTaxPct, methods, setValue]);

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
    ({ idx }) => !!watchedItems?.[idx]?.purchaseOrderId
  );
  const additionalFieldEntries = indexedFields.filter(
    ({ idx }) => !watchedItems?.[idx]?.purchaseOrderId
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
    // Ítems "adicionales" son productos que llegaron sin estar en la OC.
    // Para ellos no aplican razones que asumen un baseline de OC (faltante
    // contra lo ordenado, producto incorrecto contra SKU pedido).
    const isAdditional = !item?.purchaseOrderId;
    const invoiced = Number(item?.invoicedQuantity ?? item?.quantity ?? 0);
    const received = Number(item?.quantity ?? 0);
    // Signo de la diferencia: positivo = faltante (recibí menos que facturado),
    // negativo = sobrante (recibí más). Conservamos el signo para filtrar
    // razones y mensajes — antes usábamos `Math.abs` y eso confundía sobrantes
    // con faltantes en los reportes del QA.
    const signedDiff = invoiced - received;
    const diff = Math.abs(signedDiff);
    const isShortage = signedDiff > 0; // faltó stock
    const isExcess = signedDiff < 0; // llegó de más
    const epsilon = 0.001;

    const discrepancies = item?.discrepancies ?? [];
    const sumDiscrepancies = discrepancies.reduce((s, d) => s + (Number(d.quantity) || 0), 0);
    const remaining = diff - sumDiscrepancies;
    const balanced = Math.abs(remaining) <= epsilon;

    if (diff <= epsilon && discrepancies.length === 0) return null;

    const tone = balanced ? 'success' : remaining > 0 ? 'warning' : 'error';
    const diffLabel = Math.round(diff); // QA: sin decimales en el display
    const remainingLabel = Math.round(Math.abs(remaining));
    const message = balanced
      ? `Discrepancias cuadran (${diffLabel}).`
      : remaining > 0
        ? `Faltan ${remainingLabel} unidades por explicar.`
        : `Sobran ${remainingLabel} unidades en discrepancias.`;

    // Default reason según contexto:
    // - Adicional (no en OC): muestra gratis es el caso más frecuente.
    // - OC con sobrante: "excess".
    // - OC con faltante: "expired" como punto de partida (operador puede
    //   cambiar a defectuoso, dañado, etc.).
    const defaultReason: DiscrepancyReason = isAdditional
      ? 'sample'
      : isExcess
        ? 'excess'
        : 'expired';

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
              Diferencia: facturada {invoiced} vs recibida {received} ({diffLabel})
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            // QA: deshabilitar cuando todas las discrepancias ya cuadran.
            disabled={balanced}
            onClick={() => {
              const next = [
                ...(watchedItems?.[idx]?.discrepancies ?? []),
                { reason: defaultReason, quantity: '', notes: '' },
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
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
            >
              <Field.Select
                name={`items.${idx}.discrepancies.${dIdx}.reason`}
                label="Razón"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1.5, minWidth: 220 }}
              >
                {/* QA #117: las razones para productos ADICIONALES (no en
                    OC) son completamente diferentes — clasifican por qué
                    llegó algo no pedido (muestra, sustituto, regalo). Las
                    razones de daño/vencimiento aplican solo a ítems de OC
                    (donde había una expectativa de calidad contra la
                    factura). */}
                {isAdditional ? (
                  <>
                    <MenuItem value="sample">Muestra gratis</MenuItem>
                    <MenuItem value="substitute">Sustituto del proveedor</MenuItem>
                    <MenuItem value="commercial_gift">Regalo comercial / bonificación</MenuItem>
                    <MenuItem value="excess">Sobrante de OC vecina</MenuItem>
                    <MenuItem value="other">Otro</MenuItem>
                  </>
                ) : (
                  <>
                    {/* Razones OC — filtradas por dirección de la diferencia:
                        - Si llegó MÁS de lo facturado, solo 'excess' aplica.
                        - Si llegó MENOS, ocultamos 'excess'. */}
                    {!isExcess && [
                      <MenuItem key="expired" value="expired">
                        Vencido / próximo a vencer
                      </MenuItem>,
                      <MenuItem key="defective" value="defective">
                        Defectuoso de fábrica
                      </MenuItem>,
                      <MenuItem key="damaged_packaging" value="damaged_packaging">
                        Empaque dañado
                      </MenuItem>,
                      <MenuItem key="damaged_in_transit" value="damaged_in_transit">
                        Daño en transporte
                      </MenuItem>,
                      <MenuItem key="incorrect_product" value="incorrect_product">
                        Producto incorrecto
                      </MenuItem>,
                      <MenuItem key="missing" value="missing">
                        Faltante
                      </MenuItem>,
                      <MenuItem key="quality_failure" value="quality_failure">
                        Falla de calidad
                      </MenuItem>,
                    ]}
                    {isExcess && <MenuItem value="excess">Sobrante</MenuItem>}
                    {isShortage && <MenuItem value="other">Otro</MenuItem>}
                  </>
                )}
              </Field.Select>
              <Field.Text
                name={`items.${idx}.discrepancies.${dIdx}.quantity`}
                label="Cantidad"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { inputMode: 'decimal' },
                }}
                sx={{ width: { xs: '100%', sm: 140 }, flexShrink: 0 }}
              />
              <Field.Text
                name={`items.${idx}.discrepancies.${dIdx}.notes`}
                label="Nota (obligatorio si es 'Otro')"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 2 }}
              />
              <IconButton
                color="error"
                sx={{ mt: { sm: 0.5 }, flexShrink: 0 }}
                onClick={() => {
                  const next = (watchedItems?.[idx]?.discrepancies ?? []).filter(
                    (_d, i) => i !== dIdx
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
    const invoicedQty = Number(watchedItems?.[idx]?.invoicedQuantity ?? qty);
    const hasDiscrepancies = (watchedItems?.[idx]?.discrepancies ?? []).some(
      (d) => Number(d.quantity) > 0
    );
    const hasDiff = Math.abs(invoicedQty - qty) > 0.001;
    // "No recibido" = de la OC, sin stock físico, sin diferencia respecto a la
    // factura y sin discrepancias. En ese caso el operador simplemente no recibió
    // este producto en esta entrega — atenuamos la línea para señalar "siguiente
    // entrega". Si hay diff o discrepancias, la línea está ACTIVA (hay que
    // justificar) y NO la atenuamos para no parecer bloqueada.
    const isNotReceived = fromOrder && qty === 0 && !hasDiff && !hasDiscrepancies;

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
              <Field.IdAutocomplete
                name={`items.${idx}.productId`}
                label="Producto"
                placeholder="Buscar producto…"
                disabled={fromOrder}
                options={products.map((p) => ({
                  id: p.id,
                  label: p.shortName ?? p.description,
                  secondaryLabel: p.internalCode ?? null,
                }))}
              />

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
                {/* QA #109: si el producto NO trackea vencimiento (consumo
                   masivo: jabón, papel, etc.) ocultamos el campo. El backend
                   guarda el lote con un sentinel far-future para que FEFO lo
                   ordene al final sin caducidad efectiva. */}
                {product?.tracksExpiration !== false && (
                  <Field.Text
                    name={`items.${idx}.expirationDate`}
                    label="Vencimiento"
                    type="date"
                    disabled={isNotReceived}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0 }}
                  />
                )}
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
                  helperText="De la factura del proveedor"
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
              </Stack>

              {/* Resumen por línea — el operador necesita conciliar cada
                 renglón contra la factura del proveedor sin tener que sumar
                 mental subtotal × tax. IGTF no se muestra aquí porque es
                 un impuesto a nivel documento (sólo aplica a pagos en
                 divisa) — no por línea. */}
              {(() => {
                const cost = Number(watchedItems?.[idx]?.unitCostUsd) || 0;
                const disc = Number(watchedItems?.[idx]?.discountPct) || 0;
                const lineSubtotal = invoicedQty * cost * (1 - disc / 100);
                // IVA según el taxType del PRODUCTO, no una tasa única del
                // recibo. Medicamentos exentos → 0%; misceláneos → general;
                // especiales → reducido.
                const taxType = product?.taxType;
                const lineTaxPct =
                  !taxType || taxType === 'exempt'
                    ? 0
                    : taxType === 'reduced'
                      ? ivaReducedPct
                      : ivaGeneralPct;
                const lineTax = lineSubtotal * (lineTaxPct / 100);
                const lineTotal = lineSubtotal + lineTax;
                if (lineSubtotal <= 0 && lineTax <= 0) return null;
                return (
                  <Stack
                    direction="row"
                    spacing={3}
                    sx={{ pl: 0.5, color: 'text.secondary' }}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography variant="caption">
                      Subtotal línea:{' '}
                      <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        ${lineSubtotal.toFixed(2)}
                      </Box>
                    </Typography>
                    <Typography variant="caption">
                      IVA ({lineTaxPct}%):{' '}
                      <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        ${lineTax.toFixed(2)}
                      </Box>
                    </Typography>
                    <Typography variant="caption">
                      Total línea:{' '}
                      <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        ${lineTotal.toFixed(2)}
                      </Box>
                    </Typography>
                  </Stack>
                );
              })()}

              {/* El panel se muestra siempre que haya diferencia entre lo
                 facturado y lo recibido (incluso cuando Recibida=0): es el
                 único lugar donde el operador puede justificar QUÉ pasó
                 (vencido, dañado, etc.) y disparar el reclamo automático. */}
              <Box sx={{ opacity: 1 }}>{renderDiscrepancyPanel(idx)}</Box>
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
    <Container maxWidth="xl" sx={{ pb: 6 }}>
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
                const o = orderById.get(id as string) ?? loadedOrders.find((lo) => lo.id === id);
                if (!o) return id as string;
                const statusTag = ` · ${ORDER_STATUS_LABEL[o.status] ?? o.status}`;
                return `${o.orderNumber} · ${new Date(o.createdAt).toLocaleDateString('es-VE')}${statusTag}`;
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
                {selectedOrdersSummary.length === 1
                  ? 'Orden'
                  : `${selectedOrdersSummary.length} órdenes`}{' '}
                consolidadas en esta factura:
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                  {selectedOrdersSummary.map((o) => (
                    <Chip
                      key={o.id}
                      size="small"
                      variant="outlined"
                      label={`${o.orderNumber} · ${ORDER_STATUS_LABEL[o.status] ?? o.status}`}
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
              <Box sx={{ flex: 1 }}>
                <Field.IdAutocomplete
                  name="supplierId"
                  label="Proveedor"
                  placeholder="Buscar proveedor por nombre o RIF…"
                  disabled={branchSupplierLockedByOrder}
                  helperText={
                    branchSupplierLockedByOrder
                      ? 'Heredado de la orden de compra seleccionada.'
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
                            latestBcvRate.effectiveDate
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
                    ${(Number(watch('nativeTotal')) / Number(watch('exchangeRateUsed'))).toFixed(2)}
                  </strong>
                  . Compáralo contra el total computado abajo (debería estar cerca; pequeñas
                  diferencias por redondeo son normales).
                </Alert>
              )}

            {/* QA #104: descuentos comerciales por documento. Aparecen
               solo si el proveedor tiene activado el toggle correspondiente
               en su maestro. El % se autopobla con el sugerido del maestro;
               el operador puede editarlo para reflejar la factura específica. */}
            {selectedSupplier &&
              (selectedSupplier.hasHeaderDiscount || selectedSupplier.hasVolumeDiscount) && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      mb: 1.5,
                    }}
                  >
                    DESCUENTOS COMERCIALES
                  </Typography>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    {selectedSupplier.hasHeaderDiscount && (
                      <Field.Text
                        name="headerDiscountPct"
                        label="Cabecera %"
                        helperText="Aplicado al subtotal"
                        slotProps={{
                          inputLabel: { shrink: true },
                          htmlInput: { inputMode: 'decimal' },
                        }}
                        sx={{ flex: 1 }}
                      />
                    )}
                    {selectedSupplier.hasVolumeDiscount && (
                      <Field.Text
                        name="volumeDiscountPct"
                        label="Volumen %"
                        disabled
                        helperText={
                          selectedSupplier.volumeDiscountThreshold &&
                          selectedSupplier.volumeDiscountThresholdType
                            ? `Auto: aplica si ${
                                selectedSupplier.volumeDiscountThresholdType === 'quantity'
                                  ? 'cantidad total'
                                  : 'subtotal'
                              } ≥ ${Number(selectedSupplier.volumeDiscountThreshold)}`
                            : 'Configura umbral en el maestro del proveedor para auto-aplicar'
                        }
                        slotProps={{
                          inputLabel: { shrink: true },
                          htmlInput: { inputMode: 'decimal' },
                        }}
                        sx={{ flex: 1 }}
                      />
                    )}
                  </Stack>
                </Box>
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
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}
                >
                  Producto viene de la OC. Captura cantidad facturada, recibida, lote, vencimiento y
                  el costo unitario de la factura del proveedor. El precio de venta se fija desde el
                  módulo de Precios. Si un producto no llegó, marca cantidad 0.
                </Typography>
              </Box>
              {orderFieldEntries.map(({ field, idx }, i) => {
                const itemOrderId = watchedItems?.[idx]?.purchaseOrderId;
                const itemOrder = itemOrderId
                  ? (orderById.get(itemOrderId) ?? loadedOrders.find((o) => o.id === itemOrderId))
                  : undefined;
                return (
                  <Box key={field.id}>
                    {renderItemRow({
                      field,
                      idx,
                      fromOrder: true,
                      itemOrderNumber: itemOrder?.orderNumber,
                    })}
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
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}
                  >
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
                  Descuento lineal (por línea)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                  −${totals.totalDiscount.toFixed(2)}
                </Typography>
              </Stack>
            )}
            {totals.headerDiscount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Descuento cabecera ({Number(watchedHeaderDiscPct) || 0}%)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                  −${totals.headerDiscount.toFixed(2)}
                </Typography>
              </Stack>
            )}
            {totals.volumeDiscount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Descuento volumen ({Number(watchedVolumeDiscPct) || 0}%)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                  −${totals.volumeDiscount.toFixed(2)}
                </Typography>
              </Stack>
            )}
            {totals.taxGeneral > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  IVA ({ivaGeneralPct}%)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  ${totals.taxGeneral.toFixed(2)}
                </Typography>
              </Stack>
            )}
            {totals.taxReduced > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  IVA ({ivaReducedPct}%)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  ${totals.taxReduced.toFixed(2)}
                </Typography>
              </Stack>
            )}
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

      <UnpricedProductsDialog receiptId={postReceiptId} onClose={handleClosePostReceipt} />
    </Container>
  );
}
