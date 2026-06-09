import { useState } from 'react';

import Box from '@mui/material/Box';
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

import { formatBs } from './format-money';
import { PriceHistoryChart } from './price-history-chart';
import { useComparatorProductDetailQuery } from '../../api/purchases-comparator.queries';

// ----------------------------------------------------------------------

type Props = {
  externalId: string | null;
  onClose: () => void;
};

export function ProductDetailDrawer({ externalId, onClose }: Props) {
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading, isError, error } = useComparatorProductDetailQuery(
    externalId ?? undefined
  );

  const product = data?.data;
  const offers = product?.offers ?? [];

  return (
    <Drawer
      anchor="right"
      open={!!externalId}
      onClose={() => {
        setShowHistory(false);
        onClose();
      }}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 720 }, p: 0 } } }}
    >
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              Producto
            </Typography>
            {product ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  {product.name}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={product.externalId}
                    sx={{ fontFamily: 'monospace' }}
                  />
                  {product.brand && <Chip size="small" variant="outlined" label={product.brand} />}
                  {product.category && (
                    <Chip size="small" variant="outlined" color="info" label={product.category} />
                  )}
                </Stack>
              </>
            ) : (
              <Typography variant="h6">—</Typography>
            )}
          </Box>
          <IconButton onClick={onClose}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as Error)?.message ?? 'Error al cargar el detalle del producto'}
          </Alert>
        )}

        {product && !isLoading && (
          <>
            {product.activeIngredients && product.activeIngredients.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Principio activo
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {product.activeIngredients.map((ai) => (
                    <Chip
                      key={ai.name}
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={
                        ai.concentration ? `${ai.name} (${ai.concentration})` : ai.name
                      }
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip
                size="small"
                color="success"
                label={`Mejor: ${formatBs(product.bestPrice)} · ${product.bestProvider ?? '—'}`}
              />
              <Chip size="small" variant="outlined" label={`${offers.length} ofertas`} />
              {product.savings && product.savings.absolute > 0 && (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={`Ahorro vs. más cara: ${formatBs(product.savings.absolute)} (${product.savings.pct.toFixed(0)}%)`}
                />
              )}
            </Stack>

            <Divider sx={{ mb: 1 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Ofertas por droguería
            </Typography>

            <Box sx={{ overflow: 'auto', mb: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 36 }}>#</TableCell>
                    <TableCell>Droguería</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {offers.map((offer, idx) => (
                    <TableRow key={`${offer.provider}-${idx}`} hover>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>{offer.provider}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: offer.isBest ? 700 : 500,
                          color: offer.isBest ? 'success.dark' : 'text.primary',
                        }}
                      >
                        {formatBs(offer.price)}
                      </TableCell>
                      <TableCell align="center">
                        {offer.isBest && (
                          <Chip size="small" color="success" variant="filled" label="Mejor" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Divider sx={{ mb: 1 }} />

            <Button
              variant={showHistory ? 'contained' : 'outlined'}
              size="small"
              startIcon={<Iconify icon="solar:chart-square-outline" />}
              onClick={() => setShowHistory((v) => !v)}
              sx={{ alignSelf: 'flex-start', mb: 2 }}
            >
              {showHistory ? 'Ocultar historial' : 'Ver historial de precios'}
            </Button>

            {showHistory && (
              <PriceHistoryChart externalId={product.externalId} productName={product.name} />
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
}
