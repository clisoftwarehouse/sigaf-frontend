import type { CreateBrandPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { BrandForm } from '../components/brand-form';
import { useCreateBrandMutation } from '../../api/brands.queries';

// ----------------------------------------------------------------------

export function BrandCreateView() {
  const router = useRouter();
  const mutation = useCreateBrandMutation();

  const handleSubmit = async (payload: CreateBrandPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Marca "${created.name}" creada`);
      router.push(paths.dashboard.catalog.brands.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nueva marca</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Registra una marca o laboratorio farmacéutico.
        </Typography>
      </Box>

      <BrandForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.catalog.brands.root)}
      />
    </Container>
  );
}
