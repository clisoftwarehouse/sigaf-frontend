import type { IvaRetention } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { PageHeader } from '@/shared/ui/page-header';

import { generateComprobantePdf } from '../../model/comprobante-pdf';
import {
  useAgentConfig,
  saveAgentConfig,
  useIvaRetentions,
  useVoidIvaRetention,
  downloadRetentionTxt,
} from '../../api/queries';

const fmtBs = (n: number | string) =>
  `Bs ${(Number(n) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Valida un RIF venezolano: prefijo V/E/J/G/P + 8 dígitos. Las personas
 * jurídicas (J/G) exigen el dígito verificador. Devuelve el RIF canónico
 * (con guiones) o null si es inválido.
 */
function normalizeRif(value: string): string | null {
  const m = /^([VEJGP])-?(\d{8})-?(\d?)$/.exec(value.trim().toUpperCase());
  if (!m) return null;
  const [, prefix, digits, check] = m;
  const needsCheck = prefix === 'J' || prefix === 'G';
  if (needsCheck && !check) return null;
  return needsCheck ? `${prefix}-${digits}-${check}` : `${prefix}-${digits}`;
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function IvaRetentionsPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [downloading, setDownloading] = useState(false);
  const [comprobante, setComprobante] = useState<IvaRetention | null>(null);

  const agentQuery = useAgentConfig();
  const [agentRif, setAgentRif] = useState<string | null>(null);
  const [expediente, setExpediente] = useState<string | null>(null);
  const [savingAgent, setSavingAgent] = useState(false);
  const rifValue = agentRif ?? agentQuery.data?.agentRif ?? '';
  const expValue = expediente ?? agentQuery.data?.expediente ?? '';
  const rifCanonical = normalizeRif(rifValue);
  const rifInvalid = rifValue.trim() !== '' && !rifCanonical;

  const { data, isLoading, isError } = useIvaRetentions(period);
  const voidMutation = useVoidIvaRetention();

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      count: rows.length,
      retainedBs: rows.reduce((s, r) => s + (Number(r.vatRetainedBs) || 0), 0),
    };
  }, [data]);

  const saveAgent = async () => {
    if (!rifCanonical) {
      toast.error('El RIF del agente no es válido. Formato: J-12345678-9.');
      return;
    }
    setSavingAgent(true);
    try {
      await saveAgentConfig({ agentRif: rifCanonical, expediente: expValue.trim() });
      setAgentRif(rifCanonical);
      toast.success('Configuración del agente de retención guardada.');
      agentQuery.refetch();
    } catch (e) {
      toast.error(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setSavingAgent(false);
    }
  };

  const exportTxt = async () => {
    setDownloading(true);
    try {
      await downloadRetentionTxt(period);
      toast.success(`TXT de retención ${period} descargado.`);
    } catch (e) {
      toast.error(`No se pudo generar el TXT: ${(e as Error).message}`);
    } finally {
      setDownloading(false);
    }
  };

  const voidOne = async (r: IvaRetention) => {
    try {
      await voidMutation.mutateAsync(r.id);
      toast.success(`Comprobante ${r.voucherNumber} anulado.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Retenciones de IVA"
        subtitle="Comprobantes de retención a proveedores (contribuyente especial) y archivo TXT del SENIAT."
        crumbs={[{ label: 'Admin' }, { label: 'Retenciones de IVA' }]}
      />

      {/* Config del agente de retención */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Agente de retención
          </Typography>
          {!agentQuery.data?.agentRif && (
            <Alert severity="warning" sx={{ my: 1 }}>
              Sin RIF del agente, las retenciones NO se generan. Configúralo para activar la
              retención al recibir compras.
            </Alert>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }} alignItems="flex-start">
            <TextField
              label="RIF del agente"
              size="small"
              value={rifValue}
              onChange={(e) => setAgentRif(e.target.value.toUpperCase())}
              placeholder="J-12345678-9"
              error={rifInvalid}
              helperText={rifInvalid ? 'RIF inválido. Formato: J-12345678-9' : 'Persona jurídica: incluye el dígito verificador'}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Número de expediente"
              size="small"
              value={expValue}
              onChange={(e) => setExpediente(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={saveAgent}
              loading={savingAgent}
              disabled={!rifCanonical}
            >
              Guardar
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Filtro período + export */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Período (AAAAMM)"
              size="small"
              value={period}
              onChange={(e) => setPeriod(e.target.value.replace(/\D/g, '').slice(0, 6))}
              sx={{ width: 160 }}
            />
            <Chip
              variant="soft"
              color="error"
              label={`${totals.count} comprobante(s) · retenido ${fmtBs(totals.retainedBs)}`}
            />
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color="success"
              onClick={exportTxt}
              loading={downloading}
              disabled={!data || data.length === 0}
            >
              Exportar TXT SENIAT
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            No se pudo cargar las retenciones.
          </Alert>
        ) : (data?.length ?? 0) === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            No hay retenciones en el período {period}.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Comprobante</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell>Factura</TableCell>
                  <TableCell>Control</TableCell>
                  <TableCell align="right">Base</TableCell>
                  <TableCell align="right">IVA</TableCell>
                  <TableCell align="right">Retenido</TableCell>
                  <TableCell align="center">%</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data!.map((r) => (
                  <TableRow key={r.id} hover sx={{ opacity: r.status === 'voided' ? 0.5 : 1 }}>
                    <TableCell>{r.voucherNumber}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {r.supplierBusinessName ?? r.supplierRif}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {r.supplierRif}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.invoiceNumber ?? '—'}</TableCell>
                    <TableCell>{r.controlNumber ?? '—'}</TableCell>
                    <TableCell align="right">{fmtBs(r.baseImponibleBs)}</TableCell>
                    <TableCell align="right">{fmtBs(r.vatBs)}</TableCell>
                    <TableCell align="right">
                      <strong>{fmtBs(r.vatRetainedBs)}</strong>
                    </TableCell>
                    <TableCell align="center">{Number(r.retentionPct)}%</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver comprobante">
                        <IconButton size="small" onClick={() => setComprobante(r)}>
                          🧾
                        </IconButton>
                      </Tooltip>
                      {r.status === 'active' && (
                        <Tooltip title="Anular">
                          <IconButton size="small" color="error" onClick={() => voidOne(r)}>
                            ✕
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <ComprobanteDialog retention={comprobante} onClose={() => setComprobante(null)} />
    </Container>
  );
}

// ----------------------------------------------------------------------

function ComprobanteDialog({
  retention: r,
  onClose,
}: {
  retention: IvaRetention | null;
  onClose: () => void;
}) {
  if (!r) return null;
  return (
    <Dialog open={!!r} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Comprobante de Retención de IVA</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          <Row k="Nº Comprobante" v={r.voucherNumber} />
          <Row k="Período" v={r.period} />
          <Row k="RIF Agente" v={r.agentRif} />
          <Row k="Proveedor" v={`${r.supplierBusinessName ?? ''} (${r.supplierRif})`} />
          <Row k="Documento" v={`${r.fiscalDocType} · ${r.invoiceNumber ?? ''}`} />
          <Row k="Nº Control" v={r.controlNumber ?? '—'} />
          <Row k="Fecha factura" v={r.invoiceDate ?? '—'} />
          <Row k="Total documento" v={fmtBs(r.totalBs)} />
          <Row k="Base imponible" v={fmtBs(r.baseImponibleBs)} />
          <Row k="Exento" v={fmtBs(r.exemptBs)} />
          <Row k={`IVA (${Number(r.vatRate)}%)`} v={fmtBs(r.vatBs)} />
          <Row k={`IVA retenido (${Number(r.retentionPct)}%)`} v={fmtBs(r.vatRetainedBs)} strong />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cerrar
        </Button>
        <Button variant="contained" onClick={() => generateComprobantePdf(r)}>
          Descargar PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {k}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 800 : 500 }}>
        {v}
      </Typography>
    </Stack>
  );
}
