import type { CreateWarehousePayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { WarehouseForm } from '../components/warehouse-form';
import { useCreateWarehouseMutation } from '../../api/warehouses.queries';

// ----------------------------------------------------------------------

export function WarehouseCreateView() {
  const router = useRouter();
  const mutation = useCreateWarehouseMutation();

  const handleSubmit = async (payload: CreateWarehousePayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Almacén "${created.name ?? created.locationCode}" creado`);
      router.push(paths.dashboard.organization.warehouses.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo almacén</Typography>
      </Box>

      <WarehouseForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.organization.warehouses.root)}
      />
    </Container>
  );
}
