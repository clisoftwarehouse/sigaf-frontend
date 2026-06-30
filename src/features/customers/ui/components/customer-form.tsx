import type { Customer, CreateCustomerPayload } from '../../model/types';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { ConditionsMultiSelect } from '@/features/clinical-conditions/ui/conditions-multi-select';
import { type ClinicalCondition } from '@/features/clinical-conditions/api/clinical-conditions.api';

import { CUSTOMER_TYPES, CUSTOMER_DOCUMENT_TYPES } from '../../model/types';

const toConditions = (current?: Customer): ClinicalCondition[] =>
  (current?.clinicalConditions ?? []).map((c) => ({ ...c, isSeed: false, isActive: true }));

// ----------------------------------------------------------------------

const DOC_REGEX = /^[A-Za-z0-9]{6,15}$/;

export const CustomerSchema = z.object({
  documentType: z.enum(CUSTOMER_DOCUMENT_TYPES),
  documentNumber: z
    .string()
    .min(6, { message: 'Mínimo 6 caracteres' })
    .max(15, { message: 'Máximo 15 caracteres' })
    .regex(DOC_REGEX, { message: 'Sólo letras y números' }),
  fullName: z
    .string()
    .min(2, { message: 'Nombre obligatorio' })
    .max(150, { message: 'Máximo 150 caracteres' }),
  customerType: z.enum(CUSTOMER_TYPES),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  defaultDiscountPercent: z
    .number()
    .min(0, { message: 'No puede ser negativo' })
    .max(100, { message: 'Máximo 100%' }),
  creditLimitUsd: z.number().min(0, { message: 'No puede ser negativo' }),
  notes: z.string().optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  refillReminders: z.boolean(),
  isActive: z.boolean(),
});

export type CustomerFormValues = z.infer<typeof CustomerSchema>;

type Props = {
  current?: Customer;
  submitting?: boolean;
  onSubmit: (values: CreateCustomerPayload) => Promise<void> | void;
  onCancel?: () => void;
};

const defaults = (current?: Customer): CustomerFormValues => ({
  documentType: current?.documentType ?? 'V',
  documentNumber: current?.documentNumber ?? '',
  fullName: current?.fullName ?? '',
  customerType: current?.customerType ?? 'retail',
  phone: current?.phone ?? '',
  email: current?.email ?? '',
  address: current?.address ?? '',
  defaultDiscountPercent: Number(current?.defaultDiscountPercent ?? 0),
  creditLimitUsd: Number(current?.creditLimitUsd ?? 0),
  notes: current?.notes ?? '',
  birthDate: current?.birthDate ?? '',
  refillReminders: !(current?.refillRemindersOptOut ?? false),
  isActive: current?.isActive ?? true,
});

const TYPE_LABEL: Record<(typeof CUSTOMER_TYPES)[number], string> = {
  retail: 'Mostrador',
  frecuente: 'Frecuente',
  corporativo: 'Corporativo',
};

const DOC_LABEL: Record<(typeof CUSTOMER_DOCUMENT_TYPES)[number], string> = {
  V: 'V — Venezolano',
  E: 'E — Extranjero',
  J: 'J — Jurídico (RIF)',
  G: 'G — Gobierno',
  P: 'P — Pasaporte',
};

export function CustomerForm({ current, submitting, onSubmit, onCancel }: Props) {
  const methods = useForm<CustomerFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(CustomerSchema),
    defaultValues: defaults(current),
  });

  const { handleSubmit, reset } = methods;

  // Condiciones estructuradas (catálogo). Una sola fuente; cada select filtra
  // por tipo. Se sincroniza al cambiar el cliente cargado.
  const [conditions, setConditions] = useState<ClinicalCondition[]>(toConditions(current));

  useEffect(() => {
    if (current) {
      reset(defaults(current));
      setConditions(toConditions(current));
    }
  }, [current, reset]);

  const allergies = conditions.filter((c) => c.type === 'allergy');
  const chronic = conditions.filter((c) => c.type === 'chronic');

  const submit = handleSubmit(async (values) => {
    const payload: CreateCustomerPayload = {
      documentType: values.documentType,
      documentNumber: values.documentNumber.trim().toUpperCase(),
      fullName: values.fullName.trim(),
      customerType: values.customerType,
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      address: values.address?.trim() || null,
      defaultDiscountPercent: values.defaultDiscountPercent,
      creditLimitUsd: values.creditLimitUsd,
      notes: values.notes?.trim() || null,
      conditionIds: conditions.map((c) => c.id),
      birthDate: values.birthDate?.trim() || null,
      refillRemindersOptOut: !values.refillReminders,
      isActive: values.isActive,
    };
    await onSubmit(payload);
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Identificación
          </Typography>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Select
                name="documentType"
                label="Tipo"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { md: 200 } }}
              >
                {CUSTOMER_DOCUMENT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {DOC_LABEL[t]}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Text
                name="documentNumber"
                label="Número de documento"
                placeholder="12345678"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>

            <Field.Text
              name="fullName"
              label="Nombre completo"
              placeholder="Juan Pérez González"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Select
              name="customerType"
              label="Tipo de cliente"
              slotProps={{ inputLabel: { shrink: true } }}
            >
              {CUSTOMER_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {TYPE_LABEL[t]}
                </MenuItem>
              ))}
            </Field.Select>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Contacto
          </Typography>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Text name="phone" label="Teléfono" placeholder="+584141234567" />
              <Field.Text name="email" label="Email" placeholder="cliente@correo.com" />
            </Stack>
            <Field.Text name="address" label="Dirección" multiline minRows={2} />
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Comercial
          </Typography>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Text
                name="defaultDiscountPercent"
                label="Descuento por defecto (%)"
                type="number"
              />
              <Field.Text name="creditLimitUsd" label="Límite de crédito USD" type="number" />
            </Stack>

            <Field.Text name="notes" label="Notas" multiline minRows={2} />

            <Field.Switch name="isActive" label="Activo" />
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Ficha clínica
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>
            Datos para la atención personalizada en caja. Las alergias y condiciones se muestran
            como alertas al cajero.
          </Typography>

          <Stack spacing={2}>
            <Field.Text
              name="birthDate"
              label="Fecha de nacimiento"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { md: 240 } }}
            />
            <ConditionsMultiSelect
              type="allergy"
              label="Alergias"
              placeholder="Penicilina, AINEs, sulfas…"
              value={allergies}
              onChange={(next) => setConditions([...chronic, ...next])}
            />
            <ConditionsMultiSelect
              type="chronic"
              label="Condiciones crónicas"
              placeholder="Diabetes, hipertensión, asma…"
              value={chronic}
              onChange={(next) => setConditions([...allergies, ...next])}
            />
            <Field.Switch
              name="refillReminders"
              label="Recibir recordatorios de recompra por correo"
            />
          </Stack>
        </Card>
      </Stack>

      <FormFooter>
        {onCancel && (
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="contained" loading={submitting}>
          {current ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </FormFooter>
    </Form>
  );
}
