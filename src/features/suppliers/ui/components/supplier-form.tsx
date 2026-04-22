import type { Supplier, CreateSupplierPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';

// ----------------------------------------------------------------------

const RIF_REGEX = /^[VEJGP]-\d{7,9}-\d$/;
const PHONE_REGEX = /^\+58[24]\d{9}$/;

export const SupplierSchema = z.object({
  rif: z
    .string()
    .min(1, { message: 'RIF obligatorio' })
    .regex(RIF_REGEX, { message: 'Formato esperado: J-12345678-9 (V/E/J/G/P)' }),
  businessName: z.string().min(1, { message: 'Razón social obligatoria' }).max(200),
  tradeName: z.string().max(200).optional().or(z.literal('')),
  contactName: z.string().max(150).optional().or(z.literal('')),
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
    .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), {
      message: 'Email inválido',
    }),
  address: z.string().optional().or(z.literal('')),
  isDrugstore: z.boolean(),
  paymentTermsDays: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^\d+$/.test(v), { message: 'Debe ser un número entero' }),
  consignmentCommissionPct: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), { message: 'Debe ser un número' }),
});

export type SupplierFormValues = z.infer<typeof SupplierSchema>;

type Props = {
  current?: Supplier;
  submitting?: boolean;
  onSubmit: (values: CreateSupplierPayload) => Promise<void> | void;
  onCancel?: () => void;
};

function toFormValues(s?: Supplier): SupplierFormValues {
  return {
    rif: s?.rif ?? '',
    businessName: s?.businessName ?? '',
    tradeName: s?.tradeName ?? '',
    contactName: s?.contactName ?? '',
    phone: s?.phone ?? '',
    email: s?.email ?? '',
    address: s?.address ?? '',
    isDrugstore: s?.isDrugstore ?? false,
    paymentTermsDays: s?.paymentTermsDays != null ? String(s.paymentTermsDays) : '',
    consignmentCommissionPct:
      s?.consignmentCommissionPct != null ? String(s.consignmentCommissionPct) : '',
  };
}

export function SupplierForm({ current, submitting, onSubmit, onCancel }: Props) {
  const methods = useForm<SupplierFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(SupplierSchema),
    defaultValues: toFormValues(current),
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) reset(toFormValues(current));
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      rif: values.rif.trim(),
      businessName: values.businessName.trim(),
      tradeName: values.tradeName?.trim() || undefined,
      contactName: values.contactName?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
      address: values.address?.trim() || undefined,
      isDrugstore: values.isDrugstore,
      paymentTermsDays: values.paymentTermsDays ? Number(values.paymentTermsDays) : undefined,
      consignmentCommissionPct: values.consignmentCommissionPct
        ? Number(values.consignmentCommissionPct)
        : undefined,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Información fiscal
          </Typography>

          <Field.Identification name="rif" kind="rif" label="RIF" />

          <Field.Text
            name="businessName"
            label="Razón social"
            placeholder="Ej. Distribuidora Farmacéutica ABC"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Field.Text
            name="tradeName"
            label="Nombre comercial (opcional)"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Contacto
          </Typography>

          <Field.Text
            name="contactName"
            label="Nombre del contacto (opcional)"
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

          <Field.Text
            name="address"
            label="Dirección (opcional)"
            multiline
            minRows={2}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Condiciones comerciales
          </Typography>

          <Field.Switch
            name="isDrugstore"
            label="Es droguería con API B2B"
            helperText="Marca si el proveedor ofrece integración automática de catálogo y pedidos."
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="paymentTermsDays"
              label="Días de crédito"
              placeholder="Ej. 30"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="consignmentCommissionPct"
              label="Comisión consignación (%)"
              placeholder="Ej. 15"
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
          {current ? 'Guardar cambios' : 'Crear proveedor'}
        </Button>
      </FormFooter>
    </Form>
  );
}
