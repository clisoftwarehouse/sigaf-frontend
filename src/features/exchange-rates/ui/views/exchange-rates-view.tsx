import type { GridColDef } from '@mui/x-data-grid';
import type {
  RateSource,
  ExchangeRate,
  OverrideRatePayload,
  CreateExchangeRatePayload,
} from '../../model/types';

import * as z from 'zod';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { Form, Field } from '@/app/components/hook-form';

import { RATE_SOURCE_LABEL } from '../../model/types';
import {
  useExchangeRatesQuery,
  useFetchBcvRateMutation,
  useLatestExchangeRateQuery,
  useCreateExchangeRateMutation,
  useOverrideExchangeRateMutation,
} from '../../api/exchange-rates.queries';

// ----------------------------------------------------------------------

const todayIso = () => new Date().toISOString().slice(0, 10);

const OverrideSchema = z.object({
  currencyFrom: z.string().min(1).max(3).toUpperCase(),
  currencyTo: z.string().min(1).max(3).toUpperCase(),
  rate: z
    .string()
    .min(1, { message: 'Tasa obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { message: 'Debe ser un número > 0' }),
  effectiveDate: z.string().min(1, { message: 'Fecha obligatoria' }),
  notes: z.string().max(255).optional().or(z.literal('')),
});

const ReposicionSchema = z.object({
  rate: z
    .string()
    .min(1, { message: 'Tasa obligatoria' })
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, { message: 'Debe ser un número > 0' }),
  effectiveDate: z.string().min(1, { message: 'Fecha obligatoria' }),
});

type OverrideFormValues = z.infer<typeof OverrideSchema>;
type ReposicionFormValues = z.infer<typeof ReposicionSchema>;

type FilterOption = 'all' | RateSource;

// ----------------------------------------------------------------------

export function ExchangeRatesView() {
  const [filter, setFilter] = useState<FilterOption>('all');

  const ratesQuery = useExchangeRatesQuery({
    limit: 1000,
    source: filter === 'all' ? undefined : filter,
  });
  const rates = ratesQuery.data ?? [];

  const latestBcv = useLatestExchangeRateQuery('USD', 'VES', 'BCV').data ?? null;
  const latestReposicion = useLatestExchangeRateQuery('USD', 'VES', 'REPOSICION').data ?? null;

  const bcvValue = latestBcv ? Number(latestBcv.rate) : null;
  const reposicionValue = latestReposicion ? Number(latestReposicion.rate) : null;
  const ratio =
    bcvValue && reposicionValue && bcvValue > 0 ? reposicionValue / bcvValue : null;

  const overrideMutation = useOverrideExchangeRateMutation();
  const fetchBcvMutation = useFetchBcvRateMutation();
  const createMutation = useCreateExchangeRateMutation();

  // ----- Form: Override manual (sin tipo, source = 'manual') -----
  const overrideMethods = useForm<OverrideFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(OverrideSchema),
    defaultValues: {
      currencyFrom: 'USD',
      currencyTo: 'VES',
      rate: '',
      effectiveDate: todayIso(),
      notes: '',
    },
  });

  const submitOverride = overrideMethods.handleSubmit(async (values) => {
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
      overrideMethods.reset({ ...values, rate: '', notes: '', effectiveDate: todayIso() });
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  // ----- Form: Tasa de reposición (source = 'REPOSICION', validación >= BCV) -----
  const reposicionMethods = useForm<ReposicionFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(ReposicionSchema),
    defaultValues: {
      rate: '',
      effectiveDate: todayIso(),
    },
  });

  const submitReposicion = reposicionMethods.handleSubmit(async (values) => {
    const rate = Number(values.rate);
    // Validación cliente: avisa antes del round-trip si está por debajo del BCV.
    if (bcvValue != null && rate < bcvValue) {
      reposicionMethods.setError('rate', {
        message: `Debe ser ≥ tasa BCV vigente (${bcvValue}) para evitar pérdidas`,
      });
      return;
    }
    const payload: CreateExchangeRatePayload = {
      currencyFrom: 'USD',
      currencyTo: 'VES',
      rate,
      source: 'REPOSICION',
      effectiveDate: values.effectiveDate,
    };
    try {
      await createMutation.mutateAsync(payload);
      toast.success(`Tasa de reposición ${rate} registrada`);
      reposicionMethods.reset({ rate: '', effectiveDate: todayIso() });
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

  // ----- Columns historial -----
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
        renderCell: ({ row }) => {
          const color = row.source === 'BCV'
            ? 'success'
            : row.source === 'REPOSICION'
              ? 'info'
              : 'warning';
          const label = RATE_SOURCE_LABEL[row.source as RateSource] ?? row.source;
          return (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" color={color} variant="outlined" label={label} />
              {row.isOverridden && row.source !== 'manual' && (
                <Chip size="small" color="warning" label="Override" />
              )}
            </Stack>
          );
        },
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
        subtitle="Tasa BCV (oficial) y tasa de reposición (revaloriza precios al costo real de reponer stock)."
        crumbs={[{ label: 'Administración' }, { label: 'Tasas de cambio' }]}
      />

      {/* ---- Tarjetas resumen: BCV + REPOSICION + Ratio ---- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tasa BCV (oficial)
                </Typography>
                {bcvValue != null ? (
                  <>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 800 }}>
                      {bcvValue.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {latestBcv?.effectiveDate}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    Sin tasa BCV. Actualiza desde el botón.
                  </Typography>
                )}
              </Box>
              <Chip size="small" color="success" variant="outlined" label="BCV" />
            </Stack>
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="solar:download-bold" />}
              loading={fetchBcvMutation.isPending}
              onClick={handleFetchBcv}
              fullWidth
              sx={{ mt: 2 }}
            >
              Actualizar BCV
            </Button>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tasa de Reposición
                </Typography>
                {reposicionValue != null ? (
                  <>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 800 }}>
                      {reposicionValue.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {latestReposicion?.effectiveDate}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    Sin tasa de reposición registrada.
                  </Typography>
                )}
              </Box>
              <Chip size="small" color="info" variant="outlined" label="Reposición" />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 2 }}>
              Costo real de reponer stock. Usada para revalorizar precios de venta.
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              p: 3,
              height: '100%',
              bgcolor: ratio != null && ratio > 1 ? 'warning.lighter' : 'background.neutral',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Multiplicador de revalorización
            </Typography>
            {ratio != null ? (
              <>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 800 }}>
                  {ratio.toFixed(4)}×
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Diferencial: {((ratio - 1) * 100).toFixed(2)}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 1, color: 'text.secondary' }}
                >
                  Ej: $1.00 → ${ratio.toFixed(2)}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Registra una tasa de reposición para calcular el multiplicador.
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ---- Form: Registrar tasa de reposición ---- */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Registrar tasa de reposición
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Esta tasa refleja el costo real de reponer inventario.{' '}
          <strong>Debe ser ≥ tasa BCV vigente</strong>
          {bcvValue != null && ` (actual: ${bcvValue})`}.
        </Typography>

        <Form methods={reposicionMethods} onSubmit={submitReposicion}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text
              name="rate"
              label="Tasa de reposición (USD → VES)"
              placeholder={bcvValue != null ? `Ej. ${(bcvValue * 1.3).toFixed(2)}` : 'Ej. 700.00'}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <Field.Text
              name="effectiveDate"
              label="Fecha efectiva"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 200 } }}
            />
            <Button
              type="submit"
              variant="contained"
              color="info"
              loading={createMutation.isPending}
              sx={{ minWidth: 160, height: 56 }}
            >
              Registrar
            </Button>
          </Stack>
        </Form>
      </Card>

      {/* ---- Form: Override manual ---- */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Sobreescribir manualmente (override)
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Usar solo cuando BCV no publique la tasa del día o haya un evento cambiario
          extraordinario. Quedará marcada como “Manual”.
        </Typography>

        <Form methods={overrideMethods} onSubmit={submitOverride}>
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

      {/* ---- Historial ---- */}
      <Card>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Typography variant="subtitle2">Historial</Typography>
          <ToggleButtonGroup
            value={filter}
            exclusive
            size="small"
            onChange={(_, value: FilterOption | null) => value && setFilter(value)}
          >
            <ToggleButton value="all">Todas</ToggleButton>
            <ToggleButton value="BCV">BCV</ToggleButton>
            <ToggleButton value="REPOSICION">Reposición</ToggleButton>
            <ToggleButton value="manual">Manual</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {ratesQuery.isError && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => ratesQuery.refetch()}>
                  Reintentar
                </Button>
              }
            >
              {(ratesQuery.error as Error)?.message ?? 'Error al cargar tasas'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={rates}
            loading={ratesQuery.isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
