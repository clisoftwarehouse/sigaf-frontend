import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '@/app/components/iconify';

import { AgingChip } from './aging-chip';
import { PayDialog } from './pay-dialog';
import { StatusChip } from './status-chip';
import { fmtBs, fmtUsd, fmtDate, toNumber } from './format';
import { useCxpDetail, useCancelCxp, useReversePayment } from '../../api/accounts-payable.queries';

type Props = {
  cxpId: string | null;
  onClose: () => void;
};

export function CxpDetailDrawer({ cxpId, onClose }: Props) {
  const { data, isLoading } = useCxpDetail(cxpId);
  const reverseMut = useReversePayment();
  const cancelMut = useCancelCxp();
  const [payOpen, setPayOpen] = useState(false);

  const handleCancel = (id: string) => {
    const reason = window.prompt('Motivo de la cancelación:');
    if (!reason || reason.trim().length === 0) return;
    cancelMut.mutate(
      { id, reason: reason.trim() },
      {
        onSuccess: () => toast.success('Cuenta cancelada'),
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      },
    );
  };

  const cxp = data ?? null;

  const handleReverse = (paymentId: string) => {
    const reason = window.prompt('Motivo de la reversa:');
    if (!reason || reason.trim().length === 0) return;
    reverseMut.mutate(
      { paymentId, reason: reason.trim() },
      {
        onSuccess: () => toast.success('Pago revertido'),
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      },
    );
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={!!cxpId}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 'min(800px, 90vw)', xl: 'min(950px, 80vw)' },
              p: 0,
            },
          },
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {cxp && (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Cuenta por pagar
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {cxp.supplier?.name ?? cxp.supplierId}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                    <StatusChip status={cxp.status} />
                    <AgingChip bucket={cxp.agingBucket} days={cxp.daysOverdue} />
                    {cxp.invoiceNumber && (
                      <Chip size="small" variant="outlined" label={`Factura ${cxp.invoiceNumber}`} />
                    )}
                  </Stack>
                </Box>
                <IconButton onClick={onClose}>
                  <Iconify icon="solar:close-circle-bold" />
                </IconButton>
              </Stack>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, my: 2 }}>
                <Card variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Monto original
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {fmtUsd(cxp.originalAmountUsd)}
                  </Typography>
                  {cxp.currencyNative === 'VES' && (
                    <Typography variant="caption" color="text.disabled">
                      {fmtBs(cxp.originalAmountNative)} · Tasa {toNumber(cxp.exchangeRateAtCreation).toFixed(2)}
                    </Typography>
                  )}
                </Card>
                <Card variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Saldo pendiente
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: toNumber(cxp.balanceUsd) > 0 ? 'error.dark' : 'success.dark' }}
                  >
                    {fmtUsd(cxp.balanceUsd)}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Pagado {fmtUsd(cxp.paidAmountUsd)}
                  </Typography>
                </Card>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Fecha factura
                  </Typography>
                  <Typography variant="body2">{fmtDate(cxp.invoiceDate)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Vencimiento
                  </Typography>
                  <Typography variant="body2">{fmtDate(cxp.dueDate)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Plazo
                  </Typography>
                  <Typography variant="body2">{cxp.paymentTermsDays} días</Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {(cxp.status === 'open' || cxp.status === 'partial') && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Iconify icon="solar:wad-of-money-bold" />}
                    onClick={() => setPayOpen(true)}
                  >
                    Registrar pago
                  </Button>
                )}
                {cxp.status === 'open' && toNumber(cxp.paidAmountUsd) === 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Iconify icon="solar:close-circle-bold" />}
                    onClick={() => handleCancel(cxp.id)}
                  >
                    Cancelar cuenta
                  </Button>
                )}
              </Stack>

              <Divider sx={{ mb: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                Pagos aplicados ({cxp.payments?.length ?? 0})
              </Typography>

              {(!cxp.payments || cxp.payments.length === 0) && (
                <Alert severity="info" variant="outlined">
                  Sin pagos aplicados todavía.
                </Alert>
              )}

              {cxp.payments && cxp.payments.length > 0 && (
                <Box sx={{ overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell align="right">Monto USD</TableCell>
                        <TableCell>Método</TableCell>
                        <TableCell>Referencia</TableCell>
                        <TableCell align="center">Estado</TableCell>
                        <TableCell align="center" sx={{ width: 48 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cxp.payments.map((p) => (
                        <TableRow
                          key={p.id}
                          hover
                          sx={{ opacity: p.reversedAt ? 0.5 : 1 }}
                        >
                          <TableCell>{fmtDate(p.paymentDate)}</TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                          >
                            {fmtUsd(p.amountUsd)}
                            {p.currencyNative === 'VES' && (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ display: 'block', fontSize: '0.65rem' }}
                              >
                                {fmtBs(p.amountNative)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell>{p.reference ?? '—'}</TableCell>
                          <TableCell align="center">
                            {p.reversedAt ? (
                              <Chip
                                size="small"
                                color="error"
                                variant="outlined"
                                label="Revertido"
                              />
                            ) : (
                              <Chip
                                size="small"
                                color="success"
                                variant="outlined"
                                label="Aplicado"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {!p.reversedAt && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleReverse(p.id)}
                                title="Revertir pago"
                              >
                                <Iconify icon="solar:reply-bold" width={16} />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {cxp.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Notas
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {cxp.notes}
                  </Typography>
                </>
              )}
            </>
          )}
        </Box>
      </Drawer>

      <PayDialog open={payOpen} onClose={() => setPayOpen(false)} cxp={cxp} />
    </>
  );
}
