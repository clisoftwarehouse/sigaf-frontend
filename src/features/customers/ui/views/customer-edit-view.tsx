import type { UpdateCustomerPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';

import { CustomerForm } from '../components/customer-form';
import {
  useCustomerQuery,
  useUpdateCustomerMutation,
} from '../../api/customers.queries';

// ----------------------------------------------------------------------

export function CustomerEditView() {
  const router = useRouter();
  const { id } = useParams();
  const { data: customer, isLoading, isError, error } = useCustomerQuery(id);
  const mutation = useUpdateCustomerMutation();

  const handleSubmit = async (payload: UpdateCustomerPayload) => {
    if (!id) return;
    try {
      await mutation.mutateAsync({ id, payload });
      toast.success(`Cliente actualizado`);
      router.push(paths.dashboard.pos.customers.root);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !customer) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 4 }}>
          {(error as Error)?.message ?? 'Cliente no encontrado'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Editar cliente</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {customer.documentType}-{customer.documentNumber} · {customer.fullName}
        </Typography>
      </Box>

      <CustomerForm
        current={customer}
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(paths.dashboard.pos.customers.root)}
      />
    </Container>
  );
}
