import type { InventoryLot } from '../../model/types';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useQuarantineLotMutation } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

type Props = {
  lot: InventoryLot | null;
  onClose: () => void;
};

export function QuarantineDialog({ lot, onClose }: Props) {
  const mutation = useQuarantineLotMutation();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (lot) setReason('');
  }, [lot]);

  if (!lot) return null;

  const shouldQuarantine = lot.status !== 'quarantine';
  const title = shouldQuarantine ? 'Enviar lote a cuarentena' : 'Liberar lote de cuarentena';

  const handleConfirm = async () => {
    if (reason.trim().length < 10) {
      toast.error('La razón debe tener al menos 10 caracteres');
      return;
    }
    try {
      await mutation.mutateAsync({
        id: lot.id,
        payload: { quarantine: shouldQuarantine, reason: reason.trim() },
      });
      toast.success(
        shouldQuarantine ? `Lote ${lot.lotNumber} en cuarentena` : `Lote ${lot.lotNumber} liberado`
      );
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={!!lot} onClose={mutation.isPending ? undefined : onClose} maxWidth="xl" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Lote <strong>{lot.lotNumber}</strong> — vencimiento {lot.expirationDate}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label="Razón"
          placeholder="Explica el motivo (mínimo 10 caracteres)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          helperText={`${reason.trim().length}/10 caracteres mínimos`}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={shouldQuarantine ? 'warning' : 'primary'}
          onClick={handleConfirm}
          loading={mutation.isPending}
        >
          {shouldQuarantine ? 'Enviar a cuarentena' : 'Liberar lote'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
