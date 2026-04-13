import type { Brand, CreateBrandPayload } from '../../model/types';

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

export const BrandSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'Máximo 100 caracteres' }),
  isLaboratory: z.boolean(),
});

export type BrandFormValues = z.infer<typeof BrandSchema>;

type Props = {
  current?: Brand;
  submitting?: boolean;
  onSubmit: (values: CreateBrandPayload) => Promise<void> | void;
  onCancel?: () => void;
};

export function BrandForm({ current, submitting, onSubmit, onCancel }: Props) {
  const methods = useForm<BrandFormValues>({
    resolver: zodResolver(BrandSchema),
    defaultValues: {
      name: current?.name ?? '',
      isLaboratory: current?.isLaboratory ?? false,
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) {
      reset({ name: current.name, isLaboratory: current.isLaboratory });
    }
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({ name: values.name.trim(), isLaboratory: values.isLaboratory });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Text
            name="name"
            label="Nombre"
            placeholder="Ej. Bayer"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Switch
            name="isLaboratory"
            label="Es laboratorio farmacéutico"
            helperText="Marca esta opción si la marca corresponde a un laboratorio."
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              {current ? 'Guardar cambios' : 'Crear marca'}
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
