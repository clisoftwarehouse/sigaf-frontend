import type { Warehouse, CreateWarehousePayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';

// ----------------------------------------------------------------------

export const WarehouseSchema = z.object({
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  locationCode: z.string().min(1, { message: 'Código obligatorio' }).max(30),
  name: z.string().max(100).optional().or(z.literal('')),
  isQuarantine: z.boolean(),
  isForSale: z.boolean(),
  isForPurchase: z.boolean(),
});

export type WarehouseFormValues = z.infer<typeof WarehouseSchema>;

type Props = {
  current?: Warehouse;
  submitting?: boolean;
  onSubmit: (values: CreateWarehousePayload) => Promise<void> | void;
  onCancel?: () => void;
};

function toFormValues(w?: Warehouse): WarehouseFormValues {
  return {
    branchId: w?.branchId ?? '',
    locationCode: w?.locationCode ?? '',
    name: w?.name ?? '',
    isQuarantine: w?.isQuarantine ?? false,
    isForSale: w?.isForSale ?? true,
    isForPurchase: w?.isForPurchase ?? true,
  };
}

export function WarehouseForm({ current, submitting, onSubmit, onCancel }: Props) {
  const { data: branches = [], isLoading: loadingBranches } = useBranchesQuery();

  const methods = useForm<WarehouseFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(WarehouseSchema),
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
      name: values.name?.trim() || undefined,
      isQuarantine: values.isQuarantine,
      isForSale: values.isForSale,
      isForPurchase: values.isForPurchase,
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
            label="Código del almacén"
            placeholder="Ej. VTA, REC, QRT"
            helperText="Debe ser único dentro de la sucursal."
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            name="name"
            label="Nombre (opcional)"
            placeholder="Ej. Sala de ventas, Recepción, Cuarentena"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            Uso del almacén
          </Typography>

          <Field.Switch
            name="isForSale"
            label="Activo para venta"
            helperText="El stock de este almacén está disponible para venta en POS."
          />

          <Field.Switch
            name="isForPurchase"
            label="Activo para compra"
            helperText="Las recepciones de compra pueden ingresar mercancía a este almacén."
          />

          <Field.Switch
            name="isQuarantine"
            label="Zona de cuarentena"
            helperText="Mercancía retenida; no se vende ni se transfiere automáticamente."
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
          {current ? 'Guardar cambios' : 'Crear almacén'}
        </Button>
      </FormFooter>
    </Form>
  );
}
