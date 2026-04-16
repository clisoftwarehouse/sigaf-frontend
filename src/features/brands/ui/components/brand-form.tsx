import type { Brand, CreateBrandPayload } from '../../model/types';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { Form, Field } from '@/app/components/hook-form';
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';

import { BRAND_TYPES, BRAND_TYPE_OPTIONS } from '../../model/types';

// ----------------------------------------------------------------------

const optionalString = (max?: number) => {
  let schema = z.string();
  if (max) schema = schema.max(max, { message: `Máximo ${max} caracteres` });
  return schema.optional().or(z.literal(''));
};

export const BrandSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'Máximo 100 caracteres' }),
  isLaboratory: z.boolean(),
  isActive: z.boolean(),
  brandType: z.enum(BRAND_TYPES),
  isImporter: z.boolean(),
  isManufacturer: z.boolean(),
  rif: optionalString(20),
  businessName: optionalString(200),
  address: optionalString(),
  phone: optionalString(20),
  email: z
    .string()
    .email({ message: 'Correo inválido' })
    .max(150)
    .optional()
    .or(z.literal('')),
  countryOfOrigin: optionalString(100),
  taxRegime: optionalString(50),
  supplierId: optionalString(),
  parentBrandId: optionalString(),
  website: optionalString(255),
  logoUrl: optionalString(500),
  regulatoryCode: optionalString(100),
});

export type BrandFormValues = z.infer<typeof BrandSchema>;

type Props = {
  current?: Brand;
  submitting?: boolean;
  onSubmit: (values: CreateBrandPayload) => Promise<void> | void;
  onCancel?: () => void;
};

const defaults = (current?: Brand): BrandFormValues => ({
  name: current?.name ?? '',
  isLaboratory: current?.isLaboratory ?? false,
  isActive: current?.isActive ?? true,
  brandType: current?.brandType ?? 'other',
  isImporter: current?.isImporter ?? false,
  isManufacturer: current?.isManufacturer ?? false,
  rif: current?.rif ?? '',
  businessName: current?.businessName ?? '',
  address: current?.address ?? '',
  phone: current?.phone ?? '',
  email: current?.email ?? '',
  countryOfOrigin: current?.countryOfOrigin ?? '',
  taxRegime: current?.taxRegime ?? '',
  supplierId: current?.supplierId ?? '',
  parentBrandId: current?.parentBrandId ?? '',
  website: current?.website ?? '',
  logoUrl: current?.logoUrl ?? '',
  regulatoryCode: current?.regulatoryCode ?? '',
});

const emptyToUndef = (v: string | undefined) => {
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
};

export function BrandForm({ current, submitting, onSubmit, onCancel }: Props) {
  const methods = useForm<BrandFormValues>({
    resolver: zodResolver(BrandSchema),
    defaultValues: defaults(current),
  });

  const { data: supplierOpts = [] } = useSupplierOptions();

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (current) reset(defaults(current));
  }, [current, reset]);

  const submit = handleSubmit(async (values) => {
    const payload: CreateBrandPayload = {
      name: values.name.trim(),
      isLaboratory: values.isLaboratory,
      isActive: values.isActive,
      brandType: values.brandType,
      isImporter: values.isImporter,
      isManufacturer: values.isManufacturer,
      rif: emptyToUndef(values.rif),
      businessName: emptyToUndef(values.businessName),
      address: emptyToUndef(values.address),
      phone: emptyToUndef(values.phone),
      email: emptyToUndef(values.email),
      countryOfOrigin: emptyToUndef(values.countryOfOrigin),
      taxRegime: emptyToUndef(values.taxRegime),
      supplierId: emptyToUndef(values.supplierId),
      parentBrandId: emptyToUndef(values.parentBrandId),
      website: emptyToUndef(values.website),
      logoUrl: emptyToUndef(values.logoUrl),
      regulatoryCode: emptyToUndef(values.regulatoryCode),
    };
    await onSubmit(payload);
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Datos generales
          </Typography>
          <Stack spacing={2}>
            <Field.Text
              name="name"
              label="Nombre"
              placeholder="Ej. Bayer"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Field.Select name="brandType" label="Tipo de marca">
              {BRAND_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Field.Select>
            <Field.Text
              name="countryOfOrigin"
              label="País de origen"
              placeholder="Ej. Alemania"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Switch name="isLaboratory" label="Es laboratorio" />
              <Field.Switch name="isImporter" label="Es importador" />
              <Field.Switch name="isManufacturer" label="Es fabricante" />
              <Field.Switch name="isActive" label="Activo" />
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Datos fiscales
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Text
                name="rif"
                label="RIF"
                placeholder="J-12345678-0"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Field.Text
                name="taxRegime"
                label="Régimen tributario"
                placeholder="Ej. contribuyente_especial"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <Field.Text
              name="businessName"
              label="Razón social"
              placeholder="Bayer Venezuela C.A."
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Field.Text
              name="address"
              label="Dirección"
              multiline
              rows={2}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Contacto
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Text
                name="phone"
                label="Teléfono"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Field.Text
                name="email"
                label="Correo"
                type="email"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <Field.Text
              name="website"
              label="Sitio web"
              placeholder="https://..."
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Field.Text
              name="logoUrl"
              label="URL del logo"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Relaciones y registro
          </Typography>
          <Stack spacing={2}>
            <Field.Select
              name="supplierId"
              label="Proveedor asociado (opcional)"
              helperText="Usar si la marca también opera como droguería"
            >
              <MenuItem value="">— Ninguno —</MenuItem>
              {supplierOpts.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.label}
                </MenuItem>
              ))}
            </Field.Select>
            <Field.Text
              name="parentBrandId"
              label="ID de marca matriz (opcional)"
              helperText="Si esta es una sub-marca"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Field.Text
              name="regulatoryCode"
              label="Código regulatorio / sanitario"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              {current ? 'Guardar cambios' : 'Crear marca'}
            </Button>
          </Box>
        </Card>
      </Stack>
    </Form>
  );
}
