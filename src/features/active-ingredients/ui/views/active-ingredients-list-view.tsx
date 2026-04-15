import type { GridColDef } from '@mui/x-data-grid';
import type { ActiveIngredient } from '../../model/types';

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

import {
  useActiveIngredientsQuery,
  useDeleteActiveIngredientMutation,
} from '../../api/active-ingredients.queries';

// ----------------------------------------------------------------------

export function ActiveIngredientsListView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useActiveIngredientsQuery({});
  const deleteMutation = useDeleteActiveIngredientMutation();

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Principio activo "${toDelete.name}" eliminado`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<ActiveIngredient>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 2,
        minWidth: 220,
        renderCell: ({ row }) => <Typography variant="subtitle2">{row.name}</Typography>,
      },
      {
        field: 'therapeuticGroup',
        headerName: 'Grupo terapéutico',
        flex: 2,
        minWidth: 220,
        valueGetter: (value: string | null) => value ?? '—',
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
                onClick={() =>
                  router.push(paths.dashboard.catalog.activeIngredients.edit(row.id))
                }
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
    [router]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Principios activos"
        subtitle="Usados para sustitución de medicamentos genéricos."
        crumbs={[{ label: 'Catálogo' }, { label: 'Principios activos' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.catalog.activeIngredients.new)}
          >
            Nuevo principio activo
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
              {(error as Error)?.message ?? 'Error al cargar'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={items}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar principio activo"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar <strong>{toDelete.name}</strong>?
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
