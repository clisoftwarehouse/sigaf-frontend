import type { UpdateLotPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { LotEditForm } from '../components/lot-edit-form';
import { ExpirySignalChip } from '../components/expiry-signal-chip';
import { useLotQuery, useUpdateLotMutation } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

export function LotEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: lot, isLoading, isError, error } = useLotQuery(id);
  const mutation = useUpdateLotMutation();

  const handleSubmit = async (payload: UpdateLotPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Lote "${updated.lotNumber}" actualizado`);
      router.push(paths.dashboard.inventory.lots.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar lote</Typography>
        {lot && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {lot.lotNumber} · vence {lot.expirationDate}
            </Typography>
            <ExpirySignalChip signal={lot.expirySignal} />
          </Stack>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {lot && (
        <LotEditForm
          current={lot}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.inventory.lots.root)}
        />
      )}
    </Container>
  );
}
