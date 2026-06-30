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
import { useBranchScope } from '@/features/branches/ui/branch-scope-context';

import { generateComprobantePdf } from '../../model/comprobante-pdf';
import { useIvaRetentions, useVoidIvaRetention, downloadRetentionTxt } from '../../api/queries';

const fmtBs = (n: number | string) =>
  `Bs ${(Number(n) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function IvaRetentionsPage() {
  const { selectedBranchId } = useBranchScope();
  const [period, setPeriod] = useState(currentPeriod());
  const [downloading, setDownloading] = useState(false);
  const [comprobante, setComprobante] = useState<IvaRetention | null>(null);

  const { data, isLoading, isError } = useIvaRetentions(period, selectedBranchId ?? undefined);
  const voidMutation = useVoidIvaRetention();

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      count: rows.length,
      retainedBs: rows.reduce((s, r) => s + (Number(r.vatRetainedBs) || 0), 0),
    };
  }, [data]);

  const exportTxt = async () => {
    setDownloading(true);
    try {
      await downloadRetentionTxt(period, selectedBranchId ?? undefined);
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

      {/* El agente de retención (RIF + expediente) se configura por sucursal */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Cada sucursal retiene con su propio RIF y expediente. Configurá qué sucursales son agente de
        retención (contribuyente especial) en <strong>Administración › Sucursales</strong>. Solo esas
        generan comprobante al recibir compras, con correlativo propio.
      </Alert>

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
