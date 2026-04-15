import type { GridColDef } from '@mui/x-data-grid';
import type { PurchaseOrder } from '../../model/types';

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

import { useOrdersQuery } from '../../api/purchases.queries';
import {
  ORDER_TYPE_OPTIONS,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

export function OrdersListView() {
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useOrdersQuery({
    page: 1,
    limit: 1000,
  });
  const orders = data?.data ?? [];

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

  const columns = useMemo<GridColDef<PurchaseOrder>[]>(
    () => [
      {
        field: 'createdAt',
        headerName: 'Fecha',
        type: 'dateTime',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string) => new Date(value),
      },
      {
        field: 'supplierId',
        headerName: 'Proveedor',
        flex: 2,
        minWidth: 220,
        filterOperators: supplierFilterOperators,
        valueFormatter: (value: string) => supplierNameById.get(value) ?? value,
        renderCell: ({ row }) => (
          <Typography variant="subtitle2">
            {supplierNameById.get(row.supplierId) ?? row.supplierId}
          </Typography>
        ),
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
        field: 'orderType',
        headerName: 'Tipo',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: ORDER_TYPE_OPTIONS,
      },
      {
        field: 'expectedDate',
        headerName: 'Esperada',
        type: 'date',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null) => (value ? new Date(value) : null),
      },
      {
        field: 'total',
        headerName: 'Total',
        type: 'number',
        flex: 1,
        minWidth: 130,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'status',
        headerName: 'Estado',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: ORDER_STATUS_OPTIONS,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={ORDER_STATUS_COLOR[row.status]}
            label={ORDER_STATUS_LABEL[row.status]}
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
              onClick={() => router.push(paths.dashboard.purchases.orders.detail(row.id))}
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
        title="Órdenes de compra"
        subtitle="Órdenes emitidas a proveedores. Se convierten en lotes al registrar la recepción."
        crumbs={[{ label: 'Compras' }, { label: 'Órdenes' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.purchases.orders.new)}
          >
            Nueva orden
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

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={orders}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
