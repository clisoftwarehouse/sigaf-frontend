import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { PageHeader } from '@/shared/ui/page-header';

import { useSaleTicketQuery } from '../../api/sales.queries';
import { SALE_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '../../model/types';

// ----------------------------------------------------------------------

const n = (v: number | string | null | undefined): number => {
  const x = typeof v === 'string' ? parseFloat(v) : (v ?? 0);
  return Number.isFinite(x) ? (x as number) : 0;
};
const usd = (v: number | string | null | undefined) => `$${n(v).toFixed(2)}`;
const bs = (v: number | string | null | undefined) =>
  `Bs ${n(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qty = (v: number | string | null | undefined) => n(v).toFixed(3).replace(/\.?0+$/, '');
const dateTime = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('es-VE');
};

export function SaleDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: sale, isLoading, isError, error } = useSaleTicketQuery(id);

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !sale) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {(error as Error)?.message ?? 'No se pudo cargar la venta.'}
        </Alert>
      </Container>
    );
  }

  const isVoided = sale.status === 'voided';
  const isReturn = sale.type === 'return';

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={`Venta #${sale.ticketNumber}`}
        subtitle={`${dateTime(sale.createdAt)} · ${sale.branch?.name ?? 'Sucursal'} · ${
          sale.terminal?.name ?? sale.terminal?.code ?? 'Terminal'
        }`}
        crumbs={[{ label: 'Reportes' }, { label: 'Ventas' }, { label: `#${sale.ticketNumber}` }]}
        action={
          <Stack direction="row" spacing={1}>
            {isReturn && <Chip color="warning" variant="soft" label="Devolución" />}
            <Chip
              color={isVoided ? 'error' : 'success'}
              variant="soft"
              label={SALE_STATUS_LABEL[sale.status] ?? sale.status}
            />
          </Stack>
        }
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoCard
            title="Cliente"
            lines={[
              sale.customer?.fullName ?? 'Consumidor final',
              sale.customer?.documentNumber
                ? `${sale.customer.documentType ?? ''} ${sale.customer.documentNumber}`.trim()
                : '—',
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoCard
            title="Cajero / Caja"
            lines={[sale.salesperson?.fullName ?? '—', sale.terminal?.name ?? sale.terminal?.code ?? '—']}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoCard
            title="Documentos"
            lines={[
              sale.controlNumber ? `Control: ${sale.controlNumber}` : 'Sin nº de control',
              sale.provisionalNumber ? `Provisional: ${sale.provisionalNumber}` : `Tasa: ${bs(sale.exchangeRateUsdBs)}/$`,
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
              Productos ({sale.items.length})
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cant.</TableCell>
                    <TableCell align="right">P. Unit</TableCell>
                    <TableCell align="right">Desc.</TableCell>
                    <TableCell align="right">Total línea</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items
                    .slice()
                    .sort((a, b) => a.lineNumber - b.lineNumber)
                    .map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.lineNumber}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{it.productSku}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="body2">{it.productName}</Typography>
                            {it.requiresRx && (
                              <Chip size="small" color="error" variant="soft" label="Rx" sx={{ height: 18 }} />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{qty(it.quantity)}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {usd(it.unitPriceUsd)}
                        </TableCell>
                        <TableCell align="right">
                          {n(it.discountPercent) > 0 ? `${n(it.discountPercent).toFixed(2)}%` : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {usd(it.lineTotalUsd)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
              Pagos ({sale.payments.length})
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Método</TableCell>
                    <TableCell>Referencia</TableCell>
                    <TableCell align="right">Monto USD</TableCell>
                    <TableCell align="right">Monto Bs</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2">
                            {PAYMENT_METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                          </Typography>
                          {p.isFx && <Chip size="small" variant="soft" color="info" label="Divisa" sx={{ height: 18 }} />}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {p.referenceNumber ?? (p.cardLast4 ? `•••• ${p.cardLast4}` : '—')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {usd(p.amountUsd)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {bs(p.amountBs)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Totales
            </Typography>
            <TotalRow label="Subtotal exento" value={usd(sale.subtotalExemptUsd)} />
            <TotalRow label="Subtotal gravado" value={usd(sale.subtotalTaxableUsd)} />
            <TotalRow label="IVA" value={usd(sale.vatAmountUsd)} />
            {n(sale.igtfAmountUsd) > 0 && <TotalRow label="IGTF (3%)" value={usd(sale.igtfAmountUsd)} />}
            <Divider sx={{ my: 1 }} />
            <TotalRow label="Total" value={usd(sale.totalUsd)} strong />
            <TotalRow label="Total Bs" value={bs(sale.totalBs)} />
            <Divider sx={{ my: 1 }} />
            <TotalRow label="Pagado" value={usd(sale.totalPaidUsd)} />
            <TotalRow label="Vuelto" value={usd(sale.changeUsd)} />
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

// ----------------------------------------------------------------------

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      {lines.map((l, i) => (
        <Typography key={i} variant={i === 0 ? 'subtitle2' : 'body2'} color={i === 0 ? 'text.primary' : 'text.secondary'} noWrap title={l}>
          {l}
        </Typography>
      ))}
    </Card>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography variant={strong ? 'subtitle1' : 'body2'} color={strong ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography
        variant={strong ? 'subtitle1' : 'body2'}
        sx={{ fontFamily: 'monospace', fontWeight: strong ? 800 : 500 }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
