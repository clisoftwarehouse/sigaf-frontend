import type { ConsignmentStatus } from '../../model/types';

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

import { useEntriesQuery } from '../../api/consignments.queries';
import {
  CONSIGNMENT_STATUS_COLOR,
  CONSIGNMENT_STATUS_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

const PAGE_SIZE = 20;

export function EntriesListView() {
  const router = useRouter();
  const [branchId, setBranchId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState<ConsignmentStatus | ''>('');
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
      status: (status || undefined) as ConsignmentStatus | undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [branchId, supplierId, status, page]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useEntriesQuery(filters);
  const entries = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  const resetPage = () => setPage(1);

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
              setStatus(e.target.value as ConsignmentStatus | '');
              resetPage();
            }}
            sx={{ minWidth: 180 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {CONSIGNMENT_STATUS_OPTIONS.map((o) => (
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
              {(error as Error)?.message ?? 'Error al cargar entradas'}
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
                <TableCell align="right">Comisión</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={5} columns={6} />}

              {!isLoading && entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="inbox"
                      title="Sin entradas de consignación"
                      description="Registra la primera entrada para empezar a gestionar consignaciones."
                    />
                  </TableCell>
                </TableRow>
              )}

              {entries.map((e) => {
                const pct = Number(e.commissionPct) || 0;
                return (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {new Date(e.createdAt).toLocaleDateString('es-VE')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {supplierById.get(e.supplierId) ?? e.supplierId}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {branchById.get(e.branchId) ?? e.branchId}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {pct.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={CONSIGNMENT_STATUS_COLOR[e.status]}
                        label={e.status}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() =>
                          router.push(paths.dashboard.consignments.entries.detail(e.id))
                        }
                      >
                        <Iconify icon="solar:eye-bold" />
                      </IconButton>
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
            {total > 0 ? `${total} entradas · página ${page} de ${totalPages}` : ''}
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
