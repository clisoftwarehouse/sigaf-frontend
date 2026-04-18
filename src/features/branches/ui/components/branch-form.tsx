import type { Branch, CreateBranchPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Form, Field } from '@/app/components/hook-form';

// ----------------------------------------------------------------------

export const BranchSchema = z.object({
  name: z.string().min(1, { message: 'Nombre obligatorio' }).max(100),
  rif: z.string().min(1, { message: 'RIF obligatorio' }).max(20),
  address: z.string().min(1, { message: 'Dirección obligatoria' }),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z
    .string()
    .max(150)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { message: 'Email inválido' }),
});

export type BranchFormValues = z.infer<typeof BranchSchema>;

type Props = {
  current?: Branch;
  submitting?: boolean;
  onSubmit: (values: CreateBranchPayload) => Promise<void> | void;
  onCancel?: () => void;
};

export function BranchForm({ current, submitting, onSubmit, onCancel }: Props) {
  const methods = useForm<BranchFormValues>({
    resolver: zodResolver(BranchSchema),
    defaultValues: {
      name: current?.name ?? '',
      rif: current?.rif ?? '',
      address: current?.address ?? '',
      phone: current?.phone ?? '',
      email: current?.email ?? '',
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) {
      reset({
        name: current.name,
        rif: current.rif,
        address: current.address,
        phone: current.phone ?? '',
        email: current.email ?? '',
      });
    }
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      rif: values.rif.trim(),
      address: values.address.trim(),
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="name"
              label="Nombre"
              placeholder="Ej. Farmacia Principal"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="rif"
              label="RIF"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 200 }, flexShrink: 0 }}
            />
          </Stack>

          <Field.Text
            name="address"
            label="Dirección"
            multiline
            minRows={2}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="phone"
              label="Teléfono (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="email"
              label="Email (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              {current ? 'Guardar cambios' : 'Crear sucursal'}
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
