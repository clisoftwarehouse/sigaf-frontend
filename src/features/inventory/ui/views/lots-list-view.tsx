import type { LotStatus, InventoryLot, ExpirySignal } from '../../model/types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
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
import { useProductsQuery } from '@/features/products/api/products.queries';

import { useLotsQuery } from '../../api/inventory.queries';
import { AdjustmentDialog } from '../components/adjustment-dialog';
import { QuarantineDialog } from '../components/quarantine-dialog';
import { ExpirySignalChip } from '../components/expiry-signal-chip';
import {
  LOT_STATUS_LABEL,
  LOT_STATUS_OPTIONS,
  EXPIRY_SIGNAL_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

const PAGE_SIZE = 20;

export function LotsListView() {
  const router = useRouter();
  const [productId, setProductId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState<LotStatus | ''>('');
  const [expirySignal, setExpirySignal] = useState<ExpirySignal | ''>('');
  const [page, setPage] = useState(1);
  const [quarantineLot, setQuarantineLot] = useState<InventoryLot | null>(null);
  const [adjustmentLot, setAdjustmentLot] = useState<InventoryLot | null>(null);

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
      status: (status || undefined) as LotStatus | undefined,
      expirySignal: (expirySignal || undefined) as ExpirySignal | undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [productId, branchId, status, expirySignal, page]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useLotsQuery(filters);
  const lots = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  const resetPage = () => setPage(1);

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Lotes de inventario"
        subtitle="Cada lote tiene su propio vencimiento, costo y cantidad disponible."
        crumbs={[{ label: 'Inventario' }, { label: 'Lotes' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.inventory.lots.new)}
          >
            Nuevo lote
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
            select
            label="Estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as LotStatus | '');
              resetPage();
            }}
            sx={{ minWidth: 160 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {LOT_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Vencimiento"
            value={expirySignal}
            onChange={(e) => {
              setExpirySignal(e.target.value as ExpirySignal | '');
              resetPage();
            }}
            sx={{ minWidth: 180 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {EXPIRY_SIGNAL_OPTIONS.map((o) => (
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
              {(error as Error)?.message ?? 'Error al cargar lotes'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Lote</TableCell>
                <TableCell>Producto / Sucursal</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell align="right">Disponible</TableCell>
                <TableCell align="right">Precio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={6} columns={7} />}

              {!isLoading && lots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="box"
                      title="Sin lotes"
                      description="No hay lotes de inventario con esos filtros."
                    />
                  </TableCell>
                </TableRow>
              )}

              {lots.map((lot) => {
                const available = Number(lot.quantityAvailable) || 0;
                const price = Number(lot.salePrice) || 0;

                return (
                  <TableRow key={lot.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                        {lot.lotNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() =>
                          router.push(paths.dashboard.inventory.productDetail(lot.productId))
                        }
                      >
                        {productById.get(lot.productId) ?? '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {branchById.get(lot.branchId) ?? lot.branchId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">{lot.expirationDate}</Typography>
                        <ExpirySignalChip signal={lot.expirySignal} />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{available}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      ${price.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {LOT_STATUS_LABEL[lot.status] ?? lot.status}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => router.push(paths.dashboard.inventory.lots.edit(lot.id))}
                        >
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Nuevo ajuste">
                        <IconButton onClick={() => setAdjustmentLot(lot)}>
                          <Iconify icon="solar:eraser-bold" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          lot.status === 'quarantine'
                            ? 'Liberar de cuarentena'
                            : 'Enviar a cuarentena'
                        }
                      >
                        <IconButton
                          color={lot.status === 'quarantine' ? 'primary' : 'warning'}
                          onClick={() => setQuarantineLot(lot)}
                        >
                          <Iconify icon="solar:danger-triangle-bold" />
                        </IconButton>
                      </Tooltip>
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
            {total > 0 ? `${total} lotes · página ${page} de ${totalPages}` : ''}
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

      <QuarantineDialog lot={quarantineLot} onClose={() => setQuarantineLot(null)} />
      <AdjustmentDialog lot={adjustmentLot} onClose={() => setAdjustmentLot(null)} />
    </Container>
  );
}
