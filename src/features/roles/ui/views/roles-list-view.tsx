import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { TableSkeleton } from '@/shared/ui/table-skeleton';

import { useRolesQuery } from '../../api/roles.queries';

// ----------------------------------------------------------------------

export function RolesListView() {
  const { data: roles = [], isLoading, isError, error, refetch } = useRolesQuery();

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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeleton rows={4} columns={3} />}

              {!isLoading && roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ p: 0, borderBottom: 0 }}>
                    <EmptyState icon="inbox" title="Sin roles" description="No hay roles definidos." />
                  </TableCell>
                </TableRow>
              )}

              {roles.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                      {r.name ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{r.description ?? '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                    {r.id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
}
