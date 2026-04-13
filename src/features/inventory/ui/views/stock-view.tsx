import type { StockStatus } from '../../model/types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { TableSkeleton } from '@/shared/ui/table-skeleton';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useProductsQuery } from '@/features/products/api/products.queries';

import { useStockQuery } from '../../api/inventory.queries';
import { STOCK_STATUS_OPTIONS } from '../../model/constants';

// ----------------------------------------------------------------------

const PAGE_SIZE = 20;

export function StockView() {
  const router = useRouter();
  const [productId, setProductId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data: productsData } = useProductsQuery({ limit: 200 });
  const products = useMemo(() => productsData?.data ?? [], [productsData]);
  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p.shortName ?? p.description] as const)),
    [products]
  );

  const { data: branches = [] } = useBranchesQuery();
  const branchById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name] as const)),
    [branches]
  );

  const filters = useMemo(
    () => ({
      productId: productId || undefined,
      branchId: branchId || undefined,
      stockStatus: (stockStatus || undefined) as StockStatus | undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [productId, branchId, stockStatus, page]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useStockQuery(filters);
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  const resetPage = () => setPage(1);

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Stock agregado"
        subtitle="Totales por producto y sucursal sumando todos los lotes disponibles."
        crumbs={[{ label: 'Inventario' }, { label: 'Stock' }]}
      />

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, flexWrap: 'wrap' }}
        >
          <TextField
            select
            label="Producto"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              resetPage();
            }}
            sx={{ minWidth: 240 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.shortName ?? p.description}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Sucursal"
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              resetPage();
            }}
            sx={{ minWidth: 200 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todas</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Estado de stock"
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value as StockStatus | '');
              resetPage();
            }}
            sx={{ minWidth: 180 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {STOCK_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell align="right">Cantidad total</TableCell>
                <TableCell align="right">Lotes</TableCell>
                <TableCell>Vence primero</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={6} columns={5} />}

              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="box"
                      title="Sin datos de stock"
                      description="No hay combinaciones producto × sucursal que coincidan."
                    />
                  </TableCell>
                </TableRow>
              )}

              {rows.map((row) => {
                const qty = Number(row.totalQuantity) || 0;
                const isOut = qty === 0;
                const isLow = qty > 0 && qty <= 10;
                return (
                  <TableRow
                    key={`${row.productId}-${row.branchId}`}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(paths.dashboard.inventory.productDetail(row.productId))}
                  >
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                        {productById.get(row.productId) ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {branchById.get(row.branchId) ?? row.branchId}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        <Typography variant="subtitle2">{qty}</Typography>
                        {isOut && <Chip size="small" color="error" label="Agotado" />}
                        {isLow && <Chip size="small" color="warning" label="Bajo" />}
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      {row.lotCount}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {row.nearestExpiration
                        ? new Date(row.nearestExpiration).toISOString().slice(0, 10)
                        : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {total > 0 ? `${total} combinaciones · página ${page} de ${totalPages}` : ''}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </Stack>
        </Box>
      </Card>
    </Container>
  );
}
