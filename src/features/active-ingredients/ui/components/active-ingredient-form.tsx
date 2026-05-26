import type { ActiveIngredient, CreateActiveIngredientPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

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
  // QA #100: un PA puede tener varias acciones terapéuticas (M2M).
  therapeuticUseIds: z.array(z.string().uuid()),
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

/**
 * Deriva los IDs iniciales de acciones terapéuticas a partir de la relación
 * M2M (`therapeuticUses`); si no viene poblada, hace fallback al ID legacy
 * (`therapeuticUseId`) — útil para PAs creados antes del refactor M2M.
 */
function initialTherapeuticUseIds(current?: ActiveIngredient): string[] {
  if (current?.therapeuticUses?.length) {
    return current.therapeuticUses.map((t) => t.id);
  }
  return current?.therapeuticUseId ? [current.therapeuticUseId] : [];
}

export function ActiveIngredientForm({ current, submitting, onSubmit, onCancel }: Props) {
  const { data: therapeuticUseOptions = [], isLoading: loadingUses } = useTherapeuticUseOptions();

  const methods = useForm<ActiveIngredientFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(ActiveIngredientSchema),
    defaultValues: {
      name: current?.name ?? '',
      therapeuticUseIds: initialTherapeuticUseIds(current),
      atcCode: current?.atcCode ?? '',
      innName: current?.innName ?? '',
    },
  });

  const { control, handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) {
      reset({
        name: current.name,
        therapeuticUseIds: initialTherapeuticUseIds(current),
        atcCode: current.atcCode ?? '',
        innName: current.innName ?? '',
      });
    }
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      therapeuticUseIds: values.therapeuticUseIds.length ? values.therapeuticUseIds : undefined,
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

          {/* Multi-select de acciones terapéuticas. Ej. AAS = analgésico +
             antiinflamatorio + antiplaquetario. Los datos ATC/INN se
             completan automáticamente desde Vademecum. */}
          <Controller
            name="therapeuticUseIds"
            control={control}
            render={({ field, fieldState }) => {
              const selected = therapeuticUseOptions.filter((o) => field.value?.includes(o.id));
              return (
                <Autocomplete
                  multiple
                  options={therapeuticUseOptions}
                  value={selected}
                  onChange={(_e, next) => field.onChange(next.map((o) => o.id))}
                  loading={loadingUses}
                  getOptionLabel={(o) => o.label ?? ''}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  filterSelectedOptions
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>{option.label}</Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Acciones terapéuticas"
                      placeholder="Selecciona una o varias…"
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message ??
                        'Un principio activo puede tener varias acciones (analgésico, antiinflamatorio, etc.).'
                      }
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              );
            }}
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
