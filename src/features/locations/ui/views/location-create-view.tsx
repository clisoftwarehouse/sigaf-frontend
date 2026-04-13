import type { CreateLocationPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { LocationForm } from '../components/location-form';
import { useCreateLocationMutation } from '../../api/locations.queries';

// ----------------------------------------------------------------------

export function LocationCreateView() {
  const router = useRouter();
  const mutation = useCreateLocationMutation();

  const handleSubmit = async (payload: CreateLocationPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Ubicación "${created.locationCode}" creada`);
      router.push(paths.dashboard.organization.locations.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nueva ubicación</Typography>
      </Box>

      <LocationForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.organization.locations.root)}
      />
    </Container>
  );
}
