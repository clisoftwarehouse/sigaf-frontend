import type { InventoryLot, UpdateLotPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { Form, Field } from '@/app/components/hook-form';
import { useLocationsQuery } from '@/features/locations/api/locations.queries';

import { LOT_STATUS_OPTIONS } from '../../model/constants';

// ----------------------------------------------------------------------

export const LotUpdateSchema = z.object({
  salePrice: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0), {
      message: 'Debe ser un número ≥ 0',
    }),
  locationId: z.string().optional().or(z.literal('')),
  status: z.enum(['available', 'quarantine', 'expired', 'returned', 'depleted']),
});

export type LotUpdateFormValues = z.infer<typeof LotUpdateSchema>;

type Props = {
  current: InventoryLot;
  submitting?: boolean;
  onSubmit: (payload: UpdateLotPayload) => Promise<void> | void;
  onCancel?: () => void;
};

export function LotEditForm({ current, submitting, onSubmit, onCancel }: Props) {
  const { data: locations = [] } = useLocationsQuery({ branchId: current.branchId });

  const methods = useForm<LotUpdateFormValues>({
    resolver: zodResolver(LotUpdateSchema),
    defaultValues: {
      salePrice: String(current.salePrice ?? ''),
      locationId: current.locationId ?? '',
      status: current.status,
    },
  });

  useEffect(() => {
    methods.reset({
      salePrice: String(current.salePrice ?? ''),
      locationId: current.locationId ?? '',
      status: current.status,
    });
  }, [current, methods]);

  const submit = methods.handleSubmit(async (values) => {
    await onSubmit({
      salePrice: values.salePrice ? Number(values.salePrice) : undefined,
      locationId: values.locationId || undefined,
      status: values.status,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Solo se pueden editar precio, ubicación y estado. Para cambios de cantidad usa
            &quot;Nuevo ajuste&quot; desde la lista.
          </Typography>

          <Field.Text
            name="salePrice"
            label="Precio de venta"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Select
            name="locationId"
            label="Ubicación en almacén"
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">— Sin ubicación específica —</MenuItem>
            {locations.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.locationCode}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select
            name="status"
            label="Estado"
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {LOT_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              Guardar cambios
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
