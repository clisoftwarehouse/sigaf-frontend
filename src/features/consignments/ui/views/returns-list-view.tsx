import type { GridColDef } from '@mui/x-data-grid';
import type { ConsignmentReturn } from '../../model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useReturnsQuery } from '../../api/consignments.queries';

// ----------------------------------------------------------------------

export function ReturnsListView() {
  const router = useRouter();

  const { data: returns = [], isLoading, isError, error, refetch } = useReturnsQuery({});

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

  const columns = useMemo<GridColDef<ConsignmentReturn>[]>(
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
        field: 'reason',
        headerName: 'Motivo',
        flex: 1.5,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
            {row.reason}
          </Typography>
        ),
      },
      {
        field: 'notes',
        headerName: 'Notas',
        flex: 2,
        minWidth: 240,
        valueGetter: (value: string | null) => value ?? '—',
      },
    ],
    [branchFilterOperators, supplierFilterOperators, branchNameById, supplierNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Devoluciones de consignación"
        subtitle="Mercancía consignada devuelta al proveedor por vencimiento, daño u otros motivos."
        crumbs={[{ label: 'Consignaciones' }, { label: 'Devoluciones' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.consignments.returns.new)}
          >
            Nueva devolución
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
            rows={returns}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
