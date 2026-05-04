import type { Price, PriceMode, CreatePricePayload, UpdatePricePayload } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';

import { useCreatePriceMutation, useUpdatePriceMutation } from '../../api/prices.queries';

// ----------------------------------------------------------------------

const MIN_JUSTIFICATION = 10;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pre-seleccionar un producto (útil al abrir desde una ficha de producto). */
  defaultProductId?: string;
  /**
   * Cuando se pasa, el dialog opera en modo edición sobre este precio:
   *   - Producto, sucursal y vigencia quedan bloqueados (no se cambia scope).
   *   - Si el monto cambia, se exige justificación (queda en audit_log).
   *   - El submit llama PUT /prices/:id en lugar de POST /prices.
   */
  editingPrice?: Price | null;
};

/**
 * Dialog de creación/edición de precio.
 *
 * El backend solo persiste `priceUsd` (valor final). Esta UI da al usuario
 * dos formas equivalentes de obtener ese valor:
 *   - **fixed**: el usuario escribe el precio directamente.
 *   - **margin**: el usuario provee costo + margen % sobre precio de venta
 *     y el precio se deriva como `cost / (1 - margin/100)`. Ej: cost=10,
 *     margin=30% → 10 / 0.7 = 14.29 (ganancia 4.29 = 30% de 14.29). El
 *     costo y el margen NO se envían al backend; se descartan tras calcular
 *     el precio final.
 *
 * Crear cierra automáticamente el anterior vigente del mismo scope. Editar
 * NO cambia vigencia ni scope — para cambios de política, crear uno nuevo.
 */
export function PriceFormDialog({ open, onClose, defaultProductId, editingPrice }: Props) {
  const isEdit = !!editingPrice;

  const [productId, setProductId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [mode, setMode] = useState<PriceMode>('fixed');
  const [fixedPrice, setFixedPrice] = useState('');
  const [costUsd, setCostUsd] = useState('');
  const [marginPct, setMarginPct] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [justification, setJustification] = useState('');

  const { data: productOpts = [], isLoading: loadingProducts } = useProductOptions();
  const { data: branchOpts = [], isLoading: loadingBranches } = useBranchOptions();

  const createMutation = useCreatePriceMutation();
  const updateMutation = useUpdatePriceMutation();

  // Reinicia el formulario cada vez que se abre. Si viene `editingPrice`
  // pre-llena con sus valores y deja productId/branchId/effectiveFrom como
  // read-only — el scope no se modifica en una corrección.
  useEffect(() => {
    if (!open) return;
    if (editingPrice) {
      setProductId(editingPrice.productId);
      setBranchId(editingPrice.branchId);
      setMode('fixed');
      setFixedPrice(String(Number(editingPrice.priceUsd)));
      setCostUsd('');
      setMarginPct('');
      setEffectiveFrom(editingPrice.effectiveFrom.slice(0, 10));
      setNotes(editingPrice.notes ?? '');
      setJustification('');
    } else {
      setProductId(defaultProductId ?? null);
      setBranchId(null);
      setMode('fixed');
      setFixedPrice('');
      setCostUsd('');
      setMarginPct('');
      setEffectiveFrom(new Date().toISOString().slice(0, 10));
      setNotes('');
      setJustification('');
    }
  }, [open, defaultProductId, editingPrice]);

  /** Precio USD calculado o ingresado directamente, siempre >= 0 o null. */
  const calculatedPrice = useMemo<number | null>(() => {
    if (mode === 'fixed') {
      const n = Number(fixedPrice);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    const c = Number(costUsd);
    const m = Number(marginPct);
    if (!Number.isFinite(c) || !Number.isFinite(m) || c <= 0) return null;
    if (m >= 100 || m < 0) return null;
    return +(c / (1 - m / 100)).toFixed(4);
  }, [mode, fixedPrice, costUsd, marginPct]);

  const originalPrice = editingPrice ? Number(editingPrice.priceUsd) : null;
  const priceChanged =
    isEdit && calculatedPrice != null && originalPrice != null && calculatedPrice !== originalPrice;
  const justificationValid = justification.trim().length >= MIN_JUSTIFICATION;

  const canSubmit = isEdit
    ? Boolean(productId) &&
      calculatedPrice != null &&
      calculatedPrice > 0 &&
      (!priceChanged || justificationValid)
    : Boolean(productId) && calculatedPrice != null && calculatedPrice > 0;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    if (!canSubmit || !productId || calculatedPrice == null) return;

    if (isEdit && editingPrice) {
      const payload: UpdatePricePayload = {};
      if (priceChanged) {
        payload.priceUsd = calculatedPrice;
        payload.justification = justification.trim();
      }
      const trimmedNotes = notes.trim();
      const originalNotes = editingPrice.notes ?? '';
      if (trimmedNotes !== originalNotes) {
        payload.notes = trimmedNotes;
      }
      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }
      try {
        await updateMutation.mutateAsync({ id: editingPrice.id, payload });
        toast.success(
          priceChanged
            ? 'Precio corregido. Justificación registrada en auditoría.'
            : 'Notas actualizadas.'
        );
        onClose();
      } catch (err) {
        toast.error((err as Error).message);
      }
      return;
    }

    const payload: CreatePricePayload = {
      productId,
      priceUsd: calculatedPrice,
      effectiveFrom: new Date(`${effectiveFrom}T00:00:00`).toISOString(),
    };
    if (branchId) payload.branchId = branchId;
    if (notes.trim()) payload.notes = notes.trim();

    try {
      await createMutation.mutateAsync(payload);
      toast.success(
        branchId
          ? 'Precio por sucursal creado. El anterior quedó expirado automáticamente.'
          : 'Precio global creado. El anterior quedó expirado automáticamente.'
      );
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Editar precio' : 'Nuevo precio'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {isEdit && (
            <Alert severity="info" variant="outlined">
              Esta corrección no crea una nueva vigencia. Para una nueva política de precios,
              crea uno nuevo (el anterior se cierra automáticamente).
            </Alert>
          )}

          <Autocomplete
            options={productOpts}
            loading={loadingProducts}
            disabled={isEdit}
            getOptionLabel={(opt) => opt.label ?? ''}
            value={productOpts.find((o) => o.id === productId) ?? null}
            onChange={(_, next) => setProductId(next?.id ?? null)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => <TextField {...params} label="Producto" required />}
          />

          <Autocomplete
            options={branchOpts}
            loading={loadingBranches}
            disabled={isEdit}
            getOptionLabel={(opt) => opt.label ?? ''}
            value={branchOpts.find((o) => o.id === branchId) ?? null}
            onChange={(_, next) => setBranchId(next?.id ?? null)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sucursal"
                helperText={
                  isEdit
                    ? 'No editable en correcciones — el scope del precio no cambia.'
                    : 'Opcional. Si queda vacío, el precio es global para todas las sucursales.'
                }
              />
            )}
          />

          <Box>
            <Typography variant="caption" color="text.secondary">
              Modo de cálculo
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={mode}
              onChange={(_, next: PriceMode | null) => next && setMode(next)}
              size="small"
              fullWidth
              sx={{ mt: 0.5 }}
            >
              <ToggleButton value="fixed">Precio fijo</ToggleButton>
              <ToggleButton value="margin">Costo + margen % sobre venta</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {mode === 'fixed' ? (
            <TextField
              label="Precio de venta"
              type="number"
              required
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
              helperText={
                isEdit && originalPrice != null
                  ? `Original: ${originalPrice.toFixed(4)} USD`
                  : undefined
              }
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: <InputAdornment position="end">USD</InputAdornment>,
                },
                htmlInput: { min: 0, step: 0.01 },
              }}
            />
          ) : (
            <Stack direction="row" spacing={2}>
              <TextField
                label="Costo"
                type="number"
                required
                value={costUsd}
                onChange={(e) => setCostUsd(e.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    endAdornment: <InputAdornment position="end">USD</InputAdornment>,
                  },
                  htmlInput: { min: 0, step: 0.01 },
                }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Margen"
                type="number"
                required
                value={marginPct}
                onChange={(e) => setMarginPct(e.target.value)}
                helperText="Margen sobre precio de venta. Ej: 30% → precio = costo / 0.7"
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                  htmlInput: { min: 0, max: 99.99, step: 0.1 },
                }}
                sx={{ flex: 1 }}
              />
            </Stack>
          )}

          {calculatedPrice != null && mode === 'margin' && (
            <Alert severity="info" sx={{ mt: -1 }}>
              Precio calculado: <strong>{calculatedPrice.toFixed(2)} USD</strong>
              {isEdit && originalPrice != null && (
                <>
                  {' '}
                  · Original: <strong>{originalPrice.toFixed(2)} USD</strong>
                </>
              )}
            </Alert>
          )}

          {isEdit && priceChanged && (
            <TextField
              label="Justificación del cambio"
              required
              multiline
              minRows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ej: Error de tipeo, debía ser 13.25 según lista del proveedor"
              error={justification.length > 0 && !justificationValid}
              helperText={
                justification.length > 0 && !justificationValid
                  ? `Mínimo ${MIN_JUSTIFICATION} caracteres (${justification.trim().length}/${MIN_JUSTIFICATION})`
                  : 'Obligatoria al cambiar el monto. Queda registrada en auditoría.'
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}

          <TextField
            label="Vigente desde"
            type="date"
            required
            disabled={isEdit}
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            helperText={
              isEdit ? 'No editable en correcciones — la vigencia del precio no cambia.' : undefined
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Notas"
            multiline
            minRows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional: motivo del ajuste, referencia de la lista de precios, etc."
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || isPending}
          loading={isPending}
        >
          {isEdit ? 'Guardar cambios' : 'Guardar precio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
