import type { GridColDef } from '@mui/x-data-grid';
import type { Role } from '../../model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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

import { useRolesQuery } from '../../api/roles.queries';

// ----------------------------------------------------------------------

export function RolesListView() {
  const router = useRouter();
  const { data: roles = [], isLoading, isError, error, refetch } = useRolesQuery();

  const columns = useMemo<GridColDef<Role>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 1,
        minWidth: 180,
        renderCell: ({ row }) => (
          <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
            {row.name ?? '—'}
          </Typography>
        ),
      },
      {
        field: 'description',
        headerName: 'Descripción',
        flex: 2,
        minWidth: 240,
        valueGetter: (value: string | null | undefined) => value ?? '—',
      },
      {
        field: 'permissions',
        headerName: 'Permisos',
        flex: 1,
        minWidth: 140,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
            <Chip size="small" variant="outlined" label={row.permissions?.length ?? 0} />
          </Stack>
        ),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Tooltip title="Editar">
            <IconButton onClick={() => router.push(paths.dashboard.admin.roles.edit(row.id))}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [router]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Roles"
        subtitle="Los roles controlan el acceso a los módulos mediante permisos granulares."
        crumbs={[{ label: 'Administración' }, { label: 'Roles' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.admin.roles.new)}
          >
            Nuevo rol
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
              {(error as Error)?.message ?? 'Error al cargar roles'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={roles}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
