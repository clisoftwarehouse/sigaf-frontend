import type { GridColDef } from '@mui/x-data-grid';
import type { PurchaseOrderItem } from '../../model/types';

import { toast } from 'sonner';
import { useMemo } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useProductOptions } from '@/features/products/api/products.options';
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';

import { ORDER_TYPE_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../../model/constants';
import {
  useOrderQuery,
  useApproveOrderMutation,
  useOrderApprovalStatusQuery,
} from '../../api/purchases.queries';

// ----------------------------------------------------------------------

export function OrderDetailView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error } = useOrderQuery(id);
  // Solo consultamos el motor de aprobación cuando la OC está en draft (es
  // cuando el badge tiene sentido). Para otros estados el endpoint igual
  // respondería bien pero ahorramos la query.
  const { data: approvalCheck } = useOrderApprovalStatusQuery(
    order?.status === 'draft' ? id : undefined,
  );
  const approveMutation = useApproveOrderMutation();

  const { data: productOpts = [] } = useProductOptions();
  const productNameById = useMemo(
    () => new Map(productOpts.map((o) => [o.id, o.label] as const)),
    [productOpts]
  );
  const { data: branchOpts = [] } = useBranchOptions();
  const branchName = useMemo(
    () => branchOpts.find((b) => b.id === order?.branchId)?.label ?? order?.branchId ?? '—',
    [branchOpts, order]
  );
  const { data: supplierOpts = [] } = useSupplierOptions();
  const supplierName = useMemo(
    () => supplierOpts.find((s) => s.id === order?.supplierId)?.label ?? order?.supplierId ?? '—',
    [supplierOpts, order]
  );

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Orden aprobada');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // El usuario puede aprobar si: (1) está en draft y (2) el motor de aprobación
  // dice que su rol está autorizado. Mientras la consulta carga, mostramos el
  // botón habilitado y dejamos que el backend rechace si no aplica (defensa).
  const canApprove =
    order?.status === 'draft' && (approvalCheck === undefined || approvalCheck.canApprove);

  const itemColumns = useMemo<GridColDef<PurchaseOrderItem>[]>(
    () => [
      {
        field: 'productId',
        headerName: 'Producto',
        flex: 2.5,
        minWidth: 240,
        valueFormatter: (value: string) => productNameById.get(value) ?? value,
        renderCell: ({ row }) => (
          <Typography variant="body2">
            {productNameById.get(row.productId) ?? row.productId}
          </Typography>
        ),
        sortComparator: (a, b) =>
          (productNameById.get(a) ?? '').localeCompare(productNameById.get(b) ?? ''),
      },
      {
        field: 'quantity',
        headerName: 'Cantidad',
        type: 'number',
        flex: 1,
        minWidth: 110,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'quantityReceived',
        headerName: 'Recibido',
        type: 'number',
        flex: 1,
        minWidth: 110,
        valueGetter: (value: number | string) => Number(value) || 0,
      },
      {
        field: 'unitCostUsd',
        headerName: 'Costo',
        type: 'number',
        flex: 1,
        minWidth: 110,
        valueGetter: (value: number | string) => Number(value) || 0,
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
      },
      {
        field: 'discountPct',
        headerName: 'Descuento',
        type: 'number',
        flex: 1,
        minWidth: 120,
        valueGetter: (value: number | string | null) => (value == null ? null : Number(value)),
        valueFormatter: (value: number | null) => (value == null ? '—' : `${value.toFixed(2)}%`),
      },
      {
        field: 'subtotalUsd',
        headerName: 'Subtotal',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueGetter: (_v, row) => {
          if (row.subtotalUsd != null) return Number(row.subtotalUsd) || 0;
          const qty = Number(row.quantity) || 0;
          const cost = Number(row.unitCostUsd) || 0;
          const disc = row.discountPct != null ? Number(row.discountPct) : 0;
          return qty * cost * (1 - disc / 100);
        },
        valueFormatter: (value: number) => `$${value.toFixed(2)}`,
        cellClassName: 'subtotal-cell',
      },
    ],
    [productNameById]
  );

  return (
    <Container maxWidth="lg" sx={{ pb: 6 }}>
      <PageHeader
        title={order ? `Orden ${order.orderNumber}` : 'Orden de compra'}
        subtitle={order ? new Date(order.createdAt).toLocaleString('es-VE') : undefined}
        crumbs={[{ label: 'Compras' }, { label: 'Órdenes' }, { label: 'Detalle' }]}
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={
                <Iconify
                  icon="solar:double-alt-arrow-right-bold-duotone"
                  sx={{ transform: 'scaleX(-1)' }}
                />
              }
              onClick={() => router.push(paths.dashboard.purchases.orders.root)}
            >
              Volver a órdenes
            </Button>
            {canApprove && (
              <Button
                variant="contained"
                color="success"
                startIcon={<Iconify icon="solar:check-circle-bold" />}
                loading={approveMutation.isPending}
                onClick={handleApprove}
              >
                Aprobar
              </Button>
            )}
          </Stack>
        }
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {order && (
        <>
          {order.status === 'draft' &&
            typeof order.daysUntilAutoCancel === 'number' &&
            order.daysUntilAutoCancel <= 7 && (
              <Alert
                severity={order.daysUntilAutoCancel === 0 ? 'error' : 'warning'}
                sx={{ mb: 3 }}
                icon={<Iconify icon="solar:clock-circle-bold" />}
              >
                {order.daysUntilAutoCancel === 0
                  ? 'Esta OC se cancelará automáticamente esta noche por estar más de 30 días en borrador. Apruébala ahora si aún es válida.'
                  : `Esta OC se auto-cancelará en ${order.daysUntilAutoCancel} día${
                      order.daysUntilAutoCancel === 1 ? '' : 's'
                    } por estar en borrador más de 30 días. Apruébala antes para evitar la cancelación.`}
              </Alert>
            )}

          {/* Estado de aprobación según el motor (PDF Política OC §1+2). Se
              muestra solo en draft: si el rol del usuario actual no califica,
              se ve por qué (rol esperado, monto, categorías sensibles). */}
          {order.status === 'draft' && approvalCheck && !approvalCheck.requirement.bypassed && (
            <Alert
              severity={approvalCheck.canApprove ? 'success' : 'info'}
              sx={{ mb: 3 }}
              icon={<Iconify icon="solar:shield-check-bold" />}
            >
              {approvalCheck.canApprove
                ? `Tu rol puede aprobar esta OC. ${approvalCheck.requirement.reason}`
                : (approvalCheck.denialReason ?? approvalCheck.requirement.reason)}
            </Alert>
          )}

          <Card sx={{ p: 3, mb: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Nº de orden
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                  {order.orderNumber}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    color={ORDER_STATUS_COLOR[order.status]}
                    label={ORDER_STATUS_LABEL[order.status]}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tipo
                </Typography>
                <Typography variant="body1">
                  {ORDER_TYPE_LABEL[order.orderType] ?? order.orderType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Proveedor
                </Typography>
                <Typography variant="body1">{supplierName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Sucursal
                </Typography>
                <Typography variant="body1">{branchName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Fecha esperada
                </Typography>
                <Typography variant="body1">{order.expectedDate ?? '—'}</Typography>
              </Box>
            </Stack>
            {order.notes && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                {order.notes}
              </Typography>
            )}
          </Card>

          <Card sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
              Ítems ({order.items?.length ?? 0})
            </Typography>
            <Box
              sx={{
                width: '100%',
                '& .subtotal-cell': { fontWeight: 600 },
              }}
            >
              <DataTable
                columns={itemColumns}
                rows={order.items ?? []}
                disableRowSelectionOnClick
                autoHeight
              />
            </Box>

            <Divider />

            <Stack direction="row" justifyContent="flex-end" spacing={6} sx={{ p: 3 }}>
              <Stack spacing={0.5} sx={{ textAlign: 'right', minWidth: 220 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Subtotal
                  </Typography>
                  <Typography variant="body2">
                    ${(Number(order.subtotalUsd) || 0).toFixed(2)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Impuesto
                  </Typography>
                  <Typography variant="body2">${(Number(order.taxUsd) || 0).toFixed(2)}</Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ pt: 0.5, borderTop: 1, borderColor: 'divider' }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    ${(Number(order.totalUsd) || 0).toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </>
      )}
    </Container>
  );
}
