import { toast } from 'sonner';
import { useState } from 'react';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  usePrescriptionQuery,
  useCancelPrescriptionMutation,
} from '../../api/prescriptions.queries';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'info' | 'default' | 'error'> = {
  active: 'success',
  partially_dispensed: 'warning',
  fully_dispensed: 'info',
  expired: 'default',
  cancelled: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  partially_dispensed: 'Parcial',
  fully_dispensed: 'Dispensado',
  expired: 'Vencido',
  cancelled: 'Anulado',
};

export function PrescriptionDetailView() {
  const router = useRouter();
  const { id } = useParams();
  const { data: prescription, isLoading, isError, error } = usePrescriptionQuery(id);
  const cancelMutation = useCancelPrescriptionMutation();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !prescription) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 4 }}>
          {(error as Error)?.message ?? 'Récipe no encontrado'}
        </Alert>
      </Container>
    );
  }

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success('Récipe anulado');
      setConfirmCancel(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const canCancel =
    prescription.status === 'active' || prescription.status === 'partially_dispensed';

  return (
    <Container maxWidth="xl">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h4">Récipe</Typography>
            <Chip
              size="small"
              color={STATUS_COLOR[prescription.status] ?? 'default'}
              label={STATUS_LABEL[prescription.status] ?? prescription.status}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Emitido {new Date(prescription.issuedAt).toLocaleString()}{' '}
            {prescription.expiresAt &&
              `· vence ${new Date(prescription.expiresAt).toLocaleDateString()}`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => router.push(paths.dashboard.pos.prescriptions.root)}
            startIcon={<Iconify icon="solar:multiple-forward-left-broken" />}
          >
            Volver
          </Button>
          {canCancel && (
            <Button
              color="error"
              variant="outlined"
              startIcon={<Iconify icon="solar:forbidden-circle-bold" />}
              onClick={() => setConfirmCancel(true)}
            >
              Anular récipe
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Cliente
          </Typography>
          {prescription.customer ? (
            <>
              <Typography variant="subtitle1">{prescription.customer.fullName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {prescription.customer.documentType}-{prescription.customer.documentNumber}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          )}
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Médico
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Nombre
              </Typography>
              <Typography variant="body1">{prescription.doctorName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Cédula / MPPS
              </Typography>
              <Typography variant="body1">{prescription.doctorIdNumber ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Nº récipe
              </Typography>
              <Typography variant="body1">{prescription.prescriptionNumber ?? '—'}</Typography>
            </Box>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Items
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Prescrito</TableCell>
                <TableCell align="right">Dispensado</TableCell>
                <TableCell align="right">Restante</TableCell>
                <TableCell>Posología</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prescription.items?.map((item) => {
                const prescribed = Number(item.quantityPrescribed);
                const dispensed = Number(item.quantityDispensed);
                const remaining = Math.max(0, prescribed - dispensed);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {item.product?.shortName ?? item.product?.description ?? item.productId}
                      </Typography>
                      {item.product?.ean && (
                        <Typography variant="caption" color="text.secondary">
                          {item.product.ean}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{prescribed}</TableCell>
                    <TableCell align="right">{dispensed}</TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={remaining}
                        color={remaining === 0 ? 'default' : 'success'}
                      />
                    </TableCell>
                    <TableCell>{item.posology ?? '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {prescription.notes && (
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Notas
            </Typography>
            <Typography variant="body2">{prescription.notes}</Typography>
          </Card>
        )}
      </Stack>

      <Divider sx={{ my: 4 }} />

      <ConfirmDialog
        open={confirmCancel}
        title="Anular récipe"
        description="Esta acción es irreversible. ¿Continuar?"
        confirmLabel="Anular"
        loading={cancelMutation.isPending}
        onConfirm={handleCancel}
        onClose={() => setConfirmCancel(false)}
      />
    </Container>
  );
}
