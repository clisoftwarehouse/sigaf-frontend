import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { PageHeader } from '@/shared/ui/page-header';

import { useEntryQuery } from '../../api/consignments.queries';
import { CONSIGNMENT_STATUS_COLOR } from '../../model/constants';

// ----------------------------------------------------------------------

export function EntryDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: entry, isLoading, isError, error } = useEntryQuery(id);

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Entrada de consignación"
        subtitle={entry ? new Date(entry.createdAt).toLocaleString('es-VE') : undefined}
        crumbs={[{ label: 'Consignaciones' }, { label: 'Entradas' }, { label: 'Detalle' }]}
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {entry && (
        <>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    color={CONSIGNMENT_STATUS_COLOR[entry.status]}
                    label={entry.status}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Comisión pactada
                </Typography>
                <Typography variant="h6">
                  {(Number(entry.commissionPct) || 0).toFixed(2)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Sucursal
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {entry.branchId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Proveedor
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {entry.supplierId}
                </Typography>
              </Box>
            </Stack>
            {entry.notes && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                {entry.notes}
              </Typography>
            )}
          </Card>

          <Card>
            <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
              Ítems ({entry.items?.length ?? 0})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lote</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Restante</TableCell>
                    <TableCell align="right">Costo</TableCell>
                    <TableCell align="right">Precio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entry.items?.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{i.lotNumber}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{i.expirationDate}</TableCell>
                      <TableCell align="right">{Number(i.quantity) || 0}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {Number(i.quantityRemaining) || 0}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>
                        ${(Number(i.costUsd) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">${(Number(i.salePrice) || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Container>
  );
}
