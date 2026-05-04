import type { CreateClaimPayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { Form, Field } from '@/app/components/hook-form';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';
import { useReceiptQuery } from '@/features/purchases/api/purchases.queries';
import { useSuppliersQuery } from '@/features/suppliers/api/suppliers.queries';

import { CLAIM_TYPE_OPTIONS } from '../../model/constants';
import { useCreateClaimMutation } from '../../api/claims.queries';

// ----------------------------------------------------------------------

const ClaimSchema = z.object({
  supplierId: z.string().uuid({ message: 'Selecciona un proveedor' }),
  receiptId: z.string().optional().or(z.literal('')),
  branchId: z.string().optional().or(z.literal('')),
  claimType: z.enum(['quality', 'quantity', 'price_mismatch', 'other']),
  title: z.string().min(3, { message: 'Mínimo 3 caracteres' }).max(120),
  description: z.string().min(10, { message: 'Describe el reclamo (mín. 10 caracteres)' }),
  amountUsd: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= 0), {
      message: '≥ 0',
    }),
});

type FormValues = z.infer<typeof ClaimSchema>;

export function ClaimCreateView() {
  const router = useRouter();
  const mutation = useCreateClaimMutation();
  const [searchParams] = useSearchParams();
  const prefillReceiptId = searchParams.get('receiptId') ?? undefined;

  const { data: suppliers = [] } = useSuppliersQuery({ isActive: true });
  const { data: branches = [] } = useBranchesQuery();
  const { data: prefillReceipt } = useReceiptQuery(prefillReceiptId);

  const methods = useForm<FormValues>({
    resolver: zodResolver(ClaimSchema),
    defaultValues: {
      supplierId: '',
      receiptId: prefillReceiptId ?? '',
      branchId: '',
      claimType: 'quality',
      title: '',
      description: '',
      amountUsd: '',
    },
  });

  const supplierName = useMemo(
    () =>
      prefillReceipt
        ? (suppliers.find((s) => s.id === prefillReceipt.supplierId)?.businessName ?? null)
        : null,
    [prefillReceipt, suppliers]
  );

  // Autofill supplier/branch from prefill receipt
  useEffect(() => {
    if (prefillReceipt) {
      methods.setValue('supplierId', prefillReceipt.supplierId, { shouldValidate: true });
      methods.setValue('branchId', prefillReceipt.branchId ?? '', { shouldValidate: true });
    }
  }, [prefillReceipt, methods]);

  const submit = methods.handleSubmit(async (values) => {
    const payload: CreateClaimPayload = {
      supplierId: values.supplierId,
      receiptId: values.receiptId || undefined,
      branchId: values.branchId || undefined,
      claimType: values.claimType,
      title: values.title.trim(),
      description: values.description.trim(),
      amountUsd: values.amountUsd ? Number(values.amountUsd) : undefined,
    };
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Reclamo ${created.claimNumber} creado`);
      router.push(paths.dashboard.claims.detail(created.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Nuevo reclamo"
        subtitle="Registra una inconformidad sobre calidad, cantidad o precio frente a un proveedor."
        crumbs={[{ label: 'Compras' }, { label: 'Reclamos' }, { label: 'Nuevo' }]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={
              <Iconify
                icon="solar:double-alt-arrow-right-bold-duotone"
                sx={{ transform: 'scaleX(-1)' }}
              />
            }
            onClick={() => router.push(paths.dashboard.claims.root)}
          >
            Volver
          </Button>
        }
      />

      <Form methods={methods} onSubmit={submit}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            {prefillReceipt && (
              <Alert severity="info" icon={<Iconify icon="solar:bill-list-bold" />}>
                Reclamo vinculado a la recepción <strong>{prefillReceipt.receiptNumber}</strong>
                {supplierName ? ` · ${supplierName}` : ''}.
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Datos
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Field.Select
                name="supplierId"
                label="Proveedor"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 2 }}
                disabled={!!prefillReceipt}
              >
                <MenuItem value="">— Selecciona —</MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.businessName}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Select
                name="branchId"
                label="Sucursal (opcional)"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              >
                <MenuItem value="">— Sin sucursal —</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Field.Select>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Field.Select
                name="claimType"
                label="Tipo de reclamo"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 200 }, flexShrink: 0 }}
              >
                {CLAIM_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text
                name="amountUsd"
                label="Monto reclamado USD (opcional)"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Field.Text name="title" label="Asunto" slotProps={{ inputLabel: { shrink: true } }} />

            <Field.Text
              name="description"
              label="Descripción"
              multiline
              minRows={4}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => router.push(paths.dashboard.claims.root)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            Registrar reclamo
          </Button>
        </Box>
      </Form>
    </Container>
  );
}
