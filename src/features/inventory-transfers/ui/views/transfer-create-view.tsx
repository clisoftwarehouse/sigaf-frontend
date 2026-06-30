import type { TransferType, CreateTransferItemPayload } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { FormFooter } from '@/shared/ui/form-footer';
import { PageHeader } from '@/shared/ui/page-header';
import { useLotsQuery } from '@/features/inventory/api/inventory.queries';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useBranchScope } from '@/features/branches/ui/branch-scope-context';
import { useProductOptions } from '@/features/products/api/products.options';
import { useWarehousesQuery } from '@/features/warehouses/api/warehouses.queries';

import { FromReceiptDialog } from '../components/from-receipt-dialog';
import {
  useCreateTransferMutation,
  useCreateTransferFromReceiptMutation,
} from '../../api/inventory-transfers.queries';

// ----------------------------------------------------------------------

type ManualItem = CreateTransferItemPayload & { lotNumber: string; locationId: string | null };

function formatQty(n: number | string): string {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return num.toFixed(3).replace(/\.?0+$/, '');
}

export function TransferCreateView() {
  const router = useRouter();
  const createMutation = useCreateTransferMutation();
  const createFromReceiptMutation = useCreateTransferFromReceiptMutation();
  const { selectedBranchId } = useBranchScope();

  const [transferType, setTransferType] = useState<TransferType>('intra_branch');
  const [fromBranchId, setFromBranchId] = useState(() => selectedBranchId ?? '');
  const [toBranchId, setToBranchId] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ManualItem[]>([]);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const { data: branches = [] } = useBranchesQuery();
  const { data: productOpts = [] } = useProductOptions();
  const productNameById = useMemo(
    () => new Map((productOpts ?? []).map((p) => [p.id, p.label] as const)),
    [productOpts]
  );
  const { data: fromWarehouses = [] } = useWarehousesQuery(
    fromBranchId ? { branchId: fromBranchId } : {}
  );
  const { data: toWarehouses = [] } = useWarehousesQuery(
    transferType === 'intra_branch'
      ? fromBranchId
        ? { branchId: fromBranchId }
        : {}
      : toBranchId
        ? { branchId: toBranchId }
        : {}
  );

  const lotFilters = useMemo(
    () =>
      fromBranchId
        ? {
            branchId: fromBranchId,
            ...(transferType === 'intra_branch' && fromLocationId
              ? { locationId: fromLocationId }
              : {}),
            limit: 200,
          }
        : { limit: 200 },
    [fromBranchId, fromLocationId, transferType]
  );
  const { data: lotsPage } = useLotsQuery(lotFilters);
  const availableLots = useMemo(
    () =>
      (lotsPage?.data ?? []).filter(
        (l) => l.status === 'available' && Number(l.quantityAvailable) > 0
      ),
    [lotsPage]
  );

  const canSubmit =
    fromBranchId &&
    toBranchId &&
    items.length > 0 &&
    (transferType === 'inter_branch' || (fromLocationId && toLocationId)) &&
    !createMutation.isPending &&
    !createFromReceiptMutation.isPending;

  const handleAddLot = (lotId: string) => {
    const lot = availableLots.find((l) => l.id === lotId);
    if (!lot) return;
    if (items.some((it) => it.lotId === lotId)) {
      toast.error('Ese lote ya está en la lista');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId: lot.productId,
        lotId: lot.id,
        quantitySent: Number(lot.quantityAvailable),
        lotNumber: lot.lotNumber,
        locationId: lot.locationId,
      },
    ]);
  };

  const handleSubmit = async () => {
    try {
      const created = await createMutation.mutateAsync({
        transferType,
        fromBranchId,
        toBranchId: transferType === 'intra_branch' ? fromBranchId : toBranchId,
        fromLocationId: fromLocationId || undefined,
        toLocationId: toLocationId || undefined,
        notes: notes || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          lotId: it.lotId,
          quantitySent: it.quantitySent,
        })),
      });
      toast.success(`Transferencia ${created.transferNumber} creada`);
      router.push(paths.dashboard.inventory.transfers.detail(created.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleConfirmFromReceipt = async (receiptId: string) => {
    if (!toLocationId) {
      toast.error('Selecciona primero el almacén destino');
      return;
    }
    if (transferType === 'intra_branch' && !fromLocationId) {
      toast.error('Selecciona primero el almacén origen');
      return;
    }
    try {
      const created = await createFromReceiptMutation.mutateAsync({
        receiptId,
        payload: {
          transferType,
          toLocationId,
          fromLocationId: transferType === 'intra_branch' ? fromLocationId : undefined,
          toBranchId: transferType === 'inter_branch' ? toBranchId : undefined,
          notes: notes || undefined,
        },
      });
      toast.success(`Transferencia ${created.transferNumber} creada desde recepción`);
      router.push(paths.dashboard.inventory.transfers.detail(created.id));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setReceiptDialogOpen(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Nueva transferencia"
        subtitle="Entre almacenes del mismo branch o entre sucursales distintas."
        crumbs={[{ label: 'Inventario' }, { label: 'Transferencias' }, { label: 'Nueva' }]}
      />

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <FormControl>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Tipo de transferencia
            </Typography>
            <RadioGroup
              row
              value={transferType}
              onChange={(e) => {
                setTransferType(e.target.value as TransferType);
                setItems([]);
                setFromLocationId('');
                setToLocationId('');
                setToBranchId('');
              }}
            >
              <FormControlLabel
                value="intra_branch"
                control={<Radio />}
                label="Entre almacenes (mismo branch)"
              />
              <FormControlLabel
                value="inter_branch"
                control={<Radio />}
                label="Entre sucursales"
              />
            </RadioGroup>
          </FormControl>

          <Divider />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Sucursal origen"
              value={fromBranchId}
              onChange={(e) => {
                setFromBranchId(e.target.value);
                setItems([]);
                setFromLocationId('');
                setToLocationId('');
                if (transferType === 'intra_branch') setToBranchId(e.target.value);
              }}
              sx={{ flex: 1 }}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">— Seleccionar —</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>

            {transferType === 'inter_branch' && (
              <TextField
                select
                label="Sucursal destino"
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                sx={{ flex: 1 }}
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="">— Seleccionar —</MenuItem>
                {branches
                  .filter((b) => b.id !== fromBranchId)
                  .map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          </Stack>

          {transferType === 'intra_branch' && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                label="Almacén origen"
                value={fromLocationId}
                onChange={(e) => {
                  setFromLocationId(e.target.value);
                  setItems([]);
                }}
                disabled={!fromBranchId}
                sx={{ flex: 1 }}
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="">— Seleccionar —</MenuItem>
                {fromWarehouses.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name ?? w.locationCode}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Almacén destino"
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                disabled={!fromBranchId}
                sx={{ flex: 1 }}
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="">— Seleccionar —</MenuItem>
                {toWarehouses
                  .filter((w) => w.id !== fromLocationId)
                  .map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.name ?? w.locationCode}
                    </MenuItem>
                  ))}
              </TextField>
            </Stack>
          )}

          {transferType === 'inter_branch' && (
            <TextField
              select
              label="Almacén destino (opcional)"
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
              disabled={!toBranchId}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Si lo dejas vacío, los lotes destino se crean sin almacén específico."
            >
              <MenuItem value="">— Sin almacén —</MenuItem>
              {toWarehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.name ?? w.locationCode}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Divider />

          <Stack direction="row" spacing={2} alignItems="center" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="subtitle1">Items</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:import-bold" />}
                onClick={() => setReceiptDialogOpen(true)}
                disabled={!fromBranchId || !toLocationId}
              >
                Desde recepción
              </Button>
            </Stack>
          </Stack>

          {!fromBranchId && (
            <Alert severity="info">Selecciona la sucursal origen para listar los lotes disponibles.</Alert>
          )}

          {fromBranchId && availableLots.length === 0 && (
            <Alert severity="warning">No hay lotes con stock disponible para el origen seleccionado.</Alert>
          )}

          {availableLots.length > 0 && (
            <TextField
              select
              label="Agregar lote"
              value=""
              onChange={(e) => handleAddLot(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">— Seleccionar lote —</MenuItem>
              {availableLots
                .filter((l) => !items.some((it) => it.lotId === l.id))
                .map((l) => {
                  const productName = productNameById.get(l.productId) ?? 'Producto sin nombre';
                  return (
                    <MenuItem key={l.id} value={l.id}>
                      {productName} · Lote {l.lotNumber} · disponible {formatQty(l.quantityAvailable)}
                    </MenuItem>
                  );
                })}
            </TextField>
          )}

          {items.length > 0 && (
            <Stack spacing={1}>
              {items.map((item, idx) => (
                <Stack
                  key={item.lotId}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {productNameById.get(item.productId) ?? 'Producto'}
                    </Typography>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Lote ${item.lotNumber}`}
                      sx={{ fontFamily: 'monospace', mt: 0.5 }}
                    />
                  </Box>
                  <TextField
                    type="number"
                    size="small"
                    label="Cantidad"
                    value={item.quantitySent}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((it, i) =>
                          i === idx ? { ...it, quantitySent: Number(e.target.value) || 0 } : it
                        )
                      )
                    }
                    sx={{ width: 140 }}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <IconButton
                    color="error"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}

          <Divider />

          <TextField
            label="Observaciones"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Card>

      <FormFooter>
        <Button color="inherit" variant="outlined" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          loading={createMutation.isPending}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {transferType === 'intra_branch' ? 'Transferir' : 'Crear borrador'}
        </Button>
      </FormFooter>

      <FromReceiptDialog
        open={receiptDialogOpen}
        branchId={fromBranchId || undefined}
        onConfirm={handleConfirmFromReceipt}
        onClose={() => setReceiptDialogOpen(false)}
      />
    </Container>
  );
}
