import type { GridColDef } from '@mui/x-data-grid';
import type { ExchangeRate, OverrideRatePayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { Form, Field } from '@/app/components/hook-form';

import {
  useExchangeRatesQuery,
  useFetchBcvRateMutation,
  useLatestExchangeRateQuery,
  useOverrideExchangeRateMutation,
} from '../../api/exchange-rates.queries';

// ----------------------------------------------------------------------

const todayIso = () => new Date().toISOString().slice(0, 10);

const RateSchema = z.object({
  currencyFrom: z.string().min(1).max(3).toUpperCase(),
  currencyTo: z.string().min(1).max(3).toUpperCase(),
  rate: z
    .string()
    .min(1, { message: 'Tasa obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { message: 'Debe ser un número > 0' }),
  effectiveDate: z.string().min(1, { message: 'Fecha obligatoria' }),
  notes: z.string().max(255).optional().or(z.literal('')),
});

type RateFormValues = z.infer<typeof RateSchema>;

export function ExchangeRatesView() {
  const [limit] = useState(1000);

  const { data: rates = [], isLoading, isError, error, refetch } = useExchangeRatesQuery({ limit });
  const { data: latest } = useLatestExchangeRateQuery();
  const overrideMutation = useOverrideExchangeRateMutation();
  const fetchBcvMutation = useFetchBcvRateMutation();

  const methods = useForm<RateFormValues>({
    resolver: zodResolver(RateSchema),
    defaultValues: {
      currencyFrom: 'USD',
      currencyTo: 'VES',
      rate: '',
      effectiveDate: todayIso(),
      notes: '',
    },
  });

  const submit = methods.handleSubmit(async (values) => {
    const payload: OverrideRatePayload = {
      currencyFrom: values.currencyFrom,
      currencyTo: values.currencyTo,
      rate: Number(values.rate),
      effectiveDate: values.effectiveDate,
      notes: values.notes || undefined,
    };
    try {
      await overrideMutation.mutateAsync(payload);
      toast.success(
        `Tasa manual ${values.currencyFrom}/${values.currencyTo} = ${values.rate} registrada`
      );
      methods.reset({
        ...values,
        rate: '',
        notes: '',
        effectiveDate: todayIso(),
      });
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const handleFetchBcv = async () => {
    try {
      const rate = await fetchBcvMutation.mutateAsync();
      const value = typeof rate.rate === 'string' ? Number(rate.rate) : rate.rate;
      toast.success(`Tasa BCV obtenida: ${value}`);
    } catch (err) {
      toast.error((err as Error).message ?? 'No se pudo obtener la tasa BCV');
    }
  };

  const renderLatestCard = () => {
    const rate = latest
      ? typeof latest.rate === 'string'
        ? Number(latest.rate)
        : latest.rate
      : null;
    return (
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tasa más reciente
            </Typography>
            {latest && rate !== null ? (
              <>
                <Typography variant="h3" sx={{ mt: 0.5 }}>
                  {rate.toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}{' '}
                  <Typography component="span" variant="subtitle1" sx={{ color: 'text.secondary' }}>
                    {latest.currencyFrom} → {latest.currencyTo}
                  </Typography>
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {latest.source} · {latest.effectiveDate}
                  </Typography>
                  {latest.isOverridden ? (
                    <Chip size="small" color="warning" label="Manual (override)" />
                  ) : (
                    <Chip size="small" color="success" variant="outlined" label="Automática" />
                  )}
                </Stack>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                No hay tasas registradas todavía. Usa el botón para traer la tasa oficial del
                BCV o registra una manualmente más abajo.
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:download-bold" />}
            loading={fetchBcvMutation.isPending}
            onClick={handleFetchBcv}
            sx={{ minWidth: 200 }}
          >
            Actualizar desde BCV
          </Button>
        </Stack>
      </Card>
    );
  };

  const columns = useMemo<GridColDef<ExchangeRate>[]>(
    () => [
      {
        field: 'effectiveDate',
        headerName: 'Fecha efectiva',
        type: 'date',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string) => (value ? new Date(value) : null),
      },
      {
        field: 'pair',
        headerName: 'Par',
        flex: 1,
        minWidth: 140,
        valueGetter: (_v, row) => `${row.currencyFrom} → ${row.currencyTo}`,
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'rate',
        headerName: 'Tasa',
        type: 'number',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: number | string) =>
          typeof value === 'string' ? Number(value) : value,
        valueFormatter: (value: number) =>
          value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      },
      {
        field: 'source',
        headerName: 'Fuente',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">{row.source}</Typography>
            {row.isOverridden && <Chip size="small" color="warning" label="Override" />}
          </Stack>
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Registrado',
        type: 'dateTime',
        flex: 1,
        minWidth: 180,
        valueGetter: (value: string) => (value ? new Date(value) : null),
      },
    ],
    []
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Tasas de cambio"
        subtitle="Historial de tasas BCV usadas para conversión USD/VES."
        crumbs={[{ label: 'Administración' }, { label: 'Tasas de cambio' }]}
      />

      {renderLatestCard()}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Sobreescribir manualmente (override)
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Usar solo cuando BCV no publique la tasa del día o haya un evento cambiario
          extraordinario. Quedará marcada como “Manual”.
        </Typography>

        <Form methods={methods} onSubmit={submit}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Field.Text
                name="currencyFrom"
                label="De"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 110 } }}
              />
              <Field.Text
                name="currencyTo"
                label="A"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 110 } }}
              />
              <Field.Text
                name="rate"
                label="Tasa"
                placeholder="Ej. 36.50"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1, minWidth: 180 }}
              />
              <Field.Text
                name="effectiveDate"
                label="Fecha efectiva"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 200 } }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
              <Field.Text
                name="notes"
                label="Notas"
                placeholder="Motivo del override (opcional)"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
              <Button
                type="submit"
                variant="contained"
                color="warning"
                loading={overrideMutation.isPending}
                sx={{ minWidth: 160, height: 56 }}
              >
                Registrar
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Card>

      <Card>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="subtitle2">Historial</Typography>
        </Box>

        {isError && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Reintentar
                </Button>
              }
            >
              {(error as Error)?.message ?? 'Error al cargar tasas'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={rates}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
