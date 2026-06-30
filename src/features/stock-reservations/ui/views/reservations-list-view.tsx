import type { ReservationStatus } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { PageHeader } from '@/shared/ui/page-header';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useBranchScope } from '@/features/branches/ui/branch-scope-context';
import { useProductOptions } from '@/features/products/api/products.options';

import { RESERVATION_STATUS_LABEL } from '../../model/types';
import { useReservationsQuery, useCancelReservationMutation } from '../../api/reservations.queries';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<ReservationStatus, 'success' | 'default' | 'warning' | 'error'> = {
  active: 'success',
  consumed: 'default',
  cancelled: 'error',
  expired: 'warning',
};

const qty = (v: number | string) => Number(v).toFixed(3).replace(/\.?0+$/, '');
const dt = (s: string | null) => (s ? new Date(s).toLocaleString('es-VE') : '—');

export function ReservationsListView() {
  const { selectedBranchId } = useBranchScope();
  const [status, setStatus] = useState<ReservationStatus | ''>('');

  const { data = [], isLoading, isError, error } = useReservationsQuery({
    branchId: selectedBranchId ?? undefined,
    status: status || undefined,
  });
  const cancelMutation = useCancelReservationMutation();

  const { data: branchOpts = [] } = useBranchOptions();
  const { data: productOpts = [] } = useProductOptions();
  const branchName = useMemo(
    () => new Map(branchOpts.map((b) => [b.id, b.label])),
    [branchOpts]
  );
  const productName = useMemo(
    () => new Map(productOpts.map((p) => [p.id, p.label])),
    [productOpts]
  );

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success('Reserva cancelada y stock liberado');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Reservas de stock"
        subtitle="Apartados de productos entre sucursales. El stock reservado queda fuera de la venta hasta consumirse, cancelarse o vencer (máx 24 h)."
        crumbs={[{ label: 'Inventario' }, { label: 'Reservas' }]}
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Estado"
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReservationStatus | '')}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(Object.keys(RESERVATION_STATUS_LABEL) as ReservationStatus[]).map((s) => (
              <MenuItem key={s} value={s}>
                {RESERVATION_STATUS_LABEL[s]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Card>

      <Card>
        {isError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {(error as Error)?.message ?? 'Error al cargar reservas'}
          </Alert>
        )}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Sucursal destino</TableCell>
                  <TableCell>Origen</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Vence</TableCell>
                  <TableCell>Creada</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                        Sin reservas para el filtro seleccionado.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{productName.get(r.productId) ?? r.productId.slice(0, 8)}</TableCell>
                      <TableCell>{branchName.get(r.branchId) ?? '—'}</TableCell>
                      <TableCell>{r.sourceBranchId ? branchName.get(r.sourceBranchId) ?? '—' : '—'}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{qty(r.quantity)}</TableCell>
                      <TableCell>
                        {r.customerName ?? '—'}
                        {r.customerDoc ? (
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                            {r.customerDoc}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="soft" color={STATUS_COLOR[r.status]} label={RESERVATION_STATUS_LABEL[r.status]} />
                      </TableCell>
                      <TableCell>{dt(r.expiresAt)}</TableCell>
                      <TableCell>{dt(r.createdAt)}</TableCell>
                      <TableCell align="right">
                        {r.status === 'active' && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleCancel(r.id)}
                            disabled={cancelMutation.isPending}
                          >
                            Liberar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Container>
  );
}
