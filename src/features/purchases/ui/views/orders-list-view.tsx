import type { OrderType, OrderStatus } from '../../model/types';

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
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { TableSkeleton } from '@/shared/ui/table-skeleton';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';

import { useOrdersQuery } from '../../api/purchases.queries';
import {
  ORDER_TYPE_OPTIONS,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

const PAGE_SIZE = 20;

export function OrdersListView() {
  const router = useRouter();
  const [branchId, setBranchId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [orderType, setOrderType] = useState<OrderType | ''>('');
  const [page, setPage] = useState(1);

  const { data: branches = [] } = useBranchesQuery();
  const branchById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name] as const)),
    [branches]
  );
  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true });
  const supplierById = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s.businessName] as const)),
    [suppliers]
  );

  const filters = useMemo(
    () => ({
      branchId: branchId || undefined,
      supplierId: supplierId || undefined,
      status: (status || undefined) as OrderStatus | undefined,
      orderType: (orderType || undefined) as OrderType | undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [branchId, supplierId, status, orderType, page]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useOrdersQuery(filters);
  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  const resetPage = () => setPage(1);

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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, flexWrap: 'wrap' }}
        >
          <TextField
            select
            label="Sucursal"
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              resetPage();
            }}
            sx={{ minWidth: 220 }}
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
            label="Proveedor"
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              resetPage();
            }}
            sx={{ minWidth: 260 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {suppliers.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.businessName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | '');
              resetPage();
            }}
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {ORDER_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Tipo"
            value={orderType}
            onChange={(e) => {
              setOrderType(e.target.value as OrderType | '');
              resetPage();
            }}
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {ORDER_TYPE_OPTIONS.map((o) => (
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
              {(error as Error)?.message ?? 'Error al cargar'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Esperada</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={5} columns={8} />}

              {!isLoading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="inbox"
                      title="Sin órdenes de compra"
                      description="No hay órdenes registradas con esos filtros."
                    />
                  </TableCell>
                </TableRow>
              )}

              {orders.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {new Date(o.createdAt).toLocaleDateString('es-VE')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {supplierById.get(o.supplierId) ?? o.supplierId}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {branchById.get(o.branchId) ?? o.branchId}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{o.orderType}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{o.expectedDate ?? '—'}</TableCell>
                  <TableCell align="right">
                    ${(Number(o.total) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={ORDER_STATUS_COLOR[o.status]}
                      label={ORDER_STATUS_LABEL[o.status]}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() =>
                        router.push(paths.dashboard.purchases.orders.detail(o.id))
                      }
                    >
                      <Iconify icon="solar:eye-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
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
            {total > 0 ? `${total} órdenes · página ${page} de ${totalPages}` : ''}
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
