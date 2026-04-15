import type { GridColDef } from '@mui/x-data-grid';
import type { GoodsReceiptItem } from '../../model/types';

import { useMemo } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';

import { useReceiptQuery } from '../../api/purchases.queries';

// ----------------------------------------------------------------------

export function ReceiptDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: receipt, isLoading, isError, error } = useReceiptQuery(id);

  const itemColumns = useMemo<GridColDef<GoodsReceiptItem>[]>(
    () => [
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.productId.slice(0, 8)}
          </Typography>
        ),
      },
      {
        field: 'lotId',
        headerName: 'Lote creado',
        flex: 2,
        minWidth: 180,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.lotId.slice(0, 8)}
          </Typography>
        ),
      },
      {
        field: 'quantity',
        headerName: 'Cantidad',
        type: 'number',
        flex: 1,
        minWidth: 120,
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
    ],
    []
  );

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Recepción de mercancía"
        subtitle={receipt ? new Date(receipt.createdAt).toLocaleString('es-VE') : undefined}
        crumbs={[{ label: 'Compras' }, { label: 'Recepciones' }, { label: 'Detalle' }]}
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
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tipo
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {receipt.receiptType}
                </Typography>
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
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {receipt.purchaseOrderId ?? '—'}
                </Typography>
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
            <Box sx={{ width: '100%' }}>
              <DataTable
                columns={itemColumns}
                rows={receipt.items ?? []}
                disableRowSelectionOnClick
                autoHeight
              />
            </Box>
          </Card>
        </>
      )}
    </Container>
  );
}
