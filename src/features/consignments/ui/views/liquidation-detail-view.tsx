import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
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
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';

import { LIQUIDATION_STATUS_COLOR } from '../../model/constants';
import {
  useLiquidationQuery,
  useApproveLiquidationMutation,
} from '../../api/consignments.queries';

// ----------------------------------------------------------------------

export function LiquidationDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: liquidation, isLoading, isError, error } = useLiquidationQuery(id);
  const approveMutation = useApproveLiquidationMutation();

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Liquidación aprobada');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const isDraft = liquidation?.status === 'draft';

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Liquidación"
        subtitle={
          liquidation ? `${liquidation.periodStart} → ${liquidation.periodEnd}` : undefined
        }
        crumbs={[
          { label: 'Consignaciones' },
          { label: 'Liquidaciones' },
          { label: 'Detalle' },
        ]}
        action={
          isDraft && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              loading={approveMutation.isPending}
              onClick={handleApprove}
            >
              Aprobar
            </Button>
          )
        }
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {liquidation && (
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
                    color={LIQUIDATION_STATUS_COLOR[liquidation.status]}
                    label={liquidation.status}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Ventas totales
                </Typography>
                <Typography variant="h5">
                  ${(Number(liquidation.totalSales) || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Comisión
                </Typography>
                <Typography variant="h5" sx={{ color: 'success.main' }}>
                  ${(Number(liquidation.totalCommission) || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  A pagar al proveedor
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${(Number(liquidation.totalSupplier) || 0).toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </Card>

          <Card>
            <Typography variant="subtitle2" sx={{ p: 2.5, color: 'text.secondary' }}>
              Detalle por ítem ({liquidation.items?.length ?? 0})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ítem ID</TableCell>
                    <TableCell align="right">Cantidad vendida</TableCell>
                    <TableCell align="right">Ventas</TableCell>
                    <TableCell align="right">Comisión</TableCell>
                    <TableCell align="right">Proveedor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {liquidation.items?.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {i.consignmentItemId.slice(0, 8)}
                      </TableCell>
                      <TableCell align="right">{Number(i.quantitySold) || 0}</TableCell>
                      <TableCell align="right">
                        ${(Number(i.totalSales) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        ${(Number(i.commissionAmount) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ${(Number(i.supplierAmount) || 0).toFixed(2)}
                      </TableCell>
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
