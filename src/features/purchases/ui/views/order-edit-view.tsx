import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';

import { OrderCreateView } from './order-create-view';
import { useOrderQuery } from '../../api/purchases.queries';

/**
 * Vista de edición de una OC. Reutiliza OrderCreateView pasándole la OC
 * cargada como `editingOrder`. El backend solo permite la modificación de
 * items cuando la OC está en estado 'draft' — el frontend bloquea el
 * acceso si no lo está.
 */
export function OrderEditView() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error } = useOrderQuery(id);

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !order) {
    return (
      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Alert severity="error">{(error as Error)?.message ?? 'Orden no encontrada.'}</Alert>
      </Container>
    );
  }

  if (order.status !== 'draft') {
    return (
      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Alert severity="warning">
          Solo se pueden editar órdenes en estado borrador. Esta OC está en estado{' '}
          <strong>{order.status}</strong>.
        </Alert>
      </Container>
    );
  }

  return <OrderCreateView editingOrder={order} />;
}
