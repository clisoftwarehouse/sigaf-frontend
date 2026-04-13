import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import TableContainer from '@mui/material/TableContainer';

import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { TableSkeleton } from '@/shared/ui/table-skeleton';

import { usePermissionsQuery } from '../../api/permissions.queries';

// ----------------------------------------------------------------------

export function PermissionsListView() {
  const [moduleFilter, setModuleFilter] = useState<string>('');

  // Always fetch all permissions so we can derive the module list locally.
  const { data: all = [], isLoading, isError, error, refetch } = usePermissionsQuery();

  const modules = useMemo(() => {
    const set = new Set<string>();
    all.forEach((p) => set.add(p.module));
    return Array.from(set).sort();
  }, [all]);

  const items = useMemo(
    () => (moduleFilter ? all.filter((p) => p.module === moduleFilter) : all),
    [all, moduleFilter]
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Permisos"
        subtitle="Catálogo de permisos granulares asignables a roles desde el backend."
        crumbs={[{ label: 'Administración' }, { label: 'Permisos' }]}
      />

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <TextField
            select
            label="Filtrar por módulo"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos los módulos</MenuItem>
            {modules.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
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
              {(error as Error)?.message ?? 'Error al cargar permisos'}
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Módulo</TableCell>
                <TableCell>Descripción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={6} columns={3} />}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState icon="inbox" title="Sin permisos" description="No hay permisos registrados." />
                  </TableCell>
                </TableRow>
              )}

              {items.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{p.code}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{p.module}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{p.description ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
}
