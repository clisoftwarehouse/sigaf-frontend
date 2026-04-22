import type { GridColDef } from '@mui/x-data-grid';
import type { Category } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import { CategoryTreeDialog } from '../components/category-tree-dialog';
import {
  useCategoriesQuery,
  useDeleteCategoryMutation,
  useRestoreCategoryMutation,
} from '../../api/categories.queries';

// ----------------------------------------------------------------------

type ActiveFilter = 'active' | 'inactive';

export function CategoriesListView() {
  const router = useRouter();
  const [filter, setFilter] = useState<ActiveFilter>('active');
  const { flat, data, tree, isLoading, isError, error, refetch } = useCategoriesQuery({
    isActive: filter === 'active',
  });
  const deactivateMutation = useDeleteCategoryMutation();
  const restoreMutation = useRestoreCategoryMutation();
  const [toDeactivate, setToDeactivate] = useState<{ id: string; name: string } | null>(null);
  const [toRestore, setToRestore] = useState<{ id: string; name: string } | null>(null);
  const [treeFocusId, setTreeFocusId] = useState<string | null>(null);

  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    (data ?? []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [data]);

  const confirmDeactivate = async () => {
    if (!toDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(toDeactivate.id);
      toast.success(`Categoría "${toDeactivate.name}" inactivada`);
      setToDeactivate(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const confirmRestore = async () => {
    if (!toRestore) return;
    try {
      await restoreMutation.mutateAsync(toRestore.id);
      toast.success(`Categoría "${toRestore.name}" reactivada`);
      setToRestore(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<Category>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 2,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Typography
            variant="subtitle2"
            sx={{
              color: 'primary.main',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={() => setTreeFocusId(row.id)}
          >
            {row.name}
          </Typography>
        ),
      },
      {
        field: 'parentId',
        headerName: 'Padre',
        flex: 2,
        minWidth: 200,
        valueFormatter: (value: string | null) =>
          value ? parentNameById.get(value) ?? value : '—',
        sortComparator: (a, b) =>
          (parentNameById.get(a ?? '') ?? '').localeCompare(parentNameById.get(b ?? '') ?? ''),
      },
      {
        field: 'code',
        headerName: 'Código',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null) => value ?? '—',
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'isPharmaceutical',
        headerName: 'Farmacéutico',
        type: 'boolean',
        flex: 1,
        minWidth: 140,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 130,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) =>
          row.isActive ? (
            <>
              <Tooltip title="Editar">
                <IconButton
                  onClick={() => router.push(paths.dashboard.catalog.categories.edit(row.id))}
                >
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Inactivar">
                <IconButton
                  color="warning"
                  onClick={() => setToDeactivate({ id: row.id, name: row.name })}
                >
                  <Iconify icon="solar:forbidden-circle-bold" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Reactivar">
              <IconButton
                color="success"
                onClick={() => setToRestore({ id: row.id, name: row.name })}
              >
                <Iconify icon="solar:restart-bold" />
              </IconButton>
            </Tooltip>
          ),
      },
    ],
    [router, parentNameById]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Categorías"
        subtitle="Estructura jerárquica del catálogo de productos."
        crumbs={[{ label: 'Catálogo' }, { label: 'Categorías' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.catalog.categories.new)}
          >
            Nueva categoría
          </Button>
        }
      />

      <Card>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <ToggleButtonGroup
            value={filter}
            exclusive
            size="small"
            onChange={(_, value: ActiveFilter | null) => value && setFilter(value)}
          >
            <ToggleButton value="active">Activas</ToggleButton>
            <ToggleButton value="inactive">Inactivas</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {isError && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Reintentar
                </Button>
              }
            >
              {(error as Error)?.message ?? 'Error al cargar categorías'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={flat}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>

      <CategoryTreeDialog
        open={treeFocusId !== null}
        onClose={() => setTreeFocusId(null)}
        tree={tree}
        focusId={treeFocusId}
      />

      <ConfirmDialog
        open={!!toDeactivate}
        title="Inactivar categoría"
        description={
          toDeactivate ? (
            <>
              ¿Inactivar la categoría <strong>{toDeactivate.name}</strong>? Si tiene
              subcategorías o productos activos, la operación será rechazada.
            </>
          ) : null
        }
        confirmLabel="Inactivar"
        loading={deactivateMutation.isPending}
        onConfirm={confirmDeactivate}
        onClose={() => setToDeactivate(null)}
      />

      <ConfirmDialog
        open={!!toRestore}
        title="Reactivar categoría"
        description={
          toRestore ? (
            <>
              ¿Reactivar la categoría <strong>{toRestore.name}</strong>?
            </>
          ) : null
        }
        confirmLabel="Reactivar"
        loading={restoreMutation.isPending}
        onConfirm={confirmRestore}
        onClose={() => setToRestore(null)}
      />
    </Container>
  );
}
