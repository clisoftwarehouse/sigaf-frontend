import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import {
  useCreateCommercialLineMutation,
  useCreateCommercialVariantMutation,
} from '@/features/commercial-taxonomies/api/commercial-taxonomies.queries';

// ----------------------------------------------------------------------

type Kind = 'line' | 'variant';

type Props = {
  open: boolean;
  kind: Kind;
  onClose: () => void;
  onCreated: (id: string) => void;
  /** Nombre inicial. Útil cuando el usuario tipea en el Autocomplete y
   *  abre el dialog desde la opción "Crear …". */
  initialName?: string;
};

const LABELS: Record<Kind, { title: string; placeholder: string }> = {
  line: { title: 'Nueva línea comercial', placeholder: 'Ej. Total 12 Clean Mint' },
  variant: { title: 'Nueva variante comercial', placeholder: 'Ej. Crema Dental' },
};

export function QuickCreateCommercialTaxonomyDialog({
  open,
  kind,
  onClose,
  onCreated,
  initialName,
}: Props) {
  const lineMutation = useCreateCommercialLineMutation();
  const variantMutation = useCreateCommercialVariantMutation();
  const mutation = kind === 'line' ? lineMutation : variantMutation;

  const [name, setName] = useState(initialName ?? '');

  useEffect(() => {
    if (open) setName(initialName ?? '');
  }, [open, initialName]);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      toast.error('Nombre obligatorio');
      return;
    }
    try {
      const created = await mutation.mutateAsync({ name: trimmed });
      toast.success(`"${created.name}" creado`);
      onCreated(created.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{LABELS[kind].title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={LABELS[kind].placeholder}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
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
