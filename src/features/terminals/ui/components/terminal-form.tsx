import type { Terminal, CreateTerminalPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';

// ----------------------------------------------------------------------

export const TerminalSchema = z.object({
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  // .trim() antes de min(1) para rechazar entradas que solo tienen espacios.
  code: z.string().trim().min(1, { message: 'Código obligatorio' }).max(20),
  name: z.string().max(100).optional().or(z.literal('')),
});

export type TerminalFormValues = z.infer<typeof TerminalSchema>;

type Props = {
  current?: Terminal;
  submitting?: boolean;
  onSubmit: (values: CreateTerminalPayload) => Promise<void> | void;
  onCancel?: () => void;
};

function toFormValues(t?: Terminal): TerminalFormValues {
  return {
    branchId: t?.branchId ?? '',
    code: t?.code ?? '',
    name: t?.name ?? '',
  };
}

export function TerminalForm({ current, submitting, onSubmit, onCancel }: Props) {
  const { data: branches = [], isLoading: loadingBranches } = useBranchesQuery();

  const methods = useForm<TerminalFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(TerminalSchema),
    defaultValues: toFormValues(current),
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) reset(toFormValues(current));
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      branchId: values.branchId,
      code: values.code.trim(),
      name: values.name?.trim() || undefined,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Select
            name="branchId"
            label="Sucursal"
            disabled={loadingBranches}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">— Selecciona una sucursal —</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="code"
              label="Código"
              placeholder="Ej. POS-01"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 160 }, flexShrink: 0 }}
            />
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
        <Button type="submit" variant="contained" loading={submitting}>
          {current ? 'Guardar cambios' : 'Crear terminal'}
        </Button>
      </FormFooter>
    </Form>
  );
}
