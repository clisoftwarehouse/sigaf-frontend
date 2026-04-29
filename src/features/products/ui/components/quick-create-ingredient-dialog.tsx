import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from '@/app/components/iconify';
import { useTherapeuticUseOptions } from '@/features/therapeutic-uses/api/therapeutic-uses.options';
import { VademecumSearchDialog } from '@/features/active-ingredients/ui/components/vademecum-search-dialog';
import { useCreateActiveIngredientMutation } from '@/features/active-ingredients/api/active-ingredients.queries';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export function QuickCreateIngredientDialog({ open, onClose, onCreated }: Props) {
  const mutation = useCreateActiveIngredientMutation();
  const { data: therapeuticUseOptions = [], isLoading: loadingUses } = useTherapeuticUseOptions();
  const [name, setName] = useState('');
  const [therapeuticUseId, setTherapeuticUseId] = useState('');
  const [atcCode, setAtcCode] = useState('');
  const [vademecumOpen, setVademecumOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setTherapeuticUseId('');
      setAtcCode('');
    }
  }, [open]);

  const submit = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      toast.error('Nombre obligatorio');
      return;
    }
    try {
      const created = await mutation.mutateAsync({
        name: trimmedName,
        therapeuticUseId: therapeuticUseId || undefined,
        atcCode: atcCode.trim() || undefined,
      });
      toast.success(`Principio activo "${created.name}" creado`);
      onCreated(created.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={mutation.isPending ? undefined : onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nuevo principio activo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                autoFocus
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Losartán Potásico"
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={() => setVademecumOpen(true)}
                startIcon={<Iconify icon="solar:download-bold" />}
                sx={{ minWidth: 170, whiteSpace: 'nowrap' }}
              >
                Buscar
              </Button>
            </Stack>
            <TextField
              select
              label="Acción terapéutica (opcional)"
              value={therapeuticUseId}
              onChange={(e) => setTherapeuticUseId(e.target.value)}
              disabled={loadingUses}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            >
              <MenuItem value="">— Sin asignar —</MenuItem>
              {therapeuticUseOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Código ATC (opcional)"
              value={atcCode}
              onChange={(e) => setAtcCode(e.target.value)}
              placeholder="Ej. C09CA01"
              helperText="Se prellena si usas el buscador de Vademecum."
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

      <VademecumSearchDialog
        open={vademecumOpen}
        initialQuery={name}
        mode="pick"
        onClose={() => setVademecumOpen(false)}
        onPick={(candidate, details) => {
          setName(candidate.name);
          if (candidate.atcCode) setAtcCode(candidate.atcCode);
          if (details.therapeuticUse) setTherapeuticUseId(details.therapeuticUse.id);
          setVademecumOpen(false);
        }}
      />
    </>
  );
}
