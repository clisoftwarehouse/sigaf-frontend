import type { GridColDef } from '@mui/x-data-grid';
import type { ConsignmentLiquidation } from '../../model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useLiquidationsQuery } from '../../api/consignments.queries';
import { LIQUIDATION_STATUS_COLOR, LIQUIDATION_STATUS_OPTIONS } from '../../model/constants';

// ----------------------------------------------------------------------

export function LiquidationsListView() {
  const router = useRouter();

  const {
    data: liquidations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useLiquidationsQuery({});

  const { data: branchOpts = [] } = useBranchOptions();
  const { data: supplierOpts = [] } = useSupplierOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );
  const supplierNameById = useMemo(
    () => new Map(supplierOpts.map((o) => [o.id, o.label] as const)),
    [supplierOpts]
  );

  const branchFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useBranchOptions }),
    []
  );
  const supplierFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useSupplierOptions }),
    []
  );

  const columns = useMemo<GridColDef<ConsignmentLiquidation>[]>(
    () => [
      {
        field: 'periodStart',
        headerName: 'Periodo',
        flex: 1.5,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Typography variant="body2">
            {row.periodStart} → {row.periodEnd}
          </Typography>
        ),
      },
      {
        field: 'supplierId',
        headerName: 'Proveedor',
        flex: 2,
        minWidth: 220,
        filterOperators: supplierFilterOperators,
        valueFormatter: (value: string) => supplierNameById.get(value) ?? value,
        sortComparator: (a, b) =>
          (supplierNameById.get(a) ?? '').localeCompare(supplierNameById.get(b) ?? ''),
      },
      {
        field: 'branchId',
        headerName: 'Sucursal',
        flex: 1.5,
        minWidth: 180,
        filterOperators: branchFilterOperators,
        valueFormatter: (value: string) => branchNameById.get(value) ?? value,
        sortComparator: (a, b) =>
          (branchNameById.get(a) ?? '').localeCompare(branchNameById.get(b) ?? ''),
      },
      {
        field: 'totalSales',
        headerName: 'Ventas',
        type: 'number',
        flex: 1,
        minWidth: 130,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'totalCommission',
        headerName: 'Comisión',
        type: 'number',
        flex: 1,
        minWidth: 130,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
        cellClassName: 'liquidation-commission-cell',
      },
      {
        field: 'totalSupplier',
        headerName: 'A pagar',
        type: 'number',
        flex: 1,
        minWidth: 130,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
        cellClassName: 'liquidation-supplier-cell',
      },
      {
        field: 'status',
        headerName: 'Estado',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: LIQUIDATION_STATUS_OPTIONS,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={LIQUIDATION_STATUS_COLOR[row.status]}
            label={row.status}
            sx={{ textTransform: 'capitalize' }}
          />
        ),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Tooltip title="Ver">
            <IconButton
              onClick={() => router.push(paths.dashboard.consignments.liquidations.detail(row.id))}
            >
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [router, branchFilterOperators, supplierFilterOperators, branchNameById, supplierNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Liquidaciones de consignación"
        subtitle="Cierres periódicos que calculan comisiones y monto a pagar al proveedor."
        crumbs={[{ label: 'Consignaciones' }, { label: 'Liquidaciones' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.consignments.liquidations.new)}
          >
            Nueva liquidación
          </Button>
        }
      />

      <Card>
        {isError && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Reintentar
                </Button>
              }
            >
              {(error as Error)?.message ?? 'Error al cargar'}
            </Alert>
          </Box>
        )}

        <Box
          sx={{
            width: '100%',
            '& .liquidation-commission-cell': { color: 'success.main' },
            '& .liquidation-supplier-cell': { fontWeight: 600 },
          }}
        >
          <DataTable
            columns={columns}
            rows={liquidations}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
