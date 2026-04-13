import type { CreateTerminalPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { TerminalForm } from '../components/terminal-form';
import { useCreateTerminalMutation } from '../../api/terminals.queries';

// ----------------------------------------------------------------------

export function TerminalCreateView() {
  const router = useRouter();
  const mutation = useCreateTerminalMutation();

  const handleSubmit = async (payload: CreateTerminalPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Terminal "${created.code}" creado`);
      router.push(paths.dashboard.organization.terminals.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo terminal POS</Typography>
      </Box>

      <TerminalForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.organization.terminals.root)}
      />
    </Container>
  );
}
