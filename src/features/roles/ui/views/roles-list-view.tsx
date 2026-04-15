import type { GridColDef } from '@mui/x-data-grid';
import type { Role } from '../../model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';

import { useRolesQuery } from '../../api/roles.queries';

// ----------------------------------------------------------------------

export function RolesListView() {
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
        field: 'id',
        headerName: 'ID',
        flex: 1,
        minWidth: 240,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
            {row.id}
          </Typography>
        ),
      },
    ],
    []
  );

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Roles"
        subtitle="Los roles se definen en el backend y controlan el acceso a los módulos."
        crumbs={[{ label: 'Administración' }, { label: 'Roles' }]}
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
