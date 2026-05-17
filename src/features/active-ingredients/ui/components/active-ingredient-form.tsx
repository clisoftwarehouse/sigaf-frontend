import type { ActiveIngredient, CreateActiveIngredientPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { useTherapeuticUseOptions } from '@/features/therapeutic-uses/api/therapeutic-uses.options';

// ----------------------------------------------------------------------

export const ActiveIngredientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(200, { message: 'Máximo 200 caracteres' }),
  therapeuticUseId: z.string().uuid().optional().or(z.literal('')),
  // ATC e INN se mantienen en el modelo (datos maestros pre-cargados desde
  // Vademecum) pero ya no se piden al crear manualmente. Quedan vacíos si el
  // operador agrega un PA a mano; el job de scraping los rellena después.
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
  const { data: therapeuticUseOptions = [], isLoading: loadingUses } = useTherapeuticUseOptions();

  const methods = useForm<ActiveIngredientFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(ActiveIngredientSchema),
    defaultValues: {
      name: current?.name ?? '',
      therapeuticUseId: current?.therapeuticUseId ?? '',
      atcCode: current?.atcCode ?? '',
      innName: current?.innName ?? '',
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) {
      reset({
        name: current.name,
        therapeuticUseId: current.therapeuticUseId ?? '',
        atcCode: current.atcCode ?? '',
        innName: current.innName ?? '',
      });
    }
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      therapeuticUseId: values.therapeuticUseId ? values.therapeuticUseId : undefined,
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

          <Field.IdAutocomplete
            name="therapeuticUseId"
            label="Acción terapéutica"
            placeholder="Buscar acción terapéutica…"
            options={therapeuticUseOptions}
            loading={loadingUses}
            helperText="Determina cómo se filtra el producto que use este principio activo. Los datos ATC/INN se completan automáticamente desde Vademecum."
          />
        </Stack>
      </Card>

      <FormFooter>
        {onCancel && (
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="contained" loading={submitting}>
          {current ? 'Guardar cambios' : 'Crear principio activo'}
        </Button>
      </FormFooter>
    </Form>
  );
}
