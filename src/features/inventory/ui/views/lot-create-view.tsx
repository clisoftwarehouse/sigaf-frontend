import type { CreateLotPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { LotCreateForm } from '../components/lot-create-form';
import { useCreateLotMutation } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

export function LotCreateView() {
  const router = useRouter();
  const mutation = useCreateLotMutation();

  const handleSubmit = async (payload: CreateLotPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Lote "${created.lotNumber}" creado`);
      router.push(paths.dashboard.inventory.stock);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo lote de inventario</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Se creará el lote y se registrará automáticamente en el kardex como entrada.
        </Typography>
      </Box>

      <LotCreateForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.inventory.stock)}
      />
    </Container>
  );
}
