import type { GridColDef } from '@mui/x-data-grid';
import type { ConsignmentReturnItem } from '../../model/types';

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
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';

import { useReturnQuery } from '../../api/consignments.queries';

// ----------------------------------------------------------------------

export function ReturnDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: ret, isLoading, isError, error } = useReturnQuery(id);

  const { data: branchOpts = [] } = useBranchOptions();
  const { data: supplierOpts = [] } = useSupplierOptions();
  const branchName = branchOpts.find((o) => o.id === ret?.branchId)?.label ?? ret?.branchId;
  const supplierName = supplierOpts.find((o) => o.id === ret?.supplierId)?.label ?? ret?.supplierId;

  const itemColumns = useMemo<GridColDef<ConsignmentReturnItem>[]>(
    () => [
      {
        field: 'lotId',
        headerName: 'Lote',
        flex: 2,
        minWidth: 240,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
            {row.lotId}
          </Typography>
        ),
      },
      {
        field: 'quantity',
        headerName: 'Cantidad devuelta',
        type: 'number',
        flex: 1,
        minWidth: 150,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'costUsd',
        headerName: 'Costo USD',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
    ],
    []
  );

  const totalQty = (ret?.items ?? []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const totalCost = (ret?.items ?? []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.costUsd) || 0), 0);

  return (
    <Container maxWidth="xl">
      <PageHeader
        title={ret ? `Devolución ${ret.returnNumber}` : 'Devolución de consignación'}
        subtitle={ret ? new Date(ret.createdAt).toLocaleString('es-VE') : undefined}
        crumbs={[{ label: 'Consignaciones' }, { label: 'Devoluciones' }, { label: 'Detalle' }]}
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {ret && (
        <>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between">
              <Box>
                <Typography variant="caption" color="text.secondary">Proveedor</Typography>
                <Typography variant="body2">{supplierName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Sucursal</Typography>
                <Typography variant="body2">{branchName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Motivo</Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{ret.reason}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total devuelto</Typography>
                <Typography variant="h6">{totalQty} u · ${totalCost.toFixed(2)}</Typography>
              </Box>
            </Stack>
            {ret.notes && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                {ret.notes}
              </Typography>
            )}
          </Card>

          <Card>
            <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
              Ítems devueltos ({ret.items?.length ?? 0})
            </Typography>
            <Box sx={{ width: '100%' }}>
              <DataTable columns={itemColumns} rows={ret.items ?? []} disableRowSelectionOnClick autoHeight />
            </Box>
          </Card>
        </>
      )}
    </Container>
  );
}
