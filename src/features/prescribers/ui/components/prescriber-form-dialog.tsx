import type { Prescriber, PrescriberInput } from '../../model/types';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useCreatePrescriber, useUpdatePrescriber } from '../../api/prescribers.queries';

type Props = {
  open: boolean;
  prescriber: Prescriber | null;
  onClose: () => void;
  /** Se dispara con el médico recién creado (para auto-seleccionarlo en un picker). */
  onCreated?: (created: Prescriber) => void;
};

const EMPTY: PrescriberInput = {
  fullName: '',
  specialty: '',
  mppsNumber: '',
  nationalId: '',
  rif: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
};

export function PrescriberFormDialog({ open, prescriber, onClose, onCreated }: Props) {
  const createMut = useCreatePrescriber();
  const updateMut = useUpdatePrescriber();
  const [form, setForm] = useState<PrescriberInput>(EMPTY);

  useEffect(() => {
    if (open) {
      if (prescriber) {
        setForm({
          fullName: prescriber.fullName,
          specialty: prescriber.specialty ?? '',
          mppsNumber: prescriber.mppsNumber ?? '',
          nationalId: prescriber.nationalId ?? '',
          rif: prescriber.rif ?? '',
          phone: prescriber.phone ?? '',
          email: prescriber.email ?? '',
          address: prescriber.address ?? '',
          notes: prescriber.notes ?? '',
          isActive: prescriber.isActive,
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, prescriber]);

  const handleSubmit = () => {
    if (!form.fullName?.trim()) {
      toast.warning('El nombre del médico es obligatorio');
      return;
    }
    const payload: PrescriberInput = {
      ...form,
      fullName: form.fullName!.trim(),
      specialty: form.specialty?.trim() || undefined,
      mppsNumber: form.mppsNumber?.trim() || undefined,
      nationalId: form.nationalId?.trim() || undefined,
      rif: form.rif?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      address: form.address?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    };

    const onError = (err: Error) => toast.error(`Error: ${err.message}`);

    if (prescriber) {
      updateMut.mutate(
        { id: prescriber.id, input: payload },
        {
          onSuccess: () => {
            toast.success('Médico actualizado');
            onClose();
          },
          onError,
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: (created) => {
          toast.success('Médico creado');
          onCreated?.(created);
          onClose();
        },
        onError,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{prescriber ? 'Editar médico' : 'Nuevo médico'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nombre completo"
            value={form.fullName ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            size="small"
            autoFocus
            required
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label="Especialidad"
              value={form.specialty ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
              size="small"
            />
            <TextField
              label="MPPS"
              value={form.mppsNumber ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, mppsNumber: e.target.value }))}
              size="small"
              helperText="Registro nacional"
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label="Cédula"
              value={form.nationalId ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, nationalId: e.target.value }))}
              size="small"
              placeholder="V-12345678"
            />
            <TextField
              label="RIF"
              value={form.rif ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, rif: e.target.value }))}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label="Teléfono"
              value={form.phone ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              size="small"
            />
            <TextField
              label="Email"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              size="small"
            />
          </Box>
          <TextField
            label="Dirección"
            multiline
            minRows={2}
            value={form.address ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            size="small"
          />
          <TextField
            label="Notas"
            multiline
            minRows={2}
            value={form.notes ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            size="small"
          />
          {prescriber && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
              }
              label="Activo"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createMut.isPending || updateMut.isPending}
        >
          {prescriber ? 'Guardar' : 'Crear médico'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
