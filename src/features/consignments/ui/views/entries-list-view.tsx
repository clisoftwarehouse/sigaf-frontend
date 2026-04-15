import type { GridColDef } from '@mui/x-data-grid';
import type { ConsignmentEntry } from '../../model/types';

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

import { useEntriesQuery } from '../../api/consignments.queries';
import { CONSIGNMENT_STATUS_COLOR, CONSIGNMENT_STATUS_OPTIONS } from '../../model/constants';

// ----------------------------------------------------------------------

export function EntriesListView() {
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useEntriesQuery({
    page: 1,
    limit: 1000,
  });
  const entries = data?.data ?? [];

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

  const columns = useMemo<GridColDef<ConsignmentEntry>[]>(
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
        field: 'commissionPct',
        headerName: 'Comisión',
        type: 'number',
        flex: 1,
        minWidth: 120,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `${value.toFixed(2)}%`,
      },
      {
        field: 'status',
        headerName: 'Estado',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: CONSIGNMENT_STATUS_OPTIONS,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={CONSIGNMENT_STATUS_COLOR[row.status]}
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
              onClick={() => router.push(paths.dashboard.consignments.entries.detail(row.id))}
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
        title="Entradas de consignación"
        subtitle="Mercancía recibida en consignación que aún no se ha pagado al proveedor."
        crumbs={[{ label: 'Consignaciones' }, { label: 'Entradas' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.consignments.entries.new)}
          >
            Nueva entrada
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
              {(error as Error)?.message ?? 'Error al cargar entradas'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={entries}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
