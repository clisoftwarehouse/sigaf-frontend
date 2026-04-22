import type { WarehouseLocation, CreateLocationPayload } from '../../model/types';

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

export const LocationSchema = z.object({
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  locationCode: z.string().min(1, { message: 'Código obligatorio' }).max(30),
  aisle: z.string().max(10).optional().or(z.literal('')),
  shelf: z.string().max(10).optional().or(z.literal('')),
  section: z.string().max(10).optional().or(z.literal('')),
  capacity: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), { message: 'Debe ser un número' }),
  isQuarantine: z.boolean(),
});

export type LocationFormValues = z.infer<typeof LocationSchema>;

type Props = {
  current?: WarehouseLocation;
  submitting?: boolean;
  onSubmit: (values: CreateLocationPayload) => Promise<void> | void;
  onCancel?: () => void;
};

function toFormValues(l?: WarehouseLocation): LocationFormValues {
  return {
    branchId: l?.branchId ?? '',
    locationCode: l?.locationCode ?? '',
    aisle: l?.aisle ?? '',
    shelf: l?.shelf ?? '',
    section: l?.section ?? '',
    capacity: l?.capacity != null ? String(l.capacity) : '',
    isQuarantine: l?.isQuarantine ?? false,
  };
}

export function LocationForm({ current, submitting, onSubmit, onCancel }: Props) {
  const { data: branches = [], isLoading: loadingBranches } = useBranchesQuery();

  const methods = useForm<LocationFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(LocationSchema),
    defaultValues: toFormValues(current),
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) reset(toFormValues(current));
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      branchId: values.branchId,
      locationCode: values.locationCode.trim(),
      aisle: values.aisle?.trim() || undefined,
      shelf: values.shelf?.trim() || undefined,
      section: values.section?.trim() || undefined,
      capacity: values.capacity ? Number(values.capacity) : undefined,
      isQuarantine: values.isQuarantine,
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

          <Field.Text
            name="locationCode"
            label="Código de ubicación"
            placeholder="Ej. A-01-03"
            helperText="Debe ser único dentro de la sucursal."
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="aisle"
              label="Pasillo (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="shelf"
              label="Estante (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="section"
              label="Sección (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Field.Text
            name="capacity"
            label="Capacidad (unidades, opcional)"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Switch
            name="isQuarantine"
            label="Zona de cuarentena"
            helperText="Las ubicaciones en cuarentena no pueden usarse para venta."
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
          {current ? 'Guardar cambios' : 'Crear ubicación'}
        </Button>
      </FormFooter>
    </Form>
  );
}
