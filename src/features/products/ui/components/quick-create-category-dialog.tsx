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

import { useCreateCategoryMutation } from '@/features/categories/api/categories.queries';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export function QuickCreateCategoryDialog({ open, onClose, onCreated }: Props) {
  const mutation = useCreateCategoryMutation();
  const [name, setName] = useState('');
  const [isPharmaceutical, setIsPharmaceutical] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setIsPharmaceutical(false);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      toast.error('Nombre obligatorio');
      return;
    }
    try {
      const created = await mutation.mutateAsync({ name: trimmed, isPharmaceutical });
      toast.success(`Categoría "${created.name}" creada`);
      onCreated(created.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva categoría</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Analgésicos"
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={isPharmaceutical}
                onChange={(e) => setIsPharmaceutical(e.target.checked)}
              />
            }
            label="Farmacéutica"
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
