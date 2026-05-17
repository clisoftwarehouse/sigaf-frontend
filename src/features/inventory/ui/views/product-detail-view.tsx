import type { GridColDef } from '@mui/x-data-grid';
import type { InventoryLot } from '../../model/types';

import { useParams } from 'react-router';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { useBrandsQuery } from '@/features/brands/api/brands.queries';
import { PRODUCT_TYPE_LABEL } from '@/features/products/model/constants';
import { useProductQuery } from '@/features/products/api/products.queries';
import { useCurrentPriceQuery } from '@/features/prices/api/prices.queries';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useCategoriesQuery } from '@/features/categories/api/categories.queries';

import { AdjustmentDialog } from '../components/adjustment-dialog';
import { QuarantineDialog } from '../components/quarantine-dialog';
import { ExpirySignalChip } from '../components/expiry-signal-chip';
import { useFefoQuery, useStockQuery, useAverageCostQuery } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

type StockRow = {
  productId: string;
  branchId: string;
  totalQuantity: number | string;
  lotCount: number;
  nearestExpiration: string | null;
};

export function InventoryProductDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [adjustmentLot, setAdjustmentLot] = useState<InventoryLot | null>(null);
  const [quarantineLot, setQuarantineLot] = useState<InventoryLot | null>(null);

  const { data: product, isLoading: loadingProduct, isError, error } = useProductQuery(id);
  const { data: fefoLots = [], isLoading: loadingLots } = useFefoQuery(id || undefined, undefined);
  const { data: stockData } = useStockQuery({ productId: id || undefined });
  const { data: currentPrice, isError: priceError } = useCurrentPriceQuery({ productId: id });
  const { data: avgCost } = useAverageCostQuery(id);

  const { flat: categories } = useCategoriesQuery();
  const { data: brands = [] } = useBrandsQuery();
  const { data: branchOpts = [] } = useBranchOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  const categoryName = useMemo(
    () => (product ? (categories.find((c) => c.id === product.categoryId)?.name ?? '—') : '—'),
    [categories, product]
  );
  const brandName = useMemo(
    () => (product?.brandId ? (brands.find((b) => b.id === product.brandId)?.name ?? null) : null),
    [brands, product]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const branchBreakdown = (stockData?.data ?? []) as StockRow[];
  const branchRows = useMemo(
    () => branchBreakdown.map((r) => ({ ...r, id: `${r.productId}-${r.branchId}` })),
    [branchBreakdown]
  );

  const branchColumns = useMemo<GridColDef<StockRow & { id: string }>[]>(
    () => [
      {
        field: 'branchId',
        headerName: 'Sucursal',
        flex: 2,
        minWidth: 200,
        valueFormatter: (value: string) => branchNameById.get(value) ?? value,
      },
      {
        field: 'totalQuantity',
        headerName: 'Cantidad',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'lotCount',
        headerName: 'Lotes',
        type: 'number',
        flex: 1,
        minWidth: 100,
      },
      {
        field: 'nearestExpiration',
        headerName: 'Próximo vencimiento',
        type: 'date',
        flex: 1,
        minWidth: 180,
        valueGetter: (value: string | null) => (value ? new Date(value) : null),
      },
    ],
    [branchNameById]
  );

  const fefoColumns = useMemo<GridColDef<InventoryLot & { _idx?: number }>[]>(
    () => [
      {
        field: 'lotNumber',
        headerName: 'Lote',
        flex: 1.5,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.lotNumber}
          </Typography>
        ),
      },
      {
        field: 'branchId',
        headerName: 'Sucursal',
        flex: 1.5,
        minWidth: 180,
        valueFormatter: (value: string) => branchNameById.get(value) ?? value,
      },
      {
        field: 'expirationDate',
        headerName: 'Vencimiento',
        type: 'date',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string) => (value ? new Date(value) : null),
      },
      {
        field: 'expirySignal',
        headerName: 'Señal',
        flex: 1,
        minWidth: 130,
        renderCell: ({ row }) => <ExpirySignalChip signal={row.expirySignal} />,
      },
      {
        field: 'quantityAvailable',
        headerName: 'Disponible',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'salePrice',
        headerName: 'Precio',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'status',
        headerName: 'Estado',
        flex: 1,
        minWidth: 130,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
            {row.status}
          </Typography>
        ),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 150,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Stack direction="row">
            <Tooltip title="Nuevo ajuste">
              <IconButton onClick={() => setAdjustmentLot(row)}>
                <Iconify icon="solar:eraser-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={row.status === 'quarantine' ? 'Liberar de cuarentena' : 'Enviar a cuarentena'}
            >
              <IconButton
                color={row.status === 'quarantine' ? 'primary' : 'warning'}
                onClick={() => setQuarantineLot(row)}
              >
                <Iconify icon="solar:danger-triangle-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ver movimientos (kardex)">
              <IconButton
                onClick={() =>
                  router.push(
                    `${paths.dashboard.inventory.kardex}?productId=${row.productId}&lotId=${row.id}`
                  )
                }
              >
                <Iconify icon="solar:clock-circle-bold" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [branchNameById, router]
  );

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
            startIcon={
              <Iconify
                icon="solar:double-alt-arrow-right-bold-duotone"
                sx={{ transform: 'scaleX(-1)' }}
              />
            }
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
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Precio actual
                </Typography>
                {currentPrice ? (
                  <>
                    <Typography variant="h5" sx={{ fontFamily: 'monospace' }}>
                      ${Number(currentPrice.priceUsd).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {currentPrice.source === 'branch_override'
                        ? 'Override de sucursal'
                        : 'Precio global'}
                    </Typography>
                  </>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ color: priceError ? 'warning.main' : 'text.disabled' }}
                  >
                    {priceError ? 'Sin precio publicado' : '—'}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Costo promedio ponderado
                </Typography>
                {avgCost && avgCost.averageCostUsd != null ? (
                  <>
                    <Typography variant="h5" sx={{ fontFamily: 'monospace' }}>
                      ${avgCost.averageCostUsd.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {avgCost.lotsConsidered} lote(s) · stock {avgCost.totalQuantityAvailable}
                      {avgCost.lastReceivedCostUsd != null &&
                        ` · último costo $${avgCost.lastReceivedCostUsd.toFixed(2)}`}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Sin lotes disponibles
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

          {branchRows.length > 0 && (
            <Card>
              <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
                Stock por sucursal
              </Typography>
              <Box sx={{ width: '100%' }}>
                <DataTable
                  columns={branchColumns}
                  rows={branchRows}
                  disableRowSelectionOnClick
                  autoHeight
                />
              </Box>
            </Card>
          )}

          <Card>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Orden FEFO — First Expire, First Out
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Lotes disponibles ordenados por fecha de vencimiento. Vende siempre el primero para
                minimizar mermas.
              </Typography>
            </Box>

            <Box sx={{ width: '100%' }}>
              <DataTable
                columns={fefoColumns}
                rows={fefoLots}
                loading={loadingLots}
                disableRowSelectionOnClick
                autoHeight
              />
            </Box>
          </Card>
        </Stack>
      )}

      <AdjustmentDialog lot={adjustmentLot} onClose={() => setAdjustmentLot(null)} />
      <QuarantineDialog lot={quarantineLot} onClose={() => setQuarantineLot(null)} />
    </Container>
  );
}
