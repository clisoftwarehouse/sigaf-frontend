import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/app/components/iconify';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  useRevokeApiKeyMutation,
  useTerminalApiKeysQuery,
  useIssuePairingCodeMutation,
} from '../../api/terminal-pairing.queries';

// ----------------------------------------------------------------------

type Props = {
  terminalId: string;
};

export function TerminalPairingPanel({ terminalId }: Props) {
  const apiKeysQuery = useTerminalApiKeysQuery(terminalId);
  const issueMutation = useIssuePairingCodeMutation(terminalId);
  const revokeMutation = useRevokeApiKeyMutation(terminalId);

  const [issued, setIssued] = useState<{ code: string; expiresAt: string } | null>(null);
  const [toRevoke, setToRevoke] = useState<{ id: string; prefix: string } | null>(null);

  const handleIssue = async () => {
    try {
      const result = await issueMutation.mutateAsync();
      setIssued(result);
      toast.success('Código generado. Cópialo ahora; no se mostrará otra vez.');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleRevoke = async () => {
    if (!toRevoke) return;
    try {
      await revokeMutation.mutateAsync(toRevoke.id);
      toast.success('apiKey revocada');
      setToRevoke(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const apiKeys = apiKeysQuery.data ?? [];
  const activeCount = apiKeys.filter((k) => !k.revokedAt).length;

  return (
    <Card sx={{ p: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="subtitle1">Emparejamiento del equipo</Typography>
          <Typography variant="caption" color="text.secondary">
            Genera un código de un solo uso para emparejar este terminal con un PC físico.
            Vigencia: 10 minutos.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleIssue}
          loading={issueMutation.isPending}
        >
          Generar código
        </Button>
      </Stack>

      {issued && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          action={
            <IconButton
              size="small"
              onClick={() => {
                navigator.clipboard?.writeText(issued.code);
                toast.message('Código copiado al portapapeles');
              }}
            >
              <Iconify icon="solar:copy-bold" />
            </IconButton>
          }
        >
          <Stack>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Código de emparejamiento (válido hasta{' '}
              {new Date(issued.expiresAt).toLocaleTimeString()})
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontFamily: 'monospace', letterSpacing: 4, mt: 0.5 }}
            >
              {issued.code}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Cópialo y úsalo en el POS del PC objetivo. No volverá a mostrarse.
            </Typography>
          </Stack>
        </Alert>
      )}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="caption" color="text.secondary">
          {activeCount} apiKey(s) activa(s) · {apiKeys.length - activeCount} revocada(s)
        </Typography>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Prefix</TableCell>
            <TableCell>Etiqueta</TableCell>
            <TableCell>Creada</TableCell>
            <TableCell>Último uso</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {apiKeys.length === 0 && !apiKeysQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Aún no hay equipos emparejados con este terminal.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            apiKeys.map((k) => (
              <TableRow key={k.id}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{k.keyPrefix}…</TableCell>
                <TableCell>{k.label ?? '—'}</TableCell>
                <TableCell>
                  {k.createdAt ? new Date(k.createdAt).toLocaleString() : '—'}
                </TableCell>
                <TableCell>
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '—'}
                </TableCell>
                <TableCell>
                  {k.revokedAt ? (
                    <Chip size="small" color="error" label="Revocada" />
                  ) : (
                    <Chip size="small" color="success" label="Activa" />
                  )}
                </TableCell>
                <TableCell align="right">
                  {!k.revokedAt && (
                    <Tooltip title="Revocar">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => setToRevoke({ id: k.id, prefix: k.keyPrefix })}
                      >
                        <Iconify icon="solar:forbidden-circle-bold" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!toRevoke}
        title="Revocar apiKey"
        description={
          toRevoke ? (
            <>
              Al revocar la apiKey <strong>{toRevoke.prefix}…</strong> el PC asociado
              quedará desemparejado y deberá volver a empareja con un código nuevo.
              ¿Continuar?
            </>
          ) : null
        }
        confirmLabel="Revocar"
        loading={revokeMutation.isPending}
        onConfirm={handleRevoke}
        onClose={() => setToRevoke(null)}
      />
    </Card>
  );
}
