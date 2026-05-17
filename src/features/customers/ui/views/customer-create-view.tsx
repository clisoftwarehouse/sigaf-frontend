import type { CreateCustomerPayload } from '../../model/types';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { CustomerForm } from '../components/customer-form';
import { useCreateCustomerMutation } from '../../api/customers.queries';

// ----------------------------------------------------------------------

export function CustomerCreateView() {
  const router = useRouter();
  const mutation = useCreateCustomerMutation();

  const handleSubmit = async (payload: CreateCustomerPayload) => {
    try {
      const created = await mutation.mutateAsync(payload);
      toast.success(`Cliente "${created.fullName}" creado`);
      router.push(paths.dashboard.pos.customers.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Nuevo cliente</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Cliente B2C/B2B de la farmacia.
        </Typography>
      </Box>

      <CustomerForm
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.pos.customers.root)}
      />
    </Container>
  );
}
