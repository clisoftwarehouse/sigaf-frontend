import type { Terminal, CreateTerminalPayload } from '../../model/types';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';

// ----------------------------------------------------------------------

export const TerminalSchema = z.object({
  // Opcional acá: al CREAR la sucursal va por el selector múltiple (estado del
  // componente); en edición se valida manualmente.
  branchId: z.string().optional().or(z.literal('')),
  // Opcional: vacío → el backend genera el siguiente correlativo de la sucursal.
  code: z.string().trim().max(20).optional().or(z.literal('')),
  name: z.string().max(100).optional().or(z.literal('')),
});

export type TerminalFormValues = z.infer<typeof TerminalSchema>;

/** Campos comunes de la creación masiva (todo menos la sucursal). */
export type TerminalCommon = Omit<CreateTerminalPayload, 'branchId'>;

type Props = {
  current?: Terminal;
  submitting?: boolean;
  onSubmit: (values: CreateTerminalPayload) => Promise<void> | void;
  onBulkSubmit?: (common: TerminalCommon, branchIds: string[]) => Promise<void> | void;
  onCancel?: () => void;
};

function toFormValues(t?: Terminal): TerminalFormValues {
  return {
    branchId: t?.branchId ?? '',
    code: t?.code ?? '',
    name: t?.name ?? '',
  };
}

export function TerminalForm({ current, submitting, onSubmit, onBulkSubmit, onCancel }: Props) {
  const isEdit = !!current;
  const { data: branches = [], isLoading: loadingBranches } = useBranchesQuery();

  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [branchError, setBranchError] = useState<string | null>(null);

  const methods = useForm<TerminalFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(TerminalSchema),
    defaultValues: toFormValues(current),
  });

  const { handleSubmit, reset, getValues, trigger, setError } = methods;

  useEffect(() => {
    if (current) reset(toFormValues(current));
  }, [current, reset]);

  function commonFromValues(v: TerminalFormValues): TerminalCommon {
    return {
      // Vacío → undefined: el backend autogenera el correlativo por sucursal.
      code: v.code?.trim() || undefined,
      name: v.name?.trim() || undefined,
    };
  }

  const submitSingle = handleSubmit(async (values) => {
    if (!values.branchId) {
      setError('branchId', { message: 'Selecciona una sucursal' });
      return;
    }
    await onSubmit({ branchId: values.branchId, ...commonFromValues(values) });
  });

  const submitBulk = async () => {
    const ok = await trigger(['name']);
    if (!ok) return;
    if (branchIds.length === 0) {
      setBranchError('Selecciona al menos una sucursal');
      return;
    }
    await onBulkSubmit?.(commonFromValues(getValues()), branchIds);
  };

  return (
    <Form methods={methods} onSubmit={submitSingle}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          {isEdit ? (
            <Field.IdAutocomplete
              name="branchId"
              label="Sucursal"
              placeholder="Buscar sucursal por nombre…"
              loading={loadingBranches}
              options={branches.map((b) => ({ id: b.id, label: b.name }))}
            />
          ) : (
            <Autocomplete
              multiple
              disableCloseOnSelect
              loading={loadingBranches}
              options={branches}
              getOptionLabel={(b) => b.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={branches.filter((b) => branchIds.includes(b.id))}
              onChange={(_, val) => {
                setBranchIds(val.map((b) => b.id));
                setBranchError(null);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sucursales"
                  placeholder="Buscar y seleccionar una o varias…"
                  error={!!branchError}
                  helperText={
                    branchError ??
                    'El código de cada caja lo genera el sistema (correlativo por sucursal).'
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* El código lo asigna el sistema (correlativo por sucursal). En
                edición se muestra de solo lectura para no romper la serie. */}
            {isEdit && current?.code && (
              <TextField
                label="Código"
                value={current.code}
                disabled
                helperText="Asignado por el sistema"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 160 }, flexShrink: 0 }}
              />
            )}
            <Field.Text
              name="name"
              label="Nombre (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>
        </Stack>
      </Card>

      <FormFooter>
        {onCancel && (
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        {isEdit ? (
          <Button type="submit" variant="contained" loading={submitting}>
            Guardar cambios
          </Button>
        ) : (
          <Button type="button" variant="contained" loading={submitting} onClick={submitBulk}>
            {branchIds.length > 1 ? `Crear en ${branchIds.length} sucursales` : 'Crear terminal'}
          </Button>
        )}
      </FormFooter>
    </Form>
  );
}
