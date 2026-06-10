import Container from '@mui/material/Container';

import { PageHeader } from '@/shared/ui/page-header';

import { PrescribersListView } from '../views/prescribers-list-view';

export default function PrescribersPage() {
  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Médicos"
        subtitle="Catálogo de médicos prescriptores. Se usa al cargar récipes."
        crumbs={[{ label: 'POS' }, { label: 'Médicos' }]}
      />
      <PrescribersListView />
    </Container>
  );
}
