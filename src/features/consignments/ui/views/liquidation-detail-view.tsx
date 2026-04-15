import type { GridColDef } from '@mui/x-data-grid';
import type { ConsignmentLiquidationItem } from '../../model/types';

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

import { LIQUIDATION_STATUS_COLOR } from '../../model/constants';
import {
  useLiquidationQuery,
  useApproveLiquidationMutation,
} from '../../api/consignments.queries';

// ----------------------------------------------------------------------

export function LiquidationDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: liquidation, isLoading, isError, error } = useLiquidationQuery(id);
  const approveMutation = useApproveLiquidationMutation();

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Liquidación aprobada');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const isDraft = liquidation?.status === 'draft';

  const itemColumns = useMemo<GridColDef<ConsignmentLiquidationItem>[]>(
    () => [
      {
        field: 'consignmentItemId',
        headerName: 'Ítem ID',
        flex: 2,
        minWidth: 180,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.consignmentItemId.slice(0, 8)}
          </Typography>
        ),
      },
      {
        field: 'quantitySold',
        headerName: 'Cantidad vendida',
        type: 'number',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'totalSales',
        headerName: 'Ventas',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'commissionAmount',
        headerName: 'Comisión',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
        cellClassName: 'commission-cell',
      },
      {
        field: 'supplierAmount',
        headerName: 'Proveedor',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
        cellClassName: 'supplier-cell',
      },
    ],
    []
  );

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Liquidación"
        subtitle={
          liquidation ? `${liquidation.periodStart} → ${liquidation.periodEnd}` : undefined
        }
        crumbs={[
          { label: 'Consignaciones' },
          { label: 'Liquidaciones' },
          { label: 'Detalle' },
        ]}
        action={
          isDraft && (
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

      {liquidation && (
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
                    color={LIQUIDATION_STATUS_COLOR[liquidation.status]}
                    label={liquidation.status}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Ventas totales
                </Typography>
                <Typography variant="h5">
                  ${(Number(liquidation.totalSales) || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Comisión
                </Typography>
                <Typography variant="h5" sx={{ color: 'success.main' }}>
                  ${(Number(liquidation.totalCommission) || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  A pagar al proveedor
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${(Number(liquidation.totalSupplier) || 0).toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </Card>

          <Card>
            <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
              Detalle por ítem ({liquidation.items?.length ?? 0})
            </Typography>
            <Box
              sx={{
                width: '100%',
                '& .commission-cell': { color: 'success.main' },
                '& .supplier-cell': { fontWeight: 600 },
              }}
            >
              <DataTable
                columns={itemColumns}
                rows={liquidation.items ?? []}
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
