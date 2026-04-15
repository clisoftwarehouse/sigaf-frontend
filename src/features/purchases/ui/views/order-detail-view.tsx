import type { GridColDef } from '@mui/x-data-grid';
import type { PurchaseOrderItem } from '../../model/types';

import { toast } from 'sonner';
import { useMemo } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';

import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../../model/constants';
import { useOrderQuery, useApproveOrderMutation } from '../../api/purchases.queries';

// ----------------------------------------------------------------------

export function OrderDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error } = useOrderQuery(id);
  const approveMutation = useApproveOrderMutation();

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Orden aprobada');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const canApprove = order?.status === 'draft';

  const itemColumns = useMemo<GridColDef<PurchaseOrderItem>[]>(
    () => [
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.productId.slice(0, 8)}
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
        field: 'quantityReceived',
        headerName: 'Recibido',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'unitCostUsd',
        headerName: 'Costo',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'discountPct',
        headerName: 'Descuento',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string | null) =>
          value == null ? null : Number(value),
        valueFormatter: (value: number | null) => (value == null ? '—' : `${value.toFixed(2)}%`),
      },
    ],
    []
  );

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Orden de compra"
        subtitle={order ? new Date(order.createdAt).toLocaleString('es-VE') : undefined}
        crumbs={[{ label: 'Compras' }, { label: 'Órdenes' }, { label: 'Detalle' }]}
        action={
          canApprove && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              loading={approveMutation.isPending}
              onClick={handleApprove}
            >
              Aprobar
            </Button>
          )
        }
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {order && (
        <>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    color={ORDER_STATUS_COLOR[order.status]}
                    label={ORDER_STATUS_LABEL[order.status]}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tipo
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {order.orderType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Fecha esperada
                </Typography>
                <Typography variant="body1">{order.expectedDate ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Total
                </Typography>
                <Typography variant="h5">
                  ${(Number(order.total) || 0).toFixed(2)}
                </Typography>
              </Box>
            </Stack>
            {order.notes && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                {order.notes}
              </Typography>
            )}
          </Card>

          <Card>
            <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
              Ítems ({order.items?.length ?? 0})
            </Typography>
            <Box sx={{ width: '100%' }}>
              <DataTable
                columns={itemColumns}
                rows={order.items ?? []}
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
