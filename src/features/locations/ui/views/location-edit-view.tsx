import type { CreateLocationPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { LocationForm } from '../components/location-form';
import { useLocationQuery, useUpdateLocationMutation } from '../../api/locations.queries';

// ----------------------------------------------------------------------

export function LocationEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: location, isLoading, isError, error } = useLocationQuery(id);
  const mutation = useUpdateLocationMutation();

  const handleSubmit = async (payload: CreateLocationPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Ubicación "${updated.locationCode}" actualizada`);
      router.push(paths.dashboard.organization.locations.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar ubicación</Typography>
        {location && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {location.locationCode}
          </Typography>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {location && (
        <LocationForm
          current={location}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.organization.locations.root)}
        />
      )}
    </Container>
  );
}
