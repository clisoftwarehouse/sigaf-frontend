import type { ActiveIngredient, CreateActiveIngredientPayload } from '../../model/types';

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

export const ActiveIngredientSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }).max(200),
  therapeuticGroup: z.string().max(100).optional().or(z.literal('')),
  atcCode: z.string().max(20).optional().or(z.literal('')),
  innName: z.string().max(200).optional().or(z.literal('')),
});

export type ActiveIngredientFormValues = z.infer<typeof ActiveIngredientSchema>;

type Props = {
  current?: ActiveIngredient;
  submitting?: boolean;
  onSubmit: (values: CreateActiveIngredientPayload) => Promise<void> | void;
  onCancel?: () => void;
};

export function ActiveIngredientForm({ current, submitting, onSubmit, onCancel }: Props) {
  const methods = useForm<ActiveIngredientFormValues>({
    resolver: zodResolver(ActiveIngredientSchema),
    defaultValues: {
      name: current?.name ?? '',
      therapeuticGroup: current?.therapeuticGroup ?? '',
      atcCode: current?.atcCode ?? '',
      innName: current?.innName ?? '',
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) {
      reset({
        name: current.name,
        therapeuticGroup: current.therapeuticGroup ?? '',
        atcCode: current.atcCode ?? '',
        innName: current.innName ?? '',
      });
    }
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      therapeuticGroup: values.therapeuticGroup ? values.therapeuticGroup.trim() : undefined,
      atcCode: values.atcCode ? values.atcCode.trim().toUpperCase() : undefined,
      innName: values.innName ? values.innName.trim() : undefined,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Text
            name="name"
            label="Nombre"
            placeholder="Ej. Losartán Potásico"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="atcCode"
              label="Código ATC (opcional)"
              placeholder="Ej. C09CA01"
              helperText="Clasificación internacional ATC (WHO). Se puede autocompletar desde Vademecum."
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="innName"
              label="Nombre INN (opcional)"
              placeholder="Denominación Común Internacional"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Field.Text
            name="therapeuticGroup"
            label="Grupo terapéutico (opcional)"
            placeholder="Ej. Antihipertensivos"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              {current ? 'Guardar cambios' : 'Crear principio activo'}
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
