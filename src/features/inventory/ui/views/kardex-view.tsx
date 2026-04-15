import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { PageHeader } from '@/shared/ui/page-header';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { labelForMovement } from '../../model/constants';
import { useKardexQuery } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

type KardexRow = {
  id: string;
  productId: string;
  branchId: string;
  movementType: string;
  quantity: number | string;
  balanceAfter: number | string;
  notes: string | null;
  createdAt: string;
};

export function KardexView() {
  const { data, isLoading, isError, error, refetch } = useKardexQuery({
    page: 1,
    limit: 1000,
  });
  const entries = (data?.data ?? []) as KardexRow[];

  const { data: branchOpts = [] } = useBranchOptions();
  const { data: productOpts = [] } = useProductOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );
  const productNameById = useMemo(
    () => new Map(productOpts.map((o) => [o.id, o.label] as const)),
    [productOpts]
  );

  const branchFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useBranchOptions }),
    []
  );
  const productFilterOperators = useMemo(
    () => createFkFilterOperators<string>({ useOptions: useProductOptions }),
    []
  );

  const columns = useMemo<GridColDef<KardexRow>[]>(
    () => [
      {
        field: 'createdAt',
        headerName: 'Fecha',
        type: 'dateTime',
        flex: 1,
        minWidth: 180,
        valueGetter: (value: string) => new Date(value),
      },
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2,
        minWidth: 220,
        filterOperators: productFilterOperators,
        valueFormatter: (value: string) => productNameById.get(value) ?? '—',
        sortComparator: (a, b) =>
          (productNameById.get(a) ?? '').localeCompare(productNameById.get(b) ?? ''),
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
        field: 'movementType',
        headerName: 'Movimiento',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Chip size="small" variant="outlined" label={labelForMovement(row.movementType)} />
        ),
        valueFormatter: (value: string) => labelForMovement(value),
      },
      {
        field: 'quantity',
        headerName: 'Cantidad',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueGetter: (value: number | string) => Number(value) || 0,
        renderCell: ({ value }) => {
          const qty = value as number;
          const isIn = qty >= 0;
          return (
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                color: isIn ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {isIn ? '+' : ''}
              {qty}
            </Typography>
          );
        },
      },
      {
        field: 'balanceAfter',
        headerName: 'Saldo',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'notes',
        headerName: 'Notas',
        flex: 2,
        minWidth: 220,
        valueGetter: (value: string | null) => value ?? '—',
      },
    ],
    [branchFilterOperators, productFilterOperators, branchNameById, productNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Kardex"
        subtitle="Histórico inmutable de todos los movimientos de inventario."
        crumbs={[{ label: 'Inventario' }, { label: 'Kardex' }]}
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
              {(error as Error)?.message ?? 'Error al consultar kardex'}
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
