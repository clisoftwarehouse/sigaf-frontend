import type { ReceiveTransferItem } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { PageHeader } from '@/shared/ui/page-header';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { useWarehouseOptions } from '@/features/warehouses/api/warehouses.options';

import { TypeChip, StatusChip } from '../components/transfer-chips';
import {
  useTransferQuery,
  useCancelTransferMutation,
  useReceiveTransferMutation,
  useDispatchTransferMutation,
} from '../../api/inventory-transfers.queries';

// ----------------------------------------------------------------------

function formatQty(n: number | null | undefined): string {
  if (n == null) return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return num.toFixed(3).replace(/\.?0+$/, '');
}

export function TransferDetailView() {
  const { id } = useParams<{ id: string }>();

  const { data: transfer, isLoading, isError, error } = useTransferQuery(id);
  const dispatchMutation = useDispatchTransferMutation();
  const receiveMutation = useReceiveTransferMutation();
  const cancelMutation = useCancelTransferMutation();

  const { data: branchOpts = [] } = useBranchOptions();
  const { data: whOpts = [] } = useWarehouseOptions();
  const { data: productOpts = [] } = useProductOptions();
  const branchById = useMemo(() => new Map(branchOpts.map((o) => [o.id, o.label] as const)), [branchOpts]);
  const whById = useMemo(() => new Map(whOpts.map((o) => [o.id, o.label] as const)), [whOpts]);
  const productNameById = useMemo(
    () => new Map((productOpts ?? []).map((p) => [p.id, p.label] as const)),
    [productOpts]
  );

  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receiveItems, setReceiveItems] = useState<ReceiveTransferItem[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !transfer) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">{(error as Error)?.message ?? 'Transferencia no encontrada'}</Alert>
      </Container>
    );
  }

  const canDispatch = transfer.transferType === 'inter_branch' && transfer.status === 'draft';
  const canReceive = transfer.transferType === 'inter_branch' && transfer.status === 'in_transit';
  const canCancel =
    transfer.transferType === 'inter_branch' && ['draft', 'in_transit'].includes(transfer.status);

  const openReceiveDialog = () => {
    setReceiveItems(
      (transfer.items ?? []).map((it) => ({
        itemId: it.id,
        quantityReceived: Number(it.quantitySent),
      }))
    );
    setReceiveDialogOpen(true);
  };

  const handleDispatch = async () => {
    try {
      await dispatchMutation.mutateAsync(transfer.id);
      toast.success('Transferencia despachada');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleReceive = async () => {
    try {
      await receiveMutation.mutateAsync({
        id: transfer.id,
        payload: { items: receiveItems },
      });
      toast.success('Transferencia recibida');
      setReceiveDialogOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({
        id: transfer.id,
        payload: { reason: cancelReason || undefined },
      });
      toast.success('Transferencia cancelada');
      setCancelDialogOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const renderLoc = (locId: string | null, branchId: string) => {
    const branch = branchById.get(branchId) ?? branchId;
    if (locId) return `${branch} · ${whById.get(locId) ?? locId}`;
    return branch;
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={transfer.transferNumber}
        crumbs={[
          { label: 'Inventario' },
          { label: 'Transferencias', href: paths.dashboard.inventory.transfers.root },
          { label: transfer.transferNumber },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            {canDispatch && (
              <Button
                variant="contained"
                color="info"
                onClick={handleDispatch}
                loading={dispatchMutation.isPending}
              >
                Despachar
              </Button>
            )}
            {canReceive && (
              <Button
                variant="contained"
                color="success"
                onClick={openReceiveDialog}
                loading={receiveMutation.isPending}
              >
                Recibir
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setCancelDialogOpen(true)}
                loading={cancelMutation.isPending}
              >
                Cancelar
              </Button>
            )}
          </Stack>
        }
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Tipo
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <TypeChip type={transfer.transferType} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Estado
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <StatusChip status={transfer.status} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Origen
            </Typography>
            <Typography variant="body1">
              {renderLoc(transfer.fromLocationId, transfer.fromBranchId)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Destino
            </Typography>
            <Typography variant="body1">
              {renderLoc(transfer.toLocationId, transfer.toBranchId)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Fecha
            </Typography>
            <Typography variant="body1">{transfer.transferDate.slice(0, 10)}</Typography>
          </Grid>
          {transfer.sourceReceiptId && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Origen recepción
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {transfer.sourceReceiptId}
              </Typography>
            </Grid>
          )}
          {transfer.notes && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">
                Observaciones
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {transfer.notes}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Card>

      <Card>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1">Items</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Enviado</TableCell>
              <TableCell align="right">Recibido</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(transfer.items ?? []).map((it) => (
              <TableRow key={it.id}>
                <TableCell>{productNameById.get(it.productId) ?? `Producto ${it.productId.slice(0, 8)}…`}</TableCell>
                <TableCell align="right">{formatQty(it.quantitySent)}</TableCell>
                <TableCell align="right">{formatQty(it.quantityReceived)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={receiveDialogOpen} onClose={() => setReceiveDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Recibir transferencia</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              Ajusta la cantidad recibida por item si hay mermas. La diferencia se asentará como merma en tránsito.
            </Alert>
            {(transfer.items ?? []).map((it) => {
              const dtoItem = receiveItems.find((r) => r.itemId === it.id);
              return (
                <Stack key={it.id} direction="row" spacing={2} alignItems="center">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      Lote {it.lotId.slice(0, 8)}…
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enviado: {Number(it.quantitySent).toFixed(2)}
                    </Typography>
                  </Box>
                  <TextField
                    type="number"
                    label="Recibido"
                    size="small"
                    value={dtoItem?.quantityReceived ?? 0}
                    onChange={(e) =>
                      setReceiveItems((prev) =>
                        prev.map((r) =>
                          r.itemId === it.id ? { ...r, quantityReceived: Number(e.target.value) || 0 } : r
                        )
                      )
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Stack>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setReceiveDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleReceive} loading={receiveMutation.isPending}>
            Confirmar recepción
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancelar transferencia</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Si la transferencia está en tránsito, el stock se devuelve al origen automáticamente.
          </Alert>
          <TextField
            label="Razón (opcional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setCancelDialogOpen(false)}>
            Volver
          </Button>
          <Button color="error" variant="contained" onClick={handleCancel} loading={cancelMutation.isPending}>
            Cancelar transferencia
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
