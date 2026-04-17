import type { GridColDef } from '@mui/x-data-grid';
import type { Promotion } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import { PROMOTION_TYPE_LABEL } from '../../model/types';
import { PromotionFormDialog } from '../components/promotion-form-dialog';
import { PromotionScopesDialog } from '../components/promotion-scopes-dialog';
import {
  usePromotionsQuery,
  useDeletePromotionMutation,
  useActivatePromotionMutation,
  useDeactivatePromotionMutation,
} from '../../api/promotions.queries';

// ----------------------------------------------------------------------

export function PromotionsListView() {
  const [includeExpired, setIncludeExpired] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [scopesTarget, setScopesTarget] = useState<Promotion | null>(null);
  const [toDelete, setToDelete] = useState<Promotion | null>(null);

  const { data, isLoading, isError, error, refetch } = usePromotionsQuery({
    includeExpired,
    page: 1,
    limit: 200,
  });
  const activateMutation = useActivatePromotionMutation();
  const deactivateMutation = useDeactivatePromotionMutation();
  const deleteMutation = useDeletePromotionMutation();

  const rows = data?.data ?? [];

  const handleToggleActive = async (promo: Promotion) => {
    try {
      if (promo.isActive) {
        await deactivateMutation.mutateAsync(promo.id);
        toast.success(`Promoción "${promo.name}" desactivada`);
      } else {
        await activateMutation.mutateAsync(promo.id);
        toast.success(`Promoción "${promo.name}" activada`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Promoción "${toDelete.name}" eliminada`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<Promotion>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 2,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="subtitle2">{row.name}</Typography>
            {row.description && (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', display: 'block' }}
                noWrap
              >
                {row.description}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'type',
        headerName: 'Tipo',
        flex: 1,
        minWidth: 150,
        renderCell: ({ row }) => (
          <Chip size="small" variant="outlined" label={PROMOTION_TYPE_LABEL[row.type]} />
        ),
      },
      {
        field: 'value',
        headerName: 'Valor',
        flex: 1,
        minWidth: 130,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => {
          if (row.type === 'percentage') {
            return <Typography variant="subtitle2">{Number(row.value).toFixed(0)} %</Typography>;
          }
          if (row.type === 'fixed_amount') {
            return <Typography variant="subtitle2">-{Number(row.value).toFixed(2)} USD</Typography>;
          }
          // buy_x_get_y
          return (
            <Typography variant="subtitle2">
              {row.buyQuantity ?? '?'}×{row.getQuantity ?? '?'}
            </Typography>
          );
        },
      },
      {
        field: 'scopes',
        headerName: 'Restricciones',
        flex: 1.2,
        minWidth: 170,
        sortable: false,
        renderCell: ({ row }) => {
          const count = row.scopes?.length ?? 0;
          if (count === 0) {
            return <Chip size="small" color="info" variant="soft" label="Todos" />;
          }
          return (
            <Chip
              size="small"
              variant="outlined"
              label={`${count} scope${count === 1 ? '' : 's'}`}
            />
          );
        },
      },
      {
        field: 'effectiveFrom',
        headerName: 'Desde',
        type: 'dateTime',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string) => (value ? new Date(value) : null),
      },
      {
        field: 'effectiveTo',
        headerName: 'Hasta',
        type: 'dateTime',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string | null) => (value ? new Date(value) : null),
        renderCell: ({ value }) =>
          value ? (
            (value as Date).toLocaleDateString()
          ) : (
            <Typography variant="caption" color="text.disabled">
              Sin vencimiento
            </Typography>
          ),
      },
      {
        field: 'usesCount',
        headerName: 'Usos',
        flex: 0.7,
        minWidth: 100,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) =>
          row.maxUses != null ? (
            <Typography variant="caption">
              {row.usesCount} / {row.maxUses}
            </Typography>
          ) : (
            <Typography variant="caption">{row.usesCount}</Typography>
          ),
      },
      {
        field: 'isActive',
        headerName: 'Estado',
        flex: 0.8,
        minWidth: 110,
        renderCell: ({ row }) =>
          row.isActive ? (
            <Chip size="small" color="success" variant="soft" label="Activa" />
          ) : (
            <Chip size="small" variant="outlined" label="Inactiva" />
          ),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 160,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <>
            <Tooltip title="Gestionar restricciones">
              <IconButton onClick={() => setScopesTarget(row)}>
                <Iconify icon="solar:settings-bold-duotone" />
              </IconButton>
            </Tooltip>
            <Tooltip title={row.isActive ? 'Desactivar' : 'Activar'}>
              <IconButton
                color={row.isActive ? 'warning' : 'success'}
                onClick={() => handleToggleActive(row)}
              >
                <Iconify
                  icon={row.isActive ? 'solar:close-circle-bold' : 'solar:play-circle-bold'}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton color="error" onClick={() => setToDelete(row)}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    // handleToggleActive es estable bajo cierre de this render, pero lo excluyo
    // de deps a propósito para no recrear columns cada click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Promociones"
        subtitle="Descuentos, ofertas y promociones combinables aplicables al POS."
        crumbs={[{ label: 'Catálogo' }, { label: 'Promociones' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setFormOpen(true)}
          >
            Nueva promoción
          </Button>
        }
      />

      <Card>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ p: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={includeExpired}
                onChange={(_, checked) => setIncludeExpired(checked)}
              />
            }
            label="Incluir expiradas / inactivas"
          />

          <Typography variant="caption" color="text.secondary">
            {rows.length} {rows.length === 1 ? 'promoción' : 'promociones'}
          </Typography>
        </Stack>

        {isError && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Reintentar
                </Button>
              }
            >
              {(error as Error)?.message ?? 'Error al cargar promociones'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={rows}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            getRowId={(row) => row.id}
          />
        </Box>
      </Card>

      <PromotionFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

      <PromotionScopesDialog
        open={!!scopesTarget}
        promotion={scopesTarget}
        onClose={() => setScopesTarget(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar promoción"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar <strong>{toDelete.name}</strong>? Esto también eliminará
              todos sus scopes. Esta acción no se puede deshacer.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Container>
  );
}
