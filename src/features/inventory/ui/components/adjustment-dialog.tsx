import type { InventoryLot, CreateAdjustmentPayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Form, Field } from '@/app/components/hook-form';

import { ADJUSTMENT_TYPE_OPTIONS } from '../../model/constants';
import { useCreateAdjustmentMutation } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

const AdjustmentSchema = z.object({
  adjustmentType: z.enum(['damage', 'correction', 'count_difference', 'expiry_write_off']),
  direction: z.enum(['in', 'out']),
  quantity: z
    .string()
    .min(1, { message: 'Cantidad obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, {
      message: 'Debe ser un número positivo',
    }),
  reason: z.string().min(10, { message: 'Mínimo 10 caracteres' }),
});

type AdjustmentFormValues = z.infer<typeof AdjustmentSchema>;

type Props = {
  lot: InventoryLot | null;
  onClose: () => void;
};

export function AdjustmentDialog({ lot, onClose }: Props) {
  const mutation = useCreateAdjustmentMutation();

  const methods = useForm<AdjustmentFormValues>({
    resolver: zodResolver(AdjustmentSchema),
    defaultValues: {
      adjustmentType: 'damage',
      direction: 'out',
      quantity: '',
      reason: '',
    },
  });

  useEffect(() => {
    if (lot) {
      methods.reset({
        adjustmentType: 'damage',
        direction: 'out',
        quantity: '',
        reason: '',
      });
    }
  }, [lot, methods]);

  if (!lot) return null;

  const available = Number(lot.quantityAvailable) || 0;

  const submit = methods.handleSubmit(async (values) => {
    const qty = Number(values.quantity);
    const signedQty = values.direction === 'out' ? -qty : qty;

    if (values.direction === 'out' && qty > available) {
      toast.error(`No puedes retirar más de ${available} (cantidad disponible)`);
      return;
    }

    const payload: CreateAdjustmentPayload = {
      productId: lot.productId,
      lotId: lot.id,
      branchId: lot.branchId,
      adjustmentType: values.adjustmentType,
      quantity: signedQty,
      reason: values.reason.trim(),
    };

    try {
      await mutation.mutateAsync(payload);
      toast.success('Ajuste registrado');
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <Dialog open={!!lot} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <Form methods={methods} onSubmit={submit}>
        <DialogTitle>Nuevo ajuste de inventario</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Lote <strong>{lot.lotNumber}</strong> · disponible: {available}
            </Alert>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Field.Select
                name="adjustmentType"
                label="Tipo de ajuste"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              >
                {ADJUSTMENT_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select
                name="direction"
                label="Dirección"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              >
                <MenuItem value="out">Salida (−)</MenuItem>
                <MenuItem value="in">Entrada (+)</MenuItem>
              </Field.Select>
            </Stack>

            <Field.Text
              name="quantity"
              label="Cantidad"
              placeholder="Ej. 5"
              type="number"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0, step: 0.001 } }}
            />

            <Field.Text
              name="reason"
              label="Razón"
              placeholder="Explica el motivo (mínimo 10 caracteres)"
              multiline
              minRows={3}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Se registrará automáticamente en el kardex como movimiento inmutable.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            Registrar ajuste
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
