import type { GridColDef } from '@mui/x-data-grid';
import type { GoodsReceiptItem } from '../../model/types';

import { useMemo } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';

import { RECEIPT_TYPE_LABEL } from '../../model/constants';
import { useOrdersQuery, useReceiptQuery } from '../../api/purchases.queries';

// ----------------------------------------------------------------------

export function ReceiptDetailView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: receipt, isLoading, isError, error } = useReceiptQuery(id);

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
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {row.lotId.slice(0, 8)}
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
    <Container maxWidth="lg">
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
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Órdenes de compra
                </Typography>
                {linkedOrders.length > 0 ? (
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                    {linkedOrders.map((o) => (
                      <Button
                        key={o.id}
                        size="small"
                        variant="outlined"
                        onClick={() => router.push(paths.dashboard.purchases.orders.detail(o.id))}
                        sx={{ py: 0.25 }}
                      >
                        {o.orderNumber}
                      </Button>
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
