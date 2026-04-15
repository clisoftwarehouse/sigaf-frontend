import type { GridColDef } from '@mui/x-data-grid';
import type { Category } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import { CategoryTreeDialog } from '../components/category-tree-dialog';
import { useCategoriesQuery, useDeleteCategoryMutation } from '../../api/categories.queries';

// ----------------------------------------------------------------------

export function CategoriesListView() {
  const router = useRouter();
  const { flat, data, tree, isLoading, isError, error, refetch } = useCategoriesQuery();
  const deleteMutation = useDeleteCategoryMutation();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const [treeFocusId, setTreeFocusId] = useState<string | null>(null);

  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    (data ?? []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [data]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Categoría "${toDelete.name}" eliminada`);
      setToDelete(null);
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
        field: 'isActive',
        headerName: 'Activo',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 110,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <>
            <Tooltip title="Editar">
              <IconButton
                onClick={() => router.push(paths.dashboard.catalog.categories.edit(row.id))}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton
                color="error"
                onClick={() => setToDelete({ id: row.id, name: row.name })}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </>
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
        open={!!toDelete}
        title="Eliminar categoría"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar la categoría <strong>{toDelete.name}</strong>? Si tiene
              subcategorías o productos, la operación puede fallar.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Container>
  );
}
