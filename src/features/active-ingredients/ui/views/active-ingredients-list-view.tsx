import type { GridColDef } from '@mui/x-data-grid';
import type { ActiveIngredient } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
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

import { VademecumSearchDialog } from '../components/vademecum-search-dialog';
import {
  useActiveIngredientsQuery,
  useDeleteActiveIngredientMutation,
} from '../../api/active-ingredients.queries';

// ----------------------------------------------------------------------

export function ActiveIngredientsListView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const [vademecumOpen, setVademecumOpen] = useState(false);

  const { data: items = [], isLoading, isError, error, refetch } = useActiveIngredientsQuery({});
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
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="subtitle2">{row.name}</Typography>
            {row.innName && (
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                INN: {row.innName}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'atcCode',
        headerName: 'Código ATC',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) =>
          row.atcCode ? (
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {row.atcCode}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              —
            </Typography>
          ),
      },
      {
        field: 'therapeuticUse',
        headerName: 'Acción terapéutica',
        flex: 2,
        minWidth: 220,
        sortable: false,
        valueGetter: (_v, row) => row.therapeuticUse?.name ?? '—',
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
                onClick={() => router.push(paths.dashboard.catalog.activeIngredients.edit(row.id))}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton color="error" onClick={() => setToDelete({ id: row.id, name: row.name })}>
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={() => setVademecumOpen(true)}
            >
              Importar desde Vademecum
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => router.push(paths.dashboard.catalog.activeIngredients.new)}
            >
              Nuevo principio activo
            </Button>
          </Stack>
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

      <VademecumSearchDialog
        open={vademecumOpen}
        mode="import"
        onClose={() => setVademecumOpen(false)}
        onImported={() => setVademecumOpen(false)}
      />
    </Container>
  );
}
