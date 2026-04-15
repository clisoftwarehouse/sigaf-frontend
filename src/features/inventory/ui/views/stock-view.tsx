import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { PageHeader } from '@/shared/ui/page-header';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { DataTable, createFkFilterOperators } from '@/app/components/data-table';

import { useStockQuery } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

type StockRow = {
  productId: string;
  branchId: string;
  totalQuantity: number | string;
  lotCount: number;
  nearestExpiration: string | null;
};

export function StockView() {
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useStockQuery({
    page: 1,
    limit: 1000,
  });
  const rows = (data?.data ?? []) as StockRow[];

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

  const rowsWithId = useMemo(
    () => rows.map((r) => ({ ...r, id: `${r.productId}-${r.branchId}` })),
    [rows]
  );

  const columns = useMemo<GridColDef<StockRow & { id: string }>[]>(
    () => [
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2,
        minWidth: 240,
        filterOperators: productFilterOperators,
        valueFormatter: (value: string) => productNameById.get(value) ?? '—',
        renderCell: ({ row }) => (
          <Typography
            variant="subtitle2"
            sx={{ color: 'primary.main', cursor: 'pointer' }}
            onClick={() => router.push(paths.dashboard.inventory.productDetail(row.productId))}
          >
            {productNameById.get(row.productId) ?? '—'}
          </Typography>
        ),
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
        field: 'totalQuantity',
        headerName: 'Cantidad total',
        type: 'number',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: number | string) => Number(value) || 0,
        renderCell: ({ value }) => {
          const qty = value as number;
          const isOut = qty === 0;
          const isLow = qty > 0 && qty <= 10;
          return (
            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="subtitle2">{qty}</Typography>
              {isOut && <Chip size="small" color="error" label="Agotado" />}
              {isLow && <Chip size="small" color="warning" label="Bajo" />}
            </Stack>
          );
        },
      },
      {
        field: 'lotCount',
        headerName: 'Lotes',
        type: 'number',
        flex: 1,
        minWidth: 100,
      },
      {
        field: 'nearestExpiration',
        headerName: 'Vence primero',
        type: 'date',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string | null) => (value ? new Date(value) : null),
      },
    ],
    [router, branchFilterOperators, productFilterOperators, branchNameById, productNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Stock agregado"
        subtitle="Totales por producto y sucursal sumando todos los lotes disponibles."
        crumbs={[{ label: 'Inventario' }, { label: 'Stock' }]}
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
              {(error as Error)?.message ?? 'Error al cargar stock'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={rowsWithId}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
