import type { LiquidationStatus } from '../../model/types';

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

import { useLiquidationsQuery } from '../../api/consignments.queries';
import {
  LIQUIDATION_STATUS_COLOR,
  LIQUIDATION_STATUS_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

export function LiquidationsListView() {
  const router = useRouter();
  const [branchId, setBranchId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState<LiquidationStatus | ''>('');

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

  const params = useMemo(
    () => ({
      branchId: branchId || undefined,
      supplierId: supplierId || undefined,
      status: status || undefined,
    }),
    [branchId, supplierId, status]
  );

  const {
    data: liquidations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useLiquidationsQuery(params);

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Liquidaciones de consignación"
        subtitle="Cierres periódicos que calculan comisiones y monto a pagar al proveedor."
        crumbs={[{ label: 'Consignaciones' }, { label: 'Liquidaciones' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.consignments.liquidations.new)}
          >
            Nueva liquidación
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
            onChange={(e) => setBranchId(e.target.value)}
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
            onChange={(e) => setSupplierId(e.target.value)}
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
            onChange={(e) => setStatus(e.target.value as LiquidationStatus | '')}
            sx={{ minWidth: 180 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {LIQUIDATION_STATUS_OPTIONS.map((o) => (
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
                <TableCell>Periodo</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell align="right">Ventas</TableCell>
                <TableCell align="right">Comisión</TableCell>
                <TableCell align="right">A pagar</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={5} columns={8} />}

              {!isLoading && liquidations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState
                      icon="inbox"
                      title="Sin liquidaciones"
                      description="Genera una liquidación para cerrar el periodo con el proveedor."
                    />
                  </TableCell>
                </TableRow>
              )}

              {liquidations.map((l) => {
                const sales = Number(l.totalSales) || 0;
                const commission = Number(l.totalCommission) || 0;
                const supplier = Number(l.totalSupplier) || 0;
                return (
                  <TableRow key={l.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {l.periodStart} → {l.periodEnd}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {supplierById.get(l.supplierId) ?? l.supplierId}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {branchById.get(l.branchId) ?? l.branchId}
                    </TableCell>
                    <TableCell align="right">${sales.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>
                      ${commission.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ${supplier.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={LIQUIDATION_STATUS_COLOR[l.status]}
                        label={l.status}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() =>
                          router.push(paths.dashboard.consignments.liquidations.detail(l.id))
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
      </Card>
    </Container>
  );
}
