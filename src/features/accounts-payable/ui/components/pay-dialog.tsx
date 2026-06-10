import type { PaymentMethod, CurrencyNative, AccountsPayable } from '../../model/types';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fmtUsd, toNumber } from './format';
import { useRegisterPayment } from '../../api/accounts-payable.queries';

const METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Efectivo Bs.' },
  { value: 'dollars', label: 'Efectivo USD' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'check', label: 'Cheque' },
  { value: 'mixed', label: 'Mixto' },
  { value: 'other', label: 'Otro' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  cxp: AccountsPayable | null;
};

export function PayDialog({ open, onClose, cxp }: Props) {
  const register = useRegisterPayment();
  const [currency, setCurrency] = useState<CurrencyNative>('USD');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  if (!cxp) return null;

  const balance = toNumber(cxp.balanceUsd);
  const amountNum = toNumber(amount);
  const rateNum = toNumber(exchangeRate);

  let amountUsd = amountNum;
  let amountNative = amountNum;
  if (currency === 'VES' && rateNum > 0) {
    amountUsd = amountNum / rateNum;
  } else if (currency === 'USD') {
    amountNative = amountNum;
  }

  const exceeds = amountUsd > balance + 0.01;

  const handleSubmit = () => {
    if (amountNum <= 0) {
      toast.warning('El monto debe ser mayor a cero');
      return;
    }
    if (currency === 'VES' && rateNum <= 0) {
      toast.warning('Indicá la tasa de cambio para pagos en bolívares');
      return;
    }
    if (exceeds) {
      toast.warning('El pago excede el saldo pendiente');
      return;
    }
    register.mutate(
      {
        cxpId: cxp.id,
        payload: {
          paymentDate,
          amountUsd: Math.round(amountUsd * 10000) / 10000,
          amountNative: Math.round(amountNative * 10000) / 10000,
          currencyNative: currency,
          exchangeRate: currency === 'VES' ? rateNum : undefined,
          method,
          reference: reference || undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Pago registrado');
          handleClose();
        },
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      },
    );
  };

  const handleClose = () => {
    setAmount('');
    setExchangeRate('');
    setReference('');
    setNotes('');
    setMethod('transfer');
    setCurrency('USD');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar pago</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info" variant="outlined">
            <Typography variant="caption" color="text.secondary">
              Proveedor
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {cxp.supplier?.name ?? cxp.supplierId}
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
              Factura {cxp.invoiceNumber ?? '—'} · Saldo {fmtUsd(balance)}
            </Typography>
          </Alert>

          <TextField
            label="Fecha de pago"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              select
              label="Moneda del pago"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyNative)}
              size="small"
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="VES">Bs. (VES)</MenuItem>
            </TextField>
            <TextField
              label={`Monto ${currency}`}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              size="small"
              error={exceeds}
              helperText={
                currency === 'VES' && rateNum > 0
                  ? `Equivalente ${fmtUsd(amountUsd)}`
                  : exceeds
                    ? 'Excede el saldo pendiente'
                    : ' '
              }
            />
          </Box>

          {currency === 'VES' && (
            <TextField
              label="Tasa de cambio (Bs./USD)"
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              size="small"
              helperText="Tasa BCV del día del pago"
            />
          )}

          <TextField
            select
            label="Método"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            size="small"
          >
            {METHODS.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Referencia (cheque, transferencia, etc)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            size="small"
          />

          <TextField
            label="Notas"
            multiline
            minRows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={register.isPending}>
          {register.isPending ? 'Registrando…' : 'Registrar pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
