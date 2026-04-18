import type { CreateConsignmentEntryPayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useProductsQuery } from '@/features/products/api/products.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';

import { useCreateEntryMutation } from '../../api/consignments.queries';

// ----------------------------------------------------------------------

const ItemSchema = z.object({
  productId: z.string().uuid({ message: 'Selecciona un producto' }),
  lotNumber: z.string().min(1, { message: 'Obligatorio' }).max(50),
  expirationDate: z.string().min(1, { message: 'Obligatoria' }),
  quantity: z
    .string()
    .min(1, { message: 'Obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { message: '> 0' }),
  costUsd: z
    .string()
    .min(1, { message: 'Obligatorio' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '≥ 0' }),
  salePrice: z
    .string()
    .min(1, { message: 'Obligatorio' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '≥ 0' }),
});

const EntrySchema = z.object({
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  supplierId: z.string().uuid({ message: 'Selecciona un proveedor' }),
  commissionPct: z
    .string()
    .min(1, { message: 'Obligatorio' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0 && Number(v) <= 100, {
      message: 'Entre 0 y 100',
    }),
  notes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(ItemSchema).min(1, { message: 'Agrega al menos un ítem' }),
});

type FormValues = z.infer<typeof EntrySchema>;

// ----------------------------------------------------------------------

export function EntryCreateView() {
  const router = useRouter();
  const mutation = useCreateEntryMutation();

  const { data: branches = [] } = useBranchesQuery();
  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true, isDrugstore: true });
  const { data: productsData } = useProductsQuery({ limit: 200 });
  const products = useMemo(() => productsData?.data ?? [], [productsData]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(EntrySchema),
    defaultValues: {
      branchId: '',
      supplierId: '',
      commissionPct: '',
      notes: '',
      items: [
        {
          productId: '',
          lotNumber: '',
          expirationDate: '',
          quantity: '',
          costUsd: '',
          salePrice: '',
        },
      ],
    },
  });

  const { control } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const submit = methods.handleSubmit(async (values) => {
    const payload: CreateConsignmentEntryPayload = {
      branchId: values.branchId,
      supplierId: values.supplierId,
      commissionPct: Number(values.commissionPct),
      notes: values.notes?.trim() || undefined,
      items: values.items.map((i) => ({
        productId: i.productId,
        lotNumber: i.lotNumber.trim(),
        expirationDate: i.expirationDate,
        quantity: Number(i.quantity),
        costUsd: Number(i.costUsd),
        salePrice: Number(i.salePrice),
      })),
    };

    try {
      await mutation.mutateAsync(payload);
      toast.success('Entrada de consignación creada');
      router.push(paths.dashboard.consignments.entries.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Nueva entrada de consignación"
        subtitle="Registra mercancía consignada. Se crean lotes automáticamente con marca de consignación."
        crumbs={[
          { label: 'Consignaciones' },
          { label: 'Entradas' },
          { label: 'Nueva' },
        ]}
      />

      <Form methods={methods} onSubmit={submit}>
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Encabezado
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Select
                name="branchId"
                label="Sucursal"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              >
                <MenuItem value="">— Selecciona —</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Select
                name="supplierId"
                label="Proveedor (droguería)"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              >
                <MenuItem value="">— Selecciona —</MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.businessName}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text
                name="commissionPct"
                label="Comisión (%)"
                placeholder="Ej. 15"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', md: 140 }, flexShrink: 0 }}
              />
            </Stack>

            <Field.Text
              name="notes"
              label="Notas (opcional)"
              multiline
              minRows={2}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Ítems consignados
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() =>
                  append({
                    productId: '',
                    lotNumber: '',
                    expirationDate: '',
                    quantity: '',
                    costUsd: '',
                    salePrice: '',
                  })
                }
              >
                Agregar ítem
              </Button>
            </Stack>

            {fields.map((field, idx) => (
              <Box key={field.id}>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing={2}>
                      <Field.Select
                        name={`items.${idx}.productId`}
                        label="Producto"
                        slotProps={{ inputLabel: { shrink: true } }}
                      >
                        <MenuItem value="">— Selecciona —</MenuItem>
                        {products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.shortName ?? p.description}
                          </MenuItem>
                        ))}
                      </Field.Select>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Field.Text
                          name={`items.${idx}.lotNumber`}
                          label="Lote"
                          slotProps={{ inputLabel: { shrink: true } }}
                          sx={{ flex: 1 }}
                        />
                        <Field.Text
                          name={`items.${idx}.expirationDate`}
                          label="Vencimiento"
                          type="date"
                          slotProps={{ inputLabel: { shrink: true } }}
                          sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0 }}
                        />
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Field.Text
                          name={`items.${idx}.quantity`}
                          label="Cantidad"
                          slotProps={{ inputLabel: { shrink: true } }}
                          sx={{ flex: 1 }}
                        />
                        <Field.Text
                          name={`items.${idx}.costUsd`}
                          label="Costo USD"
                          slotProps={{ inputLabel: { shrink: true } }}
                          sx={{ flex: 1 }}
                        />
                        <Field.Text
                          name={`items.${idx}.salePrice`}
                          label="Precio venta"
                          slotProps={{ inputLabel: { shrink: true } }}
                          sx={{ flex: 1 }}
                        />
                      </Stack>
                    </Stack>
                  </Box>
                  <IconButton
                    color="error"
                    disabled={fields.length === 1}
                    onClick={() => remove(idx)}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Stack>
                {idx < fields.length - 1 && <Divider sx={{ borderStyle: 'dashed', my: 2 }} />}
              </Box>
            ))}
          </Stack>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => router.push(paths.dashboard.consignments.entries.root)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            Crear entrada
          </Button>
        </Box>
      </Form>
    </Container>
  );
}
