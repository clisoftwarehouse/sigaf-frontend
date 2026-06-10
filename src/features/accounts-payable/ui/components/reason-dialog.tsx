import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  label?: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'error' | 'warning';
  isPending?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function ReasonDialog({
  open,
  title,
  description,
  label = 'Motivo',
  confirmLabel = 'Confirmar',
  confirmColor = 'primary',
  isPending = false,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
          <TextField
            label={label}
            multiline
            minRows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
            slotProps={{ inputLabel: { shrink: true } }}
            placeholder="Escribí una explicación breve…"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={handleConfirm}
          disabled={isPending || !reason.trim()}
        >
          {isPending ? 'Procesando…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
