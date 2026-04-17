import type { PriceMode, CreatePricePayload } from '../../model/types';

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

import { useCreatePriceMutation } from '../../api/prices.queries';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pre-seleccionar un producto (útil al abrir desde una ficha de producto). */
  defaultProductId?: string;
};

/**
 * Dialog de creación de precio.
 *
 * El backend solo persiste `priceUsd` (valor final). Esta UI da al usuario
 * dos formas equivalentes de obtener ese valor:
 *   - **fixed**: el usuario escribe el precio directamente.
 *   - **margin**: el usuario provee costo + margen % y el precio se deriva
 *     como `cost * (1 + margin/100)`. El costo y el margen NO se envían al
 *     backend; se descartan tras calcular el precio final.
 *
 * Crear un precio cierra automáticamente el anterior vigente del mismo
 * scope (producto + sucursal|null) — lógica del backend.
 */
export function PriceFormDialog({ open, onClose, defaultProductId }: Props) {
  const [productId, setProductId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [mode, setMode] = useState<PriceMode>('fixed');
  const [fixedPrice, setFixedPrice] = useState('');
  const [costUsd, setCostUsd] = useState('');
  const [marginPct, setMarginPct] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const { data: productOpts = [], isLoading: loadingProducts } = useProductOptions();
  const { data: branchOpts = [], isLoading: loadingBranches } = useBranchOptions();

  const createMutation = useCreatePriceMutation();

  // Reinicia el formulario cada vez que se abre.
  useEffect(() => {
    if (open) {
      setProductId(defaultProductId ?? null);
      setBranchId(null);
      setMode('fixed');
      setFixedPrice('');
      setCostUsd('');
      setMarginPct('');
      setEffectiveFrom(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
  }, [open, defaultProductId]);

  /** Precio USD calculado o ingresado directamente, siempre >= 0 o null. */
  const calculatedPrice = useMemo<number | null>(() => {
    if (mode === 'fixed') {
      const n = Number(fixedPrice);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    const c = Number(costUsd);
    const m = Number(marginPct);
    if (!Number.isFinite(c) || !Number.isFinite(m) || c <= 0) return null;
    return +(c * (1 + m / 100)).toFixed(4);
  }, [mode, fixedPrice, costUsd, marginPct]);

  const canSubmit = Boolean(productId) && calculatedPrice != null && calculatedPrice > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !productId || calculatedPrice == null) return;
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
      <DialogTitle>Nuevo precio</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Autocomplete
            options={productOpts}
            loading={loadingProducts}
            getOptionLabel={(opt) => opt.label ?? ''}
            value={productOpts.find((o) => o.id === productId) ?? null}
            onChange={(_, next) => setProductId(next?.id ?? null)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => <TextField {...params} label="Producto" required />}
          />

          <Autocomplete
            options={branchOpts}
            loading={loadingBranches}
            getOptionLabel={(opt) => opt.label ?? ''}
            value={branchOpts.find((o) => o.id === branchId) ?? null}
            onChange={(_, next) => setBranchId(next?.id ?? null)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sucursal"
                helperText="Opcional. Si queda vacío, el precio es global para todas las sucursales."
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
              <ToggleButton value="margin">Costo + margen %</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {mode === 'fixed' ? (
            <TextField
              label="Precio de venta"
              type="number"
              required
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
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
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                  htmlInput: { step: 0.1 },
                }}
                sx={{ flex: 1 }}
              />
            </Stack>
          )}

          {calculatedPrice != null && mode === 'margin' && (
            <Alert severity="info" sx={{ mt: -1 }}>
              Precio calculado: <strong>{calculatedPrice.toFixed(2)} USD</strong>
            </Alert>
          )}

          <TextField
            label="Vigente desde"
            type="date"
            required
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
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
        <Button color="inherit" onClick={onClose} disabled={createMutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || createMutation.isPending}
          loading={createMutation.isPending}
        >
          Guardar precio
        </Button>
      </DialogActions>
    </Dialog>
  );
}
