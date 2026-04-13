import { useMemo } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { useBrandsQuery } from '@/features/brands/api/brands.queries';
import { PRODUCT_TYPE_LABEL } from '@/features/products/model/constants';
import { useProductQuery } from '@/features/products/api/products.queries';
import { useCategoriesQuery } from '@/features/categories/api/categories.queries';

import { ExpirySignalChip } from '../components/expiry-signal-chip';
import { useFefoQuery, useStockQuery } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

export function InventoryProductDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: product, isLoading: loadingProduct, isError, error } = useProductQuery(id);
  const { data: fefoLots = [], isLoading: loadingLots } = useFefoQuery(id || undefined, undefined);
  const { data: stockData } = useStockQuery({ productId: id || undefined });

  const { flat: categories } = useCategoriesQuery();
  const { data: brands = [] } = useBrandsQuery();

  const categoryName = useMemo(
    () => (product ? categories.find((c) => c.id === product.categoryId)?.name ?? '—' : '—'),
    [categories, product]
  );
  const brandName = useMemo(
    () =>
      product?.brandId ? brands.find((b) => b.id === product.brandId)?.name ?? null : null,
    [brands, product]
  );

  const branchBreakdown = stockData?.data ?? [];

  return (
    <Container maxWidth="xl">
      <PageHeader
        title={product?.shortName ?? product?.description ?? 'Producto'}
        subtitle={product?.shortName ? product.description : undefined}
        crumbs={[{ label: 'Inventario' }, { label: 'Stock' }, { label: 'Detalle' }]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:double-alt-arrow-right-bold-duotone" sx={{ transform: 'scaleX(-1)' }} />}
            onClick={() => router.push(paths.dashboard.inventory.stock)}
          >
            Volver al stock
          </Button>
        }
      />

      {loadingProduct && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {product && (
        <Stack spacing={3}>
          {/* ── Header summary ─────────────────────────────────────── */}
          <Card sx={{ p: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Categoría / Marca
                </Typography>
                <Typography variant="body2">{categoryName}</Typography>
                {brandName && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {brandName}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tipo
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={PRODUCT_TYPE_LABEL[product.productType] ?? product.productType}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Stock total disponible
                </Typography>
                <Typography variant="h4">{Number(product.totalStock) || 0}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Unidad: {product.unitOfMeasure}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Stock mínimo / máximo
                </Typography>
                <Typography variant="body1">
                  {Number(product.stockMin) || 0}
                  {product.stockMax != null && ` / ${Number(product.stockMax)}`}
                </Typography>
                {product.reorderPoint != null && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Reorden: {Number(product.reorderPoint)}
                  </Typography>
                )}
              </Box>
            </Stack>

            {product.barcodes && product.barcodes.length > 0 && (
              <>
                <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Códigos de barras
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  {product.barcodes.map((b) => (
                    <Chip
                      key={b.id}
                      size="small"
                      variant={b.isPrimary ? 'filled' : 'outlined'}
                      color={b.isPrimary ? 'info' : 'default'}
                      label={`${b.barcode} · ${b.barcodeType}`}
                      sx={{ fontFamily: 'monospace' }}
                    />
                  ))}
                </Stack>
              </>
            )}
          </Card>

          {/* ── Stock breakdown by branch ──────────────────────────── */}
          {branchBreakdown.length > 0 && (
            <Card>
              <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
                Stock por sucursal
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sucursal</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Lotes</TableCell>
                      <TableCell>Próximo vencimiento</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {branchBreakdown.map((row) => (
                      <TableRow key={`${row.productId}-${row.branchId}`}>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {row.branchId.slice(0, 8)}
                        </TableCell>
                        <TableCell align="right">{Number(row.totalQuantity) || 0}</TableCell>
                        <TableCell align="right">{row.lotCount}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {row.nearestExpiration
                            ? new Date(row.nearestExpiration).toISOString().slice(0, 10)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* ── FEFO lot list ──────────────────────────────────────── */}
          <Card>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Orden FEFO — First Expire, First Out
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Lotes disponibles ordenados por fecha de vencimiento. Vende siempre el primero
                para minimizar mermas.
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Lote</TableCell>
                    <TableCell>Sucursal</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell align="right">Disponible</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingLots && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  )}

                  {!loadingLots && fefoLots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0, borderBottom: 0 }}>
                        <EmptyState
                          icon="box"
                          title="Sin lotes disponibles"
                          description="Este producto no tiene lotes con stock disponible en este momento."
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {fefoLots.map((lot, idx) => {
                    const available = Number(lot.quantityAvailable) || 0;
                    const price = Number(lot.salePrice) || 0;
                    return (
                      <TableRow key={lot.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">#{idx + 1}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{lot.lotNumber}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {lot.branchId.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2">{lot.expirationDate}</Typography>
                            <ExpirySignalChip signal={lot.expirySignal} />
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{available}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>
                          ${price.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{lot.status}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      )}
    </Container>
  );
}
