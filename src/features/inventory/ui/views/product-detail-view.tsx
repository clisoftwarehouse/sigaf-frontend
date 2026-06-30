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
import { usePricesQuery } from '@/features/prices/api/prices.queries';
import { PRODUCT_TYPE_LABEL } from '@/features/products/model/constants';
import { useProductQuery } from '@/features/products/api/products.queries';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useBranchScope } from '@/features/branches/ui/branch-scope-context';
import { useCategoriesQuery } from '@/features/categories/api/categories.queries';
import { useWarehouseOptions } from '@/features/warehouses/api/warehouses.options';

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
  const { selectedBranchId } = useBranchScope();

  const [adjustmentLot, setAdjustmentLot] = useState<InventoryLot | null>(null);
  const [quarantineLot, setQuarantineLot] = useState<InventoryLot | null>(null);

  const { data: product, isLoading: loadingProduct, isError, error } = useProductQuery(id);
  const { data: fefoLots = [], isLoading: loadingLots } = useFefoQuery(
    id || undefined,
    selectedBranchId ?? undefined
  );
  const { data: stockData } = useStockQuery({
    productId: id || undefined,
    branchId: selectedBranchId ?? undefined,
  });
  // Lista completa de precios vigentes del producto (global + por sucursal).
  // Reemplaza la card de "Precio actual" único, que era ambigua cuando
  // existen precios distintos por sucursal.
  const { data: pricesData } = usePricesQuery({ productId: id, includeHistory: false });
  const { data: avgCost } = useAverageCostQuery(id, selectedBranchId ?? undefined);

  const { flat: categories } = useCategoriesQuery();
  const { data: brands = [] } = useBrandsQuery();
  const { data: branchOpts = [] } = useBranchOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );
  const { data: warehouseOpts = [] } = useWarehouseOptions();
  const warehouseNameById = useMemo(
    () => new Map((warehouseOpts ?? []).map((o) => [o.id, o.label] as const)),
    [warehouseOpts]
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

  // Existencia por almacén (warehouse_location): agrupamos los lotes
  // disponibles (FEFO) por sucursal + almacén. Un nivel más fino que el
  // desglose por sucursal. QA 164.
  type LocationRow = {
    id: string;
    branchId: string;
    locationId: string | null;
    totalQuantity: number;
    lotCount: number;
    nearestExpiration: string | null;
  };
  const locationRows = useMemo<LocationRow[]>(() => {
    const map = new Map<string, LocationRow>();
    for (const lot of fefoLots) {
      const key = `${lot.branchId}__${lot.locationId ?? 'none'}`;
      const qty = Number(lot.quantityAvailable) || 0;
      const existing = map.get(key);
      if (existing) {
        existing.totalQuantity += qty;
        existing.lotCount += 1;
        if (
          lot.expirationDate &&
          (!existing.nearestExpiration || lot.expirationDate < existing.nearestExpiration)
        ) {
          existing.nearestExpiration = lot.expirationDate;
        }
      } else {
        map.set(key, {
          id: key,
          branchId: lot.branchId,
          locationId: lot.locationId,
          totalQuantity: qty,
          lotCount: 1,
          nearestExpiration: lot.expirationDate ?? null,
        });
      }
    }
    return Array.from(map.values());
  }, [fefoLots]);

  const locationColumns = useMemo<GridColDef<LocationRow>[]>(
    () => [
      {
        field: 'branchId',
        headerName: 'Sucursal',
        flex: 1.5,
        minWidth: 180,
        valueFormatter: (value: string) => branchNameById.get(value) ?? value,
      },
      {
        field: 'locationId',
        headerName: 'Almacén',
        flex: 1.5,
        minWidth: 180,
        renderCell: ({ row }) =>
          row.locationId ? (
            warehouseNameById.get(row.locationId) ?? row.locationId
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Sin almacén
            </Typography>
          ),
      },
      {
        field: 'totalQuantity',
        headerName: 'Cantidad',
        type: 'number',
        flex: 1,
        minWidth: 120,
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
    [branchNameById, warehouseNameById]
  );

  // Precios vigentes por sucursal (+ global). Cada fila calcula su propia
  // utilidad contra el costo promedio del producto.
  type PriceRow = {
    id: string;
    branchId: string | null;
    branchLabel: string;
    priceUsd: number;
    effectiveFrom: string;
    marginPct: number | null;
    profitUsd: number | null;
  };
  const priceRows = useMemo<PriceRow[]>(() => {
    const list = pricesData?.data ?? [];
    const cost = avgCost?.averageCostUsd ?? null;
    return list.map((p) => {
      const priceUsd = Number(p.priceUsd) || 0;
      const marginPct =
        cost != null && cost > 0 && priceUsd > 0 ? ((priceUsd - cost) / priceUsd) * 100 : null;
      const profitUsd = cost != null && priceUsd > 0 ? priceUsd - cost : null;
      return {
        id: p.id,
        branchId: p.branchId,
        branchLabel: p.branchId
          ? (branchNameById.get(p.branchId) ?? 'Sucursal desconocida')
          : 'Global (todas las sucursales)',
        priceUsd,
        effectiveFrom: p.effectiveFrom,
        marginPct,
        profitUsd,
      };
    });
  }, [pricesData, avgCost, branchNameById]);

  const priceColumns = useMemo<GridColDef<PriceRow>[]>(
    () => [
      {
        field: 'branchLabel',
        headerName: 'Sucursal',
        flex: 2,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            variant={row.branchId ? 'outlined' : 'soft'}
            color={row.branchId ? 'default' : 'info'}
            label={row.branchLabel}
          />
        ),
      },
      {
        field: 'priceUsd',
        headerName: 'Precio',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'marginPct',
        headerName: 'Utilidad',
        type: 'number',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => {
          if (row.marginPct == null) {
            return (
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                —
              </Typography>
            );
          }
          const color =
            row.marginPct < 10
              ? 'error.main'
              : row.marginPct < 25
                ? 'warning.main'
                : 'success.main';
          return (
            <Box>
              <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
                {row.marginPct.toFixed(1)}%
              </Typography>
              {row.profitUsd != null && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  ${row.profitUsd.toFixed(2)}/u
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: 'effectiveFrom',
        headerName: 'Vigente desde',
        type: 'date',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string) => (value ? new Date(value) : null),
      },
    ],
    []
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
        field: 'locationId',
        headerName: 'Almacén',
        flex: 1.5,
        minWidth: 160,
        renderCell: ({ row }) =>
          row.locationId ? (
            warehouseNameById.get(row.locationId) ?? row.locationId
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              —
            </Typography>
          ),
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
      // El precio de venta NO se muestra por lote: vive en el módulo de
      // Precios (scope por sucursal o global). Ver sección "Precios por
      // sucursal" más abajo. Mostrarlo aquí confundía porque cada lote
      // guarda un snapshot al momento de la recepción que no se mantiene
      // sincronizado con cambios posteriores.
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
    [branchNameById, warehouseNameById, router]
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
                  unidades
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
              {/* QA: no mostramos "Precio actual" ni "Utilidad" únicos
                 aquí — pueden variar por sucursal. Ver tabla "Precios por
                 sucursal" más abajo, donde cada fila tiene su utilidad
                 calculada contra el costo promedio. */}
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

          {locationRows.length > 0 && (
            <Card>
              <Box sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  Stock por almacén
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Existencia disponible desglosada por almacén (ubicación física) dentro de cada
                  sucursal.
                </Typography>
              </Box>
              <Box sx={{ width: '100%' }}>
                <DataTable
                  columns={locationColumns}
                  rows={locationRows}
                  disableRowSelectionOnClick
                  autoHeight
                />
              </Box>
            </Card>
          )}

          {/* Precios vigentes desglosados por sucursal. Más robusto que
             mostrar "el precio actual" único, porque cada sucursal puede
             tener su propio precio (override). La utilidad se calcula por
             fila contra el costo promedio del producto. */}
          <Card>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Precios por sucursal
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Precios vigentes (global + overrides por sucursal). La utilidad se calcula contra
                el costo promedio ponderado.
              </Typography>
            </Box>
            <Box sx={{ width: '100%' }}>
              {priceRows.length > 0 ? (
                <DataTable
                  columns={priceColumns}
                  rows={priceRows}
                  disableRowSelectionOnClick
                  autoHeight
                />
              ) : (
                <Box sx={{ px: 2.5, pb: 2.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Sin precios publicados. Crea uno desde el módulo de Precios.
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>

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
