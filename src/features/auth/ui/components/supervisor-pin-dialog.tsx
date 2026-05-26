import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from '@/app/components/iconify';
import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

const PIN_REGEX = /^\d{4,6}$/;

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Modal para que el usuario logueado establezca/actualice su PIN de
 * supervisor. El PIN se usa en el POS para autorizar acciones sensibles
 * (devoluciones, anulación de ticket, etc.). El backend hashea el PIN con
 * bcrypt en `users.supervisor_pin_hash` — el plaintext nunca se persiste.
 *
 * Sólo usuarios con rol/permiso supervisor deberían usar este flujo, pero
 * el endpoint del backend deja al propio usuario administrar su PIN sin
 * restricción de rol (el modelo de permisos vive a nivel del action que
 * REQUIERE el PIN, no del setter).
 */
export function SupervisorPinDialog({ open, onClose }: Props) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset al abrir.
  useEffect(() => {
    if (open) {
      setPin('');
      setConfirmPin('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!PIN_REGEX.test(pin)) {
      setError('El PIN debe tener entre 4 y 6 dígitos numéricos.');
      return;
    }
    if (pin !== confirmPin) {
      setError('Los PINs no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.patch(endpoints.authPin.setMyPin, { pin });
      toast.success('PIN de supervisor actualizado.');
      onClose();
    } catch (err) {
      setError((err as Error).message || 'No se pudo actualizar el PIN.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Iconify icon="solar:shield-check-bold" width={24} sx={{ color: 'primary.main' }} />
        Establecer PIN de supervisor
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Este PIN se usa en el POS para autorizar devoluciones, anular tickets y otras
            acciones que requieren supervisión. Entre 4 y 6 dígitos numéricos.
          </Typography>

          <TextField
            label="PIN nuevo"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            slotProps={{
              input: { inputMode: 'numeric' },
              htmlInput: { maxLength: 6 },
              inputLabel: { shrink: true },
            }}
            placeholder="••••"
            fullWidth
          />

          <TextField
            label="Confirmar PIN"
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            slotProps={{
              input: { inputMode: 'numeric' },
              htmlInput: { maxLength: 6 },
              inputLabel: { shrink: true },
            }}
            placeholder="••••"
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />

          {error && (
            <Alert severity="error" icon={<Iconify icon="solar:danger-triangle-bold" />}>
              {error}
            </Alert>
          )}

          <Box
            sx={(theme) => ({
              p: 1.5,
              borderRadius: 1,
              bgcolor: theme.vars.palette.warning.lighter,
              border: `1px solid ${theme.vars.palette.warning.light}`,
            })}
          >
            <Typography variant="caption" sx={{ color: 'warning.darker', fontWeight: 600 }}>
              No compartas este PIN. Si lo olvidas, vuelve a esta pantalla y lo restableces;
              el anterior queda invalidado.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!pin || !confirmPin}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
