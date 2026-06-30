import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/app/components/iconify';

import { useTerminalQuery } from '../../api/terminals.queries';
import { useArmFiscalPairingMutation } from '../../api/terminal-pairing.queries';

// ----------------------------------------------------------------------

type Props = {
  terminalId: string;
};

/**
 * Vinculación caja ↔ impresora fiscal (homologación SENIAT). El admin "habilita"
 * el emparejamiento; el POS, al conectar la impresora, lee el serial real y lo
 * vincula automáticamente. Mientras está habilitado, polleamos la caja para
 * detectar el momento en que el serial aparece.
 */
export function TerminalFiscalPairingPanel({ terminalId }: Props) {
  const [armedUntil, setArmedUntil] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  // `armed` derivado en efecto (no en render) + auto-apagado al expirar.
  useEffect(() => {
    if (!armedUntil) {
      setArmed(false);
      return undefined;
    }
    const ms = new Date(armedUntil).getTime() - Date.now();
    if (ms <= 0) {
      setArmed(false);
      return undefined;
    }
    setArmed(true);
    const t = setTimeout(() => setArmed(false), ms);
    return () => clearTimeout(t);
  }, [armedUntil]);

  const terminalQuery = useTerminalQuery(terminalId, { refetchInterval: armed ? 3_000 : false });
  const armMutation = useArmFiscalPairingMutation(terminalId);

  const terminal = terminalQuery.data;
  const boundSerial = terminal?.fiscalPrinterSerial ?? null;

  // Si el backend ya reporta una ventana de armado vigente, reflejarla.
  useEffect(() => {
    const at = terminal?.fiscalPairingArmedAt;
    if (!at) return;
    const expires = new Date(new Date(at).getTime() + 30 * 60_000).toISOString();
    if (new Date(expires).getTime() > Date.now()) setArmedUntil((prev) => prev ?? expires);
  }, [terminal?.fiscalPairingArmedAt]);

  // Cuando aparece/cambia el serial vinculado estando armados, el POS vinculó.
  const [baselineSerial, setBaselineSerial] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (!armed) {
      setBaselineSerial(undefined);
      return;
    }
    if (baselineSerial === undefined) {
      setBaselineSerial(boundSerial);
      return;
    }
    if (boundSerial && boundSerial !== baselineSerial) {
      toast.success(`Impresora fiscal vinculada (serial ${boundSerial}).`);
      setArmedUntil(null);
      setBaselineSerial(undefined);
    }
  }, [armed, boundSerial, baselineSerial]);

  const handleArm = async () => {
    try {
      const res = await armMutation.mutateAsync();
      setArmedUntil(res.expiresAt);
      toast.success('Emparejamiento habilitado. Conectá la impresora en el POS de esta caja.');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1">Impresora fiscal</Typography>
          <Typography variant="caption" color="text.secondary">
            Vincula esta caja a UNA impresora fiscal por su serial (requisito SENIAT). El POS lee el
            serial real y lo vincula automáticamente mientras esté habilitado.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:link-2-fill" />}
          onClick={handleArm}
          loading={armMutation.isPending}
        >
          {boundSerial ? 'Re-emparejar' : 'Habilitar emparejamiento'}
        </Button>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: armed ? 2 : 0 }}>
        <Typography variant="body2" color="text.secondary">
          Impresora vinculada:
        </Typography>
        {boundSerial ? (
          <Chip
            color="success"
            label={boundSerial}
            icon={<Iconify icon="solar:printer-minimalistic-bold" />}
            sx={{ fontFamily: 'monospace', fontWeight: 700 }}
          />
        ) : (
          <Chip color="warning" variant="outlined" label="Sin vincular" />
        )}
      </Stack>

      {armed && (
        <Alert severity="info" icon={<Iconify icon="solar:clock-circle-bold" />}>
          Emparejamiento habilitado hasta <strong>{new Date(armedUntil!).toLocaleTimeString()}</strong>.
          Abrí el POS de esta caja y conectá/verificá la impresora fiscal: el serial se vinculará solo.
        </Alert>
      )}

      {boundSerial && !armed && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
          El POS solo puede imprimir en esta impresora. Si la cambiás (daño/reemplazo), tocá
          “Re-emparejar” y vinculá la nueva desde el POS.
        </Typography>
      )}
    </Card>
  );
}
