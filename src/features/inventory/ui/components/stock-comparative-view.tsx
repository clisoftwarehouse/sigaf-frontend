import type { ReactNode } from 'react';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

// ----------------------------------------------------------------------

type ComparativeRow = {
  productId: string;
  branchId: string;
  totalQuantity: number | string;
  costUsd?: number | string | null;
  salePriceUsd?: number | string | null;
};

type Props = {
  rows: ComparativeRow[];
  productNameById: Map<string, string>;
  branchNameById: Map<string, string>;
};

type Cell = { cost: number | null; stock: number; pv: number | null };

const num = (v: number | string | null | undefined): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtUsd = (n: number | null): string =>
  n == null ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Matriz comparativa de stock para "Todas las sucursales": una fila por
 * producto, una columna por sucursal. Cada celda muestra Costo · Stock · PV.
 * El menor costo de cada fila se resalta para comparar de un vistazo.
 */
export function StockComparativeView({ rows, productNameById, branchNameById }: Props) {
  const router = useRouter();

  const { branchIds, products } = useMemo(() => {
    // productId -> branchId -> celda combinada (suma stock, primer costo/pv).
    const byProduct = new Map<string, Map<string, Cell>>();
    const branchSet = new Set<string>();

    for (const r of rows) {
      branchSet.add(r.branchId);
      const branches = byProduct.get(r.productId) ?? new Map<string, Cell>();
      const prev = branches.get(r.branchId);
      const cost = num(r.costUsd);
      const pv = num(r.salePriceUsd);
      if (prev) {
        prev.stock += num(r.totalQuantity) ?? 0;
        if (prev.cost == null) prev.cost = cost;
        if (prev.pv == null) prev.pv = pv;
      } else {
        branches.set(r.branchId, { cost, stock: num(r.totalQuantity) ?? 0, pv });
      }
      byProduct.set(r.productId, branches);
    }

    const branchIdsSorted = Array.from(branchSet).sort((a, b) =>
      (branchNameById.get(a) ?? a).localeCompare(branchNameById.get(b) ?? b)
    );

    const productList = Array.from(byProduct.entries())
      .map(([productId, branches]) => {
        const costs = Array.from(branches.values())
          .map((c) => c.cost)
          .filter((c): c is number => c != null && c > 0);
        const minCost = costs.length > 1 ? Math.min(...costs) : null;
        return {
          productId,
          productName: productNameById.get(productId) ?? '—',
          branches,
          minCost,
        };
      })
      .sort((a, b) => a.productName.localeCompare(b.productName));

    return { branchIds: branchIdsSorted, products: productList };
  }, [rows, productNameById, branchNameById]);

  const stickyCol = {
    position: 'sticky' as const,
    left: 0,
    zIndex: 2,
    bgcolor: 'background.paper',
    borderRight: (t: { palette: { divider: string } }) => `1px solid ${t.palette.divider}`,
  };

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" stickyHeader sx={{ minWidth: 280 + branchIds.length * 180 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...stickyCol, zIndex: 3, minWidth: 220, fontWeight: 700 }}>Producto</TableCell>
              {branchIds.map((bid) => (
                <TableCell key={bid} align="center" sx={{ minWidth: 170, fontWeight: 700 }}>
                  {branchNameById.get(bid) ?? bid}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.productId} hover>
                <TableCell sx={{ ...stickyCol }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: 'primary.main', cursor: 'pointer' }}
                    onClick={() => router.push(paths.dashboard.inventory.productDetail(p.productId))}
                  >
                    {p.productName}
                  </Typography>
                </TableCell>
                {branchIds.map((bid) => {
                  const c = p.branches.get(bid);
                  if (!c) {
                    return (
                      <TableCell key={bid} align="center">
                        <Typography variant="caption" color="text.disabled">
                          Sin stock
                        </Typography>
                      </TableCell>
                    );
                  }
                  const isMinCost = p.minCost != null && c.cost != null && c.cost === p.minCost;
                  const lowStock = c.stock <= 0;
                  return (
                    <TableCell key={bid} sx={{ verticalAlign: 'top' }}>
                      <Metric label="Costo">
                        <Tooltip title={isMinCost ? 'Menor costo entre sucursales' : ''} arrow disableHoverListener={!isMinCost}>
                          <Box
                            component="span"
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: isMinCost ? 'success.main' : 'text.primary',
                            }}
                          >
                            {fmtUsd(c.cost)}
                          </Box>
                        </Tooltip>
                      </Metric>
                      <Metric label="Stock">
                        <Box
                          component="span"
                          sx={{ fontFamily: 'monospace', fontWeight: 600, color: lowStock ? 'error.main' : 'text.primary' }}
                        >
                          {c.stock.toLocaleString('es-VE')}
                        </Box>
                      </Metric>
                      <Metric label="P. Venta">
                        <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {fmtUsd(c.pv)}
                        </Box>
                      </Metric>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}

// Fila etiqueta·valor dentro de una celda (label gris a la izquierda, valor a la derecha).
function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1.5, lineHeight: 1.6 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="span">
        {children}
      </Typography>
    </Box>
  );
}
