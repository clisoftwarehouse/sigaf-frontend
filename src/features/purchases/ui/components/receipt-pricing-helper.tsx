import { isAxiosError } from 'axios';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { Iconify } from '@/app/components/iconify';
import { priceKeys } from '@/features/prices/api/prices.queries';
import { fetchCurrentPrice } from '@/features/prices/api/prices.api';

// ----------------------------------------------------------------------

type Props = {
  /** Índice de la línea en el array `items` del form (para apuntar al setValue). */
  itemIndex: number;
  productId: string | undefined;
  branchId: string | undefined;
  /** Costo USD ingresado en la línea — punto de partida para calcular margen. */
  costUsd: number;
  /** Precio venta actual de la línea — null si está vacío. */
  currentSalePrice: number | null;
  /** Margen mínimo % aceptable (warning si el calculado queda por debajo). */
  minMarginWarningPct?: number;
};

/**
 * Acordeón colapsable por línea con la calculadora de margen y la lectura del
 * último precio publicado del producto. Diseñado para vivir dentro de cada fila
 * de la recepción sin obligar al operador a saltar al módulo de Precios.
 *
 * Comportamiento:
 *  - Si el operador escribe un %, calcula salePrice = costo × (1 + %/100) y lo
 *    persiste en el form (`items.${idx}.salePrice`).
 *  - Si el operador escribe un salePrice arriba (en la fila), recalculamos el
 *    margen mostrado pero NO sobreescribimos el % manual.
 *  - Lectura de "último precio publicado" usa el endpoint /prices/current con
 *    cascada (override sucursal → global). 404 = sin precio publicado.
 */
export function ReceiptPricingHelper({
  itemIndex,
  productId,
  branchId,
  costUsd,
  currentSalePrice,
  minMarginWarningPct = 15,
}: Props) {
  const { setValue } = useFormContext();
  const [marginInput, setMarginInput] = useState<string>('');

  // Último precio publicado para este producto+sucursal. retry=false para no
  // inundar la red cuando un producto nuevo no tiene precio aún (404 esperado).
  const lastPublishedQuery = useQuery({
    queryKey: priceKeys.current(productId ?? '', branchId),
    queryFn: () =>
      fetchCurrentPrice({ productId: productId as string, branchId: branchId || undefined }),
    enabled: Boolean(productId),
    retry: false,
    staleTime: 60_000,
  });

  const noPriceYet =
    lastPublishedQuery.isError &&
    isAxiosError(lastPublishedQuery.error) &&
    lastPublishedQuery.error.response?.status === 404;
  const lastPrice = lastPublishedQuery.data?.priceUsd ?? null;
  const lastSource = lastPublishedQuery.data?.source ?? null;

  // Si el operador edita el % aplicamos margen sobre el costo y persistimos el
  // salePrice resultante en el form.
  const applyMargin = (pctRaw: string) => {
    setMarginInput(pctRaw);
    if (!pctRaw || !/^\d+(\.\d+)?$/.test(pctRaw)) return;
    if (!costUsd || costUsd <= 0) return;
    const pct = Number(pctRaw);
    const computed = costUsd * (1 + pct / 100);
    setValue(`items.${itemIndex}.salePrice`, computed.toFixed(4), { shouldValidate: true });
  };

  // Si cambia el precio venta desde el campo de la fila, sincronizamos el
  // margen mostrado para que no quede desfasado. No sobreescribimos lo que el
  // operador esté tipeando activamente — solo cuando el input está vacío.
  const computedMarkup =
    costUsd > 0 && currentSalePrice && currentSalePrice > 0
      ? ((currentSalePrice - costUsd) / costUsd) * 100
      : null;
  const computedMargin =
    currentSalePrice && currentSalePrice > 0 && costUsd >= 0
      ? ((currentSalePrice - costUsd) / currentSalePrice) * 100
      : null;

  useEffect(() => {
    if (!marginInput && computedMarkup != null) {
      setMarginInput(computedMarkup.toFixed(2));
    }
    // Intencionalmente sin marginInput en deps — solo sincroniza al inicio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedMarkup]);

  const isBelowMinMargin =
    computedMargin != null && computedMargin < minMarginWarningPct && currentSalePrice && currentSalePrice > 0;

  const apply = (price: number) => {
    setValue(`items.${itemIndex}.salePrice`, price.toFixed(4), { shouldValidate: true });
  };

  return (
    <Accordion
      disableGutters
      sx={{
        mt: 1,
        bgcolor: 'background.neutral',
        '&::before': { display: 'none' },
        boxShadow: 'none',
        border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
        borderRadius: 1,
      }}
    >
      <AccordionSummary
        expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} />}
        sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
          <Iconify icon="solar:wad-of-money-bold" width={16} />
          <Typography variant="body2">Calcular precio sugerido</Typography>
          {currentSalePrice != null && currentSalePrice > 0 && computedMargin != null && (
            <Chip
              size="small"
              variant="outlined"
              color={isBelowMinMargin ? 'warning' : 'default'}
              label={`Margen ${computedMargin.toFixed(1)}%`}
              sx={{ height: 20, fontSize: 11 }}
            />
          )}
          {noPriceYet && (
            <Chip
              size="small"
              variant="outlined"
              color="info"
              label="Sin precio publicado"
              sx={{ height: 20, fontSize: 11 }}
            />
          )}
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={1.5}>
          {/* Lectura del último precio publicado */}
          {lastPublishedQuery.isLoading && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Consultando último precio publicado…
            </Typography>
          )}
          {lastPrice != null && (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Último precio publicado
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  ${lastPrice.toFixed(4)}{' '}
                  <Typography component="span" variant="caption" sx={{ color: 'text.disabled' }}>
                    ({lastSource === 'branch_override' ? 'esta sucursal' : 'global'})
                  </Typography>
                </Typography>
              </Box>
              <Chip
                size="small"
                variant="outlined"
                clickable
                label="Usar este precio"
                onClick={() => apply(lastPrice)}
              />
            </Stack>
          )}
          {noPriceYet && (
            <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
              Producto nuevo sin precio publicado todavía. Calcula con margen o déjalo vacío
              para fijar el precio luego desde el módulo de Precios.
            </Alert>
          )}

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Calculadora de margen */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
            <TextField
              label="Margen sobre costo (%)"
              value={marginInput}
              onChange={(e) => applyMargin(e.target.value)}
              placeholder="Ej. 30"
              size="small"
              disabled={!costUsd || costUsd <= 0}
              helperText={
                !costUsd || costUsd <= 0
                  ? 'Ingresa el costo USD primero'
                  : 'Aplica margen sobre costo y autocalcula el precio venta'
              }
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Stack spacing={0.5} sx={{ flex: 1, pt: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Cálculo
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                Costo: ${(costUsd || 0).toFixed(4)}
              </Typography>
              {computedMarkup != null && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Markup: {computedMarkup.toFixed(2)}% · Margen real:{' '}
                  {computedMargin != null ? `${computedMargin.toFixed(2)}%` : '—'}
                </Typography>
              )}
            </Stack>
          </Stack>

          {isBelowMinMargin && (
            <Alert severity="warning" variant="outlined" sx={{ py: 0.5 }}>
              El margen calculado ({computedMargin?.toFixed(1)}%) está por debajo del mínimo
              recomendado ({minMarginWarningPct}%).
            </Alert>
          )}

          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5 }}>
            <strong>Markup</strong> = ganancia sobre costo · <strong>Margen real</strong> = ganancia
            sobre precio de venta. Son distintos: 30% markup ≈ 23% margen real.
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
