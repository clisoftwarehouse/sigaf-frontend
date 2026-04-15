import type { GridColDef } from '@mui/x-data-grid';
import type { Permission } from '../../model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';

import { usePermissionsQuery } from '../../api/permissions.queries';

// ----------------------------------------------------------------------

export function PermissionsListView() {
  const { data: permissions = [], isLoading, isError, error, refetch } = usePermissionsQuery();

  const moduleOptions = useMemo(
    () => Array.from(new Set(permissions.map((p) => p.module))).sort(),
    [permissions]
  );

  const columns = useMemo<GridColDef<Permission>[]>(
    () => [
      {
        field: 'code',
        headerName: 'Código',
        flex: 2,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.code}
          </Typography>
        ),
      },
      {
        field: 'module',
        headerName: 'Módulo',
        type: 'singleSelect',
        flex: 1,
        minWidth: 180,
        valueOptions: moduleOptions,
      },
      {
        field: 'description',
        headerName: 'Descripción',
        flex: 3,
        minWidth: 260,
        valueGetter: (value: string | null | undefined) => value ?? '—',
      },
    ],
    [moduleOptions]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Permisos"
        subtitle="Catálogo de permisos granulares asignables a roles desde el backend."
        crumbs={[{ label: 'Administración' }, { label: 'Permisos' }]}
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
              {(error as Error)?.message ?? 'Error al cargar permisos'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={permissions}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Container>
  );
}
