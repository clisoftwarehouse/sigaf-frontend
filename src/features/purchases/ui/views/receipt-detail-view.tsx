import type { GridColDef } from '@mui/x-data-grid';
import type { GoodsReceiptItem } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';

import { RECEIPT_TYPE_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../../model/constants';
import {
  useOrdersQuery,
  useReceiptQuery,
  useReapproveReceiptMutation,
} from '../../api/purchases.queries';

// ----------------------------------------------------------------------

export function ReceiptDetailView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: receipt, isLoading, isError, error } = useReceiptQuery(id);
  const reapproveMutation = useReapproveReceiptMutation();
  const [reapproveOpen, setReapproveOpen] = useState(false);
  const [justification, setJustification] = useState('');

  const { data: productOpts = [] } = useProductOptions();
  const productNameById = useMemo(
    () => new Map(productOpts.map((o) => [o.id, o.label] as const)),
    [productOpts]
  );
  const { data: branchOpts = [] } = useBranchOptions();
  const branchName = useMemo(
    () => branchOpts.find((b) => b.id === receipt?.branchId)?.label ?? receipt?.branchId ?? '—',
    [branchOpts, receipt]
  );
  const { data: supplierOpts = [] } = useSupplierOptions();
  const supplierName = useMemo(
    () =>
      supplierOpts.find((s) => s.id === receipt?.supplierId)?.label ?? receipt?.supplierId ?? '—',
    [supplierOpts, receipt]
  );

  const { data: ordersData } = useOrdersQuery({ page: 1, limit: 1000 });
  const orderById = useMemo(
    () => new Map((ordersData?.data ?? []).map((o) => [o.id, o] as const)),
    [ordersData]
  );
  const linkedOrders = useMemo(
    () =>
      (receipt?.purchaseOrderIds ?? [])
        .map((rid) => orderById.get(rid))
        .filter((o): o is NonNullable<typeof o> => !!o),
    [receipt, orderById]
  );

  const itemColumns = useMemo<GridColDef<GoodsReceiptItem>[]>(
    () => [
      {
        field: 'purchaseOrderId',
        headerName: 'OC',
        flex: 0.8,
        minWidth: 120,
        valueGetter: (value: string | null) =>
          value ? (orderById.get(value)?.orderNumber ?? value.slice(0, 8)) : '—',
        renderCell: ({ row }) =>
          row.purchaseOrderId ? (
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', color: 'primary.main', cursor: 'pointer' }}
              onClick={() =>
                router.push(paths.dashboard.purchases.orders.detail(row.purchaseOrderId!))
              }
            >
              {orderById.get(row.purchaseOrderId)?.orderNumber ?? row.purchaseOrderId.slice(0, 8)}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              —
            </Typography>
          ),
      },
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2.5,
        minWidth: 240,
        valueFormatter: (value: string) => productNameById.get(value) ?? value,
        renderCell: ({ row }) => (
          <Typography variant="body2">
            {productNameById.get(row.productId) ?? row.productId}
          </Typography>
        ),
        sortComparator: (a, b) =>
          (productNameById.get(a) ?? '').localeCompare(productNameById.get(b) ?? ''),
      },
      {
        field: 'lotId',
        headerName: 'Lote creado',
        flex: 1.5,
        minWidth: 160,
        renderCell: ({ row }) =>
          row.lotId ? (
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              {row.lotId.slice(0, 8)}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: 'warning.main', fontStyle: 'italic' }}>
              Pendiente reaprobación
            </Typography>
          ),
      },
      {
        field: 'quantity',
        headerName: 'Cantidad',
        type: 'number',
        flex: 1,
        minWidth: 110,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'unitCostUsd',
        headerName: 'Costo unitario',
        type: 'number',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'discountPct',
        headerName: 'Desc. %',
        type: 'number',
        flex: 0.7,
        minWidth: 100,
        valueGetter: (value: number | string | null) => Number(value) || 0,
        valueFormatter: (value: number) => (value > 0 ? `${value.toFixed(2)}%` : '—'),
      },
      {
        field: 'subtotalUsd',
        headerName: 'Subtotal',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueGetter: (value: number | string | null, row) => {
          const stored = Number(value) || 0;
          if (stored > 0) return stored;
          const qty = Number(row.quantity) || 0;
          const cost = Number(row.unitCostUsd) || 0;
          const d = Number(row.discountPct) || 0;
          return qty * cost * (1 - d / 100);
        },
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
        cellClassName: 'subtotal-cell',
      },
    ],
    [productNameById, orderById, router]
  );

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title={receipt ? `Recepción ${receipt.receiptNumber}` : 'Recepción de mercancía'}
        subtitle={receipt ? new Date(receipt.createdAt).toLocaleString('es-VE') : undefined}
        crumbs={[{ label: 'Compras' }, { label: 'Recepciones' }, { label: 'Detalle' }]}
        action={
          <Stack direction="row" spacing={1}>
            {receipt && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Iconify icon="solar:danger-triangle-bold" />}
                onClick={() => router.push(`${paths.dashboard.claims.new}?receiptId=${receipt.id}`)}
              >
                Crear reclamo
              </Button>
            )}
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
          </Stack>
        }
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {receipt?.requiresReapproval && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          icon={<Iconify icon="solar:danger-triangle-bold" />}
          action={
            <Button
              size="small"
              color="warning"
              variant="contained"
              onClick={() => setReapproveOpen(true)}
            >
              Reaprobar
            </Button>
          }
        >
          Esta recepción excedió la tolerancia y está bloqueada. Los lotes NO se han creado y los
          precios no se han publicado. Reapruébala con justificación para liberarla a inventario.
        </Alert>
      )}

      {receipt?.reapprovedBy && receipt.reapprovedAt && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<Iconify icon="solar:shield-check-bold" />}>
          Reaprobada el {new Date(receipt.reapprovedAt).toLocaleString('es-VE')}.
          {receipt.reapprovalJustification && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Justificación: {receipt.reapprovalJustification}
            </Typography>
          )}
        </Alert>
      )}

      <Dialog open={reapproveOpen} onClose={() => setReapproveOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>Reaprobar recepción</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Al reaprobar se crearán los lotes correspondientes y la mercancía entrará al
              inventario. La justificación quedará en el log de auditoría.
            </Typography>
            <TextField
              autoFocus
              label="Justificación"
              placeholder="Ej. Proveedor confirmó el incremento de costo por escasez de inventario."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              multiline
              minRows={3}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Mínimo 10 caracteres.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReapproveOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={justification.trim().length < 10}
            loading={reapproveMutation.isPending}
            onClick={async () => {
              if (!id) return;
              try {
                await reapproveMutation.mutateAsync({ id, justification: justification.trim() });
                toast.success('Recepción reaprobada. Lotes creados y precios publicados.');
                setReapproveOpen(false);
                setJustification('');
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}
          >
            Confirmar reaprobación
          </Button>
        </DialogActions>
      </Dialog>

      {receipt && (
        <>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Nº de recepción
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                  {receipt.receiptNumber}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tipo
                </Typography>
                <Typography variant="body1">
                  {RECEIPT_TYPE_LABEL[receipt.receiptType] ?? receipt.receiptType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Proveedor
                </Typography>
                <Typography variant="body1">{supplierName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Sucursal
                </Typography>
                <Typography variant="body1">{branchName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Factura proveedor
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {receipt.supplierInvoiceNumber ?? '—'}
                </Typography>
              </Box>
              {receipt.nativeCurrency === 'VES' && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Factura en moneda original
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    Bs.{' '}
                    {Number(receipt.nativeTotal ?? 0).toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Tasa BCV usada: {Number(receipt.exchangeRateUsed ?? 0).toFixed(4)} Bs./USD
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Órdenes de compra
                </Typography>
                {linkedOrders.length > 0 ? (
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ flexWrap: 'wrap', mt: 0.5, gap: 0.5 }}
                  >
                    {linkedOrders.map((o) => (
                      <Stack key={o.id} direction="row" spacing={0.5} alignItems="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => router.push(paths.dashboard.purchases.orders.detail(o.id))}
                          sx={{ py: 0.25 }}
                        >
                          {o.orderNumber}
                        </Button>
                        <Chip
                          size="small"
                          color={ORDER_STATUS_COLOR[o.status]}
                          label={ORDER_STATUS_LABEL[o.status]}
                        />
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body1" sx={{ color: 'text.disabled' }}>
                    —
                  </Typography>
                )}
              </Box>
            </Stack>
            {receipt.notes && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                {receipt.notes}
              </Typography>
            )}
          </Card>

          <Card>
            <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
              Ítems recibidos ({receipt.items?.length ?? 0})
            </Typography>
            <Box
              sx={{
                width: '100%',
                '& .subtotal-cell': { fontWeight: 600 },
              }}
            >
              <DataTable
                columns={itemColumns}
                rows={receipt.items ?? []}
                disableRowSelectionOnClick
                autoHeight
              />
            </Box>

            <Stack
              direction="row"
              justifyContent="flex-end"
              sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}
            >
              <Stack spacing={1} sx={{ minWidth: 260 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    ${(Number(receipt.subtotalUsd) || 0).toFixed(2)}
                  </Typography>
                </Stack>
                {Number(receipt.totalDiscountUsd) > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Descuentos
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', color: 'error.main' }}
                    >
                      −${(Number(receipt.totalDiscountUsd) || 0).toFixed(2)}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    IVA ({Number(receipt.taxPct) || 0}%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    ${(Number(receipt.taxUsd) || 0).toFixed(2)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    IGTF ({Number(receipt.igtfPct) || 0}%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    ${(Number(receipt.igtfUsd) || 0).toFixed(2)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle1">Total recepción</Typography>
                  <Typography variant="subtitle1" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    ${(Number(receipt.totalUsd) || 0).toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </>
      )}
    </Container>
  );
}
