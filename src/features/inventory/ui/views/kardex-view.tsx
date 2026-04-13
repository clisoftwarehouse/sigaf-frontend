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

import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { TableSkeleton } from '@/shared/ui/table-skeleton';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useProductsQuery } from '@/features/products/api/products.queries';

import { labelForMovement } from '../../model/constants';
import { useKardexQuery } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

const PAGE_SIZE = 20;

export function KardexView() {
  const [productId, setProductId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [movementType, setMovementType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
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
      movementType: movementType || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [productId, branchId, movementType, from, to, page]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useKardexQuery(filters);
  const entries = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  const resetPage = () => setPage(1);

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Kardex"
        subtitle="Histórico inmutable de todos los movimientos de inventario."
        crumbs={[{ label: 'Inventario' }, { label: 'Kardex' }]}
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
            sx={{ minWidth: 220 }}
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
            label="Tipo de movimiento"
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value);
              resetPage();
            }}
            placeholder="Ej. sale, adjustment_in"
            sx={{ minWidth: 200 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            type="date"
            label="Desde"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              resetPage();
            }}
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            label="Hasta"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              resetPage();
            }}
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
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
              {(error as Error)?.message ?? 'Error al consultar kardex'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Producto / Sucursal</TableCell>
                <TableCell>Movimiento</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Saldo</TableCell>
                <TableCell>Notas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={6} columns={6} />}

              {!isLoading && entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="bell"
                      title="Sin movimientos"
                      description="No hay movimientos que coincidan con los filtros."
                    />
                  </TableCell>
                </TableRow>
              )}

              {entries.map((k) => {
                const qty = Number(k.quantity) || 0;
                const balance = Number(k.balanceAfter) || 0;
                const isIn = qty >= 0;
                return (
                  <TableRow key={k.id} hover>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {new Date(k.createdAt).toLocaleString('es-VE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {productById.get(k.productId) ?? '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {branchById.get(k.branchId) ?? k.branchId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={labelForMovement(k.movementType)}
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontFamily: 'monospace',
                        color: isIn ? 'success.main' : 'error.main',
                        fontWeight: 600,
                      }}
                    >
                      {isIn ? '+' : ''}
                      {qty}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {balance}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', maxWidth: 240 }}>
                      <Typography variant="caption" noWrap>
                        {k.notes ?? '—'}
                      </Typography>
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
            {total > 0 ? `${total} movimientos · página ${page} de ${totalPages}` : ''}
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
