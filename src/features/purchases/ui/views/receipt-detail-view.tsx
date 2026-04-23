import type { GridColDef } from '@mui/x-data-grid';
import type { GoodsReceiptItem } from '../../model/types';

import { useMemo } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
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
import { useOrderQuery, useReceiptQuery } from '../../api/purchases.queries';

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
      supplierOpts.find((s) => s.id === receipt?.supplierId)?.label ??
      receipt?.supplierId ??
      '—',
    [supplierOpts, receipt]
  );

  const { data: relatedOrder } = useOrderQuery(receipt?.purchaseOrderId ?? undefined);

  const itemColumns = useMemo<GridColDef<GoodsReceiptItem>[]>(
    () => [
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
        field: 'subtotal',
        headerName: 'Subtotal',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueGetter: (_v, row) => {
          const qty = Number(row.quantity) || 0;
          const cost = Number(row.unitCostUsd) || 0;
          return qty * cost;
        },
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
        cellClassName: 'subtotal-cell',
      },
    ],
    [productNameById]
  );

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={receipt ? `Recepción ${receipt.receiptNumber}` : 'Recepción de mercancía'}
        subtitle={receipt ? new Date(receipt.createdAt).toLocaleString('es-VE') : undefined}
        crumbs={[{ label: 'Compras' }, { label: 'Recepciones' }, { label: 'Detalle' }]}
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
                  Orden de compra
                </Typography>
                {receipt.purchaseOrderId ? (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() =>
                      router.push(
                        paths.dashboard.purchases.orders.detail(receipt.purchaseOrderId!)
                      )
                    }
                    sx={{ p: 0, minWidth: 0, justifyContent: 'flex-start' }}
                  >
                    {relatedOrder?.orderNumber ?? receipt.purchaseOrderId.slice(0, 8)}
                  </Button>
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
              <Box sx={{ textAlign: 'right', minWidth: 220 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total recepción
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  ${(Number(receipt.totalUsd) || 0).toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </>
      )}
    </Container>
  );
}
