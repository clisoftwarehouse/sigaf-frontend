import type { UnpricedProduct } from '../../api/purchases.api';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { useCreatePriceMutation } from '@/features/prices/api/prices.queries';

import { useUnpricedProductsByReceiptQuery } from '../../api/purchases.queries';

// ----------------------------------------------------------------------

type PriceMode = 'fixed' | 'margin';

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

type Props = {
  /** ID del receipt recién creado. Si es null, el diálogo no abre. */
  receiptId: string | null;
  onClose: () => void;
};

/**
 * Diálogo bloqueante post-recepción. Lista los productos del receipt que NO
 * tienen precio de venta vigente y permite fijarlo inline.
 *
 * Soporta los mismos dos modos del PriceFormDialog del módulo de Precios:
 *   - `fixed`: el operador escribe el precio de venta directamente.
 *   - `margin`: el operador escribe % margen sobre venta y se deriva el
 *     precio como `costo / (1 - margen/100)`. El costo viene del receipt item.
 *
 * El precio resultante es el "precio principal" en USD. El factor de
 * revaluación (si aplica) se calcula en runtime en el POS — aquí se trabaja
 * siempre sobre el valor base del producto.
 */
export function UnpricedProductsDialog({ receiptId, onClose }: Props) {
  const router = useRouter();
  const query = useUnpricedProductsByReceiptQuery(receiptId);
  const createPriceMutation = useCreatePriceMutation();

  // Modo global del modal: aplica al input de cada fila. La mayoría de los
  // operadores usan la misma estrategia para todos los productos del receipt;
  // si necesita variar, puede salir e ir al módulo de Precios.
  const [mode, setMode] = useState<PriceMode>('fixed');

  // Estado por producto: el input crudo (precio fijo o margen %) y si ya se
  // guardó. El costo viene del item del receipt y no se edita aquí.
  const [draftInputByProduct, setDraftInputByProduct] = useState<Record<string, string>>({});
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (receiptId) {
      setDraftInputByProduct({});
      setSavedProductIds(new Set());
      setMode('fixed');
    }
  }, [receiptId]);

  const open = Boolean(receiptId);
  const data = query.data ?? [];
  const loading = query.isLoading;
  const pendingCount = data.filter((p) => !savedProductIds.has(p.productId)).length;

  /**
   * Resuelve el precio USD final según el modo seleccionado.
   * Retorna `null` si la entrada es inválida o vacía.
   */
  const computePriceUsd = (item: UnpricedProduct, raw: string): number | null => {
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (mode === 'fixed') {
      return n > 0 ? n : null;
    }
    // mode === 'margin'
    if (n < 0 || n >= 100) return null;
    if (item.unitCostUsd <= 0) return null;
    return +(item.unitCostUsd / (1 - n / 100)).toFixed(4);
  };

  const handleSave = async (item: UnpricedProduct) => {
    const raw = draftInputByProduct[item.productId];
    const priceUsd = computePriceUsd(item, raw ?? '');
    if (priceUsd == null) {
      toast.error(
        mode === 'fixed'
          ? 'Ingresa un precio válido (mayor a 0)'
          : 'Ingresa un margen válido (entre 0 y 99.99)'
      );
      return;
    }
    try {
      await createPriceMutation.mutateAsync({
        productId: item.productId,
        priceUsd,
        notes: `Fijado tras recepción ${new Date(item.receivedAt).toLocaleDateString('es-VE')}`,
      });
      setSavedProductIds((prev) => {
        const next = new Set(prev);
        next.add(item.productId);
        return next;
      });
      toast.success(`Precio ${usdFmt.format(priceUsd)} fijado para ${item.productName}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSkip = () => {
    if (pendingCount > 0) {
      const ok = window.confirm(
        `Aún quedan ${pendingCount} producto(s) sin precio. ¿Saltar de todas formas?`
      );
      if (!ok) return;
    }
    onClose();
  };

  const handleGoToPrices = () => {
    onClose();
    router.push(paths.dashboard.catalog.prices);
  };

  return (
    <Dialog open={open} onClose={handleSkip} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Iconify icon="solar:wad-of-money-bold" width={28} sx={{ color: 'warning.main' }} />
          <Box>
            <Typography variant="h6">Productos sin precio publicado</Typography>
            <Typography variant="body2" color="text.secondary">
              La recepción fue creada. Antes de seguir, asigna un precio a los productos abajo.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 4 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Buscando productos sin precio…</Typography>
          </Stack>
        ) : data.length === 0 ? (
          <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" />}>
            Todos los productos recibidos ya tienen precio publicado. Puedes cerrar.
          </Alert>
        ) : (
          <Stack spacing={2}>
            <Alert severity="info">
              {pendingCount} producto(s) sin precio. El valor que asignes es el{' '}
              <strong>precio principal en USD</strong> del producto; el factor de reposición se
              aplica automáticamente en el POS si está activo.
            </Alert>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Modo de cálculo (aplica a todas las filas)
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={mode}
                onChange={(_, next: PriceMode | null) => {
                  if (next) {
                    setMode(next);
                    // Limpiamos los inputs al cambiar de modo porque el significado
                    // del número cambia (USD vs %).
                    setDraftInputByProduct({});
                  }
                }}
                size="small"
                fullWidth
                sx={{ mt: 0.5 }}
              >
                <ToggleButton value="fixed">Precio fijo</ToggleButton>
                <ToggleButton value="margin">Costo + margen % sobre venta</ToggleButton>
              </ToggleButtonGroup>
              {mode === 'margin' && (
                <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                  Margen sobre precio de venta. Ej: 30% → precio = costo / 0.7
                </Typography>
              )}
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      Costo USD
                    </TableCell>
                    <TableCell sx={{ width: 180 }}>
                      {mode === 'fixed' ? 'Precio venta USD' : 'Margen %'}
                    </TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>
                      Precio final
                    </TableCell>
                    <TableCell sx={{ width: 120 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((item) => {
                    const saved = savedProductIds.has(item.productId);
                    const raw = draftInputByProduct[item.productId] ?? '';
                    const computed = computePriceUsd(item, raw);
                    return (
                      <TableRow key={item.productId} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{item.productName}</Typography>
                          {item.productSku && (
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
                            >
                              {item.productSku}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {usdFmt.format(item.unitCostUsd)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            placeholder={
                              mode === 'fixed'
                                ? `Ej. ${(item.unitCostUsd * 1.3).toFixed(2)}`
                                : 'Ej. 30'
                            }
                            value={raw}
                            onChange={(e) =>
                              setDraftInputByProduct((prev) => ({
                                ...prev,
                                [item.productId]: e.target.value,
                              }))
                            }
                            disabled={saved}
                            slotProps={{
                              input: {
                                startAdornment:
                                  mode === 'fixed' ? (
                                    <InputAdornment position="start">$</InputAdornment>
                                  ) : undefined,
                                endAdornment:
                                  mode === 'margin' ? (
                                    <InputAdornment position="end">%</InputAdornment>
                                  ) : undefined,
                              },
                              htmlInput: {
                                step: mode === 'fixed' ? '0.01' : '0.1',
                                min: '0',
                                max: mode === 'margin' ? '99.99' : undefined,
                              },
                            }}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="right">
                          {computed != null ? (
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                            >
                              {usdFmt.format(computed)}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {saved ? (
                            <Chip
                              size="small"
                              color="success"
                              icon={<Iconify icon="solar:check-circle-bold" width={16} />}
                              label="Guardado"
                            />
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleSave(item)}
                              disabled={createPriceMutation.isPending || computed == null}
                            >
                              Fijar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleSkip} color="inherit">
          {pendingCount > 0 ? 'Saltar por ahora' : 'Cerrar'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:wad-of-money-bold" />}
          onClick={handleGoToPrices}
        >
          Ir al módulo de Precios
        </Button>
      </DialogActions>
    </Dialog>
  );
}
