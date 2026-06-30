import type { CxpStatus, CxpFilters, AgingBucket } from '../../model/types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from '@/app/components/iconify';
import { useBranchScope } from '@/features/branches/ui/branch-scope-context';

import { AgingChip } from '../components/aging-chip';
import { StatusChip } from '../components/status-chip';
import { fmtUsd, fmtDate } from '../components/format';
import { CxpDetailDrawer } from '../components/cxp-detail-drawer';
import { useCxpList, useAgingSummary } from '../../api/accounts-payable.queries';

const AGING_BUCKETS: Array<{ value: AgingBucket; label: string; color: string }> = [
  { value: 'current', label: 'Al día', color: 'success.main' },
  { value: 'overdue_1_30', label: '1–30 días', color: 'info.main' },
  { value: 'overdue_31_60', label: '31–60 días', color: 'warning.main' },
  { value: 'overdue_61_90', label: '61–90 días', color: 'error.main' },
  { value: 'overdue_90_plus', label: '90+ días', color: 'error.dark' },
];

const STATUSES: Array<{ value: CxpStatus | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'open', label: 'Abiertas' },
  { value: 'partial', label: 'Pagadas parcial' },
  { value: 'paid', label: 'Pagadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

export function AccountsPayableListView() {
  const { selectedBranchId } = useBranchScope();
  const [filters, setFilters] = useState<CxpFilters>({ page: 1, limit: 25 });
  const [selectedCxp, setSelectedCxp] = useState<string | null>(null);

  const { data: aging } = useAgingSummary(selectedBranchId ?? filters.branchId);
  const { data, isLoading, isError } = useCxpList({ ...filters, branchId: selectedBranchId ?? filters.branchId });

  const setBucketFilter = (bucket?: AgingBucket) => {
    setFilters((p) => ({ ...p, agingBucket: bucket, page: 1 }));
  };

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Total abierto
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {fmtUsd(aging?.totalOpenUsd ?? 0)}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {aging?.totalOpenCount ?? 0} cuentas
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Total vencido
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.dark' }}>
              {fmtUsd(aging?.totalOverdueUsd ?? 0)}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {aging?.totalOverdueCount ?? 0} cuentas vencidas
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {AGING_BUCKETS.map((b) => {
            const count = aging?.buckets[b.value].count ?? 0;
            const total = aging?.buckets[b.value].totalUsd ?? 0;
            const active = filters.agingBucket === b.value;
            return (
              <Box
                key={b.value}
                onClick={() => setBucketFilter(active ? undefined : b.value)}
                sx={{
                  flex: 1,
                  minWidth: 160,
                  cursor: 'pointer',
                  p: 1.5,
                  borderRadius: 1,
                  border: 2,
                  borderColor: active ? b.color : 'divider',
                  bgcolor: active ? `${b.color}11` : 'transparent',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: b.color },
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {b.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {count}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {fmtUsd(total)}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Card>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            select
            size="small"
            label="Estado"
            value={filters.status ?? ''}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: (e.target.value || undefined) as CxpStatus, page: 1 }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          >
            {STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
          {filters.agingBucket && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Filtro de vencimiento activo
              </Typography>
              <Box>
                <AgingChip bucket={filters.agingBucket} />{' '}
                <IconButton size="small" onClick={() => setBucketFilter(undefined)} title="Quitar filtro">
                  <Iconify icon="solar:close-circle-bold" width={16} />
                </IconButton>
              </Box>
            </Box>
          )}
          <Box sx={{ flex: 1 }} />
          {data && (
            <Typography variant="caption" color="text.disabled">
              {data.pagination.total.toLocaleString('es-VE')} cuentas
            </Typography>
          )}
        </Stack>
      </Card>

      {isLoading && <LinearProgress />}
      {isError && <Alert severity="error">No se pudo cargar la lista</Alert>}

      {data && data.data.length === 0 && !isLoading && (
        <Alert severity="info">No hay cuentas que coincidan con los filtros.</Alert>
      )}

      {data && data.data.length > 0 && (
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Proveedor</TableCell>
                  <TableCell>Factura</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Vence</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                  <TableCell align="center">Vencimiento</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center" sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((cxp) => (
                  <TableRow
                    key={cxp.id}
                    hover
                    onClick={() => setSelectedCxp(cxp.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" noWrap title={cxp.supplier?.name ?? cxp.supplierId}>
                        {cxp.supplier?.name ?? cxp.supplierId}
                      </Typography>
                      {cxp.branch && (
                        <Typography variant="caption" color="text.disabled">
                          {cxp.branch.name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {cxp.invoiceNumber ?? '—'}
                    </TableCell>
                    <TableCell>{fmtDate(cxp.invoiceDate)}</TableCell>
                    <TableCell>{fmtDate(cxp.dueDate)}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {fmtUsd(cxp.originalAmountUsd)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'error.dark' }}
                    >
                      {fmtUsd(cxp.balanceUsd)}
                    </TableCell>
                    <TableCell align="center">
                      <AgingChip bucket={cxp.agingBucket} days={cxp.daysOverdue} />
                    </TableCell>
                    <TableCell align="center">
                      <StatusChip status={cxp.status} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small">
                        <Iconify icon="solar:eye-bold" width={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {data.pagination.totalPages > 1 && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
            >
              <Typography variant="caption" color="text.secondary">
                Página {data.pagination.page} de {data.pagination.totalPages}
              </Typography>
              <Pagination
                count={data.pagination.totalPages}
                page={data.pagination.page}
                onChange={(_, p) => setFilters((prev) => ({ ...prev, page: p }))}
                shape="rounded"
                size="small"
              />
            </Stack>
          )}
        </Card>
      )}

      <CxpDetailDrawer cxpId={selectedCxp} onClose={() => setSelectedCxp(null)} />
    </>
  );
}
