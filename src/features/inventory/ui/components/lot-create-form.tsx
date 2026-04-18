import type { CreateLotPayload } from '../../model/types';

import * as z from 'zod';
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
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useProductsQuery } from '@/features/products/api/products.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';
import { useLocationsQuery } from '@/features/locations/api/locations.queries';

import { ACQUISITION_OPTIONS } from '../../model/constants';

// ----------------------------------------------------------------------

const numberField = (errorMsg: string) =>
  z
    .string()
    .min(1, { message: errorMsg })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: 'Debe ser un número ≥ 0' });

export const LotCreateSchema = z.object({
  productId: z.string().uuid({ message: 'Selecciona un producto' }),
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  lotNumber: z.string().min(1, { message: 'Número de lote obligatorio' }).max(50),
  expirationDate: z.string().min(1, { message: 'Fecha de vencimiento obligatoria' }),
  manufactureDate: z.string().optional().or(z.literal('')),
  acquisitionType: z.enum(['purchase', 'consignment']),
  supplierId: z.string().optional().or(z.literal('')),
  costUsd: numberField('Costo obligatorio'),
  salePrice: numberField('Precio de venta obligatorio'),
  quantityReceived: numberField('Cantidad obligatoria'),
  locationId: z.string().optional().or(z.literal('')),
});

export type LotCreateFormValues = z.infer<typeof LotCreateSchema>;

type Props = {
  submitting?: boolean;
  onSubmit: (payload: CreateLotPayload) => Promise<void> | void;
  onCancel?: () => void;
};

export function LotCreateForm({ submitting, onSubmit, onCancel }: Props) {
  const { data: productsData, isLoading: loadingProducts } = useProductsQuery({ limit: 200 });
  const products = productsData?.data ?? [];
  const { data: branches = [] } = useBranchesQuery();
  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true });

  const methods = useForm<LotCreateFormValues>({
    resolver: zodResolver(LotCreateSchema),
    defaultValues: {
      productId: '',
      branchId: '',
      lotNumber: '',
      expirationDate: '',
      manufactureDate: '',
      acquisitionType: 'purchase',
      supplierId: '',
      costUsd: '',
      salePrice: '',
      quantityReceived: '',
      locationId: '',
    },
  });

  const branchId = methods.watch('branchId');
  const { data: locations = [] } = useLocationsQuery({ branchId: branchId || undefined });

  const submit = methods.handleSubmit(async (values) => {
    await onSubmit({
      productId: values.productId,
      branchId: values.branchId,
      lotNumber: values.lotNumber.trim(),
      expirationDate: values.expirationDate,
      manufactureDate: values.manufactureDate || undefined,
      acquisitionType: values.acquisitionType,
      supplierId: values.supplierId || undefined,
      costUsd: Number(values.costUsd),
      salePrice: Number(values.salePrice),
      quantityReceived: Number(values.quantityReceived),
      locationId: values.locationId || undefined,
    });
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Origen
          </Typography>

          <Field.Select
            name="productId"
            label="Producto"
            disabled={loadingProducts}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">— Selecciona un producto —</MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.shortName ?? p.description}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select
            name="branchId"
            label="Sucursal"
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">— Selecciona una sucursal —</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select
            name="locationId"
            label="Ubicación en almacén (opcional)"
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">— Sin ubicación específica —</MenuItem>
            {locations.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.locationCode}
              </MenuItem>
            ))}
          </Field.Select>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Lote
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="lotNumber"
              label="Número de lote"
              placeholder="Ej. LOT-2026-001"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="expirationDate"
              label="Vencimiento"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0 }}
            />
            <Field.Text
              name="manufactureDate"
              label="Fabricación (opcional)"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0 }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Select
              name="acquisitionType"
              label="Tipo de adquisición"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 200 }, flexShrink: 0 }}
            >
              {ACQUISITION_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Field.Select>
            <Field.Select
              name="supplierId"
              label="Proveedor (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">— Sin proveedor —</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.businessName}
                </MenuItem>
              ))}
            </Field.Select>
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Costos y cantidad
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="costUsd"
              label="Costo unitario (USD)"
              placeholder="Ej. 5.50"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="salePrice"
              label="Precio de venta"
              placeholder="Ej. 8.99"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Field.Text
              name="quantityReceived"
              label="Cantidad recibida"
              placeholder="Ej. 100"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1 }}>
            {onCancel && (
              <Button color="inherit" variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" loading={submitting}>
              Crear lote
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
