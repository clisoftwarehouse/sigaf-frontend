import type { Price, UpdatePricePayload } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { useUpdatePriceMutation } from '../../api/prices.queries';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  price: Price | null;
};

const MIN_JUSTIFICATION = 10;

/**
 * Dialog de corrección de precio. Permite editar `priceUsd` y/o `notes`.
 *
 * Si el precio cambia, el backend exige una justificación (mínimo 10
 * caracteres) que se persiste en `audit_log` con el old/new value y el
 * usuario que hizo el cambio. El campo solo se muestra cuando el monto
 * efectivamente cambió respecto al original.
 *
 * No modifica vigencia ni scope — para cambios de política de precios,
 * crear un precio nuevo (cierra el anterior automáticamente).
 */
export function PriceEditDialog({ open, onClose, price }: Props) {
  const [priceUsd, setPriceUsd] = useState('');
  const [notes, setNotes] = useState('');
  const [justification, setJustification] = useState('');

  const updateMutation = useUpdatePriceMutation();

  useEffect(() => {
    if (open && price) {
      setPriceUsd(String(Number(price.priceUsd)));
      setNotes(price.notes ?? '');
      setJustification('');
    }
  }, [open, price]);

  const originalPrice = price ? Number(price.priceUsd) : 0;
  const newPrice = Number(priceUsd);
  const priceChanged = useMemo(
    () => Number.isFinite(newPrice) && newPrice > 0 && newPrice !== originalPrice,
    [newPrice, originalPrice]
  );

  const justificationValid = justification.trim().length >= MIN_JUSTIFICATION;
  const canSubmit =
    Number.isFinite(newPrice) && newPrice > 0 && (!priceChanged || justificationValid);

  const handleSubmit = async () => {
    if (!price || !canSubmit) return;

    const payload: UpdatePricePayload = {};
    if (priceChanged) {
      payload.priceUsd = newPrice;
      payload.justification = justification.trim();
    }
    if (notes !== (price.notes ?? '')) {
      payload.notes = notes;
    }

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: price.id, payload });
      toast.success(
        priceChanged
          ? 'Precio corregido. Justificación registrada en auditoría.'
          : 'Notas actualizadas.'
      );
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Editar precio</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Alert severity="info" variant="outlined">
            Esta corrección no crea una nueva vigencia. Si quieres cambiar el precio para una nueva
            política, crea uno nuevo (el anterior se cierra automáticamente).
          </Alert>

          <TextField
            label="Precio venta"
            type="number"
            required
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: <InputAdornment position="end">USD</InputAdornment>,
              },
              htmlInput: { min: 0, step: 0.01 },
            }}
            helperText={priceChanged ? `Original: ${originalPrice.toFixed(4)} USD` : 'Sin cambios'}
          />

          {priceChanged && (
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
            label="Notas"
            multiline
            minRows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional: contexto del precio"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={updateMutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || updateMutation.isPending}
          loading={updateMutation.isPending}
        >
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
}
