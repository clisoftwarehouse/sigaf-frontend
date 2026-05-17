import type { Supplier, CreateSupplierPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';

// ----------------------------------------------------------------------

// RIF venezolano:
//   - Jurídico / Gobierno (J/G): 8 dígitos + 1 verificador (J-12345678-9)
//   - Natural / Pasaporte (V/E/P): 8 dígitos sin verificador (V-12345678)
const RIF_REGEX = /^(?:[JG]-\d{8}-\d|[VEP]-\d{8})$/;
const PHONE_REGEX = /^\+58[24]\d{9}$/;

export const SupplierSchema = z.object({
  rif: z
    .string()
    .min(1, { message: 'RIF obligatorio' })
    .regex(RIF_REGEX, {
      message:
        'Formato: J-12345678-9 (jurídico, con DV) o V-12345678 (natural, sin DV)',
    }),
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
  invoicesInCurrency: z.enum(['USD', 'VES']),
  // Descuentos comerciales (BI): switch + porcentaje típico opcional.
  hasHeaderDiscount: z.boolean(),
  headerDiscountPct: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 100), {
      message: 'Entre 0 y 100',
    }),
  hasLinearDiscount: z.boolean(),
  linearDiscountPct: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 100), {
      message: 'Entre 0 y 100',
    }),
  hasPromptPaymentDiscount: z.boolean(),
  promptPaymentDiscountPct: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 100), {
      message: 'Entre 0 y 100',
    }),
  hasVolumeDiscount: z.boolean(),
  volumeDiscountPct: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 100), {
      message: 'Entre 0 y 100',
    }),
});

export type SupplierFormValues = z.infer<typeof SupplierSchema>;

type Props = {
  current?: Supplier;
  submitting?: boolean;
  onSubmit: (values: CreateSupplierPayload) => Promise<void> | void;
  onCancel?: () => void;
};

function toFormValues(s?: Supplier): SupplierFormValues {
  const pct = (v: number | string | null | undefined): string =>
    v == null || v === '' ? '' : String(Number(v));
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
    invoicesInCurrency: s?.invoicesInCurrency ?? 'USD',
    hasHeaderDiscount: s?.hasHeaderDiscount ?? false,
    headerDiscountPct: pct(s?.headerDiscountPct),
    hasLinearDiscount: s?.hasLinearDiscount ?? false,
    linearDiscountPct: pct(s?.linearDiscountPct),
    hasPromptPaymentDiscount: s?.hasPromptPaymentDiscount ?? false,
    promptPaymentDiscountPct: pct(s?.promptPaymentDiscountPct),
    hasVolumeDiscount: s?.hasVolumeDiscount ?? false,
    volumeDiscountPct: pct(s?.volumeDiscountPct),
  };
}

export function SupplierForm({ current, submitting, onSubmit, onCancel }: Props) {
  const methods = useForm<SupplierFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(SupplierSchema),
    defaultValues: toFormValues(current),
  });

  const { handleSubmit, reset, control } = methods;

  // Watch para mostrar el input % solo cuando el switch correspondiente está ON.
  const hasHeader = useWatch({ control, name: 'hasHeaderDiscount' });
  const hasLinear = useWatch({ control, name: 'hasLinearDiscount' });
  const hasPrompt = useWatch({ control, name: 'hasPromptPaymentDiscount' });
  const hasVolume = useWatch({ control, name: 'hasVolumeDiscount' });

  useEffect(() => {
    if (current) reset(toFormValues(current));
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    // Si el switch del descuento está OFF, no enviamos el % (queda NULL en BD)
    // aunque el operador haya escrito un número y luego apagado el switch.
    const pctIfOn = (on: boolean, raw: string): number | undefined =>
      on && raw ? Number(raw) : undefined;
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
      invoicesInCurrency: values.invoicesInCurrency,
      hasHeaderDiscount: values.hasHeaderDiscount,
      headerDiscountPct: pctIfOn(values.hasHeaderDiscount, values.headerDiscountPct ?? ''),
      hasLinearDiscount: values.hasLinearDiscount,
      linearDiscountPct: pctIfOn(values.hasLinearDiscount, values.linearDiscountPct ?? ''),
      hasPromptPaymentDiscount: values.hasPromptPaymentDiscount,
      promptPaymentDiscountPct: pctIfOn(
        values.hasPromptPaymentDiscount,
        values.promptPaymentDiscountPct ?? ''
      ),
      hasVolumeDiscount: values.hasVolumeDiscount,
      volumeDiscountPct: pctIfOn(values.hasVolumeDiscount, values.volumeDiscountPct ?? ''),
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

          <Field.Select
            name="invoicesInCurrency"
            label="Moneda de facturación"
            helperText="Pre-selecciona la moneda al registrar recepciones. Puede sobreescribirse caso por caso."
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="USD">USD — Dólares</MenuItem>
            <MenuItem value="VES">VES — Bolívares</MenuItem>
          </Field.Select>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* ─── Descuentos comerciales (para análisis BI) ─── */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Descuentos comerciales
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', display: 'block', mb: 1.5 }}
            >
              Marca los tipos de descuento que ofrece este proveedor. Si conoces el porcentaje
              típico, agrégalo — BI lo usa para análisis comparativo.
            </Typography>

            <Stack spacing={1.5}>
              <DiscountRow
                switchName="hasHeaderDiscount"
                pctName="headerDiscountPct"
                label="Descuento de cabecera"
                helperText="Aplicado al subtotal de la factura."
                showPct={hasHeader}
              />
              <DiscountRow
                switchName="hasLinearDiscount"
                pctName="linearDiscountPct"
                label="Descuento lineal"
                helperText="Aplicado por línea de producto."
                showPct={hasLinear}
              />
              <DiscountRow
                switchName="hasPromptPaymentDiscount"
                pctName="promptPaymentDiscountPct"
                label="Descuento por pronto pago"
                helperText="Si se paga antes del plazo acordado."
                showPct={hasPrompt}
              />
              <DiscountRow
                switchName="hasVolumeDiscount"
                pctName="volumeDiscountPct"
                label="Descuento por volumen"
                helperText="A partir de cierta cantidad / monto comprado."
                showPct={hasVolume}
              />
            </Stack>
          </Box>

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

// ----------------------------------------------------------------------

type DiscountRowProps = {
  switchName: string;
  pctName: string;
  label: string;
  helperText: string;
  showPct: boolean;
};

/**
 * Fila reutilizable para los 4 descuentos: switch a la izquierda + input %
 * a la derecha que aparece solo cuando el switch está ON. Mantiene el
 * helper text del switch siempre visible para que el operador entienda el
 * tipo de descuento aunque no lo active.
 */
function DiscountRow({ switchName, pctName, label, helperText, showPct }: DiscountRowProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      sx={{ minHeight: 56 }}
    >
      <Box sx={{ flex: 1 }}>
        <Field.Switch name={switchName} label={label} helperText={helperText} />
      </Box>
      {showPct && (
        <Field.Text
          name={pctName}
          label="% típico"
          placeholder="Ej. 12.5"
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
              inputProps: { inputMode: 'decimal' },
            },
          }}
          sx={{ width: { xs: '100%', sm: 160 }, flexShrink: 0 }}
        />
      )}
    </Stack>
  );
}
