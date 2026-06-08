import type { CreateWarehousePayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { WarehouseForm } from '../components/warehouse-form';
import { useWarehouseQuery, useUpdateWarehouseMutation } from '../../api/warehouses.queries';

// ----------------------------------------------------------------------

export function WarehouseEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: warehouse, isLoading, isError, error } = useWarehouseQuery(id);
  const mutation = useUpdateWarehouseMutation();

  const handleSubmit = async (payload: CreateWarehousePayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Almacén "${updated.name ?? updated.locationCode}" actualizado`);
      router.push(paths.dashboard.organization.warehouses.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar almacén</Typography>
        {warehouse && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {warehouse.name ?? warehouse.locationCode}
          </Typography>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {warehouse && (
        <WarehouseForm
          current={warehouse}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.organization.warehouses.root)}
        />
      )}
    </Container>
  );
}
