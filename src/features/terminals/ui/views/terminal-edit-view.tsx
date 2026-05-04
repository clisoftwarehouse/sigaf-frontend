import type { CreateTerminalPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { TerminalForm } from '../components/terminal-form';
import { useTerminalQuery, useUpdateTerminalMutation } from '../../api/terminals.queries';

// ----------------------------------------------------------------------

export function TerminalEditView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: terminal, isLoading, isError, error } = useTerminalQuery(id);
  const mutation = useUpdateTerminalMutation();

  const handleSubmit = async (payload: CreateTerminalPayload) => {
    if (!id) return;
    try {
      const updated = await mutation.mutateAsync({ id, payload });
      toast.success(`Terminal "${updated.code}" actualizado`);
      router.push(paths.dashboard.organization.terminals.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar terminal POS</Typography>
        {terminal && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {terminal.code} — {terminal.name ?? 'sin nombre'}
          </Typography>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {terminal && (
        <TerminalForm
          current={terminal}
          submitting={mutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push(paths.dashboard.organization.terminals.root)}
        />
      )}
    </Container>
  );
}
