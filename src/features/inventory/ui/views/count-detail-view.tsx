import type { GridColDef, GridRowModel } from '@mui/x-data-grid';
import type { InventoryCountItem } from '../../model/counts-types';

import { toast } from 'sonner';
import { useParams } from 'react-router';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';

import { COUNT_TYPE_LABEL, COUNT_STATUS_COLOR, COUNT_STATUS_LABEL } from '../../model/counts-types';
import {
  useCountQuery,
  useStartCountMutation,
  useCancelCountMutation,
  useApproveCountMutation,
  useCompleteCountMutation,
  useUpdateCountItemMutation,
  useRecountCountItemMutation,
  useBulkUpdateCountItemsMutation,
} from '../../api/counts.queries';

// ----------------------------------------------------------------------

export function CountDetailView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: count, isLoading, isError, error } = useCountQuery(id);
  const startMutation = useStartCountMutation();
  const completeMutation = useCompleteCountMutation();
  const approveMutation = useApproveCountMutation();
  const cancelMutation = useCancelCountMutation();
  const updateItemMutation = useUpdateCountItemMutation(id ?? '');
  const recountMutation = useRecountCountItemMutation(id ?? '');
  const bulkMutation = useBulkUpdateCountItemsMutation(id ?? '');

  const { data: productOpts = [] } = useProductOptions();
  const productNameById = useMemo(
    () => new Map(productOpts.map((o) => [o.id, o.label] as const)),
    [productOpts]
  );
  const { data: branchOpts = [] } = useBranchOptions();
  const branchName = useMemo(
    () => branchOpts.find((b) => b.id === count?.branchId)?.label ?? count?.branchId ?? '—',
    [branchOpts, count]
  );

  const [approveOpen, setApproveOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [recountFor, setRecountFor] = useState<InventoryCountItem | null>(null);
  const [recountReason, setRecountReason] = useState('');

  const runStart = async () => {
    if (!id) return;
    try {
      await startMutation.mutateAsync(id);
      toast.success('Toma iniciada');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const runComplete = async () => {
    if (!id) return;
    try {
      await completeMutation.mutateAsync(id);
      toast.success('Toma marcada como completada');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const runApprove = async () => {
    if (!id || justification.trim().length < 10) {
      toast.error('La justificación debe tener al menos 10 caracteres');
      return;
    }
    try {
      await approveMutation.mutateAsync({ id, justification: justification.trim() });
      toast.success('Toma aprobada y ajustes aplicados');
      setApproveOpen(false);
      setJustification('');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const runCancel = async () => {
    if (!id || cancelReason.trim().length < 10) {
      toast.error('La razón debe tener al menos 10 caracteres');
      return;
    }
    try {
      await cancelMutation.mutateAsync({ id, reason: cancelReason.trim() });
      toast.success('Toma cancelada');
      setCancelOpen(false);
      setCancelReason('');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const runBulkConfirmPending = async () => {
    if (!count?.items) return;
    const pending = count.items
      .filter((i) => i.countedQuantity == null)
      .map((i) => ({ itemId: i.id, countedQuantity: Number(i.systemQuantity) || 0 }));
    if (pending.length === 0) {
      toast.info('No hay ítems pendientes');
      return;
    }
    try {
      await bulkMutation.mutateAsync(pending);
      toast.success(`${pending.length} ítems confirmados con la cantidad del sistema`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const runRecount = async () => {
    if (!recountFor || recountReason.trim().length < 10) {
      toast.error('La justificación debe tener al menos 10 caracteres');
      return;
    }
    try {
      await recountMutation.mutateAsync({
        itemId: recountFor.id,
        reason: recountReason.trim(),
      });
      toast.success('Ítem marcado para recuento');
      setRecountFor(null);
      setRecountReason('');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleItemEdit = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    const next = newRow as InventoryCountItem;
    const prev = oldRow as InventoryCountItem;
    if (next.countedQuantity === prev.countedQuantity) return prev;
    const value = Number(next.countedQuantity);
    if (Number.isNaN(value) || value < 0) {
      toast.error('Cantidad inválida');
      return prev;
    }
    try {
      await updateItemMutation.mutateAsync({ itemId: next.id, countedQuantity: value });
      return next;
    } catch (err) {
      toast.error((err as Error).message);
      return prev;
    }
  };

  const canEditItems = count?.status === 'in_progress';
  const canStart = count?.status === 'draft';
  const canComplete = count?.status === 'in_progress';
  const canApprove = count?.status === 'completed';
  const canCancel = count?.status === 'draft' || count?.status === 'in_progress';

  const itemColumns = useMemo<GridColDef<InventoryCountItem>[]>(
    () => [
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2,
        minWidth: 220,
        valueFormatter: (value: string) => productNameById.get(value) ?? value,
        sortComparator: (a, b) =>
          (productNameById.get(a) ?? '').localeCompare(productNameById.get(b) ?? ''),
      },
      {
        field: 'expectedLotNumber',
        headerName: 'Lote esperado',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null) => value ?? '—',
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'systemQuantity',
        headerName: 'Sistema',
        type: 'number',
        flex: 1,
        minWidth: 110,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'countedQuantity',
        headerName: 'Contado',
        type: 'number',
        editable: true,
        flex: 1,
        minWidth: 130,
        valueGetter: (value: number | string | null) => (value == null ? null : Number(value)),
      },
      {
        field: 'difference',
        headerName: 'Diferencia',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string | null) => (value == null ? null : Number(value)),
        renderCell: ({ value, row }) => {
          if (value == null) return <span>—</span>;
          const n = value as number;
          const color =
            row.differenceType === 'over'
              ? 'success.main'
              : row.differenceType === 'short'
                ? 'error.main'
                : 'text.primary';
          return (
            <Typography variant="body2" sx={{ color, fontFamily: 'monospace', fontWeight: 600 }}>
              {n > 0 ? '+' : ''}
              {n}
            </Typography>
          );
        },
      },
      {
        field: 'isRecounted',
        headerName: 'Recontado',
        type: 'boolean',
        flex: 1,
        minWidth: 120,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) =>
          canEditItems ? (
            <Tooltip title="Marcar para recuento">
              <IconButton size="small" onClick={() => setRecountFor(row)}>
                <Iconify icon="solar:restart-bold" />
              </IconButton>
            </Tooltip>
          ) : null,
      },
    ],
    [productNameById, canEditItems]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title={count ? `Toma ${count.countNumber}` : 'Toma de inventario'}
        subtitle={count ? `${COUNT_TYPE_LABEL[count.countType]} · ${branchName}` : undefined}
        crumbs={[{ label: 'Inventario' }, { label: 'Tomas' }, { label: 'Detalle' }]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => router.push(paths.dashboard.inventory.counts.root)}
          >
            Volver
          </Button>
        }
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {count && (
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="space-between"
              alignItems={{ sm: 'flex-start' }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    color={COUNT_STATUS_COLOR[count.status]}
                    label={COUNT_STATUS_LABEL[count.status]}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  SKUs esperados / contados
                </Typography>
                <Typography variant="h6">
                  {count.totalSkusCounted ?? 0} / {count.totalSkusExpected ?? 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Precisión
                </Typography>
                <Typography variant="h6">
                  {count.accuracyPct != null ? `${Number(count.accuracyPct).toFixed(2)}%` : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Bloqueo de ventas
                </Typography>
                <Typography variant="body2">{count.blocksSales ? 'Activo' : 'Inactivo'}</Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {canStart && (
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="solar:play-circle-bold" />}
                    loading={startMutation.isPending}
                    onClick={runStart}
                  >
                    Iniciar
                  </Button>
                )}
                {canEditItems && (
                  <Tooltip title="Rellena los ítems sin contar con la cantidad del sistema">
                    <Button
                      variant="outlined"
                      loading={bulkMutation.isPending}
                      onClick={runBulkConfirmPending}
                    >
                      Confirmar sin diferencias
                    </Button>
                  </Tooltip>
                )}
                {canComplete && (
                  <Button
                    variant="contained"
                    color="info"
                    loading={completeMutation.isPending}
                    onClick={runComplete}
                  >
                    Marcar completa
                  </Button>
                )}
                {canApprove && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                    onClick={() => setApproveOpen(true)}
                  >
                    Aprobar
                  </Button>
                )}
                {canCancel && (
                  <Button variant="outlined" color="error" onClick={() => setCancelOpen(true)}>
                    Cancelar
                  </Button>
                )}
              </Stack>
            </Stack>

            {count.notes && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                {count.notes}
              </Typography>
            )}
          </Card>

          <Card>
            <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
              Ítems ({count.items?.length ?? 0})
              {canEditItems && ' · haz doble click en "Contado" para editar'}
            </Typography>
            <Box sx={{ width: '100%' }}>
              <DataTable
                columns={itemColumns}
                rows={count.items ?? []}
                disableRowSelectionOnClick
                autoHeight
                processRowUpdate={canEditItems ? handleItemEdit : undefined}
                onProcessRowUpdateError={(err) => toast.error((err as Error).message)}
              />
            </Box>
          </Card>
        </Stack>
      )}

      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>Aprobar toma</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Al aprobar se generarán ajustes automáticos y movimientos de kardex para las diferencias
            encontradas.
          </Typography>
          <TextField
            label="Justificación"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            multiline
            rows={3}
            fullWidth
            helperText="Mínimo 10 caracteres"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setApproveOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={runApprove}
            loading={approveMutation.isPending}
          >
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>Cancelar toma</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Razón de cancelación"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            helperText="Mínimo 10 caracteres"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setCancelOpen(false)}>
            Volver
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={runCancel}
            loading={cancelMutation.isPending}
          >
            Cancelar toma
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={recountFor !== null}
        onClose={() => setRecountFor(null)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>Marcar ítem para recuento</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Esto borra el conteo anterior y requiere volver a contar el ítem.
          </Typography>
          <TextField
            label="Razón del recuento"
            value={recountReason}
            onChange={(e) => setRecountReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            helperText="Mínimo 10 caracteres"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setRecountFor(null)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={runRecount} loading={recountMutation.isPending}>
            Marcar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
