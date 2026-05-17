import type { Branch, CreateBranchPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';

// ----------------------------------------------------------------------

// Las sucursales son siempre personas jurídicas: solo se acepta prefijo J.
// RIF venezolano: J + 8 dígitos + 1 verificador.
const RIF_REGEX = /^J-\d{8}-\d$/;
const PHONE_REGEX = /^\+58[24]\d{9}$/;

export const BranchSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nombre obligatorio' }).max(100),
  rif: z
    .string()
    .min(1, { message: 'RIF obligatorio' })
    .regex(RIF_REGEX, { message: 'Formato esperado: J-12345678-9 (8 dígitos + verificador)' }),
  address: z.string().trim().min(1, { message: 'Dirección obligatoria' }),
  phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || PHONE_REGEX.test(v), { message: 'Teléfono venezolano inválido' }),
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
    mode: 'onBlur',
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
          <Field.Text
            name="name"
            label="Nombre"
            placeholder="Ej. Farmacia Principal"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Identification
            name="rif"
            kind="rif"
            label="RIF"
            allowedPrefixes={['J']}
          />

          <Field.Text
            name="address"
            label="Dirección"
            multiline
            minRows={2}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Phone name="phone" label="Teléfono (opcional)" sx={{ flex: 1 }} />
            <Field.Text
              name="email"
              label="Email (opcional)"
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
          {current ? 'Guardar cambios' : 'Crear sucursal'}
        </Button>
      </FormFooter>
    </Form>
  );
}
