import type { CreatePrescriptionPayload } from '../../model/types';

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
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { FormFooter } from '@/shared/ui/form-footer';
import { Form, Field } from '@/app/components/hook-form';
import { useProductOptions } from '@/features/products/api/products.options';
import { useCustomersQuery } from '@/features/customers/api/customers.queries';

import { useCreatePrescriptionMutation } from '../../api/prescriptions.queries';

// ----------------------------------------------------------------------

const ItemSchema = z.object({
  productId: z.string().uuid({ message: 'Selecciona un producto' }),
  quantityPrescribed: z.number().positive({ message: 'Cantidad > 0' }),
  posology: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

const PrescriptionSchema = z.object({
  customerId: z.string().uuid({ message: 'Selecciona un cliente' }),
  doctorName: z.string().min(2, { message: 'Nombre del médico obligatorio' }).max(150),
  doctorIdNumber: z.string().max(30).optional().or(z.literal('')),
  prescriptionNumber: z.string().max(50).optional().or(z.literal('')),
  issuedAt: z.string().min(1, { message: 'Fecha de emisión obligatoria' }),
  expiresAt: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(ItemSchema).min(1, { message: 'Agrega al menos un producto' }),
});

type FormValues = z.infer<typeof PrescriptionSchema>;

const todayLocalIso = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// ----------------------------------------------------------------------

export function PrescriptionCreateView() {
  const router = useRouter();
  const mutation = useCreatePrescriptionMutation();

  const { data: customersData } = useCustomersQuery({ isActive: true, limit: 500 });
  const customers = customersData?.data ?? [];

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        id: c.id,
        label: c.fullName,
        secondaryLabel: `${c.documentType}-${c.documentNumber}`,
      })),
    [customers]
  );

  const { data: productOptions = [], isLoading: productsLoading } = useProductOptions();

  const methods = useForm<FormValues>({
    mode: 'onBlur',
    resolver: zodResolver(PrescriptionSchema),
    defaultValues: {
      customerId: '',
      doctorName: '',
      doctorIdNumber: '',
      prescriptionNumber: '',
      issuedAt: todayLocalIso(),
      expiresAt: '',
      notes: '',
      items: [{ productId: '', quantityPrescribed: 1, posology: '', notes: '' }],
    },
  });

  const { handleSubmit, control } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const submit = handleSubmit(async (values) => {
    const payload: CreatePrescriptionPayload = {
      customerId: values.customerId,
      doctorName: values.doctorName.trim(),
      doctorIdNumber: values.doctorIdNumber?.trim() || undefined,
      prescriptionNumber: values.prescriptionNumber?.trim() || undefined,
      issuedAt: new Date(values.issuedAt).toISOString(),
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      notes: values.notes?.trim() || undefined,
      items: values.items.map((i) => ({
        productId: i.productId,
        quantityPrescribed: i.quantityPrescribed,
        posology: i.posology?.trim() || undefined,
        notes: i.notes?.trim() || undefined,
      })),
    };
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success('Récipe registrado');
      router.push(paths.dashboard.pos.prescriptions.detail(created.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo récipe</Typography>
        <Typography variant="body2" color="text.secondary">
          Registra un récipe médico para dispensar productos controlados.
        </Typography>
      </Box>

      <Form methods={methods} onSubmit={submit}>
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Cliente y médico
            </Typography>

            <Stack spacing={2}>
              <Field.IdAutocomplete
                name="customerId"
                label="Cliente"
                options={customerOptions}
                noOptionsText="Sin clientes activos"
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Field.Text name="doctorName" label="Nombre del médico" />
                <Field.Text name="doctorIdNumber" label="Cédula / MPPS" />
              </Stack>

              <Field.Text name="prescriptionNumber" label="Número de récipe (opcional)" />
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Vigencia
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Text
                name="issuedAt"
                type="datetime-local"
                label="Emitido"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Field.Text
                name="expiresAt"
                type="datetime-local"
                label="Vence (opcional, default 30 días)"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Productos prescritos
              </Typography>
              <Button
                size="small"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() =>
                  append({ productId: '', quantityPrescribed: 1, posology: '', notes: '' })
                }
              >
                Añadir item
              </Button>
            </Stack>

            <Stack spacing={2} divider={<Divider flexItem />}>
              {fields.map((field, index) => (
                <Stack key={field.id} spacing={1.5}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
                    <Box sx={{ flex: 2, minWidth: 0 }}>
                      <Field.IdAutocomplete
                        name={`items.${index}.productId`}
                        label="Producto"
                        options={productOptions ?? []}
                        loading={productsLoading}
                      />
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: 160 } }}>
                      <Field.Text
                        name={`items.${index}.quantityPrescribed`}
                        type="number"
                        label="Cantidad"
                      />
                    </Box>
                    <IconButton
                      color="error"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      sx={{ mt: { md: 1 } }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Stack>
                  <Field.Text
                    name={`items.${index}.posology`}
                    label="Posología (ej. 1 tableta cada 8h)"
                  />
                </Stack>
              ))}
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Field.Text name="notes" label="Notas" multiline minRows={2} />
          </Card>
        </Stack>

        <FormFooter>
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => router.push(paths.dashboard.pos.prescriptions.root)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            Crear récipe
          </Button>
        </FormFooter>
      </Form>
    </Container>
  );
}
