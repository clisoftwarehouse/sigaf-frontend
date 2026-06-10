import Container from '@mui/material/Container';

import { PageHeader } from '@/shared/ui/page-header';

import { AccountsPayableListView } from '../views/accounts-payable-list-view';

export default function AccountsPayablePage() {
  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Cuentas por pagar"
        subtitle="Cuentas con proveedores. Se crean automáticamente al aprobar recepciones."
        crumbs={[{ label: 'Compras' }, { label: 'Cuentas por pagar' }]}
      />
      <AccountsPayableListView />
    </Container>
  );
}
