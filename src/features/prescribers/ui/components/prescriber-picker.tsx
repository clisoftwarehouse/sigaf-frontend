import type { Prescriber } from '../../model/types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { Iconify } from '@/app/components/iconify';

import { PrescriberFormDialog } from './prescriber-form-dialog';
import { usePrescribersList } from '../../api/prescribers.queries';

// ----------------------------------------------------------------------

type Props = {
  value: Prescriber | null;
  onChange: (p: Prescriber | null) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
};

/**
 * Selector de médico contra el maestro `prescribers`, con búsqueda por nombre,
 * MPPS o cédula (la hace el backend) y atajo para crear uno nuevo. Reemplaza
 * el texto libre del médico para reusar el catálogo y no duplicar/tipear a mano.
 */
export function PrescriberPicker({ value, onChange, label = 'Médico', error, helperText }: Props) {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isFetching } = usePrescribersList({
    search: search || undefined,
    isActive: true,
    limit: 20,
  });

  const options = useMemo(() => {
    const list = data?.data ?? [];
    // El value seleccionado debe estar en options aunque no matchee el search.
    if (value && !list.some((p) => p.id === value.id)) return [value, ...list];
    return list;
  }, [data, value]);

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Autocomplete
          fullWidth
          options={options}
          value={value}
          loading={isFetching}
          onChange={(_e, next) => onChange(next)}
          onInputChange={(_e, v, reason) => {
            if (reason === 'input') setSearch(v);
          }}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          getOptionLabel={(o) => o.fullName}
          filterOptions={(x) => x}
          noOptionsText={
            search ? 'Sin médicos — usá "Crear"' : 'Escribí para buscar por nombre, MPPS o cédula'
          }
          renderOption={(props, o) => (
            <li {...props} key={o.id}>
              <Box>
                <Typography variant="body2">{o.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {o.mppsNumber ? `MPPS ${o.mppsNumber}` : 'sin MPPS'} · {o.nationalId ?? 'sin cédula'}
                  {o.specialty ? ` · ${o.specialty}` : ''}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              placeholder="Buscar por nombre, MPPS o cédula…"
              error={error}
              helperText={helperText}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setCreateOpen(true)}
          sx={{ flexShrink: 0, mt: 0.25, whiteSpace: 'nowrap' }}
        >
          Crear
        </Button>
      </Stack>

      <PrescriberFormDialog
        open={createOpen}
        prescriber={null}
        onClose={() => setCreateOpen(false)}
        onCreated={(p) => onChange(p)}
      />
    </>
  );
}
