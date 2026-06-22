import type { ProductTaxonomy } from '../../api/taxonomies.api';

import { toast } from 'sonner';
import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

type Props = {
  open: boolean;
  title: string;
  label: string;
  placeholder: string;
  pending: boolean;
  onClose: () => void;
  /** Crea el maestro y devuelve el registro (o lanza). */
  onCreate: (name: string) => Promise<ProductTaxonomy>;
  /** Recibe el NOMBRE creado para setearlo en el form. */
  onCreated: (name: string) => void;
};

/**
 * Creación rápida de un dato maestro de producto (forma farmacéutica o tipo de
 * empaque), con el mismo patrón que el "+" de marcas/categorías.
 */
export function QuickCreateTaxonomyDialog({
  open,
  title,
  label,
  placeholder,
  pending,
  onClose,
  onCreate,
  onCreated,
}: Props) {
  const [name, setName] = useState('');

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      toast.error('Nombre obligatorio');
      return;
    }
    try {
      const created = await onCreate(trimmed);
      toast.success(`"${created.name}" creado`);
      onCreated(created.name);
      setName('');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label={label}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void submit();
              }
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={submit} loading={pending}>
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );
}
