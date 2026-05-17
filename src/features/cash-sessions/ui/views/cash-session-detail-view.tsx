import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';

import {
  useXReportQuery,
  useZReportQuery,
  useCashSessionQuery,
} from '../../api/cash-sessions.queries';

// ----------------------------------------------------------------------

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const bsFmt = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta',
  closed: 'Cerrada',
  audited: 'Auditada',
};

const STATUS_COLOR: Record<string, 'success' | 'default' | 'info'> = {
  open: 'success',
  closed: 'default',
  audited: 'info',
};

const MOVEMENT_LABEL: Record<string, string> = {
  opening: 'Apertura',
  sale: 'Venta',
  return: 'Devolución',
  payout: 'Retiro',
  deposit: 'Depósito',
  adjustment: 'Ajuste',
};

export function CashSessionDetailView() {
  const router = useRouter();
  const { id } = useParams();

  const { data: session, isLoading, isError, error } = useCashSessionQuery(id);
  const isOpen = session?.status === 'open';
  const xReportQuery = useXReportQuery(id, isOpen);
  const zReportQuery = useZReportQuery(id, !isOpen && Boolean(session));

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !session) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 4 }}>
          {(error as Error)?.message ?? 'Sesión no encontrada'}
        </Alert>
      </Container>
    );
  }

  const totals = isOpen ? xReportQuery.data?.totals : zReportQuery.data?.totals.totals;
  const byMethod = isOpen ? xReportQuery.data?.byMethod : zReportQuery.data?.totals.byMethod;

  return (
    <Container maxWidth="xl">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h4">Sesión de caja</Typography>
            <Chip
              size="small"
              color={STATUS_COLOR[session.status]}
              label={STATUS_LABEL[session.status]}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {session.terminal?.code ? `Terminal ${session.terminal.code}` : 'Terminal'}
            {session.branch?.name && ` · ${session.branch.name}`}
          </Typography>
        </Box>
        <Button
          color="inherit"
          variant="outlined"
          onClick={() => router.push(paths.dashboard.pos.cashSessions.root)}
          startIcon={<Iconify icon="solar:multiple-forward-left-broken" />}
        >
          Volver
        </Button>
      </Stack>

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Cabecera
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Apertura
              </Typography>
              <Typography variant="body2">
                {new Date(session.openedAt).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {session.openedBy?.fullName ?? '—'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Cierre
              </Typography>
              <Typography variant="body2">
                {session.closedAt ? new Date(session.closedAt).toLocaleString() : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {session.closedBy?.fullName ?? '—'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Apertura USD
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {usdFmt.format(Number(session.openingAmountUsd))}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Apertura Bs
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                Bs. {bsFmt.format(Number(session.openingAmountBs))}
              </Typography>
            </Box>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            {isOpen ? 'Reporte X (parcial)' : 'Reporte Z (post-cierre)'}
          </Typography>

          {totals ? (
            <>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={3}
                flexWrap="wrap"
                sx={{ mb: 3 }}
              >
                <Metric label="Ventas" value={usdFmt.format(totals.salesUsd)} />
                <Metric label="Devoluciones" value={usdFmt.format(totals.returnsUsd)} />
                <Metric
                  label="Retiros"
                  value={usdFmt.format(totals.payoutsUsd)}
                  color="warning.main"
                />
                <Metric
                  label="Depósitos"
                  value={usdFmt.format(totals.depositsUsd)}
                  color="info.main"
                />
                <Metric
                  label="Esperado USD"
                  value={usdFmt.format(totals.expectedUsd)}
                  highlight
                />
                <Metric
                  label="Esperado Bs"
                  value={`Bs. ${bsFmt.format(totals.expectedBs)}`}
                  highlight
                />
              </Stack>

              {byMethod && Object.keys(byMethod).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Por método de pago
                  </Typography>
                  <Table size="small" sx={{ mt: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Método</TableCell>
                        <TableCell align="right"># Movs</TableCell>
                        <TableCell align="right">Total USD</TableCell>
                        <TableCell align="right">Total Bs</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(byMethod).map(([method, stats]) => (
                        <TableRow key={method}>
                          <TableCell>{method}</TableCell>
                          <TableCell align="right">{stats.count}</TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            {usdFmt.format(stats.totalUsd)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            Bs. {bsFmt.format(stats.totalBs)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </>
          ) : (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Card>

        {!isOpen && (
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Cierre
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} flexWrap="wrap">
              <Metric
                label="Declarado USD"
                value={
                  session.closingDeclaredUsd !== null
                    ? usdFmt.format(Number(session.closingDeclaredUsd))
                    : '—'
                }
              />
              <Metric
                label="Calculado USD"
                value={
                  session.closingCalculatedUsd !== null
                    ? usdFmt.format(Number(session.closingCalculatedUsd))
                    : '—'
                }
              />
              <Metric
                label="Diferencia USD"
                value={
                  session.differenceUsd !== null
                    ? usdFmt.format(Number(session.differenceUsd))
                    : '—'
                }
                color={
                  session.differenceUsd === null
                    ? undefined
                    : Math.abs(Number(session.differenceUsd)) < 0.01
                      ? 'success.main'
                      : Number(session.differenceUsd) < 0
                        ? 'error.main'
                        : 'warning.main'
                }
              />
            </Stack>
            {session.notes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Notas
                </Typography>
                <Typography variant="body2">{session.notes}</Typography>
              </Box>
            )}
          </Card>
        )}

        {session.movements && session.movements.length > 0 && (
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Movimientos ({session.movements.length})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hora</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell align="right">USD</TableCell>
                  <TableCell align="right">Bs</TableCell>
                  <TableCell>Notas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {session.movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{MOVEMENT_LABEL[m.type] ?? m.type}</TableCell>
                    <TableCell>{m.paymentMethod}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {usdFmt.format(Number(m.amountUsd))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      Bs. {bsFmt.format(Number(m.amountBs))}
                    </TableCell>
                    <TableCell>{m.notes ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </Stack>
    </Container>
  );
}

// ----------------------------------------------------------------------

function Metric({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant={highlight ? 'subtitle1' : 'body2'}
        sx={{ fontFamily: 'monospace', fontWeight: highlight ? 700 : 400, color }}
      >
        {value}
      </Typography>
    </Box>
  );
}
