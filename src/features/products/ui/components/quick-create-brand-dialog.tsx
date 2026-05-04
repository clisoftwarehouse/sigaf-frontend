import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useCreateBrandMutation } from '@/features/brands/api/brands.queries';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export function QuickCreateBrandDialog({ open, onClose, onCreated }: Props) {
  const mutation = useCreateBrandMutation();
  const [name, setName] = useState('');
  const [isLaboratory, setIsLaboratory] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setIsLaboratory(false);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      toast.error('Nombre obligatorio');
      return;
    }
    try {
      const created = await mutation.mutateAsync({ name: trimmed, isLaboratory });
      toast.success(`Marca "${created.name}" creada`);
      onCreated(created.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Nueva marca</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Bayer"
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch checked={isLaboratory} onChange={(e) => setIsLaboratory(e.target.checked)} />
            }
            label="Es laboratorio"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={submit} loading={mutation.isPending}>
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );
}
