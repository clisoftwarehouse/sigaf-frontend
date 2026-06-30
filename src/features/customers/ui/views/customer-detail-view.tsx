import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';

import { CUSTOMER_TYPE_LABELS } from '../../model/types';
import { useClinicalProfileQuery } from '../../api/customers.queries';

// ----------------------------------------------------------------------

const fmtUsd = (n: number) =>
  new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n);

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('es-VE') : '—');

function daysAgoLabel(days: number): string {
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Stack>
  );
}

export function CustomerDetailView() {
  const router = useRouter();
  const { id } = useParams();
  const { data: profile, isLoading, isError, error } = useClinicalProfileQuery(id);

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !profile) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {(error as Error)?.message ?? 'Cliente no encontrado'}
        </Alert>
      </Container>
    );
  }

  const { customer, commercial, pendingPrescriptions, alerts } = profile;

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={customer.fullName}
        subtitle={`${customer.documentType}-${customer.documentNumber}`}
        crumbs={[{ label: 'POS' }, { label: 'Clientes', href: paths.dashboard.pos.customers.root }, { label: 'Ficha' }]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={() => router.push(paths.dashboard.pos.customers.edit(customer.id))}
          >
            Editar
          </Button>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            {/* Alertas */}
            {alerts.length > 0 && (
              <Card sx={(t) => ({ p: 2.5, bgcolor: alpha(t.palette.error.main, 0.08), border: `1px solid ${alpha(t.palette.error.main, 0.24)}` })}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Iconify icon="solar:danger-triangle-bold" sx={{ color: 'error.main' }} />
                  <Typography variant="subtitle2">Alertas de atención</Typography>
                </Stack>
                <Stack spacing={0.5}>
                  {alerts.map((a) => (
                    <Typography key={a} variant="body2" sx={{ color: 'error.dark', fontWeight: 600 }}>
                      {a}
                    </Typography>
                  ))}
                </Stack>
              </Card>
            )}

            {/* Identificación */}
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Identificación
              </Typography>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 6 }}>
                  <Field label="Documento" value={`${customer.documentType}-${customer.documentNumber}`} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Field label="Teléfono" value={customer.phone} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Field label="Correo" value={customer.email} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Field label="Fecha de nacimiento" value={fmtDate(customer.birthDate)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Field label="Dirección" value={customer.address} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Field
                    label="Tipo"
                    value={
                      <Chip
                        size="small"
                        label={CUSTOMER_TYPE_LABELS[customer.customerType] ?? customer.customerType}
                      />
                    }
                  />
                </Grid>
                {customer.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Field label="Notas" value={customer.notes} />
                  </Grid>
                )}
              </Grid>
            </Card>

            {/* Ficha clínica */}
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Ficha clínica
              </Typography>
              <Stack spacing={2}>
                <Field
                  label="Alergias"
                  value={
                    [
                      (customer.conditions ?? [])
                        .filter((c) => c.type === 'allergy')
                        .map((c) => c.name)
                        .join(', '),
                      customer.allergies,
                    ]
                      .filter(Boolean)
                      .join(' · ') || null
                  }
                />
                <Field
                  label="Condiciones crónicas"
                  value={
                    [
                      (customer.conditions ?? [])
                        .filter((c) => c.type === 'chronic')
                        .map((c) => c.name)
                        .join(', '),
                      customer.chronicConditions,
                    ]
                      .filter(Boolean)
                      .join(' · ') || null
                  }
                />
              </Stack>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={3}>
            {/* Comercial */}
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Comercial
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1}>
                  {commercial.isRecurrent && (
                    <Chip size="small" color="success" label="Cliente recurrente" />
                  )}
                  {customer.isBirthdayToday && (
                    <Chip size="small" color="warning" label="🎉 Cumpleaños hoy" />
                  )}
                </Stack>
                <Field label="Compras totales" value={String(commercial.purchaseCount)} />
                <Divider />
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Última compra
                </Typography>
                {commercial.lastPurchase ? (
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      {daysAgoLabel(commercial.lastPurchase.daysAgo)} · {fmtUsd(commercial.lastPurchase.totalUsd)}
                    </Typography>
                    {commercial.lastPurchase.topProducts.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {commercial.lastPurchase.topProducts.join(', ')}
                      </Typography>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sin compras registradas.
                  </Typography>
                )}
              </Stack>
            </Card>

            {/* Récipes pendientes */}
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Récipes pendientes
              </Typography>
              {pendingPrescriptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tiene récipes pendientes.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {pendingPrescriptions.map((p) => (
                    <Stack
                      key={p.id}
                      spacing={0.5}
                      sx={(t) => ({
                        p: 1.5,
                        borderRadius: 1.25,
                        border: `1px solid ${p.expiringSoon ? alpha(t.palette.warning.main, 0.4) : t.palette.divider}`,
                      })}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Dr. {p.doctorName}
                        </Typography>
                        {p.expiringSoon && <Chip size="small" color="warning" label="Por vencer" />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Emitido {fmtDate(p.issuedAt)} · vence {fmtDate(p.expiresAt)}
                      </Typography>
                      {p.items.map((it) => (
                        <Typography key={it.productName} variant="caption" color="text.secondary">
                          • {it.productName} — faltan {it.remaining}
                        </Typography>
                      ))}
                    </Stack>
                  ))}
                </Stack>
              )}
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
