import type { Brand, CreateBrandPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';

// ----------------------------------------------------------------------

export const BrandSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'Máximo 100 caracteres' }),
  isLaboratory: z.boolean(),
  isActive: z.boolean(),
});

export type BrandFormValues = z.infer<typeof BrandSchema>;

type Props = {
  current?: Brand;
  submitting?: boolean;
  onSubmit: (values: CreateBrandPayload) => Promise<void> | void;
  onCancel?: () => void;
};

const defaults = (current?: Brand): BrandFormValues => ({
  name: current?.name ?? '',
  isLaboratory: current?.isLaboratory ?? false,
  isActive: current?.isActive ?? true,
});

export function BrandForm({ current, submitting, onSubmit, onCancel }: Props) {
  const methods = useForm<BrandFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(BrandSchema),
    defaultValues: defaults(current),
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) reset(defaults(current));
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    const payload: CreateBrandPayload = {
      name: values.name.trim(),
      isLaboratory: values.isLaboratory,
      isActive: values.isActive,
    };
    await onSubmit(payload);
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
          Datos de la marca
        </Typography>

        <Stack spacing={2}>
          <Field.Text
            name="name"
            label="Nombre"
            placeholder="Ej. Bayer"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Field.Switch name="isLaboratory" label="Es laboratorio" />
            <Field.Switch name="isActive" label="Activa" />
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
          {current ? 'Guardar cambios' : 'Crear marca'}
        </Button>
      </FormFooter>
    </Form>
  );
}
