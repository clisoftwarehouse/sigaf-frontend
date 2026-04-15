import type { GridColDef } from '@mui/x-data-grid';
import type { ExchangeRate , CreateExchangeRatePayload } from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { Form, Field } from '@/app/components/hook-form';

import {
  useExchangeRatesQuery,
  useLatestExchangeRateQuery,
  useCreateExchangeRateMutation,
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
  source: z.string().max(50).optional().or(z.literal('')),
  effectiveDate: z.string().min(1, { message: 'Fecha obligatoria' }),
});

type RateFormValues = z.infer<typeof RateSchema>;

export function ExchangeRatesView() {
  const [limit] = useState(1000);

  const {
    data: rates = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useExchangeRatesQuery({ limit });
  const { data: latest } = useLatestExchangeRateQuery();
  const mutation = useCreateExchangeRateMutation();

  const methods = useForm<RateFormValues>({
    resolver: zodResolver(RateSchema),
    defaultValues: {
      currencyFrom: 'USD',
      currencyTo: 'VES',
      rate: '',
      source: 'BCV',
      effectiveDate: todayIso(),
    },
  });

  const submit = methods.handleSubmit(async (values) => {
    const payload: CreateExchangeRatePayload = {
      currencyFrom: values.currencyFrom,
      currencyTo: values.currencyTo,
      rate: Number(values.rate),
      source: values.source || undefined,
      effectiveDate: values.effectiveDate,
    };
    try {
      await mutation.mutateAsync(payload);
      toast.success(`Tasa ${values.currencyFrom}/${values.currencyTo} = ${values.rate} registrada`);
      methods.reset({
        ...values,
        rate: '',
        effectiveDate: todayIso(),
      });
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const latestCard = useMemo(() => {
    if (!latest) return null;
    const rate = typeof latest.rate === 'string' ? Number(latest.rate) : latest.rate;
    return (
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Tasa más reciente
        </Typography>
        <Typography variant="h3" sx={{ mt: 0.5 }}>
          {rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
          <Typography component="span" variant="subtitle1" sx={{ color: 'text.secondary' }}>
            {latest.currencyFrom} → {latest.currencyTo}
          </Typography>
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {latest.source} · {latest.effectiveDate}
        </Typography>
      </Card>
    );
  }, [latest]);

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
        minWidth: 140,
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
    <Container maxWidth="lg">
      <PageHeader
        title="Tasas de cambio"
        subtitle="Historial de tasas BCV usadas para conversión USD/VES."
        crumbs={[{ label: 'Administración' }, { label: 'Tasas de cambio' }]}
      />

      {latestCard}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
          Registrar nueva tasa
        </Typography>

        <Form methods={methods} onSubmit={submit}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ md: 'flex-start' }}
          >
            <Field.Text
              name="currencyFrom"
              label="De"
              sx={{ minWidth: 90 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Field.Text
              name="currencyTo"
              label="A"
              sx={{ minWidth: 90 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Field.Text
              name="rate"
              label="Tasa"
              placeholder="Ej. 36.50"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1, minWidth: 160 }}
            />
            <Field.Text
              name="source"
              label="Fuente"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 140 }}
            />
            <Field.Text
              name="effectiveDate"
              label="Fecha efectiva"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 180 }}
            />
            <Button
              type="submit"
              variant="contained"
              loading={mutation.isPending}
              sx={{ minWidth: 140, height: 53 }}
            >
              Registrar
            </Button>
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
