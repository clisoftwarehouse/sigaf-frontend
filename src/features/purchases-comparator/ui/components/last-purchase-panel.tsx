import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '@/app/components/iconify';

import { formatBs, formatUsd } from './format-money';
import { useLastPurchaseQuery } from '../../api/purchases-comparator.queries';

// ----------------------------------------------------------------------

type Props = {
  /** EAN/barcode del producto (externalId del comparador). */
  barcode: string | undefined;
};

/** Fecha 'YYYY-MM-DD' → 'DD/MM/YYYY' sin que el TZ corra el día. */
function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

/** Tasa USD→VES con 2 decimales (LATAM). */
function formatRate(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(Number(rate))) return '—';
  return Number(rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LastPurchasePanel({ barcode }: Props) {
  const { data, isLoading, isError } = useLastPurchaseQuery(barcode);

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Iconify icon="solar:bill-list-bold-duotone" width={18} />
        <Typography variant="subtitle2">Última compra (interna)</Typography>
      </Stack>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!isLoading && (isError || !data?.found || !data.lastPurchase) && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Este producto nunca se ha comprado en SIGAF.
        </Typography>
      )}

      {!isLoading && data?.found && data.lastPurchase && (
        <>
          <Box
            sx={{
              p: 1.5,
              mb: 1.5,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {data.lastPurchase.supplierName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(data.lastPurchase.receiptDate)} · {data.lastPurchase.receiptNumber}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.2 }}>
                  {formatBs(data.lastPurchase.unitCostBs)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatUsd(data.lastPurchase.unitCostUsd)}
                  {data.lastPurchase.rateUsed != null && ` · Tasa BCV ${formatRate(data.lastPurchase.rateUsed)}`}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {data.bySupplier.length > 1 && (
            <Box sx={{ overflow: 'auto' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Último precio por proveedor
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Proveedor</TableCell>
                    <TableCell align="center">Fecha</TableCell>
                    <TableCell align="right">Costo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.bySupplier.map((entry, idx) => (
                    <TableRow key={entry.supplierId} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {entry.supplierName}
                          {idx === 0 && (
                            <Chip size="small" color="info" variant="outlined" label="Más reciente" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {formatDate(entry.receiptDate)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {formatBs(entry.unitCostBs)}
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          ({formatUsd(entry.unitCostUsd)})
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
