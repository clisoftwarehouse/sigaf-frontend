import type { CreateConsignmentReturnPayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
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

import { CONSIGNMENT_RETURN_REASONS } from '../../model/constants';
import {
  useEntryQuery,
  useEntriesQuery,
  useCreateReturnMutation,
} from '../../api/consignments.queries';

// ----------------------------------------------------------------------

const ItemSchema = z.object({
  consignmentItemId: z.string().uuid({ message: 'Obligatorio' }),
  lotId: z.string().uuid({ message: 'Obligatorio' }),
  quantity: z
    .string()
    .min(1, { message: 'Obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { message: '> 0' }),
  costUsd: z
    .string()
    .min(1, { message: 'Obligatorio' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0, { message: '≥ 0' }),
});

const ReturnSchema = z.object({
  consignmentEntryId: z.string().uuid({ message: 'Selecciona una entrada' }),
  reason: z.string().min(1, { message: 'Obligatorio' }).max(50),
  notes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(ItemSchema).min(1, { message: 'Agrega al menos un ítem' }),
});

type FormValues = z.infer<typeof ReturnSchema>;

// ----------------------------------------------------------------------

export function ReturnCreateView() {
  const router = useRouter();
  const mutation = useCreateReturnMutation();

  const { data: entriesData } = useEntriesQuery({ status: 'active', limit: 100 });
  const entries = useMemo(() => entriesData?.data ?? [], [entriesData]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(ReturnSchema),
    defaultValues: {
      consignmentEntryId: '',
      reason: 'expired',
      notes: '',
      items: [{ consignmentItemId: '', lotId: '', quantity: '', costUsd: '' }],
    },
  });

  const { control, watch, reset } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const selectedEntryId = watch('consignmentEntryId');

  const { data: selectedEntry } = useEntryQuery(selectedEntryId || undefined);
  const availableItems = useMemo(() => selectedEntry?.items ?? [], [selectedEntry]);

  useEffect(() => {
    // When entry changes, reset items to blank (user picks fresh items from the entry).
    reset((prev) => ({
      ...prev,
      items: [{ consignmentItemId: '', lotId: '', quantity: '', costUsd: '' }],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntryId]);

  const submit = methods.handleSubmit(async (values) => {
    if (!selectedEntry) return;
    const payload: CreateConsignmentReturnPayload = {
      consignmentEntryId: values.consignmentEntryId,
      branchId: selectedEntry.branchId,
      supplierId: selectedEntry.supplierId,
      reason: values.reason,
      notes: values.notes?.trim() || undefined,
      items: values.items.map((i) => ({
        consignmentItemId: i.consignmentItemId,
        lotId: i.lotId,
        quantity: Number(i.quantity),
        costUsd: Number(i.costUsd),
      })),
    };

    try {
      await mutation.mutateAsync(payload);
      toast.success('Devolución registrada');
      router.push(paths.dashboard.consignments.returns.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Nueva devolución de consignación"
        subtitle="Devuelve ítems específicos de una consignación activa al proveedor."
        crumbs={[{ label: 'Consignaciones' }, { label: 'Devoluciones' }, { label: 'Nueva' }]}
      />

      <Form methods={methods} onSubmit={submit}>
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Encabezado
            </Typography>

            <Field.Select
              name="consignmentEntryId"
              label="Entrada de consignación"
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">— Selecciona —</MenuItem>
              {entries.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {new Date(e.createdAt).toLocaleDateString('es-VE')} — {e.id.slice(0, 8)}
                </MenuItem>
              ))}
            </Field.Select>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Field.Select
                name="reason"
                label="Motivo"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', md: 220 }, flexShrink: 0 }}
              >
                {CONSIGNMENT_RETURN_REASONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text
                name="notes"
                label="Notas"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Ítems a devolver
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                disabled={!selectedEntry}
                onClick={() =>
                  append({ consignmentItemId: '', lotId: '', quantity: '', costUsd: '' })
                }
              >
                Agregar ítem
              </Button>
            </Stack>

            {!selectedEntry && (
              <Alert severity="info">
                Selecciona una entrada de consignación para cargar los ítems disponibles.
              </Alert>
            )}

            {selectedEntry &&
              fields.map((field, idx) => (
                <Box key={field.id}>
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Box sx={{ flex: 1 }}>
                      <Stack spacing={2}>
                        <Field.Select
                          name={`items.${idx}.consignmentItemId`}
                          label="Ítem original"
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          <MenuItem value="">— Selecciona —</MenuItem>
                          {availableItems.map((i) => (
                            <MenuItem key={i.id} value={i.id}>
                              {i.lotNumber} · restante {Number(i.quantityRemaining) || 0}
                            </MenuItem>
                          ))}
                        </Field.Select>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <Field.Text
                            name={`items.${idx}.lotId`}
                            label="Lote ID (UUID)"
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ flex: 1 }}
                          />
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
            onClick={() => router.push(paths.dashboard.consignments.returns.root)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            Registrar devolución
          </Button>
        </Box>
      </Form>
    </Container>
  );
}
