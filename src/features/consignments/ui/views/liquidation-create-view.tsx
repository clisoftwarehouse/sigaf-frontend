import type { CreateConsignmentLiquidationPayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { PageHeader } from '@/shared/ui/page-header';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';

import { useCreateLiquidationMutation } from '../../api/consignments.queries';

// ----------------------------------------------------------------------

const todayIso = () => new Date().toISOString().slice(0, 10);

const LiquidationSchema = z.object({
  branchId: z.string().uuid({ message: 'Selecciona una sucursal' }),
  supplierId: z.string().uuid({ message: 'Selecciona un proveedor' }),
  periodStart: z.string().min(1, { message: 'Obligatorio' }),
  periodEnd: z.string().min(1, { message: 'Obligatorio' }),
  consignmentEntryId: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof LiquidationSchema>;

// ----------------------------------------------------------------------

export function LiquidationCreateView() {
  const router = useRouter();
  const mutation = useCreateLiquidationMutation();

  const { data: branches = [] } = useBranchesQuery();
  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true });

  const methods = useForm<FormValues>({
    resolver: zodResolver(LiquidationSchema),
    defaultValues: {
      branchId: '',
      supplierId: '',
      periodStart: '',
      periodEnd: todayIso(),
      consignmentEntryId: '',
    },
  });

  const submit = methods.handleSubmit(async (values) => {
    const payload: CreateConsignmentLiquidationPayload = {
      branchId: values.branchId,
      supplierId: values.supplierId,
      periodStart: values.periodStart,
      periodEnd: values.periodEnd,
      consignmentEntryId: values.consignmentEntryId || undefined,
    };
    try {
      await mutation.mutateAsync(payload);
      toast.success('Liquidación generada');
      router.push(paths.dashboard.consignments.liquidations.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Nueva liquidación"
        subtitle="Calcula comisiones sobre las ventas del periodo seleccionado."
        crumbs={[{ label: 'Consignaciones' }, { label: 'Liquidaciones' }, { label: 'Nueva' }]}
      />

      <Form methods={methods} onSubmit={submit}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Si no especificas una entrada, se liquidan todas las entradas activas del proveedor en
              el periodo.
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
                label="Proveedor"
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
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Field.Text
                name="periodStart"
                label="Desde"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
              <Field.Text
                name="periodEnd"
                label="Hasta"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Field.Text
              name="consignmentEntryId"
              label="ID de entrada específica (opcional)"
              placeholder="UUID"
              helperText="Deja vacío para liquidar todas las entradas activas del proveedor."
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                color="inherit"
                variant="outlined"
                onClick={() => router.push(paths.dashboard.consignments.liquidations.root)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="contained" loading={mutation.isPending}>
                Generar liquidación
              </Button>
            </Box>
          </Stack>
        </Card>
      </Form>
    </Container>
  );
}
