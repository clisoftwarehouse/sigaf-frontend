import type { GridColDef } from '@mui/x-data-grid';
import type { BranchGroup } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  useBranchGroupsQuery,
  useCreateBranchGroupMutation,
  useDeleteBranchGroupMutation,
} from '../../api/branch-groups.queries';

// ----------------------------------------------------------------------

export function BranchGroupsListView() {
  const router = useRouter();
  const { data: groups = [], isLoading, isError, error, refetch } = useBranchGroupsQuery();
  const createMutation = useCreateBranchGroupMutation();
  const deleteMutation = useDeleteBranchGroupMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [toDelete, setToDelete] = useState<BranchGroup | null>(null);

  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error('El nombre del grupo es obligatorio');
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
      });
      toast.success(`Grupo "${created.name}" creado`);
      setCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      router.push(paths.dashboard.organization.branchGroups.edit(created.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Grupo "${toDelete.name}" eliminado`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<BranchGroup>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Grupo',
        flex: 2,
        minWidth: 240,
        renderCell: ({ row }) => (
          <Stack>
            <Typography variant="subtitle2">{row.name}</Typography>
            {row.description && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {row.description}
              </Typography>
            )}
          </Stack>
        ),
      },
      {
        field: 'branchCount',
        headerName: 'Sucursales',
        flex: 1,
        minWidth: 110,
        align: 'center',
        headerAlign: 'center',
        sortComparator: (a, b) => Number(a) - Number(b),
        valueGetter: (value: number | undefined) => value ?? 0,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            variant="outlined"
            color={Number(value) > 0 ? 'info' : 'default'}
            label={`${value} sucursal${Number(value) === 1 ? '' : 'es'}`}
          />
        ),
      },
      {
        field: 'isActive',
        headerName: 'Estado',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
        renderCell: ({ row }) =>
          row.isActive ? (
            <Chip size="small" color="success" variant="outlined" label="Activo" />
          ) : (
            <Chip size="small" color="default" variant="outlined" label="Inactivo" />
          ),
      },
      {
        field: 'createdAt',
        headerName: 'Creado',
        type: 'dateTime',
        flex: 1,
        minWidth: 160,
        valueGetter: (value: string) => new Date(value),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 130,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <>
            <Tooltip title="Configurar">
              <IconButton
                onClick={() => router.push(paths.dashboard.organization.branchGroups.edit(row.id))}
              >
                <Iconify icon="solar:settings-bold" />
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
    [router]
  );

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Grupos de sucursales"
        subtitle="Agrupaciones de sucursales con su propia matriz de aprobación de OCs."
        crumbs={[{ label: 'Organización' }, { label: 'Grupos' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo grupo
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
            rows={groups}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo grupo</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Nombre"
              placeholder="Ej. Caracas premium"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="Descripción (opcional)"
              placeholder="Ej. Sucursales con flujo de aprobación más estricto"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              multiline
              minRows={2}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Después de crearlo, configura la matriz de aprobación y asigna sucursales.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button variant="contained" loading={createMutation.isPending} onClick={handleCreate}>
            Crear y configurar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar grupo"
        description={
          toDelete ? (
            <>
              ¿Eliminar el grupo <strong>{toDelete.name}</strong>? Solo se permite si no tiene
              sucursales asignadas.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Container>
  );
}
